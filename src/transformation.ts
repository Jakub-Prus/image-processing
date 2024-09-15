import Histogram from './histogram';
import MainCanvas from './mainCanvas';
import { PIXELMETHOD } from './constants.ts';

export default class Transformation {
  mainCanvas: MainCanvas;
  ctx: CanvasRenderingContext2D;
  histogram: Histogram;
  canvasWidth: number;
  canvasHeight: number;

  constructor(mainCanvas: any, histogram: any) {
    this.mainCanvas = mainCanvas;
    this.ctx = mainCanvas.ctx;
    this.histogram = histogram;

    this.canvasWidth = this.mainCanvas.canvas.width;
    this.canvasHeight = this.mainCanvas.canvas.height;
  }

  histogramStreching() {
    const isGrayscale = this.mainCanvas.isGrayscale;
    const currentImageData = this.mainCanvas.getImageData();
    const stretchedImgData = new ImageData(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
    );

    if (isGrayscale) {
      const edges = this._findEdgesOfChannel(this.histogram.A);
      for (let i = 0; i < currentImageData.data.length; i += 4) {
        stretchedImgData.data[i] =
          (255 / (edges.max - edges.min)) * (currentImageData.data[i] - edges.min); // Red component
        stretchedImgData.data[i + 1] =
          (255 / (edges.max - edges.min)) * (currentImageData.data[i + 1] - edges.min); // Green component
        stretchedImgData.data[i + 2] =
          (255 / (edges.max - edges.min)) * (currentImageData.data[i + 2] - edges.min); // Blue component
        stretchedImgData.data[i + 3] =
          (255 / (edges.max - edges.min)) * (currentImageData.data[i + 3] - edges.min); // Alpha component
      }
    } else {
      const edgesR = this._findEdgesOfChannel(this.histogram.R);
      const edgesG = this._findEdgesOfChannel(this.histogram.G);
      const edgesB = this._findEdgesOfChannel(this.histogram.B);
      const edgesA = this._findEdgesOfChannel(this.histogram.A);

      for (let i = 0; i < currentImageData.data.length; i += 4) {
        stretchedImgData.data[i] =
          (255 / (edgesR.max - edgesR.min)) * (currentImageData.data[i] - edgesR.min); // Red component
        stretchedImgData.data[i + 1] =
          (255 / (edgesG.max - edgesG.min)) * (currentImageData.data[i + 1] - edgesG.min); // Green component
        stretchedImgData.data[i + 2] =
          (255 / (edgesB.max - edgesB.min)) * (currentImageData.data[i + 2] - edgesB.min); // Blue component
        stretchedImgData.data[i + 3] =
          (255 / (edgesA.max - edgesA.min)) * (currentImageData.data[i + 3] - edgesA.min); // Alpha component
      }
    }

    this.mainCanvas.applyImageDataToCurrentCanvas(stretchedImgData);
    this.histogram.update();
  }

