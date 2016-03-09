;(function () {
var hoisted1 = ["class", "name icon icon-file-text"]
var hoisted2 = ["class", "expanded"]
var hoisted3 = ["class", "collapsed"]
var hoisted4 = ["class", "name icon icon-file-directory"]
var hoisted5 = ["class", "triangle-left"]

return function tree (data, tree, isRoot, current, onClick) {
  elementOpen("ul", null, null, "class", isRoot ? 'tree' : '')
    ;(Array.isArray(data) ? data : Object.keys(data)).forEach(function(fso, $index) {
      elementOpen("li", fso.path)
        if (fso.isFile) {
          elementOpen("a", null, null, "href", '/file?path=' + fso.relativePath)
            elementOpen("span", null, hoisted1, "data-name", fso.name, "data-path", fso.relativePath)
              text(" \
                          " + (fso.name) + " \
                        ")
            elementClose("span")
          elementClose("a")
        }
        if (fso.isDirectory) {
          elementOpen("a", null, null, "onclick", function ($event) {
            $event.preventDefault();
            var $element = this;
          onClick(fso)})
            if (fso.expanded) {
              elementOpen("small", null, hoisted2)
                text("▼")
              elementClose("small")
            }
            if (!fso.expanded) {
              elementOpen("small", null, hoisted3)
                text("▶")
              elementClose("small")
            }
            elementOpen("span", null, hoisted4, "data-name", fso.name, "data-path", fso.relativePath)
              text(" \
                          " + (fso.name) + " \
                        ")
            elementClose("span")
          elementClose("a")
        }
        if (fso.isFile && fso === current) {
          elementOpen("span", null, hoisted5)
          elementClose("span")
        }
        if (fso.isDirectory && fso.expanded) {
          fso.children.sort(function(a, b) {
                      if (a.isDirectory) {
                        if (b.isDirectory) {
                          return a.name.toLowerCase()
          < b.name.toLowerCase() ? -1 : 1
                        } else {
                          return -1
                        }
                      } else {
                        if (b.isDirectory) {
                          return 1
                        } else {
                          return a.name.toLowerCase()
          < b.name.toLowerCase() ? -1 : 1
                        }
                      }
                    })
                    tree(fso.children, tree, false, current, onClick)
        }
      elementClose("li")
    }, data)
  elementClose("ul")
}
})()