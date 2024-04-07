export default class Brush {
    constructor(mainCanvas) {
      this.mainCanvas = mainCanvas;
      this.ctx = mainCanvas.ctx;
      this.brushSize = 5;
      this.brushColor = '#000000';
      this.isDrawing = false;
      this.setupEventListeners();
    }
  
    setBrushSize(size) {
      this.brushSize = size;
    }
  
    setBrushColor(color) {
      this.brushColor = color;
    }
  
    startDrawing(e) {
      this.isDrawing = true;
      this.draw(e);
    }
  
    draw(e) {
      if (!this.isDrawing) return;
      const { offsetX, offsetY } = e;
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
      this.mainCanvas.addEventListener('mousedown', this.startDrawing.bind(this));
      this.mainCanvas.addEventListener('mousemove', this.draw.bind(this));
      this.mainCanvas.addEventListener('mouseup', this.stopDrawing.bind(this));
      this.mainCanvas.addEventListener('mouseout', this.stopDrawing.bind(this));
      // Touch events
      this.mainCanvas.addEventListener('touchstart', this.startDrawing.bind(this));
      this.mainCanvas.addEventListener('touchmove', this.draw.bind(this));
      this.mainCanvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }
  }