  histogramEqualization() {
    const isGrayscale = this.mainCanvas.isGrayscale;
    const currentImageData = this.ctx.getImageData(
      0,
      0,
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
    );
    const equalizationImgData = new ImageData(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
    );

    if (isGrayscale) {
      const propabilityOfPixelsScaledL = this._calculatePropabilityOfPixelsGrayscale(
        currentImageData.data,
      );

      const distributor = new Array(256).fill(0);
      for (let i = 0; i < propabilityOfPixelsScaledL.length; i++) {
        for (let j = 0; j <= i; j++) {
          distributor[i] += propabilityOfPixelsScaledL[j];
        }
      }

      const distributorScaled = this._scaleNumbersToRange(distributor);
      const distributorScaledNormalized = distributorScaled.map(value => {
        console.log('value', value);
        return Math.floor(value);
      });

      for (let i = 0; i < currentImageData.data.length; i += 4) {
        equalizationImgData.data[i + 0] = distributorScaledNormalized[currentImageData.data[i + 0]]; // Red component
        equalizationImgData.data[i + 1] = distributorScaledNormalized[currentImageData.data[i + 1]]; // Green component
        equalizationImgData.data[i + 2] = distributorScaledNormalized[currentImageData.data[i + 2]]; // Blue component
        equalizationImgData.data[i + 3] = distributorScaledNormalized[currentImageData.data[i + 3]]; // Alpha component
      }
    } else {
      const propabilityTable = this._calculatePropabilityOfPixelsColor(currentImageData.data);

      const distributor = {
        R: new Array(256).fill(0),
        G: new Array(256).fill(0),
        B: new Array(256).fill(0),
        A: new Array(256).fill(0),
      };

      for (let i = 0; i < propabilityTable.R.length; i++) {
        for (let j = 0; j <= i; j++) {
          distributor.R[i] += propabilityTable.R[j];
          distributor.G[i] += propabilityTable.G[j];
          distributor.B[i] += propabilityTable.B[j];
          distributor.A[i] += propabilityTable.A[j];
        }
      }

      const distributorScaled = {
        R: this._scaleNumbersToRange(distributor.R),
        G: this._scaleNumbersToRange(distributor.G),
        B: this._scaleNumbersToRange(distributor.B),
        A: this._scaleNumbersToRange(distributor.A),
      };

      const distributorScaledNormalized = {
        R: distributorScaled.R.map(value => Math.floor(value)),
        G: distributorScaled.G.map(value => Math.floor(value)),
        B: distributorScaled.B.map(value => Math.floor(value)),
        A: distributorScaled.A.map(value => Math.floor(value)),
      };

      for (let i = 0; i < currentImageData.data.length; i += 4) {
        equalizationImgData.data[i + 0] =
          distributorScaledNormalized.R[currentImageData.data[i + 0]]; // Red component
        equalizationImgData.data[i + 1] =
          distributorScaledNormalized.G[currentImageData.data[i + 1]]; // Green component
        equalizationImgData.data[i + 2] =
          distributorScaledNormalized.B[currentImageData.data[i + 2]]; // Blue component
        equalizationImgData.data[i + 3] =
          distributorScaledNormalized.A[currentImageData.data[i + 3]]; // Alpha component
      }
    }

    this.mainCanvas.applyImageDataToCurrentCanvas(equalizationImgData);
    this.histogram.update();
  }

  private _findEdgesOfChannel(channel: number[]) {
    let min = 0;
    let max = 255;
    for (let i = 0; i < 256; i++) {
      if (channel[i] !== 0) {
        min = i;
        break;
      }
    }
    for (let i = 255; i >= 0; i--) {
      if (channel[i] !== 0) {
        max = i;
        break;
      }
    }

    return { min, max };
  }

  private _calculatePropabilityOfPixelsColor(imageDataData: Uint8ClampedArray) {
    let R = new Array(256).fill(0);
    let G = new Array(256).fill(0);
    let B = new Array(256).fill(0);
    let A = new Array(256).fill(0);

    for (let i = 0; i < imageDataData.length; i += 4) {
      R[imageDataData[i]]++;
      G[imageDataData[i + 1]]++;
      B[imageDataData[i + 2]]++;
      A[imageDataData[i + 3]]++;
    }

    return { R, G, B, A };
  }

  private _calculatePropabilityOfPixelsGrayscale(imageDataData: Uint8ClampedArray) {
    let propabilityTableL = new Array(256).fill(0);

    for (let i = 0; i < imageDataData.length; i += 4) {
      propabilityTableL[imageDataData[i]]++;
    }

    return propabilityTableL;
  }

  private _scaleNumbersToRange(
    numbers: number[],
    minRange: number = 0,
    maxRange: number = 255,
  ): number[] {
    const minNumber = Math.min(...numbers);
    const maxNumber = Math.max(...numbers);

    const scaledNumbers = numbers.map(number => {
      return minRange + ((number - minNumber) * (maxRange - minRange)) / (maxNumber - minNumber);
    });

    return scaledNumbers;
  }

