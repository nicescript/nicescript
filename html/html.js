//TODO: separate attributes and tagValues

const runtime = {};

nice.Type('Html', (z, tag) => tag && z.tag(tag))
  .about('Represents HTML element.')
  .string('tag', 'div')
  .boolean('forceRepaint', false)
  .object('eventHandlers')
  .object('cssSelectors')
  .Action.about('Adds event handler to an element.')(function on(e, name, f){
    if(name === 'domNode' && IS_BROWSER){
      if(!e.id())
        throw `Give element an id to use domNode event.`;
      const el = document.getElementById(e.id());
      el && f(el);
    }
    const hs = e.eventHandlers();
    hs[name] ? hs[name].push(f) : e.eventHandlers(name, [f]);
    return e;
  })
  .Action.about('Removes event handler from an element.')(function off(e, name, f){
    const handlers = e.eventHandlers(name);
    handlers && nice.removeValue(handlers, f);
    return e;
  })
  .object('style')
  .object('attributes')
  .object('properties')
  .Method('assertId', z => {
    z.id() || z.id(nice.genereteAutoId());
    return z.id();
  })
  .Method.about('Adds values to className attribute.')('class', (z, ...vs) => {
    const current = z.attributes('className') || '';
    if(!vs.length)
      return current;

    const a = current ? current.split(' ') : [];
    vs.forEach(v => !v || a.includes(v) || a.push(v));
    z.attributes('className', a.join(' '));
    return z;
  })
  .ReadOnly(text)
  .ReadOnly(html)
  .ReadOnly('dom', createDom)
  .Method.about('Scroll browser screen to an element.')(function scrollTo(z, offset = 10){
    z.on('domNode', n => {
      n && window.scrollTo(n.offsetLeft - offset, n.offsetTop - offset);
    });
    return z;
  })
  .Action.about('Focuses DOM element.')('focus', (z, preventScroll) =>
      z.on('domNode', node => node.focus(preventScroll)))
  .Action('rBox', (z, ...as) => z.add(RBox(...as)))
  .Action.about('Adds children to an element.')(function add(z, ...children) {
    if(z._children === undefined){
      z._children = [];
    } else {
      if(z._children && z._children._type === nice.BoxArray)
        throw 'Children of this element already bound to BoxArray';
    }

    children.forEach(c => {
      if(c === undefined || c === null)
        return;

      if(typeof c === 'string' || c._isStr)
        return z._children.push(c);

      if(Array.isArray(c))
        return c.forEach(_c => z.add(_c));

      if(c._isArr)
        return c.each(_c => z.add(_c));

      if(c._isNum || typeof c === 'number')
        return z._children.push(c);

      if(c._isBox)
        return z._children.push(c);

      if(c === z)
        return z._children.push(`Errro: Can't add element to itself.`);

      if(c._isErr)
        return z._children.push(c.toString());

      if(!c || !nice.isAnything(c))
        return z._children.push('Bad child: ' + JSON.stringify(c));

      while(c !== undefined && c._up_ && c._up_ !== c)
        c = c._up_;

      c.up = z;
      c._up_ = z;
      z._children.push(c);
    });
  });

nice.ReadOnly.Anything('dom', z => document.createTextNode("" + z._value));


const Html = nice.Html;

Test('Simple html element with string child', Html => {
  expect(Html().add('qwe').html).is('<div>qwe</div>');
});

