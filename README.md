# superviews.js

Template engine for google [incremental-dom](http://google.github.io/incremental-dom)

`npm install superviews.js --save`

Using [browserify](http://browserify.org/)? There's the [superviewify](https://github.com/davidjamesstone/superviewify) transform allowing you to simply require your templates and have them automatically compiled to incremental-dom javascript.

`npm install superviewify --save`

[supermodels.js](https://github.com/davidjamesstone/supermodels.js) fits in nicely with superviews.js. Building models that are observable objects lets us know when our data has changed and when we should patch the dom.

To see how to use supermodels.js and superviews.js together, checkout [superglue.js](http://davidjamesstone.github.io/superglue.js)

```html
<!--
If the outermost element is a template tag and contains
an `args` attribute it will be used as the template definition.
A `name` attribute can also be supplied. These will be used to
define the enclosing function name and arguments in the incremental-dom output.
-->
<template name="myWidget" args="data foo bar">

  <!--
  `script` tags that have no attributes are treated as literal javascript
  and will be simply inlined into the incremental-dom output.
  -->
  <script>

    var todos = []

    function add (item) {
      todos.push(item)
    }

    function remove () {
      todos.pop()
    }

  </script>

  <!-- Attribute values can be set using javascript between curly braces {} -->
  <div class="{data.cssClass}">

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
      <input type="text" disabled="{data.isDisabled}">
    </p>

    <!-- An `if` tag can also be used for conditional
     rendering by adding a `condition` attribute. -->
    <if condition="data.showMe">
      I'm in an `if` attribute
    </if>

    <!-- The `style` attribute is special and can be set with an object. -->
    <span style="{ color: data.foo, backgroundColor: data.bar }">My style changes</span>

    <!-- The `each` attribute declares a forEach
    block and can be used to repeat over items in
    an Array or keys on an Object. The $index variable
    can be used to identify the position of each item. -->
    <ul>
      <li each="item in data.items">
        <span class="{ $index % 2 ? 'odd' : 'even' }">{$index}</span>
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
        <span>{key} - {data.obj[key]}</span>
      </li>
    </ul>

    <!-- The `each` attribute also supports defining a `key` to use.
    This should be set to identify each item in the list. This allow
    the diff patch in to keep track of each item in the list.
    See http://google.github.io/incremental-dom/#conditional-rendering/array-of-items.
    The key used here is `product.id`. If a key is not supplied, $index will be used.
     -->
    <ul>
      <li each="product, product.id in data.products">
        {product.name}
      </li>
    </ul>
  </div>

</template>
```

`cat tmpl.html | superviews -name description > output.js`

The above compiles this [incremental-dom](http://google.github.io/incremental-dom) code:

```js
function myWidget (data, foo, bar) {
  var todos = []

  function add (item) {
    todos.push(item)
  }

  function remove () {
    todos.pop()
  }

  elementOpen("div", null, null, "class", data.cssClass)
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
    elementOpen("input", null, ["type", "text"], "value", data.val, "onchange", function ($event) {
      $event.preventDefault();
      var $element = this;
    data.val = this.value})
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
            I'm in an `if` attribute \
          ")
    }
    elementOpen("span", null, null, "style", { color: data.foo, backgroundColor: data.bar })
      text("My style changes")
    elementClose("span")
    elementOpen("ul")
      ;(Array.isArray(data.items) ? data.items : Object.keys(data.items)).forEach(function(item, $index) {
        elementOpen("li", $index)
          elementOpen("span", null, null, "class",  $index % 2 ? 'odd' : 'even' )
            text("" + ($index) + "")
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
            text("" + (key) + " - " + (data.obj[key]) + "")
          elementClose("span")
        elementClose("li")
      }, data.obj)
    elementClose("ul")
    elementOpen("ul")
      ;(Array.isArray(data.products) ? data.products : Object.keys(data.products)).forEach(function(product, $index) {
        elementOpen("li", product.id)
          text(" \
                  " + (product.name) + " \
                ")
        elementClose("li")
      }, data.products)
    elementClose("ul")
  elementClose("div")
}
```

## Testing

```
$ npm test
```

# License

  MIT
