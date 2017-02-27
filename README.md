# superviews.js

On the server `superviews.js` is used as a template engine for google's [incremental-dom](http://google.github.io/incremental-dom).

It can also now be used [in the browser](#client) to help build web applications based on [Custom Elements V1](https://www.w3.org/TR/custom-elements/)

Try it out [live in your browser](http://davidjamesstone.github.io/superviews.js/playground/index.html)

`npm install superviews.js --save`

## API

`tmplstr` (required) - The template string.  
`name` - The output function name (will be overridden with a `<template>` element).  
`argstr` - The output function arguments (will be overridden with a `<template>` element).  
`mode` - The output format. Can be one of ['es6', 'cjs', 'browser', 'amd'], if any other value is passed the function is exported as a variable with that name. 

`superviews(tmplstr, name, argstr, mode)`

## CLI

`cat examples/test.html | superviews --mode=es6 --name=foo --argstr=bar > examples/test.js`

## Client

NEW! superviews can now be [used in the browser](docs/client.md).

Use it as a clientside library with a set of helpful classes and methods for building web applications based on the Web Components spec, specifically [Custom Elements V1](https://www.w3.org/TR/custom-elements/).

## Example

Create a file called `tmpl.html`

```html
<!--
If the outermost element is a `template` element and contains
an `args` attribute it will be used as the function definition.
A `name` attribute can also be supplied. These will be used to
define the enclosing function name and arguments in the incremental-dom output (see below).
-->
<template name="myWidget" args="data todos foo bar">

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

    <!-- 'on' event handlers. $event and $element are available to use in the handler. -->
    <button onclick="{alert(hi)}">Say hi</button>
    <input type="text" value="{data.val}" onchange="{data.val = this.value}">
    <a href="#" onclick="{$event.preventDefault(); model.doSomething();}">Some link</a>

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
    forEach function e.g. an Array, Map, Set.
    Three variables are available for each iteration: $value, $item and $target.-->
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
var hoisted3 = ["href", "#"]
var hoisted4 = ["title", "hello"]
var hoisted5 = ["class", "list-header"]
var __target

return function myWidget (data, todos, foo, bar) {
  function add (item) {
      todos.push(item)
    }

    function remove () {
      todos.pop()
    }
  elementOpen("div", null, null, "class", data.cssClass)
    elementOpen("input", "ba1d808c-0069-43bc-a345-89d8a60fa494", hoisted1, "disabled", data.isDisabled)
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
      var $element = this;
    alert(hi)})
      text("Say hi")
    elementClose("button")
    elementOpen("input", "0887e662-2503-4669-b314-2d155cc72cad", hoisted2, "value", data.val, "onchange", function ($event) {
      var $element = this;
    data.val = this.value})
    elementClose("input")
    elementOpen("a", "4308eec1-f2dc-4247-a8d6-c07e81db0c3e", hoisted3, "onclick", function ($event) {
      var $element = this;
    $event.preventDefault(); model.doSomething();})
      text("Some link")
    elementClose("a")
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
      __target = data.items
      if (__target) {
        ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
          var item = $value
          var $key = "163c079d-6890-40f1-8983-b4119652d7ca_" + $item
          elementOpen("li", $key)
            elementOpen("span", null, null, "class",  $item % 2 ? 'odd' : 'even' )
              text("" + ($item) + "")
            elementClose("span")
            elementOpen("input", null, null, "value", item.name)
            elementClose("input")
          elementClose("li")
        }, this)
      }
    elementClose("ul")
    elementOpen("ul")
      __target = data.arr
      if (__target) {
        ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
          var item = $value
          var $key = "9ee2a95c-ce40-4c43-9e1b-bb1e3771c72f_" + $item
          elementOpen("li", $key)
            elementOpen("span")
              text("" + (item.name) + "")
            elementClose("span")
          elementClose("li")
        }, this)
      }
    elementClose("ul")
    elementOpen("ul")
      __target = data.obj
      if (__target) {
        ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
          var key = $value
          var $key = "07608362-dc5c-4fca-9f46-381ffc62a929_" + $item
          elementOpen("li", $key)
            elementOpen("span", "4bf05389-7b34-4184-9ae5-2f1371d46d05_" + $key, hoisted4)
              text("" + (key) + " - " + (data.obj[key]) + "")
            elementClose("span")
          elementClose("li")
        }, this)
      }
    elementClose("ul")
    elementOpen("ul")
      __target = data.products
      if (__target) {
        ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
          var product = $value
          var $key = "494094aa-b914-405e-b489-31348c78a2f7_" + product.id
          elementOpen("li", $key)
            text(" \
                    " + (product.name) + " \
                  ")
          elementClose("li")
        }, this)
      }
    elementClose("ul")
    elementOpen("ul")
      if (data.items.length) {
        __target = data.arr
        if (__target) {
          ;(__target.forEach ? __target : Object.keys(__target)).forEach(function($value, $item, $target) {
            var item = $value
            var $key = "f53fcb3e-8035-4108-91bc-1d7661d41681_" + item.id
            elementOpen("li", $key)
              text(" \
                      " + (item.name) + " \
                    ")
            elementClose("li")
          }, this)
        }
      }
      if (!data.items.length) {
        elementOpen("li", "39dad44a-39c4-4d2d-bb31-7daf5bef8b73", hoisted5)
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

# License

  MIT
