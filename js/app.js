import Canvas from "./canvas.js";
import Brush from "./brush.js";
import Filter from "./filter.js";
import Menu from "./menu.js";
import Histogram from "./histogram.js";


class App {
  constructor() {
    this.canvas = new Canvas();
    this.brush = new Brush(this.canvas.getCanvas(), this.canvas.getContext());
    this.filter = new Filter(this.canvas, this.canvas.getContext())
    this.histogram = new Histogram(this.canvas);
    this.menu = new Menu(this.canvas, this.canvas.getContext(), this.filter, this.histogram);
  }
}


window.onload = function() {
  const app = new App();
};
