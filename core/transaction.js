nice.defineAll(nice.ItemPrototype, {
  transactionStart: function(){
    this._transactionDepth = this._transactionDepth || 0;
    this._transactionDepth++;
    this._transactionResult = nice.clone(this._getData());
    this._transactionStart = 1;
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
      (v, k) => {
        this.hasOwnProperty('onAdd') && this.onAdd.callEach(v, k);
      },
      (v, k) => {
        this.hasOwnProperty('onRemove') && this.onRemove.callEach(v, k);
      });
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