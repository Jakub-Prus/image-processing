const CORRECTIONSENUM = {
  brightness: 'brightness',
  contrast: 'contrast',
  gamma: 'gamma',

}

class App {
  constructor() {
    this.canvas = new Canvas();
    this.brush = new Brush(this.canvas.getCanvas(), this.canvas.getContext());
    this.filter = new Filter(this.canvas, this.canvas.getContext())
    this.menu = new Menu(this.canvas, this.canvas.getContext(), this.filter)
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
    this.originalImageData = null;
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
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0);
      };
      img.src = snapshot;
  })()
  }
  
  setupResizeHandler() {
    window.addEventListener('resize', this.resizeCanvas());
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
          this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }
}

class Filter {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.corrections = {
      brightness: 0,
      contrast: 0,
      gamma: 0,
    }
  }

  grayscale() {
    const { tempImageData, data, tempData } = this.generateImageData();

    for (let i = 0; i < data.length; i += 4) {
      const grayscaleValue = 0.299 * data[i] +  0.587 * data[i + 1] + 0.114 * data[i + 2];
      tempData[i] = grayscaleValue;          // Red component
      tempData[i + 1] = grayscaleValue;  // Green component
      tempData[i + 2] = grayscaleValue;  // Blue component
      tempData[i + 3] = data[i + 3];        // Alpha component
    }
    
    this.applyFilterToCurrentCanvas(tempImageData);
  }

  negative() {
    const { tempImageData, data, tempData } = this.generateImageData();

    for (let i = 0; i < data.length; i += 4) {
      tempData[i] = 255 - data[i];          // Red component
      tempData[i + 1] = 255 - data[i + 1];  // Green component
      tempData[i + 2] = 255 - data[i + 2];  // Blue component
      tempData[i + 3] = data[i + 3];        // Alpha component
    }
    
    this.applyFilterToCurrentCanvas(tempImageData);
  }

  applyCorrections() {
    const originalImageData = this.canvas.originalImageData.data;
    const { tempImageData, data, tempData } = this.generateImageData();
    
    const lookUpTable = this.createLookUpTable(this.corrections);

    for (let i = 0; i < data.length; i += 4) {
      tempData[i] = lookUpTable[originalImageData[i]];           // Red component
      tempData[i + 1] = lookUpTable[originalImageData[i + 1]];   // Green component
      tempData[i + 2] = lookUpTable[originalImageData[i + 2]];   // Blue component
      tempData[i + 3] = lookUpTable[originalImageData[i + 3]];   // Alpha component
    }
    
    this.applyFilterToCurrentCanvas(tempImageData);
  }

  applyFilterToCurrentCanvas(newImageData) {
    this.ctx.putImageData(newImageData, 0, 0);
  }

  createLookUpTable(values) {
    console.log('values', values)
    const lookUpTable = new Uint8ClampedArray(Array.from({ length: 256 }, (_, index) => index));
    console.log('lookUpTable', lookUpTable)
    let modifiedLookUpTable = [];

    for (const [operation, value] of Object.entries(values)) {
      console.log(`${operation}: ${value}`);
      if(value === 0) continue;
      switch (operation) {
        case CORRECTIONSENUM.brightness:
          if(modifiedLookUpTable.length === 0){
            modifiedLookUpTable = lookUpTable.map(lookUpTableValue => {
              const newValue = lookUpTableValue + value;
              return newValue
            });
          } else {
            modifiedLookUpTable = modifiedLookUpTable.map(lookUpTableValue => {
              const newValue = lookUpTableValue + value;
              return newValue
            });
          }
          break;
        case CORRECTIONSENUM.contrast:
          if(modifiedLookUpTable.length === 0){
            modifiedLookUpTable = lookUpTable.map(lookUpTableValue => {
              const newValue = lookUpTableValue * (value);
              return newValue
            });
          } else {
            modifiedLookUpTable = modifiedLookUpTable.map(lookUpTableValue => {
              const newValue = lookUpTableValue * (value);
              return newValue
            });
          }
          break;
        case CORRECTIONSENUM.gamma:
          if(modifiedLookUpTable.length === 0){
            modifiedLookUpTable = lookUpTable.map(lookUpTableValue => {
              const newValue = Math.pow(lookUpTableValue, value);
              console.log('newValue', newValue)
              return newValue // TODO check if it even works
            });
          } else {
            modifiedLookUpTable = modifiedLookUpTable.map(lookUpTableValue => {
              const newValue = Math.pow(lookUpTableValue, value);
              console.log('newValue', newValue)
              return newValue // TODO check if it even works
            });
          }
          break;
            
        default:
          break;
      }
    }
    console.log('modifiedLookUpTable', modifiedLookUpTable)
    return modifiedLookUpTable.map(x => parseInt(x))
  }

  generateImageData() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.getCanvas().width, this.canvas.getCanvas().height);
    const tempImageData = new ImageData(this.canvas.getCanvas().width, this.canvas.getCanvas().height);
    const data = imageData.data;
    const tempData = tempImageData.data;

    return {tempImageData, data, tempData}
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
    this.setupEventListenersForDetailsMenu();
  }
  
  setupEventListenersForTopMenu() {
    const loadImageBtn = document.getElementById('load-image-btn');
    loadImageBtn.addEventListener('click', () => {
      this.canvas.loadImage();
      this.defaultStateOfCorrections()
    });
  }

  setupEventListenersForToolsMenu() {
    const negativeBtn = document.getElementById('negative-filter-btn');
    negativeBtn.addEventListener('click', () => this.filter.negative());

    const grayscaleBtn = document.getElementById('grayscale-filter-btn');
    grayscaleBtn.addEventListener('click', () => this.filter.grayscale());
  }

  setupEventListenersForDetailsMenu() {
    const brightnessRange = document.getElementById('brightness-range');
    const brightnessValue = document.getElementById('brightness-value');
    brightnessValue.textContent = brightnessRange.value;
    brightnessRange.addEventListener("input", (event) => {
      brightnessValue.textContent = event.target.value;
    });

    brightnessRange.addEventListener("change", (event) => {
      this.filter.corrections.brightness = parseFloat(event.target.value);
      this.filter.applyCorrections();
    });


    const contrastRange = document.getElementById('contrast-range');
    const contrastValue = document.getElementById('contrast-value');
    contrastValue.textContent = contrastRange.value;
    contrastRange.addEventListener("input", (event) => {
      contrastValue.textContent = event.target.value;
    });

    contrastRange.addEventListener("change", (event) => {
      this.filter.corrections.contrast = parseFloat(event.target.value);
      this.filter.applyCorrections();
    });

    const gammaRange = document.getElementById('gamma-range');
    const gammaValue = document.getElementById('gamma-value');
    gammaValue.textContent = gammaRange.value;
    gammaRange.addEventListener("input", (event) => {
      gammaValue.textContent = event.target.value;
    });

    gammaRange.addEventListener("change", (event) => {
      this.filter.corrections.gamma = parseFloat(event.target.value);
      this.filter.applyCorrections();
    });
  }

  defaultStateOfCorrections() {
    document.getElementById('brightness-range').value = 0;
    document.getElementById('brightness-value').textContent = 0;

    document.getElementById('contrast-range').value = 1;
    document.getElementById('contrast-value').textContent = 1;

    document.getElementById('gamma-range').value = 1;
    document.getElementById('gamma-value').textContent = 1;

    for (const key in this.filter.corrections) {
      if (Object.hasOwnProperty.call(this.filter.corrections, key)) {
        this.filter.corrections[key] = 0;
      }
    }    
  }


  
}

window.onload = function() {
  const app = new App();
};


const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};