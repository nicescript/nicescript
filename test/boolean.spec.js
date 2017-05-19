var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Boolean", function() {

  it("set", function(){
    var b = nice.Boolean();
    expect(b._typeTitle).to.equal('Boolean');
    b(2);
    expect(b()).to.equal(true);
  });


  it("constructor", function(){
    var b = nice.Boolean(1);
    expect(b()).to.equal(true);
  });


  it("switch", function(){
    var b = nice.Boolean();
    expect(b()).to.equal(false);
    b.switch();
    expect(b()).to.equal(true);
    expect(b.off()()).to.equal(false);
    expect(b.on()()).to.equal(true);
  });


  it("logical", function(){
    expect(nice.Boolean(1).or(0)()).to.equal(true);
    expect(nice.Boolean(1).or(1)()).to.equal(true);

    expect(nice.Boolean(1).and(1)()).to.equal(true);
    expect(nice.Boolean(1).and(0)()).to.equal(false);

    expect(nice.Boolean(1).xor(0)()).to.equal(true);
    expect(nice.Boolean(1).xor(1)()).to.equal(false);
  });
});