  private _getPixelCyclic(x: number, y: number) {
    let newX = 0;
    let newY = 0;

    if (x < 0) {
      newX = this.canvasWidth + (x % this.canvasWidth);
    } else if (x >= this.canvasWidth) {
      newX = x % this.canvasWidth;
    } else {
      newX = x;
    }

    if (y < 0) {
      newY = this.canvasHeight + (y % this.canvasHeight);
    } else if (y >= this.canvasHeight) {
      newY = y % this.canvasHeight;
    } else {
      newY = y;
    }

    return { x: newX, y: newY };
  }

  private _getPixelNull(x: number, y: number) {
    if (x < 0 || x >= this.canvasWidth || y < 0 || y >= this.canvasHeight) {
      return { x: 0, y: 0 }; // Assuming black color for out-of-bounds pixels
    }

    return { x, y };
  }

  private _getPixelRepeat(x: number, y: number) {
    let newX = Math.max(0, Math.min(this.canvasWidth - 1, x));
    let newY = Math.max(0, Math.min(this.canvasHeight - 1, y));

    return { x: newX, y: newY };
  }

  getWindow(x: number, y: number, size: number, channel: string, mode: string) {
    const halfSize = Math.floor(size / 2);
    const windowMatrix: number[][] = new Array(size);

    for (let i = x - halfSize, m = 0; i <= x + halfSize; i++, m++) {
      const row = new Array(size);
      for (let j = y - halfSize, n = 0; j <= y + halfSize; j++, n++) {
        const pixel = this._getPixelByMode(i, j, mode);
        const valueForChannelOfPixel = this.mainCanvas.getPixelChannelValue(
          pixel.x,
          pixel.y,
          channel,
        );
        row[n] = valueForChannelOfPixel;
      }
      windowMatrix[m] = row;
    }
    return windowMatrix;
  }

  private _getPixelByMode(x: number, y: number, mode: string) {
    switch (parseInt(mode)) {
      case PIXELMETHOD.cyclicEdge:
        return this._getPixelCyclic(x, y);
      case PIXELMETHOD.nullEdge:
        return this._getPixelNull(x, y);
      case PIXELMETHOD.repeatEdge:
        return this._getPixelRepeat(x, y);
      default:
        return this._getPixelCyclic(x, y); // Default to cyclic edge if mode is not recognized
    }
  }

