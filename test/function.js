var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Function", function() {

  it("Function", () => {
    var spy = chai.spy();
    var a = nice.Function((z, n) => spy(n * z.x())).Number('x');

    a.x(3);
    a(2);
    expect(spy).to.have.been.called.with(6);
//    console.log(a);
    expect(typeof a.bind).to.equal('function');
  });


  it("curry", () => {
    var f = nice.curry((a, b, c) => {
      return a + b + c;
    });
    expect(f(1, 2, 3)).to.equal(6);
    expect(f(1, 2)(3)).to.equal(6);
    expect(f(1)(2, 3)).to.equal(6);
    expect(f(1)(2)(3)).to.equal(6);
  });



});