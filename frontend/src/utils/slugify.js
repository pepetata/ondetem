/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - The text to slugify
 * @returns {string} - The slugified text
 */
export const slugify = (text) => {
  if (!text) return "";

  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      // Remove accents and special characters
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Replace spaces and special characters with hyphens
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      // Remove consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Limit length
      .substring(0, 50)
  );
};

/**
 * Extract ID from a slug URL
 * @param {string} slug - The slug containing the ID
 * @returns {string|null} - The extracted ID or null if not found
 */
export const extractIdFromSlug = (slug) => {
  if (!slug) return null;

  // Look for UUID pattern at the end after a hyphen
  const match = slug.match(
    /-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/
  );
  return match ? match[1] : null;
};

/**
 * Generate a title slug for URLs
 * @param {object} ad - The ad object with title and id
 * @returns {string} - The title slug (without ID)
 */
export const generateAdSlug = (ad) => {
  if (!ad || !ad.title) return "";

  return slugify(ad.title);
};
