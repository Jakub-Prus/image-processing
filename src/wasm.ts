import MainCanvas from './mainCanvas';

import { OFFSET, MATRICES, PIXELMETHOD } from './constants.ts';

export default class Wasm {
  mainCanvas: MainCanvas;
  functions: any;
  ctx: CanvasRenderingContext2D;
  constructor(mainCanvas: MainCanvas) {
    this.mainCanvas = mainCanvas;
    this.ctx = this.mainCanvas.canvas.getContext('2d', {
      willReadFrequently: true,
    })!;
    this.functions = {};
  }

  async grayscale() {
    await this.use();
    this.functions.grayscale(false);
  }

  async negative() {
    await this.use();
    this.functions.negative();
  }

  async gaussianBlur() {
    await this.use();
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
    await this.use();
    this.functions.convolve(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      ...MATRICES.linear_blur,
    );
  }
  async blur() {
    await this.use();
    this.functions.convolve(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      ...MATRICES.blur,
    );
  }

  async edgeDetectionRoberts() {
    await this.use();
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
    await this.use();
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
    await this.use();
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
    await this.use();
    this.functions.edgeDetectionZero(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      1.6,
      5,
    );
  }

  async use() {
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
    );
    await this.setupAsTransforms(this.ctx, imageData);
  }

  async setupAsTransforms(ctx: CanvasRenderingContext2D, imageData: { data: any }) {
    const data = imageData.data;
    const byteSize = data.length;
    const initial = 2 * (((byteSize + 0xffff) & ~0xffff) >>> 16);
    const memory = new WebAssembly.Memory({ initial });
    let module: any;
    const importObject = {
      env: {
        memory,
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
    if (typeof WebAssembly.instantiateStreaming !== 'undefined') {
      // for Chrome & Firefox
      module = await WebAssembly.instantiateStreaming(fetch('../build/debug.wasm'), importObject);
    } else {
      // for Safari
      module = await WebAssembly.instantiate(
        await (await fetch('../build/debug.wasm')).arrayBuffer(),
        importObject,
      );
    }
    const { instance } = module;

    const mem = new Uint8Array(memory.buffer);
    Object.assign(this.functions, {
      negative: this.transform('negative', imageData, ctx, mem, instance),
      grayscale: this.transform('grayscale', imageData, ctx, mem, instance),
      convolve: this.transform('convolve', imageData, ctx, mem, instance),
      convolveGaussian: this.transform('convolveGaussian', imageData, ctx, mem, instance),
      edgeDetection: this.transform('edgeDetection', imageData, ctx, mem, instance),
      edgeDetectionMatrix2: this.transform('edgeDetectionMatrix2', imageData, ctx, mem, instance),
      edgeDetectionZero: this.transform('edgeDetectionZero', imageData, ctx, mem, instance),
    });
  }

  transform(
    fn: string,
    imageData: any,
    ctx: CanvasRenderingContext2D,
    mem: Uint8Array,
    instance: any,
  ) {
    return (...args: any) => {
      //retrieve image pixels (4 bytes per pixel: RBGA)
      const data = imageData.data;
      console.log('data', data);
      //copy to bytes to shared memory
      mem.set(data);

      //invoque 'fn'  Wasm filter. We need to inform of the image byte size
      const byteSize = data.length;
      instance.exports[fn](byteSize, ...args);

      //copy the response from the shared memory into the canvas imageData
      data.set(mem.subarray(byteSize, 2 * byteSize));
      console.log('imageData.data', imageData.data);
      ctx.putImageData(imageData, 0, 0);
    };
  }
}
