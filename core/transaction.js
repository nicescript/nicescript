nice.defineAll(nice.ItemPrototype, {
  transactionStart: function(){
    if(!this._transactionDepth){
      this._transactionDepth = 0;
      this._transactionResult = nice.clone(this._getData());
      this._transactionStart = 1;
    }
    this._transactionDepth++;
    return this;
  },

  transactionEnd: function(){
    if(--this._transactionDepth > 0)
      return;

    this._notifyItems();
    delete this._transactionResult;
    var haveSome = this._transactionStart > 1;
    delete this._transactionStart;
    if(haveSome){
      this.resolve();
      var off = this._subscriptions && this._subscriptions.some(s => !s.active);
      this._status = this._selfStatus = off ? nice.NEED_COMPUTING : nice.RESOLVED;
    } else if(this._selfStatus === nice.PENDING){
      this._selfStatus = nice.NEED_COMPUTING;
    }
    return haveSome;
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
    this._transactionStart && this._setData(this._transactionResult);
    delete this._transactionResult;
    this._transactionDepth = 0;
    delete this._transactionStart;
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