  /**
   * Vincent-Soille watershed algorithm
   *
   * Page 15
   * https://www.researchgate.net/publication/2879434_The_Watershed_Transform_Definitions_Algorithms_and_Parallelization_Strategies
   */
  watershedByImmersion() {
    const G = {
      D: Array.from(
        { length: this.mainCanvas.canvas.width * this.mainCanvas.canvas.height },
        (_, i) => [i % this.mainCanvas.canvas.width, Math.floor(i / this.mainCanvas.canvas.width)],
      ),
      im: this.mainCanvas.getLuminosityValues(),
    };

    const start = performance.now();

    const init = -1; // Unlabeled
    const mask = -2; // Temporary marker for pixels
    const wshed = 0; // Watershed label
    const fictitious = [-1, -1]; // Fictitious pixel for level separation
    let curlab = 0; // Current label

    const D = G.D;
    const im = G.im;

    // Label and distance initialization
    const lab = new Array(im.length).fill(init);
    const dist = new Array(im.length).fill(Infinity);

    // Sort pixels by intensity
    const sortedPixels = [...Array(im.length).keys()].sort((a, b) => im[a] - im[b]);
    const hmin = im[sortedPixels[0]];
    const hmax = im[sortedPixels[sortedPixels.length - 1]];

    // FIFO queue
    function fifoInit(): number[][] {
      return [];
    }

    function fifoAdd(element: number[], queue: number[][]) {
      queue.push(element);
    }

    function fifoRemove(queue: number[][]): number[] | undefined {
      return queue.shift();
    }

    function fifoEmpty(queue: number[][]): boolean {
      return queue.length === 0;
    }

    const queue = fifoInit();

    // Process each intensity level
    for (let h = hmin; h <= hmax; h++) {
      // Mark pixels with intensity h
      for (const p of sortedPixels) {
        if (im[p] === h) {
          lab[p] = mask; // Mark as visited

          // Check for any labeled neighbor
          if (this._hasNeighbor(D[p], qIndex => lab[qIndex] > 0 || lab[qIndex] === wshed)) {
            dist[p] = 1; // Distance from labeled region
            fifoAdd([p], queue); // Add pixel index to queue
          }
        }
      }

      let curdist = 1;
      fifoAdd(fictitious, queue); // Add fictitious pixel to separate layers

      while (true) {
        let p = fifoRemove(queue);
        if (!p) break;

        // Handle fictitious pixel for level separation
        if (p[0] === fictitious[0] && p[1] === fictitious[1]) {
          if (fifoEmpty(queue)) break;
          fifoAdd(fictitious, queue);
          curdist++; // Increase distance for the next layer
          continue;
        }

        const pIndex = p[0]; // p is now the pixel index, not coordinates

        // Process neighbors
        for (const q of this._getNeighbors(D[pIndex])) {
          const qIndex = this._getIndex(q); // Convert neighbor to index

          if (lab[qIndex] > 0 || lab[qIndex] === wshed) {
            // Propagate labels carefully to avoid thick boundaries
            if (lab[qIndex] > 0 && (lab[pIndex] === mask || lab[pIndex] === wshed)) {
              lab[pIndex] = lab[qIndex]; // Propagate the region label
            } else if (lab[pIndex] !== lab[qIndex] && lab[pIndex] !== mask) {
              // Only mark as watershed if necessary, reduce watershed spread
              if (lab[pIndex] === mask || dist[pIndex] > 1) {
                lab[pIndex] = wshed;
              }
            }
          } else if (lab[qIndex] === mask && dist[qIndex] === Infinity) {
            dist[qIndex] = curdist + 1;
            fifoAdd([qIndex], queue);
          }
        }
      }

      // Second pass: assign labels
      for (const p of sortedPixels) {
        if (im[p] === h) {
          dist[p] = 0; // Reset distance

          if (lab[p] === mask) {
            curlab++; // New label
            fifoAdd([p], queue);
            lab[p] = curlab; // Label current region

            while (!fifoEmpty(queue)) {
              const q = fifoRemove(queue);
              if (!q) break;

              for (const r of this._getNeighbors(D[q[0]])) {
                const rIndex = this._getIndex(r); // Convert neighbor to index
                if (lab[rIndex] === mask) {
                  fifoAdd([rIndex], queue);
                  lab[rIndex] = curlab; // Assign the same label
                }
              }
            }
          }
        }
      }
    }

    const end = performance.now();
    const executionTime = end - start;
    console.log(`Watershed by Immersion executed in ${executionTime.toFixed(2)} milliseconds`);

    const watershedImage = lab;

    const resultImageData = new ImageData(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
    );

    // Fill the result image data based on labels
    for (let i = 0; i < watershedImage.length; i++) {
      const label = (watershedImage[i] / curlab) * 255; // Normalize label for grayscale image
      resultImageData.data[i * 4] = label;
      resultImageData.data[i * 4 + 1] = label;
      resultImageData.data[i * 4 + 2] = label;
      resultImageData.data[i * 4 + 3] = 255;
    }

    this.ctx.putImageData(resultImageData, 0, 0);
  }

  // Helper function: checks if any neighbor satisfies the condition
  _hasNeighbor(p: number[], condition: (qIndex: number) => boolean): boolean {
    for (const q of this._getNeighbors(p)) {
      const qIndex = this._getIndex(q);
      if (condition(qIndex)) {
        return true;
      }
    }
    return false;
  }

  // Returns the neighbors of a pixel within image boundaries
  _getNeighbors(p: number[]): number[][] {
    const [x, y] = p;
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
      [x - 1, y - 1],
      [x - 1, y + 1],
      [x + 1, y - 1],
      [x + 1, y + 1],
    ];
    return neighbors.filter(
      ([nx, ny]) => nx >= 0 && nx < this.canvasWidth && ny >= 0 && ny < this.canvasHeight,
    );
  }

  // Converts 2D coordinates to a 1D index
  _getIndex(p: number[]): number {
    return p[0] + p[1] * this.canvasWidth;
  }
}