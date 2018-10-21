DataManager.addType("task");

DataManager.addData("task", {
  key: "base",
  getLabel: function() {
    return "Do nothing";
  },
  start: function() {}
});
