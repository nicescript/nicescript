nice.block('Input')
  .String('type')
  .String('name')
  .Item('value')
  .Method(function listenValueBy(f){
    this.value.listenBy(v => f(v()));
    return this;
  })
  .initBy((z, type) => {
    z.tag('input').attributes('type', type).value("");

    z.on(['change', 'keyup', 'paste', 'search', 'input'], function () {
      z.value(z.pane.value);
      return true;
    });

    z.value.listenBy(v => {
      z.pane && z.pane.value !== v() && (z.pane.value = v());
      return true;
    });

    return z;
  })
  .Method(function focus(){
    this.pane && this.pane.focus();
    this.isFocused = 1;
    return this;
  });


nice.block('Button')
  .initBy((z, text, action) => {
    z.tag('input').attributes({type: 'button', value: text}).on('click', action);
  });


nice.block('Textarea')
  .String('name')
  .String('value')
  .initBy((z, value = '') => {
    z.tag('textarea').value(value);

    z.on(['change', 'keyup', 'paste', 'search', 'input'], function () {
      z.value(z.pane.value);
      return true;
    });

    z.value.listenBy(v => {
      z.pane && (z.pane.value = v());
      z.children.resetValue()(v());
      return true;
    });

    return z;
  })
  .Method(function focus(){
    this.pane && this.pane.focus();
    this.isFocused = 1;
    return this;
  });


nice.block('Submit', (z, text) =>
    z.tag('input').attributes({type: 'submit', value: text}));


nice.block('Checkbox')
  .Boolean('checked')
  .Array('onSwitch')
  .Method(function isChecked(){
    return this.attributes('checked') || false;
  })
  .initBy((z, on) => {
    z.tag('input').attributes({type: 'checkbox', checked: on || false});
    z.on('change', () => {
      z.checked(z.pane.checked);
      z.onSwitch.callEach(z.pane.checked);
      return true;
    });
    z.checked.listenBy(v => {
      z.pane && z.pane.checked !== v() && (z.pane.checked = v());
      return true;
    });
  });