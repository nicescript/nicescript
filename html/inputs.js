//const Html = nice.Html;
//
//function defaultSetValue(t, v){
//  t.attributes.set('value', v);
//};
//
//
//const changeEvents = ['change', 'keyup', 'paste', 'search', 'input'];
//
//function attachValue(target, setValue = defaultSetValue){
//  let node, mute;
//  def(target, 'value', Box(""));
//
//  if(nice.isEnvBrowser()){
//    changeEvents.forEach(k => target.on(k, e => {
//      mute = true;
//      target.value((e.target || e.srcElement).value);
//      mute = false;
//      return true;
//    }));
//
//    target._autoId();
//    target.on('domNode', n => node = n);
//  }
//  target.value.listen(v => node ? node.value = v : setValue(target, v));
//  return target;
//}
//
//Html.extend('Input', (z, type) => {
//    z.tag('input').attributes.set('type', type || 'text');
//    attachValue(z);
//  })
//  .about('Represents HTML <input> element.');
//const Input = nice.Input;
//
//Input.extend('Button', (z, text, action) => {
//    z.super('button').attributes({ value: text }).on('click', action);
//  })
//  .about('Represents HTML <input type="button"> element.');
//
//
//Input.extend('Textarea', (z, value) => {
//    z.tag('textarea');
//    attachValue(z, (t, v) => t.children.removeAll().push(v));
//    z.value(value ? '' + value : "");
//  })
//  .about('Represents HTML <textarea> element.');
//
//
//Input.extend('Submit', (z, text, action) => {
//    z.super('submit').attributes({ value: text });
//    action && z.on('click', action);
//  })
//  .about('Represents HTML <input type="submit"> element.');
//
//
//Input.extend('Checkbox', (z, status) => {
//    let node;
//    z.tag('input').attributes.set('type', 'checkbox');
//    const value = Box(status || false);
//    def(z, 'checked', value);
//    def(z, 'value', value);
//
//    let mute;
//    z.on('change', e => {
//      mute = true;
//      value((e.target || e.srcElement).checked);
//      mute = false;
//      return true;
//    });
//
//    if(nice.isEnvBrowser()){
//      z._autoId();
//      z.on('domNode', n => node = n);
//    }
//
//    value.listen(v => node ? node.checked = v : z.attributes.set('checked', v));
//  })
//  .about('Represents HTML <input type="checkbox"> element.');
//
//  Input.extend('Select', (z, values) => {
//    let node;
//    z.tag('select');
//    const value = Box(null);
//    def(z, 'value', value);
//
//    let mute;
//    z.on('change', e => {
//      mute = true;
//      value((e.target || e.srcElement).value);
//      mute = false;
//      return true;
//    });
//
//    if(nice.isEnvBrowser()){
//      z._autoId();
//      z.on('domNode', n => node = n);
//    }
//
//    z.options.listenChildren(v => z.add(Html('option').add(v.label)
//        .apply(o => o.attributes.set('value', v.value)))
//    );
//
//    Switch(values)
//      .isObject().each(z.option.bind(z))
//      .isArray().each(v => Switch(v)
//        .isObject().use(o => z.options.push(o))
//        .default.use(z.option.bind(z)));
//
//    value.listen(v => node && z.options.each((o, k) =>
//        o.value == v && (node.selectedIndex = k)));
//  })
//  .arr('options')
//  .Action.about('Adds Option HTML element to Select HTML element.')
////    .test((Select) => {
////      expect(Select().id('q').option('v1', 1).html)
////          .is('<select id="q"><option value="1">v1</option></select>');
////    })
//    (function option(z, label, value){
//      value === undefined && (value = label);
//      z.options.push({label, value});
//    })
//  .about('Represents HTML <select> element.');