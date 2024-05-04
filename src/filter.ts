import { CORRECTIONSENUM } from './constants';
import MainCanvas from './mainCanvas.js';

export default class Filter {
  mainCanvas: MainCanvas;
  ctx: CanvasRenderingContext2D;
  corrections: Record<string, number>;

  constructor(mainCanvas: MainCanvas) {
    this.mainCanvas = mainCanvas;
    this.ctx = mainCanvas.ctx;
    this.corrections = {
      brightness: 0,
      contrast: 0,
      gamma: 0,
    };
  }

  grayscale() {
    if (this.mainCanvas.isGrayscale === true) {
      const originalImageData = this.mainCanvas.originalImageData;
      if (originalImageData) this.applyFilterToCurrentCanvas(originalImageData);
      this.mainCanvas.isGrayscale = false;
      return;
    }
    const { tempImageData, data, tempData } = this.generateImageData();

    for (let i = 0; i < data.length; i += 4) {
      const grayscaleValue = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      tempData[i] = grayscaleValue; // Red component
      tempData[i + 1] = grayscaleValue; // Green component
      tempData[i + 2] = grayscaleValue; // Blue component
      tempData[i + 3] = data[i + 3]; // Alpha component
    }
    this.applyFilterToCurrentCanvas(tempImageData);
    this.mainCanvas.isGrayscale = true;
  }

  negative() {
    const { tempImageData, data, tempData } = this.generateImageData();

    for (let i = 0; i < data.length; i += 4) {
      tempData[i] = 255 - data[i]; // Red component
      tempData[i + 1] = 255 - data[i + 1]; // Green component
      tempData[i + 2] = 255 - data[i + 2]; // Blue component
      tempData[i + 3] = data[i + 3]; // Alpha component
    }

    this.applyFilterToCurrentCanvas(tempImageData);
  }

  applyCorrections() {
    const originalImageData = this.mainCanvas.originalImageData;
    if (!originalImageData) throw new Error('Error in apply Corrections, no originalImageData');
    const originalData = originalImageData.data;
    const { tempImageData, data, tempData } = this.generateImageData();

    const lookUpTable = this.createLookUpTable(this.corrections);

    for (let i = 0; i < data.length; i += 4) {
      tempData[i] = lookUpTable[originalData[i]]; // Red component
      tempData[i + 1] = lookUpTable[originalData[i + 1]]; // Green component
      tempData[i + 2] = lookUpTable[originalData[i + 2]]; // Blue component
      tempData[i + 3] = lookUpTable[originalData[i + 3]]; // Alpha component
    }

    this.applyFilterToCurrentCanvas(tempImageData);
  }

  applyFilterToCurrentCanvas(newImageData: ImageData) {
    this.ctx.putImageData(newImageData, 0, 0);
  }

  createLookUpTable(values: Record<string, number>) {
    const lookUpTable = new Uint8ClampedArray(Array.from({ length: 256 }, (_, index) => index));
    let modifiedLookUpTable: Uint8ClampedArray = new Uint8ClampedArray(256);

    for (const [operation, value] of Object.entries(values)) {
      if (value === 0) continue;
      switch (operation) {
        case CORRECTIONSENUM.brightness:
          modifiedLookUpTable = lookUpTable.map(lookUpTableValue => lookUpTableValue + value);
          break;
        case CORRECTIONSENUM.contrast:
          modifiedLookUpTable = lookUpTable.map(lookUpTableValue => lookUpTableValue * value);
          break;
        case CORRECTIONSENUM.gamma:
          modifiedLookUpTable = lookUpTable.map(lookUpTableValue =>
            Math.pow(lookUpTableValue, value),
          );
          break;
        default:
          break;
      }
      lookUpTable.set(modifiedLookUpTable);
    }
    return Array.from(lookUpTable);
  }

  generateImageData() {
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
    );
    const tempImageData = new ImageData(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
    );
    const data = imageData.data;
    const tempData = tempImageData.data;

    return { tempImageData, data, tempData };
  }
}
