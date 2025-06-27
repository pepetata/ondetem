const {
  isValidUUID,
  isValidEmail,
  isValidInteger,
  sanitizeString,
} = require("../../../src/utils/validation");

describe("Validation Utils", () => {
  describe("isValidUUID", () => {
    it("should return true for valid UUID v4", () => {
      const validUUIDs = [
        "550e8400-e29b-41d4-a716-446655440000",
        "123e4567-e89b-42d3-a456-426614174000",
        "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "a0b1c2d3-e4f5-4789-8123-456789abcdef",
      ];

      validUUIDs.forEach((uuid) => {
        expect(isValidUUID(uuid)).toBe(true);
      });
    });

    it("should return false for invalid UUIDs", () => {
      const invalidUUIDs = [
        "invalid-uuid",
        "123456789012345678901234567890123456", // too long
        "123e4567-e89b-12d3-a456-42661417400", // too short
        "123e4567-e89b-12d3-a456-42661417400g", // invalid character
        "123e4567-e89b-52d3-a456-426614174000", // wrong version (5 instead of 4)
        "",
        null,
        undefined,
        123,
        {},
      ];

      invalidUUIDs.forEach((uuid) => {
        expect(isValidUUID(uuid)).toBe(false);
      });
    });

    it("should return false for non-string input", () => {
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID(undefined)).toBe(false);
      expect(isValidUUID(123)).toBe(false);
      expect(isValidUUID({})).toBe(false);
      expect(isValidUUID([])).toBe(false);
    });
  });

  describe("isValidEmail", () => {
    it("should return true for valid email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+label@example.org",
        "user_name@example-domain.com",
        "123@example.com",
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it("should return false for invalid email addresses", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "test@",
        "test.example.com",
        "test @example.com", // space
        "test@example", // no TLD
        "",
        null,
        undefined,
        123,
        {},
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it("should return false for non-string input", () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
      expect(isValidEmail({})).toBe(false);
      expect(isValidEmail([])).toBe(false);
    });
  });

  describe("isValidInteger", () => {
    it("should return true for valid integer strings", () => {
      const validIntegers = ["0", "1", "123", "9999", "-1", "-123"];

      validIntegers.forEach((str) => {
        expect(isValidInteger(str)).toBe(true);
      });
    });

    it("should return false for invalid integer strings", () => {
      const invalidIntegers = [
        "12.34", // decimal
        "12.0", // decimal
        "abc",
        "12abc",
        "abc12",
        " 123 ", // whitespace
        "1.23e10", // scientific notation
        "",
        null,
        undefined,
        123, // number instead of string
        {},
      ];

      invalidIntegers.forEach((str) => {
        expect(isValidInteger(str)).toBe(false);
      });
    });

    it("should return false for non-string input", () => {
      expect(isValidInteger(null)).toBe(false);
      expect(isValidInteger(undefined)).toBe(false);
      expect(isValidInteger(123)).toBe(false);
      expect(isValidInteger({})).toBe(false);
      expect(isValidInteger([])).toBe(false);
    });
  });

  describe("sanitizeString", () => {
    it("should remove script tags", () => {
      const inputs = [
        '<script>alert("xss")</script>hello',
        'hello<script src="malicious.js"></script>world',
        '<SCRIPT>alert("XSS")</SCRIPT>',
        'before<script type="text/javascript">alert("test")</script>after',
      ];

      inputs.forEach((input) => {
        const result = sanitizeString(input);
        expect(result).not.toContain("<script");
        expect(result).not.toContain("</script>");
      });
    });

    it("should remove control characters", () => {
      const inputWithControlChars = "hello\x00\x01\x02world\x7F";
      const result = sanitizeString(inputWithControlChars);

      expect(result).toBe("helloworld");
      expect(result).not.toMatch(/[\x00-\x1F\x7F]/);
    });

    it("should trim whitespace", () => {
      const inputs = ["  hello world  ", "\t\ntest\t\n", "   spaced   "];

      inputs.forEach((input) => {
        const result = sanitizeString(input);
        expect(result).toBe(input.trim().replace(/[\x00-\x1F\x7F]/g, ""));
      });
    });

    it("should handle non-string input", () => {
      expect(sanitizeString(null)).toBe("");
      expect(sanitizeString(undefined)).toBe("");
      expect(sanitizeString(123)).toBe("");
      expect(sanitizeString({})).toBe("");
      expect(sanitizeString([])).toBe("");
    });

    it("should handle empty string", () => {
      expect(sanitizeString("")).toBe("");
    });

    it("should handle complex malicious input", () => {
      const maliciousInput =
        '<script>alert("xss")</script>\x00\x01hello\x7F   ';
      const result = sanitizeString(maliciousInput);

      expect(result).toBe("hello");
      expect(result).not.toContain("<script");
      expect(result).not.toMatch(/[\x00-\x1F\x7F]/);
    });
  });
});
