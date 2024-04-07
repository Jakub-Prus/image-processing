import MainCanvas from "./mainCanvas.js";
import Brush from "./brush.js";
import Filter from "./filter.js";
import Menu from "./menu.js";
import Histogram from "./histogram.js";
import Transformations from "./transformations.js";


class App {
  constructor() {
    this.mainCanvas = new MainCanvas();
    this.brush = new Brush(this.mainCanvas.canvas);
    this.filter = new Filter(this.mainCanvas)
    this.histogram = new Histogram(this.mainCanvas);
    this.transformations = new Transformations(this.mainCanvas, this.histogram);
    this.menu = new Menu(this.mainCanvas, this.filter, this.histogram, this.transformations);
  }
}


window.onload = function() {
  const app = new App();
};
