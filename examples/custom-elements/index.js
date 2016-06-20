require('document-register-element')

var patch = require('../../client/patch')
var view = require('./view.html')

var MyElement = document.registerElement(
  'my-element',
  {
    prototype: Object.create(
      window.HTMLElement.prototype, {
        createdCallback: {value: function () {
          window.console.log('here I am ^_^ ')
          window.console.log('with content: ', this.textContent)
        }},
        attachedCallback: {value: function () {
          window.console.log('live on DOM ;-) ')
        }},
        detachedCallback: {value: function () {
          window.console.log('leaving the DOM :-( )')
        }},
        attributeChangedCallback: {
          value: function (name, previousValue, value) {
            if (previousValue == null) {
              console.log(
                'got a new attribute ', name,
                ' with value ', value
              )
            } else if (value == null) {
              console.log(
                'somebody removed ', name,
                ' its value was ', previousValue
              )
            } else {
              console.log(
                name,
                ' changed from ', previousValue,
                ' to ', value
              )
            }
          }
        }
      })
  }
)

var MySubElement = document.registerElement(
  'my-subelement',
  {
    prototype: Object.create(
      window.HTMLElement.prototype, {
        something: {
          get: function () {
            return this._something
          },
          set: function (value) {
            this._something = value
          }
        },
        createdCallback: {value: function () {
          window.console.log('here I am ^_^ ')
          window.console.log('with content: ', this.textContent)
          patch(this, view, {
            name: 'Egg'
          })
        }},
        attachedCallback: {value: function () {
          window.console.log('live on DOM ;-) ')
        }},
        detachedCallback: {value: function () {
          window.console.log('leaving the DOM :-( )')
        }},
        attributeChangedCallback: {
          value: function (name, previousValue, value) {
            if (previousValue == null) {
              console.log(
                'got a new attribute ', name,
                ' with value ', value
              )
            } else if (value == null) {
              console.log(
                'somebody removed ', name,
                ' its value was ', previousValue
              )
            } else {
              console.log(
                name,
                ' changed from ', previousValue,
                ' to ', value
              )
            }
          }
        }
      })
  }
)