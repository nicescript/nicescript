const nice = require('../index.js')();
const chai = require('chai');
const expect = chai.expect;


describe("utils", function() {
  it("or", () => {
    expect(nice.NOT_FOUND.or(1)()).to.equal(1);
    expect(nice(1).or(2)()).to.equal(1);
    expect(nice.or(nice.NOT_FOUND, null, 2)()).to.equal(2);
  });


  it("boolean or", function(){
    let on = nice.Boolean(true);
    let off = nice.Boolean(false);
    expect(on.or(true)()).to.equal(true);
    expect(on.or(false)()).to.equal(true);
    expect(off.or(true)()).to.equal(true);
    expect(off.or(false)()).to.equal(false);
  });


  it("and", () => {
    expect(nice.NOT_FOUND.and(1)).to.equal(nice.NOT_FOUND);
    expect(nice(1).and(2)()).to.equal(2);
    expect(nice.and(nice.UNDEFINED, null, 2)).to.equal(nice.UNDEFINED);
  });
});


  it("boolean and", function(){
    let on = nice.Boolean(true);
    let off = nice.Boolean(false);
    expect(on.and(true)()).to.equal(true);
    expect(on.and(false)()).to.equal(false);
    expect(off.and(true)()).to.equal(false);
    expect(off.and(false)()).to.equal(false);
  });


  it("boolean nor", function(){
    let on = nice.Boolean(true);
    let off = nice.Boolean(false);
    expect(on.nor(true)()).to.equal(false);
    expect(on.nor(false)()).to.equal(false);
    expect(off.nor(true)()).to.equal(false);
    expect(off.nor(false)()).to.equal(true);
  });


  it("boolean xor", function(){
    let on = nice.Boolean(true);
    let off = nice.Boolean(false);
    expect(on.xor(true)()).to.equal(false);
    expect(on.xor(false)()).to.equal(true);
    expect(off.xor(true)()).to.equal(true);
    expect(off.xor(false)()).to.equal(false);
  });

