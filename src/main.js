// Import modules
var fs = require("fs");
var path = require("path");
var glob = require("glob");
var spawn = require("child_process").spawn;

var actions = [];


// Make directories, if they don't exist yet
try {
	fs.mkdirSync("input");
} catch(e) {}
try {
	fs.mkdirSync("output");
} catch(e) {}

// Determine base data
var controlElementNames = [
	"download_from_yt",
	"transcode",
	'mux',
	"transcode_formats"
];


// Get files in the 'input' folder as an array of strings
var doInputFiles = function(cb) {
	glob("input/*", {}, cb);
};

// Lock controls
var lockControls = function() {
	controlElementNames.forEach(function(value, index, array) {
		document.getElementById(value).setAttribute("disabled", "disabled");
	}, this);
};

// Unlock controls
var unlockControls = function() {
	controlElementNames.forEach(function(value, index, array) {
		document.getElementById(value).removeAttribute("disabled");
	}, this);
};

// Get progress elements
var getProgressElems = function() {
	var result = {};
	result.bar = document.getElementById("progressbar");
	result.task = document.getElementById("progresstask");
	result.item = document.getElementById("progressitem");
	return result;
};

// TASKS
// taskDone
var taskDone = function() {
	var progressElems = getProgressElems();
	progressElems.bar.value = "0";
	progressElems.task.value = "Idle";
	progressElems.item.value = "";
	doAction();
};

var doAction = function() {
	if(actions.length > 0) {
		var action = actions.shift();
		if(this[action.cmd]) {
			this[action.cmd].apply(this, action.args);
		}
	}
};

// Downloading from YouTube
var taskDownloadFromYT = function() {
	var link = document.getElementById("download_from_yt_list").value;
	if(link.length > 0) {
		var proc = spawn("youtube-dl", [link, "-o", "input/%(title)s.%(ext)s", "--restrict-filenames"]);
		lockControls();
		var progressElems = getProgressElems();

		// Set status
		progressElems.bar.max = "1000";
		progressElems.task.value = "Downloading";

		// SET EVENTS
		// On close
		proc.on("close", function(code) {
			taskDone();
			unlockControls();
		});
		// On message
		proc.stdout.on("data", function(data) {
			var msg = data.toString(),
			    progressElems = getProgressElems();
			// Download progress
			var re, result, progress;
			re = /([0-9]+(?:\.[0-9]+)?)\%/i;
			result = re.exec(msg);
			// Post result
			if(result) {
				progress = Math.floor(parseFloat(result[1]) * 10);
				progressElems.bar.value = progress.toString();
			}
		});
	}
};

// Transcoding
var taskTranscode = function() {
	var fmt = document.getElementById("transcode_formats").value;
	if(fmt === "rmmv") {
		actions.push({cmd: "transcode", args: ["ogg"]});
		actions.push({cmd: "transcode", args: ["m4a"]})
	}
	else {
		actions.push({cmd: "transcode", args: [fmt]});
	}
	doAction();
};

// Muxing
var taskMux = function() {
	var fmt = document.getElementById("transcode_formats").value;
	if(fmt === "rmmv") {
		actions.push({cmd: "mux", args: ["ogg"]});
		actions.push({cmd: "mux", args: ["m4a"]})
	}
	else {
		actions.push({cmd: "mux", args: [fmt]});
	}
	doAction();
};

