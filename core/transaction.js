nice.defineAll(nice.ItemPrototype, {
  transactionStart: function(){
    if(!this._transactionDepth){
      this._initStatus = this._selfStatus;
      this._transactionDepth = 0;
      this._transactionResult = nice.clone(this._getData());
    }
    this._transactionDepth++;
    return this;
  },

  transactionEnd: function(forceCommit){
    if(--this._transactionDepth > 0)
      return;

    this._notifyItems();
    var diff = this._getDiff();
    var go = this._selfStatus !== this._initStatus || diff || forceCommit;
    this._transactionDepth = 0;
    if(go){
      this.resolve();
      var off = this._subscriptions && this._subscriptions.some(s => !s.active);
      this._status = this._selfStatus = off ? nice.NEED_COMPUTING : nice.RESOLVED;
    } else if(this._selfStatus === nice.PENDING){
      this._selfStatus = nice.NEED_COMPUTING;
    }
    delete this._transactionResult;
    delete this._modified;
    delete this._initStatus;
    delete this._diff;
    return go;
  },

  _notifyItems: function (){
    if(!this._compareItems)
      return;

    if(!this.hasOwnProperty('onAdd') && !this.hasOwnProperty('onRemove'))
      return;

    var old = this._transactionResult;
    this._compareItems(
      old,
      this._getData(),
      this.hasOwnProperty('onAdd') ? this.onAdd.callEach : () => {},
      this.hasOwnProperty('onRemove') ? this.onRemove.callEach : () => {}
    );
  },

  transactionRollback: function(){
    this._transactionDepth && this._setData(this._transactionResult);
    delete this._transactionResult;
    this._transactionDepth = 0;
    delete this._modified;
    delete this._diff;
  },

  transactionEach: function (item, f){
    if(!f){
      f = item;
      item = undefined;
    };
    this.transactionStart();
    item ? nice.each(f, item) : this.each(f);
    this.transactionEnd();
    return this;
  }
});