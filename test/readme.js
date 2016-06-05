;(function () {
var hoisted1 = ["type", "text"]
var hoisted2 = ["type", "text"]
var hoisted3 = ["title", "hello"]
var hoisted4 = ["class", "list-header"]
var __target

return function myWidget (data, todos, onChange, foo, bar) {
  function add (item) {
      todos.push(item)
    }

    function remove () {
      todos.pop()
    }
  elementOpen("div", null, null, "class", data.cssClass)
    elementOpen("input", "4112d027-5d7e-45de-9659-223fa4e5a6fb", hoisted1, "disabled", data.isDisabled)
    elementClose("input")
    elementOpen("a", null, null, "href", "http://www.google.co.uk?q=" + (data.query) + "")
    elementClose("a")
    text(" \
        My name is " + (data.name) + " my age is " + (data.age) + " \
        I live at " + (data.address) + " \
     \
        ")
    elementOpen("div", null, null, "title", JSON.stringify(data))
      text("Hover for json")
    elementClose("div")
    elementOpen("button", null, null, "onclick", alert(hi))
      text("Say hi")
    elementClose("button")
    elementOpen("input", "d282769e-9831-42bd-b527-deea8e9df531", hoisted2, "value", data.val, "onchange", onChange)
    elementClose("input")
    if (data.showMe) {
      elementOpen("p")
        elementOpen("span", null, null, "class", data.bar + ' other-css')
          text("description")
        elementClose("span")
      elementClose("p")
    }
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
            Default \
          ")
    }
    elementOpen("aside")
      elementOpen("div")
        if (data.skipMe) {
          skip()
        } else {
          elementOpen("span", null, null, "id", data.id)
          elementClose("span")
        }
      elementClose("div")
    elementClose("aside")
    elementOpen("span", null, null, "style", { color: data.foo, backgroundColor: data.bar })
      text("My style changes")
    elementClose("span")
    elementOpen("ul")
      __target = data.items
      if (__target) {
        ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
          var item = $value
          var $key = "97e8ca7e-022b-4c1e-abbe-100286a0dc6a_" + $item
          elementOpen("li", $key)
            elementOpen("span", null, null, "class",  $item % 2 ? 'odd' : 'even' )
              text("" + ($item) + "")
            elementClose("span")
            elementOpen("input", null, null, "value", item.name)
            elementClose("input")
          elementClose("li")
        }, this)
      }
    elementClose("ul")
    elementOpen("ul")
      __target = data.arr
      if (__target) {
        ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
          var item = $value
          var $key = "6720e865-a9b2-421e-b3f6-ad32ba913125_" + $item
          elementOpen("li", $key)
            elementOpen("span")
              text("" + (item.name) + "")
            elementClose("span")
          elementClose("li")
        }, this)
      }
    elementClose("ul")
    elementOpen("ul")
      __target = data.obj
      if (__target) {
        ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
          var key = $value
          var $key = "e4b73123-443c-490d-92d2-ab140541c988_" + $item
          elementOpen("li", $key)
            elementOpen("span", "f0975216-872d-4c47-8c3e-616612fda377_" + $key, hoisted3)
              text("" + (key) + " - " + (data.obj[key]) + "")
            elementClose("span")
          elementClose("li")
        }, this)
      }
    elementClose("ul")
    elementOpen("ul")
      __target = data.products
      if (__target) {
        ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
          var product = $value
          var $key = "8fa1ee06-6721-40a0-bd0b-355f074cac4d_" + product.id
          elementOpen("li", $key)
            text(" \
                    " + (product.name) + " \
                  ")
          elementClose("li")
        }, this)
      }
    elementClose("ul")
    elementOpen("ul")
      if (data.items.length) {
        __target = data.arr
        if (__target) {
          ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
            var item = $value
            var $key = "5b17b834-a296-4871-93ab-d54c8532860a_" + item.id
            elementOpen("li", $key)
              text(" \
                      " + (item.name) + " \
                    ")
            elementClose("li")
          }, this)
        }
      }
      if (!data.items.length) {
        elementOpen("li", "4fe7e61f-d936-4770-a340-4f9c33b79aaf", hoisted4)
          text(" \
                  No items found \
                ")
        elementClose("li")
      }
    elementClose("ul")
  elementClose("div")
}
})()
