var path = require("path");
var spawn = require("child_process").spawnSync;
var process = require("process");
var glob = require("glob").sync;
var fs = require("fs");

var task = process.argv[2];

console.log("Downloading videos...");
spawn("youtube-dl", ["-a", "list.txt", "-o", "input/%(title)s.%(ext)s", "--restrict-filenames"]);
console.log("Video download complete");

var files = glob("input/*.+(mp4|flv)");
var a, file, savePath, cleaningList = [];
if(task !== undefined) {
	switch(task) {
		case "rip-mp3":
		case "rip_mp3":
		case "ripmp3":
			for(a = 0;a < files.length;a++) {
				file = files[a];
				cleaningList.push(file);
				savePath = "output_music/" + path.basename(file, path.extname(file)) + ".mp3";
				console.log("Processing file " + savePath);
				spawn("ffmpeg", ["-i", file, "-acodec", "libmp3lame", "-ab", "128", savePath]);
			}
			break;
	}
}

// Clean up afterwards
console.log("Cleaning...");
for(a = 0;a < cleaningList.length;a++) {
	file = cleaningList[a];
	fs.unlinkSync(file);
}
console.log("Done!");
