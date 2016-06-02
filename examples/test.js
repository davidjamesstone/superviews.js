window.egg = (function () {
var hoisted1 = ["type", "text"]
var hoisted2 = ["target", "_blank"]
var hoisted3 = ["type", "text"]

return function egg (foo) {
elementOpen("div", null, null, "class", data.cssClass)
  elementOpen("h2")
    text("Attributes")
  elementClose("h2")
  elementOpen("input", "49672923-befd-4ab8-9977-74c7634d102a", hoisted1, "disabled", data.isDisabled)
  elementClose("input")
  elementOpen("a", "32f2c4b8-3ee1-4b11-b5ff-8c14c2079ef9", hoisted2, "href", "http://www.google.co.uk?q=" + (data.query) + "")
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
        var $key = "63e4aa94-c2b9-43c9-bf0a-e0a8ce9765c6_" + $item
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
        var $key = "05ae0887-eff7-4e69-8e3e-ff3d34f8121b_" + $item
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
        var $key = "8dcffc27-c8f5-4cb6-bfc3-18b66576d9b5_" + $item.id
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
  elementOpen("input", "0dedcbd7-694e-4252-a128-59f60c6e9c2c", hoisted3, "value", data.val, "onchange", function ($event) {
    $event.preventDefault();
    var $element = this;
  alert(this.value)})
  elementClose("input")
elementClose("div")
}
})()
