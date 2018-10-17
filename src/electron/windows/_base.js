const BrowserWindow = require("electron").BrowserWindow;

function Window_Base() { this.initialize.apply(this, arguments); };

Window_Base.prototype.initialize = function(options) {
  this.window = new BrowserWindow(options);
};

Window_Base.prototype.centerPrimary = function() {
  const screen = require("electron").screen;
  let workArea = screen.getPrimaryDisplay().workArea;
  let size = this.window.getSize();
  this.window.setPosition(
    Math.floor(workArea.x + workArea.width / 2 - size[0] / 2),
    Math.floor(workArea.y + workArea.height / 2 - size[1] / 2)
  );
};

module.exports = Window_Base;
