const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const { is } = nice;

describe("Boolean", function() {

  it("type", function(){
    expect(is.subType(nice.Boolean, nice.Single)).to.equal(true);
    const n = nice.Boolean();
    expect(n._type.title).to.equal('Boolean');
  });


  it("empty constructor", function(){
    const s = nice.Boolean();
    expect(s()).to.equal(false);
  });


  it("constructor", function(){
    const b = nice.Boolean(1);
    expect(b()).to.equal(true);
  });


  it("set", function(){
    const b = nice.Boolean();
    b(2);
    expect(b()).to.equal(true);
  });
});
