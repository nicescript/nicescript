const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const { is } = nice;

describe("Bool", function() {

  it("type", function(){
    expect(nice.isSubType(nice.Bool, nice.Single)).to.equal(true);
    const n = nice.Bool();
    expect(n._type.name).to.equal('Bool');
  });


  it("empty constructor", function(){
    const s = nice.Bool();
    expect(s()).to.equal(false);
  });


  it("constructor", function(){
    const b = nice.Bool(1);
    expect(b()).to.equal(true);
  });


  it("set", function(){
    const b = nice.Bool();
    b(2);
    expect(b()).to.equal(true);
  });
});
