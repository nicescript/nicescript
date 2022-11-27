/*

 Functions requirements:

 - Store and use simple js function

 - //TODO: Use function as a dependence for items created with it(Spy)

 -

 */
//nice.reflect.reportUse = true;

const configProto = {
  next (o) {
    const c = Configurator(this.name || o.name);

    c.signature = (this.signature || []).concat(o.signature || []);
    ['existing', 'functionType', 'returnValue', 'description', 'returns']
      .forEach(k => c[k] = o[k] || this[k]);

    return c;
  },

  about (s) { return this.next({ description: s}); },
};

const functionProto = {
  addSignature (body, types, returns){
    let ss = 'signatures' in this
      ? this.signatures
      : this.signatures = new Map();
    types && types.forEach(type => {
      if(ss.has(type)){
        ss = ss.get(type);
      } else {
        const s = new Map();
        ss.set(type, s);
        ss = s;
      }
    });

    if(ss.action){
      throw 'Signature already defined: ' + JSON.stringify(types);
    }

    ss.action = body;
    returns && (ss.returns = returns);
    return this;
  },

//  ary (n){
//    return (...a) => this(...a.splice(0, n));
//  },
//
//  about (s) {
//    return configurator({ description: s });
//  }
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
      returns: z.returns,
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
function createFunction({ name, body, signature, type, description, returns }){//existing,
  if(!/^[a-z].*/.test(name[0]))
   throw new Error(`Function name should start with lowercase letter. "${name}" is not`);

  const reflect = nice.reflect;

  let cfg = (name && reflect.functions[name]);
  const existing = cfg;

  if(cfg && cfg.functionType !== type)
    throw `function '${name}' can't have types '${cfg.functionType}' and '${type}' at the same time`;

  if(!cfg){
    cfg = create(functionProto, { name, functionType: type });
    reflect.functions[name] = cfg;
  }

  //optimization: maybe signature might be just an array of types??
  const types = signature.map(v => v.type);
  returns && (body.returnType = returns);
  body && cfg.addSignature(body, types, returns);
  const f = reflect.compileFunction(cfg);

  if(name){
    f.name !== name && nice.rewriteProperty(f, 'name', name);
    nice[name] = f;
    if(!existing){
      reflect.emitAndSave('function', cfg);
      type && reflect.emitAndSave(type, cfg);
    }
    body && reflect.emitAndSave('signature',
      { name, body, signature, type, description });
  }

  return f;
};

nice.reflect.on('signature', s => {
  if(!Anything)
    return;

  const first = s.signature[0];
  const type = first ? first.type : Anything;
  if(!(s.name in type.proto))
    type.proto[s.name] = function(...a) { return nice[s.name](this, ...a); };
});


function signatureError(name, a){
  return `Function ${name} can't handle (${a.map(v =>
      nice.typeOf(v).name).join(',')})`;
}


function handleType(type){
  type.name === 'Something' && create(type.proto, functionProto);

  defGet(configProto, type.name, function() {
    return this.next({signature: [{type}]});
  });

  defGet(configProto, 'r' + type.name, function() {
    return this.next({returns: type});
  });
};


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
    defGet(type.proto, name, function() {
      const initType = this._type;
      if(initType !== this._type){
        return this[name];
      } else {
        return f(this);
      }
    });
    return this;
  };
});
