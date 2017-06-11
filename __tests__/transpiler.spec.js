var superviews = require('../index')

function addWrapper (content) {
  return ';(function () {' + '\n' + content + '\n' + '})()' + '\n'
}

describe('template', function () {
  describe('with static content', function () {
    it('should transpile simple element', function () {
      var expected = (
`var __target

return function description (data) {
elementOpen("div")
elementClose("div")
}`)
      var output = superviews('<div></div>')
      expect(output).toEqual(addWrapper(expected))
    })

    it('should transpile simple element with attributes', function () {
      var expected = (
`var hoisted1 = ["class", "header", "id", "title"]
var __target

return function description (data) {
elementOpen("h1", "xxxx-xxxx", hoisted1)
elementClose("h1")
}`)

      var output = superviews('<h1 class="header" id="title"></h1>')
      expect(output).toEqual(addWrapper(expected))
    })

    it('should transpile void element', function () {
      var expected = (
`var __target

return function description (data) {
elementOpen("br")
elementClose("br")
}`)
      var output = superviews('<br/>')
      expect(output).toEqual(addWrapper(expected))
    })

    it('should transpile single line text', function () {
      var expected = (
`var __target

return function description (data) {
text("my text")
}`)
      var output = superviews('my text')
      expect(output).toEqual(addWrapper(expected))
    })

    it('should transpile multi line text', function () {
      var expected = (
`var __target

return function description (data) {
text("my very  \\
 long  \\
 text")
}`)
      var output = superviews('my very \n long \n text')
      expect(output).toEqual(addWrapper(expected))
    })
  })
})
