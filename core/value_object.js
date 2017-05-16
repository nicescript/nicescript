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

  clear: function (){
    this.transactionStart();
    var data = this._getData();
    for (let i in data)
      this[i].clear();
    this.transactionEnd();
  },

  _compareItems: nice.objectComparer
});


nice.Type(nice.ObjectPrototype);