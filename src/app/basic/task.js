const Core = require("../core");
const spawn = require("child_process").spawn;

function Task() { this.initialize.apply(this, arguments); };

Task.TYPE_NONE = 0;
Task.TYPE_DOWNLOAD = 1;
Task.TYPE_TRANSCODE = 2;
Task.TYPE_MUX = 3;

/**
 * @param {Object} options - Can have the following properties:
 * type: one of Task.TYPE_* constants
 * metadata: metadata to add to the task
 */
Task.prototype.initialize = function(options) {
  this.type = options.type || "base";
  this.metadata = options.metadata || {};
  this.elem = null;
  this.running = false;
};

Task.prototype.getSource = function() {
  return DataManager.getData("task", this.type);
};

Task.prototype.runScript = function(name) {
  let args = [];
  for(let a = 1;a < arguments.length;a++) {
    args.push(arguments[a]);
  }
  return this.getSource()[name].apply(this, args);
};

Task.prototype.start = function() {
  this.running = true;
  this.runScript("start");
};

Task.prototype.startTranscode = function() {
  let configObj = Core.config.convert.filter((obj) => { return obj.key === this.metadata.formatKey; })[0];
  let args = configObj.transcodeArgs.slice();
  for(let a = 0;a < args.length;a++) {
    // args[a] = args[a].replace("%i", 
  }
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
