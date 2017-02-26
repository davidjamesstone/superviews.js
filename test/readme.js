;(function () {
var hoisted1 = ["type", "text"]
var hoisted2 = ["type", "text"]
var hoisted3 = ["href", "#"]
var hoisted4 = ["title", "hello"]
var hoisted5 = ["class", "list-header"]
var __target

return function myWidget (data, todos, foo, bar) {
  function add (item) {
      todos.push(item)
    }

    function remove () {
      todos.pop()
    }
  elementOpen("div", null, null, "class", data.cssClass)
    elementOpen("input", "d2ba8b38-907c-449d-8cb2-0dcecdb3cb88", hoisted1, "disabled", data.isDisabled)
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
    elementOpen("button", null, null, "onclick", function ($event) {
      var $element = this;
    alert(hi)})
      text("Say hi")
    elementClose("button")
    elementOpen("input", "66c19f0e-e937-484e-8d69-93e53c0f7c03", hoisted2, "value", data.val, "onchange", function ($event) {
      var $element = this;
    data.val = this.value})
    elementClose("input")
    elementOpen("a", "2fbfc9e5-8183-46aa-99e4-09ad32e4f072", hoisted3, "onclick", function ($event) {
      var $element = this;
    $event.preventDefault(); model.doSomething();})
      text("Some link")
    elementClose("a")
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
          var $key = "bad0b0bf-b73a-4728-8be6-965ccf048c3a_" + $item
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
          var $key = "dc496d1c-a3a7-456c-879a-25adbfa7d9b6_" + $item
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
          var $key = "b15212a1-c9c5-4667-b60a-cdde2155f993_" + $item
          elementOpen("li", $key)
            elementOpen("span", "dd19707c-45cb-4d94-a0c2-1439b7be15da_" + $key, hoisted4)
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
          var $key = "4160d737-02d1-417c-b96a-3941b73277f9_" + product.id
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
        __target = data.arr.sort(function (a, b) { return a < b })
        if (__target) {
          ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
            var item = $value
            var $key = "6c18d5ad-6ab5-4481-9daf-0414abed582e_" + item.id
            elementOpen("li", $key)
              text(" \
                      " + (item.name) + " \
                    ")
            elementClose("li")
          }, this)
        }
      }
      if (!data.items.length) {
        elementOpen("li", "97394c8e-d280-4153-aab5-9702c9ac7016", hoisted5)
          text(" \
                  No items found \
                ")
        elementClose("li")
      }
    elementClose("ul")
  elementClose("div")
}
})()
