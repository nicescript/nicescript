nice.Single.extend({
  name: 'Bool',

  defaultValueBy: () => false,

  itemArgs1: (z, v) => {
    z._type.setValue(z, nice.simpleTypes.boolean.cast(v));
  },
}).about('Wrapper for JS boolean.');

Test(Bool => {
  const b = Bool();
  expect(b).is(false);

  b(true);
  expect(b).is(true);

  b('qwe');
  expect(b).is(true);

  b('');
  expect(b).is(false);

  expect(() => b({})).throws();
});


const B = nice.Bool, M = Mapping.Bool;

const A = Action.Bool;
A('turnOn', z => z(true));
A('turnOff', z => z(false));
A('toggle', z => z(!z()));

nice.Single.extensible = false;