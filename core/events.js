function assertListeners(o, name){
  const listeners = o.hasOwnProperty('_listeners')
    ? o._listeners
    : o._listeners = {};

  return listeners[name] || (listeners[name] = []);
}

function assertEvents(o, name){
  const events = o.hasOwnProperty('_events')
    ? o._events
    : o._events = {};

  return events[name] || (events[name] = []);
}

const EventEmitter = {
  on: function (name, f) {
    const a = assertListeners(this, name);
    if(!a.includes(f)){
      this.emit('newListener', name, f);
      a.push(f);
      let es = this._events;
      es && es[name] && es[name].forEach(v => f(...v));
    }
    return this;
  },

  onNew: function (name, f) {
    const a = assertListeners(this, name);
    if(!a.includes(f)){
      this.emit('newListener', name, f);
      a.push(f);
    }
    return this;
  },

  emit: function (name, ...a) {
    this.listeners(name).forEach(f => f.apply(this, a));
    return this;
  },

  emitAndSave: function (name, ...a) {
    assertEvents(this, name).push(a);
    this.listeners(name).forEach(f => f.apply(this, a));
    return this;
  },

  listeners: function (name) {
    const listeners = this._listeners;
    let a = (listeners && listeners[name]) || [];

    a.length && nice.prototypes(this).forEach(({_listeners:ls}) => {
      ls && ls !== this._listeners && ls[name]
          && ls[name].forEach(l => a.includes(l) || (a = a.concat(l)));
    });

    return a;
  },

  listenerCount: function (name){
    return this._listeners
      ? this._listeners[name]
        ? this._listeners[name].length
        : 0
      : 0;
  },

  off: function (name, f) {
    if(this.hasOwnProperty('_listeners') && this._listeners[name]){
      nice._removeArrayValue(this._listeners[name], f);
      this.emit('removeListener', name, f);
    }
    return this;
  },

  removeAllListeners: function (name) {
    if(this.hasOwnProperty('_listeners')){
      const a = this._listeners[name];
      this._listeners[name] = [];
      a.forEach(f => this.emit('removeListener', name, f));
    }
    return this;
  }
};

nice.eventEmitter = o => Object.assign(o, EventEmitter);
def(nice, 'EventEmitter', EventEmitter);
def(nice, 'reflect', create(EventEmitter));
reflect = nice.reflect;