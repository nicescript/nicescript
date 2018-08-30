const configProto = {
  next: function (o) {
    let c = Configurator(this.name || o.name);

    c.signature = (this.signature || []).concat(o.signature || []);
    c.existing = o.existing || this.existing;
    c.functionType = o.functionType || this.functionType;
    c.returnValue = o.returnValue || this.returnValue;
    c.description = o.description || this.description;

    return c;
  },

  about: function(s) { return this.next({ description: s}); }
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
  },

  about: function(s) {
    return configurator({ description: s });
  }
};

const parseParams = (...a) => {
  if(!a[0])
    return {};

  const [name, action] = a.length === 2 ? a : [a[0].name, a[0]];

  return typeof action === 'function' ? { name, action } : a[0];
};


function toItemType({type}){
  return { type: type.jsType ? nice[type.niceType] : type };
}


function transform(s){
  s.source = s.action;
  if(s.signature.length === 0)
    return s;

  const types = s.signature;

  s.signature = types.map(toItemType);

  s.action = (...a) => {
    const l = types.length;
    for(let i = 0; i < l; i++){
      const isNice = a[i] && a[i]._isAnything;
      const needJs = types[i].type.jsType;
      //TODO: bug: when a[i] is nice.NotFound
      if(needJs && isNice){
        a[i] = a[i]();
      } else if(!needJs && !isNice){
        a[i] = nice(a[i]);
      }
    }
    return s.source(...a);
  };

  def(s.action, 'length', s.source.length);

  return s;
}


function Configurator(name){
  const z = create(configProto, (...a) => {
    const { name, action, signature } = parseParams(...a);
    const res = createFunction(transform({
      description: z.description,
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
function createFunction({ existing, name, action, source, signature, type, description }){
  const target = type === 'Check' ? nice.checkFunctions : nice;

  if(type !== 'Check' && name && typeof name === 'string'
          && name[0] !== name[0].toLowerCase())
    throw "Function name should start with lowercase letter. "
          + `"${nice._decapitalize(name)}" not "${name}"`;

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
    action && nice.emitAndSave('signature',
      {name, action, signature, type, description, source });
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
      //TODO: wrap all actions in transaction
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
  return `Function ${name} can't handle (${a.map(v => nice.typeOf(v).name).join(',')})`;
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
Func = def(nice, 'Func', configurator());
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


const ro = def(nice, 'ReadOnly', {});
nice._on('Type', type => {
  ro[type.name] = function (...a) {
    const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
    expect(f).function();
    defGet(type.proto, name, f);
    return this;
  };
});