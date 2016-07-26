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
    elementOpen("input", "3caca182-0fd8-4571-80db-9f1fc4649b74", hoisted1, "disabled", data.isDisabled)
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
    elementOpen("input", "3ec33dfb-721d-424f-94b9-cbacb448cc72", hoisted2, "value", data.val, "onchange", function ($event) {
      var $element = this;
    data.val = this.value})
    elementClose("input")
    elementOpen("a", "855ab9ab-4a46-4d96-a828-fb7229375d00", hoisted3, "onclick", function ($event) {
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
          var $key = "a5d8be29-d8aa-4c43-9a5d-1a0199be9319_" + $item
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
          var $key = "cd922925-d75c-4c81-a4c7-5cc19a23aa94_" + $item
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
          var $key = "0ecfeacf-bc70-42f0-8b74-591897e9c43f_" + $item
          elementOpen("li", $key)
            elementOpen("span", "5b874ee4-3542-41f3-8cad-79728f7dee6e_" + $key, hoisted4)
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
          var $key = "9e1145c8-0aba-48f2-aa5e-a50383204b58_" + product.id
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
            var $key = "a1117d8a-55b4-4621-a13b-b519e499d735_" + item.id
            elementOpen("li", $key)
              text(" \
                      " + (item.name) + " \
                    ")
            elementClose("li")
          }, this)
        }
      }
      if (!data.items.length) {
        elementOpen("li", "5e6fd229-68b6-4bc1-b4e5-c89f57a1112f", hoisted5)
          text(" \
                  No items found \
                ")
        elementClose("li")
      }
    elementClose("ul")
  elementClose("div")
}
})()
