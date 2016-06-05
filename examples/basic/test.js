window.egg = (function () {
var hoisted1 = ["type", "text"]
var hoisted2 = ["target", "_blank"]
var hoisted3 = ["type", "text"]
var __target

return function egg (foo) {
elementOpen("div", null, null, "class", data.cssClass)
  elementOpen("h2")
    text("Attributes")
  elementClose("h2")
  elementOpen("input", "39d0000c-cc33-458d-93a1-de3f9ed3a5f7", hoisted1, "disabled", data.isDisabled)
  elementClose("input")
  elementOpen("a", "e14df983-1f68-414c-b841-68a7fb0de257", hoisted2, "href", "http://www.google.co.uk?q=" + (data.query) + "")
    text("Search for " + (data.query) + "")
  elementClose("a")
  elementOpen("h2")
    text("Text interpolation")
  elementClose("h2")
  text(" \
    My name is " + (data.name) + " my age is " + (data.age) + " \
    I live at " + (data.address) + " \
     \
    ")
  elementOpen("h2")
    text("Conditionals")
  elementClose("h2")
  if (data.showMe) {
    text(" \
        I'm in an `if` block. \
      ")
  }
  if (data.foo === 1) {
    elementOpen("span")
      text("1")
    elementClose("span")
  } else if (data.foo === 2) {
    elementOpen("span")
      text("2")
    elementClose("span")
  } else {
    text(" \
        The value of `foo` is neither 1 or 2, it's " + (data.foo) + "! \
      ")
  }
  elementOpen("h2")
    text("Iteration")
  elementClose("h2")
  elementOpen("ul")
    __target = data.obj
    if (__target) {
      ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
        var key = $value
        var $key = "bf72a6ba-682f-4f66-83e7-f2448ccf215b_" + $item
        elementOpen("li", $key)
          text(" \
                key: " + (key) + ", value: " + (data.obj[key]) + " \
                [generated key: " + ($key) + "] \
              ")
        elementClose("li")
      }, this)
    }
  elementClose("ul")
  elementOpen("ul")
    __target = data.arr
    if (__target) {
      ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
        var item = $value
        var $key = "24188175-d6d8-4e86-876b-45215b3c4f42_" + $item
        elementOpen("li", $key)
          text(" \
                " + (item) + "")
          elementOpen("br")
          elementClose("br")
          text(" \
                " + ($item) + " " + ($value) + " " + ($target) + "  \
                [generated key: " + ($key) + "] \
              ")
        elementClose("li")
      }, this)
    }
  elementClose("ul")
  elementOpen("ul")
    __target = data.map
    if (__target) {
      ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
        var item = $value
        var $key = "023ec0dc-98d8-4a56-a30a-2cf1e1532bf9_" + $item.id
        elementOpen("li", $key)
          text(" \
                " + (item) + " \
                [generated key: " + ($key) + "] \
              ")
        elementClose("li")
      }, this)
    }
  elementClose("ul")
  elementOpen("h2")
    text("Events")
  elementClose("h2")
  elementOpen("button", null, null, "onclick", data.onClick)
    text("Say hi")
  elementClose("button")
  elementOpen("input", "3f577960-32f2-4340-ba0b-47df4a99b00c", hoisted3, "value", data.val, "onchange", (e) => alert('yo'))
  elementClose("input")
elementClose("div")
}
})()
