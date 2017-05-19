var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Nice Number", function() {

  it("construcor", function(){
    var n = nice.Number("7");
    expect(n()).to.equal(7);
  });

  it("setter", function(){
    var n = nice.Number();
    n("7");

    expect(n._typeTitle).to.equal('Number');
    expect(n()).to.equal(7);
    expect(n()).not.to.equal("7");

    n.negate()
    expect(n()).to.equal(-7);
  });


  it("basic operations", function(){
    var n = nice.Number(7);
    expect(n.product(-1)()).to.equal(-7);
  });


  it("modify", function(){
    var n = nice.Number(7);
    n.negate()
    expect(n()).to.equal(-7);
  });


  it("Math", function(){
    var n = nice.Number();
    n("7");

    expect(n.min(3)()).to.equal(3);
    expect(n.max(3)()).to.equal(7);
  });


  it("listen", function() {
    var city = nice.Number();
    var spy = chai.spy();
    city.listenBy(c => spy(c()));
    expect(spy).to.have.been.called.once.with(0);
    city(19);
    expect(spy).to.have.been.called.twice.with(19);
  });


  it("listen chain", () => {
    var a = nice.Number();
    var even = nice.item().by(z => z(z.use(a)() * 2));
    var spy = chai.spy();

    even.listenBy(spy);
    a(2);
    expect(even()).to.equal(4);
  });


  it("setting same value should resolve item", function(){
    var a = nice.Number();
    var spy = chai.spy();
    a.pending().listenBy(spy);
    expect(spy).not.to.have.been.called();
    a(0);
    expect(spy).to.have.been.called.once.with(a);
    expect(a()).to.equal(0);
  });
});
