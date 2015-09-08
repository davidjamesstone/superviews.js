module.exports = function widget (basket) {
  var totalItems
  elementOpen("h3")
    text("Total lines" + basket.items.length + ", total quantity" + basket.totalQuantity)
  elementClose("h3")
}
