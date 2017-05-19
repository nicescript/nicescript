var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Type", function() {

  it("create", function() {
    var type = nice.Type({});
    expect(nice.type(type)).to.equal(type);
    var item = type();
    expect(nice.is.Item(item)).to.equal(true);
  });


  it("type", function() {
    expect(nice.type(nice.Number)).to.equal(nice.Number);
    expect(nice.type('Number')).to.equal(nice.Number);
  });
  
});