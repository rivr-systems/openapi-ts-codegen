export const tryParseInt = (input?: string | null) => {
  if (!input) {
    return null;
  }

  const output = parseInt(input, 10);

  if (Number.isNaN(output)) {
    return null;
  }

  return output;
};
