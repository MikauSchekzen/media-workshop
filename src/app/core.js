const fs = require("fs");
const Task = require("./basic/task");
const TaskManager = require("./managers/task");

function Core() {};

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
  let progressBarLabel = $("#progressbar-label");
  progressBar.progressbar({
    value: false
  });
  progressBarLabel.text("Idle");
  // Queue list
  $("#queue_list").selectable();
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
      let elem = $("<option value=\"" + obj.key + "\">" + obj.name + "</option>");
      lastOptGroup.append(elem);
    }
  }
  containerElem.selectmenu();
};

module.exports = Core;
