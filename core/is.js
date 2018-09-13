//TODO: add is.Check
//TODO: add thruly and falsy checks
const isProto = def(nice, 'isProto', {}), { Check } = nice;
nice._on('Check', f =>
  isProto[f.name] = function(...a) {
    try {
      return f(this.value, ...a);
    } catch (e) {
      return false;
    }
  });


is = def(nice, 'is', value => create(isProto, { value }));
nice._on('Check', f => {
  is[f.name] = (...a) => {
    try {
      return f(...a);
    } catch (e) {
      return false;
    }
  };
});

Check.about('Checks if two values are equal.')
  ('equal', (a, b) => a === b ||
      (a && a._isAnything ? a._value : a) === (b && b._isAnything ? b._value : b));

const basicChecks = {
  true: v => v === true,
  false: v => v === false,
  any: (v, ...vs) => vs.includes(v),
  Array: a => Array.isArray(a),
  "NaN": n => Number.isNaN(n),
  Object: i => i !== null && typeof i === 'object' && !i._isSingleton,
  null: i => i === null,
  undefined: i => i === undefined,
  nice: v => nice.Anything.proto.isPrototypeOf(v),
  primitive: i => {
    const type = typeof i;
    return i === null || (type !== "object" && type !== "function");
  },
  empty: v => {
    if(is.Nothing(v) || v === null)
      return true;

    if(v === 0 || v === '' || v === false)
      return false;

    if(Array.isArray(v))
      return !v.length;

    if(typeof v === 'object')
      return !Object.keys(v).length;

    return !v;
  },
  subType: (a, b) => {
    is.String(a) && (a = nice.Type(a));
    is.String(b) && (b = nice.Type(b));
    return a === b || b.isPrototypeOf(a);
  },
  browser: () => nice.isEnvBrowser
};

for(let i in basicChecks)
  Check(i, basicChecks[i]);


const basicJS = 'number,function,string,boolean,symbol'.split(',');
for(let i in nice.jsTypes){
  const low = i.toLowerCase();
  nice.is[i] || Check(i, basicJS.includes(low)
    ? v => typeof v === low
    : v => v && v.constructor ? v.constructor.name === i : false);
};


nice._on('Type', function defineReducer(type) {
  type.name && Check(type.name, v =>
    v && v._type ? type.proto.isPrototypeOf(v) : false);
});


const switchProto = create(nice.checkers, {
  valueOf: function () { return this.res; },
  check: function (f) {
    this._check = f;
    const res = switchResult.bind(this);
    res.use = switchUse.bind(this);
    return res;
  },
  equal: function (v) {
    this._check = (...a) => v === a[0];
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

nice._on('function', f => {
  if(f.functionType !== 'Check'){
    actionProto[f.name] = function(...a){ return this.use(v => f(v, ...a)); };
  }
});


const delayedProto = create(nice.checkers, {
  check: function (f) {
    this._check = f;
    const res = create(actionProto, delayedResult.bind(this));
    res.use = delayedUse.bind(this);
    return res;
  },
  equal: function (f) {
    this._check = (...a) => a[0] === f;
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



function diggSignaturesLength(f, n = 0){
  f.body && f.body.length > n && (n = f.body.length);
  f.signatures && f.signatures.forEach(v => n = diggSignaturesLength(v, n));
  return n;
}

nice._on('Check', f => {
  if(!f.name || nice.checkers[f.name])
    return;

  const tryF = (...a) => {
    try {
      return f(...a);
    } catch (e) {
      return false;
    }
  };

  if(diggSignaturesLength(f) > 1){
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