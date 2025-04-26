/// <reference types="vite/client" />

// Declare modules for markdown files (.mdc)
declare module "*.mdc" {
  // Export the raw markdown content as a string
  export const markdown: string

  // Optionally, declare frontmatter attributes if used
  // const attributes: Record<string, unknown>;

  // Optionally, declare other modes if configured in vite-plugin-markdown
  // const html: string;
  // const toc: { level: string, content: string }[];

  // Export necessary values
  // Only exporting markdown (already exported in line 6)
}
