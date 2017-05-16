nice.define(nice, function collectionMethods(o) {
  ['max','min','hypot'].forEach(name => {
    nice.define(o, name, function (f) {
      return nice.Number().by(z =>
        z(Math[name](...nice.mapArray(f || (v => v), z.use(this)())))
      );
    });
  });
});