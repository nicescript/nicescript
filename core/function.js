var proto = {
  _typeTitle: 'Function',
  _creator: () => {
    var z = function (...a){
      z.function().call(this, z, ...a);
    };

    return z;
  },
  _constructor: (z, f) => {
    z.Item('function');
    z.function(f);
  },
};


nice.Type(Object.setPrototypeOf(proto, nice.ObjectPrototype));
