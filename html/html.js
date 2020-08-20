//TODO: throw error when adding object that is not Html
//TODO: BUG: Div(111).Css(':hover').backgroundColor('red').up.show() - not work
let autoId = 0;
const AUTO_PREFIX = '_nn_';

nice.Type('Html', (z, tag) => tag && z.tag(tag))
  .about('Represents HTML element.')
  .str('tag', 'div')
  .obj('eventHandlers')
  .obj('cssSelectors')
  .Action.about('Adds event handler to an element.')(function on(e, name, f){
    if(name === 'domNode' && nice.isEnvBrowser()){
      if(!e.id())
        throw `Give element an id to use domNode event.`;
      const el = document.getElementById(e.id());
      el && f(el);
    }
    const handlers = e.eventHandlers.get(name);
    handlers.isArr() ? handlers.push(f) : e.eventHandlers.set(name, [f]);
    return e;
  })
  .Action.about('Removes event handler from an element.')(function off(e, name, f){
    const handlers = e.eventHandlers.get(name);
    handlers && e.eventHandlers.removeValue(name, f);
    return e;
  })
  .obj('style')
  .obj('attributes')
  .arr('children')
  .Method('_autoId', z => {
    z.id() || z.id(AUTO_PREFIX + autoId++);
    return z.id();
  })
  .Method('_autoClass', z => {
    const s = z.attributes.get('className')() || '';
    if(s.indexOf(AUTO_PREFIX) < 0){
      const c = AUTO_PREFIX + autoId++;
      z.attributes.set('className', s + ' ' + c);
    }
    return z;
  })
  .Method.about('Adds values to className attribute.')('class', (z, ...vs) => {
    const current = z.attributes.get('className')() || '';
    if(!vs.length)
      return current;

    const a = current ? current.split(' ') : [];
    vs.forEach(v => !v || a.includes(v) || a.push(v));
    z.attributes.set('className', a.join(' '));
    return z;
  })
  .ReadOnly(text)
  .ReadOnly(html)
  .ReadOnly(dom)
  .Method.about('Scroll browser screen to an element.')(function scrollTo(z, offset = 10){
    z.on('domNode', n => {
      n && window.scrollTo(n.offsetLeft - offset, n.offsetTop - offset);
    });
    return z;
  })
  .Action.about('Focuses DOM element.')('focus', (z, preventScroll) =>
      z.on('domNode', node => node.focus(preventScroll)))
  .Action.about('Adds children to an element.')(function add(z, ...children) {
    children.forEach(c => {
      if(nice.isArray(c))
        return _each(c, _c => z.add(_c));

      if(nice.isArr(c))
        return c.each(_c => z.add(_c));

      if(c === undefined || c === null)
        return;

      if(typeof c === 'string' || nice.isStr(c))
        return z.children.push(c);

      if(nice.isNumber(c) || nice.isNum(c))
        return z.children.push(c);

      if(nice.isBox(c))
        return z.children.push(c);

      if(c === z)
        return z.children.push(`Errro: Can't add element to itself.`);

      if(c.isErr())
        return z.children.push(c.toString());

      if(!c || !nice.isAnything(c))
        return z.children.push('Bad child: ' + c);

      c.up = z;
      c._up_ = z;
      z.children.push(c);
    });
  });

const Html = nice.Html;

Test('Simple html element with string child', Html => {
  expect(Html().add('qwe').html).is('<div>qwe</div>');
});

Test("insert Html", (Html) => {
  const div = Html('li');
  const div2 = Html('b');
  div.add(div2);
  //TODO:
//  expect(div.html).is('<li><b>qwe</b></li>');
});

Test("Html tag name", (Html) => {
  expect(Html('li').html).is('<li></li>');
});

Test("Html class name", (Html) => {
  expect(Html().class('qwe').html).is('<div class="qwe"></div>');
});

Test("Html of single value", (Single) => {
  expect(Single(5).html).is('5');
});

Test("Html children array", (Div) => {
  expect(Div(['qwe', 'asd']).html).is('<div>qweasd</div>');
});

//TODO:0
Test("Html children Arr", (Div, Arr) => {
  expect(Div(Arr('qwe', 'asd')).html).is('<div>qweasd</div>');
});

