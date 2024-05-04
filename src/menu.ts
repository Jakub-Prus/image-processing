import Filter from './filter';
import Histogram from './histogram';
import MainCanvas from './mainCanvas';
import Transformation from './transformation';
import Wasm from './wasm';

export default class Menu {
  mainCanvas: MainCanvas;
  ctx: CanvasRenderingContext2D;
  filter: Filter;
  histogram: Histogram;
  transformation: Transformation;
  wasm: Wasm;
  detailsVisible: boolean;
  histogramVisible: boolean;

  constructor(
    mainCanvas: MainCanvas,
    filter: Filter,
    histogram: Histogram,
    transformation: Transformation,
    wasm: Wasm,
  ) {
    this.mainCanvas = mainCanvas;
    this.ctx = mainCanvas.ctx;
    this.filter = filter;
    this.histogram = histogram;
    this.transformation = transformation;
    this.wasm = wasm;
    this.detailsVisible = false;
    this.histogramVisible = false;

    this.setupMenu();
  }

  setupMenu() {
    this.setupEventListenersForTopMenu();
    this.setupEventListenersForToolsMenu();
    this.setupEventListenersForDetailsMenu();
    this.setupEventListenersForHistogram();
  }

  setupEventListenersForTopMenu() {
    const loadImageBtn = document.getElementById('load-image-btn')!;
    loadImageBtn.addEventListener('click', () => {
      this.mainCanvas.loadImage();
      this.defaultStateOfCorrections();
    });
  }

  setupEventListenersForToolsMenu() {
    const negativeBtn = document.getElementById('negative-filter-btn')!;
    negativeBtn.addEventListener('click', () => this.filter.negative());

    const grayscaleBtn = document.getElementById('grayscale-filter-btn')!;
    grayscaleBtn.addEventListener('click', () => this.filter.grayscale());

    const correctionBtn = document.getElementById('correction-filter-btn')!;
    const correctionMenu = document.getElementById('correction-details')!;
    correctionBtn.addEventListener('click', () => {
      this.detailsVisible = !this.detailsVisible;
      correctionMenu.style.display = this.detailsVisible ? 'block' : 'none';
    });

    const histogramBtn = document.getElementById('histogram-btn')!;
    const histogram = document.getElementById('histogram')!;
    histogramBtn.addEventListener('click', () => {
      this.histogramVisible = !this.histogramVisible;
      histogram.style.display = this.histogramVisible ? 'flex' : 'none';
      this.histogram.update([]);
    });

    const strechingBtn = document.getElementById('histogram-streching-btn')!;
    strechingBtn.addEventListener('click', () => {
      if (this.histogramVisible) this.transformation.histogramStreching();
    });

    const equalizationBtn = document.getElementById('histogram-equalization-btn')!;
    equalizationBtn.addEventListener('click', () => {
      if (this.histogramVisible) this.transformation.histogramEqualization();
    });

    const blurBtn = document.getElementById('blur-btn')!;
    blurBtn.addEventListener('click', () => {
      this.wasm.blur();
    });
    const gaussianBlurBtn = document.getElementById('gaussian-blur-btn')!;
    gaussianBlurBtn.addEventListener('click', () => {
      this.wasm.gaussianBlur();
    });
    const linearBlurBtn = document.getElementById('linear-blur-btn')!;
    linearBlurBtn.addEventListener('click', () => {
      this.wasm.linearBlur();
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
        const clickedButtons = Array.from(channelButtons).filter(btn =>
          btn.classList.contains('clicked'),
        );
        // Extract channels from clicked buttons, filtering out null values
        const avoidedChannels = clickedButtons
          .map(btn => btn.getAttribute('data-channel'))
          .filter(channel => channel !== null) as string[];

        // Update histogram
        console.log('avoidedChannels', avoidedChannels);
        this.histogram.update(avoidedChannels);
      });
    });
  }

  setupEventListenersForDetailsMenu() {
    const brightnessRange = document.getElementById('brightness-range') as HTMLInputElement;
    const brightnessValue = document.getElementById('brightness-value');
    if (brightnessValue) {
      brightnessValue.textContent = brightnessRange.value;
    }
    brightnessRange.addEventListener('input', event => {
      if (brightnessValue) {
        brightnessValue.textContent = (event.target as HTMLInputElement).value;
      }
    });

    brightnessRange.addEventListener('change', event => {
      this.filter.corrections.brightness = parseFloat((event.target as HTMLInputElement).value);
      this.filter.applyCorrections();
    });

    const contrastRange = document.getElementById('contrast-range') as HTMLInputElement;
    const contrastValue = document.getElementById('contrast-value');
    if (contrastValue) {
      contrastValue.textContent = contrastRange.value;
    }
    contrastRange.addEventListener('input', event => {
      if (contrastValue) {
        contrastValue.textContent = (event.target as HTMLInputElement).value;
      }
    });

    contrastRange.addEventListener('change', event => {
      this.filter.corrections.contrast = parseFloat((event.target as HTMLInputElement).value);
      this.filter.applyCorrections();
    });

    const gammaRange = document.getElementById('gamma-range') as HTMLInputElement;
    const gammaValue = document.getElementById('gamma-value');
    if (gammaValue) {
      gammaValue.textContent = gammaRange.value;
    }
    gammaRange.addEventListener('input', event => {
      if (gammaValue) {
        gammaValue.textContent = (event.target as HTMLInputElement).value;
      }
    });

    gammaRange.addEventListener('change', event => {
      this.filter.corrections.gamma = parseFloat((event.target as HTMLInputElement).value);
      this.filter.applyCorrections();
    });
  }

  defaultStateOfCorrections() {
    (document.getElementById('brightness-range') as HTMLInputElement).value = '0';
    (document.getElementById('brightness-value') as HTMLElement).textContent = '0';

    (document.getElementById('contrast-range') as HTMLInputElement).value = '1';
    (document.getElementById('contrast-value') as HTMLElement).textContent = '1';

    (document.getElementById('gamma-range') as HTMLInputElement).value = '1';
    (document.getElementById('gamma-value') as HTMLElement).textContent = '1';

    for (const key in this.filter.corrections) {
      if (Object.hasOwnProperty.call(this.filter.corrections, key)) {
        this.filter.corrections[key as keyof typeof this.filter.corrections] = 0;
      }
    }
  }
}