var transcode = function(fmt) {
	var transcodeType = "", encoder = {audio: "", video: ""};
	var extraCmds = [];
	var baseCmds = ["-map_metadata", "-1"];
	if(fmt !== "") {
		// Determine encoder
		encoder.audio = "libmp3lame";
		if(fmt === "mp3") {
			encoder.audio = "libmp3lame";
		}
		else if(fmt === "ogg") {
			encoder.audio = "libvorbis";
		}
		else if(fmt === "m4a") {
			encoder.audio = "aac";
		}
		else if(fmt === "mp4") {
			encoder.video = "libx264";
			extraCmds = ["-preset", "veryfast", "-crf", "25"];
		}
		else if(fmt === "flv") {
			encoder.video = "flv";
		}
		else if(fmt === "ogv") {
			encoder.audio = "libvorbis";
			encoder.video = "libtheora";
			extraCmds = ["-qscale:v", "6", "-qscale:a", "3"];
		}
		else if(fmt === "mkv") {
			encoder.video = "libx264";
			extraCmds = ["-preset", "veryfast", "-crf", "25"];
		}
		else if(fmt === "gif") {
			encoder.video = "";
			encoder.audio = "";
			extraCmds = ["-pix_fmt", "rgb24", "-r", "12"];
		}
		// Determine output type
		if(fmt === "mp3" || fmt === "ogg" || fmt === "m4a") {
			transcodeType = "audio";
		}
		else if(fmt === "mp4" || fmt === "flv" || fmt === "ogv" || fmt === "mkv" || fmt === "gif") {
			transcodeType = "video";
		}
		// Do output
		var doFunc = function(files) {
			if(files.length > 0) {
				// Get file data
				var file = files.splice(0, 1)[0];
				var filename = path.basename(file);
				var basename = path.basename(file, path.extname(file));
				var output = "output/" + basename + "." + fmt;
				// Set progress item
				var progressElems = getProgressElems();
				progressElems.item.value = filename;
				// Run FFMPEG for file
				var proc, cmds;
				if(transcodeType === "audio") {
					cmds = ["-y", "-i", file];
					cmds = cmds.concat(baseCmds);
					cmds = cmds.concat(extraCmds);
					if(encoder.audio !== "") {
						cmds.push("-c:a", encoder.audio, "-b:a", "128k");
					}
					cmds.push(output);
					proc = spawn("ffmpeg", cmds);
				}
				else if(transcodeType === "video") {
					cmds = ["-y", "-i", file];
					cmds = cmds.concat(extraCmds);
					if(encoder.video !== "") {
						cmds.push("-c:v", encoder.video);
					}
					if(encoder.audio !== "") {
						cmds.push("-c:a", encoder.audio, "-b:a", "128k");
					}
					console.log(cmds);
					cmds.push(output);
					proc = spawn("ffmpeg", cmds);
				}
				// Set callback
				if(proc) {
					proc.on("close", function() {
						var progressElems = getProgressElems();
						var prog = parseInt(progressElems.bar.value) + 1;
						progressElems.bar.value = prog.toString();
						doFunc(files);
					});
					proc.stderr.on("data", function(data) {
						var msg = data.toString();
						var progressElems = getProgressElems();
						// Get duration
						var re = /Duration: (\d+):(\d+):(\d+)/i;
						var result = re.exec(msg);
						var hour, minute, second, duration;
						if(result) {
							hour = parseInt(result[1]);
							minute = parseInt(result[2]);
							second = parseInt(result[3]);
							duration = second + (minute * 60) + ((hour * 60) * 60);
							progressElems.bar.max = duration.toString();
						}
						// Get progress
						re = /time=(\d+):(\d+):(\d+)/i;
						result = re.exec(msg);
						if(result) {
							hour = parseInt(result[1]);
							minute = parseInt(result[2]);
							second = parseInt(result[3]);
							duration = second + (minute * 60) + ((hour * 60) * 60);
							progressElems.bar.value = duration.toString();
						}
					});
				}
			}
			else {
				// Unlock controls
				taskDone();
				unlockControls();
			}
		};
		glob("input/*", {}, function(err, files) {
			if(files.length > 0) {
				lockControls();
				var progressElems = getProgressElems();
				progressElems.task.value = "Transcoding";
				doFunc(files);
			}
		});
	}
};

var mux = function(fmt) {
	var transcodeType = "";
	var extraCmds = [];
	// Determine output type
	if(fmt === "mp3" || fmt === "ogg" || fmt === "m4a") {
		transcodeType = "audio";
	}
	else if(fmt === "mp4" || fmt === "flv" || fmt === "ogv" || fmt === "mkv") {
		transcodeType = "video";
	}
	var doFunc = function(files) {
		if(files.length > 0) {
			var file = files.splice(0, 1)[0];
			var filename = path.basename(file);
			var basename = path.basename(file, path.extname(file));
			var output = 'output/' + basename + '.' + fmt;
			// Set progress item
			var progressElems = getProgressElems();
			progressElems.item.value = filename;
			// Run FFMPEG for file
			var proc, cmds;
			if(transcodeType === "audio") {
				cmds = ["-y", "-i", file, "-c:a", 'copy'];
				cmds = cmds.concat(extraCmds);
				cmds.push(output);
				proc = spawn("ffmpeg", cmds);
			}
			else if(transcodeType === "video") {
				cmds = ["-y", "-i", file, "-c:a", 'copy', "-c:v", 'copy'];
				cmds = cmds.concat(extraCmds);
				cmds.push(output);
				proc = spawn("ffmpeg", cmds);
			}
			// Set callback
			if(proc) {
				proc.on("close", function() {
					var progressElems = getProgressElems();
					var prog = parseInt(progressElems.bar.value) + 1;
					progressElems.bar.value = prog.toString();
					doFunc(files);
				});
				proc.stderr.on("data", function(data) {
					var msg = data.toString();
					var progressElems = getProgressElems();
					// Get duration
					var re = /Duration: (\d+):(\d+):(\d+)/i;
					var result = re.exec(msg);
					var hour, minute, second, duration;
					if(result) {
						hour = parseInt(result[1]);
						minute = parseInt(result[2]);
						second = parseInt(result[3]);
						duration = second + (minute * 60) + ((hour * 60) * 60);
						progressElems.bar.max = duration.toString();
					}
					// Get progress
					re = /time=(\d+):(\d+):(\d+)/i;
					result = re.exec(msg);
					if(result) {
						hour = parseInt(result[1]);
						minute = parseInt(result[2]);
						second = parseInt(result[3]);
						duration = second + (minute * 60) + ((hour * 60) * 60);
						progressElems.bar.value = duration.toString();
					}
				});
			}
		}
		else {
			// Unlock controls
			taskDone();
			unlockControls();
		}
	};
	glob("input/*", {}, function(err, files) {
		if(files.length > 0) {
			lockControls();
			var progressElems = getProgressElems();
			progressElems.task.value = "Muxing";
			doFunc(files);
		}
	});
};
