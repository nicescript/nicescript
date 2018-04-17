nice.Single.extend({
  title: 'Boolean',
  set: n => !!n,
  defaultValue: () => false,
  saveValue: v => v,
  loadValue: v => v
});

const B = nice.Boolean, M = Mapping.Boolean;
M('and', (z, v) => B(z() && v));
M('or', (z, v) => B(z() || v));
M('nor', (z, v) => B(!(z() || v)));
M('xor', (z, v) => B(z() ^  !!v));

const A = Action.Boolean;
A('turnOn', z => z(true));
A('turnOff', z => z(false));
//A('switch', z => z(!z()));

