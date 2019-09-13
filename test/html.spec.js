const nice = require('../index.js')();
const { Html, B, Div, Span, I, Arr, Obj } = nice;
const chai = require('chai');
const expect = chai.expect;

describe("Html", function() {
  it("mapChildren", function() {
    const a = Obj({'qwe':1, 'asd':2});
    expect(Div(a, (v, k) => k + v).html).to.equal('<div>qwe1asd2</div>');
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