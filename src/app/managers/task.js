const Task = require("../basic/task");

function TaskManager() {};

TaskManager._tasks = [];

TaskManager.addTask = function(options) {
  let task = new Task(options);
  this._tasks.push(task);
  // Add to queue list
  let queueList = $("#queue_list");
  let elem = $("<li class=\"queue_list_item\">" + this.getLabelForTask(task) + "</li>");
  queueList.append(elem);
  task.elem = elem;
};

TaskManager.isBusy = function() {
  if(this._tasks.length === 0) return false;
  return this._tasks[0].isRunning();
};

TaskManager.startNextTask = function() {
  if(this._tasks.length === 0) return;
  let task = this._tasks[0];
  task.start();
};

TaskManager.startAllTasks = function() {
  if(this.isBusy()) return;
  this.startNextTask();
};

TaskManager.removeTask = function(task) {
  for(let a = 0;a < this._tasks.length;a++) {
    let testTask = this._tasks[a];
    if(testTask === task) {
      this._tasks.splice(a, 1);
      task.elem.remove();
      break;
    }
  }
};

TaskManager.getLabelForTask = function(task) {
  if(task.type === Task.TYPE_NONE) {
    return "Do nothing";
  }
  else if(task.type === Task.TYPE_DOWNLOAD) {
    return "Download: " + task.metadata.url;
  }
  return "N/A";
};

TaskManager.setProgressLabel = function(value) {
  $("#progressbar_label").text(value);
};

TaskManager.setProgressValue = function(value) {
  $("#progressbar").progressbar("value", value);
};

module.exports = TaskManager;
