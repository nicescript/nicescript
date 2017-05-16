nice.StringPrototype = {
  _typeTitle: 'String',
  _set: (...a) => a[0] ? nice.format(...a) : '',
  _default: () => ''
};

var whiteSpaces = ' \f\n\r\t\v\u00A0\u2028\u2029';
var stringUtils = {
  trimLeft: (s, a = whiteSpaces) => {
    var i = 0;
    while(a.indexOf(s[i]) >= 0) i++;
    return s.substr(i);
  },

  trimRight: (s, a = whiteSpaces) => {
    var i = s.length - 1;
    while(a.indexOf(s[i]) >= 0) i--;
    return s.substr(0, i + 1);
  },

  trim: (s, a) => nice.trimRight(nice.trimLeft(s, a), a),

  truncate: function (s, n, tale) {
    return s.length > n
      ? s.substr(0, n) + (tale || '')
      : s;
  }
};

nice.each((v, k) => {
  nice.StringPrototype[k] = function(...a){
    return nice.String().by(z => z(v(this(), ...a)));
  };
}, stringUtils);

nice.defineAll(nice, stringUtils);


nice.Type(nice.StringPrototype);
