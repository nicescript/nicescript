var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("String", function() {

  it("constructor", function(){
    var s = nice.String(2);
    expect(s()).to.equal('2');
  });


  it("Stirng", function(){
    var s = nice.String();
    expect(s._typeTitle).to.equal('String');

    s(2);
    expect(s()).to.equal('2');

    s(' qwe');
    expect(s()).to.equal(' qwe');

    expect(s.trim()()).to.equal('qwe');
  });


  it("format", function(){
    var s = nice.String('Hello %s', 'world');
    expect(s()).to.equal('Hello world');
  });


  it("trimLeft", () => {
    expect(nice.trimLeft('  qwe')).to.equal('qwe');
    expect(nice.trimLeft('', 'qwe')).to.equal('');
    expect(nice.trimLeft('!@#qwe', '#@!')).to.equal('qwe');
  });


  it("trimRight", () => {
    expect(nice.trimRight('qwe!@#', '#@!')).to.equal('qwe');
  });


  it("trim", () => {
    expect(nice.trim('!!!qwe!@#', '#@!')).to.equal('qwe');
  });
});
