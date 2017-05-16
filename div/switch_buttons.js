nice.block('SwitchButtons')
  .Item('current')
  .Item('button')
  .Item('selectedButton')
  .initBy((z, ...options) => {
    z.selectedButton(b => b.fontWeight('bold'))
    .button(b => b.fontWeight('normal'));
    
    options.forEach(option => {
      var button = z.Span(option).on('click', (e, b) => z.current(option));
      z.current.listenBy(c => c() === option 
        ? z.selectedButton()(button)
        : z.button()(button));
      return button;
    });
    
    z.button.listenBy(s => z.children.each(c => s()(c)));
  });
