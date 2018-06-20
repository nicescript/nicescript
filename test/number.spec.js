const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("Num", function() {

  it("type", function(){
    expect(nice.Num.isSubType(nice.Single)).to.equal(true);
    const n = nice.Num();
    expect(n._type.title).to.equal('Num');
    expect(n.is.Num()).to.equal(true);
  });


  it("empty constructor", function(){
    const s = nice.Num();
    expect(s()).to.equal(0);
  });


  it("constructor", function(){
    const n = nice.Num("7");
    expect(n()).to.equal(7);
  });


  it("setter", function(){
    const n = nice.Num();
    n("7");

    expect(n()).to.equal(7);
  });


  it("negate", function(){
    const n = nice.Num(7);
    n.negate();
    expect(n()).to.equal(-7);
  });


  it("basic operations", function(){
    expect(nice.Num(7).product(-1)()).to.equal(-7);
  });


  it("Math", function(){
    const n = nice.Num();
    n("7");

    expect(n.min(3)()).to.equal(3);
    expect(n.max(3)()).to.equal(7);
  });
});
