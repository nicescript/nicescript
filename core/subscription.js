const RESOLVING = 'RESOLVING';
const RESOLVED = 'RESOLVED';
const CANCELED = 'CANCELED';
const OK = 0;

var proto = {
  notify: function(){
    var {target, source} = this;
    if(this._skip-- > 0)
      return;

    if(this.status === CANCELED)
      return;
    this.status = OK;

    let error = source.error();
    if(error){
      if(this._onError)
        return this._onError(error);

      if(target._sourceError) {
        target._sourceError(error);
      } else if(target.length === 2) {
        target(null, error) === false && this.cancel();
      } else {
        target(source) === false && this.cancel();
      }
    } else {
      if(nice.is.Item(target)){
        target._computeSelf();
      } else {
        target(source) === false && this.cancel();
      }
    }
    this._once && this.cancel();
  },

  _skip: 0,

  skip: function(n = 1){
    nice.expect(n).toBeFinite();
    this._skip = n;
    return this;
  },

  onError: function(f){
    this._onError = f;
    return this;
  },

  onlyOnce: function(){
    this._once = true;
    return this;
  },

  resolve: function(){
    var {source} = this;

    if(source._isResolved()){
      this.notify();
      return true;
    }

    if(source._compute){
      return source._compute();
    } else {
      nice.error('Bad source' + source);
    }
  },

  activate: function () {
    var {target, source} = this;
    var subscribers = source._subscribers;

    this.active = true;

    if(subscribers && subscribers.length){
      subscribers.find(i => i.target === target) || subscribers.push(this);
    } else {
      source._subscribers = source._subscribers || [];
      source._subscribers.push(this);
      nice.activateItem(source);
    }
  },

  cancel: function () {
    var {source} = this;
    this.active = false;
    this.status = CANCELED;
    nice.pull(this, source._subscribers);
    nice.haltItem(source);
  }
};


nice.defineAll({
  subscription: (source, target) => {
    var subscription;

    nice.expect(nice.is.Function(source._compute), 'Bad source').toBe();
    nice.expect(nice.is.Item(target) || nice.is.Function(target), 'Bad target').toBe();

    target._subscriptions = target._subscriptions || [];
    subscription = target._subscriptions.find(i => i.source === source);

    if(!subscription){
      subscription = Object.setPrototypeOf({source, target}, proto);
      target._subscriptions.push(subscription);
      (!target._isHot || target._isHot()) && subscription.activate();
    }
    return subscription;
  },

  unsubscribe: (source, target) => {
    var subscription;

    subscription = source._subscribers
        && source._subscribers.find(i => i.target === target);
    subscription && subscription.cancel();
  },

  cancel: target => {
    target._onCancel && target._onCancel(target);
    target && nice.each(s => s.cancel(), target._subscriptions);
  },

  listen: (...a) => nice.subscription(...a).resolve(),

  listenOnce: (...a) => nice.subscription(...a).onlyOnce().resolve(),

  activateItem: item => nice.each(s => s.activate(), item._subscriptions),

  haltItem: item => {
    nice.is.Empty(item._subscribers)
      && nice.each(s => s.cancel(), item._subscriptions);
  }
});