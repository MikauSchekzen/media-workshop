const Core = requireBase("core");
const TaskManager = requireBase("managers/task");
const path = require("path");
const glob = require("glob");
const spawn = require("child_process").spawn;

DataManager.addData("task", Object.assign({}, DataManager.getData("task", "base"), {
  key: "convert",
  getLabel: function() {
    let configObj = this.runScript("getConvertConfig");
    if(this.metadata.subtype === "transcode") return "Transcode to " + configObj.name;
    else if(this.metadata.subtype === "mux") return "Mux to " + configObj.name;
    return "Convert(?) to " + configObj.name;
  },
  getConvertConfig: function() {
    for(let a = 0;a < Core.config.convert.length;a++) {
      let obj = Core.config.convert[a];
      if(typeof obj === "string") continue;
      if(obj.key === this.metadata.formatKey) return obj;
    }
    return null;
  },
  start: function() {
    glob(Core.dirs.appRoot + "/input/*", {}, (err, files) => {
      if(err) console.error(err);
      else {
        this.runScript("startNext", files, 0);
      }
    });
  },
  startNext: function(files, index) {
    if(index >= files.length) {
      this.end();
      return;
    }
    let file = files[index];
    let configObj = this.runScript("getConvertConfig");
    let args;
    if(this.metadata.subtype === "transcode") args = configObj.transcodeArgs.slice();
    else if(this.metadata.subtype === "mux") args = configObj.muxArgs.slice();
    for(let a = 0;a < args.length;a++) {
      args[a] = args[a].replace("%i", file);
      args[a] = args[a].replace("%o", Core.dirs.appRoot + "/output/" + path.basename(file, path.extname(file)));
    }
    let proc = spawn("ffmpeg", args);
    proc.on("close", () => {
      this.runScript("startNext", files, index + 1);
    });
    // Set progress label
    let filename = path.basename(file);
    if(this.metadata.subtype === "transcode") {
      TaskManager.setProgressLabel("Transcoding " + filename + " to " + configObj.name);
    }
    else if(this.metadata.subtype === "mux") {
      TaskManager.setProgressLabel("Muxing " + filename + " to " + configObj.name);
    }
  }
}));
