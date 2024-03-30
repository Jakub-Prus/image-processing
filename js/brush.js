export default class Brush {
    constructor(canvas, context) {
      this.canvas = canvas;
      this.ctx = context;
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
      this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
      this.canvas.addEventListener('mousemove', this.draw.bind(this));
      this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
      this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
      // Touch events
      this.canvas.addEventListener('touchstart', this.startDrawing.bind(this));
      this.canvas.addEventListener('touchmove', this.draw.bind(this));
      this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }
  }