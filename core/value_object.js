nice.ObjectPrototype._creator = () => {
  var f = nice.stripFunction(function (...a){
    if(a.length === 0){
      f._compute();
      return f._getData();
    }

    var v = a[0];
    if(a.length === 1 && a[0] === undefined)
      return f._container || f;

    if(a.length === 1 && v && !nice.is.Object(v))
      return f._getData()[v];

    if(!nice.is.Object(v)){
      var o = {};
      o[v] = a[1];
      v = o;
    }
    f._setChildrenValues(v);
    return f._container || f;
  });

  return f;
};


nice.defineAll(nice.ObjectPrototype, {
  _default: () => {return {};},

  _setChildrenValues: function(values){
    this.transactionEach(values, (vv, k) => {
      if(!this[k])
        nice.error('Property', k, 'not found at', this._typeTitle);
      this[k](vv);
    });
  },

  assign: function (o) {
    this.transactionEach(o, (v, k) => this[k](v));
  },

  fillFrom: function(item){
    this.transactionStart();
    var vv = item();
    for(let i in vv)
      this[i] && this[i](vv[i]);
    this.transactionEnd();
    return this;
  },

  resetValue: function (){
    this.transactionStart();
    var data = this._getData();
    for (let i in data)
      this[i].resetValue();
    this._constructor(this);
    this.transactionEnd();
  },

  _compareItems: nice.objectComparer
});


function createProperty(target, proto, name, byF){
  if(nice.is.Function(name) && name.name){
    byF = name;
    name = byF.name;
  }
  Object.defineProperty(target, name, { get:
    function(){
      this._children = this._children || {};
      var res = this._children[name];
      if(!res){
        var res = nice._createItem(proto, this, name);
        byF && res.by(byF.bind(this));
        this._children[name] = res;
      }
      return res;
    }
  });
  byF && target[name];
}


nice.onType(function defineObjectsProperty(type){
  nice.define(nice.ObjectPrototype, type.title, function (name, initBy) {
    createProperty(this, type.itemPrototype, name, initBy);
    this.resolve();
    return this;
  });
  nice.define(nice.classPrototype, type.title, function (name, initBy) {
    createProperty(this.itemProto, type.itemPrototype, name, initBy);
    return this;
  });
});


nice.Type(nice.ObjectPrototype);