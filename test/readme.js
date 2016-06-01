;(function () {
var hoisted1 = ["type", "text"]
var hoisted2 = ["type", "text"]
var hoisted3 = ["title", "hello"]
var hoisted4 = ["class", "list-header"]

return function myWidget (data, foo, bar, todos) {
  function add (item) {
      todos.push(item)
    }

    function remove () {
      todos.pop()
    }
  elementOpen("div", null, null, "class", data.cssClass)
    elementOpen("input", "6cd17891-7dc6-4ca5-b1ec-6234a28c9583", hoisted1, "disabled", data.isDisabled)
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
    elementOpen("input", "d0816055-79ea-4ec7-9794-fbc46c675473", hoisted2, "value", data.val, "onchange", function ($event) {
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
      if (data.items) {
        ;(data.items.forEach ? data.items : Object.keys(data.items)).forEach(function($value, $item, $target) {
          var item = $value
          var $key = "e8acb335-8725-49f4-951c-f594675f6267_" + $item
          elementOpen("li", $key)
            elementOpen("span", null, null, "class",  $item % 2 ? 'odd' : 'even' )
              text("" + ($item) + "")
            elementClose("span")
            elementOpen("input", null, null, "value", item.name)
            elementClose("input")
          elementClose("li")
        }, data.items)
      }
    elementClose("ul")
    elementOpen("ul")
      if (data.arr) {
        ;(data.arr.forEach ? data.arr : Object.keys(data.arr)).forEach(function($value, $item, $target) {
          var item = $value
          var $key = "aee67aa4-cb36-478a-a347-d6577dc310ec_" + $item
          elementOpen("li", $key)
            elementOpen("span")
              text("" + (item.name) + "")
            elementClose("span")
          elementClose("li")
        }, data.arr)
      }
    elementClose("ul")
    elementOpen("ul")
      if (data.obj) {
        ;(data.obj.forEach ? data.obj : Object.keys(data.obj)).forEach(function($value, $item, $target) {
          var key = $value
          var $key = "8515b67a-fc01-45a7-8926-ff497f1a3a74_" + $item
          elementOpen("li", $key)
            elementOpen("span", "1fec4b7e-624d-4b7e-871f-c4e0dc4a4d59_" + $key, hoisted3)
              text("" + (key) + " - " + (data.obj[key]) + "")
            elementClose("span")
          elementClose("li")
        }, data.obj)
      }
    elementClose("ul")
    elementOpen("ul")
      if (data.products) {
        ;(data.products.forEach ? data.products : Object.keys(data.products)).forEach(function($value, $item, $target) {
          var product = $value
          var $key = "2dc1526c-ffdd-4c4d-85f0-268c8ad16d43_" + product.id
          elementOpen("li", $key)
            text(" \
                    " + (product.name) + " \
                  ")
          elementClose("li")
        }, data.products)
      }
    elementClose("ul")
    elementOpen("ul")
      if (data.items.length) {
        if (data.arr) {
          ;(data.arr.forEach ? data.arr : Object.keys(data.arr)).forEach(function($value, $item, $target) {
            var item = $value
            var $key = "a6deb724-482d-4568-aabb-645ffe6dc70e_" + item.id
            elementOpen("li", $key)
              text(" \
                      " + (item.name) + " \
                    ")
            elementClose("li")
          }, data.arr)
        }
      }
      if (!data.items.length) {
        elementOpen("li", "e81b0f96-5830-4d6c-af69-d18fac692d2c", hoisted4)
          text(" \
                  No items found \
                ")
        elementClose("li")
      }
    elementClose("ul")
  elementClose("div")
}
})()