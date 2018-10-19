const fs = require("fs");

function Core() {};

Core.config = {};
Core._uiSelect = {
  transcodeFormat: ""
};

Core.preStart = function(data) {
  this.dirs = data.dirs;

  this.start();
};

Core.start = function() {
  this.initHTML();
  this.loadConfig()
  .catch((err) => { console.error(err); })
  .then((config) => {
    this.parseConfig(config);
  });
};

Core.initHTML = function() {
  // Control groups
  $(".controlgroup").controlgroup();
  // Progress bar
  let progressBar = $("#progressbar");
  let progressBarLabel = $("#progressbar_label");
  progressBar.progressbar({
    max: 1000,
    value: false
  });
  progressBarLabel.text("Idle");
  // Download button
  $("#download_from_yt").on("click", (ev) => {
    let subElem = $("#download_from_yt_list");
    let url = subElem.val();
    subElem.val("");
    TaskManager.addTask({
      type: Task.TYPE_DOWNLOAD,
      metadata: {
        url: url
      }
    });
  });
  // Transcode button
  $("#transcode").on("click", (ev) => {
    TaskManager.addTask({
      type: Task.TYPE_TRANSCODE,
      metadata: {
        formatKey: this._uiSelect.transcodeFormat
      }
    });
  });
  // Start tasks button
  $("#start_tasks").on("click", (ev) => {
    TaskManager.startAllTasks();
  });
};

Core.loadConfig = function() {
  return new Promise((resolve, reject) => {
    fs.readFile(this.dirs.appRoot + "/config.json", (err, data) => {
      if(err) {
        reject(err);
      }
      else {
        this.config = JSON.parse(data.toString());
        resolve(this.config);
      }
    });
  });
};

Core.parseConfig = function(config) {
  // Create FFMPEG tasks
  let containerElem = $("#transcode_formats");
  let lastOptGroup;
  for(let a = 0;a < config.convert.length;a++) {
    let obj = config.convert[a];
    // Category
    if(typeof obj === "string") {
      lastOptGroup = $("<optgroup label=\"" + obj + "\">");
      containerElem.append(lastOptGroup);
    }
    else if (lastOptGroup != null) {
      if(!this._uiSelect.transcodeFormat) {
        this._uiSelect.transcodeFormat = obj.key;
      }
      let elem = $("<option value=\"" + obj.key + "\">" + obj.name + "</option>");
      lastOptGroup.append(elem);
    }
  }
  containerElem.selectmenu({
    select: (ev, ui) => {
      this._uiSelect.transcodeFormat = ui.item.value;
    }
  });
};

module.exports = Core;

const Task = require("./basic/task");
const TaskManager = require("./managers/task");
