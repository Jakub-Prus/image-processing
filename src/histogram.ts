import MainCanvas from './mainCanvas';

export default class Histogram {
  mainCanvas: MainCanvas;
  ctx: CanvasRenderingContext2D;
  A: number[];
  R: number[];
  G: number[];
  B: number[];
  avoidedChannels: string[];

  constructor(mainCanvas: MainCanvas) {
    this.mainCanvas = mainCanvas;
    this.ctx = mainCanvas.ctx;
    this.A = new Array(256).fill(0);
    this.R = new Array(256).fill(0);
    this.G = new Array(256).fill(0);
    this.B = new Array(256).fill(0);
    this.avoidedChannels = [];
  }

  update(avoidedChannel: string[] = []) {
    this.avoidedChannels = avoidedChannel;
    this.generate(this.mainCanvas.getImageData(), this.mainCanvas.isGrayscale);
  }

  generate(imgData: ImageData, isGrayscale: boolean) {
    const src = new Uint32Array(imgData.data.buffer);

    this.A.fill(0);
    this.R.fill(0);
    this.G.fill(0);
    this.B.fill(0);

    for (let i = 0; i < src.length; i++) {
      let r = src[i] & 0xff;
      let g = (src[i] >> 8) & 0xff;
      let b = (src[i] >> 16) & 0xff;
      if (!this.avoidedChannels.includes('R')) this.R[r]++;
      if (!this.avoidedChannels.includes('G')) this.G[g]++;
      if (!this.avoidedChannels.includes('B')) this.B[b]++;
      if (!this.avoidedChannels.includes('L')) {
        this.A[r]++;
        this.A[g]++;
        this.A[b]++;
      }
    }

    let maxBrightness = 0;
    if (isGrayscale) {
      for (let i = 1; i < 256; i++) {
        if (maxBrightness < this.A[i]) {
          maxBrightness = this.A[i];
        }
      }
    } else {
      for (let i = 0; i < 256; i++) {
        if (maxBrightness < this.R[i]) {
          maxBrightness = this.R[i];
        } else if (maxBrightness < this.G[i]) {
          maxBrightness = this.G[i];
        } else if (maxBrightness < this.B[i]) {
          maxBrightness = this.B[i];
        }
      }
    }

    const canvas = document.getElementById(
      'canvasHistogram',
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    let guideHeight = 8;
    let startY = canvas.height - guideHeight;
    let dx = canvas.width / 256;
    let dy = startY / maxBrightness;
    ctx.lineWidth = dx;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 256; i++) {
      let x = i * dx;
      if (isGrayscale) {
        // Value
        ctx.strokeStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY - this.A[i] * dy);
        ctx.closePath();
        ctx.stroke();
      } else {
        // Red
        ctx.strokeStyle = 'rgba(220,0,0,0.5)';
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY - this.R[i] * dy);
        ctx.closePath();
        ctx.stroke();
        // Green
        ctx.strokeStyle = 'rgba(0,210,0,0.5)';
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY - this.G[i] * dy);
        ctx.closePath();
        ctx.stroke();
        // Blue
        ctx.strokeStyle = 'rgba(0,0,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, startY - this.B[i] * dy);
        ctx.closePath();
        ctx.stroke();
      }
      // Guide
      ctx.strokeStyle = 'rgb(' + i + ', ' + i + ', ' + i + ')';
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, canvas.height);
      ctx.closePath();
      ctx.stroke();
    }
  }
}
