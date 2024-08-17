import MainCanvas from './mainCanvas';

import { OFFSET, MATRICES, PIXELMETHOD } from './constants.ts';
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
    const initial = (4 * ((byteSize + 0xffff) & ~0xffff)) >>> 16;
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
      negative: transform('negative', imageData, ctx, mem, instance),
      grayscale: transform('grayscale', imageData, ctx, mem, instance),
      convolve: transform('convolve', imageData, ctx, mem, instance),
      convolveGaussian: transform('convolveGaussian', imageData, ctx, mem, instance),
      edgeDetection: transform('edgeDetection', imageData, ctx, mem, instance),
      edgeDetectionMatrix2: transform('edgeDetectionMatrix2', imageData, ctx, mem, instance),
      edgeDetectionZero: transform('edgeDetectionZero', imageData, ctx, mem, instance),
      edgeDetectionCanny: transform('edgeDetectionCanny', imageData, ctx, mem, instance),
    });
  }

  async ensureInitialized() {
    if (!this.instance) {
      await this.initialize();
    }
  }

  // Update all your existing methods to use ensureInitialized instead of use
  async grayscale() {
    await this.ensureInitialized();
    this.functions.grayscale(false);
  }

  async negative() {
    await this.ensureInitialized();
    this.functions.negative();
  }

  // ... Update other methods similarly ...

  transform(
    fn: string,
    imageData: ImageData,
    ctx: CanvasRenderingContext2D,
    mem: Uint8Array,
    instance: WebAssembly.Instance,
  ) {
    return (...args: any) => {
      const data = imageData.data;
      const byteSize = data.length;

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
      // Copy the response from the shared memory into the canvas imageData
      data.set(mem.subarray(byteSize, 2 * byteSize));
      ctx.putImageData(imageData, 0, 0);
    };
  }

  // Update all your existing methods to use the new structure
  async gaussianBlur() {
    await this.ensureInitialized();
    this.functions.convolveGaussian(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      1.6,
      false,
    );
  }

  async linearBlur() {
    await this.ensureInitialized();
    this.functions.convolve(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      ...MATRICES.linear_blur,
    );
  }

  async blur() {
    await this.ensureInitialized();
    this.functions.convolve(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      ...MATRICES.blur,
    );
  }

  async edgeDetectionRoberts() {
    await this.ensureInitialized();
    this.functions.edgeDetectionMatrix2(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      ...MATRICES.edge_roberts_x,
      ...MATRICES.edge_roberts_y,
    );
  }

  async edgeDetectionSobel() {
    await this.ensureInitialized();
    this.functions.edgeDetection(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      ...MATRICES.edge_sobel_x,
      ...MATRICES.edge_sobel_y,
    );
  }

  async edgeDetectionPrewitt() {
    await this.ensureInitialized();
    this.functions.edgeDetection(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      ...MATRICES.edge_prewitt_x,
      ...MATRICES.edge_prewitt_y,
    );
  }

  async edgeDetectionZero() {
    await this.ensureInitialized();
    this.functions.edgeDetectionZero(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      1.6,
      5,
    );
  }
}