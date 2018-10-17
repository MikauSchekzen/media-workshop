const app = require("electron").app;
const Core = require("./src/electron/core");
const path = require("path");

global.appRoot = path.resolve(__dirname);

app.on("ready", () => { Core.start(); });
