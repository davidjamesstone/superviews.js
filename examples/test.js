window.description = (function () {
var hoisted1 = ["type", "text"]
var hoisted2 = ["target", "_blank"]
var hoisted3 = ["type", "text"]

return function description (data) {
elementOpen("div", null, null, "class", data.cssClass)
  elementOpen("h2")
    text("Attributes")
  elementClose("h2")
  elementOpen("input", "fea63c75-7460-45ea-934a-55cc4e4cd002", hoisted1, "disabled", data.isDisabled)
  elementClose("input")
  elementOpen("a", "627ce38b-e17a-49de-8c6d-ca9839069f1a", hoisted2, "href", "http://www.google.co.uk?q=" + (data.query) + "")
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
        var $key = "f140e7ba-06a6-43c2-aa18-363884906bc8_" + $item
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
        var $key = "5ca129c9-0500-4a98-b6d3-8a975a6f721d_" + $item
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
        var $key = "c3a27796-4513-432c-b4ec-71e9511e5da8_" + $item.id
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
  elementOpen("input", "3e19fd7e-bbf3-4879-9049-950af5812e29", hoisted3, "value", data.val, "onchange", function ($event) {
    $event.preventDefault();
    var $element = this;
  alert(this.value)})
  elementClose("input")
elementClose("div")
}
})()
