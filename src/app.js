var fs = require("fs");
var path = require("path");
var glob = require("glob");
var spawn = require("child_process").spawn;


//==============================================================================
// Core
//==============================================================================

function Core() {}

Core.tasks = [];

Core.init = function() {
  this.createBaseFolders();
  this.loadConfig();
  this.initDocument();

  this.running = false;
}

Core.getConverter = function(key) {
  for(var a = 0;a < this.config.convert.length;a++) {
    var obj = this.config.convert[a];
    if(typeof obj === "object" && obj.key && obj.key === key) {
      return obj;
    }
  }
  return null;
}

Core.loadConfig = function() {
  this.config = JSON.parse(fs.readFileSync("conf.json"));
}

Core.createBaseFolders = function() {
  try {
    fs.mkdirSync("input");
  } catch(e) {}
  try {
    fs.mkdirSync("output");
  } catch(e) {}
}

Core.initDocument = function() {
  // Populate queue
  // var elem = document.getElementById("queue_list");
  // var len = parseInt(elem.size);
  // while(elem.children.length < len) {
  //   var newElem = document.createElement("option");
  //   newElem.className = "queue_item";
  //   elem.appendChild(newElem);
  // }
  // Populate convertion list
  var elem = document.getElementById("transcode_formats");
  for(var a = 0;a < this.config.convert.length;a++) {
    var obj = this.config.convert[a];
    var newElem = document.createElement("option");
    if(typeof obj === "object") {
      newElem.innerHTML = obj.name;
      newElem.value = obj.key;
    }
    else if(typeof obj === "string") {
      newElem.innerHTML = obj;
    }
    elem.appendChild(newElem);
  }
}

Core.addTask = function(type) {
  if((type === Task.TYPE_TRANSCODE || type === Task.TYPE_MUX) && !this.getCurrentConverterKey()) {
    return;
  }
  var value = this.getTaskValue(type);
  var task = new Task(type, value);
  this.pushTask(task);
}

Core.pushTask = function(task) {
  this.tasks.push(task);
  var elem = document.getElementById("queue_list");
  var newElem = document.createElement("option");
  newElem.className = "queue_item";
  elem.appendChild(newElem);
  task.queueItem = newElem;
  task.refreshQueueItem();
}

Core.getTaskValue = function(type) {
  if(type === Task.TYPE_DOWNLOAD) {
    var elem = document.getElementById("download_from_yt_list");
    var value = elem.value;
    elem.value = "";
    return value;
  }
  else if(type === Task.TYPE_TRANSCODE || type === Task.TYPE_MUX) {
    return this.getCurrentConverterKey();
  }
  return null;
}

Core.startTasks = function() {
  if(!this.running) {
    this.performTask();
  }
}

Core.performTask = function() {
  if(this.tasks.length > 0) {
    this.running = true;
    var task = this.tasks[0];
    task.start();
  }
}

Core.getCurrentConverterKey = function() {
  var elem = document.getElementById("transcode_formats");
  var option = elem.options[elem.selectedIndex];
  if(option.value && this.getConverter(option.value)) {
    return option.value;
  }
  return null;
}


//==============================================================================
// Task
//==============================================================================

function Task() {
  this.init.apply(this, arguments);
}

Task.TYPE_DOWNLOAD  = 0;
Task.TYPE_TRANSCODE = 1;
Task.TYPE_MUX       = 2;


Task.prototype.init = function(type, value) {
  if(!value) value = "";
  this.initMembers();
  this.type = type;
  this.value = value;
}

Task.prototype.initMembers = function() {
  this.type = Task.TYPE_TRANSCODE;
  this.value = "";
  this.queueItem = null;
}

Task.prototype.start = function() {
  var taskElem = document.getElementById("progresstask");
  if(this.type === Task.TYPE_TRANSCODE || this.type === Task.TYPE_MUX) {

    glob("input/*", {}, function(err, files) {
      this.files = files;
      console.log(files);
      this.convert();
    }.bind(this));
  }
  else if(this.type === Task.TYPE_DOWNLOAD) {
    taskElem.value = "Downloading";
    var app = spawn(this.getApp(), this.getArgsProcessed());
    this.addAppHandling(app);
  }
}

Task.prototype.convert = function() {
  if(this.files.length > 0) {
    var file = this.files.shift();
    var taskElem = document.getElementById("progresstask");
    var itemElem = document.getElementById("progressitem");

    if(this.type === Task.TYPE_TRANSCODE) taskElem.value = "Transcoding";
    else if(this.type === Task.TYPE_MUX) taskElem.value = "Muxing";
    itemElem.value = file;

    var name = path.basename(file, path.extname(file));
    var app = spawn(this.getApp(), this.getArgsProcessed(file, "output/" + name));
    this.addAppHandling(app);
  }
  else {
    var oldTask = Core.tasks.shift();
    oldTask.removeQueueItem();
    Core.running = false;
    Core.performTask();
  }
}

