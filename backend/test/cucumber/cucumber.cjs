const path = require('path');

module.exports = {
  default: {
    paths: [path.join(__dirname, 'features/**/*.feature')],
    import: [path.join(__dirname, 'steps/**/*.js')],
  },
};