Test("item child", function(Num, Html) {
  const n = Num(5);
  const n2 = Num(7);
  const div = Html().add(n, n2);
  expect(div.html).is('<div>57</div>');
  n2(8);
  //TODO:
//  expect(div.html).is('<ol>58</ol>');
});


nice.Type('Style')
  .about('Represents CSS style.');

const Style = nice.Style;

defGet(Html.proto, function hover(){
  const style = Style();
  this._autoClass();
  this.cssSelectors.set(':hover', style);
  return style;
});


def(Html.proto, 'Css', function(s = ''){
  s = s.toLowerCase();
//  const existing = this.cssSelectors.get(s);
  if(this.cssSelectors.has(s))
    return this.cssSelectors.get(s);
  this._autoClass();
  const style = Style();
  style.up = this;
  this.cssSelectors.set(s, style);
  return style;
});


function addCreator(type){
  def(Html.proto, type.name, function (...a){
    const res = type(...a);
    this.add(res);
    return res;
  });
  const _t = nice._decapitalize(type.name);
  _t in Html.proto || def(Html.proto, _t, function (...a){
    return this.add(type(...a));
  });
}

reflect.on('extension', ({child, parent}) => {
  if(parent === Html || Html.isPrototypeOf(parent)){
    addCreator(child);
  }
});


'clear,alignContent,alignItems,alignSelf,alignmentBaseline,all,animation,animationDelay,animationDirection,animationDuration,animationFillMode,animationIterationCount,animationName,animationPlayState,animationTimingFunction,backfaceVisibility,background,backgroundAttachment,backgroundBlendMode,backgroundClip,backgroundColor,backgroundImage,backgroundOrigin,backgroundPosition,backgroundPositionX,backgroundPositionY,backgroundRepeat,backgroundRepeatX,backgroundRepeatY,backgroundSize,baselineShift,border,borderBottom,borderBottomColor,borderBottomLeftRadius,borderBottomRightRadius,borderBottomStyle,borderBottomWidth,borderCollapse,borderColor,borderImage,borderImageOutset,borderImageRepeat,borderImageSlice,borderImageSource,borderImageWidth,borderLeft,borderLeftColor,borderLeftStyle,borderLeftWidth,borderRadius,borderRight,borderRightColor,borderRightStyle,borderRightWidth,borderSpacing,borderStyle,borderTop,borderTopColor,borderTopLeftRadius,borderTopRightRadius,borderTopStyle,borderTopWidth,borderWidth,bottom,boxShadow,boxSizing,breakAfter,breakBefore,breakInside,bufferedRendering,captionSide,clip,clipPath,clipRule,color,colorInterpolation,colorInterpolationFilters,colorRendering,columnCount,columnFill,columnGap,columnRule,columnRuleColor,columnRuleStyle,columnRuleWidth,columnSpan,columnWidth,columns,content,counterIncrement,counterReset,cursor,cx,cy,direction,display,dominantBaseline,emptyCells,fill,fillOpacity,fillRule,filter,flex,flexBasis,flexDirection,flexFlow,flexGrow,flexShrink,flexWrap,float,floodColor,floodOpacity,font,fontFamily,fontFeatureSettings,fontKerning,fontSize,fontStretch,fontStyle,fontVariant,fontVariantLigatures,fontWeight,height,imageRendering,isolation,justifyItems,justifyContent,left,letterSpacing,lightingColor,lineHeight,listStyle,listStyleImage,listStylePosition,listStyleType,margin,marginBottom,marginLeft,marginRight,marginTop,marker,markerEnd,markerMid,markerStart,mask,maskType,maxHeight,maxWidth,maxZoom,minHeight,minWidth,minZoom,mixBlendMode,motion,motionOffset,motionPath,motionRotation,objectFit,objectPosition,opacity,order,orientation,orphans,outline,outlineColor,outlineOffset,outlineStyle,outlineWidth,overflow,overflowWrap,overflowX,overflowY,padding,paddingBottom,paddingLeft,paddingRight,paddingTop,page,pageBreakAfter,pageBreakBefore,pageBreakInside,paintOrder,perspective,perspectiveOrigin,pointerEvents,position,quotes,r,resize,right,rx,ry,shapeImageThreshold,shapeMargin,shapeOutside,shapeRendering,speak,stopColor,stopOpacity,stroke,strokeDasharray,strokeDashoffset,strokeLinecap,strokeLinejoin,strokeMiterlimit,strokeOpacity,strokeWidth,tabSize,tableLayout,textAlign,textAlignLast,textAnchor,textCombineUpright,textDecoration,textIndent,textOrientation,textOverflow,textRendering,textShadow,textTransform,top,touchAction,transform,transformOrigin,transformStyle,transition,transitionDelay,transitionDuration,transitionProperty,transitionTimingFunction,unicodeBidi,unicodeRange,userZoom,vectorEffect,verticalAlign,visibility,whiteSpace,widows,width,willChange,wordBreak,wordSpacing,wordWrap,writingMode,x,y,zIndex,zoom'
  .split(',').forEach( property => {
    def(Html.proto, property, function(...a) {
      const s = this.style;
      if(!a[0])
        return s[property]();
      nice.Switch(a[0])
//        .isBox().use(b => s.set(property, b))
        .isObject().use(o => _each(o, (v, k) => s.set(property + nice.capitalize(k), v)))
        .default.use((...a) => s.set(property, a.length > 1 ? nice.format(...a) : a[0]))
      return this;
    });
    def(Style.proto, property, function(...a) {
      nice.isObject(a[0])
        ? _each(a[0], (v, k) => this.set(property + nice.capitalize(k), v))
        : this.set(property, a.length > 1 ? nice.format(...a) : a[0]);
      return this;
    });
  });


