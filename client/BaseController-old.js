const validator = require('is-my-json-valid')
const Freezer = require('freezer-js')
const patch = require('./patch')

const Symbols = {
  VIEW: Symbol('view'),
  STATE: Symbol('state')
}

const validatorOptions = {
  greedy: true,
  formats: {
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i
  }
}

const convertValueFromStringToType = function (value, type) {
  if (typeof (value) !== 'string' || type === 'string') {
    return value
  }
  if (type === 'integer' || type === 'number') {
    // fastest (and more reliable) way to convert strings to numbers
    var convertedVal = 1 * value
    // make sure that if our schema calls for an integer, that there is no decimal
    if (convertedVal || convertedVal === 0 && (type === 'number' || (value.indexOf('.') === -1))) {
      return convertedVal
    }
  } else if (type === 'boolean') {
    if (value === 'true') {
      return true
    } else if (value === 'false') {
      return false
    }
  }
  return value
}

class BaseController {
  constructor (el, view, propsSchema = {}, attrsSchema = {}, initialState = {}) {
    const controller = this

    this.el = el
    this.view = view
    this.propsSchema = propsSchema
    this.attrsSchema = attrsSchema

    this.attrs = {}
    this.props = {}
    this.propsValidatorMap = {}
    this.attrsValidatorMap = {}
    let renderTimeoutId = 0

    function render () {
      if (!renderTimeoutId) {
        renderTimeoutId = setTimeout(function () {
          renderTimeoutId = 0
          controller.render()
        })
      }
    }

    for (let prop in propsSchema) {
      const propSchema = propsSchema[prop]
      const validate = validator(propSchema, validatorOptions)
      let val = propsSchema[prop].default
      this.propsValidatorMap[prop] = validate

      Object.defineProperty(this.props, prop, {
        enumerable: true,
        get: function () {
          return val
        },
        set: function (value) {
          val = value
          render()
        }
      })
    }

    for (let attr in attrsSchema) {
      const attrSchema = attrsSchema[attr]
      const validate = validator(attrSchema, validatorOptions)
      this.attrsValidatorMap[attr] = validate
      Object.defineProperty(this.attrs, attr, {
        enumerable: true,
        get: function () {
          let val = el.getAttribute(attr) || attrSchema.default
          if (typeof val !== 'undefined') {
            return convertValueFromStringToType(val, attrSchema.type)
          }
        },
        set: function (value) {
          el.setAttribute(attr, value)
        }
      })
    }

    const state = new Freezer(initialState)
    this[Symbols.STATE] = state

    state.on('update', function (currentState, prevState) {
      render()
    })
  }

  get state () {
    return this[Symbols.STATE].get()
  }

  render () {
    const view = this.view
    console.log('rendering')
    patch(this.el, function () {
      view.call(this.el, this, this.state, this.props)
    }.bind(this))
  }

  emit (name, value) {
    const event = new window.CustomEvent(name, { detail: value })
    if (this.props['on' + name]) {
      this.props['on' + name].call(this.el, event)
    }
    this.el.dispatchEvent(event)
  }

  validate () {
    const validatePropsResult = this.validateProps()
    const validateAttrsResult = this.validateAttrs()

    return {
      ok: validatePropsResult.ok && validateAttrsResult.ok,
      props: validatePropsResult,
      attrs: validateAttrsResult
    }
  }

  validateProps () {
    const result = {
      ok: true,
      validations: {}
    }

    for (let propValidatorKey in this.propsValidatorMap) {
      const validate = this.propsValidatorMap[propValidatorKey]
      const validateResult = validate(this.props[propValidatorKey])
      result.validations[propValidatorKey] = {
        name: propValidatorKey,
        ok: validateResult,
        error: validate.error,
        errors: validate.errors
      }

      if (!validateResult) {
        result.ok = false
      }
    }
    return result
  }

  validateAttrs () {
    const result = {
      ok: true,
      validations: {}
    }

    for (let attrValidatorKey in this.attrsValidatorMap) {
      const validate = this.attrsValidatorMap[attrValidatorKey]
      const validateResult = validate(this.attrs[attrValidatorKey])
      result.validations[attrValidatorKey] = {
        name: attrValidatorKey,
        ok: validateResult,
        error: validate.error,
        errors: validate.errors
      }

      if (!validateResult) {
        result.ok = false
      }
    }
    return result
  }
}

module.exports = BaseController
