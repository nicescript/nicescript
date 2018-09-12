const Html = nice.Html;

function defaultSetValue(t, v){
  t.attributes.set('value', v);
};


const changeEvents = ['change', 'keyup', 'paste', 'search', 'input'];

function attachValue(target, setValue = defaultSetValue){
  let node, mute;
  target.value = Box("");

  if(nice.isEnvBrowser){
    changeEvents.forEach(k => target.on(k, e => {
      mute = true;
      target.value((e.target || e.srcElement).value);
      mute = false;
      return true;
    }));

    target._autoId();
    target.on('domNode', n => node = n);
  }
  target.value.listen(v => node ? node.value = v : setValue(target, v));
  return target;
}

Html.extend('Input')
  .about('Represents HTML <input> element.')
  .by((z, type) => {
    z.tag('input').attributes.set('type', type || 'text');
    attachValue(z);
  });


Html.extend('Button')
  .about('Represents HTML <input type="button"> element.')
  .by((z, text, action) => {
    z.tag('input').attributes({type: 'button', value: text}).on('click', action);
  });


Html.extend('Textarea')
  .about('Represents HTML <textarea> element.')
  .by((z, value) => {
    z.tag('textarea');
    attachValue(z, (t, v) => t.children.removeAll().push(v));
    z.value(value ? '' + value : "");
  });


Html.extend('Submit')
  .about('Represents HTML <input type="submit"> element.')
  .by((z, text) => z.tag('input').attributes.set({type: 'submit', value: text}));


Html.extend('Checkbox')
  .about('Represents HTML <input type="checkbox"> element.')
  .by((z, status) => {
    let node;
    z.tag('input').attributes({type: 'checkbox'});
    z.checked = Box(status || false);

    let mute;
    z.on('change', e => {
      mute = true;
      z.checked((e.target || e.srcElement).checked);
      mute = false;
      return true;
    });

    if(nice.isEnvBrowser){
      z._autoId();
      z.on('domNode', n => node = n);
    }

    z.checked.listen(v => node ? node.checked = v : z.attributes.set('checked', v));
  });