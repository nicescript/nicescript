const configProto = {
  next (o) {
    const c = Configurator(this.name || o.name);

    c.signature = (this.signature || []).concat(o.signature || []);
    ['existing', 'functionType', 'returnValue', 'description']
      .forEach(k => c[k] = o[k] || this[k]);

    return c;
  },

  about (s) { return this.next({ description: s}); },
};

const functionProto = {
  addSignature (body, signature, name){
    const ss = 'signatures' in this
      ? this.signatures
      : this.signatures = new Map();
    if(signature && signature.length){
      const combinations = allSignatureCombinations(signature);
      combinations.forEach(combination => {
        let _ss = ss;
        const lastI = combination.signature.length - 1;
        combination.signature.forEach((type, i) => {
          if(_ss.has(type)){
            _ss = _ss.get(type);
          } else {
            const s = new Map();
            _ss.set(type, s);
            _ss = s;
          }
        });
        if(_ss.action) {
          const existingN = nice._size(_ss.transformations);
          const newN = nice._size(combination.transformations);
          if(!existingN && !newN)
            throw `Function "${name}" already have signature
                [${signature.map(v=>v.name + ' ')}]`;
          if(existingN > newN){
            _ss.action = body;
            _ss.transformations = combination.transformations;
          }
        } else {
          _ss.action = body;
          _ss.transformations = combination.transformations;
        }
      });
    } else {
      ss.action = body;
    }
    return this;
  },

  ary (n){
    return (...a) => this(...a.splice(0, n));
  },

  about (s) {
    return configurator({ description: s });
  }
};

defGet(functionProto, 'help',  function () {
  if(!nice.doc)
    nice.doc = nice.generateDoc();

  const a = [''];
  _each(nice.doc.fs[this.name], v => {
    a.push(v.title);
    v.description && a.push(v.description);
    a.push(v.source);
    a.push('');
  });
  return a.join('\n');
});

const parseParams = (...a) => {
  if(!a[0])
    return {};

  const [name, body] = a.length === 2 ? a : [a[0].name, a[0]];

  return typeof body === 'function' ? { name, body } : a[0];
};


function toItemType({type}){
  return { type: type._isJsType ? nice[type.niceType] : type };
}


function Configurator(name){
  const z = create(configProto, (...a) => {
    const { name, body, signature } = parseParams(...a);
    const res = createFunction({
      description: z.description,
      type: z.functionType,
      existing: z.existing,
      name: z.name || name,
      body: body || z.body,
      signature: (z.signature || []).concat(signature || []),
    });
    return z.returnValue || res;
  });

  nice.rewriteProperty(z, 'name', name || '');
  return z;
}


function configurator(...a){
  const cfg = parseParams(...a);
  return Configurator(cfg.name).next(cfg);
};


//optimization: create function that don't check fist argument for type.proto
function createFunction({ existing, name, body, signature, type, description }){
  if(name && typeof name === 'string' && name[0] !== name[0].toLowerCase())
    throw "Function name should start with lowercase letter. "
          + `"${nice._decapitalize(name)}" not "${name}"`;

  existing = existing || (name && nice[name]);
  const f = existing || createFunctionBody(type);

  if(existing && existing.functionType !== type)
    throw `function '${name}' can't have types '${existing.functionType}' and '${type}' at the same time`;

  //optimization: maybe signature might be just an array of types??
  const types = signature.map(v => v.type);
  body && f.addSignature(body, types, name);
  createMethodBody(types[0], f);

//  f.maxLength >= signature.length || (f.maxLength = signature.length);
  if(name){
    if(!existing){
      f.name !== name && nice.rewriteProperty(f, 'name', name);
      def(nice, name, f);
      reflect.emitAndSave('function', f);
      type && reflect.emitAndSave(type, f);
    }
    body && reflect.emitAndSave('signature',
      { name, body, signature, type, description, f });
  }

  return f;
};


