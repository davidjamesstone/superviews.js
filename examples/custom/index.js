var xtag = require('x-tag')
var patch = require('../../client/patch')
var view = require('./view.html')
var sub = require('./sub.html')

xtag.register('x-sub', {
  lifecycle: {
    created: function () {
      this.data = {}
      // this.patch()
    },
    attributeChanged: function (attrName, oldValue, newValue) {
      // window.alert('I fire when an ATTRIBUTE is CHANGED on an <x-clock>')
    }
  },
  accessors: {
    name: {
      attribute: {},
      get: function () {
        return this.data.name
      },
      set: function (value) {
        this.data.name = value
        this.patch()
      }
    }
  },
  methods: {
    patch: function () {
      patch(this, sub.bind(this), this.data)
    },
    onChange: function (e) {
      this.data.name = e.target.value
      this.patch()
      // if (this.xtag.interval) this.stop()
      // else this.start()
    }
  },
  events: {
    change: function () {
      this.patch()
      // if (this.xtag.interval) this.stop()
      // else this.start()
    }
  }
})

xtag.register('x-view', {
  lifecycle: {
    created: function () {
      this.data = {
        list: [{
          name: 'My name 1'
        }, {
          name: 'My name 2'
        }, {
          name: 'My name 3'
        }]
      }
      // this.patch()
    },
    attributeChanged: function (attrName, oldValue, newValue) {
      // window.alert('I fire when an ATTRIBUTE is CHANGED on an <x-clock>')
    }
  },
  accessors: {
    name: {
      attribute: {},
      get: function () {
        return this.data.name
      },
      set: function (value) {
        this.data.name = value
        this.patch()
      }
    }
  },
  methods: {
    patch: function () {
      patch(this, view, this.data)
    }
  },
  events: {
    click: function () {
      // if (this.xtag.interval) this.stop()
      // else this.start()
    }
  }
})

