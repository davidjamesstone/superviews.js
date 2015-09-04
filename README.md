# superviews.js

Template engine for google [incremental-dom](http://google.github.io/incremental-dom)

`npm install superviews.js`

```html
<!-- Attributes can be set using javascript between curly braces {} -->
<div title="{data.title}">

  <!-- If an Attribute value is known not
  to change include an equals sign '='.
  This assigns a staticPropertyValue
  and is set-once evaluation. Do this to save
  time during diff patch updates. -->
  <div class="{=data.cssClass}"></div>

  <!-- Text Interpolation is done using {} -->
  My name is {data.name} my age is {data.age}
  I live at {data.address}

  <!-- Any javascript can be used -->
  <span title="{JSON.stringify(data)}">Hi</span>

  <!-- `on` events can be bound to model handlers -->
  <input type="text" value="{data.val}" onchange="{=data.onChange}">

  <!-- Use an `if` attribute for conditional rendering -->
  <p if="data.showMe">

	<!-- The `style` attribute is special and can be set with an object.
	  If the data is known not to change, again, use the equals sign.-->
    <span style="{= color: data.foo, backgroundColor: data.bar }">{data.name}</span>
    <span class="{data.bar + ' other-css'}">description</span>
    <input type="text" disabled="{data.isDisabled}">
  </p>
  <ul>
	<!-- The `each` attribute declares a forEach
	block and can be used to repeat over items in
	an Array or keys on an Object -->
    <li each="item in data.items">
      <span class="{ $index % 2 ? 'odd' : 'even' }">{$index}</span>
      <span>{item.foo}</span>
      <input value="{item.name}">
    </li>
  </ul>
  <ul>
	<!-- Looping over arrays -->
    <li each="item in data.arr">
      <span>{item}</span>
      <span>{$index}</span>
      <span>{data.arr[item]}</span>
    </li>
  </ul>
  <ul>
	<!-- Looping over object keys -->
    <li each="key in data.obj">
      <span>{key}</span>
      <span>{index}</span>
      <!-- `this` can also be used in `each` blocks -->
      <span>{this[key]}</span>
    </li>
  </ul>
</div>
```

`cat tmpl.html | superviews -name description > output.js`

The above compiles this [incremental-dom](http://google.github.io/incremental-dom) code:


```js
function description(data) {
	elementOpen("div", null, null, "title", data.title)
	  elementOpen("div", null, ["class", data.cssClass])
	  elementClose("div")
	  text(" \
	    My name is " + data.name + " my age is " + data.age + " \
	    I live at " + data.address + " \
	   \
	    ")
	  elementOpen("span", null, null, "title", JSON.stringify(data))
	    text("Hi")
	  elementClose("span")
	  elementOpen("input", null, ["type", "text", "onchange", data.onChange], "value", data.val)
	  elementClose("input")
	  if (data.showMe) {
	    elementOpen("p")
	      elementOpen("span", null, ["style", { color: data.foo, backgroundColor: data.bar }])
	        text(data.name)
	      elementClose("span")
	      elementOpen("span", null, null, "class", data.bar + ' other-css')
	        text("description")
	      elementClose("span")
	      elementOpen("input", null, ["type", "text"], "disabled", data.isDisabled)
	      elementClose("input")
	    elementClose("p")
	  }
	  elementOpen("ul")
	    ;(Array.isArray(data.items) ? data.items : Object.keys(data.items)).forEach(function(item, index) {
	      elementOpen("li", "item in data.items" + index)
	        elementOpen("span", null, null, "class",  $index % 2 ? 'odd' : 'even' )
	          text($index)
	        elementClose("span")
	        elementOpen("span")
	          text(item.foo)
	        elementClose("span")
	        elementOpen("input", null, null, "value", item.name)
	        elementClose("input")
	      elementClose("li")
	    }, data.items)
	  elementClose("ul")
	  elementOpen("ul")
	    ;(Array.isArray(data.arr) ? data.arr : Object.keys(data.arr)).forEach(function(item, index) {
	      elementOpen("li", "item in data.arr" + index)
	        elementOpen("span")
	          text(item)
	        elementClose("span")
	        elementOpen("span")
	          text($index)
	        elementClose("span")
	        elementOpen("span")
	          text(data.arr[item])
	        elementClose("span")
	      elementClose("li")
	    }, data.arr)
	  elementClose("ul")
	  elementOpen("ul")
	    ;(Array.isArray(data.obj) ? data.obj : Object.keys(data.obj)).forEach(function(key, index) {
	      elementOpen("li", "key in data.obj" + index)
	        elementOpen("span")
	          text(key)
	        elementClose("span")
	        elementOpen("span")
	          text(index)
	        elementClose("span")
	        elementOpen("span")
	          text(this[key])
	        elementClose("span")
	      elementClose("li")
	    }, data.obj)
	  elementClose("ul")
	elementClose("div")
}
```

Then to use it:

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

var el = document.getElementById('');

patch(el, function() {
  description(data);
});

## Testing

```
$ npm test
```

# License

  MIT
