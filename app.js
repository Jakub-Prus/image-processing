class App {
  constructor() {
    this.canvas = new Canvas();
    this.brush = new Brush(this.canvas.getCanvas(), this.canvas.getContext());
    this.filter = new Filter(this.canvas.getCanvas(), this.canvas.getContext())
    this.menu = new Menu(this.canvas.getCanvas(), this.canvas.getContext(), this.filter)
  }


}

class Brush {
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

class Canvas {
  constructor() {
    this.canvas;
    this.ctx;
    this.setupCanvas(); 
    this.setupResizeHandler();
  }
  
  setupCanvas() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.canvas.width = window.innerWidth - parseInt(getComputedStyle(document.body).getPropertyValue('--tools-menu-width'));
    this.canvas.height = window.innerHeight - parseInt(getComputedStyle(document.body).getPropertyValue('--top-menu-height'));
  }

  resizeCanvas() {
    const snapshot = this.canvas.toDataURL();
    this.canvas.width = window.innerWidth - parseInt(getComputedStyle(document.body).getPropertyValue('--tools-menu-width'));
    this.canvas.height = window.innerHeight - parseInt(getComputedStyle(document.body).getPropertyValue('--top-menu-height'));
    (() => {
      var img = new Image();
      img.onload = function(){
        this.ctx.drawImage(img, 0, 0);
      };
      img.src = snapshot;
  })()
  }
  
  setupResizeHandler() {
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  getImageData() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    return imageData
  }
  getContext() {
    return this.ctx;
  }
  getCanvas() {
    return this.canvas;
  }

  
}

class Filter {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
  }

  grayscale() {
    const { tempImageData, data, tempData } = this.generateImageData();

    for (let i = 0; i < data.length; i += 4) {
      tempData[i] = data[i] * 0.3;          // Red component
      tempData[i + 1] = data[i + 1] * 0.6;  // Green component
      tempData[i + 2] = data[i + 2] * 0.1;  // Blue component
      tempData[i + 3] = data[i + 3];        // Alpha component
    }
    
    this.applyFilterToCurrentCanvas(tempImageData);
  }

  negative() {
    const { tempImageData, data, tempData } = this.generateImageData();
    console.log(data);

    for (let i = 0; i < data.length; i += 4) {
      tempData[i] = 255 - data[i];          // Red component
      tempData[i + 1] = 255 - data[i + 1];  // Green component
      tempData[i + 2] = 255 - data[i + 2];  // Blue component
      tempData[i + 3] = data[i + 3];        // Alpha component
    }
    
    this.applyFilterToCurrentCanvas(tempImageData);
  }

  applyFilterToCurrentCanvas(newImageData) {
    this.ctx.putImageData(newImageData, 0, 0);
  }

  generateImageData() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const tempImageData = new ImageData(this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const tempData = tempImageData.data;

    return tempImageData, data, tempData
  }
}

class Menu {
  constructor(canvas, context, filter) {
    this.canvas = canvas;
    this.ctx = context;
    this.filter = filter;

    this.setupMenu();
  }

  setupMenu() {
    this.setupEventListenersForTopMenu();
    this.setupEventListenersForToolsMenu();
  }
  
  setupEventListenersForTopMenu() {
    const loadImageBtn = document.getElementById('load-image-btn');
    loadImageBtn.addEventListener('click', () => this.loadImage());
  }

  setupEventListenersForToolsMenu() {
    const negativeBtn = document.getElementById('negative-filter-btn');
    negativeBtn.addEventListener('click', () => this.filter.negative());

    const grayscaleBtn = document.getElementById('negative-filter-btn');
    grayscaleBtn.addEventListener('click', () => this.filter.grayscale());
  }

  loadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  
}

window.onload = function() {
  const app = new App();
};
