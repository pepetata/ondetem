const { XSSProtection } = require("../../src/utils/xssProtection");

describe("XSS Protection", () => {
  describe("HTML Encoding", () => {
    test("should encode HTML entities", () => {
      const input = '<script>alert("xss")</script>';
      const expected =
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;";
      expect(XSSProtection.htmlEncode(input)).toBe(expected);
    });

    test("should encode special characters", () => {
      const input = "&<>\"'/";
      const expected = "&amp;&lt;&gt;&quot;&#x27;&#x2F;";
      expect(XSSProtection.htmlEncode(input)).toBe(expected);
    });

    test("should handle non-string inputs", () => {
      expect(XSSProtection.htmlEncode(null)).toBe(null);
      expect(XSSProtection.htmlEncode(undefined)).toBe(undefined);
      expect(XSSProtection.htmlEncode(123)).toBe(123);
    });
  });

  describe("Script Removal", () => {
    test("should remove script tags", () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const expected = "Hello  World";
      expect(XSSProtection.removeScripts(input)).toBe(expected);
    });

    test("should remove javascript: URLs", () => {
      const input = 'Click <a href="javascript:alert(1)">here</a>';
      const expected = 'Click <a href="removed:alert(1)">here</a>';
      expect(XSSProtection.removeScripts(input)).toBe(expected);
    });

    test("should remove event handlers", () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const expected = '<div data-removed="alert(1)">Click me</div>';
      expect(XSSProtection.removeScripts(input)).toBe(expected);
    });

    test("should remove vbscript and data URLs", () => {
      const input1 = "vbscript:alert(1)";
      const input2 = "data:text/html,<script>alert(1)</script>";

      expect(XSSProtection.removeScripts(input1)).toBe("removed:alert(1)");
      expect(XSSProtection.removeScripts(input2)).toBe("data:text/plain,"); // Script tag also removed
    });
  });

  describe("User Input Sanitization", () => {
    test("should sanitize malicious input with HTML encoding", () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = XSSProtection.sanitizeUserInput(input, {
        allowHTML: false,
      });

      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
      expect(result).toContain("Hello World");
    });

    test("should respect maxLength option", () => {
      const input = "A very long string that should be truncated";
      const result = XSSProtection.sanitizeUserInput(input, { maxLength: 10 });
      expect(result.length).toBeLessThanOrEqual(10);
    });

    test("should normalize whitespace", () => {
      const input = "Hello    \t\n   World    ";
      const result = XSSProtection.sanitizeUserInput(input, {
        normalizeWhitespace: true,
      });
      expect(result).toBe("Hello World");
    });

    test("should preserve line breaks when specified", () => {
      const input = "Line 1\n\nLine 2";
      const result = XSSProtection.sanitizeUserInput(input, {
        normalizeWhitespace: true,
        preserveLineBreaks: true,
      });
      expect(result).toContain("\n");
    });

    test("should handle empty strings based on allowEmptyString option", () => {
      const input = "   ";

      const result1 = XSSProtection.sanitizeUserInput(input, {
        allowEmptyString: false,
      });
      expect(result1).toBeNull();

      const result2 = XSSProtection.sanitizeUserInput(input, {
        allowEmptyString: true,
      });
      expect(result2).toBe("");
    });
  });

  describe("URL Sanitization", () => {
    test("should allow safe URLs", () => {
      const safeUrls = [
        "https://example.com",
        "http://example.com/path",
        "https://subdomain.example.com",
        "example.com",
        "www.example.com",
      ];

      safeUrls.forEach((url) => {
        expect(XSSProtection.sanitizeURL(url)).toBe(url);
      });
    });

    test("should block dangerous URLs", () => {
      const dangerousUrls = [
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:alert(1)",
        "file:///etc/passwd",
        "ftp://example.com",
      ];

      dangerousUrls.forEach((url) => {
        expect(XSSProtection.sanitizeURL(url)).toBeNull();
      });
    });

    test("should handle invalid URLs", () => {
      const invalidUrls = [
        "not-a-url",
        "http://",
        "https://",
        "",
        null,
        undefined,
      ];

      invalidUrls.forEach((url) => {
        expect(XSSProtection.sanitizeURL(url)).toBeNull();
      });
    });
  });

  describe("Filename Sanitization", () => {
    test("should sanitize malicious filenames", () => {
      const filename = "../../../etc/passwd";
      const result = XSSProtection.sanitizeFilename(filename);

      expect(result).not.toContain("../");
      expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    test("should handle special characters", () => {
      const filename = "file<script>alert(1)</script>.txt";
      const result = XSSProtection.sanitizeFilename(filename);

      expect(result).not.toContain("<script>");
      expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    test("should handle empty or invalid filenames", () => {
      expect(XSSProtection.sanitizeFilename("")).toBe("file");
      expect(XSSProtection.sanitizeFilename(".....")).toBe("file");
      expect(XSSProtection.sanitizeFilename(null)).toBe("file");
      expect(XSSProtection.sanitizeFilename(undefined)).toBe("file");
    });

    test("should limit filename length", () => {
      const longFilename = "a".repeat(200) + ".txt";
      const result = XSSProtection.sanitizeFilename(longFilename);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe("Object Sanitization", () => {
    test("should sanitize nested objects", () => {
      const input = {
        title: '<script>alert("xss")</script>',
        user: {
          name: "<img src=x onerror=alert(1)>",
          email: "user@example.com",
        },
        tags: ["<script>", "normal-tag"],
        count: 42,
      };

      const result = XSSProtection.sanitizeObject(input);

      expect(result.title).not.toContain("<script>");
      expect(result.user.name).not.toContain("onerror");
      expect(result.user.email).toBe("user@example.com");
      expect(result.tags[0]).not.toContain("<script>");
      expect(result.count).toBe("42"); // Numbers converted to strings
    });

    test("should handle arrays", () => {
      const input = [
        "<script>alert(1)</script>",
        "safe content",
        { key: "<img onerror=alert(1)>" },
      ];

      const result = XSSProtection.sanitizeObject(input);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).not.toContain("<script>");
      expect(result[1]).toBe("safe content");
      expect(result[2].key).not.toContain("onerror");
    });

    test("should prevent deep recursion", () => {
      const deepObject = {};
      let current = deepObject;

      // Create deeply nested object
      for (let i = 0; i < 15; i++) {
        current.nested = {};
        current = current.nested;
      }
      current.value = "<script>alert(1)</script>";

      const result = XSSProtection.sanitizeObject(deepObject);
      expect(result).toBeDefined();
      // Should not crash and should limit depth
    });

    test("should limit number of properties", () => {
      const input = {};

      // Create object with many properties
      for (let i = 0; i < 100; i++) {
        input[`prop${i}`] = `value${i}`;
      }

      const result = XSSProtection.sanitizeObject(input);
      expect(Object.keys(result).length).toBeLessThanOrEqual(50);
    });
  });

  describe("JSON Sanitization", () => {
    test("should parse and sanitize valid JSON", () => {
      const jsonString =
        '{"title": "<script>alert(1)</script>", "name": "John"}';
      const result = XSSProtection.sanitizeJSON(jsonString);

      expect(result).toBeDefined();
      expect(result.title).not.toContain("<script>");
      expect(result.name).toBe("John");
    });

    test("should handle invalid JSON", () => {
      const invalidJson = '{"title": "<script>alert(1)</script>", "name":}';
      const result = XSSProtection.sanitizeJSON(invalidJson);

      expect(result).toBeNull();
    });
  });

  describe("CSP Generation", () => {
    test("should generate default CSP", () => {
      const csp = XSSProtection.generateCSP();

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
    });

    test("should generate CSP with inline styles allowed", () => {
      const csp = XSSProtection.generateCSP({ allowInlineStyles: true });

      expect(csp).toContain("style-src 'self'");
      expect(csp).toContain("'unsafe-inline'");
    });

    test("should generate CSP with additional sources", () => {
      const csp = XSSProtection.generateCSP({
        additionalSources: {
          "script-src": ["https://trusted-cdn.com"],
        },
      });

      expect(csp).toContain("https://trusted-cdn.com");
    });
  });
});
