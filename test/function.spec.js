const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("Func", function() {
  const a = nice.Type('AAA')();
  const b = nice.Type('BBB').extends('AAA')();

  it("type", () => {
    const f = nice.Func(() => 2);
    expect(nice.isSomething(f)).to.equal(true);
    expect(nice.isValue(f)).to.equal(false);
  });

  it("simple", () => {
    const f = nice.Func(() => 2);

    const res = f();
    expect(res).to.equal(2);
  });


  it("jsType", () => {
    let f = nice.Func.String(function oijoih(){return 1;});
    nice.Func.Array(function oijoih(){return 2;});
    expect(f('')).to.equal(1);
    expect(nice.oijoih('')).to.equal(1);
    expect(nice.oijoih([])).to.equal(2);
    expect(() => f({})).to.throw();
    expect(() => nice.oijoih({})).to.throw();
  });


  it("deafault", () => {
    const f = nice.Func(function qwedsd(){return 1;});
    expect(f()).to.equal(1);
    expect(nice.qwedsd()).to.equal(1);
  });


  it("overload", () => {
    const f = nice.Func()
      .String(s => s + s)
      .Number(n => n * 2);
    expect(f('q')).to.equal('qq');
    expect(f(2)).to.equal(4);
  });

  it("overload", () => {
    const f = nice.Func()
      .Array(s => s + s)
      .Arr(n => n * 2);
  });


  it("combinations js", () => {
    const f = nice.Func.Str.Number((s, n) => s._type.name + s() + typeof n + n);
    expect(f('q', 1)).to.equal('Strqnumber1');
    expect(f(nice('q'), 1)).to.equal('Strqnumber1');
    expect(f('q', nice(1))).to.equal('Strqnumber1');
    expect(f(nice('q'), nice(1))).to.equal('Strqnumber1');
  });


  it("uniq restrain", () => {
    nice.Type('Qwe45633');
    nice.Func.Qwe45633(function zzzz(){return 1;});
    expect(() => nice.Func.Qwe45633(function zzzz(){return 2;})).to.throw();
  });


  it("first parameter's type method", () => {
    const qwe = nice.Type('Qwe456');
    nice.Func.Qwe456(function zzzz(){return 1;});
    const s = nice.Qwe456();
    expect(s.zzzz()).to.equal(1);
  });


  it("first parameter's type parent method", () => {
    nice.Func.AAA(function hhhh(){return 1;});
    const s = nice.BBB();
    expect(s.hhhh()).to.equal(1);
  });


  it("second parameter", () => {
    const f = nice.Func.String.Object('qqqqqqq', () => 1);
    const f2 = nice.Func.String.Array('qqqqqqq', () => 2);

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
    const f = nice.Func
      .Str.Object('qqqqzzz', () => 11)
      .Str.Array('qqqqzzz', () => 22);
    const s = nice.Str();

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
    nice.Func.Box(function ffff(){return 1;});
    expect(() => nice.ffff(nice.Func())).to.throw();
  });


  it("overload by item", () => {
    nice.Func.AAA(function ggg(){return 3;});
    nice.Func.BBB(function ggg(){return 1;});
    expect(nice.ggg(a())).to.equal(3);
    expect(nice.ggg(b())).to.equal(1);
  });


  it("skip arguments", () => {
    const { $1, $2, $3 } = nice;
    expect(nice.is($2, 'q')(1, 'q')).to.equal(true);
    expect(nice.difference(nice.$2, nice.$1).product(nice.$2)(5, 7)).to.equal(14);
  });


  it("ary", () => {
    const f = nice.Func((a = 1, b = 2, c = 3) => '' + a + b + c);

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
    const f = nice.Action.Arr(function qwedsd2(a){ a.push(1); });
    const a = nice.Arr();
    expect(typeof a.qwedsd2).to.equal('function');
    expect(a.qwedsd2()).to.equal(a);
    expect(a.jsValue).to.deep.equal([1]);
    expect(() => nice.Func(function qwedsd2(){ })).to.throw();
    nice.reflect.on('Action', (_f) => {
      f === _f && done();
    });
  });


  it("Action", done => {
    const T = nice.Type('TTTT321').Action('brt53', a => a.set('qwe', 2))();
    const t = T();

    expect(typeof t.brt53).to.equal('function');
    expect(t.brt53()).to.equal(t);
    expect(t().qwe).to.equal(2);
    nice.reflect.on('Action', (_f) => {
      nice.brt53 === _f && done();
    });
  });
});