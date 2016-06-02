# superviews.js

Template engine for google [incremental-dom](http://google.github.io/incremental-dom)

`npm install superviews.js --save`

## API

`tmplstr` (required) - The template string.  
`name` - The output function name (will be overridden with a <template> element).  
`argstr` - The output function arguments (will be overridden with a <template> element).  
`mode` - The output format. Can be one of ['es6', 'cjs', 'browser'], if any other value is passed the function is exported as a variable with that name. 

`superviews(tmplstr, name, argstr, mode)`

## CLI

`cat examples/test.html | superviews --mode=es6 --name=foo --argstr=bar > examples/test.js`

## Example

Create a file called `tmpl.html`

```html
<!--
If the outermost element is a `template` element and contains
an `args` attribute it will be used as the function definition.
A `name` attribute can also be supplied. These will be used to
define the enclosing function name and arguments in the incremental-dom output (see below).
-->
<template name="myWidget" args="data foo bar todos">

  <!--
  `script` tags that have no attributes are treated as literal javascript
  and will be simply inlined into the incremental-dom output.
  -->
  <script>
  function add (item) {
    todos.push(item)
  }

  function remove () {
    todos.pop()
  }
  </script>

  <!-- Attribute values can be set using javascript between curly braces {} -->
  <div class="{data.cssClass}">

    <!-- Attributes are omitted if their expression is null or undefined. Useful for `checked`, `disabled` -->
    <input type="text" disabled="{data.isDisabled}">

    <!-- Interpolation in attributes -->
    <a href="http://www.google.co.uk?q={data.query}"></a>

    <!-- Text Interpolation -->
    My name is {data.name} my age is {data.age}
    I live at {data.address}

    <!-- Any javascript can be used -->
    <div title="{JSON.stringify(data)}">Hover for json</div>

    <button onclick="{alert(hi)}">Say hi</button>
    <input type="text" value="{data.val}" onchange="{data.val = this.value}">

    <!-- Use an `if` attribute for conditional rendering -->
    <p if="data.showMe">
      <span class="{data.bar + ' other-css'}">description</span>
    </p>

    <!-- An `if` tag can also be used for conditional
    rendering by adding a `condition` attribute. -->
    <if condition="data.showMe">
      I'm in an `if` block.
    </if>

    <!-- `elseif` and `else` tags can also be used -->
    <if condition="data.foo === 1">
      <span>1</span>
    <elseif condition="data.foo === 2">
      <span>2</span>
    <else>
      Default
    </if>

    <!-- Use a `skip` attribute for conditional patching of children -->
    <aside>
      <div skip="data.skipMe">
        <span id="{data.id}">
        </span>
      </div>
    </aside>

    <!-- The `style` attribute is special and can be set with an object. -->
    <span style="{ color: data.foo, backgroundColor: data.bar }">My style changes</span>

    <!-- The `each` attribute can be used to repeat over items.
    This includes iterating over keys on an Object or any object that has a
    forEach function e.g. an Array, Map, Set. The callback function
    is passed 3 arguments $value, $item and $target. `this` is the
    object being iterated over.-->
    <ul>
      <li each="item in data.items">
        <span class="{ $item % 2 ? 'odd' : 'even' }">{$item}</span>
        <input value="{item.name}">
      </li>
    </ul>

    <!-- Looping over arrays -->
    <ul>
      <li each="item in data.arr">
        <span>{item.name}</span>
      </li>
    </ul>

    <!-- Looping over object keys -->
    <ul>
      <li each="key in data.obj">
        <span title="hello">{key} - {data.obj[key]}</span>
      </li>
    </ul>

    <!-- The `each` attribute also supports defining a `key` to use.
    For Arrays and Objects this is done automatically for you.

    If you are iterating a Map, this should be set to identify each item in the list.
    This allow the diff patch in to keep track of each item in the list.
    See http://google.github.io/incremental-dom/#conditional-rendering/array-of-items.
    The key used here is `product.id`.
     -->
    <ul>
      <li each="product, product.id in data.products">
        {product.name}
      </li>
    </ul>

    <!-- Conditional iteration -->
    <ul>
      <li if="data.items.length" each="item, item.id in data.arr">
        {item.name}
      </li>
      <li if="!data.items.length" class="list-header">
        No items found
      </li>
    </ul>
  </div>

</template>
```

`cat tmpl.html | superviews > tmpl.js`

Converts the template above to this [incremental-dom](http://google.github.io/incremental-dom) code:

```js
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
```

## browserify
Using [browserify](http://browserify.org/)? There's the [superviewify](https://github.com/davidjamesstone/superviewify) transform allowing you to simply require your templates and have them automatically compiled to incremental-dom javascript.

`npm install superviewify --save`

## supermodels.js

[supermodels.js](https://github.com/davidjamesstone/supermodels.js) fits in nicely with superviews.js. Building models that are observable objects lets us know when our data has changed and when we should patch the dom.

To see how to use supermodels.js and superviews.js together, checkout [superglue.js](http://davidjamesstone.github.io/superglue.js)

# License

  MIT