nice.reflect.on('function', (f) =>
  Anything && !(f.name in Anything.proto) &&
      def(Anything.proto, f.name, function(...a) { return f(this, ...a); }));


function createMethodBody(type, body) {
  if(!type || !type._isNiceType || (body.name in type.proto))
    return;
  const functionType = body.functionType;
  const fistTarget = body.signatures.get(type);
  const {_1,_2,_3,_$} = nice;
  def(type.proto, body.name, function(...args) {
    const fistArg = this;
    for(let a of args){
      if(a === _1 || a === _2 || a === _3 || a === _$)
        return skip(z, [fistArg].concat(args));
    }

    let target = fistTarget;
    const l = args.length;
    let precision = Infinity;
    for(let i = 0; i < l; i++) {
      if(target && target.size){
        let type = nice.getType(args[i]);
        let found = null;
        while(type){
          found = target.get(type);
          if(found){
            break;
          } else {
            type = Object.getPrototypeOf(type);
          }
        }
        if(found){
          let _t = found.transformations ? found.transformations.length : 0;
          if(_t <= precision || !target.action){
            precision = _t;
            target = found;
          }
        }
      }
    }

    if(!target)
      return signatureError(body.name, [fistArg].concat(args));

    if(target.transformations)
      for(let i in target.transformations)
        args[i] = target.transformations[i](args[i]);

    if(functionType === 'Action'){
      if('transactionStart' in fistArg && fistArg._isHot){
        fistArg.transactionStart();
        target.action(fistArg, ...args);
        fistArg.transactionEnd();
        return fistArg;
      } else {
        target.action(fistArg, ...args);
        return fistArg;
      }
    } else {
      return target.action(fistArg, ...args);
    }
  });
}


function createFunctionBody(functionType){
  const {_1,_2,_3,_$} = nice;
  const z = create(functionProto, (...args) => {
    for(let a of args){
      if(a === _1 || a === _2 || a === _3 || a === _$)
        return skip(z, args);
    }

    const call = new Set();
    const existing = nice.reflect.currentCall;
    if(existing !== undefined) {
      call.parentCall = existing;
    }
    nice.reflect.currentCall = call;

    let target = z.signatures;

    const l = args.length;
    let precision = Infinity;
    for(let i = 0; i < l; i++) {
      if(target && target.size) {
        let type = nice.getType(args[i]);
        let found = null;
        while(type){
          found = target.get(type);
          if(found){
            break;
          } else {
            type = Object.getPrototypeOf(type);
          }
        }
        if(found){
          let _t = found.transformations ? found.transformations.length : 0;
          if(_t <= precision || !target.action){
            precision = _t;
            target = found;
          }
        }
      }
    }
    if(!target)
      return signatureError(z.name, args);

    let result;
    try {
      if(target.transformations)
        for(let i in target.transformations)
          args[i] = target.transformations[i](args[i]);

      if(functionType === 'Action'){
        if('transactionStart' in args[0] && args[0]._isHot){
          args[0].transactionStart();
          target.action(...args);
          args[0].transactionEnd();
          return args[0];
        } else {
          target.action(...args);
          return args[0];
        }
      } else {
        result = target.action(...args);
      }
    } catch (e) {
      result = Err(e);
    }
    if(result === undefined){
      result = nice.Undefined();
    }
    //TODO:0 restore:
//    if(result._isAnything){
//      result._functionName = z.name;
//      result._args = args;
//    }
    nice.reflect.currentCall = call.parentCall;
    return result;
  });

  z.functionType = functionType;

  return z;
}


function mirrorType (t) {
  if(t._isJsType){
    return nice[t.niceType];
  } else if (t._isNiceType){
    const jsTypeName = nice.typesToJsTypesMap[t.name];
    return jsTypeName === undefined ? null : nice.jsTypes[jsTypeName] || null;
  }
  throw 'I need type';
};


