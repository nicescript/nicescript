nice.jsTypes = { js: { title: 'js', proto: {}, jsType: true }};


const jsHierarchy = {
  js: 'primitive,object',
  primitive: 'string,boolean,number,undefined,null,symbol',
  object: 'function,date,regExp,array,error,arrayBuffer,dataView,map,weakMap,set,weakSet,promise',
  error: 'evalError,rangeError,referenceError,syntaxError,typeError,uriError'
};

const jsTypesMap = {
  Object: 'Obj',
  Array: 'Arr',
  Number: 'Num',
  Boolean: 'Bool',
  String: 'Str',
  Function: 'Func'
};
//TODO: Err, ...

for(let i in jsHierarchy)
  jsHierarchy[i].split(',').forEach(title => {
    const parent = nice.jsTypes[i];
    const proto = create(parent.proto);
    const jsName = nice._capitalize(title);
    nice.jsTypes[title] = create(parent,
        { title,
          proto,
          jsType: true,
          jsName,
          niceType: jsTypesMap[jsName] });
  });