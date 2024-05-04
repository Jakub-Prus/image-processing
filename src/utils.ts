const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const getGauss = (x: number, y: number, sigma: number): number => {
  const pi = Math.PI;
  const numerator = 1;
  const denominator = 2 * pi * sigma ** 2;
  const firstFraction = numerator / denominator;

  const exponent = -((x ** 2 + y ** 2) / (2 * sigma ** 2));
  const secondFraction = Math.exp(exponent);

  return firstFraction * secondFraction;
};
