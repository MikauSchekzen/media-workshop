const app = require("electron").app;
const ipc = require("electron").ipcMain;
const ArgumentManager = require("./managers/argument");

function Core() {};

Core._windows = [];

Core.start = function() {
  // Parse command line arguments
  let args = [];
  for(let a = 2;a < process.argv.length;a++) {
    args.push(process.argv[a]);
  }
  ArgumentManager.parse(args);
  // Initialize inter-process communication
  this.initIPC();
  // Create main window
  this.createMainWindow();

  // Close application after all windows are closed
  app.on("window-all-closed", () => {
    app.quit();
  });
};

Core.initIPC = function() {
  // Event: Window
  ipc.on("window", (ev, args) => {
    let win = this.getWindowByWebContents(ev.sender);
    if(win == null) return;
    // Prestart
    if(args[0] === "prestart") {
      win.window.webContents.send("core", ["prestart", {
        dirs: {
          appRoot: global.appRoot,
          userData: app.getPath("userData")
        }
      }]);
    }
    // Resize window
    if(args[0] === "resize") {
      win.window.setSize(args[1], args[2]);
    }
    // Center window
    else if(args[0] === "center") {
      win.window.center();
    }
  });
};

Core.getWindowByWebContents = function(contents) {
  for(let a = 0;a < this._windows.length;a++) {
    let win = this._windows[a];
    if(win.window.webContents === contents) return win;
  }
  return undefined;
};

Core.addWindow = function(win) {
  if(this._windows.indexOf(win) !== -1) return;
  this._windows.push(win);
  win.window.on("closed", (ev) => {
    this._windows.splice(this._windows.indexOf(win), 1);
  });
};

Core.createMainWindow = function() {
  let winMain = require("./windows/main");
  let win = new winMain();
  if(ArgumentManager.getOption("debug")) this.activateDebugMode(win);
  this.addWindow(win);
};

Core.activateDebugMode = function(win) {
  win.window.webContents.once("devtools-opened", () => {
    win.window.focus();
  });
  win.window.webContents.openDevTools({ mode: "detach" });
};

module.exports = Core;