//'span' removed to avoid conflict with creating 'span' child
'checked,accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,cite,code,codebase,cols,colspan,contentEditable,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,wrap'
  .split(',').forEach( property => {
    const f = function(...a){
      if(a.length){
        this.attributes.set(property, a.length > 1 ? nice.format(...a) : a[0]);
        return this;
      } else {
        return this.attributes.get(property);
      }
    };
    def(Html.proto, property, f);
    def(Html.proto, property.toLowerCase(), f);
  });


function text(z){
  return z.children
      .map(v => v.text
        ? v.text
        : nice.htmlEscape(nice.isFunction(v) ? v() : v))
      .jsValue.join('');
};


function compileStyle (s){
  let a = [];
  s.each((v, k) =>
    a.push(k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + v));
  return a.join(';');
};

function compileSelectors (h){
  const a = [];
  h.cssSelectors.each((v, k) => a.push('.', getAutoClass(h.attributes.get('className')),
    ' ', k, '{', compileStyle(v), '}'));
  return a.length ? '<style>' + a.join('') + '</style>' : '';
};

const _html = v => v._isAnything ? v.html : nice.htmlEscape(v);
//nice.ReadOnly.Box('html', ({_value}) => _value && _html(_value));
nice.ReadOnly.Single('html', z => _html(z._value));
nice.ReadOnly.Arr('html', z => z.reduceTo([], (a, v) => a.push(_html(v)))
    .map(_html).join(''));

function html(z){
  const tag = z.tag();
  const selectors = compileSelectors(z) || '';
  let as = '';
  let style = compileStyle(z.style);
  style && (as = ' style="' + style + '"');

  z.attributes.each((v, k) => {
    k === 'className' && (k = 'class', v().trim());
    as += ` ${k}="${v}"`;
  });

  let body = '';
  z.children.each(c => body += c._isAnything ? c.html : nice.htmlEscape(c));

  return `${selectors}<${tag}${as}>${body}</${tag}>`;
};

function toDom(e) {
  if(nice.isBox(e))
    return document.createTextNode(nice.htmlEscape(e() || '-'));
  return e._isAnything
    ? e.dom
    : document.createTextNode(nice.htmlEscape(e));
 };


function dom(e){
  const res = document.createElement(e.tag());
//  const selectors = compileSelectors(e) || '';

  e.style.each((v, k) => {
    res.style[k] = '' + v;
  });

  e.attributes.each((v, k) => {
//    k === 'className' && (k = 'class', v().trim());
    res[k] = v;
  });

//  e.children.each(c => res.appendChild(toDom(c)));
  e.children.each(c => attachNode(c, res));// res.appendChild(toDom(c)));

  return res;
//  return `${selectors}<${tag}${as}>${body}</${tag}>`;
}

const childrenCounter = (o, v) => {
  o[v] ? o[v]++ : (o[v] = 1);
  return o;
};


