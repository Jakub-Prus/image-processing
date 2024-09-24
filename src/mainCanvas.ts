import { CHANNELNAME } from './constants.ts';

export default class MainCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  originalImageData: ImageData | null;
  isGrayscale: boolean;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.setupCanvas();
    this.setupResizeHandler();

    this.originalImageData = null;
    this.isGrayscale = false;
  }

  setupCanvas() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    // this.canvas.width = window.innerWidth - parseInt(getComputedStyle(document.body).getPropertyValue('--tools-menu-width'));
    // this.canvas.height = window.innerHeight - parseInt(getComputedStyle(document.body).getPropertyValue('--top-menu-height'));
    this.canvas.width = 512;
    this.canvas.height = 512;

    const img = new Image();
    img.src = '/img/testImg.png';
    img.crossOrigin = 'anonymous';
    img.onload = () => this.original(img);
  }

  original(img: HTMLImageElement) {
    this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
  }

  resizeCanvas() {
    const snapshot = this.canvas.toDataURL();
    this.canvas.width =
      window.innerWidth -
      parseInt(getComputedStyle(document.body).getPropertyValue('--tools-menu-width'));
    this.canvas.height =
      window.innerHeight -
      parseInt(getComputedStyle(document.body).getPropertyValue('--top-menu-height'));
    (() => {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0);
      };
      img.src = snapshot;
    })();
  }

  setupResizeHandler() {
    //TODO add proper resizing of canvas
    // window.addEventListener('resize', this.resizeCanvas());
  }

  getImageData() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    return imageData;
  }

  getGrayscaleImageData(): ImageData {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const gray = Math.floor(pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722);
      pixels[i] = gray;
      pixels[i + 1] = gray;
      pixels[i + 2] = gray;
    }

    return imageData;
  }

  getChannelValues(channel: string) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    let channelArray: number[] = [];
    const offset = CHANNELNAME[channel];

    for (let i = 0; i < imageData.data.length; i += 4) {
      const channelValue = imageData.data[i + offset];
      channelArray.push(channelValue);
    }

    return channelArray;
  }

  getPixelChannelValue(x: number, y: number, channel: string) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const offset = CHANNELNAME[channel];
    const chosenIndex = ((x % this.canvas.width) + this.canvas.width * y) * 4;
    const chosenValue = imageData.data[chosenIndex + offset];
    return chosenValue;
  }

  applyImageDataToCurrentCanvas(newImageData: ImageData) {
    this.ctx.putImageData(newImageData, 0, 0);
  }

  loadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = event => {
      const file = (event.target as HTMLInputElement).files![0];
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
          this.originalImageData = this.ctx.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height,
          );
          this.isGrayscaleFunc(this.originalImageData);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  isGrayscaleFunc(imageData: ImageData) {
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      if (r !== g || r !== b || g !== b) {
        this.isGrayscale = false;
        return;
      }
    }
    this.isGrayscale = true;
    return;
  }

  getLuminosityValues(): number[] {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const luminosityArray: number[] = [];

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      // Calculate luminosity using the formula: 0.299R + 0.587G + 0.114B
      const luminosity = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      luminosityArray.push(luminosity);
    }

    return luminosityArray;
  }
}
