function ArgumentManager() {};

ArgumentManager._options = {};

ArgumentManager.parse = function(args) {
  for(let a = 0;a < args.length;a++) {
    let arg = args[a];
    if(arg === "--debug") this.setOption("debug", true);
  }
};

ArgumentManager.setOption = function(name, value) {
  this._options[name] = value;
};

ArgumentManager.getOption = function(name) {
  return this._options[name];
};

module.exports = ArgumentManager;
