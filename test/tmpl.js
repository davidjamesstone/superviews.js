function myWidget (model, data, animals, fooData, barData) {
  var linesSummary = require('./lines-summary')
    var totalSummary = require('./total-summary')

    var items = []
    function add (item) {
      items.push(item)
    }

    function remove () {
      items.pop()
    }
  elementOpen("div", null, null, "class", data.cssClass)
    elementOpen("div", null, ["title", data.title])
    elementClose("div")
    elementOpen("div", null, ["title", "={data.title}"])
    elementClose("div")
    elementOpen("div", null, null, "title", >data.title)
    elementClose("div")
    elementOpen("div", null, null, "title", #data.title)
    elementClose("div")
    elementOpen("div", null, null, "title", {data.title})
    elementClose("div")
    elementOpen("input", null, ["type", "text", "onchange", function (e) {data.val = this.value}], "value", data.val)
    elementClose("input")
    elementOpen("input", null, ["type", "text", "onchange", "={data.val = this.value}"], "value", data.val)
    elementClose("input")
    elementOpen("input", null, ["type", "text"], "value", data.val, "onchange", function (e) {>data.val = this.value})
    elementClose("input")
    elementOpen("input", null, ["type", "text"], "value", data.val, "onchange", function (e) {#data.val = this.value})
    elementClose("input")
    elementOpen("input", null, ["type", "text"], "value", data.val, "onchange", function (e) {{data.val = this.value}})
    elementClose("input")
    text(" \
        My name is " + (data.name) + " my age is " + (data.age) + " \
        I live at " + (data.address) + " \
     \
        ")
    elementOpen("span", null, null, "title", JSON.stringify(data))
      text("Hi")
    elementClose("span")
    elementOpen("button", null, null, "onclick", function (e) {remove()})
    elementClose("button")
    elementOpen("input", null, ["type", "text"], "value", data.val, "onchange", function (e) {data.val = this.value})
    elementClose("input")
    if (data.showMe) {
      elementOpen("p")
        elementOpen("span", null, null, "class", data.bar + ' other-css')
          text("description")
        elementClose("span")
        elementOpen("input", null, ["type", "text"], "disabled", data.isDisabled)
        elementClose("input")
      elementClose("p")
    }
    if (data.showMe) {
      text(" \
            I'm in an `if` attribute " + (basket.totalCost) + " \
          ")
    }
    elementOpen("span", null, null, "style", { color: data.foo, backgroundColor: data.bar })
      text("My style changes")
    elementClose("span")
    elementOpen("ul")
      ;(Array.isArray(data.items) ? data.items : Object.keys(data.items)).forEach(function(item, $index) {
        elementOpen("li", $index)
          elementOpen("span", null, null, "class",  $index % 2 ? 'odd' : 'even' )
            text("" + ( $index ) + "")
          elementClose("span")
          elementOpen("span")
            text("" + (item.foo) + "")
          elementClose("span")
          elementOpen("input", null, null, "value", item.name)
          elementClose("input")
        elementClose("li")
      }, data.items)
    elementClose("ul")
    elementOpen("ul")
      ;(Array.isArray(data.arr) ? data.arr : Object.keys(data.arr)).forEach(function(item, $index) {
        elementOpen("li", $index)
          elementOpen("span")
            text("" + (item.name) + "")
          elementClose("span")
        elementClose("li")
      }, data.arr)
    elementClose("ul")
    elementOpen("ul")
      ;(Array.isArray(data.obj) ? data.obj : Object.keys(data.obj)).forEach(function(key, $index) {
        elementOpen("li", $index)
          elementOpen("span")
            text("" + (key) + "")
          elementClose("span")
        elementClose("li")
      }, data.obj)
    elementClose("ul")
    elementOpen("ul")
      ;(Array.isArray(data.products) ? data.products : Object.keys(data.products)).forEach(function(product, $index) {
        elementOpen("li", product.id)
        elementClose("li")
      }, data.products)
    elementClose("ul")
  elementClose("div")
}