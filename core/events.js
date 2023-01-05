function assertListeners(o, name){
  const listeners = '_listeners' in o && o.hasOwnProperty('_listeners')
    ? o._listeners
    : o._listeners = {};

  return listeners[name] || (listeners[name] = []);
}

function assertEvents(o, name){
  const events = '_events' in o
    ? o._events
    : o._events = {};

  return events[name] || (events[name] = []);
}

const EventEmitter = {
  on (name, f) {
    const a = assertListeners(this, name);
    if(!a.includes(f)){
      this.emit('newListener', name, f);
      a.push(f);
      const es = this._events;
      es && es[name] && es[name].forEach(v =>
        f.notify ? f.notify(...v) : f(...v));
    }
    return this;
  },

  onNew (name, f) {
    const a = assertListeners(this, name);
    if(!a.includes(f)){
      this.emit('newListener', name, f);
      a.push(f);
    }
    return this;
  },

  emit (name, ...a) {
    this.listeners(name).forEach(f => {
      f.notify
        ? f.notify(...a)
        : Function.prototype.apply.apply(f, [this, a]);
    });
    return this;
  },

  emitAndSave (name, ...a) {
    assertEvents(this, name).push(a);
    this.emit(name, ...a)
    return this;
  },

  listeners (name) {
    const listeners = this._listeners;
    let a = (listeners && listeners[name]) || [];

    a.length && nice.prototypes(this).forEach(({_listeners:ls}) => {
      ls && ls !== this._listeners && ls[name]
          && ls[name].forEach(l => a.includes(l) || (a = a.concat(l)));
    });

    return a;
  },

  countListeners (name){
    return this._listeners
      ? this._listeners[name]
        ? this._listeners[name].length
        : 0
      : 0;
  },

  off (name, f) {
    if('_listeners' in this && this._listeners[name]){
      nice._removeArrayValue(this._listeners[name], f);
      this.emit('removeListener', name, f);
    }
    return this;
  },

  removeAllListeners (name) {
    if('_listeners' in this){
      const a = this._listeners[name];
      this._listeners[name] = [];
      a.forEach(f => this.emit('removeListener', name, f));
    }
    return this;
  }
};

nice.eventEmitter = o => defAll(o, EventEmitter);
def(nice, 'EventEmitter', EventEmitter);
create(EventEmitter, nice.reflect);
reflect = nice.reflect;