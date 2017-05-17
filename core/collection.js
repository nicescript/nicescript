var proto = {
  reduce: function(f, init){
    return nice.Item().by(z => {
      var val = nice.clone(init);
      var a = z.use(this);
      a.each((v, k) => val = f(val, v, k));
      return z(val);
    });
  }
};


Object.defineProperty(proto, 'reduceTo', { get: function() {
  var f = (f, item) => item.by(z => {
    item.resetValue();
    z.use(this).each((v, k) => f(item, v, k));
  });

  f.collection = this;

  return nice.new(nice.collectionReducers, f);
}});


['max','min','hypot'].forEach(name => {
  nice.define(proto, name, function (f) {
    return nice.Number().by(z =>
      z(Math[name](...nice.mapArray(f || (v => v), z.use(this)())))
    );
  });
});

nice.define(nice, 'CollectionPrototype', proto);