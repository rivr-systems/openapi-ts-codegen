export const initCap = (value: string) => {
  return value
    .toLowerCase()
    .replace(/(?:^|\s)[a-z]/g, (m: string) => m.toUpperCase());
};
