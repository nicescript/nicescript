//TODO: throw error when adding object that is not Html
let autoId = 0;
const AUTO_PREFIX = '_nn_'

nice.Type('Html')
  .about('Represents HTML element.')
  .by((z, tag) => tag && z.tag(tag))
  .str('tag', 'div')
  .obj('eventHandlers')
  .obj('cssSelectors')
  .Action.about('Adds event handler to an element.')(function on(z, name, f){
    if(name === 'domNode' && nice.isEnvBrowser()){
      if(!z.id())
        throw `Give element an id to use domNode event.`;
      const el = document.getElementById(z.id());
      el && f(el);
    }
    const handlers = z.eventHandlers.get(name);
    handlers ? handlers.push(f) : z.eventHandlers.set(name, [f]);
    return z;
  })
  .obj('style')
  .obj('attributes')
  .arr('children')
  .Method('_autoId', z => {
    z.id() || z.id(AUTO_PREFIX + autoId++);
    return z.id();
  })
  .Method('_autoClass', z => {
    const s = z.attributes.get('className') || '';
    if(s.indexOf(AUTO_PREFIX) < 0){
      const c = AUTO_PREFIX + autoId++;
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
  .Method.about('Scroll browser screen to an element.')(function scrollTo(z, offset = 10){
    z.on('domNode', n => {
      n && window.scrollTo(n.offsetLeft - offset, n.offsetTop - offset);
    });
    return z;
  })
  .Action
    .about('Map provided Obj with provided function and add result as children.')
      .Obj('mapChildren', (z, o, f) => {
        const positions = {};
        o.listen({
            onRemove: (v, k) => z.children.remove(positions[k]),
            onAdd: (v, k) => {
              const i = o.isArr() ? k : Object.keys(o()).indexOf(k);
              positions[k] = i;
              z.children.insertAt(i, f(v, k));
            }
          }, z.children);
      })
  .Action
    .about('Map provided Object with provided function and add result as children.')
      .Object('mapChildren', (z, o, f) => {
        nice._each(o, (v, k) => z.add(f(v, k)));
      })
  .Action
    .about('Map provided array with provided function and add result as children.')
      .Arr('mapChildren', (z, a, f) => {
        a.listen({
          onRemove: (v, k) => z.children.removeAt(k),
          onAdd: (v, k) => z.children.insertAt(k, f(v, k))
        }, z.children);
      })
  .Action
    .about('Map provided array with provided function and add result as children.')
      .Array('mapChildren', (z, a, f) => a.forEach((v, k) => z.add(f(v, k))))
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

      if(nice.isString(c) || nice.isStr(c))
        return z.children(c);

      if(nice.isNumber(c) || nice.isNum(c))
        return z.children(c);

      if(c === z)
        return z.children(`Errro: Can't add element to itself.`);

      if(!c || !nice.isAnything(c))
        return z.children('Bad child: ' + c);

      c.up = z;
      c._up_ = z;
      z.children.push(c);
    });
  });

const Html = nice.Html;

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
  const existing = this.cssSelectors.get(s);
  if(existing !== undefined)
    return existing;
  this._autoClass();
  const style = Style();
  style.up = this;
  this.cssSelectors.set(s, style);
  return style;
});


reflect.on('Extension', ({child, parent}) => {
  if(parent === Html || Html.isPrototypeOf(parent)){
    def(Html.proto, child.name, function (...a){
      const res = child(...a);
      this.add(res);
      return res;
    });
    const _t = nice._decapitalize(child.name);
    Html.proto[_t] || def(Html.proto, _t, function (...a){
      return this.add(child(...a));
    });
  }
});


Html.proto.Box = function(...a) {
  const res = Box(...a);
  res.up = this;
  this.add(res);
  return res;
};


