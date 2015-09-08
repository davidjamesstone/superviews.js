require('array.prototype.find')
require('array.prototype.findindex')

// var superglue = require('../')
// var superviews = require('superviews.js')
var supermodels = require('supermodels.js')
var template = require('./template')
var productsData = require('./products-data')
var basketData = require('./basket-data')

var productSchema = {
  productId: String,
  productName: String,
  price: Number,
  image: String,
  discountPercent: Number,
  get cost () {
    return this.price - (this.price * this.discountPercent)
  }
}

var productsSchema = [productSchema]

var basketSchema = {
  items: [{
    productId: String,
    quantity: Number,
    get cost () {
      var product = this.product
      return this.quantity * (product.price - (product.price * product.discountPercent))
    },
    get product () {
      var id = this.productId

      return this.__ancestors[this.__ancestors.length - 1].products.filter(function (item) {
        return item.productId === id
      })[0]
    }
  }],
  get totalCost () {
    var total = 0

    for (var i = 0, len = this.items.length; i < len; i++) {
      total += this.items[i].cost
    }

    return total
  },
  get totalQuantity () {
    var total = 0

    for (var i = 0, len = this.items.length; i < len; i++) {
      total += this.items[i].quantity
    }

    return total
  }
}

var Basket = supermodels(basketSchema)
var Products = supermodels(productsSchema)

var appSchema = {
  basket: Basket,
  products: Products,
  addToBasket: function (product) {
    var items = this.basket.items

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
}

var App = supermodels(appSchema)
var app = new App({
  basket: new Basket(basketData),
  products: new Products(productsData)
})

var el = document.getElementById('mount')

function render () {
  patch(el, template, app)
}
render()

window.app = app

function Controller () {
  this.model = new Model()

  this.addToBasket = function (product) {
    var items = this.basket.items

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
}

app.on('change', render)

// setInterval(render, 5000)
// module.export = superglue(component)
