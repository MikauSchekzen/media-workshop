DataManager.addData("task", Object.assign({}, DataManager.getData("task", "base"), {
  key: "download",
  getLabel: function() {
    return "Download: " + this.metadata.url;
  },
  start: function() {
    const Core = requireBase("core");
    const TaskManager = requireBase("managers/task");
    const spawn = require("child_process").spawn;

    let args = Core.config.download.args.slice();
    for(let a = 0;a < args.length;a++) {
      let arg = args[a];
      arg = arg.replace("%i", this.metadata.url);
      args[a] = arg;
    }
    // Spawn process
    TaskManager.setProgressLabel("Downloading...");
    let proc = spawn("youtube-dl", args);
    let gotData = false;
    proc.stdout.on("data", (data) => {
      let str = data.toString();
      if(str.match(/\[download\]\s+([0-9]+\.[0-9]+)%.*/)) {
        gotData = true;
        let value = Math.floor(parseFloat(RegExp.$1) * 10);
        TaskManager.setProgressValue(value);
      }
    });
    proc.on("close", () => {
      this.end();
    });
  }
}));
