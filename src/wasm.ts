import MainCanvas from './mainCanvas';

import { OFFSET, MATRICES, PIXELMETHOD } from './constants.ts';
import { getGauss } from './utils.ts';

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

  async gaussianBlur() {
    await this.use(PIXELMETHOD.cyclicEdge);
    this.functions.convolveGaussian(this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge, 1.6);
  }

  async linearBlur() {
    await this.use(PIXELMETHOD.cyclicEdge);
    this.functions.convolve(this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge, ...MATRICES.linear_blur);
  }
  async blur() {
    await this.use(PIXELMETHOD.cyclicEdge);
    this.functions.convolve(
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
      OFFSET.blur,
      PIXELMETHOD.cyclicEdge,
      ...MATRICES.blur,
    );
  }

  async use(mode = 0) {
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.mainCanvas.canvas.width,
      this.mainCanvas.canvas.height,
    );
    await this.setupAsTransforms(this.ctx, imageData, mode);
  }

  async setupAsTransforms(ctx: CanvasRenderingContext2D, imageData: { data: any }, mode: number) {
    const data = imageData.data;
    const byteSize = data.length;
    const initial = 2 * (((byteSize + 0xffff) & ~0xffff) >>> 16);
    const memory = new WebAssembly.Memory({ initial });
    const importObject = {
      env: {
        memory,
        abort: () => console.log('Abort!'),
      },
    };
    let module;
    if (typeof WebAssembly.instantiateStreaming !== 'undefined') {
      // for Chrome & Firefox
      module = await WebAssembly.instantiateStreaming(fetch('../build/release.wasm'), importObject);
    } else {
      // for Safari
      module = await WebAssembly.instantiate(
        await (await fetch('../build/release.wasm')).arrayBuffer(),
        importObject,
      );
    }
    const { instance } = module;

    const mem = new Uint8Array(memory.buffer);
    Object.assign(this.functions, {
      negative: this.transform('negative', imageData, ctx, mem, instance),
      grayscale: this.transform('grayscale', imageData, ctx, mem, instance),
      convolve: this.transform('convolve', imageData, ctx, mem, instance, mode),
      convolveGaussian: this.transform('convolveGaussian', imageData, ctx, mem, instance, mode),
    });
  }

  transform(
    fn: string,
    imageData: any,
    ctx: CanvasRenderingContext2D,
    mem: Uint8Array,
    instance: any,
    mode: any = 0,
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
