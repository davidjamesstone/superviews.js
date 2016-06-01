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
    elementOpen("input", "9f92e657-449b-4c35-a890-60c2c3ecb1d5", hoisted1, "disabled", data.isDisabled)
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
    elementOpen("input", "0ca89d0b-ca24-4052-b9f0-6effff9c8d37", hoisted2, "value", data.val, "onchange", function ($event) {
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
          var $key = "4dfd1c5a-523d-41a5-a4f5-ed92f4016342_" + $item
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
          var $key = "3b5ee081-580b-48a2-9931-e2f63d922517_" + $item
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
          var $key = "2b9e8e10-3ed9-4bd9-b249-90b61754a7d4_" + $item
          elementOpen("li", $key)
            elementOpen("span", "8f62358b-fea0-4132-b84a-1001452fee08_" + $key, hoisted3)
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
          var $key = "4cf2ded1-8e8e-434a-8bf8-bbe1e7657aa6_" + product.id
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
            var $key = "e6e59fd8-7971-44a8-8978-f6b5da06b03c_" + item.id
            elementOpen("li", $key)
              text(" \
                      " + (item.name) + " \
                    ")
            elementClose("li")
          }, data.arr)
        }
      }
      if (!data.items.length) {
        elementOpen("li", "4d94699c-82ec-4503-b67d-d1dd386a3b96", hoisted4)
          text(" \
                  No items found \
                ")
        elementClose("li")
      }
    elementClose("ul")
  elementClose("div")
}
})()