Test("insert Html", (Html) => {
  const div = Html('li');
  const div2 = Html('b').add('qwe');
  div.add(div2);
  expect(div.html).is('<li><b>qwe</b></li>');
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

Test("Html children Arr", (Div, Arr) => {
  expect(Div(Arr('qwe', 'asd')).html).is('<div>qweasd</div>');
});


Html.map = function(f = v => v){
  return a => this(...a.map(f));
};
//v => Div(...v.map(o => Div(JSON.stringify(o)))))
//v => Div(...v.map(Pipe(JSON.stringify, Div))
//map($1, Pipe(JSON.stringify, Div))
//Pipe( map, ..., Div)
//
//v => Div.map(v, Pipe(JSON.stringify, Div))




nice.Type('Style')
  .about('Represents CSS style.');

const Style = nice.Style;

defGet(Html.proto, function hover(){
  const style = Style();
  this.needAutoClass = true;
  this.cssSelectors(':hover', style);
  return style;
});


def(Html.proto, 'Css', function(s = ''){
  s = s.toLowerCase();
  if(s in this.cssSelectors())
    return this.cssSelectors(s);
  this.needAutoClass = true;
  const style = Style();
  style.up = this;
  this.cssSelectors(s, style);
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
    Html.proto[property] = function(...a) {
      if(a.length === 0)
        return this.style(property);
      nice.Switch(a[0])
        .isObject().use(o => _each(o, (v, k) => this.style(property + nice.capitalize(k), v)))
        .default.use(() => this.style(property, a.length > 1 ? nice.format(...a) : a[0]))
      return this;
    };
    Style.proto[property] = function(...a) {
      nice.isObject(a[0])
        ? _each(a[0], (v, k) => this.set(property + nice.capitalize(k), v))
        : this.set(property, a.length > 1 ? nice.format(...a) : a[0]);
      return this;
    };
  });


//'span' removed to avoid conflict with creating 'span' child
'value,checked,accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,cite,code,codebase,cols,colspan,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,wrap'
  .split(',').forEach( property => def(Html.proto, property, function(...a){
      if(a.length){
        this.attributes(property, a.length > 1 ? nice.format(...a) : a[0]);
        return this;
      } else {
        return this.attributes(property);
      }
    }));

def(Html.proto, 'contentEditable', function(...a){
  if(a.length){
    this.attributes('contentEditable', !!a[0]);
    this.forceRepaint(true);
    return this;
  } else {
    return this.attributes(property);
  }
});


Test('Css propperty format', Div => {
  expect(Div().border('3px', 'silver', 'solid').html)
    .is('<div style="border:3px silver solid"></div>');
});


function text(z){
  return z._children
    ? z._children
      .map(v => v.text
        ? v.text
        : nice.htmlEscape(nice.isFunction(v) ? v() : v))
      .jsValue.join('')
    : '';
};


function compileStyle (s){
  let a = [];
  _each(s, (v, k) =>
    a.push(k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + v));
  return a.join(';');
};


function compileSelectors (h){
  const a = [];
  _each(h.cssSelectors(), (v, k) => a.push('.',
    getAutoClass(h.attributes('className')),
    k[0] === ':' ? '' : ' ', k, '{', compileStyle(v), '}'));
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
  let style = compileStyle(z.style());
  style && (as = ' style="' + style + '"');

  _each(z.attributes(), (v, k) => {
    k === 'className' && (k = 'class', v.trim());
    as += ` ${k}="${v}"`;
  });

  let body = '';
  z._children &&
      z._children.forEach(c => body += c._isAnything ? c.html : nice.htmlEscape(c));

  return `${selectors}<${tag}${as}>${body}</${tag}>`;
};


function toDom(e) {
  if(e === undefined)
    return document.createTextNode('');
  if(e && e._isBox)
    throw `toDom(e) shoud never recieve Box`;
  return e._isAnything
    ? e.dom
    : document.createTextNode(e);
 };


function createDom(e){
  const value = e._value;
  const res = document.createElement(value.tag);

  _each(value.style, (v, k) => res.style[k] = '' + v);

  _each(value.attributes, (v, k) => res.setAttribute(k,v));

  _each(value.properties, (v, k) => res[k] = v);

  if(e._children)
    e._children._isBoxArray
      ? attachBoxArrayChildren(res, e._children)
      : e._children.forEach(c => attachNode(c, res));

  _each(value.eventHandlers, (ls, type) => {
    if(type === 'domNode')
      return ls.forEach(f => f(res));

    ls.forEach(f => res.addEventListener(type, f, true));
  });

  e.needAutoClass === true && assertAutoClass(res);
  addSelectors(value.cssSelectors, res);

  return res;
}

const childrenCounter = (o, v) => {
  v && (o[v] ? o[v]++ : (o[v] = 1));
  return o;
};


function cancelNestedSubscription(subscription){
  const nested = subscription.nestedSubscription;
  nested.source.unsubscribe(nested);
  delete subscription.nestedSubscription;
  delete nested.parentSubscription;
  nested.nestedSubscription !== undefined && cancelNestedSubscription(nested);
}


function createSubscription(box, state, dom){
  const f = function(newState){
    if(f.nestedSubscription !== undefined){
      cancelNestedSubscription(f);
    }

    if(newState !== undefined && newState._isBox === true){
      f.nestedSubscription = createSubscription(newState, f.state, f.dom);
      f.nestedSubscription.parentSubscription = f;
      newState.subscribe(f.nestedSubscription);
    } else {
      while(newState !== undefined && newState._up_ && newState._up_ !== newState)
        newState = newState._up_;

      const newDom = refreshElement(newState, f.state, f.dom);
      if(newDom !== f.dom){
        f.dom = newDom;
        let parent = f;
        while (parent = parent.parentSubscription) {
          parent.dom = newDom;
        };
      }
    }
    f.state = newState;
  };
  dom.__boxListener = f;
  f.dom = dom;
  f.source = box;
  f.state = state;
  return f;
}


function attachNode(child, parent, position){

  if(child && child._isBox){
    let state = '';
//		child();
//    if(state === undefined)
//      state = '';
    let dom = toDom(state);
    insertAt(parent, dom, position);
    child.subscribe(createSubscription(child, state, dom));
  } else {
    insertAt(parent, toDom(child), position);
  }
}


function detachNode(dom, parentDom){
  const bl = dom.__boxListener;
  bl !== undefined && bl.source.unsubscribe(bl);

  const cl = dom.__childrenListener;
  cl !== undefined && cl.source.unsubscribe(cl);

  emptyNode(dom);

  parentDom !== undefined && parentDom.removeChild(dom);
}


function emptyNode(node){
  const children = node.childNodes;
  if(children !== undefined) {
    for (let child of children) {
      detachNode(child);
    }
  }

  const assertedClass = node.assertedClass;
  assertedClass !== undefined && killAllRules(assertedClass);
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


function refreshElement(e, old, domNode){
  const eTag = (e !== undefined) && e._isHtml && e.tag(),
        oldTag = (old !== undefined) && old._isHtml && old.tag();
  let newDom = domNode;

  if (eTag !== oldTag || (old._isHtml && old.forceRepaint())){
    newDom = toDom(e);
    emptyNode(domNode);
    domNode.parentNode.replaceChild(newDom, domNode);
  } else if(!eTag) {
    domNode.nodeValue = e;
  } else {
    const newV = e._value, oldV = old._value;

    const newStyle = newV.style, oldStyle = oldV.style;
    _each(oldStyle, (v, k) => (k in newStyle) || (domNode.style[k] = ''));
    _each(newStyle, (v, k) => oldStyle[k] !== v && (domNode.style[k] = v));

    const newAtrs = newV.attributes, oldAtrs = oldV.attributes;

    _each(oldAtrs, (v, k) => (k in newAtrs) || (domNode.removeAttribute(k)));
    _each(newAtrs, (v, k) => oldAtrs[k] !== v && (domNode.setAttribute(k, v)));

    e.needAutoClass === true && assertAutoClass(domNode);
    if(e.needAutoClass || domNode.assertedClass)
      refreshSelectors(newV.cssSelectors, newV.cssSelectors, domNode);

    const newHandlers = newV.eventHandlers, oldHandlers = newV.eventHandlers;
    nice._eachEach(oldHandlers, (f, i, type) => {
      if(!(newHandlers[type] && newHandlers[type].includes(f)))
        domNode.removeEventListener(type, f, true);
    });
    nice._eachEach(newHandlers, (f, i, type) => {
      if(!(oldHandlers[type] && oldHandlers[type].includes(f)))
        domNode.addEventListener(type, f, true);
    });

    refreshChildren(e._children, old._children, domNode);
  }
  return newDom;
};


function refreshBoxChildren(aChildren, bChildren, domNode) {
  let ac = aChildren, bc = bChildren;

  if(bChildren._isBoxArray){
    while (domNode.firstChild) {
      //TODO: unsubscribe
      domNode.removeChild(domNode.lastChild);
    }
    bc = [];
  }

  if(aChildren._isBoxArray)
    ac  = [];

  refreshChildren(ac, bc, domNode);

  if(aChildren._isBoxArray)
    attachBoxArrayChildren(domNode, aChildren);
}


function refreshChildren(aChildren, bChildren, domNode){
  if(aChildren === bChildren)
    return;

  aChildren = aChildren || [];
  bChildren = bChildren || [];

  if(bChildren._isBoxArray || aChildren._isBoxArray){
    return refreshBoxChildren(aChildren, bChildren, domNode);
  }

  const aKeys = aChildren.map(extractKey);//TODO: why do we treat same id as same node??
  const bKeys = bChildren.map(extractKey);
  const aCount = aKeys.reduce(childrenCounter, {});
  const bCount = bKeys.reduce(childrenCounter, {});

  let ai = 0, bi = 0;
  while(ai < aKeys.length){
    const aChild = aKeys[ai], bChild = bKeys[bi];
    if(aChild === bChild && aChild !== undefined){
      refreshElement(aChildren[ai], bChildren[bi], domNode.childNodes[ai]);
      ai++, bi++;
    } else
    if(!bCount[aChild]){//assume insert
      attachNode(aChildren[ai], domNode, ai);
      ai++;
    } else if(!aCount[bChild]) {//assume delete
      detachNode(domNode.childNodes[ai], domNode);
      bi++;
    } else {//assume ugly reorder - brute force
      const old = domNode.childNodes[bi];
      old
        ? refreshElement(aChildren[ai], bChildren[bi], old)
        : attachNode(aChildren[ai], domNode, bi);

//      old && detachNode(old, domNode);


      ai++, bi++;
    }
  };
  while(bi < bKeys.length){
    detachNode(domNode.childNodes[ai], domNode);
    bi++;
  }
};


nice.htmlEscape = s => (''+s).replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');



const getAutoClass = s => s.match(/(_nn_\d+)/)[0];


if(IS_BROWSER){
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  runtime.styleSheet = styleEl.sheet;

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


function attachBoxArrayChildren(node, box) {
  const f = (v, k, oldV, oldK) => {
    if(oldK !== null) {
      const child = node.childNodes[oldK];
      detachNode(child, node);
    }
    if(k !== null)
      attachNode(v, node, k);
  };
  f.source = box;
  node.__childrenListener = f;
  box.subscribe(f);
};


function detachBoxArrayChildren(node, box) {
//  const f = (v, k, oldV, oldK) => {
//    if(oldK !== null) {
//      const child = node.childNodes[oldK];
//      detachNode(child, node);
//    }
//    if(k !== null)
//      attachNode(v, node, k);
//  };
//  f.source = box;
//  node.__childrenListener = f;
  box.unsubscribe(f, node.__childrenListener);
};


if(IS_BROWSER){
  function killNode(n){
    n && n !== document.body && n.parentNode && n.parentNode.removeChild(n);
  }


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


  Func.primitive('hide', (v, node) => {
    killNode(node);
  });


  Func.Single('show', (e, parentNode = document.body, position) => {
    const node = document.createTextNode('');
    e._shownNodes = e._shownNodes || new WeakMap();
    e._shownNodes.set(node, e.listen(v => node.nodeValue = v()));
    return insertAt(parentNode, node, position);
  });


  Func.Single('hide', (e, node) => {
    const subscription = e._shownNodes && e._shownNodes.get(node);
    subscription();
    killNode(node);
  });


//  Func.Box('show', (e, parentNode = document.body, position) => {
//    let node;
//    e._shownNodes = e._shownNodes || new WeakMap();
//    const f = (v, oldValue) => {
//      const oldNode = node;
//      node && (position = Array.prototype.indexOf.call(parentNode.childNodes, node));
//      if(v !== null){
//        node = nice.show(v, parentNode, position);
//        e._shownNodes.set(node, f);
//      } else {
//        node = undefined;
//      }
//      if(oldNode){
//        oldValue && oldValue.hide ? oldValue.hide(oldNode) : killNode(oldNode);
//      }
//    };
//    e.listen(f);
//  });


//  Func.Box('hide', (e, node) => {
//    e.unsubscribe(e._shownNodes.get(node));
//    e._shownNodes.delete(node);
//    e._value && e._value.hide && e._value.hide(node);
//  });


  Func.Nothing('show', (e, parentNode = document.body, position) => {
    return insertAt(parentNode, document.createTextNode(''), position);
  });

  Func.Err('show', (e, parentNode = document.body, position) => {
    return insertAt(parentNode,
        document.createTextNode('Error: ' + e().message), position);
  });

  Func.Bool('show', (e, parentNode = document.body, position) => {
    if(e())
      throw `I don't know how to display "true"`;
    return insertAt(parentNode, document.createTextNode(''), position);
  });


  Func.Html.BoxArray('bindChildren', (z, b) => {
    z._children = b;
  });


  Func.Html('hide', (e, node) => {
    const subscriptions = e._shownNodes && e._shownNodes.get(node);
    e._shownNodes.delete(node);
    subscriptions && subscriptions.forEach(f => f());
    node && e._children.forEach((c, k) => nice.hide(c, node.childNodes[0]));
    killNode(node);
  });
};

const addRules = (vs, selector, className) => {
  const rule = assertRule(selector, className);
  vs.each((v, k) => rule.style[k] = v);
};


const changeRules = (values, oldValues, selector, className) => {
  const rule = assertRule(selector, className);
  _each(values, (v, k) => rule.style[k] = v);
  _each(oldValues, (v, k) => k in values || (rule.style[k] = null));
};


const findRule = (selector, className) => {
  const s = `.${className}${selector}`.toLowerCase();
  let rule;
  for (const r of runtime.styleSheet.cssRules)
    r.selectorText === s && (rule = r);
  return rule;
};


const assertRule = (selector, className) => {
  const name = selector[0] === ':'
    ? className + selector
    : className + ' ' + selector;
  return findRule(selector, className) || runtime.styleSheet
      .cssRules[runtime.styleSheet.insertRule(`.${name}` + '{}')];
};


const killRules = (vs, selector, id) => {
  const rule = findRule(selector, id);
  rule && _each(vs, (value, prop) => rule.style[prop] = null);
};


const killAllRules = className => {
  const a = [];
  [...runtime.styleSheet.cssRules].forEach((r, i) =>
      r.selectorText.indexOf(className) === 1 && a.unshift(i));
  a.forEach(i => runtime.styleSheet.deleteRule(i));
};


function addSelectors(selectors, node){
  _each(selectors, (v, k) => addRules(v, k, getAutoClass(node.className)));
};


function refreshSelectors(selectors, oldSelectors, node){
  const className = getAutoClass(node.className);
  _each(selectors, (v, k) => changeRules(v, oldSelectors[k], k, className));
  _each(oldSelectors, (v, k) => (k in selectors) || killRules(v, k, className));
};


function assertAutoClass(node) {
  const className = node.className || '';
  if(className.indexOf(nice.AUTO_PREFIX) < 0){
    let name = node.assertedClass;
    if(!name){
      name = nice.genereteAutoId();
      node.assertedClass = name;
    }
    node.className = className !== '' ? (className + ' ' + name) : name;
  }
}


IS_BROWSER && Test((Div) => {
  const testPane = document.createElement('div');
  document.body.appendChild(testPane);

  Test((Div, show) => {
    const div = Div('q')
      .b('w')
      .I('e').up
      .color('red');
    const node = div.show(testPane);

    expect(node.textContent).is('qwe');
    expect(node.style.color).is('red');
  });


  Test((Div, Box, show) => {
    const box = Box('asd');
    const div = Div(box);
    const node = div.show(testPane);
    expect(node.textContent).is('asd');
    box(Div('zxc'));
    expect(node.textContent).is('zxc');
  });


  Test('Reorder children', (Div, Box, show) => {
    const d1 = Div('d1');
    const d2 = Div('d2');
    const d3 = Div('d3');
    const box = Box(Div(d1,d2,d3));
    const div = Div(box);

    const node = div.show(testPane);

    expect(node.textContent).is('d1d2d3');

    box(Div(d2,d3,d1));

    expect(node.textContent).is('d2d3d1');
  });


  Test((Div, Box, Css, show, I, B) => {
    const box = Box(0);
    const initialRulesCount = runtime.styleSheet.rules.length;

    const div = Div(RBox(box, a => {
      return a === 0 ? I('qwe') : B('asd')
        .Css(':first-child').backgroundColor('red').up;
    }));
    const node = div.show(testPane);

    expect(node.textContent).is('qwe');

    box(1);
    expect(node.textContent).is('asd');
    expect(window.getComputedStyle(node.firstChild).backgroundColor)
        .is('rgb(255, 0, 0)');

    box(0);
    expect(node.textContent).is('qwe');
    expect(window.getComputedStyle(node.firstChild).backgroundColor)
        .is('rgba(0, 0, 0, 0)');
    expect(runtime.styleSheet.rules.length).is(initialRulesCount);
  });


  Test((Div, Box, B) => {
    const box = Box(Div(B(1).id('b1'), B(2)));
    const div = Div(box).show();
    expect(div.textContent).is('12');

    box(Div(B(11).id('b1'), B(2)));
    expect(div.textContent).is('112');

    box(Div(B(2), B(11).id('b1')));
    expect(div.textContent).is('211');
  });


  Test((Div, RBox, Box) => {
    const b = Box();
    const rb = RBox(b, v => '12');
    expect(rb()).is('12');
//    const div = Div(rb).show();
//    expect(div.textContent).is('12');
  });


  Test((Div, prop) => {
    expect(nice.Div().properties('qwe', 'asd').show().qwe).is('asd');
  });


  document.body.removeChild(testPane);
});