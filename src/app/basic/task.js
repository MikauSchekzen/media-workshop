const Core = require("../core");
const spawn = require("child_process").spawn;

function Task() { this.initialize.apply(this, arguments); };

Task.TYPE_NONE = 0;
Task.TYPE_DOWNLOAD = 1;
Task.TYPE_CONVERT = 2;
Task.TYPE_MUX = 3;

/**
 * @param {Object} options - Can have the following properties:
 * type: one of Task.TYPE_* constants
 * metadata: metadata to add to the task
 */
Task.prototype.initialize = function(options) {
  this.type = options.type || Task.TYPE_NONE;
  this.metadata = options.metadata || {};
  this.elem = null;
  this.running = false;
};

Task.prototype.start = function() {
  this.running = true;
  if(this.type === Task.TYPE_NONE) {
    this.end();
  }
  else if(this.type === Task.TYPE_DOWNLOAD) {
    this.startDownload();
  }
};

Task.prototype.startDownload = function() {
  let args = Core.config.download.args;
  for(let a = 0;a < args.length;a++) {
    let arg = args[a];
    arg = arg.replace("%i", this.metadata.url);
    args[a] = arg;
  }
  // Spawn process
  TaskManager.setProgressLabel("Downloading...");
  let proc = spawn("youtube-dl", args);
  proc.stdout.on("data", (data) => {
    let str = data.toString();
    if(str.match(/\[download\]\s+([0-9]+\.[0-9]+)%.*/)) {
      let value = Math.floor(parseFloat(RegExp.$1) * 10);
      TaskManager.setProgressValue(value);
    }
  });
  proc.on("close", () => {
    this.end();
  });
};

Task.prototype.remove = function() {
  TaskManager.removeTask(this);
};

Task.prototype.end = function() {
  TaskManager.setProgressValue(false);
  TaskManager.setProgressLabel("");
  this.remove();
  TaskManager.startNextTask();
};

Task.prototype.isRunning = function() {
  return this.running;
};

module.exports = Task;

const TaskManager = require("../managers/task");
