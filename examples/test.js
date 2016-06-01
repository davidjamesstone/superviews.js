window.description = (function () {
var hoisted1 = ["type", "text"]
var hoisted2 = ["target", "_blank"]
var hoisted3 = ["type", "text"]

return function description (data) {
elementOpen("div", null, null, "class", data.cssClass)
  elementOpen("h2")
    text("Attributes")
  elementClose("h2")
  elementOpen("input", "1f51f03b-9101-4f10-b42d-2aa374aaf1d5", hoisted1, "disabled", data.isDisabled)
  elementClose("input")
  elementOpen("a", "b81cc4d4-af4b-47d0-9409-f6c0724b8e63", hoisted2, "href", "http://www.google.co.uk?q=" + (data.query) + "")
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
    if (data.obj) {
      ;(data.obj.forEach ? data.obj : Object.keys(data.obj)).forEach(function($value, $item, $target) {
        var key = $value
        var $key = "34eef4b0-0b80-41ad-a45d-a87115296c14_" + $item
        elementOpen("li", $key)
          text(" \
                key: " + (key) + ", value: " + (data.obj[key]) + " \
                [generated key: " + ($key) + "] \
              ")
        elementClose("li")
      }, data.obj)
    }
  elementClose("ul")
  elementOpen("ul")
    if (data.arr) {
      ;(data.arr.forEach ? data.arr : Object.keys(data.arr)).forEach(function($value, $item, $target) {
        var item = $value
        var $key = "9cc70113-8885-4f3f-9760-83093696c20a_" + $item
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
      }, data.arr)
    }
  elementClose("ul")
  elementOpen("ul")
    if (data.map) {
      ;(data.map.forEach ? data.map : Object.keys(data.map)).forEach(function($value, $item, $target) {
        var item = $value
        var $key = "b2a95659-d9ae-4699-8d9a-be66f258438a_" + $item.id
        elementOpen("li", $key)
          text(" \
                " + (item) + " \
                [generated key: " + ($key) + "] \
              ")
        elementClose("li")
      }, data.map)
    }
  elementClose("ul")
  elementOpen("h2")
    text("Events")
  elementClose("h2")
  elementOpen("button", null, null, "onclick", function ($event) {
    $event.preventDefault();
    var $element = this;
  alert('hi')})
    text("Say hi")
  elementClose("button")
  elementOpen("input", "b10ffe3c-80f8-4a0f-995b-86c35d591ce9", hoisted3, "value", data.val, "onchange", function ($event) {
    $event.preventDefault();
    var $element = this;
  alert(this.value)})
  elementClose("input")
elementClose("div")
}
})()
