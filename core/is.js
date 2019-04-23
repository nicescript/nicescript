const { $1, $2, $3, $4, $$ } = nice;

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

  isEnvBrowser: () => typeof window !== 'undefined'
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
  return this.use(function(){
    throw nice.format(...as);
  });
};


const switchProto = create(nice.checkers, {
  valueOf () { return this.res; },
  check (f) {
    this._check = f;
    const res = switchResult.bind(this);
    res.use = switchUse.bind(this);
    res.throw = throwF;
    return res;
  },
  is (v) {
    this._check = (a) => is(v, a);
    const res = switchResult.bind(this);
    res.use = switchUse.bind(this);
    res.throw = throwF;
    return res;
  },
});

const $proto = {};

[1,2,3,4].forEach(n => defGet(nice.checkers, '$' + n, function () {
  return create($proto, {parent: this, pos: n - 1});
}));


defGet(switchProto, 'default', function () {
  const z = this;
  const res = v => z.done ? z.res : v;
  res.use = f => z.done ? z.res : f(...z.actionArgs);
  res.throw = throwF;
  return res;
});

const actionProto = { 'throw': throwF };

reflect.on('function', f => {
  if(f.functionType !== 'Check'){
    actionProto[f.name] = function(...a){ return this.use(v => f(v, ...a)); };
  }
});


const delayedProto = create(nice.checkers, {
  check (f) {
    this._check = f;
    const res = create(actionProto, delayedResult.bind(this));
    res.use = delayedUse.bind(this);
    return res;
  },
  is (f) {
    this._check = (v) => is(v, f);
    const res = create(actionProto, delayedResult.bind(this));
    res.use = delayedUse.bind(this);
    return res;
  },
});


defGet(delayedProto, 'default', function () {
  const z = this, res = v => { z._default = () => v; return z; };
  res.use = f => { z._default = f; return z; };
  res.throw = throwF;
  return res;
});


function switchResult(v){
  const z = this;

  if(!z.done && z._check(...z.checkArgs)){
    z.res = v;
    z.done = true;
  }
  z._check = null;
  return z;
}


function switchUse(f){
  const z = this;

  if(!z.done && z._check(...z.checkArgs)){
    z.res = f(...z.actionArgs);
    z.done = true;
  }
  z._check = null;
  return z;
};


function delayedResult(v){
  const z = this;
  z.cases.push(z._check, () => v);
  z._check = null;
  return z;
}


function delayedUse(f){
  const z = this;
  z.cases.push(z._check, f);
  z._check = null;
  return z;
}


const S = Switch = nice.Switch = (...args) => {
  for(let a of args){
    if(a === $1 || a === $2 || a === $3 || a === $4 || a === $$)
      return DelayedSwitch(args);
  }

  const f = () => f.done ? f.res : args[0];
  f.checkArgs = args;
  f.actionArgs = args;
  f.done = false;

  f.addCheck = check => {
    const preCheck = f._check;
    f._check = preCheck ? (...a) => preCheck(check(...a)) : check;
    const res = create(actionProto, switchResult.bind(f));
    res.use = switchUse.bind(f);
    return res;
  };

  return create(switchProto, f);
};


defGet(switchProto, 'not', function (){
  this._check = r => !r;
  return this;
});


defGet(delayedProto, 'not', function (){
  this._check = r => !r;
  return this;
});


reflect.on('Check', f => f.name && !nice.checkers[f.name]
  && def(nice.checkers, f.name, function (...a) {
    return this.addCheck((...v) => {
      try {
        return f(...v, ...a);
      } catch (e) {
        return false;
      }
    });
  })
);

//TODO: $$
reflect.on('Check', f => f.name && !$proto[f.name]
  && def($proto, f.name, function (...a) {
    return this.parent.addCheck((...v) => {
      try {
        return f(v[this.pos], ...a);
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

  f.addCheck = check => {
    const preCheck = f._check;
    f._check = preCheck ? (...a) => preCheck(check(...a)) : check;

    const res = create(actionProto, delayedResult.bind(f));
    res.use = delayedUse.bind(f);
    res.throw = throwF;
    return res;
  };

  return create(delayedProto, f);
};