const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const { Str } = nice;

describe("Str", function() {

  it("type", function(){
    expect(Str.isSubType(nice.Single)).to.equal(true);
    const s = Str();
    expect(s._type.name).to.equal('Str');
  });

  it("empty constructor", function(){
    const s = nice.Str();
    expect(s()).to.equal('');
  });


  it("constructor", function(){
    const s = nice.Str(2);
    expect(s()).to.equal('2');
  });


  it("set", function(){
    const s = Str();

    s(2);
    expect(s()).to.equal('2');

    s(' qwe');
    expect(s()).to.equal(' qwe');
  });


  it("format", function(){
    const s = Str('Hello %s', 'world');
    expect(s()).to.equal('Hello world');
  });


  it("trim", function(){
    expect(Str(' qwe').trim()()).to.equal('qwe');
  });


  it("trim with symbols", () => {
    expect(nice.trim('!!!qwe!@#', '#@!')()).to.equal('qwe');
  });


  it("trimLeft", () => {
    expect(nice.trimLeft('  qwe')()).to.equal('qwe');
    expect(nice.trimLeft('', 'qwe')()).to.equal('');
    expect(nice.trimLeft('!@#qwe', '#@!')()).to.equal('qwe');
  });


  it("trimRight", () => {
    expect(nice.trimRight('qwe!@#', '#@!')()).to.equal('qwe');
  });


  it("capitalize", () => {
    expect(nice.capitalize('qwe!@#')()).to.equal('Qwe!@#');
    expect(nice.capitalize('Qwe!@#')()).to.equal('Qwe!@#');
  });

  it("endsWith", () => {
    expect(nice.is.endsWith('qwe!@#', '@#')).to.equal(true);
    expect(nice.is.endsWith('qwe!@#', '!', 4)).to.equal(true);
  });


  it("startsWith", () => {
    expect(nice.is.startsWith('qwe!@#', 'qwe!')).to.equal(true);
    expect(nice.is.startsWith('qwe!@#', '!', 3)).to.equal(true);
  });

  it("includes", () => {
    expect(nice.is.includes('qwe!@#', 'qwe!')).to.equal(true);
    expect(nice.is.includes('qwe!@#', 'qwe', 3)).to.equal(false);
  });

  it("match", () => {
    expect(nice.is.match('qwe!@#', /q/)).to.equal(true);
    expect(nice.is.match('qwe!@#', /a/)).to.equal(false);
    expect(nice.match('qwe!@#', /q/)()[0]).to.equal('q');
  });

  it("Symbol.iterator", () => {
    const s = nice('qwe');
    expect([...s]).to.deep.equal(['q', 'w', 'e']);
  });

});
