var cliOptions = {
  debugMode: false
};
for(let a = 2;a < process.argv.length;a++) {
  let arg = process.argv[a];
  if(arg.match(/--DEBUG/i)) {
    cliOptions.debugMode = true;
  }
}

var electron = require("electron");  // Module to control application life.
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

ipcMain.on("window", function(event, args) {
  if(args[0].toUpperCase() === "RESIZE" && mainWindow !== null) {
    mainWindow.setSize(args[1], args[2]);
  }
  else if(args[0].toUpperCase() === "CENTER" && mainWindow !== null) {
    mainWindow.center();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  let workArea = electron.screen.getPrimaryDisplay().workArea;
  let w = 1280;
  let h = 720;
  createMainWindow(Math.floor(workArea.x + workArea.width / 2 - w / 2), Math.floor(workArea.y + workArea.height / 2 - h / 2), w, h);
});

function createMainWindow(x, y, width, height) {
  // Create the browser window.
  mainWindow = new BrowserWindow({ x: x, y: y, width: width, height: height });

  // Remove menu
  mainWindow.setMenu(null);

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the devtools.
  mainWindow.webContents.on("devtools-opened", function() {
    mainWindow.focus();
  });
  if(cliOptions.debugMode) mainWindow.webContents.openDevTools({ mode: "detach" });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};
