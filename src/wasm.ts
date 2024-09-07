import MainCanvas from './mainCanvas';

import {
  OFFSET,
  MATRICES,
  PIXELMETHOD,
  TRANSFORM,
  CONVOLVEOPTIONS,
  BINARIZATIONMETHOD,
} from './constants.ts';
import { getGaussianKernel } from './utils.ts';
export default class Wasm {
  mainCanvas: MainCanvas;
  functions: any;
  ctx: CanvasRenderingContext2D;
  params: any;
  memory: WebAssembly.Memory | null;
  instance: WebAssembly.Instance | null;
  mem: Uint8Array | null;

  constructor(mainCanvas: MainCanvas) {
    this.mainCanvas = mainCanvas;
    this.ctx = this.mainCanvas.canvas.getContext('2d', {
      willReadFrequently: true,
    })!;
    this.functions = {};
    this.memory = null;
    this.instance = null;
    this.mem = null;
  }

  // Memory structure
  // Blocks with same size // TODO can be optimized to not be same size for each block
  // [original data][transformed data][data slot 1(matrices)][data slot 2][data slot 3][data slot 4][debugData]
  async initialize() {
    if (this.instance) return; // Already initialized

    const imageData = this.ctx.getImageData(
      0,
      0,
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
    );
    const data = imageData.data;
    const byteSize = data.length;
    const initial = (8 * ((byteSize + 0xffff) & ~0xffff)) >>> 16;
    this.memory = new WebAssembly.Memory({ initial });

    const importObject = {
      env: {
        memory: this.memory,
        abort: () => console.log('Abort!'),
      },
      index: {
        printString: console.log,
        printU8: console.log,
        printF64: console.log,
        printI64: console.log,
        printI32: console.log,
        print: console.log,
      },
    };

    let module: any;
    if (typeof WebAssembly.instantiateStreaming !== 'undefined') {
      module = await WebAssembly.instantiateStreaming(fetch('../build/debug.wasm'), importObject);
    } else {
      module = await WebAssembly.instantiate(
        await (await fetch('../build/debug.wasm')).arrayBuffer(),
        importObject,
      );
    }

    this.instance = module.instance;
    this.mem = new Uint8Array(this.memory.buffer);

    this.setupFunctions(imageData);
  }

  setupFunctions(imageData: ImageData) {
    if (!this.instance || !this.mem) throw new Error('WebAssembly not initialized');

    const ctx = this.ctx;
    const transform = this.transform.bind(this);
    const instance = this.instance;
    const mem = this.mem;

    Object.assign(this.functions, {
      negative: transform(TRANSFORM.negative, imageData, ctx, mem, instance, []),
      grayscale: transform(TRANSFORM.grayscale, imageData, ctx, mem, instance, ['onFirstSlot']),
      convolve: transform(TRANSFORM.convolve, imageData, ctx, mem, instance, [
        'width',
        'height',
        'offset',
        'pixelMethod',
        'sizeOfKernel',
        'usedSlots',
        'option',
        'sigma',
        'slot3',
        'slot4',
      ]),
      convolveGaussian: transform(TRANSFORM.convolveGaussian, imageData, ctx, mem, instance, [
        'width',
        'height',
        'offset',
        'pixelMethod',
        'sigma',
        'onFirstSlot',
      ]),
      edgeDetection: transform(TRANSFORM.edgeDetection, imageData, ctx, mem, instance, [
        'width',
        'height',
        'offset',
        'pixelMethod',
      ]),
      edgeDetectionZero: transform(TRANSFORM.edgeDetectionZero, imageData, ctx, mem, instance, [
        'width',
        'height',
        'offset',
        'pixelMethod',
        'sigma',
        't',
      ]),
      edgeDetectionCanny: transform(TRANSFORM.edgeDetectionCanny, imageData, ctx, mem, instance, [
        'width',
        'height',
        'offset',
        'pixelMethod',
        'sizeOfKernel',
        'usedSlots',
        'lowThreshold',
        'highThreshold',
        'slot3',
        'slot4',
      ]),
      edgeDetectionHough: transform(TRANSFORM.edgeDetectionHough, imageData, ctx, mem, instance, [
        'width',
        'height',
        'offset',
        'pixelMethod',
        'skipEdgeDetection',
        'density',
        'rhoMax',
        'thetaSize',
      ]),
    });
  }

