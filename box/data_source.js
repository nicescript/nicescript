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
      if(!this.subscribers)
        this.subscribers = new Set();

      if(this.warmUp && this._isHot !== true){
        this.warmUp();
        this._isHot = true;
      }
      if(typeof f !== 'function' && typeof f === 'object' && !f.notify){
        const o = f;
        f = x => o[x]?.();
      }
      this.subscribers.add(f);
      if(v === -1)
        return;

      this.coldCompute && this.coldCompute();
      if(v === undefined || v < this._version)
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