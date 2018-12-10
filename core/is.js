//const isProto = def(nice, 'isProto', {}), { Check } = nice;
//reflect.on('Check', f =>
//  isProto[f.name] = function(...a) {
//    try {
//      return f(this.value, ...a);
//    } catch (e) {
//      return false;
//    }
//  });


//is = def(nice, 'is', value => create(isProto, { value }));
//reflect.on('Check', f => {
//  is[f.name] = (...a) => {
//    try {
//      return f(...a);
//    } catch (e) {
//      return false;
//    }
//  };
//});

['Check', 'Action', 'Mapping'].forEach(t => Check
  .about(`Checks if value is function and it's type is ${t}.`)
  ('is' + t, v => v.functionType === t));

const basicChecks = {
  equal (a, b) {
    if(a === b)
      return true;

    if(a && a._isAnything && '_value' in a)
      a = a._value;

    if(b && b._isAnything  && '_value' in b)
      b = b._value;

    return a === b;
  },
  deepEqual (a, b) {
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

  isEnvBrowser: () => typeof window !== 'undefined'
};

for(let i in basicChecks)
  Check(i, basicChecks[i]);


const basicJS = 'number,function,string,boolean,symbol'.split(',');
for(let i in nice.jsTypes){
  const low = i.toLowerCase();
  Check.about(`Checks if value is ${i}.`)
    ('is' + i, basicJS.includes(low)
    ? v => typeof v === low
    : v => v && v.constructor ? v.constructor.name === i : false);
};


reflect.on('Type', function defineReducer(type) {
  type.name && Check
    .about('Checks if value has type ' + type.name)
    ('is' + type.name, v => v && v._type ? type.proto.isPrototypeOf(v) : false);
});


const switchProto = create(nice.checkers, {
  valueOf () { return this.res; },
  check (f) {
    this._check = f;
    const res = switchResult.bind(this);
    res.use = switchUse.bind(this);
    return res;
  },
  equal (v) {
    this._check = (...a) => nice.equal(v, a[0]);
    const res = switchResult.bind(this);
    res.use = switchUse.bind(this);
    return res;
  }
});


defGet(switchProto, 'default', function () {
  const z = this;
  const res = v => z.done ? z.res : v;
  res.use = f => z.done ? z.res : f(...z.actionArgs);
  return res;
});

const actionProto = {};

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
  equal (f) {
    this._check = (...a) => nice.equal(a[0], f);
    const res = create(actionProto, delayedResult.bind(this));
    res.use = delayedUse.bind(this);
    return res;
  },
});


defGet(delayedProto, 'default', function () {
  const z = this, res = v => { z._default = () => v; return z; };
  res.use = f => { z._default = f; return z; };
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


S.equal = v => DealyedSwitch().equal(v);
S.check = f => DealyedSwitch().check(f);


defGet(S, 'not', () => {
  const res = DealyedSwitch();
  res._check = r => !r;
  return res;
});


defGet(switchProto, 'not', function (){
  this._check = r => !r;
  return this;
});


defGet(delayedProto, 'not', function (){
  this._check = r => !r;
  return this;
});


reflect.on('Check', f => {
  if(!f.name || nice.checkers[f.name])
    return;

  const tryF = (...a) => {
    try {
      return f(...a);
    } catch (e) {
      return false;
    }
  };

  if(f.maxLength > 1){
    def(nice.checkers, f.name, function (...a) {
      return this.addCheck(v => tryF(v, ...a));
    });
  } else {
    defGet(nice.checkers, f.name, function(){
      return this.addCheck(tryF);
    });
  };
});

create(nice.checkers, S);


S.addCheck = function (check) {
  const res = DealyedSwitch();
  return res.addCheck(check);
};


function DealyedSwitch(...a) {
  const f = (...a) => {
    const l = f.cases.length;
    let action = f._default;

    for(let i = 0 ;  i < l; i += 2){
      if(f.cases[i](...a)){
        action = f.cases[i + 1];
        break;
      }
    }
    return action ? action(...a) : a[0];
  };
  f.cases = a;

  f.addCheck = check => {
    const preCheck = f._check;
    f._check = preCheck ? (...a) => preCheck(check(...a)) : check;

    const res = create(actionProto, delayedResult.bind(f));
    res.use = delayedUse.bind(f);
    return res;
  };

  return create(delayedProto, f);
};