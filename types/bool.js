nice.Single.extend({
  name: 'Bool',
  set: n => !!n,
  defaultValue: () => false,
}).about('Wrapper for JS boolean.');

const B = nice.Bool, M = Mapping.Bool;

const A = Action.Bool;
A('turnOn', z => z(true));
A('turnOff', z => z(false));
//A('switch', z => z(!z()));

nice.Single.extensible = false;