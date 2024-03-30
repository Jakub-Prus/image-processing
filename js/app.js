import Canvas from "./canvas.js";
import Brush from "./brush.js";
import Filter from "./filter.js";
import Menu from "./menu.js";

class App {
  constructor() {
    this.canvas = new Canvas();
    this.brush = new Brush(this.canvas.getCanvas(), this.canvas.getContext());
    this.filter = new Filter(this.canvas, this.canvas.getContext())
    this.menu = new Menu(this.canvas, this.canvas.getContext(), this.filter)
  }
}


window.onload = function() {
  const app = new App();
};
