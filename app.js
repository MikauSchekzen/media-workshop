const Core = require("./src/app/core");
const ipc = require("electron").ipcRenderer;
// Include jQuery UI
global.$ = global.jQuery = require("./src/shared/jquery-3.3.1.min");
require("./src/shared/jquery-ui-1.12.1/jquery-ui.min");

window.addEventListener("load", () => {
  ipc.send("window", ["prestart"]);
});

ipc.on("core", (ev, args) => {
  if(args[0] === "prestart") {
    let preStartData = args[1];
    Core.preStart(preStartData);
  }
});
