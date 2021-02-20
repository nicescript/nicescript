const whiteSpaces = ' \f\n\r\t\v\u00A0\u2028\u2029';
const allowedSources = {boolean: 1, number: 1, string: 1};

nice.Single.extend({
  name: 'Str',

  defaultValueBy: () => '',


  itemArgs1: (z, v) => {
    z._type.setValue(z, nice.simpleTypes.string.cast(v));
  },
  itemArgsN: (z, a) => z._type.setValue(z, nice.format(...a)),
})
  .about('Wrapper for JS string.')
  .ReadOnly('length', z => z._value.length);


Test(Str => {
  const s = Str();
  expect(s).is('');
  s(3);
  expect(s).is('3');
//  nice.format('/%d/', 1);
  s('/%d/', 1);
  expect(s).is('/1/');
  s(['/%d/', 2]);
  expect(s).is('/2/');
  expect(() => s({})).throws();
});


_each({
  endsWith: (s, p, l) => s.endsWith(p, l),
  startsWith: (s, p, i) => s.startsWith(p, i),
  includes: (s, p, i) => s.includes(p, i),
  test: (s, r) => r.test(s),
}, (f, name) => Check.String(name, f));


const M = Mapping.String;
const sf = {
  trimLeft: (s, a = whiteSpaces) => {
    let i = 0;
    while(a.indexOf(s[i]) >= 0) i++;
    return s.substr(i);
  },

  trimRight: (s, a = whiteSpaces) => {
    let i = s.length - 1;
    while(a.indexOf(s[i]) >= 0) i--;
    return s.substr(0, i + 1);
  },

  trim: (s, a) => sf.trimRight(sf.trimLeft(s, a), a),

  truncate: (s, n, tale) => s.length > n ? s.substr(0, n) + (tale || '') : s,

  capitalize: nice._capitalize,
  deCapitalize: nice._decapitalize
};

_each(sf, (v, k) => M(k, v));

`toLocaleLowerCase
toLocaleUpperCase
toLowerCase
toUpperCase
charAt
charCodeAt
codePointAt
concat
indexOf
lastIndexOf
normalize
padEnd
padStart
repeat
substr
substring
slice
split
search
replace
match
localeCompare`.split('\n').forEach(k => M
    .about(`Calls \`String.prototype.${k}\`.`)
    (k, (s, ...a) => s[k](...a)));


nice.Mapping.Number(String.fromCharCode);
nice.Mapping.Number(String.fromCodePoint);


Test(format => {
  expect(format('/%d/', 1)).is('/1/');
  expect(format('%s:%s', 'foo', 'bar', 'baz')).is('foo:bar baz');
  expect(format(1, 2, 3)).is('1 2 3');
  expect(format('%% %s')).is('%% %s');
});


typeof Symbol === 'function' && Func.String(Symbol.iterator, z => {
  let i = 0;
  const l = z.length;
  return { next: () => ({ value: z[i], done: ++i > l }) };
});