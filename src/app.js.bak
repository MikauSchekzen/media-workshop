var fs = require("fs");
var path = require("path");
var glob = require("glob");
var spawn = require("child_process").spawn;

// Make directories, if they don't exist yet
try {
	fs.mkdirSync("input");
} catch(e) {}
try {
	fs.mkdirSync("output");
} catch(e) {}


function Core() {}

Core._actions = [];
Core.audioCapableFormats = ["mp3", "ogg", "m4a", "wav", "mp4", "ogv", "mkv", "flv"];
Core.videoCapableFormats = ["mp4", "ogv", "mkv", "flv", "gif"];
Core.controlElementNames = [
	"download_from_yt",
	"transcode",
	"mux",
	"transcode_formats"
];

Core.startTask = function(type) {
  if(type === "youtube-dl") {
    this.prependTask(type);
    this.performAction();
  }
  else {
    this.getInputFiles(type);
  }
}

Core.performAction = function() {
  if(this._actions.length > 0) {
    this.lockControls();
    var action = this._actions.shift();
    var args = action.joinArgs();
    var proc = spawn(action.app, args);
    var elems = this.getProgressElement();
    elems.task.value = action.taskName;
    elems.item.value = action.itemName;
    this.setAppCallbacks(proc, action.app);
  }
  else {
    this.unlockControls();
  }
}

Core.setAppCallbacks = function(proc, app) {
  // FFMPEG
  if(app === "ffmpeg") {
    proc.on("close", function() {
      var elems = Core.getProgressElement();
      elems.bar.value = "0";
      elems.task.value = "";
      elems.item.value = "";
      Core.performAction();
    });
    proc.stderr.on("data", function(data) {
      var msg = data.toString();
      var elems = Core.getProgressElement();
      // Get duration
      var re = /Duration: (\d+):(\d+):(\d+)/i;
      var result = re.exec(msg);
      var hour, minute, second, duration;
      if(result) {
        hour = Number(result[1]);
        minute = Number(result[2]);
        second = Number(result[3]);
        duration = second + (minute * 60) + ((hour * 60) * 60);
        elems.bar.max = String(duration);
      }
      // Get progress
      re = /time=(\d+):(\d+):(\d+)/i;
      result = re.exec(msg);
      if(result) {
        hour = Number(result[1]);
        minute = Number(result[2]);
        second = Number(result[3]);
        duration = second + (minute * 60) + ((hour * 60) * 60);
        elems.bar.value = String(duration);
      }
    });
  }
  // YOUTUBE-DL
  else if(app === "youtube-dl") {
    proc.on("close", function() {
      var elems = Core.getProgressElement();
      elems.bar.value = "0";
      elems.task.value = "";
      elems.item.value = "";
      Core.performAction();
    });
    proc.stdout.on("data", function(data) {
      var msg = data.toString();
      // console.log(msg);
      var elems = Core.getProgressElement();
      // Get name
      var re = /\[download\] Destination: input\\(.+)/;
      var result = re.exec(msg);
      if(result) {
        elems.item.value = result[1];
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
        elems.bar.max = "1000";
        elems.bar.value = String(progress);
      }
    });
  }
}

Core.getInputFiles = function(type) {
  glob("input/*", {}, function(err, files) {
    this.prependTask(type, files);
    this.performAction();
  }.bind(this));
}

