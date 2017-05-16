nice.define(nice, 'is', nice.curry((a, b) => a === b));

var isProto = {
  Item: o => nice.ItemPrototype.isPrototypeOf(o),
  Array: a => Array.isArray(a),
  Integer: n => Number.isInteger(n),
  SaveInteger: n => Number.isSaveInteger(n),
  Finite: n => Number.isFinite(n),
  "NaN": n => Number.isNaN(n),
  Number: i => typeof i === 'number',
  Function: i => typeof i === 'function',
  String: i => typeof i === 'string',
  Object: i => i !== null && typeof i === 'object',
  Boolean: i => typeof i === 'boolean',
  Symbol: i => typeof i === 'symbol',
  Null: i => i === null,
  Undefined: i => i === undefined,
  Of: (v, type) => v && (v.constructor === type || v._typeTitle === type),
  Primitive: i => i !== Object(i),
  Empty: item => {
    if(!item)
      return true;

    if(Array.isArray(item))
      return !item.length;

    if(typeof item === 'object')
      return !Object.keys(item).length;

    return !item;
  }
};


Object.setPrototypeOf(nice.is, isProto);


var orPrototype = nice.mapObject(is => {
  return function(v) { return is(v) || this.lastIs(v) };
}, isProto);


nice.each(lastIs => {
  Object.defineProperty(lastIs, 'or', { get: () => {
    return Object.setPrototypeOf({lastIs: lastIs}, orPrototype);
  } } );
}, nice.is);