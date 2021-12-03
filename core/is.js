['Check', 'Action', 'Mapping'].forEach(t => Check
  .about(`Checks if value is function and it's type is ${t}.`)
  ('is' + t, v => v.functionType === t));

const basicChecks = {
  is (a, b) {
    if(a === b)
      return true;

    if(a && a._isAnything && '_value' in a)
      a = a._value;

    if(b && b._isAnything  && '_value' in b)
      b = b._value;

    return a === b;
  },
  isExactly: (a, b) => a === b,
  deepEqual: (a, b) => {
    if(a === b)
      return true;

    if(a && a._isAnything && '_value' in a)
      a = a._value;

    if(b && b._isAnything  && '_value' in b)
      b = b._value;

    if(typeof a !== typeof b)
      return false;

    return nice.diff(a, b) === false;
  },
  isTrue: v => v === true,
  isFalse: v => v === false,
  isAnyOf: (v, ...vs) => vs.includes(v),
  isTruly: v => v
    ? v._isAnything
      ? v.isNothing() ? false : !!v()
      : true
    : false,
  isFalsy: v => !nice.isTruly(v),
  isEmpty: v => {
    if(nice.isNothing(v) || v === null)
      return true;

    if(v === 0 || v === '' || v === false)
      return false;

    if(Array.isArray(v))
      return !v.length;

    if(typeof v === 'object')
      return !Object.keys(v).length;

    return !v;
  },
  isSubType: (a, b) => {
    typeof a === 'string' && (a = nice.Type(a));
    typeof b === 'string' && (b = nice.Type(b));
    return a === b || b.isPrototypeOf(a);
  },

  isEnvBrowser: () => typeof window !== 'undefined',

  throws: (...as) => {
    try{
      as[0]();
    } catch(e) {
      return as.length === 1 ? true : as[1] === e;
    }
    return false;
  }
};

for(let i in basicChecks)
  Check(i, basicChecks[i]);
is = nice.is;

const basicJS = 'number,function,string,boolean,symbol'.split(',');
for(let i in nice.jsTypes){
  if(i === 'Function'){
    Check.about(`Checks if \`v\` is \`function\`.`)
      ('is' + i, v => v._isAnything
        ? v._type === nice.Func || v._type === nice.jsTypes.Function
        : typeof v === 'function');
  } else {
    const low = i.toLowerCase();
    Check.about(`Checks if \`v\` is \`${i}\`.`)
      ('is' + i, basicJS.includes(low)
      ? v => typeof v === low//BUG: always true for function since every nice item is function
      : new Function('v', `return ${i}.prototype.isPrototypeOf(v);`));
//      : new Function('v', v => v && typeof v === 'object' ? v.constructor.name === i : false);
  }
};


reflect.on('type', function defineReducer(type) {
  type.name && Check
    .about('Checks if `v` has type `' + type.name + '`')
    ('is' + type.name, v => v && v._type
        ? (type === v._type || type.isPrototypeOf(v._type))
        : false);
});


const throwF = function(...as) {
  return this.use(() => {
    throw nice.format(...as);
  });
};

const common = {
  pushCheck (f){
    const postCheck = this._check;
    this._check = postCheck ? (...a) => postCheck(f(...a)) : f;
    return this;
  },
  is (v) {
    return this.check(a => is(a, v));
  },
  'throw': throwF,
};


defGet(common, 'not', function (){
  this.pushCheck(r => !r);
  return this;
});


const switchProto = create(common, {
  valueOf () { return this.res; },
  check (f) {
    this.pushCheck(f)
    const res = create(actionProto, v => {
      const z = this;

      if(!z.done && z._check(...z.args)){
        z.res = v;
        z.done = true;
      }
      z._check = null;
      return z;
    });
    res.target = this;
    return res;
  },
});

const $proto = {
  check (f) {
    return this.parent.check((...v) => f(v[this.pos]));
  },
  is (v) {
    return this.parent.check((...as) => as[this.pos] === v);
  },
};

defGet($proto, 'not', function (){
  this.parent.pushCheck(r => !r);
  return this;
});

[1,2,3,4].forEach(n => defGet(common, '_' + n, function () {
  return create($proto, {parent: this, pos: n - 1});
}));


defGet(switchProto, 'default', function () {
  const z = this;
  const res = v => z.done ? z.res : v;
  res.use = f => z.done ? z.res : f(...z.args);
  res.throw = throwF;
  return res;
});

