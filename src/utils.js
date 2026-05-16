export const noop = () => {};

export const clamp = (number, lower, upper) => {
  if (number <= lower) return lower;
  if (number >= upper) return upper;
  return number;
};
