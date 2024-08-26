const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const getGauss = (x: number, y: number, sigma: number): number => {
  const sigma2: number = sigma * sigma;
  const numerator: number = x * x + y * y;
  const exponent: number = -numerator / (2.0 * sigma2);
  const expValue: number = Math.exp(exponent);
  const result: number = expValue / (2.0 * Math.PI * sigma2);
  return result;
};

export const getGaussianKernel = (
  size: number,
  sigma: number,
  toInt: boolean = false,
): number[] => {
  const kernel: number[] = [];
  const halfSize: number = Math.floor(size / 2);

  for (let i = -halfSize; i <= halfSize; i++) {
    for (let j = -halfSize; j <= halfSize; j++) {
      const gaussianValue: number = getGauss(i, j, sigma);
      kernel.push(gaussianValue);
    }
  }
  let data = kernel;
  if (toInt) {
    data = kernel.map(value => value * 10000); //TODO make it more general to calculate and pass it in as first element of array
  }
  return data;
};