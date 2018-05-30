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


  it("and", function(){
    let on = nice.Boolean(true);
    let off = nice.Boolean(false);
    expect(on.and(true)()).to.equal(true);
    expect(on.and(false)()).to.equal(false);
    expect(off.and(true)()).to.equal(false);
    expect(off.and(false)()).to.equal(false);
  });


  it("or", function(){
    let on = nice.Boolean(true);
    let off = nice.Boolean(false);
    expect(on.or(true)()).to.equal(true);
    expect(on.or(false)()).to.equal(true);
    expect(off.or(true)()).to.equal(true);
    expect(off.or(false)()).to.equal(false);
  });


  it("nor", function(){
    let on = nice.Boolean(true);
    let off = nice.Boolean(false);
    expect(on.nor(true)()).to.equal(false);
    expect(on.nor(false)()).to.equal(false);
    expect(off.nor(true)()).to.equal(false);
    expect(off.nor(false)()).to.equal(true);
  });


  it("xor", function(){
    let on = nice.Boolean(true);
    let off = nice.Boolean(false);
    expect(on.xor(true)()).to.equal(false);
    expect(on.xor(false)()).to.equal(true);
    expect(off.xor(true)()).to.equal(true);
    expect(off.xor(false)()).to.equal(false);
  });
});