  transform(
    fn: string,
    imageData: ImageData,
    ctx: CanvasRenderingContext2D,
    mem: Uint8Array,
    instance: WebAssembly.Instance,
    argOrder: string[],
  ) {
    return (options: any) => {
      console.log('options', options);
      const data = imageData.data;
      const byteSize = data.length;
      const filteredArgOrder = argOrder.filter(key => !key.startsWith('slot'));
      const args = filteredArgOrder.map(key => options[key]);

      // Load data into specific slots of memory
      Object.keys(options).forEach(key => {
        if (key.startsWith('slot')) {
          const slotIndex = parseInt(key.substring(4)) - 1; // Assuming slot1, slot2, etc.
          if (!isNaN(slotIndex) && slotIndex >= 0) {
            const slotStart = slotIndex * byteSize;
            console.log('slotStart', slotStart);
            mem.set(options[key], slotStart);
          }
        }
      });
      console.log('args', args);
      console.log(
        'mem.subarray(byteSize * 2, byteSize * 3)',
        mem.subarray(byteSize * 2, byteSize * 3),
      );

      // Update imageData with current canvas content
      const currentImageData = ctx.getImageData(
        0,
        0,
        this.mainCanvas.canvas.width,
        this.mainCanvas.canvas.height,
      );
      imageData.data.set(currentImageData.data);

      // Copy to bytes to shared memory
      mem.set(data);

      // Invoke 'fn' Wasm
      // @ts-ignore
      instance.exports[fn](byteSize, ...args);

      // this.displayDebugData(
      //   mem.subarray(byteSize * 6, byteSize * 7),
      //   this.mainCanvas.canvas.width,
      //   this.mainCanvas.canvas.height,
      // );

      // if (fn === TRANSFORM.edgeDetectionHough && options.thetaSize) {
      //   const houghMatrixSize = Math.min(options.thetaSize * (options.rhoMax * 2 + 1));
      //   console.log(houghMatrixSize);

      //   const tempCanvas = document.createElement('canvas');
      //   tempCanvas.width = options.rhoMax * 2 + 1;
      //   tempCanvas.height = options.thetaSize;
      //   const tempCtx = tempCanvas.getContext('2d')!;

      //   const tempImageData = tempCtx.getImageData(
      //     0,
      //     0,
      //     tempCanvas.width,
      //     tempCanvas.height,
      //   );
      //   console.log('tempImageData', tempImageData)

      //   tempImageData.data.set(mem.subarray(byteSize * 3, byteSize * 3 + houghMatrixSize));
      //   tempCtx.putImageData(tempImageData, 0, 0);

      //   console.log('Final img data hough: ', tempImageData);

      //   // Calculate the scaling factor and new dimensions
      //   const srcAspectRatio = tempCanvas.width / tempCanvas.height;
      //   const dstAspectRatio = this.mainCanvas.canvas.width / this.mainCanvas.canvas.height;
      //   let scale;
      //   if (srcAspectRatio > dstAspectRatio) {
      //     scale = this.mainCanvas.canvas.width / tempCanvas.width;
      //   } else {
      //     scale = this.mainCanvas.canvas.height / tempCanvas.height;
      //   }
      //   const newWidth = tempCanvas.width * scale;
      //   const newHeight = tempCanvas.height * scale;

      //   // Calculate the position to draw the tempCanvas
      //   const x = (this.mainCanvas.canvas.width - newWidth) / 2;
      //   const y = (this.mainCanvas.canvas.height - newHeight) / 2;

      //   // Draw the tempCanvas onto the mainCanvas with scaling
      //   ctx.drawImage(
      //     tempCanvas,
      //     x,
      //     y,
      //     newWidth,
      //     newHeight
      //   );

        this.displayDebugData(
          mem.subarray(byteSize, byteSize * 2),
          this.mainCanvas.canvas.width,
          this.mainCanvas.canvas.height,
        );
        // } else {

        // Copy the response from the shared memory into the canvas imageData
        data.set(mem.subarray(byteSize, byteSize * 2));

      console.log('Final img data: ', data);
      ctx.putImageData(imageData, 0, 0);
      // }
    };
  }

  displayDebugData(data: Uint8Array, width: number, height: number): void {
    const canvas = document.getElementById('debug-canvas') as HTMLCanvasElement;
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D;

    if (!canvas || !ctx) {
      console.error('Debug canvas or context not found');
      return;
    }

    // Create ImageData from the provided data
    const imageData = new ImageData(width, height);
    imageData.data.set(data);

    // Update the canvas with the processed image data
    ctx.putImageData(imageData, 0, 0);

    // Logging information from the provided data
    console.log('Debug data:', data);
    console.log('Unique debug values (Set):', new Set(data));
    console.log('Value debug occurrences:', this.countOccurrences(data));
  }

  countOccurrences(array: Uint8Array): Map<number, number> {
    const counts = new Map<number, number>();

    array.forEach(element => {
      counts.set(element, (counts.get(element) || 0) + 1);
    });

    return counts;
  }

