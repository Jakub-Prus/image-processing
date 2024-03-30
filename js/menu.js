export default class Menu {
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