import MainCanvas from "./canvas.js";
import Brush from "./brush.js";
import Filter from "./filter.js";
import Menu from "./menu.js";
import Histogram from "./histogram.js";


class App {
  constructor() {
    this.mainCanvas = new MainCanvas();
    this.brush = new Brush(this.mainCanvas.canvas, this.mainCanvas.ctx);
    this.filter = new Filter(this.mainCanvas, this.mainCanvas.ctx)
    this.histogram = new Histogram(this.mainCanvas, this.mainCanvas.ctx);
    this.menu = new Menu(this.mainCanvas, this.mainCanvas.ctx, this.filter, this.histogram);
  }
}


window.onload = function() {
  const app = new App();
};