'clear,alignContent,alignItems,alignSelf,alignmentBaseline,all,animation,animationDelay,animationDirection,animationDuration,animationFillMode,animationIterationCount,animationName,animationPlayState,animationTimingFunction,backfaceVisibility,background,backgroundAttachment,backgroundBlendMode,backgroundClip,backgroundColor,backgroundImage,backgroundOrigin,backgroundPosition,backgroundPositionX,backgroundPositionY,backgroundRepeat,backgroundRepeatX,backgroundRepeatY,backgroundSize,baselineShift,border,borderBottom,borderBottomColor,borderBottomLeftRadius,borderBottomRightRadius,borderBottomStyle,borderBottomWidth,borderCollapse,borderColor,borderImage,borderImageOutset,borderImageRepeat,borderImageSlice,borderImageSource,borderImageWidth,borderLeft,borderLeftColor,borderLeftStyle,borderLeftWidth,borderRadius,borderRight,borderRightColor,borderRightStyle,borderRightWidth,borderSpacing,borderStyle,borderTop,borderTopColor,borderTopLeftRadius,borderTopRightRadius,borderTopStyle,borderTopWidth,borderWidth,bottom,boxShadow,boxSizing,breakAfter,breakBefore,breakInside,bufferedRendering,captionSide,clip,clipPath,clipRule,color,colorInterpolation,colorInterpolationFilters,colorRendering,columnCount,columnFill,columnGap,columnRule,columnRuleColor,columnRuleStyle,columnRuleWidth,columnSpan,columnWidth,columns,content,counterIncrement,counterReset,cursor,cx,cy,direction,display,dominantBaseline,emptyCells,fill,fillOpacity,fillRule,filter,flex,flexBasis,flexDirection,flexFlow,flexGrow,flexShrink,flexWrap,float,floodColor,floodOpacity,font,fontFamily,fontFeatureSettings,fontKerning,fontSize,fontStretch,fontStyle,fontVariant,fontVariantLigatures,fontWeight,height,imageRendering,isolation,justifyContent,left,letterSpacing,lightingColor,lineHeight,listStyle,listStyleImage,listStylePosition,listStyleType,margin,marginBottom,marginLeft,marginRight,marginTop,marker,markerEnd,markerMid,markerStart,mask,maskType,maxHeight,maxWidth,maxZoom,minHeight,minWidth,minZoom,mixBlendMode,motion,motionOffset,motionPath,motionRotation,objectFit,objectPosition,opacity,order,orientation,orphans,outline,outlineColor,outlineOffset,outlineStyle,outlineWidth,overflow,overflowWrap,overflowX,overflowY,padding,paddingBottom,paddingLeft,paddingRight,paddingTop,page,pageBreakAfter,pageBreakBefore,pageBreakInside,paintOrder,perspective,perspectiveOrigin,pointerEvents,position,quotes,r,resize,right,rx,ry,shapeImageThreshold,shapeMargin,shapeOutside,shapeRendering,speak,stopColor,stopOpacity,stroke,strokeDasharray,strokeDashoffset,strokeLinecap,strokeLinejoin,strokeMiterlimit,strokeOpacity,strokeWidth,tabSize,tableLayout,textAlign,textAlignLast,textAnchor,textCombineUpright,textDecoration,textIndent,textOrientation,textOverflow,textRendering,textShadow,textTransform,top,touchAction,transform,transformOrigin,transformStyle,transition,transitionDelay,transitionDuration,transitionProperty,transitionTimingFunction,unicodeBidi,unicodeRange,userZoom,vectorEffect,verticalAlign,visibility,whiteSpace,widows,width,willChange,wordBreak,wordSpacing,wordWrap,writingMode,x,y,zIndex,zoom'
  .split(',').forEach( property => {
    def(Html.proto, property, function(...a) {
      const s = this.style;
      nice.Switch(a[0])
        .isBox.use(b => s.set(property, b))
        .isObject.use(o => _each(o, (v, k) => s.set(property + nice.capitalize(k), v)))
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
//        return nice.Switch(this.attributes.get(property)).Value.use(v => v()).default('');
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
  const a = [];
  s.each((v, k) => a.push(k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + v));
  return a.join(';');
};

function compileSelectors (h){
  const a = [];
  h.cssSelectors.each((v, k) => a.push('.', getAutoClass(h.attributes.get('className')),
    ' ', k, '{', compileStyle(v), '}'));
  return a.length ? '<style>' + a.join('') + '</style>' : '';
};

nice.ReadOnly.Box('html', ({_value}) => _value && _value._isAnything
    ? _value.html : '' + _value);
nice.ReadOnly.Single('html', z => '' + z._value);
nice.ReadOnly.Arr('html', z => z._items.map(v => v.html));

function html(z){
  const a = [compileSelectors(z), '<', z.tag() ];
  const style = compileStyle(z.style);
  style && a.push(" ", 'style="', style, '"');

  z.attributes.each((v, k) => {
    k === 'className' && (k = 'class', v = v.trim());
    a.push(" ", k , '="', v, '"');
  });

  a.push('>');

  z.children.each(c => a.push(c._isAnything ? c.html : c));

  a.push('</', z.tag(), '>');
  return a.join('');
};


defAll(nice, {
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

//  const addStyle = Switch
//    .Box.use((s, k, node) => {
//      const f = v => addStyle(v, k, node);
//      s.listen(f);
//      nice._set(node, ['styleSubscriptions', k], () => s.unsubscribe(f));
//    })
//    .default.use((v, k, node) => node.style[k] = v);

//  const delStyle = Switch
//    .Box.use((s, k, node) => {
//      node.styleSubscriptions[k]();
//      delete node.styleSubscriptions[k];
//      node.style[k] = '';
//    })
//    .default.use((v, k, node) => node.style && (node.style[k] = ''));
//
//
//  const addAttribute = Switch
//    .Box.use((s, k, node) => {
//      const f = v => addAttribute(v, k, node);
//      s.listen(f);
//      nice._set(node, ['attrSubscriptions', k], () => s.unsubscribe(f));
//    })
//    .default.use((v, k, node) => node[k] = v);
//
//  const delAttribute = Switch
//    .Box.use((s, k, node) => {
//      node.attrSubscriptions[k]();
//      delete node.attrSubscriptions[k];
//      node[k] = '';
//    })
//    .default.use((v, k, node) => node[k] = '');



  const addRules = (vs, selector, className) => {
    const rule = assertRule(selector, className);
    vs.each((value, prop) => rule.style[prop] = value);
  };


  const findRule = (selector, className) => {
    const s = `.${className} ${selector}`.toLowerCase();
    let rule;
    for (const r of styleSheet.cssRules)
      r.selectorText === s && (rule = r);
    return rule;
  };


  const findRuleindex = (selector, className) => {
    const s = `.${className} ${selector}`.toLowerCase();
    let res;
    for (const i in styleSheet.cssRules)
      styleSheet.cssRules[i].selectorText === s && (res = i);
    return res;
  };


  const assertRule = (selector, className) => {
    return findRule(selector, className) || styleSheet
        .cssRules[styleSheet.insertRule(`.${className} ${selector}` + '{}')];
  };

//  const killSelectors = (css, className) => {
//    css.each((v, k) => killRules(v, k, getAutoClass(className)));
//  };
  function killSelectors(v) {
    const c = getAutoClass(v.attributes.get('className'));
    v.cssSelectors.each((v, k) => killRules(v, k, c));
  };


  const killRules = (vs, selector, id) => {
    const rule = findRule(selector, id);
    rule && vs.each((value, prop) => rule.style[prop] = null);
  };


  const killAllRules = (v) => {
    const c = getAutoClass(v.attributes.get('className'));
    const a = [];
    [...styleSheet.cssRules].forEach((r, i) =>
        r.selectorText.indexOf(c) === 1 && a.unshift(i));
    a.forEach(i => styleSheet.deleteRule(i));
  };


  function killNode(n){
    n && n !== document.body && n.parentNode && n.parentNode.removeChild(n);
    n && nice._eachEach(n.__niceListeners, (listener, i, type) => {
      n.removeEventListener(type, listener);
    });
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


  Func.Box('show', (e, parentNode = document.body, position) => {
    let node;
    e._shownNodes = e._shownNodes || new WeakMap();
    const f = (v, oldValue) => {
      const oldNode = node;
      node && (position = Array.prototype.indexOf.call(parentNode.childNodes, node));
      node = nice.show(v, parentNode, position);
      e._shownNodes.set(node, f);
      if(oldNode){
        oldValue && oldValue.hide ? oldValue.hide(oldNode) : killNode(oldNode);
      }
    };
    e.listen(f);
  });


  Func.Box('hide', (e, node) => {
    e.unsubscribe(e._shownNodes.get(node));
    e._shownNodes.delete(node);
    e._value && e._value.hide(node);
  });


  Func.Nothing('show', (e, parentNode = document.body, position) => {
    return insertAt(parentNode, document.createTextNode(''), position);
  });

  Func.Bool('show', (e, parentNode = document.body, position) => {
    if(e())
      throw `I don't know how to display "true"`;
    return insertAt(parentNode, document.createTextNode(''), position);
  });


  Func.Html('show', (e, parentNode = document.body, position) => {
    const node = document.createElement(e.tag());

    //don't move this line to bootom. it's here for domNode event
    insertAt(parentNode, node, position);
    e.attachNode(node);
    return node;
  });

  Func.Html('attachNode', (e, node) => {
    e._shownNodes = e._shownNodes || new WeakMap();
    const ss = [];
    ss.push(e.children.listen({
        onRemove: (v, k) => removeNode(node.childNodes[k], v),
        onAdd: (v, k) => nice.show(v, node, k)
      }),
      e.style.listen({
        onRemove: (v, k) => delete node.style[k],
        onAdd: (v, k) => nice.isBox(v)
          ? ss.push(v.listen(_v => node.style[k] = _v))//TODO: unsubscribe
          : node.style[k] = v
      }),
      e.attributes.listen({
        onRemove: (v, k) => delete node[k],
        onAdd: (v, k) => node[k] = v
      }),
      e.cssSelectors.listen({
        onRemove: (v, k) => killRules(v, k, getAutoClass(className)),
        onAdd: (v, k) => addRules(v, k, getAutoClass(node.className))
      }),
      e.eventHandlers.listen({
        onAdd: (hs, k) => {
          hs.forEach(f => {
            if(k === 'domNode')
              return f(node);
            node.addEventListener(k, f, true);
            node.__niceListeners = node.__niceListeners || {};
            node.__niceListeners[k] = node.__niceListeners[k] || [];
            node.__niceListeners[k].push(f);
          });
        },
        onRemove: (hs, k) => {
          console.log('TODO: Remove, ', k);
        }
      })
    );
    e._shownNodes.set(node, ss);
  });


  Func.Html('hide', (e, node) => {
    const subscriptions = e._shownNodes && e._shownNodes.get(node);
    e._shownNodes.delete(node);
    subscriptions.forEach(f => f());
    e.children.each((c, k) => nice.hide(c, node.childNodes[0]));
    killNode(node);
  });


  function removeNode(node, v){
    node.parentNode.removeChild(node);
    v && v.cssSelectors && v.cssSelectors.size && killAllRules(v);
  }


  function removeAt(parent, position){
    const c = parent.childNodes[position];
    parent.removeChild(parent.childNodes[position]);
    //TODO: ?? clean cssSelectors
  }

  function insertAt(parent, node, position){
    parent.insertBefore(node, parent.childNodes[position]);
    return node;
  }

  //const addSelectors = (selectors, node) => {
  //  selectors.each((v, k) => addRules(v, k, getAutoClass(node.className)));
  //};
};


def(nice, 'iterateNodesTree', (f, node = document.body) => {
  f(node);
  if(node.childNodes)
    for (let n of node.childNodes) {
      nice.iterateNodesTree(f, n);
    };
});
