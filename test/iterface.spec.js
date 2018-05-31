const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const { is, Box } = nice;

describe("Interface", () => {

//  it("name uniqe", () => {
//    expect(() => nice.Interface('Array')).to.throw();
//  });
//
//
//  it("existing type", () => {
//    nice.Interface('Usable', 'use');
//    expect(nice.is(nice.Box).Usable()).to.equal(true);
//  });
//
//
//  it("new type", () => {
//    nice.Type('Dog');
//    const i = nice.Interface('Walkable', 'walk');
//    const dog = nice.Dog();
//
//    expect(is(nice.Dog).Walkable()).to.equal(false);
//    expect(is(dog).Walkable()).to.equal(false);
//
//    nice.Function.Dog('walk', () => 1);
//
//    expect(is(nice.Dog).Walkable()).to.equal(true);
//    expect(is(dog).Walkable()).to.equal(true);
//  });

});