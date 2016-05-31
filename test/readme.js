;(function () {
var hoisted1 = ["title", "boo"]
var hoisted2 = ["type", "text"]
var hoisted3 = ["type", "text"]
var hoisted4 = ["title", "hello"]
var hoisted5 = ["class", "list-header"]

return function myWidget (data, foo, bar, todos) {
  function add (item) {
      todos.push(item)
    }

    function remove () {
      todos.pop()
    }
  elementOpen("span", "foo", hoisted1)
  elementClose("span")
  elementOpen("div", null, null, "class", data.cssClass)
    elementOpen("input", "3a892848-1aed-4b9a-96ac-e56d971f482f", hoisted2, "disabled", data.isDisabled)
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
      $event.preventDefault();
      var $element = this;
    alert(hi)})
      text("Say hi")
    elementClose("button")
    elementOpen("input", "68dc52ac-28ad-4d73-87ee-d7adc3078e61", hoisted3, "value", data.val, "onchange", function ($event) {
      $event.preventDefault();
      var $element = this;
    data.val = this.value})
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
      ;(Array.isArray(data.items) ? data.items : Object.keys(data.items)).forEach(function(item, $index) {
        elementOpen("li", "6295f8ab-3633-4b26-a53a-f854e73d6812_" + $index)
          elementOpen("span", null, null, "class",  $index % 2 ? 'odd' : 'even' )
            text("" + ($index) + "")
          elementClose("span")
          elementOpen("input", null, null, "value", item.name)
          elementClose("input")
        elementClose("li")
      }, data.items)
    elementClose("ul")
    elementOpen("ul")
      ;(Array.isArray(data.arr) ? data.arr : Object.keys(data.arr)).forEach(function(item, $index) {
        elementOpen("li", "29d84e7c-0fd2-4550-8573-f5ca5e734464_" + $index)
          elementOpen("span")
            text("" + (item.name) + "")
          elementClose("span")
        elementClose("li")
      }, data.arr)
    elementClose("ul")
    elementOpen("ul")
      ;(Array.isArray(data.obj) ? data.obj : Object.keys(data.obj)).forEach(function(key, $index) {
        elementOpen("li", "8bb4058b-fb3e-46ad-834f-ef2019650ffc_" + $index)
          elementOpen("span", "91582f17-9546-4d9c-b52a-15c28503401a_" + $index, hoisted4)
            text("" + (key) + " - " + (data.obj[key]) + "")
          elementClose("span")
        elementClose("li")
      }, data.obj)
    elementClose("ul")
    elementOpen("ul")
      ;(Array.isArray(data.products) ? data.products : Object.keys(data.products)).forEach(function(product, $index) {
        elementOpen("li", product.id)
          text(" \
                  " + (product.name) + " \
                ")
        elementClose("li")
      }, data.products)
    elementClose("ul")
    elementOpen("ul")
      if (data.items.length) {
        ;(Array.isArray(data.arr) ? data.arr : Object.keys(data.arr)).forEach(function(item, $index) {
          elementOpen("li", item.id)
            text(" \
                    " + (item.name) + " \
                  ")
          elementClose("li")
        }, data.arr)
      }
      if (!data.items.length) {
        elementOpen("li", "9925785e-a367-49a4-a08b-7428a45517d9", hoisted5)
          text(" \
                  No items found \
                ")
        elementClose("li")
      }
    elementClose("ul")
  elementClose("div")
}
})()