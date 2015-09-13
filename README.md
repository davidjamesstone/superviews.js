# superviews.js

Template engine for google [incremental-dom](http://google.github.io/incremental-dom)

`npm install superviews.js --save`

Using [browserify](http://browserify.org/)? There's the [superviewify](https://github.com/davidjamesstone/superviewify) transform allowing you to simply require your templates and have them automatically compiled to incremental-dom javascript.

`npm install superviewify --save`

[supermodels.js](https://github.com/davidjamesstone/supermodels.js) fits in nicely with superviews.js. Building models that are observable objects lets us know when our data has changed and when we should patch the dom.
```html
<!--
If the outermost element in the template contains
an `args` attribute it will be used as the template definition.
A `name` attribute can also be supplied. These will be used to
define the enclosing function name and arguments in the incremental-dom output.

If the `name` attribute is omitted, the tag name will be used
allowing you to define custom tags. E.g.
<my-widget args="foo bar baz">
is the same as
<template name="myWidget" args="foo bar baz">.
(Notice the hyphen-case tags are converted to camelCase)
-->
<template name="myWidget" args="data">

  <!--
  `script` tags that have no attributes are treated as literal javascript
  and will be simply inlined into the incremental-dom output.
  -->
  <script>

  var items = []
  function add (item) {
    items.push(item)
  }

  function remove () {
    items.pop()
  }

  </script>

  <!-- Attribute values can be set using javascript between curly braces {} -->
  <div class="{data.cssClass}">

    <!-- Text Interpolation is also done using {} -->
    My name is {data.name} my age is {data.age}
    I live at {data.address}

    <!-- Any javascript can be used -->
    <span title="{JSON.stringify(data)}">Hi</span>

    <!-- `on` events can be bound to model handlers. -->
    <button onclick="{remove()}"></button>
    <!-- The following is equivalent to the line above -->
    <input type="text" value="{data.val}" onchange="{data.val = this.value}">

    <!-- Use an `if` attribute for conditional rendering -->
    <p if="data.showMe">
      <span class="{data.bar + ' other-css'}">description</span>
      <input type="text" disabled="{data.isDisabled}">
    </p>

    <!-- An `if` tag can also be used for conditional rendering
    by adding a condition attribute. -->
    <if condition="data.showMe">
      I'm in an `if` attribute {basket.totalCost}
    </if>

    <!-- The `style` attribute is special and can be set with an object. -->
    <span style="{ color: data.foo, backgroundColor: data.bar }">My style changes</span>

    <!-- The `each` attribute declares a forEach
    block and can be used to repeat over items in
    an Array or keys on an Object. The $index variable
    can be used to identify the position of each item. -->
    <ul>
      <li each="item in data.items">
        <span class="{ $index % 2 ? 'odd' : 'even' }">{ $index }</span>
        <span>{item.foo}</span>
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
        <span>{key}</span>
      </li>
    </ul>

    <!-- The `each` attribute also supports defining a `key` to use.
    This should be set to identify each item in the list. This allow
    the diff patch in to keep track of each item in the list.
    See http://google.github.io/incremental-dom/#conditional-rendering/array-of-items
     -->
    <ul>
      <li each="product, product.id in data.products">
      </li>
    </ul>

  </div>

</template>
```

`cat tmpl.html | superviews -name description > output.js`

The above compiles this [incremental-dom](http://google.github.io/incremental-dom) code:

```js
function myWidget (foo, bar, baz) {
  var items = []
  function add (item) {
    items.push(item)
  }

  function remove () {
    items.pop()
  }

  elementOpen("div", null, null, "class", data.cssClass)
    text(" \
        My name is " + (data.name) + " my age is " + (data.age) + " \
        I live at " + (data.address) + " \
     \
        ")
    elementOpen("span", null, null, "title", JSON.stringify(data))
      text("Hi")
    elementClose("span")
    elementOpen("button", null, null, "onclick", function ($event) {
      $event.preventDefault();
      var $element = this;
    remove()})
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
            I'm in an `if` attribute " + (basket.totalCost) + " \
          ")
    }
    elementOpen("span", null, null, "style", { color: data.foo, backgroundColor: data.bar })
      text("My style changes")
    elementClose("span")
    elementOpen("ul")
      ;(Array.isArray(data.items) ? data.items : Object.keys(data.items)).forEach(function(item, $index) {
        elementOpen("li", $index)
          elementOpen("span", null, null, "class",  $index % 2 ? 'odd' : 'even' )
            text("" + ( $index ) + "")
          elementClose("span")
          elementOpen("span")
            text("" + (item.foo) + "")
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
            text("" + (key) + "")
          elementClose("span")
        elementClose("li")
      }, data.obj)
    elementClose("ul")
    elementOpen("ul")
      ;(Array.isArray(data.products) ? data.products : Object.keys(data.products)).forEach(function(product, $index) {
        elementOpen("li", product.id)
        elementClose("li")
      }, data.products)
    elementClose("ul")
  elementClose("div")
}
```

Then to use it in the browser

```js

var IncrementalDOM = require('incremental-dom'),
    elementOpen = IncrementalDOM.elementOpen,
    elementClose = IncrementalDOM.elementClose,
    elementVoid = IncrementalDOM.elementVoid,
    text = IncrementalDOM.text,
    patch = IncrementalDOM.patch;

var data = {
  title: 'Hello World!',
  cssClass: 'my-class',
  val: 42,
  name: 'Elizabeth',
  age: 90,
  address: 'Buckingham Palace',
  showMe: true,
  items: [...],
  arr: [...],
  obj: {...}
};

var el = document.getElementById('mount');

patch(el, function() {
  myWidget(data);
});

```

## Testing

```
$ npm test
```

# License

  MIT
