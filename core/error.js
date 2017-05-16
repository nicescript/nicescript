nice.defineAll(nice, {
  ErrorPrototype: {
    isError: true,
  },

  createError: (item, ...a) => nice.new(nice.ErrorPrototype, {
    targets: item,
    message: nice.format(...a)
  }),

  error: (...a) => {
    var message = a[0].message || nice.format(...a);
    console.log('Error happened');
    a[0].trace && (message += a[0].trace
        .map(i => 'at ' + nice.itemTitle(i))
        .join('\n'));
    console.log(message);
    console.trace();
    throw new Error(message);
  }
});


nice.defineAll(nice.ItemPrototype, {
  _sourceError: function(error){
    this.error(nice.new(nice.ErrorPrototype, {
      target: error,
      message: error.message
    }));
  },

  _childError: function(source){
    var error = source.error();
    this.error(nice.new(nice.ErrorPrototype, {
      target: error,
      path: source._containerKey,
      message: error.message
    }));
  },

  error: function(...a){
    if(a.length === 0)
      return this._error;

    if(a[0] === null){
      delete this._error;
      return this;
    }

    var e = a[0] || 'Unknown error';

    this._error = e.isError
      ? e
      : nice.createError(this, e);

    this.transactionRollback();
    this._selfStatus = this._status = nice.RESOLVED;
    this._notify();
  }
});
