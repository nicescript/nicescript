nice.Single.extend({
  title: 'Boolean',
  set: n => !!n,
  defaultValue: () => false,
  saveValue: v => v,
  loadValue: v => v
}).about('Wrapper for JS boolean.');

const B = nice.Boolean, M = Mapping.Boolean;

const A = Action.Boolean;
A('turnOn', z => z(true));
A('turnOff', z => z(false));
//A('switch', z => z(!z()));

