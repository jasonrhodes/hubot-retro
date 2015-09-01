var fs = require('fs');
var path = require ('path');

module.exports = function (robot) {
  var scriptsPath = path.resolve(__dirname, 'src');
  if (fs.existsSync(scriptsPath)) {
    robot.loadFile(scriptsPath, 'hubot-retro.js');
  }
};