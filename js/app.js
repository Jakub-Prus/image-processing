import MainCanvas from "./canvas.js";
import Brush from "./brush.js";
import Filter from "./filter.js";
import Menu from "./menu.js";
import Histogram from "./histogram.js";


class App {
  constructor() {
    this.mainCanvas = new MainCanvas();
    this.brush = new Brush(this.mainCanvas.getCanvas(), this.mainCanvas.getContext());
    this.filter = new Filter(this.mainCanvas, this.mainCanvas.getContext())
    this.histogram = new Histogram(this.mainCanvas, this.mainCanvas.getContext());
    this.menu = new Menu(this.mainCanvas, this.mainCanvas.getContext(), this.filter, this.histogram);
  }
}


window.onload = function() {
  const app = new App();
};