Core.prependTask = function(task) {
  // FFMPEG
  if(task === "mux" || task === "transcode") {
    var files = arguments[1];
    var fmt = this.getFormat();
    for(var a = 0;a < files.length;a++) {
      var file = files[a];
      var filename = path.basename(file);
      var basename = path.basename(file, path.extname(file));
      switch(fmt) {
        case "rmmv":
          var fmtArr = ["ogg", "m4a"];
          for(var b = 0;b < fmtArr.length;b++) {
            var fmtObj = fmtArr[b];
            var action = this.addAction("ffmpeg");
            action.taskName = "Transcoding";
            action.itemName = filename;
            action.addArgs(["-i", file]);
            var fmtData = this.getFormatLibrary(fmtObj);
            if(fmtData.audio) action.addArgs(["-c:a", fmtData.audio]);
            if(fmtData.video) action.addArgs(["-c:v", fmtData.video]);
            if(fmtData.args.length > 0) action.addArgs(fmtData.args);
            action.addArgs(["-ar", "44100", "-map_metadata", "-1"]);
            action.addArgs(["-y", "output/" + basename + "." + fmtObj]);
          }
          break;
        case "jsgames":
          var action = this.addAction("ffmpeg");
          action.taskName = "Transcoding";
          action.itemName = filename;
          action.addArgs(["-i", file]);
          var fmtData = this.getFormatLibrary("ogg");
          if(fmtData.audio) action.addArgs(["-c:a", fmtData.audio]);
          if(fmtData.video) action.addArgs(["-c:v", fmtData.video]);
          if(fmtData.args.length > 0) action.addArgs(fmtData.args);
          action.addArgs(["-ar", "44100", "-map_metadata", "-1"]);
          action.addArgs(["-y", "output/" + basename + ".ogg"]);
          break;
        case "mp3":
        case "ogg":
        case "m4a":
        case "wav":
        case "mp4":
        case "flv":
        case "ogv":
        case "mkv":
        case "gif":
          var action = this.addAction("ffmpeg");
          action.itemName = filename;
          action.addArgs(["-i", file]);
          if(task === "mux") {
            action.taskName = "Muxing";
            if(this.audioCapableFormats.indexOf(fmt) !== -1) action.addArgs(["-c:a", "copy"]);
            if(this.videoCapableFormats.indexOf(fmt) !== -1) action.addArgs(["-c:v", "copy"]);
          }
          else if(task === "transcode") {
            action.taskName = "Transcoding";
            var fmtData = this.getFormatLibrary(fmt);
            if(fmtData.audio) action.addArgs(["-c:a", fmtData.audio]);
            if(fmtData.video) action.addArgs(["-c:v", fmtData.video]);
            if(fmtData.args.length > 0) action.addArgs(fmtData.args);
          }
          action.addArgs(["-y", "output/" + basename + "." + fmt]);
          break;
        default:
          break;
      }
    }
  }
  // YOUTUBE-DL
  else if(task === "youtube-dl") {
    var link = document.getElementById("download_from_yt_list").value;
    if(link.length > 0) {
      var action = this.addAction("youtube-dl");
      action.taskName = "Downloading";
      action.itemName = "Getting Data";
      action.addArgs([link, "-o", "input/%(title)s.%(ext)s", "--restrict-filenames"]);
    }
  }
}

Core.getFormatLibrary = function(format) {
  if(format === "mp3") return { audio: "libmp3lame", video: null, args: [] };
  else if(format === "ogg") return { audio: "libvorbis", video: null, args: [] };
  else if(format === "m4a") return { audio: "aac", video: null, args: [] };
  else if(format === "wav") return { audio: null, video: null, args: [] };
  else if(format === "mp4") return { audio: null, video: "libx264", args: ["-preset", "veryfast", "-crf", "25"] };
  else if(format === "flv") return { audio: null, video: "flv", args: [] };
  else if(format === "ogv") return { audio: "libvorbis", video: "libtheora", args: ["-qscale:v", "6", "-qscale:a", "3"] };
  else if(format === "mkv") return { audio: null, video: "libx264", args: ["-preset", "veryfast", "-crf", "25"] };
  else if(format === "gif") return { audio: "", video: "", args: ["-pix_fmt", "rgb24", "-r", "12"] };
  return { audio: null, video: null, args: [] };
}

Core.lockControls = function() {
  for(var a = 0;a < this.controlElementNames.length;a++) {
    var elem = document.getElementById(this.controlElementNames[a]);
    elem.disabled = "disabled";
  }
}

Core.unlockControls = function() {
  for(var a = 0;a < this.controlElementNames.length;a++) {
    var elem = document.getElementById(this.controlElementNames[a]);
    elem.disabled = null;
  }
}

Core.addAction = function(type) {
  var action = new Action(type);
  this._actions.push(action);
  return action;
}

Core.getFormat = function() {
  var elem = document.getElementById("transcode_formats");
  return elem.options[elem.selectedIndex].value;
}

Core.getProgressElement = function() {
  return {
    bar: document.getElementById("progressbar"),
    task: document.getElementById("progresstask"),
    item: document.getElementById("progressitem")
  };
}


/**
 * @class Action
 */
function Action() {
  this.init.apply(this, arguments);
}

Action.prototype.init = function(app) {
  this.app = app;
  this.args = [];
  this.taskName = "";
  this.itemName = "";
}

Action.prototype.addArgs = function(args, index) {
  if(index === undefined) index = -1;
  if(index < 0) index = this.args.length;
  if(index <= this.args.length) {
    this.args.splice(index, 0, args);
    return true;
  }
  return false;
}

Action.prototype.joinArgs = function() {
  var result = [];
  for(let a = 0;a < this.args.length;a++) {
    let argList = this.args[a];
    result = result.concat(argList);
  }
  return result;
}
