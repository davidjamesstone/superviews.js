module.exports = function (model) {
var basket = model.basket
  var products = model.products
  var linesSummary = require('./lines-summary')
  var totalSummary = require('./total-summary')

  function add (product) {
    var items = basket.items

    var existing = items.find(function (item) {
      return item.productId === product.productId
    })

    if (existing) {
      existing.quantity++
    } else {
      var item = items.create()
      item.productId = product.productId
      item.quantity = 1
      items.push(item)
    }
  }

  function remove ($index) {
    basket.items.splice($index, 1)
  }
elementOpen("table")
  elementOpen("thead")
    elementOpen("tr")
      elementOpen("th")
        text("productId")
      elementClose("th")
      elementOpen("th")
        text("productName")
      elementClose("th")
      elementOpen("th")
        text("quantity")
      elementClose("th")
      elementOpen("th")
        text("price")
      elementClose("th")
      elementOpen("th")
        text("discountPercent")
      elementClose("th")
      elementOpen("th")
        text("cost")
      elementClose("th")
      elementOpen("th")
        linesSummary(basket)
      elementClose("th")
    elementClose("tr")
  elementClose("thead")
  elementOpen("tbody")
    ;(Array.isArray(basket.items) ? basket.items : Object.keys(basket.items)).forEach(function(item, $index) {
      elementOpen("tr", item.id)
        elementOpen("td", null, null, "onclick", add)
          text("" + item.product.productId + "")
        elementClose("td")
        elementOpen("td")
          text("" + item.product.productName + "")
        elementClose("td")
        elementOpen("td")
          elementOpen("input", null, ["type", "number", "onchange", function (e) { item.quantity = this.value}], "value", item.quantity)
          elementClose("input")
        elementClose("td")
        elementOpen("td")
          text("" + item.product.price + "")
        elementClose("td")
        elementOpen("td")
          text("" + item.product.discountPercent * 100 + ' %' + "")
        elementClose("td")
        elementOpen("td")
          text("" + item.cost.toFixed(2) + "")
        elementClose("td")
        elementOpen("td")
          elementOpen("button", null, ["onclick", function (e) { remove($index) }])
            text("Remove")
          elementClose("button")
        elementClose("td")
      elementClose("tr")
    }, basket.items)
    elementOpen("tbody")
      totalSummary(basket)
    elementClose("tbody")
  elementClose("tbody")
elementClose("table")
;(Array.isArray(products) ? products : Object.keys(products)).forEach(function(product, $index) {
  elementOpen("div", $index, ["style", "width: 33%; float: left;"])
    elementOpen("div")
      text("" + product.productId + "")
    elementClose("div")
    elementOpen("div")
      text("" + product.productName + "")
    elementClose("div")
    elementOpen("div")
      text("" + product.price + "")
    elementClose("div")
    elementOpen("div")
      text("" + product.discountPercent * 100 + ' %' + "")
    elementClose("div")
    elementOpen("div")
      text("" + product.cost.toFixed(2) + "")
    elementClose("div")
    elementOpen("img", null, ["style", "max-width: 240px; max-height: 200px;"], "src", product.image)
    elementClose("img")
    elementOpen("button", null, ["onclick", function (e) { add(product)}])
      text("Add to basket")
    elementClose("button")
  elementClose("div")
}, products)
};
