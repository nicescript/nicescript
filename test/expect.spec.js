var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("expect", function() {

  it("toBe", function(){
    expect(() => nice.expect(0).toBe()).to.throw();
    expect(() => nice.expect(1).toBe()).not.to.throw();
  });


  it("function", function(){
    expect(() => nice.expect(1).function()).to.throw();
    expect(() => nice.expect(() => {}).function()).not.to.throw();
  });


  it("toMatch", function(){
    expect(() => nice.expect(1).toMatch(n => n > 2)).to.throw();
    expect(() => nice.expect(3).toMatch(n => n > 2)).not.to.throw();
  });


  it("check type", function(){
    nice.Type('Cat').String('name');
    nice.Type('Dog').String('name');

    var cat = nice.Cat().name('Ball');
    var dog = nice.Dog();
    expect(() => nice.expect(cat).Car()).to.throw();
    expect(() => nice.expect(cat).Cat()).not.to.throw();
    expect(() => nice.expect(cat).Dog()).to.throw();
    expect(() => nice.expect(dog).Cat()).to.throw();
  });

});
