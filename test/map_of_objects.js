var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Map of Objects", function() {
  it("of Objects", () => {
    nice.class('Boat').Number('hull').String('name');
    var map = nice.Map().of('Boat');
    
    map('qwe').hull(1);
    map('qwe').hull.inc();
    map('qwe').name('Qwe');
    expect(map()).to.deep.equal({'qwe': {'hull': 2, name:'Qwe'}});
  });
  
});