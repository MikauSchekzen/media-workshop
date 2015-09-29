var path = require("path");
var spawn = require("child_process").spawnSync;
var process = require("process");
var glob = require("glob").sync;
var fs = require("fs");

// Set config
var downloadTasks = [
	"rip-mp3",
	"rip_mp3",
	"ripmp3"
];

// Get parameter(s)
var doClean = false;
var task = process.argv[2], processTask = "", processFrom = "", processTo = "";
var a, str, testStr;
for(a = 3;a < process.argv.length;a++) {
	str = argv[a];
	// Set cleaning flag
	if(str === "--clean") {
		doClean = true;
	}
	if(task === "mux" || task === "transcode") {
		testStr = str.match(/--(\w+)-to-(\w+)/);
		if(testStr.length === 3) {
			// Set process from
			processFrom = testStr[1];
			// Set process to
			processTo = testStr[2];
		}
	}
}

// Create directories, if they don't exist yet
try {
	fs.mkdirSync("input");
} catch(e) {}
try {
	fs.mkdirSync("output");
} catch(e) {}
try {
	fs.mkdirSync("output_music");
} catch(e) {}

// Download youtube videos
if(downloadTasks.indexOf(task) !== -1) {
	console.log("Downloading videos...");
	spawn("youtube-dl", ["-a", "list.txt", "-o", "input/%(title)s.%(ext)s", "--restrict-filenames"]);
	console.log("Video download complete");
}

// Process videos
var files;
if(task === "rip_mp3" || task === "ripmp3" || task === "rip-mp3") {
	files = glob("input/*.+(mp4|flv)");
} else if(task === "decode-gif") {
	files = glob("input/*.gif");
} else {
	files = glob("input/*." + processFrom);
}
var performTask = function(files, task) {
	var a, file, savePath, cleaningList = [], cmds;
	if(task !== undefined) {
		for(a = 0;a < files.length;a++) {
			file = files[a];
			cleaningList.push(file);
			savePath = "output/" + path.basename(file, path.extname(file));
			console.log("Processing file " + savePath);
			switch(task) {
				case "rip-mp3":
				case "rip_mp3":
				case "ripmp3":
					cmds = ["-i", file];
					savePath += ".mp3";
					cmds.push("-acodec", "libmp3lame", "-ab", "128", savePath);
					break;
				case "mux":
					cmds = ["-i", file];
					savePath += "." + processTo;
					cmds.push("-c:v", "copy", "-c:a", "copy", "-f", processTo, savePath);
					break;
				case "transcode":
					cmds = ["-i", file];
					savePath += "." + processTo
					cmds.push("-c:v");
					switch(processTo) {
						case "mp4":
						case "flv":
							cmds.push("libx264", "-preset", "fast");
							break;
						case "ogv":
							cmds.push("libtheora");
							break;
						case "webm":
							cmds.push("libvpx", "-crf", "10", "-qmin", "0", "-qmax", "40");
							break;
						default:
							cmds.push("copy");
							break;
					}
					break;
				case "decode-gif":
					cmds = ["-i", file, "-c:v", "libvpx", "-crf", "10", "-qmin", "0", "-qmax", "40"];
					savePath += ".webm";
					cmds.push(savePath);
					break;
			}
			spawn("ffmpeg", cmds); 
		}
	}
};

performTask(files, task);

// Clean up afterwards
if(doClean) {
	console.log("Cleaning...");
	for(a = 0;a < cleaningList.length;a++) {
		file = cleaningList[a];
		fs.unlinkSync(file);
	}
}
console.log("Done!");
