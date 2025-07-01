const {
  XSSProtection,
  xssLogger,
} = require("../../../src/utils/xssProtection");

// Mock winston logger
jest.mock("winston", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
}));

// Mock DOMPurify
jest.mock("isomorphic-dompurify", () => ({
  sanitize: jest.fn((input, options) => {
    // Simple mock implementation that removes script tags
    return input.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  }),
}));

// Mock validator
jest.mock("validator", () => ({
  isURL: jest.fn((url, options) => {
    const urlPattern = /^https?:\/\//;
    return urlPattern.test(url) || !options.require_protocol;
  }),
}));

const DOMPurify = require("isomorphic-dompurify");
const validator = require("validator");

describe("XSSProtection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("htmlEncode", () => {
    it("should encode HTML entities", () => {
      const input = '<script>alert("XSS")</script>';
      const result = XSSProtection.htmlEncode(input);

      expect(result).toBe(
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;"
      );
    });

    it("should encode all dangerous characters", () => {
      const input = "&<>\"'/";
      const result = XSSProtection.htmlEncode(input);

      expect(result).toBe("&amp;&lt;&gt;&quot;&#x27;&#x2F;");
    });

    it("should return input unchanged for non-strings", () => {
      expect(XSSProtection.htmlEncode(null)).toBe(null);
      expect(XSSProtection.htmlEncode(123)).toBe(123);
      expect(XSSProtection.htmlEncode({})).toEqual({});
    });

    it("should handle empty string", () => {
      expect(XSSProtection.htmlEncode("")).toBe("");
    });
  });

  describe("sanitizeHTML", () => {
    it("should sanitize HTML using DOMPurify", () => {
      const input = '<p>Safe content</p><script>alert("XSS")</script>';
      const expectedOutput = "<p>Safe content</p>";

      DOMPurify.sanitize.mockReturnValue(expectedOutput);

      const result = XSSProtection.sanitizeHTML(input);

      expect(DOMPurify.sanitize).toHaveBeenCalledWith(
        input,
        expect.any(Object)
      );
      expect(result).toBe(expectedOutput);
    });

    it("should log warning when content is sanitized", () => {
      const input = '<p>Safe</p><script>alert("XSS")</script>';
      const sanitized = "<p>Safe</p>";

      DOMPurify.sanitize.mockReturnValue(sanitized);

      XSSProtection.sanitizeHTML(input);

      expect(xssLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "HTML_SANITIZED",
          original: expect.any(String),
          sanitized: expect.any(String),
          timestamp: expect.any(Date),
        })
      );
    });

    it("should handle DOMPurify errors gracefully", () => {
      const input = '<script>alert("XSS")</script>';

      DOMPurify.sanitize.mockImplementation(() => {
        throw new Error("DOMPurify error");
      });

      const result = XSSProtection.sanitizeHTML(input);

      expect(xssLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "HTML_SANITIZATION_ERROR",
          error: "DOMPurify error",
        })
      );
      expect(result).toBe(XSSProtection.htmlEncode(input));
    });

    it("should return input unchanged for non-strings", () => {
      expect(XSSProtection.sanitizeHTML(123)).toBe(123);
      expect(XSSProtection.sanitizeHTML(null)).toBe(null);
    });

    it("should use custom options", () => {
      const input = "<div>Test</div>";
      const customOptions = { ALLOWED_TAGS: ["div"] };

      XSSProtection.sanitizeHTML(input, customOptions);

      expect(DOMPurify.sanitize).toHaveBeenCalledWith(
        input,
        expect.objectContaining(customOptions)
      );
    });
  });

  describe("removeScripts", () => {
    it("should remove script tags", () => {
      const input = 'Safe content <script>alert("XSS")</script> more content';
      const result = XSSProtection.removeScripts(input);

      expect(result).toBe("Safe content  more content");
    });

    it("should remove javascript: URLs", () => {
      const input = "Click <a href=\"javascript:alert('XSS')\">here</a>";
      const result = XSSProtection.removeScripts(input);

      expect(result).toBe("Click <a href=\"removed:alert('XSS')\">here</a>");
    });

    it("should remove event handlers", () => {
      const input =
        '<div onclick="alert(\'XSS\')" onmouseover="evil()">Content</div>';
      const result = XSSProtection.removeScripts(input);

      expect(result).toBe(
        '<div data-removed="alert(\'XSS\')" data-removed="evil()">Content</div>'
      );
    });

    it("should remove expression() calls", () => {
      const input = "style=\"background: expression(alert('XSS'))\"";
      const result = XSSProtection.removeScripts(input);

      expect(result).toBe("style=\"background: removed(alert('XSS'))\"");
    });

    it("should remove vbscript: URLs", () => {
      const input = "<a href=\"vbscript:msgbox('XSS')\">Click</a>";
      const result = XSSProtection.removeScripts(input);

      expect(result).toBe("<a href=\"removed:msgbox('XSS')\">Click</a>");
    });

    it("should neutralize data:text/html", () => {
      const input =
        "<iframe src=\"data:text/html,<script>alert('XSS')</script>\"></iframe>";
      const result = XSSProtection.removeScripts(input);

      expect(result).toContain("data:text/plain");
    });

    it("should log warning when scripts are removed", () => {
      const input = '<script>alert("XSS")</script>';

      XSSProtection.removeScripts(input);

      expect(xssLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SCRIPT_REMOVED",
          original: expect.any(String),
          cleaned: expect.any(String),
          timestamp: expect.any(Date),
        })
      );
    });

    it("should return input unchanged for non-strings", () => {
      expect(XSSProtection.removeScripts(123)).toBe(123);
      expect(XSSProtection.removeScripts(null)).toBe(null);
    });
  });

  describe("sanitizeUserInput", () => {
    it("should sanitize user input with default options", () => {
      const input = '  <script>alert("XSS")</script>  Some   content  ';
      const result = XSSProtection.sanitizeUserInput(input);

      expect(result).toBe(
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt; Some content"
      );
    });

    it("should respect maxLength option", () => {
      const input = "This is a very long string that should be truncated";
      const result = XSSProtection.sanitizeUserInput(input, { maxLength: 10 });

      expect(result).toBe("This is a ");
      expect(result.length).toBe(10);
    });

    it("should preserve line breaks when specified", () => {
      const input = "Line 1\nLine 2\r\nLine 3";
      const result = XSSProtection.sanitizeUserInput(input, {
        preserveLineBreaks: true,
        normalizeWhitespace: true,
      });

      expect(result).toContain("\n");
    });

    it("should return null for empty strings when not allowed", () => {
      const result = XSSProtection.sanitizeUserInput("   ", {
        allowEmptyString: false,
      });

      expect(result).toBe(null);
    });

    it("should allow HTML when specified", () => {
      const input = "<p>Safe paragraph</p>";
      DOMPurify.sanitize.mockReturnValue(input);

      const result = XSSProtection.sanitizeUserInput(input, {
        allowHTML: true,
      });

      expect(DOMPurify.sanitize).toHaveBeenCalled();
      expect(result).toBe(input);
    });

    it("should not strip tags when stripTags is false", () => {
      const input = "<p>Content</p>";
      const result = XSSProtection.sanitizeUserInput(input, {
        stripTags: false,
      });

      // Since allowHTML is false by default, it should still be processed
      expect(result).toBeDefined();
    });
  });

  describe("detectXSSAttempts", () => {
    it("should detect script tags", () => {
      XSSProtection.detectXSSAttempts('<script>alert("XSS")</script>');

      expect(xssLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "XSS_ATTEMPT_DETECTED",
          pattern: expect.stringContaining("script"),
          severity: "HIGH",
        })
      );
    });

    it("should detect javascript: URLs", () => {
      XSSProtection.detectXSSAttempts('javascript:alert("XSS")');

      expect(xssLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "XSS_ATTEMPT_DETECTED",
          pattern: expect.stringContaining("javascript"),
        })
      );
    });

    it("should detect event handlers", () => {
      XSSProtection.detectXSSAttempts('<img onerror="alert(\'XSS\')" src="x">');

      expect(xssLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "XSS_ATTEMPT_DETECTED",
        })
      );
    });

    it("should detect iframe tags", () => {
      XSSProtection.detectXSSAttempts('<iframe src="evil.html"></iframe>');

      expect(xssLogger.error).toHaveBeenCalled();
    });

    it("should detect document.cookie access", () => {
      XSSProtection.detectXSSAttempts("var x = document.cookie;");

      expect(xssLogger.error).toHaveBeenCalled();
    });

    it("should detect eval calls", () => {
      XSSProtection.detectXSSAttempts("eval(\"alert('XSS')\")");

      expect(xssLogger.error).toHaveBeenCalled();
    });

    it("should detect various alert/prompt/confirm patterns", () => {
      const patterns = ['alert("XSS")', 'prompt("Enter")', 'confirm("Sure?")'];

      patterns.forEach((pattern) => {
        jest.clearAllMocks();
        XSSProtection.detectXSSAttempts(pattern);
        expect(xssLogger.error).toHaveBeenCalled();
      });
    });
  });

  describe("sanitizeURL", () => {
    beforeEach(() => {
      validator.isURL.mockReturnValue(true);
    });

    it("should allow safe URLs", () => {
      const safeUrl = "https://example.com/path";
      const result = XSSProtection.sanitizeURL(safeUrl);

      expect(result).toBe(safeUrl);
    });

    it("should block javascript: URLs", () => {
      const dangerousUrl = 'javascript:alert("XSS")';
      const result = XSSProtection.sanitizeURL(dangerousUrl);

      expect(result).toBe(null);
      expect(xssLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DANGEROUS_URL_BLOCKED",
          protocol: "javascript:",
        })
      );
    });

    it("should block data:text/html URLs", () => {
      const result = XSSProtection.sanitizeURL(
        'data:text/html,<script>alert("XSS")</script>'
      );

      expect(result).toBe(null);
    });

    it("should block file: URLs", () => {
      const result = XSSProtection.sanitizeURL("file:///etc/passwd");

      expect(result).toBe(null);
    });

    it("should block ftp: URLs", () => {
      const result = XSSProtection.sanitizeURL("ftp://example.com/file");

      expect(result).toBe(null);
    });

    it("should return null for invalid URLs", () => {
      validator.isURL.mockReturnValue(false);
      const result = XSSProtection.sanitizeURL("not-a-url");

      expect(result).toBe(null);
    });

    it("should return null for non-string input", () => {
      expect(XSSProtection.sanitizeURL(123)).toBe(null);
      expect(XSSProtection.sanitizeURL(null)).toBe(null);
    });

    it("should handle URL validation errors", () => {
      validator.isURL.mockImplementation(() => {
        throw new Error("Validation error");
      });

      const result = XSSProtection.sanitizeURL("https://example.com");

      expect(result).toBe(null);
    });
  });

  describe("sanitizeFilename", () => {
    it("should sanitize filename with special characters", () => {
      const filename = "test file!@#$%^&*()_+.jpg";
      const result = XSSProtection.sanitizeFilename(filename);

      expect(result).toBe("test_file_.jpg");
    });

    it("should handle multiple dots", () => {
      const filename = "test...file....jpg";
      const result = XSSProtection.sanitizeFilename(filename);

      expect(result).toBe("test.file.jpg");
    });

    it("should remove leading and trailing dots", () => {
      const filename = "...test.file.jpg...";
      const result = XSSProtection.sanitizeFilename(filename);

      expect(result).toBe("test.file.jpg");
    });

    it("should limit filename length", () => {
      const longFilename = "a".repeat(200) + ".jpg";
      const result = XSSProtection.sanitizeFilename(longFilename);

      expect(result.length).toBeLessThanOrEqual(100);
    });

    it("should return fallback for non-string input", () => {
      expect(XSSProtection.sanitizeFilename(null)).toBe("file");
      expect(XSSProtection.sanitizeFilename(123)).toBe("file");
    });

    it("should return fallback for empty result", () => {
      const result = XSSProtection.sanitizeFilename("...");

      expect(result).toBe("file");
    });
  });

  describe("sanitizeJSON", () => {
    it("should parse and sanitize valid JSON", () => {
      const jsonString =
        '{"name": "<script>alert(\\"XSS\\")</script>", "age": 25}';
      const result = XSSProtection.sanitizeJSON(jsonString);

      expect(result).toBeDefined();
      expect(result.name).toContain("&lt;script&gt;");
      expect(result.age).toBe("25"); // Numbers become strings
    });

    it("should return null for invalid JSON", () => {
      const invalidJson = '{"name": "test", invalid}';
      const result = XSSProtection.sanitizeJSON(invalidJson);

      expect(result).toBe(null);
      expect(xssLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "INVALID_JSON",
          error: expect.any(String),
        })
      );
    });

    it("should handle nested objects", () => {
      const jsonString =
        '{"user": {"name": "<script>", "data": {"value": "test"}}}';
      const result = XSSProtection.sanitizeJSON(jsonString);

      expect(result.user.name).toContain("&lt;script&gt;");
      expect(result.user.data.value).toBe("test");
    });
  });

  describe("sanitizeObject", () => {
    it("should sanitize object properties", () => {
      const obj = {
        name: '<script>alert("XSS")</script>',
        description: "Safe content",
        nested: {
          value: '<img onerror="alert()">',
        },
      };

      const result = XSSProtection.sanitizeObject(obj);

      expect(result.name).toContain("&lt;script&gt;");
      expect(result.description).toBe("Safe content");
      expect(result.nested.value).toContain("&lt;img");
    });

    it("should handle arrays", () => {
      const obj = ["<script>", "safe", { name: "<img>" }];
      const result = XSSProtection.sanitizeObject(obj);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toContain("&lt;script&gt;");
      expect(result[1]).toBe("safe");
      expect(result[2].name).toContain("&lt;img&gt;");
    });

    it("should limit recursion depth", () => {
      const obj = {};
      let current = obj;
      for (let i = 0; i < 15; i++) {
        current.nested = {};
        current = current.nested;
      }
      current.value = "deep";

      const result = XSSProtection.sanitizeObject(obj);

      expect(xssLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DEEP_RECURSION_BLOCKED",
        })
      );
    });

    it("should limit number of properties", () => {
      const obj = {};
      for (let i = 0; i < 60; i++) {
        obj[`prop${i}`] = "value";
      }

      const result = XSSProtection.sanitizeObject(obj);

      expect(Object.keys(result).length).toBeLessThanOrEqual(50);
      expect(xssLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "TOO_MANY_PROPERTIES",
        })
      );
    });

    it("should limit array length", () => {
      const arr = new Array(200).fill("item");
      const result = XSSProtection.sanitizeObject(arr);

      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe("generateCSP", () => {
    it("should generate default CSP", () => {
      const csp = XSSProtection.generateCSP();

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("should allow inline styles when specified", () => {
      const csp = XSSProtection.generateCSP({ allowInlineStyles: true });

      expect(csp).toContain(
        "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'"
      );
    });

    it("should allow inline scripts when specified", () => {
      const csp = XSSProtection.generateCSP({ allowInlineScripts: true });

      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    });

    it("should allow eval when specified", () => {
      const csp = XSSProtection.generateCSP({ allowEval: true });

      expect(csp).toContain("script-src 'self' 'unsafe-eval'");
    });

    it("should include additional sources", () => {
      const additionalSources = {
        "script-src": ["https://cdn.example.com"],
        "img-src": ["https://images.example.com"],
      };

      const csp = XSSProtection.generateCSP({ additionalSources });

      expect(csp).toContain("https://cdn.example.com");
      expect(csp).toContain("https://images.example.com");
    });
  });

  describe("getProtectionStats", () => {
    it("should return protection statistics", () => {
      const stats = XSSProtection.getProtectionStats();

      expect(stats).toHaveProperty("totalAttempts");
      expect(stats).toHaveProperty("blockedToday");
      expect(stats).toHaveProperty("commonPatterns");
      expect(stats).toHaveProperty("lastAttempt");
      expect(Array.isArray(stats.commonPatterns)).toBe(true);
    });
  });
});
