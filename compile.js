var spawn = require("child_process").spawn;

spawn("nw", ["."], { detached: true });