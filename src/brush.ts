import MainCanvas from './mainCanvas';

export default class Brush {
  mainCanvas: MainCanvas;
  ctx: CanvasRenderingContext2D;
  brushSize: number;
  brushColor: string;
  isDrawing: boolean;

  constructor(mainCanvas: MainCanvas) {
    this.mainCanvas = mainCanvas;
    this.ctx = mainCanvas.ctx;
    this.brushSize = 5;
    this.brushColor = '#000000';
    this.isDrawing = false;
    this.setupEventListeners();
  }

  setBrushSize(size: number) {
    this.brushSize = size;
  }

  setBrushColor(color: string) {
    this.brushColor = color;
  }

  startDrawing(e: MouseEvent | TouchEvent) {
    this.isDrawing = true;
    this.draw(e);
  }

  draw(e: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    const { offsetX, offsetY } = this.getCoordinates(e);
    this.ctx.beginPath();
    this.ctx.arc(offsetX, offsetY, this.brushSize, 0, Math.PI * 2);
    this.ctx.fillStyle = this.brushColor;
    this.ctx.fill();
    this.ctx.closePath();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  setupEventListeners() {
    this.mainCanvas.canvas.addEventListener('mousedown', e =>
      this.startDrawing(e),
    );
    this.mainCanvas.canvas.addEventListener('mousemove', e => this.draw(e));
    this.mainCanvas.canvas.addEventListener('mouseup', () =>
      this.stopDrawing(),
    );
    this.mainCanvas.canvas.addEventListener('mouseout', () =>
      this.stopDrawing(),
    );
    // Touch events
    this.mainCanvas.canvas.addEventListener('touchstart', e =>
      this.startDrawing(e),
    );
    this.mainCanvas.canvas.addEventListener('touchmove', e => this.draw(e));
    this.mainCanvas.canvas.addEventListener('touchend', () =>
      this.stopDrawing(),
    );
  }

  // private getCoordinates(event: MouseEvent | TouchEvent): { offsetX: number, offsetY: number } {
  //     let offsetX: number;
  //     let offsetY: number;
  //     if ('touches' in event) {
  //         const touch = (event as TouchEvent).touches[0];
  //         offsetX = touch.pageX - touch.target['offsetLeft'];
  //         offsetY = touch.pageY - touch.target['offsetTop'];
  //     } else {
  //         const mouseEvent = event as MouseEvent;
  //         offsetX = mouseEvent.offsetX;
  //         offsetY = mouseEvent.offsetY;
  //     }
  //     return { offsetX, offsetY };
  // }
}
