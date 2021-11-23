/*

 Functions requirements:

 - Store and use simple js function

 - Use function as a dependence for items created with it

 -

 */
nice.reflect.reportUse = true;

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
  addSignature (body, types, name, returns){
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

//  const f = existing || createFunctionBody(type);
  if(!cfg){
    cfg = create(functionProto, { name, functionType: type });
    reflect.functions[name] = cfg;
  }

  //optimization: maybe signature might be just an array of types??
  const types = signature.map(v => v.type);
  returns && (body.returnType = returns);
  body && cfg.addSignature(body, types, name, returns);
//  createMethodBody(types[0], f);
  const f = reflect.compileFunction(cfg);

  if(name){
    //TODO:
//    f.name !== name && nice.rewriteProperty(f, 'name', name);
//    def(nice, name, f);
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
//  !first && console.log(s.name);
  if(!(s.name in type.proto))
    type.proto[s.name] = function(...a) { return nice[s.name](this, ...a); };
//    def(type.proto, s.name, function(...a) { return nice[s.name](this, ...a); });
});


//nice.reflect.on('function', (f) =>
//  Anything && !(f.name in Anything.proto) &&
//      def(Anything.proto, f.name, function(...a) { return f(this, ...a); }));


function signatureError(name, a){
  return `Function ${name} can't handle (${a.map(v =>
      nice.typeOf(v).name).join(',')})`;
}


function handleType(type){
  type.name === 'Something' && create(type.proto, functionProto);

//  defGet(functionProto, type.name, function() {
//    return configurator({ signature: [{type}], existing: this });
//  });

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

    //TODO: replace with Mapping??
    return this;
  };
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
