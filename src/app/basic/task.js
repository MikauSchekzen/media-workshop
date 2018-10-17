const Core = require("../core");

function Task() { this.initialize.apply(this, arguments); };

Task.TYPE_NONE = 0;
Task.TYPE_DOWNLOAD = 1;
Task.TYPE_CONVERT = 2;
Task.TYPE_MUX = 3;

Task.prototype.initialize = function(type, metadata) {
  this.type = type;
  this.metadata = metadata || {};
};

Task.prototype.start = function() {
};
