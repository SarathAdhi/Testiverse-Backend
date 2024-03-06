export const generateSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\d\s]+/gu, "")
    .replaceAll(" ", "-");
