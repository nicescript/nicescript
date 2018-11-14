nice.Type({
  name: 'Err',

  extends: 'Nothing',

  initBy: (z, message) => {
    z.message = message;
    const a = new Error().stack.split('\n');
    a.splice(0, 4);
    z.trace = a.join('\n');
  },

  creator: () => ({}),

  proto: {
    valueOf: function() { return new Err(this.message); },
    toString: function() { return `Error: ${this.message}`; }
  }
}).about('Represents error.');
