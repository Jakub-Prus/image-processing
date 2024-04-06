export default class Canvas {
    constructor() {
      this.canvas;
      this.ctx;
      this.setupCanvas(); 
      this.setupResizeHandler();
      this.originalImageData = null;
      this.isGrayscale = false;
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

    applyImageDataToCurrentCanvas(newImageData) {
      this.ctx.putImageData(newImageData, 0, 0);
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
            this.isGrayscaleFunc(this.originalImageData);
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }

    isGrayscaleFunc(imageData) {
      for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          if (r !== g || r !== b || g !== b) {
            this.isGrayscale = false;
            return
          }
      }
      this.isGrayscale = true; 
      return
  }
  
  }