Task.prototype.getApp = function() {
  if(this.type === Task.TYPE_TRANSCODE || this.type === Task.TYPE_MUX) {
    return "ffmpeg";
  }
  else if(this.type === Task.TYPE_DOWNLOAD) {
    return "youtube-dl";
  }
  return null;
}

Task.prototype.refreshQueueItem = function() {
  if(this.type === Task.TYPE_DOWNLOAD) {
    this.queueItem.innerHTML = "Download: " + this.value;
  }
  else if(this.type === Task.TYPE_TRANSCODE) {
    this.queueItem.innerHTML = "Transcode to: " + this.value;
  }
  else if(this.type === Task.TYPE_MUX) {
    this.queueItem.innerHTML = "Mux to: " + this.value;
  }
}

Task.prototype.removeQueueItem = function() {
  this.queueItem.parentNode.removeChild(this.queueItem);
}

Task.prototype.getArgs = function() {
  if(this.type === Task.TYPE_TRANSCODE) {
    var obj = Core.getConverter(this.value);
    if(obj.transcodeArgs) return obj.transcodeArgs;
  }
  else if(this.type === Task.TYPE_MUX) {
    var obj = Core.getConverter(this.value);
    if(obj.muxArgs) return obj.muxArgs;
  }
  else if(this.type === Task.TYPE_DOWNLOAD) {
    return Core.config.download.args;
  }
  return null;
}

Task.prototype.getArgsProcessed = function() {
  var str = this.getArgs().join("\n");
  if(this.type === Task.TYPE_TRANSCODE || this.type === Task.TYPE_MUX) {
    str = str.replace("%i", arguments[0]);
    str = str.replace("%o", arguments[1]);
  }
  else if(this.type === Task.TYPE_DOWNLOAD) {
    str = str.replace("%i", this.value);
  }
  return str.split(/[\n\r]/);
}

Task.prototype.addAppHandling = function(app) {
  if(this.type === Task.TYPE_TRANSCODE || this.type === Task.TYPE_MUX) {
    app.stderr.on("data", function(data) {
      var msg = data.toString();
      var barElem = document.getElementById("progressbar");
      // Get duration
      var re = /Duration: (\d+):(\d+):(\d+)/m;
      var result = re.exec(msg);
      var hour, minute, second, duration;
      if(result) {
        hour = Number(result[1]);
        minute = Number(result[2]);
        second = Number(result[3]);
        duration = second + (minute * 60) + ((hour * 60) * 60);
        barElem.max = String(duration);
      }
      // Get progress
      re = /time=(\d+):(\d+):(\d+)/i;
      result = re.exec(msg);
      if(result) {
        hour = Number(result[1]);
        minute = Number(result[2]);
        second = Number(result[3]);
        duration = second + (minute * 60) + ((hour * 60) * 60);
        barElem.value = String(duration);
      }
    });

    var task = this;
    app.on("close", function() {
      var barElem = document.getElementById("progressbar");
      barElem.value = "0";
      var taskElem = document.getElementById("progresstask");
      taskElem.value = "";
      var itemElem = document.getElementById("progressitem");
      itemElem.value = "";
      task.convert();
    });
  }
  else if(this.type === Task.TYPE_DOWNLOAD) {
    app.stdout.on("data", function(data) {
      var msg = data.toString();
      var barElem = document.getElementById("progressbar");
      var itemElem = document.getElementById("progressitem");
      // Get name
      var re = /\[download\] Destination: input[\\\/](.+)/;
      var result = re.exec(msg);
      if(result) {
        itemElem.value = result[1];
      }
      // Download progress
      var re;
      var result;
      re = /([0-9]+)\.([0-9]+)\%/i;
      result = re.exec(msg);
      // Post result
      if(result) {
        var progress = Number(result[1]) + (Number(result[2]) / 10);
        progress = Math.floor(parseFloat(result[1]) * 10);
        barElem.max = "1000";
        barElem.value = String(progress);
      }
    });

    app.on("close", function() {
      var barElem = document.getElementById("progressbar");
      barElem.value = "0";
      var taskElem = document.getElementById("progresstask");
      taskElem.value = "";
      var itemElem = document.getElementById("progressitem");
      itemElem.value = "";
      var oldTask = Core.tasks.shift();
      oldTask.removeQueueItem();
      Core.running = false;
      Core.performTask();
    });
  }
}


window.addEventListener("load", Core.init.bind(Core));
