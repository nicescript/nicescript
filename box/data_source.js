//problem 1: _isHot = true, request.v = 5, state.v = 7
//problem 2: _isHot = false, request.v = 5, state.v = 7

/*

isHot     v     reqV    ok?
true      1     1       do nothing
true      1     2       subscribe for future
true      2     1       !!
false     0     1       warmUp only
false     1     1       warmUp only
false     1     2
false     2     1
 */

nice.Type({
  name: 'DataSource',

  extends: 'Something',

  abstract: true,

  initBy(z){
    z.subscribers = new Set();
  },

  proto: {
    get version(){
      return this._version;
    },
    warmUpBy(f){ this.warmUp = f; return this; },
    coolDownBy(f){ this.warmUp = f; return this; },
    coldComputeBy(f){ this.warmUp = f; return this; },

    subscribe(f, v){
      const z = this;
      if(!z.subscribers)
        z.subscribers = new Set();

      if(z.warmUp && z._isHot !== true){
        z.warmUp();
        z._isHot = true;
      } else if (z.coldCompute){
        z.coldCompute();
      }
      if(typeof f !== 'function' && typeof f === 'object' && !f.notify){
        const o = f;
        f = x => o[x]?.();
      }
      z.subscribers.add(f);

      if(v === -1)
        return;

      if(v === undefined || v < z._version)
        z.notifyExisting(f);
    },

    notifyExisting(f){
      if(this._value !== undefined)
        f.notify ? f.notify(this._value) : f(this._value);
    },

    unsubscribe(f){
      this.subscribers.delete(f);
      if(this.subscribers.size === 0 && this.coolDown){
        this.coolDown();
        this._isHot = false;
      }
    },

  }
});

nice.eventEmitter(nice.DataSource.proto);


//{
//  version: 2,
//  coldCompute: f,
//  warmUp: f,
//  coolDown: f
//}