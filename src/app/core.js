const fs = require("fs");
const glob = require("glob");
const path = require("path");
global.requireBase = function(name) { return require(Core.dirs.appRoot + "/src/app/" + name); };
global.DataManager = require("./managers/data");

function Core() {};

Core.config = {};
Core._uiSelect = {
  transcodeFormat: ""
};
Core.dirs = {};

Core.preStart = function(data) {
  this.dirs = data.dirs;

  // Create primary directories
  this.createPrimaryDirectories()
  .catch((err) => { console.error(err); })
  .then(() => { this.start(); });
};

Core.createPrimaryDirectories = function() {
  return new Promise((resolve, reject) => {
    fs.mkdir(this.dirs.appRoot + "/input", {}, (err) => {
      if(err && err.code !== "EEXIST") reject(err);
      else {
        fs.mkdir(this.dirs.appRoot + "/output", {}, (err) => {
          if(err && err.code !== "EEXIST") reject(err);
          else resolve();
        });
      }
    });
  });
};

Core.start = function() {
  this.loadConfig()
  .catch((err) => { console.error(err); })
  .then((config) => {
    this.parseConfig(config);
    this.loadTasks()
    .catch((err) => { console.error(err); })
    .then(() => {
      this.initHTML();
    });
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
  // Download button
  $("#download_from_yt").on("click", (ev) => {
    let subElem = $("#download_from_yt_list");
    let url = subElem.val();
    subElem.val("");
    TaskManager.addTask({
      type: "download",
      metadata: {
        url: url
      }
    });
  });
  // Transcode button
  $("#transcode").on("click", (ev) => {
    TaskManager.addTask({
      type: "convert",
      metadata: {
        formatKey: this._uiSelect.transcodeFormat,
        subtype: "transcode"
      }
    });
  });
  // Mux button
  $("#mux").on("click", (ev) => {
    TaskManager.addTask({
      type: "convert",
      metadata: {
        formatKey: this._uiSelect.transcodeFormat,
        subtype: "mux"
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

Core.loadTasks = function() {
  // Load base task
  let tasksRoot = Core.dirs.appRoot + "/tasks";
  require(tasksRoot + "/base.js");
  // Load rest of tasks
  return new Promise((resolve, reject) => {
    glob(tasksRoot + "/*.js", {}, (err, files) => {
      if(err) reject(err);
      else {
        for(let a = 0;a < files.length;a++) {
          let file = files[a];
          if(path.basename(file) !== "base.js") require(file);
        }
        resolve();
      }
    });
  });
};

module.exports = Core;

const Task = require("./basic/task");
const TaskManager = require("./managers/task");
