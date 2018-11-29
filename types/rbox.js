const PENDING = nice.Pending(), NEED_COMPUTING = nice.NeedComputing();

nice.Type({
  name: 'RBox',

  extends: 'Box',

  itemArgs1: () => {
    throw `This box uses subscriptions you can't change it's value.`;
  },

  initBy: (z, ...inputs) => {
    z._by = inputs.pop();
    z._subscriptions = [];
    z._value = NEED_COMPUTING;
    z._isReactive = true;
    inputs.forEach(s => {
      if(s.__proto__ === Promise.prototype)
        s = Box().follow(s);

      expect(s.listen, `Bad source`).toBe();
      z._subscriptions.push(s);
    });
    return z;
  },

  proto: {}
})
  .about('Reactive observable component.');
