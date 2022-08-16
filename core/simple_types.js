nice.Check('isType', v => Anything.isPrototypeOf(v) || v === Anything);

nice.ReadOnly.Anything(function jsValue(z) { return z._value; });


function s(name, parent, description){
  const value = Object.freeze({ _type: name });
  nice.Type({
    name,
    extends: parent,
    description,
    singleton: true,
    proto: {
    }
  })();
}

s('Nothing', 'Anything', 'Parent type for all falsy values.');
s('Undefined', 'Nothing', 'Wrapper for JS undefined.');
s('Null', 'Nothing', 'Wrapper for JS null.');
s('NotFound', 'Nothing', 'Value returned by lookup functions in case nothing is found.');
NotFound = nice.NotFound;
s('Fail', 'Nothing', 'Empty negative signal.');
s('Pending', 'Nothing', 'State when item awaits input.');
s('Stop', 'Nothing', 'Value used to stop iterationin .each() and similar functions.');
s('NumberError', 'Nothing', 'Wrapper for JS NaN.');
s('AssignmentError', 'Nothing', `Can't assign`);

s('Something', 'Anything', 'Parent type for all non falsy values.');
s('Ok', 'Something', 'Empty positive signal.');

nice.Nothing.defaultValueBy = () => null;

nice.ReadOnly.Nothing(function jsValue(z) {
  return {[nice.TYPE_KEY]: z._type.name};
});


defGet(nice.Null.proto, function jsValue() {
  return null;
});

defGet(nice.Undefined.proto, function jsValue() {
  return undefined;
});

nice.simpleTypes = {
  number: {
    cast(v){
      const type = typeof v;
      if(type === 'number')
        return v;

      if(v === undefined)
        throw `undefined is not a number`;

      if(v === null)
        throw `undefined is not a number`;

      if(v._isNum)
        return v._value;

      if(type === 'string'){
        const n = +v;
        if(!isNaN(n))
          return n;
      }

      throw `${v}[${type}] is not a number`;
    }
  },
  string: {
    cast(v){
      const type = typeof v;
      if(type === 'string')
        return v;

      if(v === undefined)
        throw `undefined is not a string`;

      if(v === null)
        throw `undefined is not a string`;

      if(v._isStr)
        return v._value;

      if(type === 'number')
        return '' + v;

      if(Array.isArray(v))
        return nice.format(...v);

      throw `${v}[${type}] is not a string`;
    }
  },
  boolean: {
    cast(v){
      const type = typeof v;
      if(type === 'boolean')
        return v;

      if(v === undefined)
        false;

      if(v === null)
        false;

      if(v._isBool)
        return v._value;

      if(type === 'number' || type === 'string')
        return !!v;

      throw `${v}[${type}] is not a boolean`;
    }
  },
  function: {
    cast(v){
      const type = typeof v;
      if(type === 'function')
        return v;

      throw `${v}[${type}] is not a function`;
    }
  },
  object: {
    cast(v){
      const type = typeof v;
      if(type === 'object')
        return v;

      throw `${v}[${type}] is not an object`;
    }
  }
};


const defaultValueBy = {
  string: () => '',
  boolean: () => false,
  number: () => 0,
  object: () => ({}),
  'function': x => x,
};


['string', 'boolean', 'number', 'object', 'function'].forEach(typeName => {
  nice.Anything.configProto[typeName] = function (name, defaultValue) {
    Object.defineProperty(this.target.proto, name, {
      get: function(){
        let v = this._value[name];
        if(v === undefined){
          v = this._value[name] = defaultValue !== undefined
            ? nice.simpleTypes[typeName].cast(defaultValue)
            : defaultValueBy[typeName]();
        }
        return v;
      },
      set: function(value){
        this._value[name] = nice.simpleTypes[typeName].cast(value);
      },
      enumerable: true
    });
    return this;
  };
});


//Array
nice.Anything.configProto.array = function (name, defaultValue = []) {
  Object.defineProperty(this.target.proto, name, {
    get: function(){
      let value = this._value[name];
      if(value === undefined)
        value = this._value[name] = defaultValue;
      return value;
    },
    set: function(value){
      if(!Array.isArray(value))
        throw `Can't set ${name}[${typeName}] to ${value}[${typeof value}]`;
      this._value[name] = value;
    },
    enumerable: true
  });
  return this;
};


Func('partial', (f, template, ...cfgAs) => {
  const a = template.split('');
  const l = cfgAs.length;
  const useThis = template[0] === 'z';
  useThis && a.shift();

  return function(...callAs){
    let cur = 0;
    const as = a.map(n => {
      return n === '$' ? cfgAs[cur++]: callAs[n-1];
    });
    cur < l && as.push(...cfgAs.slice(cur));
    return useThis ? f.apply(as.shift(), as) : f(...as);
  };
});


Test('Arguments order', (partial) => {
  const f = partial((...as) => as.join(''), '21');
  expect(f('a', 'b')).is('ba');
});


Test('Partial arguments', (partial) => {
  const f = partial((...as) => as.join(''), '2$1', 'c', 'd');
  expect(f('a', 'b')).is('bcad');
});


Test('Partial `this` argument', (partial) => {
  const f = partial(String.prototype.concat, 'z2$1', 'c', 'd');
  expect(f('a', 'b')).is('bcad');
});


Test('Partial type constructor', (partial) => {
  const f = nice.Str.partial('$1', 'Hello');
//  const f = partial(String.prototype.concat, 'z2$1', 'c', 'd');
  expect(f('world')).is('Hello world');
});


def(nice, 'sortedIndex', (a, v, f) => {
  let low = 0,
      high = a === null ? low : a.length;

  while (low < high) {
    var mid = (low + high) >>> 1,
        vv = a[mid];

//    if (computed !== null && !isSymbol(computed) &&
//        (retHighest ? (computed <= value) : (computed < value))) {
//!isSymbol(computed) &&
    if (vv !== null && (f === undefined ? vv < v : f(vv, v) < 0)) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return high;
});


Test((sortedIndex) => {
  const a = [1,5,7,8];
  const f = (a, b) => a - b;

  expect(sortedIndex(a, 0)).is(0);
  expect(sortedIndex(a, 0, f)).is(0);

  expect(sortedIndex(a, 2)).is(1);
  expect(sortedIndex(a, 2, f)).is(1);

  expect(sortedIndex(a, 7)).is(2);
  expect(sortedIndex(a, 7, f)).is(2);

  expect(sortedIndex(a, 11)).is(4);
  expect(sortedIndex(a, 11, f)).is(4);

  expect(sortedIndex([], -11)).is(0);
  expect(sortedIndex([], 11)).is(0);
});


Test((sortedIndex) => {
  const a = ['a', 'aaa', 'aaaaa', 'aaaaaa'];
  const f = (a, b) => a.length - b.length;

  expect(sortedIndex(a, 'aa', f)).is(1);
  expect(sortedIndex(a, 'aaaa', f)).is(2);
  expect(sortedIndex(a, '', f)).is(0);
});
