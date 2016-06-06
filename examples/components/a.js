var superviews = require('../client')
var b = require('./b')
var template = require('./a.html')

var controller = {
  template: template,
  onClick: function () {
    
  }
}

superviews(template)

module.exports = function (data) {
  view(data, b)
}
