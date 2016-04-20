# superviews.js

Template engine for google [incremental-dom](http://google.github.io/incremental-dom)

`npm install superviews.js --save`

Using [browserify](http://browserify.org/)? There's the [superviewify](https://github.com/davidjamesstone/superviewify) transform allowing you to simply require your templates and have them automatically compiled to incremental-dom javascript.

`npm install superviewify --save`

[supermodels.js](https://github.com/davidjamesstone/supermodels.js) fits in nicely with superviews.js. Building models that are observable objects lets us know when our data has changed and when we should patch the dom.

To see how to use supermodels.js and superviews.js together, checkout [superglue.js](http://davidjamesstone.github.io/superglue.js)

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

  <!-- Element keys are added with the `key` attribute -->
  <span key="foo" title="boo"></span>

  <!-- Placeholder elements are defined with the `placeholder` element. The `tag` attribute is optional -->
  <placeholder key="bar" title="I will render only once. Subsequent patches will be skipped." tag="div"></placeholder>

  <!-- Attribute values can be set using javascript between curly braces {} -->
  <div class="{data.cssClass}">

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
      <input type="text" disabled="{data.isDisabled}">
    </p>

    <!-- An `if` tag can also be used for conditional
     rendering by adding a `condition` attribute. -->
    <if condition="data.showMe">
      I'm in an `if` block.
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
        <span title="hello">{key} - {data.obj[key]}</span>
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
var hoisted1 = ["title", "boo"]
var hoisted2 = ["title", "I will render only once. Subsequent patches will be skipped."]
var hoisted3 = ["type", "text"]
var hoisted4 = ["type", "text"]
var hoisted5 = ["title", "hello"]
var hoisted6 = ["class", "list-header"]

return function myWidget (data, foo, bar, todos) {
  function add (item) {
      todos.push(item)
    }

    function remove () {
      todos.pop()
    }
  elementOpen("span", "foo", hoisted1)
  elementClose("span")
  elementPlaceholder("div", "bar", hoisted2)
  elementOpen("div", null, null, "class", data.cssClass)
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
    elementOpen("input", null, hoisted3, "value", data.val, "onchange", function ($event) {
      $event.preventDefault();
      var $element = this;
    data.val = this.value})
    elementClose("input")
    if (data.showMe) {
      elementOpen("p")
        elementOpen("span", null, null, "class", data.bar + ' other-css')
          text("description")
        elementClose("span")
        elementOpen("input", null, hoisted4, "disabled", data.isDisabled)
        elementClose("input")
      elementClose("p")
    }
    if (data.showMe) {
      text(" \
            I'm in an `if` block. \
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
          elementOpen("span", null, hoisted5)
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
    elementOpen("ul")
      if (data.items.length) {
        ;(Array.isArray(data.arr) ? data.arr : Object.keys(data.arr)).forEach(function(item, $index) {
          elementOpen("li", item.id)
            text(" \
                    " + (item.name) + " \
                  ")
          elementClose("li")
        }, data.arr)
      }
      if (!data.items.length) {
        elementOpen("li", null, hoisted6)
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

# License

  MIT
