const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("Number", function() {

  it("type", function(){
    expect(nice.Number.isSubType(nice.Single)).to.equal(true);
    const n = nice.Number();
    expect(n._type.title).to.equal('Number');
    expect(n.is.Number()).to.equal(true);
  });


  it("empty constructor", function(){
    const s = nice.Number();
    expect(s()).to.equal(0);
  });


  it("constructor", function(){
    const n = nice.Number("7");
    expect(n()).to.equal(7);
  });


  it("setter", function(){
    const n = nice.Number();
    n("7");

    expect(n()).to.equal(7);
  });


  it("negate", function(){
    const n = nice.Number(7);
    n.negate();
    expect(n()).to.equal(-7);
  });


  it("basic operations", function(){
    expect(nice.Number(7).product(-1)()).to.equal(-7);
  });


  it("Math", function(){
    const n = nice.Number();
    n("7");

    expect(n.min(3)()).to.equal(3);
    expect(n.max(3)()).to.equal(7);
  });
});
