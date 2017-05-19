var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Type", function() {

  it("setter", function() {
    var a = nice.Array();

    a(2)(3, 4)(5);
    expect(a()).to.deep.equal([2, 3, 4, 5]);
  });
});