const actionProto = {
  'throw': throwF,
  use (f) {
    const z = this.target;

    if(!z.done && z._check(...z.args)){
      z.res = f(...z.args);
      z.done = true;
    }
    z._check = null;
    return z;
  }
};

const delayedActionProto = create(actionProto, {
  use (f){
    const z = this.target;
    z.cases.push(z._check, f);
    z._check = null;
    return z;
  }
});


defGet(actionProto, 'and', function (){
  const s = this.target;
  const f = s._check;
  s._check = r => r && f(...s.args);
  return s;
});


defGet(actionProto, 'or', function (){
  const s = this.target;
  const f = s._check;
  s._check = r => r || f(...s.args);
  return s;
});


reflect.on('function', f => {
  if(f.functionType !== 'Check'){
    f.name in actionProto || def(actionProto, f.name, function(...a){
      return this.use(v => nice[f.name](v, ...a));
    });
  }
});


const delayedProto = create(common, {
  check (f) {
    this.pushCheck(f);
    const res = create(delayedActionProto, v => {
      this.cases.push(this._check, () => v);
      this._check = null;
      return this;
    });
    res.target = this;
    return res;
  }
});


defGet(delayedProto, 'default', function () {
  const z = this, res = v => { z._default = () => v; return z; };
  res.use = f => { z._default = f; return z; };
  res.throw = throwF;
  return res;
});


const S = Switch = nice.Switch = (...args) => {
  if(args.length === 0)
    return DelayedSwitch();

  const f = () => f.done ? f.res : args[0];
  f.args = args;
  f.done = false;
  return create(switchProto, f);
};


reflect.on('Check', ({name}) => name && !common[name]
  && (common[name] = function (...a) {
    return this.check((...v) => {
      try {
        return nice[name](...v, ...a);
      } catch (e) {
        return false;
      }
    });
  })
);

reflect.on('Check', ({name}) => name && !$proto[name]
  && def($proto, name, function (...a) {
    return this.parent.check((...v) => {
      try {
        return nice[name](v[this.pos], ...a);
      } catch (e) {
        return false;
      }
    });
  })
);


function DelayedSwitch() {
  const f = (...args) => {
    const l = f.cases.length;
    let action = f._default;

    for(let i = 0 ;  i < l; i += 2){
      if(f.cases[i](...args)){
        action = f.cases[i + 1];
        break;
      }
    }
    return action ? action(...args) : args[0];
  };

  f.cases = [];

  return create(delayedProto, f);
};


Test('Delayed Switch', (Switch, Spy) => {
  const spy1 = Spy(() => 1);
  const spy2 = Spy(() => 2);
  const spy3 = Spy(() => 3);

  const s = Switch()
    .is(3)(10)
    .isNumber().use(spy1)
    .isString().use(spy2)
    .default.use(spy3);

  Test('type check', () => {
    expect(s('qwe')).is(2);
    expect(s(42)).is(1);
  });
  Test('is', () => expect(s(3)).is(10));
  Test('default', () => expect(s([])).is(3));

  Test('No extra calls', () => {
    expect(spy1).calledOnce();
    expect(spy2).calledOnce();
    expect(spy3).calledOnce();
  });
});


Test("not", (Switch) => {
  const s = Switch(5)
    .isString()(1)
    .not.isString()(2)
    .default(3);

  expect(s).is(2);
});


Test((Switch, Spy) => {
  const spy1 = Spy();
  const spy2 = Spy(() => 2);
  const spy3 = Spy();

  const s = Switch('qwe')
    .isNumber().use(spy1)
    .isString().use(spy2)
    .is(3)(4)
    .default.use(spy3);

  expect(s).is(2);
  expect(spy1).not.called();
  expect(spy2).calledTimes(1);
  expect(spy2).calledWith('qwe');
  expect(spy3).not.called();
});


Test("switch equal", (Switch, Spy) => {
  const spy1 = Spy();
  const spy3 = Spy();

  const s = Switch('qwe')
    .isNumber().use(spy1)
    .is('qwe')(4)
    .default.use(spy3);

  expect(spy1).not.called();
  expect(spy3).not.called();

  expect(s).is(4);
});



Test((is) => {
  const n = nice.Num(1);
  expect(n.is(1)).is(true);
  expect(n.is(2)).is(false);
});