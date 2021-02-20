//TODO: throw error when adding object that is not Html
//TODO: BUG: Div(111).Css(':hover').backgroundColor('red').up.show() - not work


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
    const handlers = e.eventHandlers._value;
    handlers[name] ? handlers[name].push(f) : e.eventHandlers.set(name, [f]);
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
    z.id() || z.id(nice.autoId());
    return z.id();
  })
  .Method('_autoClass', z => {
    const s = '' + z.attributes.get('className') || '';
    if(s.indexOf(nice.AUTO_PREFIX) < 0){
      const c = nice.autoId();
      z.attributes.set('className', s + ' ' + c);
    }
    return z;
  })
  .Method.about('Adds values to className attribute.')('class', (z, ...vs) => {
    const current = z.attributes.get('className') || '';
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
      if(c === undefined || c === null)
        return;

      if(typeof c === 'string' || c._isStr)
        return z.children.push(c);

      if(Array.isArray(c))
        return c.forEach(_c => z.add(_c));

      if(c._isArr)
        return c.each(_c => z.add(_c));

      if(c._isNum || typeof c === 'number')
        return z.children.push(c);

      if(c._isBox)
        return z.children.push(c);

      if(c === z)
        return z.children.push(`Errro: Can't add element to itself.`);

      if(c._isErr)
        return z.children.push(c.toString());

      if(!c || !nice.isAnything(c))
        return z.children.push('Bad child: ' + c);

      c.up = z;
      c._up_ = z;
      z.children.push(c);
    });
  });

nice.ReadOnly.Anything('dom', z => document.createTextNode("" + z._value));


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

