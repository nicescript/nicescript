const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("Function", function() {
  const a = nice.Type('AAA')();
  const b = nice.Type('BBB').extends('AAA')();

  it("type", () => {
    const f = nice.Function(() => 2);
    expect(nice.is(f).Something()).to.equal(true);
    expect(nice.is(f).Value()).to.equal(false);
  });

  it("simple", () => {
    const f = nice.Function(() => 2);

    const res = f();
    expect(res).to.equal(2);
  });


  it("jsType", () => {
    let f = nice.Function.string(function oijoih(){return 1;});
    nice.Function.array(function oijoih(){return 2;});
    expect(f('')).to.equal(1);
    expect(nice.oijoih('')).to.equal(1);
    expect(nice.oijoih([])).to.equal(2);
    expect(() => f({})).to.throw();
    expect(() => nice.oijoih({})).to.throw();
  });


  it("deafault", () => {
    const f = nice.Function(function qwedsd(){return 1;});
    expect(f()).to.equal(1);
    expect(nice.qwedsd()).to.equal(1);
  });


  it("overload", () => {
    const f = nice.Function()
      .string(s => s + s)
      .number(n => n * 2);
    expect(f('q')).to.equal('qq');
    expect(f(2)).to.equal(4);
  });


  it("first parameter's type method", () => {
    const qwe = nice.Type('Qwe456');
    nice.Function.Qwe456(function zzzz(){return 1;});
    const s = nice.Qwe456();
    expect(s.zzzz()).to.equal(1);
  });


  it("first parameter's type parent method", () => {
    nice.Function.AAA(function hhhh(){return 1;});
    const s = nice.BBB();
    expect(s.hhhh()).to.equal(1);
  });


  it("second parameter", () => {
    const f = nice.Function.string.object('qqqqqqq', () => 1);
    const f2 = nice.Function.string.array('qqqqqqq', () => 2);

    expect(f).to.equal(f2);
    expect(f('', {})).to.equal(1);
    expect(() => f('', 5)).to.throw();
    expect(f('', [])).to.equal(2);
    expect(() => f()).to.throw();

    expect(nice.qqqqqqq('', {})).to.equal(1);
    expect(nice.qqqqqqq('', [])).to.equal(2);
    expect(() => nice.qqqqqqq('', 1)).to.throw();
  });


  it("second parameter 2", () => {
    const f = nice.Function
      .String.object('qqqqzzz', () => 11)
      .String.array('qqqqzzz', () => 22);
    const s = nice.String();

    expect(f(s, {})).to.equal(11);
    expect(f('', {})).to.equal(11);
    expect(() => f(s, 5)).to.throw();
    expect(f(s, [])).to.equal(22);
    expect(() => f()).to.throw();

    expect(nice.qqqqzzz(s, {})).to.equal(11);
    expect(nice.qqqqzzz(s, [])).to.equal(22);
    expect(() => nice.qqqqzzz('', 1)).to.throw();

    expect(s.qqqqzzz({})).to.equal(11);
    expect(s.qqqqzzz([])).to.equal(22);
    expect(() => s.qqqqzzz(1)).to.throw();
  });


  it("throw for unknown signature", () => {
    nice.Function.Box(function ffff(){return 1;});
    expect(() => nice.ffff(nice.Function())).to.throw();
  });


  it("overload by item", () => {
    nice.Function.AAA(function ggg(){return 3;});
    nice.Function.BBB(function ggg(){return 1;});
    expect(nice.ggg(a())).to.equal(3);
    expect(nice.ggg(b())).to.equal(1);
  });


  it("skip", () => {
    const f = nice.Function((a, b) => a / b);
    expect(f(6, 2)).to.equal(3);
    expect(f(6, nice)(3)).to.equal(2);
    expect(f(nice, 6)(3)).to.equal(0.5);
    expect(f(nice, nice)(6, 3)).to.equal(2);
  });


  it("skip queue", () => {
    const f = nice.Function((a, b) => nice.Number(a / b));
    nice.Function.Number('qwe', (v, n) => nice.Number(v() + n));
    const f2 = f(10, nice);

    expect(f2.qwe(2)(5)()).to.equal(4);
    expect(f2.qwe(2).qwe(3)(5)()).to.equal(7);
    expect(f2.qwe(nice)(5, 2)()).to.equal(4);
    expect(f2.qwe(nice).qwe(3)(5, 2)()).to.equal(7);
  });


  it("ary", () => {
    const f = nice.Function((a = 1, b = 2, c = 3) => '' + a + b + c);

    expect(f.ary(0)(4, 4, 4)).to.equal('123');
    expect(f.ary(1)(4, 4, 4)).to.equal('423');
    expect(f.ary(2)(4, 4, 4)).to.equal('443');
    expect(f.ary(4)(4, 4, 4, 4)).to.equal('444');
  });


  it("curry", () => {
    const f = nice.curry((a, b, c) => {
      return a + b + c;
    });
    expect(f(1, 2, 3)).to.equal(6);
    expect(f(1, 2)(3)).to.equal(6);
    expect(f(1)(2, 3)).to.equal(6);
    expect(f(1)(2)(3)).to.equal(6);
  });


  it("global Action", done => {
    const f = nice.Action.Array(function qwedsd2(a){ a.push(1); });
    const a = nice.Array();
    expect(typeof a.qwedsd2).to.equal('function');
    expect(a.qwedsd2()).to.equal(a);
    expect(a()).to.deep.equal([1]);
    expect(() => nice.Function(function qwedsd2(){ })).to.throw();
    nice._on('Action', (_f) => {
      f === _f && done();
    });
  });


  it("Action", done => {
    const T = nice.Type('TTTT321').Action('brt53', a => a.set('qwe', 2))();
    const t = T();

    expect(typeof t.brt53).to.equal('function');
    expect(t.brt53()).to.equal(t);
    expect(t()).to.deep.equal({qwe:2});
    nice._on('Action', (_f) => {
      nice.brt53 === _f && done();
    });
  });
});