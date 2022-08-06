const Html = nice.Html;

function defaultSetValue(t, v){
  t.attributes.set('value', v);
};


const changeEvents = ['change', 'keyup', 'paste', 'search', 'input'];


function attachValue(target, box, setValue = defaultSetValue){
  let node, mute;
  const initValue = box();

  setValue(target, initValue);

  if(IS_BROWSER){
    let lastValue = initValue;
    changeEvents.forEach(k => target.on(k, e => {
      mute = true;
      const v = (e.target || e.srcElement).value;
      v !== lastValue && box(lastValue = v)
      mute = false;
      return true;
    }));

    target.on('domNode', n => {
      node = n;
      node.value = box();
    });
  }
  box.subscribe(v => {
    if(mute)
      return;
    node ? node.value = v : setValue(target, v);
  });
  return target;
}


Html.extend('Input', (z, type) => {
    z.tag = 'input';
    z.assertId();
    z.attributes.set('type', type || 'text');
  })
  .about('Represents HTML <input> element.');
const Input = nice.Input;

defGet(Input.proto, 'boxValue', function() {
  if(this._boxValue)
    return this._boxValue;
  const res = Box('');
  attachValue(this, res);
  return this._boxValue = res;
});


Input.proto.value = function(v){
  if(v !== undefined && v._isBox) {
    attachValue(this, v);
  } else {
    this.attributes.set('value', v);
  }
  return this;
};


Test((Input) => {
  const i1 = Input();
  expect(i1.html).is('<input id="' + i1.id() + '" type="text"></input>');

  const i2 = Input('date');
  expect(i2.html).is('<input id="' + i2.id() + '" type="date"></input>');

  const i3 = Input().value('qwe')
  expect(i3.html).is('<input id="' + i3.id() + '" type="text" value="qwe"></input>');
});


Test('Box value html', (Input, Box) => {
  const b = Box('qwe');
  const input = Input().value(b);
  expect(input.html).is('<input id="' + input.id() + '" type="text" value="qwe"></input>');
  b('asd');
  expect(input.html).is('<input id="' + input.id() + '" type="text" value="asd"></input>');
});


IS_BROWSER && Test('Box value dom', (Input, Box) => {
  const b = Box('qwe');
  const input = Input().value(b);
  expect(input.html).is('<input id="' + input.id() + '" type="text" value="qwe"></input>');
  b('asd');
  expect(input.html).is('<input id="' + input.id() + '" type="text" value="asd"></input>');
});


Html.extend('Button', (z, text = '', action) => {
    z.super('button').type('button').on('click', action).add(text);
  })
  .about('Represents HTML <input type="button"> element.');


Test((Button) => {
  const b = Button('qwe');
  expect(b.html).is('<button type="button">qwe</button>');
});


Input.extend('Textarea', (z, v) => {
    z.tag = 'textarea';

    if(v !== undefined && v._isBox){
      attachValue(this, v, (t, v) =>  t.children.removeAll().push(v));
    } else {
      z.add(v);
    };
  })
  .about('Represents HTML <textarea> element.');


Test(Textarea => {
  const ta = Textarea('qwe');
  expect(ta.html).is('<textarea>qwe</textarea>');
});


Html.extend('Submit', (z, text, action) => {
    z.tag = 'input';
    z.assertId();
    z.attributes.set('type', 'submit');
    z.attributes.set('value',  text || 'Submit');
    action && z.on('click', action);
  })
  .about('Represents HTML <input type="submit"> element.');


Html.extend('Form', (z, handler) => {
    z.tag = 'form';
    z.assertId();
    handler && z.on('submit', e => {
      const input = {}, form = e.currentTarget;
      e.preventDefault();

      for(let field of form.elements) {
        field.name && (input[field.name] = field.value);
      }

      handler(input);
    });
  })
  .about('Represents HTML Form element.');


Input.extend('Checkbox', (z, status) => {
    let node;
    z.tag = 'input';
    z.attributes.set('type', 'checkbox');
    const value = Box(status || false);
    def(z, 'checked', value);
    def(z, 'value', value);

    let mute;
    z.on('change', e => {
      mute = true;
      value((e.target || e.srcElement).checked);
      mute = false;
      return true;
    });

    if(IS_BROWSER){
//      z.assertId();
      z.on('domNode', n => node = n);
    }

    value.subscribe(v => node ? node.checked = v : z.attributes.set('checked', v));
  })
  .about('Represents HTML <input type="checkbox"> element.');

  Input.extend('Select', (z, values) => {
    let node;
    z.tag = 'select';
    const value = Box(null);
    def(z, 'value', value);

    let mute;
    z.on('change', e => {
      mute = true;
      value((e.target || e.srcElement).value);
      mute = false;
      return true;
    });

    if(IS_BROWSER){
//      z.assertId();
      z.on('domNode', n => node = n);
    }

    z.options.listenChildren(v => z.add(Html('option').add(v.label)
        .apply(o => o.attributes.set('value', v.value)))
    );

    Switch(values)
      .isObject().each(z.option.bind(z))
      .isArray().each(v => Switch(v)
        .isObject().use(o => z.options.push(o))
        .default.use(z.option.bind(z)));

    value.listen(v => node && z.options.each((o, k) =>
        o.value == v && (node.selectedIndex = k)));
  })
  .arr('options')
  .Action.about('Adds Option HTML element to Select HTML element.')
//    .test((Select) => {
//      expect(Select().id('q').option('v1', 1).html)
//          .is('<select id="q"><option value="1">v1</option></select>');
//    })
    (function option(z, label, value){
      value === undefined && (value = label);
      z.options.push({label, value});
    })
  .about('Represents HTML <select> element.');