  async ensureInitialized() {
    if (!this.instance) {
      await this.initialize();
    }
  }

  async grayscale() {
    await this.ensureInitialized();
    this.functions.grayscale({ value: false });
  }

  async negative() {
    await this.ensureInitialized();
    this.functions.negative();
  }
  async gaussianBlur() {
    await this.ensureInitialized();
    this.functions.convolve({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      sizeOfKernel: 5,
      usedSlots: 1,
      option: CONVOLVEOPTIONS.convolve,
      sigma: 1.6,
      slot3: getGaussianKernel(5, 1.6, true),
    });
  }

  async linearBlur() {
    await this.ensureInitialized();
    this.functions.convolve({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      sizeOfKernel: 3,
      usedSlots: 1,
      option: CONVOLVEOPTIONS.convolve,
      sigma: 0,
      slot3: MATRICES.linear_blur,
    });
  }

  async blur() {
    await this.ensureInitialized();
    this.functions.convolve({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      sizeOfKernel: 3,
      usedSlots: 1,
      option: CONVOLVEOPTIONS.convolve,
      sigma: 0,
      slot3: MATRICES.blur,
    });
  }

  async edgeDetectionRoberts() {
    await this.ensureInitialized();
    this.functions.convolve({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      sizeOfKernel: 2,
      usedSlots: 2,
      option: CONVOLVEOPTIONS.edgeDetection,
      sigma: 0,
      slot3: MATRICES.edge_roberts_x,
      slot4: MATRICES.edge_roberts_y,
    });
  }

  async edgeDetectionSobel() {
    await this.ensureInitialized();
    this.functions.convolve({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      sizeOfKernel: 3,
      usedSlots: 2,
      option: CONVOLVEOPTIONS.edgeDetection,
      sigma: 0,
      slot3: MATRICES.edge_sobel_x,
      slot4: MATRICES.edge_sobel_y,
    });
  }

  async edgeDetectionPrewitt() {
    await this.ensureInitialized();
    this.functions.convolve({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      sizeOfKernel: 3,
      usedSlots: 1,
      option: CONVOLVEOPTIONS.edgeDetection,
      sigma: 0,
      slot3: MATRICES.edge_prewitt_x,
      slot4: MATRICES.edge_prewitt_y,
    });
  }

  async edgeDetectionZero() {
    await this.ensureInitialized();
    this.functions.edgeDetectionZero({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      sigma: 5,
      t: 1,
    });
  }

  async edgeDetectionCanny() {
    await this.ensureInitialized();
    this.functions.grayscale(false);
    this.functions.convolve({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      sizeOfKernel: 5,
      usedSlots: 1,
      option: CONVOLVEOPTIONS.convolve,
      sigma: 1.6,
      slot3: getGaussianKernel(5, 1.6, true),
    });

    this.functions.edgeDetectionCanny({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      sizeOfKernel: 3,
      usedSlots: 2,
      lowThreshold: 0.2,
      highThreshold: 0.1,
      slot3: MATRICES.edge_sobel_x,
      slot4: MATRICES.edge_sobel_y,
    });
  }

  async binarizationManual() {
    await this.ensureInitialized();
    this.functions.binarization({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      binarizationMethod: BINARIZATIONMETHOD.manual,
      threshold: 150,
    });
  }

  async binarizationGradient() {
    await this.ensureInitialized();
    this.functions.binarization({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      binarizationMethod: BINARIZATIONMETHOD.gradient,
      threshold: 0,
    });
  }

  async edgeDetectionHough() {
    await this.ensureInitialized();
    this.functions.grayscale(false);

    this.functions.edgeDetectionZero({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      sigma: 5,
      t: 1,
    });
    const density = 2;
    const rhoMax = Math.sqrt(
      this.mainCanvas.canvas.width * this.mainCanvas.canvas.width +
        this.mainCanvas.canvas.height * this.mainCanvas.canvas.height,
    );
    const thetaSize = 180 * density;
    const houghMatrixFirstIndex = this.mainCanvas.canvas.width * this.mainCanvas.canvas.height * 2;
    const houghMatrixSize = Math.floor(thetaSize * (rhoMax * 2 + 1));

    this.functions.edgeDetectionHough({
      width: this.mainCanvas.canvas.width,
      height: this.mainCanvas.canvas.height,
      offset: OFFSET.blur,
      pixelMethod: PIXELMETHOD.cyclicEdge,
      skipEdgeDetection: 1,
      density: density,
      rhoMax: rhoMax,
      thetaSize: thetaSize,
    });
  }
}