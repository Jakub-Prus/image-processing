
export default class Menu {
    constructor(mainCanvas, context, filter, histogram) {
      this.mainCanvas = mainCanvas;
      this.ctx = context;
      this.filter = filter;
      this.histogram = histogram;
      this.detailsVisible = false;
      this.histogramVisible = false;
  
      this.setupMenu();
    }
  
    setupMenu() {
      this.setupEventListenersForTopMenu();
      this.setupEventListenersForToolsMenu();
      this.setupEventListenersForDetailsMenu();
      this.setupEventListenersForHistogram()
    }
    
    setupEventListenersForTopMenu() {
      const loadImageBtn = document.getElementById('load-image-btn');
      loadImageBtn.addEventListener('click', () => {
        this.mainCanvas.loadImage();
        this.defaultStateOfCorrections()
      });
    }
  
    setupEventListenersForToolsMenu() {
      const negativeBtn = document.getElementById('negative-filter-btn');
      negativeBtn.addEventListener('click', () => this.filter.negative());
  
      const grayscaleBtn = document.getElementById('grayscale-filter-btn');
      grayscaleBtn.addEventListener('click', () => this.filter.grayscale());

      const correctionBtn = document.getElementById('correction-filter-btn');
      const correctionMenu = document.getElementById('correction-details');
      correctionBtn.addEventListener('click', () => {
        this.detailsVisible = !this.detailsVisible;
        correctionMenu.style.display = this.detailsVisible ? 'block' : 'none';
      });

      const histogramBtn = document.getElementById('histogram-btn');
      const histogram = document.getElementById('histogram');
      histogramBtn.addEventListener('click', () => {
        this.histogramVisible = !this.histogramVisible;
        histogram.style.display = this.histogramVisible ? 'flex' : 'none';
        this.histogram.update([]);
      });
      const strechingBtn = document.getElementById('histogram-streching-btn');
      strechingBtn.addEventListener('click', () => {
        if(this.histogramVisible) this.histogram.stretching();
      });
    }

    setupEventListenersForHistogram() {
      const channelButtons = document.querySelectorAll('.channelButton');

      channelButtons.forEach(button => {
        button.addEventListener('click', () => {
          const channel = button.getAttribute('data-channel');
          const isClicked = button.classList.contains('clicked');
          
          if (isClicked) {
            button.classList.remove('clicked');
          } else {
            button.classList.add('clicked');
          }

    // Get all clicked buttons
    const clickedButtons = Array.from(channelButtons).filter(btn => btn.classList.contains('clicked'));
    // Extract channels from clicked buttons
    const avoidedChannels = clickedButtons.map(btn => btn.getAttribute('data-channel'));

    // Update histogram
    console.log('avoidedChannels', avoidedChannels)
    this.histogram.update(avoidedChannels);
  });
});

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