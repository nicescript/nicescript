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
  addSignature: function (body, signature){
    if(signature && signature.length){
      const ss = this.signatures = this.signatures || new Map();
      const type = signature[0].type;
      ss.has(type) || ss.set(type, createFunctionBody({name: this.name}));
      ss.get(type).addSignature(body, signature.slice(1));
    } else {
      this.body = body;
    }
//    addDerivedSignatures(this, signature, body);
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

  const [name, body] = a.length === 2 ? a : [a[0].name, a[0]];

  return typeof body === 'function' ? { name, body } : a[0];
};


function toItemType({type}){
  return { type: type.jsType ? nice[type.niceType] : type };
}


function transform(s){
  s.source = s.body;
  if(s.signature.length === 0)
    return s;

  const types = s.signature;

  s.signature = types.map(toItemType);

  s.body = (...a) => {
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

  def(s.body, 'length', s.source.length);

  return s;
}


function Configurator(name){
  const z = create(configProto, (...a) => {
    const { name, body, signature } = parseParams(...a);
    const res = createFunction(transform({
      description: z.description,
      type: z.functionType,
      existing: z.existing,
      name: z.name || name,
      body: body || z.body,
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

//TODO: finish and remove transform()
//function addDerivedSignatures(f, signature, body){
//  signature.forEach((v, k) => {
//    if(is.jsType(v)){
//      const t = mathingNiceType(type);
//      if(t && !hasSignature(f))
//
//        f.addSignature()
//
//    } else {
//
//    }
//  });
//}


//optimization: create function that don't check fist argument for type.proto
function createFunction({ existing, name, body, source, signature, type, description }){
  const target = type === 'Check' ? nice.checkFunctions : nice;

  if(type !== 'Check' && name && typeof name === 'string'
          && name[0] !== name[0].toLowerCase())
    throw "Function name should start with lowercase letter. "
          + `"${nice._decapitalize(name)}" not "${name}"`;

  existing = existing || (name && target[name]);
  const f = existing || createFunctionBody(type);

  if(existing && existing.functionType !== type)
    throw `function '${name}' can't have types '${existing.functionType}' and '${type}' at the same time`;

  body && f.addSignature(wrap(type, body), signature);
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
    body && nice.emitAndSave('signature',
      { name, body, signature, type, description, source });
  }

  return f;
};


function wrap(type, body){
  if(type === 'Action'){
    //TODO: wrap all actions in transaction
    // TODO: primitive case
//    if(is.primitive(a[0]))
//      return s(...a);
    return function (...as) { body(...as); return as[0]; };
  }

  //TODO: remove nice() maybe
  if(type === 'Mapping')
    return function (...as) { return nice(body(...as)); };

  return body;
}


function createFunctionBody(type){
  const z = create(functionProto, (...args) => {
    if(args.includes(nice))
      return skip(args, z);

    let res;
    let target = z;

    if(!args.length || !target.signatures) {
      res = target.body;
    } else {
      for(let i in args) {
        let type = nice.typeOf(args[i++]);
        while(!res && type){
          if(target.signatures.has(type)){
            target = target.signatures.get(type);
            res = target.body;
          } else {
            type = Object.getPrototypeOf(type);
          }
        }
        if(res)
          break;
      }
    }

    if(!res)
      throw signatureError(z.name, args);

    return res(...args);
  });

  z.functionType = type;

  return z;
}


function findAction(target, args){

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