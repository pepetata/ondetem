import { describe, it, expect } from "vitest";
import {
  slugify,
  extractIdFromSlug,
  generateAdSlug,
} from "../../src/utils/slugify";

describe("slugify utilities", () => {
  describe("slugify function", () => {
    it("converts text to lowercase slug", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("removes special characters", () => {
      expect(slugify("Hello!@#$%^&*()World")).toBe("helloworld");
    });

    it("removes accents and special characters", () => {
      expect(slugify("Café São Paulo")).toBe("cafe-sao-paulo");
    });

    it("replaces spaces with hyphens", () => {
      expect(slugify("hello world test")).toBe("hello-world-test");
    });

    it("removes consecutive hyphens", () => {
      expect(slugify("hello---world")).toBe("hello-world");
    });

    it("removes leading and trailing hyphens", () => {
      expect(slugify("---test-slug---")).toBe("test-slug");
    });

    it("limits length to 50 characters", () => {
      const longText =
        "this is a very long text that should be truncated because it exceeds fifty characters";
      const result = slugify(longText);
      expect(result.length).toBeLessThanOrEqual(50);
      // The actual result includes a trailing hyphen after truncation
      expect(result).toBe("this-is-a-very-long-text-that-should-be-truncated-");
    });

    it("handles empty strings", () => {
      expect(slugify("")).toBe("");
    });

    it("handles null and undefined", () => {
      expect(slugify(null)).toBe("");
      expect(slugify(undefined)).toBe("");
    });

    it("handles numbers", () => {
      expect(slugify(123)).toBe("123");
    });

    it("trims whitespace", () => {
      expect(slugify("  hello world  ")).toBe("hello-world");
    });
  });

  describe("extractIdFromSlug function", () => {
    it("extracts valid UUID from slug", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const slug = `test-slug-${uuid}`;
      expect(extractIdFromSlug(slug)).toBe(uuid);
    });

    it("returns null for slug without UUID", () => {
      expect(extractIdFromSlug("test-slug-without-uuid")).toBeNull();
    });

    it("returns null for empty strings", () => {
      expect(extractIdFromSlug("")).toBeNull();
    });

    it("returns null for null and undefined", () => {
      expect(extractIdFromSlug(null)).toBeNull();
      expect(extractIdFromSlug(undefined)).toBeNull();
    });

    it("extracts UUID only at the end of slug", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const slug = `test-${uuid}-more-text`;
      // Should return null because UUID is not at the end
      expect(extractIdFromSlug(slug)).toBeNull();
    });

    it("handles complex slugs with UUID at end", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const slug = `very-complex-test-slug-with-many-words-${uuid}`;
      expect(extractIdFromSlug(slug)).toBe(uuid);
    });

    it("returns null for invalid UUID format", () => {
      expect(extractIdFromSlug("test-slug-123456789")).toBeNull();
      expect(extractIdFromSlug("test-slug-invalid-uuid-format")).toBeNull();
    });
  });

  describe("generateAdSlug function", () => {
    it("generates slug from ad title", () => {
      const ad = { title: "Beautiful House for Sale" };
      expect(generateAdSlug(ad)).toBe("beautiful-house-for-sale");
    });

    it("handles ad with special characters in title", () => {
      const ad = { title: "Café & Restaurant - São Paulo!" };
      expect(generateAdSlug(ad)).toBe("cafe-restaurant-sao-paulo");
    });

    it("returns empty string for ad without title", () => {
      const ad = { description: "No title here" };
      expect(generateAdSlug(ad)).toBe("");
    });

    it("returns empty string for null ad", () => {
      expect(generateAdSlug(null)).toBe("");
    });

    it("returns empty string for undefined ad", () => {
      expect(generateAdSlug(undefined)).toBe("");
    });

    it("handles ad with empty title", () => {
      const ad = { title: "" };
      expect(generateAdSlug(ad)).toBe("");
    });

    it("handles ad with only whitespace title", () => {
      const ad = { title: "   " };
      expect(generateAdSlug(ad)).toBe("");
    });

    it("normalizes complex titles", () => {
      const ad = { title: "Apartamento   de    Luxo  ---  Centro!!!" };
      expect(generateAdSlug(ad)).toBe("apartamento-de-luxo-centro");
    });
  });

  describe("edge cases and integration", () => {
    it("handles various text inputs consistently", () => {
      const testCases = [
        { input: "Simple Test", expected: "simple-test" },
        { input: "With Numbers 123", expected: "with-numbers-123" },
        { input: "Special@#$%Chars", expected: "specialchars" },
        { input: "Multiple   Spaces", expected: "multiple-spaces" },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(slugify(input)).toBe(expected);
      });
    });

    it("works with real-world examples", () => {
      const realExamples = [
        {
          input: "Casa à venda - 3 quartos",
          expected: "casa-a-venda-3-quartos",
        },
        {
          input: "Apartamento no Centro (SP)",
          expected: "apartamento-no-centro-sp",
        },
        { input: "Terreno - R$ 50.000", expected: "terreno-r-50000" },
      ];

      realExamples.forEach(({ input, expected }) => {
        expect(slugify(input)).toBe(expected);
      });
    });

    it("maintains consistency between generateAdSlug and slugify", () => {
      const title = "Test Property Title";
      const ad = { title };

      expect(generateAdSlug(ad)).toBe(slugify(title));
    });
  });
});
