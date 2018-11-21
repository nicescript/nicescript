const nice = require('../index.js')();
const { Html, B, Div, Span, I, Box, Arr, Obj } = nice;
const chai = require('chai');
const expect = chai.expect;

describe("Html", function() {

  it("html", function() {
    expect(Html().add('qwe').html).to.equal('<div>qwe</div>');
  });


//  it("async html", function(done) {
//    const b = Box().async(z => setTimeout(z('zxc'), 1));
//    const tag = Div('qwe', b);
//    nice.resolveChildren(tag, t => {
//      expect(t.html).to.equal('<div>qwezxc</div>');
//      done();
//    });
//  });


  it("sync Html", function() {
    const div = Html('li').add('qwe');
    expect(div.html).to.equal('<li>qwe</li>');
  });


  it("class", function() {
    const div = Html('li').class('qwe');
    expect(div.html).to.equal('<li class="qwe"></li>');
  });


  it("children array", function() {
    const div = Div(['qwe', 'asd']);
    expect(div.html).to.equal('<div>qweasd</div>');

    const div2 = Div(nice('qwe', 'asd'));
    expect(div2.html).to.equal('<div>qweasd</div>');
  });


  it("item child", function() {
    const n = nice.Num(5);
    const n2 = nice.Num(7);
    const div = Html('ol').add(n, n2);
    expect(div.html).to.equal('<ol>57</ol>');
  });


  it("insert Html", function() {
    const div = Html('li');
    const div2 = B('qwe');
    div.add(div2);
    expect(div.html).to.equal('<li><b>qwe</b></li>');
  });

  it("insert Html mapChildren", function() {
    const li = Html('li');
    const a = Obj({'qwe':1, 'asd':2});
    li.mapChildren(a, (v, k) => k + v);
    expect(li.html).to.equal('<li>qwe1asd2</li>');
  });


  it("insert simple Html", function() {
    expect(Html('li').span('asd').b('qwe').html)
        .to.equal('<li><span>asd</span><b>qwe</b></li>');
  });


  it("insert in one line", function() {
    const div = Html('li').add('asd').B('qwe').up;
    expect(div.html).to.equal('<li>asd<b>qwe</b></li>');
  });


  it("style", function() {
    const div = Html().margin('6px').borderColor('#DEF');
    expect(div.html).to.equal('<div style="margin:6px;border-color:#DEF"></div>');
   });


  it("style object", function() {
    const div = nice.Html().border({Width: '1px', color:'red'});
    expect(div.html).to.equal('<div style="border-width:1px;border-color:red"></div>');
  });


  it("text", function() {
    const div = Html().add('asd')
     .B(' zxc2').up;

    expect(div.text).to.equal('asd zxc2');
  });


  it("extend", function() {
    Html.extend('User').by((z, name) => z.add('User: ', name));

    expect(B().User('Jon').up.html).to.equal('<b><div>User: Jon</div></b>');
  });


  it("css", function() {
    const b = B('qwe').Css('A').color('red').up;
    const id = b.attributes.get('className').trim();
    expect(b.html)
        .to.equal(`<style>.${id} a{color:red}</style><b class="${id}">qwe</b>`);
  });
});