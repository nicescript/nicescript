nice.jsTypes = { js: { title: 'js', proto: {}, jsType: true }};


const jsHierarchy = {
  js: 'primitive,Object',
  primitive: 'String,Boolean,Number,undefined,null,Symbol',
  Object: 'function,Date,RegExp,Array,Error,ArrayBuffer,DataView,Map,WeakMap,Set,WeakSet,Promise',
  Error: 'EvalError,RangeError,ReferenceError,SyntaxError,TSypeError,UriError'
};

const jsTypesMap = {
  Object: 'Obj',
  Array: 'Arr',
  Number: 'Num',
  Boolean: 'Bool',
  String: 'Str',
  function: 'Func',
  'undefined': 'Undefined',
  'null': 'Null'
};

nice.jsBasicTypesMap = {
  object: 'Obj',
  array: 'Arr',
  number: 'Num',
  boolean: 'Bool',
  string: 'Str',
  function: 'Func'
};

for(let i in jsHierarchy)
  jsHierarchy[i].split(',').forEach(title => {
    const parent = nice.jsTypes[i];
    const proto = create(parent.proto);
    nice.jsTypes[title] = create(parent,
        { title,
          proto,
          jsType: true,
          niceType: jsTypesMap[title] });
  });