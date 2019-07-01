nice.Type({
  name: 'Err',

  extends: 'Nothing',

  initBy: (z, message) => {
    const a = new Error().stack.split('\n');
    a.splice(0, 4);
    z._value = { message, trace: a.join('\n') };
  },

  creator: () => ({}),

  proto: {
    valueOf () { return new Err(this._value.message); },
    toString () { return `Error: ${this._value.message}`; }
  }
}).about('Represents error.');
Err = nice.Err;
