var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("expect", function() {

  it("toBe", function(){
    var a = nice.item();

    expect(() => a.expect(0).toBe()).to.throw();
    expect(() => a.expect(1).toBe()).not.to.throw();
  });


  it("toBeFunction", function(){
    var a = nice.item();
    expect(() => a.expect(1).toBeFunction()).to.throw();
    expect(() => a.expect(() => {}).toBeFunction()).not.to.throw();
  });


  it("toMatch", function(){
    var a = nice.item();
    expect(() => a.expect(1).toMatch(n => n > 2)).to.throw();
    expect(() => a.expect(3).toMatch(n => n > 2)).not.to.throw();
  });


  it("toBeOf", function(){
    var a = nice.item();
    nice.class('Cat').String('name');
    nice.class('Dog').String('name');

    var cat = nice.Cat().name('Ball');
    var dog = nice.Dog();
    expect(() => a.expect(cat).toBeOf('Car')).to.throw();
    expect(() => a.expect(cat).toBeOf('Cat')).not.to.throw();
    expect(() => a.expect(cat).toBeOf('Dog')).to.throw();
    expect(() => a.expect(dog).toBeOf('Cat')).to.throw();
  });

});