function addCombination (a, type, mirror, transformation) {
  const res = [];
  const position = a[0].signature.length;

  a.forEach((last, k) => {
    res.push({
      signature: [ ...last.signature, type],
      transformations: Object.assign({}, last.transformations )
    });
    mirror !== null && res.push({
      signature: [ ...last.signature, mirror],
      transformations: Object.assign({}, last.transformations, { [position]: transformation})
    });
  });
  return res;
}

function allSignatureCombinations (ts) {
  let res = [];

  ts.forEach((type, i) => {
    const mirror = mirrorType(type);
    if(i === 0){
      res.push({signature: [type], transformations: []});
      mirror === null || res.push({
        signature: [mirror],
        transformations: { 0: type._isJsType ? v => v() : nice}
      });
    } else {
      res = addCombination (res, type, mirror, type._isJsType ? v => v() : nice);
    }
  });

  return res;
}


function signatureError(name, a){
  return Err(`Function ${name} can't handle (${a.map(v =>
      nice.typeOf(v).name).join(',')})`);
}


function handleType(type){
  type.name === 'Something' && create(type.proto, functionProto);

  defGet(functionProto, type.name, function() {
    return configurator({ signature: [{type}], existing: this });
  });

  defGet(configProto, type.name, function() {
    return this.next({signature: [{type}]});
  });
};

const skipedProto = {};

[1,2,3].forEach(n => nice['_' + n] = a => a[n - 1]);
_1 = nice._1;
_2 = nice._2;
_3 = nice._3;
nice._$ = a => a;

function _skipArgs(init, called) {
  const {_1,_2,_3,_$} = nice;
  const res = [];
  init.forEach(v => v === _$
    ? res.push(...called)
    : res.push(( v===_1 || v === _2 || v === _3) ? v(called) : v));
  return res;
};
def(nice, _skipArgs);


function skip(f1, args1){
  const f = create(skipedProto, function (...as) {
    let res;
    f.queue.forEach(({action, args}, k) => {
      const a2 = _skipArgs(args, as);
      res = k ? action(res, ...a2) : action(...a2);
    });
    return res;
  });
  f.queue = [];
  f1 && f.queue.push({action: f1, args: args1});
  return f;
};

def(nice, skip);


reflect.on('function', f => f.name && !skipedProto[f.name]
  && def(skipedProto, f.name, function(...args){
      this.queue.push({action: f, args});
      return this;
    })
);

for(let i in nice.jsTypes) handleType(nice.jsTypes[i]);
reflect.on('type', handleType);
Func = def(nice, 'Func', configurator());
Action = def(nice, 'Action', configurator({functionType: 'Action'}));
Mapping = def(nice, 'Mapping', configurator({functionType: 'Mapping'}));
Check = def(nice, 'Check', configurator({functionType: 'Check'}));


const ro = def(nice, 'ReadOnly', {});
reflect.on('type', type => {
  ro[type.name] = function (...a) {
    const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
    expect(f).isFunction();
    defGet(type.proto, name, function() { return f(this); } );
    return this;
  };
});

nice.reflect.on('itemUse', item => {
  const call = nice.reflect.currentCall;
  call === undefined || call.add(item);
});


//nice.reflect.on('signature', s => {
////  console.log(s.body);
//  let res = '';
//  const a = [];
//  const b = [];
//  s.signature.forEach((_s, n) => {
//    a.push(`if( a${n}.is${_s.type.name} ) { `);
//    b.unshift(`}`);
//  });
//  a.push(s.body.toString())
//  res = a.join('') + b.join('');
//  console.log(res);
//});


//Arr -> f
//Array -> Function -> f

//function qwe(a, f) {
//  const type = a && a._type;
//  if (a.type === 'Arr'){
//    return use(nice.Arr.eachRigth)
//  } else if(a.type === 'Arr') {
//    if(f.isFunction){
//      return use(nice.Array.Function.eachRigth);
//    } else {
//      throw error;
//    }
//  }
//  return error;
//};