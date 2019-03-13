nice.Single.extend({
  name: 'Bool',
  onCreate: z => z._value = false,
  itemArgs1: (z, v) => z._setValue(!!v),
}).about('Wrapper for JS boolean.');

const B = nice.Bool, M = Mapping.Bool;

const A = Action.Bool;
A('turnOn', z => z(true));
A('turnOff', z => z(false));
A('toggle', z => z(!z()));

nice.Single.extensible = false;