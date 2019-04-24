const { _1, _2, _3, _$ } = nice;

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
  deepEqual: (a, b) => nice.diff(a, b) === false,
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
  const low = i.toLowerCase();
  Check.about(`Checks if \`v\` is \`${i}\`.`)
    ('is' + i, basicJS.includes(low)
    ? v => typeof v === low
    : v => v && v.constructor ? v.constructor.name === i : false);
};


reflect.on('Type', function defineReducer(type) {
  type.name && Check
    .about('Checks if `v` has type `' + type.name + '`')
    ('is' + type.name, v => v && v._type ? type.proto.isPrototypeOf(v) : false);
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

const _$proto = create(common, {
  check (f) {
    return this.parent.check((...v) => f(v));
  },
  pushCheck (f) {
    this.parent.pushCheck(f);
    return this;
  }
});


defGet(common, '_$', function () {
  return create(_$proto, {parent: this});
});


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
    actionProto.hasOwnProperty(f.name) || def(actionProto, f.name, function(...a){
      return this.use(v => f(v, ...a));
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
  for(let a of args){
    if(a === _1 || a === _2 || a === _3 || a === _$)
      return DelayedSwitch(args);
  }

  const f = () => f.done ? f.res : args[0];
  f.args = args;
  f.done = false;
  return create(switchProto, f);
};


reflect.on('Check', f => f.name && !common[f.name]
  && def(common, f.name, function (...a) {
    return this.check((...v) => {
      try {
        return f(...v, ...a);
      } catch (e) {
        return false;
      }
    });
  })
);

reflect.on('Check', f => f.name && !$proto[f.name]
  && def($proto, f.name, function (...a) {
    return this.parent.check((...v) => {
      try {
        return f(v[this.pos], ...a);
      } catch (e) {
        return false;
      }
    });
  })
);


reflect.on('Check', f => f.name && !_$proto[f.name]
  && def(_$proto, f.name, function (...a) {
    return this.parent.check((...v) => {
      try {
        return f(v, ...a);
      } catch (e) {
        return false;
      }
    });
  })
);


function DelayedSwitch(initArgs) {
  const f = (...a) => {
    const l = f.cases.length;
    let action = f._default;

    const args = nice._skipArgs(initArgs, a);

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