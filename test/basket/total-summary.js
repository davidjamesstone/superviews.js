module.exports = function summary (basket) {
  elementOpen("tfoot")
    elementOpen("tr")
      elementOpen("td")
        elementOpen("h3")
          text("" + basket.totalCost.toFixed(2) + "")
        elementClose("h3")
      elementClose("td")
    elementClose("tr")
  elementClose("tfoot")
}