//removed: src removed to avoid conflict with 'src' attribute
'alignContent,alignItems,alignSelf,alignmentBaseline,all,animation,animationDelay,animationDirection,animationDuration,animationFillMode,animationIterationCount,animationName,animationPlayState,animationTimingFunction,appearance,backdropFilter,backfaceVisibility,background,backgroundAttachment,backgroundBlendMode,backgroundClip,backgroundColor,backgroundImage,backgroundOrigin,backgroundPosition,backgroundPositionX,backgroundPositionY,backgroundRepeat,backgroundRepeatX,backgroundRepeatY,backgroundSize,baselineShift,blockSize,border,borderBlockEnd,borderBlockEndColor,borderBlockEndStyle,borderBlockEndWidth,borderBlockStart,borderBlockStartColor,borderBlockStartStyle,borderBlockStartWidth,borderBottom,borderBottomColor,borderBottomLeftRadius,borderBottomRightRadius,borderBottomStyle,borderBottomWidth,borderCollapse,borderColor,borderImage,borderImageOutset,borderImageRepeat,borderImageSlice,borderImageSource,borderImageWidth,borderInlineEnd,borderInlineEndColor,borderInlineEndStyle,borderInlineEndWidth,borderInlineStart,borderInlineStartColor,borderInlineStartStyle,borderInlineStartWidth,borderLeft,borderLeftColor,borderLeftStyle,borderLeftWidth,borderRadius,borderRight,borderRightColor,borderRightStyle,borderRightWidth,borderSpacing,borderStyle,borderTop,borderTopColor,borderTopLeftRadius,borderTopRightRadius,borderTopStyle,borderTopWidth,borderWidth,bottom,boxShadow,boxSizing,breakAfter,breakBefore,breakInside,bufferedRendering,captionSide,caretColor,clear,clip,clipPath,clipRule,color,colorInterpolation,colorInterpolationFilters,colorRendering,colorScheme,columnCount,columnFill,columnGap,columnRule,columnRuleColor,columnRuleStyle,columnRuleWidth,columnSpan,columnWidth,columns,contain,containIntrinsicSize,content,counterIncrement,counterReset,cursor,cx,cy,d,direction,display,dominantBaseline,emptyCells,fill,fillOpacity,fillRule,filter,flex,flexBasis,flexDirection,flexFlow,flexGrow,flexShrink,flexWrap,float,floodColor,floodOpacity,font,fontDisplay,fontFamily,fontFeatureSettings,fontKerning,fontOpticalSizing,fontSize,fontStretch,fontStyle,fontVariant,fontVariantCaps,fontVariantEastAsian,fontVariantLigatures,fontVariantNumeric,fontVariationSettings,fontWeight,gap,grid,gridArea,gridAutoColumns,gridAutoFlow,gridAutoRows,gridColumn,gridColumnEnd,gridColumnGap,gridColumnStart,gridGap,gridRow,gridRowEnd,gridRowGap,gridRowStart,gridTemplate,gridTemplateAreas,gridTemplateColumns,gridTemplateRows,height,hyphens,imageOrientation,imageRendering,inlineSize,isolation,justifyContent,justifyItems,justifySelf,left,letterSpacing,lightingColor,lineBreak,lineHeight,listStyle,listStyleImage,listStylePosition,listStyleType,margin,marginBlockEnd,marginBlockStart,marginBottom,marginInlineEnd,marginInlineStart,marginLeft,marginRight,marginTop,marker,markerEnd,markerMid,markerStart,mask,maskType,maxBlockSize,maxHeight,maxInlineSize,maxWidth,maxZoom,minBlockSize,minHeight,minInlineSize,minWidth,minZoom,mixBlendMode,objectFit,objectPosition,offset,offsetDistance,offsetPath,offsetRotate,opacity,order,orientation,orphans,outline,outlineColor,outlineOffset,outlineStyle,outlineWidth,overflow,overflowAnchor,overflowWrap,overflowX,overflowY,overscrollBehavior,overscrollBehaviorBlock,overscrollBehaviorInline,overscrollBehaviorX,overscrollBehaviorY,padding,paddingBlockEnd,paddingBlockStart,paddingBottom,paddingInlineEnd,paddingInlineStart,paddingLeft,paddingRight,paddingTop,pageBreakAfter,pageBreakBefore,pageBreakInside,paintOrder,perspective,perspectiveOrigin,placeContent,placeItems,placeSelf,pointerEvents,position,quotes,r,resize,right,rowGap,rubyPosition,rx,ry,scrollBehavior,scrollMargin,scrollMarginBlock,scrollMarginBlockEnd,scrollMarginBlockStart,scrollMarginBottom,scrollMarginInline,scrollMarginInlineEnd,scrollMarginInlineStart,scrollMarginLeft,scrollMarginRight,scrollMarginTop,scrollPadding,scrollPaddingBlock,scrollPaddingBlockEnd,scrollPaddingBlockStart,scrollPaddingBottom,scrollPaddingInline,scrollPaddingInlineEnd,scrollPaddingInlineStart,scrollPaddingLeft,scrollPaddingRight,scrollPaddingTop,scrollSnapAlign,scrollSnapStop,scrollSnapType,shapeImageThreshold,shapeMargin,shapeOutside,shapeRendering,size,speak,stopColor,stopOpacity,stroke,strokeDasharray,strokeDashoffset,strokeLinecap,strokeLinejoin,strokeMiterlimit,strokeOpacity,strokeWidth,tabSize,tableLayout,textAlign,textAlignLast,textAnchor,textCombineUpright,textDecoration,textDecorationColor,textDecorationLine,textDecorationSkipInk,textDecorationStyle,textIndent,textOrientation,textOverflow,textRendering,textShadow,textSizeAdjust,textTransform,textUnderlinePosition,top,touchAction,transform,transformBox,transformOrigin,transformStyle,transition,transitionDelay,transitionDuration,transitionProperty,transitionTimingFunction,unicodeBidi,unicodeRange,userSelect,userZoom,vectorEffect,verticalAlign,visibility,webkitAlignContent,webkitAlignItems,webkitAlignSelf,webkitAnimation,webkitAnimationDelay,webkitAnimationDirection,webkitAnimationDuration,webkitAnimationFillMode,webkitAnimationIterationCount,webkitAnimationName,webkitAnimationPlayState,webkitAnimationTimingFunction,webkitAppRegion,webkitAppearance,webkitBackfaceVisibility,webkitBackgroundClip,webkitBackgroundOrigin,webkitBackgroundSize,webkitBorderAfter,webkitBorderAfterColor,webkitBorderAfterStyle,webkitBorderAfterWidth,webkitBorderBefore,webkitBorderBeforeColor,webkitBorderBeforeStyle,webkitBorderBeforeWidth,webkitBorderBottomLeftRadius,webkitBorderBottomRightRadius,webkitBorderEnd,webkitBorderEndColor,webkitBorderEndStyle,webkitBorderEndWidth,webkitBorderHorizontalSpacing,webkitBorderImage,webkitBorderRadius,webkitBorderStart,webkitBorderStartColor,webkitBorderStartStyle,webkitBorderStartWidth,webkitBorderTopLeftRadius,webkitBorderTopRightRadius,webkitBorderVerticalSpacing,webkitBoxAlign,webkitBoxDecorationBreak,webkitBoxDirection,webkitBoxFlex,webkitBoxOrdinalGroup,webkitBoxOrient,webkitBoxPack,webkitBoxReflect,webkitBoxShadow,webkitBoxSizing,webkitClipPath,webkitColumnBreakAfter,webkitColumnBreakBefore,webkitColumnBreakInside,webkitColumnCount,webkitColumnGap,webkitColumnRule,webkitColumnRuleColor,webkitColumnRuleStyle,webkitColumnRuleWidth,webkitColumnSpan,webkitColumnWidth,webkitColumns,webkitFilter,webkitFlex,webkitFlexBasis,webkitFlexDirection,webkitFlexFlow,webkitFlexGrow,webkitFlexShrink,webkitFlexWrap,webkitFontFeatureSettings,webkitFontSizeDelta,webkitFontSmoothing,webkitHighlight,webkitHyphenateCharacter,webkitJustifyContent,webkitLineBreak,webkitLineClamp,webkitLocale,webkitLogicalHeight,webkitLogicalWidth,webkitMarginAfter,webkitMarginBefore,webkitMarginEnd,webkitMarginStart,webkitMask,webkitMaskBoxImage,webkitMaskBoxImageOutset,webkitMaskBoxImageRepeat,webkitMaskBoxImageSlice,webkitMaskBoxImageSource,webkitMaskBoxImageWidth,webkitMaskClip,webkitMaskComposite,webkitMaskImage,webkitMaskOrigin,webkitMaskPosition,webkitMaskPositionX,webkitMaskPositionY,webkitMaskRepeat,webkitMaskRepeatX,webkitMaskRepeatY,webkitMaskSize,webkitMaxLogicalHeight,webkitMaxLogicalWidth,webkitMinLogicalHeight,webkitMinLogicalWidth,webkitOpacity,webkitOrder,webkitPaddingAfter,webkitPaddingBefore,webkitPaddingEnd,webkitPaddingStart,webkitPerspective,webkitPerspectiveOrigin,webkitPerspectiveOriginX,webkitPerspectiveOriginY,webkitPrintColorAdjust,webkitRtlOrdering,webkitRubyPosition,webkitShapeImageThreshold,webkitShapeMargin,webkitShapeOutside,webkitTapHighlightColor,webkitTextCombine,webkitTextDecorationsInEffect,webkitTextEmphasis,webkitTextEmphasisColor,webkitTextEmphasisPosition,webkitTextEmphasisStyle,webkitTextFillColor,webkitTextOrientation,webkitTextSecurity,webkitTextSizeAdjust,webkitTextStroke,webkitTextStrokeColor,webkitTextStrokeWidth,webkitTransform,webkitTransformOrigin,webkitTransformOriginX,webkitTransformOriginY,webkitTransformOriginZ,webkitTransformStyle,webkitTransition,webkitTransitionDelay,webkitTransitionDuration,webkitTransitionProperty,webkitTransitionTimingFunction,webkitUserDrag,webkitUserModify,webkitUserSelect,webkitWritingMode,whiteSpace,widows,width,willChange,wordBreak,wordSpacing,wordWrap,writingMode,x,y,zIndex,zoom'
  .split(',').forEach( property => {
    def(Html.proto, property, function(...a) {
      const s = this.style;
      if(a.length === 0)
        return s[property]();
      nice.Switch(a[0])
        .isObject().use(o => _each(o, (v, k) => s.set(property + nice.capitalize(k), v)))
        .default.use(() => s.set(property, a.length > 1 ? nice.format(...a) : a[0]))
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

Test('Css propperty format', Div => {
  expect(Div().border('3px', 'silver', 'solid').html)
    .is('<div style="border:3px silver solid"></div>');
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
    k === 'className' && (k = 'class', v.trim());
    as += ` ${k}="${v}"`;
  });

  let body = '';
  z.children.each(c => body += c._isAnything ? c.html : nice.htmlEscape(c));

  return `${selectors}<${tag}${as}>${body}</${tag}>`;
};

function toDom(e) {
  if(e === undefined)
    return document.createTextNode('');
  if(e && e._isBox)
    return document.createTextNode(e() || '-');
  return e._isAnything
    ? e.dom
    : document.createTextNode(e);
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

  e.eventHandlers.each((ls, type) => {
    if(type === 'domNode')
      return ls.forEach(f => f(res));
    ls.forEach(f => res.addEventListener(type, f, true));

//TODO:
//            node.__niceListeners = node.__niceListeners || {};
//            node.__niceListeners[k] = node.__niceListeners[k] || [];
//            node.__niceListeners[k].push(f);
  });

  return res;
//  return `${selectors}<${tag}${as}>${body}</${tag}>`;
}

const childrenCounter = (o, v) => {
  v && (o[v] ? o[v]++ : (o[v] = 1));
  return o;
};


function attachNode(child, parent, position){

  if(child && child._isBox){
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
  if(child && child._isBox){
    const f = dom.niceListener;
    f && child.unsubscribe(f);
  }

  if(!parent)
    parent = dom.parentNode;

  parent && parent.removeChild(dom);
}


const extractKey = v => {
  let res;

  if(v._isBox){
    return v.assertId();
  }

  if(v._isAnything){
    v = v.jsValue;
  }

  if(typeof v === 'object')
    res = v.id || v.attributes?.id || v.key;
  else
    res = v;

  return res;
};


//TODO: when remove node unsubscribe all children
defAll(nice, {
  refreshElement(e, old, domNode){
    const eTag = e && e._isHtml && e.tag(),
          oldTag = old && old._isHtml && old.tag();
    let newDom = domNode;

    if (eTag !== oldTag){
      newDom = toDom(e);
      if('niceListener' in domNode)
        newDom.niceListener = domNode.niceListener;
      domNode.parentNode.replaceChild(newDom, domNode);
    } else if(!eTag) {
      domNode.nodeValue = e;
    } else {
      //TODO: selectors
      const newStyle = e.style.jsValue, oldStyle = old.style.jsValue;
      _each(oldStyle, (v, k) => (k in newStyle) || (domNode.style[k] = ''));
      _each(newStyle, (v, k) => oldStyle[k] !== v && (domNode.style[k] = v));

      const newAtrs = e.attributes.jsValue, oldAtrs = old.attributes.jsValue;
      _each(oldAtrs, (v, k) => (k in newAtrs) || domNode.removeAttribute(k));
      _each(newAtrs, (v, k) => oldAtrs[k] !== v && domNode.setAttribute(k, v));

      const newHandlers = e.eventHandlers(), oldHandlers = old.eventHandlers();
      nice._eachEach(oldHandlers, (f, i, type) => {
        if(!(newHandlers[type] && newHandlers[type].includes(f)))
          domNode.removeEventListener(type, f, true);
      });
      nice._eachEach(newHandlers, (f, i, type) => {
        if(!(oldHandlers[type] && oldHandlers[type].includes(f)))
          domNode.addEventListener(type, f, true);
      });

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
        old && detachNode(bChildren[bi], old, domNode);

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

  Func.Html('show', (div, parentNode = document.body, position) => {
    return insertAt(parentNode, div.dom, position);
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
