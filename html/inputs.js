let autoId = 0;
const Html = nice.Html;

function defaultSetValue(t, v){
  t.attributes('value', v);
};


const changeEvents = ['change', 'keyup', 'paste', 'search', 'input'];

function attachValue(target, setValue = defaultSetValue){
  let node, mute;
  target.value = Box("");
  target.value._parent = target;

  if(nice.isEnvBrowser){
    changeEvents.forEach(k => target.on(k, e => {
      mute = true;
      target.value((e.target || e.srcElement).value);
      mute = false;
      return true;
    }));

    target.id() || target.id('_nn_' + autoId++);
    target.on('domNode', n => node = n);
  }
  target.value.listen(v => node ? node.value = v : setValue(target, v));
  return target;
}

Html.extend('Input')
  .by((z, type) => attachValue(z.tag('input').attributes('type', type || 'text')));


Html.extend('Button')
  .by((z, text, action) => {
    z.tag('input').attributes({type: 'button', value: text}).on('click', action);
  });


Html.extend('Textarea')
  .by((z, value) => {
    z.tag('textarea');
    attachValue(z, (t, v) => t.children.removeAll().push(v));
    z.value(value ? '' + value : "");
  });


Html.extend('Submit').by((z, text) =>
    z.tag('input').attributes({type: 'submit', value: text}));


Html.extend('Checkbox')
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