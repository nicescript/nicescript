let autoId = 0;

function defaultSetValue(t, v){
  t.attributes('value', v);
};


function attachValue(target, setValue = defaultSetValue){
  let node, mute;
  target.value = Box("");
  target.value._parent = target;

  if(nice.isEnvBrowser){
    const onChange = e => {
      mute = true;
      target.value((e.target || e.srcElement).value);
      mute = false;
      return true;
    };
    ['change', 'keyup', 'paste', 'search', 'input']
        .forEach(k => target.on(k, onChange));

    target.id() || target.id('_nn_' + autoId++);
    target.on('domNode', n => node = n);
  }
  target.value.listen(v => node ? node.value = v : setValue(target, v));
  return target;
}


nice.Block('Input')
  .by((z, type) => attachValue(z.tag('input').attributes('type', type || 'text')));


nice.Block('Button')
  .by((z, text, action) => {
    z.tag('input').attributes({type: 'button', value: text}).on('click', action);
  });


nice.Block('Textarea')
  .by((z, value) => {
    z.tag('textarea');
    attachValue(z, (t, v) => t.children.removeAll().push(v));
    z.value(value ? '' + value : "");
  });


nice.Block('Submit', (z, text) =>
    z.tag('input').attributes({type: 'submit', value: text}));


nice.Block('Checkbox')
  .by((z, status) => {
    let node;
    z.tag('input').attributes({type: 'checkbox'});
    z.checked = Box(status || false);
    z.checked._parent = z;

    let mute;
    z.on('change', e => {
      mute = true;
      z.checked((e.target || e.srcElement).checked);
      mute = false;
      return true;
    });

    if(nice.isEnvBrowser){
      z.id() || z.id('_nn_' + autoId++);
      z.on('domNode', n => node = n);
    }

    z.checked.listen(v => node ? node.checked = v : z.attributes('checked', v));
  });