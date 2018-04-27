const configProto = {
  next: function (o) {
    let c = Configurator(this.name || o.name);

    c.signature = (this.signature || []).concat(o.signature || []);
    c.existing = o.existing || this.existing;
    c.functionType = o.functionType || this.functionType;
    c.returnValue = o.returnValue || this.returnValue;

    return c;
  }
};

const skippedProto = {};

const functionProto = {
  addSignature: function (action, signature){
    if(signature && signature.length){
      const ss = this.signatures = this.signatures || new Map();
      const type = signature[0].type;
      ss.has(type) || ss.set(type, createFunctionBody({name: this.name}));
      ss.get(type).addSignature(action, signature.slice(1));
    } else {
      this.action = action;
    }
    return this;
  },

  ary: function (n){
    return (...a) => this(...a.splice(0, n));
  }
};

const parseParams = (...a) => {
  if(!a[0])
    return {};

  const [name, action] = a.length === 2 ? a : [a[0].name, a[0]];

  return typeof action === 'function' ? { name, action } : a[0];
};


function toItemType({type}){
  return { type: type.jsType
    ? nice[type.title[0].toUpperCase() + type.title.substr(1)]
    : type };
}


function transform(s){
  if(s.signature.length === 0)
    return s;

  const action = s.action;
  const types = s.signature;

  s.signature = types.map(toItemType);

  s.action = (...a) => {
    const l = types.length;
    for(let i = 0; i < l; i++){
      const isNice = a[i] && a[i]._isAnything;
      const needJs = types[i].type.jsType;
      if(needJs && isNice){
        a[i] = a[i].getResult();
      } else if(!needJs && !isNice){
        a[i] = nice.toItem(a[i]);
      }
    }
    return action(...a);
  };

  def(s.action, 'length', action.length);

  return s;
}


function Configurator(name){
  const z = create(configProto, (...a) => {
    const { name, action, signature } = parseParams(...a);
    const res = createFunction(transform({
      type: z.functionType,
      existing: z.existing,
      name: z.name || name,
      action: action || z.action,
      signature: (z.signature || []).concat(signature || [])
    }));
    return z.returnValue || res;
  });

  nice.eraseProperty(z, 'name');
  def(z, 'name', name || '');

  return z;
}


function configurator(...a){
  const cfg = parseParams(...a);
  return Configurator(cfg.name).next(cfg);
};


//optimization: create function that don't check fist argument for type.proto
function createFunction({ existing, name, action, signature, type }){
  const target = type === 'Check' ? nice.checkFunctions : nice;
  existing = existing || (name && target[name]);
  const f = existing || createFunctionBody(type);

  if(existing && existing.functionType !== type)
    throw `function '${name}' can't have types '${existing.functionType}' and '${type}' at the same time`;

  action && f.addSignature(action, signature);
  if(name){
    if(!existing){
      if(f.name !== name){
        nice.eraseProperty(f, 'name');
        def(f, 'name', name);
      }
      existing || def(target, name, f);
    }
    const firstType = signature[0] && signature[0].type;
    firstType && !firstType.proto.hasOwnProperty(name) && type !== 'Check'
        && def(firstType.proto, name, function(...a) { return f(this, ...a); });
    if(!existing){
      nice.emitAndSave('function', f);
      type && nice.emitAndSave(type, f);
    }
    action && nice.emitAndSave('signature', {name, action, signature, type});
  }

  return f;
};


function createFunctionBody(type){
  const z = create(functionProto, (...a) => {
    if(a.includes(nice))
      return skip(a, z);

    const s = findAction(z, a);
    if(!s)
      throw signatureError(z.name, a);

    if(type === 'Action'){
      if(is.primitive(a[0]))
        return s(...a);
      s(...a);
      return a[0];
    }

    if(type === 'Mapping')
      return nice(s(...a));

    return s(...a);
  });

  z.functionType = type;

  return z;
}


function findAction(target, args){
  let res;

  if(!args.length || !target.signatures)
    return target.action;

  for(let i in args) {
    let type = nice.typeOf(args[i++]);
    while(!res && type){
      if(target.signatures.has(type)){
        target = target.signatures.get(type);
        res = target.action;
      } else {
        type = Object.getPrototypeOf(type);
      }
    }
    if(res)
      return res;
  }
}


function signatureError(name, a, s){
  return `Function ${name} can't handle (${a.map(v => nice.typeOf(v).title).join(',')})`;
}


function handleType(type){
  type.title === 'Something' && create(type.proto, functionProto);

  defGet(functionProto, type.title, function() {
    return configurator({ signature: [{type}], existing: this });
  });

  defGet(configProto, type.title, function() {
    return this.next({signature: [{type}]});
  });
};


function skip(a, f){
  return create(skippedProto, (...b) => {
    const c = [];
    let i = 0;
    a.forEach(v => c.push(v === nice ? b[i++] : v));
    return f(...c);
  });
}


for(let i in nice.jsTypes) handleType(nice.jsTypes[i]);
nice._on('Type', handleType);
Func = def(nice, 'Function', configurator());
Action = def(nice, 'Action', configurator({functionType: 'Action'}));
Mapping = def(nice, 'Mapping', configurator({functionType: 'Mapping'}));
Check = def(nice, 'Check', configurator({functionType: 'Check'}));


nice._on('function', ({name}) => {
  name && !skippedProto[name] && def(skippedProto, name, function(...a){
    return create(skippedProto, a.includes(nice)
      ? (...b) => {
          let c = [];
          for (let i = a.length ; i--;){
            c[i] = a[i] === nice ? b.pop() : a[i];
          }
          return this(...b)[name](...c);
        }
      : (...b) => {
            return this(...b)[name](...a);
    });
  });
});
