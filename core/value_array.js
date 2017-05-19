nice.ArrayPrototype = {
  _typeTitle: 'Array',

  _creator: () => {
    var f = function (...a){
      if(a.length === 0){
        f._compute();
        return f._getData();
      }

      f.set(...a);
      return f._container || f;
    };
    return f;
  },

  _default: () => [],

  push: function(...a){
    this.transactionStart();
    a.forEach(item => this.addAt(item));
    this.transactionEnd();
    return this;
  },

  set: function(...a){
    var toAdd = Array.isArray(a[0]) ? a[0] : a;
    this.transactionStart();
    toAdd.forEach(v => this._getData().includes(v) || this.addAt(v));
    this.transactionEnd(this._selfStatus);
    return this;
  },

  pull: function (item) {
    var a = this();
    var initSize = a.length;
    nice.pull(item, a);
    a.length !== initSize && this.resolve();
    return this;
  },

  resetValue: function () {
    if(this._getData().length) {
      this.transactionStart();
      this._setData([]);
      this.resolve();
      this.transactionEnd();
    }
    return this;
  },

  callEach: function () {
    var args = arguments;
    this().forEach(function (f) { f.apply(this, args);});
    return this;
  },

  each: function (f) {
    this().forEach(f);
  },

  map: function (f) {
    return nice.Array().by(z => {
      z.resetValue();
      z(...z.use(this)().map(f));
    });
  },

  filter: function (f) {
    return nice.Array().by(z => {
      z.resetValue();
      z(...z.use(this)().filter(f));
    });
  },

  sortBy: function (f) {
    f = f || (v => v);
    return nice.Array().by(z => z(nice.sortBy(f, z.use(this)())));
  },

  size: function () { return this().length; },

  findKey: function(f){ nice.findKey(f, this()); },

  find: function(f){
    for (let v of this._getData())
      if(f(v)) return v;
  },

  replace: function(a){
    this.expect(a, 'Result is not an array').toBeArray();

    if(a === this._getData())
      return a;

    this.transactionStart();
    this._setData(a);
    this.transactionEnd(this._selfStatus);
    return this;
  },

  addAt: function(value, index){
    if(this._locked)
      throw nice.LOCKED_ERROR;
    var data = this._assertData();
    index === undefined && (index = data.length);
    data.splice(index, 0, value);
    this.resolve();
  },

  removeAt: function(index){
    if(this._locked)
      throw nice.LOCKED_ERROR;
    var data = this._getData();
    if(!data.length)
      return;
    this.resolve();
  },

  _compareItems: (a1, a2, add, del) => {
    var i1 = 0, i2 = 0, ii2, n;
    var l1 = a1.length, l2 = a2.length;
    for(;i1 < l1; i1++){
      if(a1[i1] === a2[i2]){
        i2++;
      } else {
        for(n = i2, ii2 = undefined; n < l2; n++){
          if(a2[n] === a1[i1]){
            ii2 = n;
            break;
          }
        }
        if(ii2 === undefined){
          del(a1[i1], i2);
        } else {
          while(i2 < ii2) add(a2[i2], i2++);
          i2++;
        }
      }
    }
    while(i2 < l2) add(a2[i2], i2++);
  },

  of: function(type){
    this._itemType = type;
    return this;
  },

  count: function(f){
    return nice.Number().by(z => {
      var i = 0;
      z.use(this).each((v, k) => f(v, k) && i++);
      z(i);
    });
  },
};

nice.Type(nice.new(nice.CollectionPrototype, nice.ArrayPrototype));
