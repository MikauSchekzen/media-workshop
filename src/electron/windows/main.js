const Window_Base = require("./_base");

function Window_Main() { this.initialize.apply(this, arguments); };

Window_Main.prototype = Object.create(Window_Base.prototype);
Window_Main.prototype.constructor = Window_Main;

Window_Main.prototype.initialize = function() {
  Window_Base.prototype.initialize.call(this, {
    width: 800,
    height: 600
  });
  // this.centerPrimary();
  this.window.setMenu(null);
  this.window.loadURL("file://" + global.appRoot + "/index.html");
  this.window.maximize();
};

module.exports = Window_Main;
