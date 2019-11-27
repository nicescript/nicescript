nice.Type({
  name: 'Err',

  extends: 'Nothing',

  initBy: (z, e, ...as) => {
    const type = typeof e;
    let stack, message;

    if(type  === 'object') {
      if(e.stack){
        ({ stack, message } = e);
      } else {
        throw `Can't create error from ` + JSON.stringify(e);
      }
    } else if (type  === 'string') {
      message = as.length ? nice.format(e, ...as) : e;
    }

    if(!stack)
      stack = new Error().stack;

    const a = stack.split('\n');
    a.splice(0, 4);
    z._type.setValue(z, { message, trace: a.join('\n') });
  },

  creator: () => ({}),

  proto: {
    valueOf () { return Err(this._value.message); },
    toString () { return `Error: ${this._value.message}`; }
  }
}).about('Represents error.');
Err = nice.Err;
