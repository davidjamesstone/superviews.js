function widget (data) {
  elementOpen('div', null, null, 'title', data.cls)
  elementOpen('span')
  text('Widget')
  elementClose('span')
  elementClose('div')
}
