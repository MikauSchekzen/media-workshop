function DataManager() {};

DataManager._data = {};

DataManager.addType = function(typeKey) {
  this._data[typeKey] = {};
};

DataManager.addData = function(typeKey, obj) {
  this._data[typeKey][obj.key] = obj;
};

DataManager.getData = function(typeKey, dataKey) {
  return this._data[typeKey][dataKey];
};

module.exports = DataManager;
