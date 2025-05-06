/**
 * Converts a string to a slug format.
 * Replaces spaces with hyphens and converts to lowercase.
 * @param text The input string.
 * @returns The slugified string.
 */
export const slugify = (text: string): string => {
  if (typeof text !== "string") {
    // console.error('slugify: input is not a string, returning empty string');
    return "" // Or throw an error, depending on desired behavior
  }
  return text
    .toString() // Ensure it's a string
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}