function attachNode(child, parent, position){

  if(nice.isBox(child)){
    //TODO: RBox cold compute
//    let state = child();
    let state = '-';
    let dom = toDom(state);
    insertAt(parent, dom, position);
    dom.niceListener = s => {
      dom = nice.refreshElement(s, state, dom);
      state = s;
    };
    child.subscribe(dom.niceListener);
  } else {
    insertAt(parent, toDom(child), position);
  }
}


function detachNode(child, dom, parent){
  if(nice.isBox(child)){
    const f = dom.niceListener;
    f && child.unSubscribe(f);
  }

  if(!parent)
    parent = dom.parentNode;

  parent && parent.removeChild(dom);
}


function switchNode(element, ) {
  domNode.parentNode.replaceChild(newDom, domNode);

}

const extractKey = v => {
  if(v._isAnything)
    v = v.jsValue;

  if(typeof v === 'object')
    return v.id || v.attributes?.id || v.key;

  return v;
};


//TODO: when remove node unsubscribe all children
defAll(nice, {
  refreshElement(e, old, domNode){
    const eTag = nice.isHtml(e) && e.tag(), oldTag = nice.isHtml(old) && old.tag();
    let newDom = domNode;

    if (eTag !== oldTag){
      newDom = toDom(e);
      domNode.parentNode.replaceChild(newDom, domNode);
    } else if(!eTag) {
      domNode.nodeValue = nice.htmlEscape(e);
    } else {
      //TODO: selectors
      //TODO: tag
      const newStyle = e.style.jsValue, oldStyle = old.style.jsValue;
      _each(oldStyle, (v, k) => (k in newStyle) || (domNode.style[k] = ''));
      _each(newStyle, (v, k) => oldStyle[k] !== v && (domNode.style[k] = v));

      const newAtrs = e.attributes.jsValue, oldAtrs = old.attributes.jsValue;
      _each(oldAtrs, (v, k) => (k in newAtrs) || domNode.removeAttribute(k));
      _each(newAtrs, (v, k) => oldAtrs[k] !== v && domNode.setAttribute(k, v));

      nice.refreshChildren(e.children._value, old.children._value, domNode);
    }
    return newDom;
  },
  refreshChildren(aChildren, bChildren, domNode){
    const aKeys = aChildren.map(extractKey);
    const bKeys = bChildren.map(extractKey);
    const aCount = aKeys.reduce(childrenCounter, {});
    const bCount = bKeys.reduce(childrenCounter, {});

    let ai = 0, bi = 0;
    while(ai < aKeys.length){
      const aChild = aKeys[ai], bChild = bKeys[bi];
      //TODO: try to compare by value if both new
      if(aChild === bChild && aChild !== undefined){
        ai++, bi++;
      } else if(!bCount[aChild]){//assume insert
//        insertAt(domNode, toDom(aChildren[ai]), ai);
        attachNode(aChildren[ai], domNode, ai);
        ai++;
      } else if(!aCount[bChild]) {//assume delete
        detachNode(bChildren[ai], domNode.childNodes[ai], domNode);
        bi++;
      } else {//assume ugly reorder - brute force
        //TODO:0 attach|dettach node
//        console.log('ugly');
        const old = domNode.childNodes[bi];
        attachNode(aChildren[ai], domNode, bi);
        detachNode(bChildren[bi], old, domNode);

        ai++, bi++;
      }
    };
    while(bi < bKeys.length){
      detachNode(bChildren[bi], domNode.childNodes[ai], domNode);
      bi++;
    }
  },
  htmlEscape: s => (''+s).replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
});


const getAutoClass = s => s.match(/(_nn_\d+)/)[0];


if(nice.isEnvBrowser()){
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  const styleSheet = styleEl.sheet;

  function insertBefore(node, newNode){
    node.parentNode.insertBefore(newNode, node);
    return newNode;
  }


  function insertAfter(node, newNode){
    node.parentNode.insertBefore(newNode, node.nextSibling);
    return newNode;
  }


  Func.primitive('show', (v, parentNode = document.body, position) => {
    const node = document.createTextNode(v);
    return insertAt(parentNode, node, position);
  });

}

function insertAt(parent, node, position){
  typeof position === 'number'
    ? parent.insertBefore(node, parent.childNodes[position])
    : parent.appendChild(node);
  return node;
}


def(nice, 'iterateNodesTree', (f, node = document.body) => {
  f(node);
  if(node.childNodes)
    for (let n of node.childNodes) {
      nice.iterateNodesTree(f, n);
    };
});
