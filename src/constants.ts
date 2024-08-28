export const CORRECTIONSENUM = {
  brightness: 'brightness' as const,
  contrast: 'contrast' as const,
  gamma: 'gamma' as const,
};

export const PIXELMETHOD = {
  cyclicEdge: 0 as const,
  nullEdge: 1 as const,
  repeatEdge: 2 as const,
};

export const CHANNELNAME: { [key: string]: number } = {
  R: 0,
  G: 1,
  B: 2,
  A: 3,
};

export const CHANNELBYNUMBER = {
  0: 'R' as const,
  1: 'G' as const,
  2: 'B' as const,
  3: 'A' as const,
};

export const OFFSET = {
  sharpen1: 0,
  sharpen2: 0,
  blur: 0,
  emboss: 127,
  emboss_subtle: 0,
  edge_detect: 0,
  edge_detect_2: 0,
};

export const MATRICES = {
  sharpen1: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
  sharpen2: [0, -2, 0, -2, 11, -2, 0, -2, 0],
  blur: [1, 1, 1, 1, 1, 1, 1, 1, 1],
  gaussian_blur: [1, 2, 1, 2, 4, 2, 1, 2, 1],
  linear_blur: [5, 0, 5, 0, 0, 0, -3, 0, -3],
  emboss: [2, 0, 0, 0, -1, 0, 0, 0, -1],
  emboss_subtle: [1, 1, -1, 1, 3, -1, 1, -1, -1],
  edge_roberts_x: [1, 0, 0, -1],
  edge_roberts_y: [0, 1, -1, 0],
  edge_prewitt_x: [-1, 0, 1, -1, 0, 1, -1, 0, 1],
  edge_prewitt_y: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
  edge_sobel_x: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
  edge_sobel_y: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
  laplacian: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
};

export const TRANSFORM = {
  negative: 'negative',
  grayscale: 'grayscale',
  convolve: 'convolve',
  convolveGaussian: 'gaussianBlur',
  edgeDetection: 'edgeDetection',
  edgeDetectionMatrix2: 'edgeDetectionMatrix2',
  edgeDetectionZero: 'edgeDetectionZero',
  edgeDetectionCanny: 'edgeDetectionCanny',
  manualThresholding: 'manualThresholding',
};

export const CONVOLVEOPTIONS = {
  convolve: 0,
  edgeDetection: 1,
  gaussianBlur: 2,
};