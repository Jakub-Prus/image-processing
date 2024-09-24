import MainCanvas from './mainCanvas';
import Filter from './filter';
import Menu from './menu';
import Histogram from './histogram';
import Transformation from './transformation';
import Wasm from './wasm';

class App {
  mainCanvas: MainCanvas;
  wasm: Wasm;
  // brush: Brush;
  filter: Filter;
  histogram: Histogram;
  transformation: Transformation;
  menu: Menu;

  constructor() {
    this.mainCanvas = new MainCanvas();
    this.wasm = new Wasm(this.mainCanvas);
    // this.brush = new Brush(this.mainCanvas.canvas);
    this.filter = new Filter(this.mainCanvas);
    this.histogram = new Histogram(this.mainCanvas);
    this.transformation = new Transformation(this.mainCanvas, this.histogram);
    this.menu = new Menu(
      this.mainCanvas,
      this.filter,
      this.histogram,
      this.transformation,
      this.wasm,
    );
  }
}

window.onload = function () {
  const app = new App();
  (window as any).app = app; // Debug
};
