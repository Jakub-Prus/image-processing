import MainCanvas from './mainCanvas';

import { OFFSET, MATRICES, PIXELMETHOD, TRANSFORM } from './constants.ts';
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
  // [original data][transformed data][data slot 1][data slot 2][data slot 3][debugData]
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
    const initial = (6 * ((byteSize + 0xffff) & ~0xffff)) >>> 16;
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
      negative: transform(TRANSFORM.negative, imageData, ctx, mem, instance),
      grayscale: transform(TRANSFORM.grayscale, imageData, ctx, mem, instance),
      convolve: transform(TRANSFORM.convolve, imageData, ctx, mem, instance),
      convolveGaussian: transform(TRANSFORM.convolveGaussian, imageData, ctx, mem, instance),
      edgeDetection: transform(TRANSFORM.edgeDetection, imageData, ctx, mem, instance),
      edgeDetectionMatrix2: transform(
        TRANSFORM.edgeDetectionMatrix2,
        imageData,
        ctx,
        mem,
        instance,
      ),
      edgeDetectionZero: transform(TRANSFORM.edgeDetectionZero, imageData, ctx, mem, instance),
      edgeDetectionCanny: transform(TRANSFORM.edgeDetectionCanny, imageData, ctx, mem, instance),
    });
  }

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
      data.set(mem.subarray(byteSize, byteSize * 2));
      this.displayDebugData(
        mem.subarray(byteSize * 5, byteSize * 6),
        this.mainCanvas.canvas.width,
        this.mainCanvas.canvas.height,
      );
      ctx.putImageData(imageData, 0, 0);
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
    this.functions.grayscale(false);
  }

  async negative() {
    await this.ensureInitialized();
    this.functions.negative();
  }

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

  async edgeDetectionCanny() {
    await this.ensureInitialized();
    this.functions.grayscale(false);
    this.functions.convolveGaussian(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      1.6,
      false,
    );
    this.functions.edgeDetection(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      ...MATRICES.edge_sobel_x,
      ...MATRICES.edge_sobel_y,
    );

    // this.functions.edgeDetectionCanny(
    //   this.mainCanvas.canvas.width,
    //   this.mainCanvas.canvas.height,
    //   OFFSET.blur,
    //   PIXELMETHOD.cyclicEdge,
    //   1,
    //   0.5,
    //   0.9,
    // );

    //   // Copy edge detection results back to image data
    //   data.set(this.mem.subarray(byteSize, 2 * byteSize));

    //   this.ctx.putImageData(imageData, 0, 0);
  }
}