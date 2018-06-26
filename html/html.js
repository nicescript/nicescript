let autoId = 0;
const AUTO_PREFIX = '_nn_'

nice.Type('Html')
  .about('Represents HTML element.')
  .by((z, tag) => tag && z.tag(tag))
  .Str('tag', 'div')
  .Obj('eventHandlers')
  .Obj('cssSelectors')
  .Action.about('Adds event handler to an element.')(function on(z, name, f){
    if(name === 'domNode' && nice.isEnvBrowser){
      if(!z.id())
        throw `Give element an id to use domNode event.`;
      const el = document.getElementById(z.id());
      el && f(el);
    }
    nice.Switch(z.eventHandlers(name))
      .Nothing.use(() => z.eventHandlers(name, [f]))
      .default.use(a => a.push(f));
  })
  .Obj('style')
  .Obj('attributes')
  .Arr('children')
  .Method('_autoId', z => {
    z.id() || z.id(AUTO_PREFIX + autoId++);
    return z.id();
  })
  .Method('_autoClass', z => {
    const s = z.attributes('className').or('')();
    if(s.indexOf(AUTO_PREFIX) < 0){
      const c = AUTO_PREFIX + autoId++;
      z.attributes('className', s + ' ' + c);
    }
    return z;
  })
  .Method.about('Adds values to className attribute.')('class', (z, ...vs) => {
    const current = z.attributes('className').or('')();
    if(!vs.length)
      return current;

    const a = current ? current.split(' ') : [];
    vs.forEach(v => !v || a.includes(v) || a.push(v));
    z.attributes('className', a.join(' '));
    return z;
  })
  .ReadOnly(text)
  .ReadOnly(html)
  .Method.about('Scroll browser screen to an element.')(function scrollTo(z, offset = 10){
    z.on('domNode', node => {
      node && window.scrollTo(node.offsetLeft - offset, node.offsetTop - offset);
    });
    return z;
  })
  .Action.about('Focuses DOM element.')('focus', (z, preventScroll) =>
      z.on('domNode', node => node.focus(preventScroll)))
  .Action.about('Adds children to an element.')(function add(z, ...children) {
    children.forEach(c => {
      if(is.Array(c))
        return _each(c, _c => z.add(_c));

      if(is.Arr(c))
        return c.each(_c => z.add(_c));

      if(c === undefined || c === null)
        return;

      if(is.String(c))
        return z.children(c);

      if(is.Number(c))
        return z.children('' + c);

      if(c === z)
        return z.children(`Errro: Can't add element to itself.`);

      if(!c || !is.Anything(c))
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

defGet(Html.proto, 'hover', function(){
  const style = Style();
  this._autoClass();
  this.cssSelectors(':hover', style);
  return style;
});


def(Html.proto, 'Css', function(s = ''){
  s = s.toLowerCase();
  if(this.cssSelectors.has(s)())
    return this.cssSelectors.get(s);
  this._autoClass();
  const style = Style();
  style.up = this;
  this.cssSelectors(s, style);
  return style;
});


nice._on('Extension', ({child, parent}) => {
  if(parent === Html || Html.isPrototypeOf(parent)){
    def(Html.proto, child.name, function (...a){
      const res = child(...a);
      this.add(res);
      return res;
    });
    const _t = nice._deCapitalize(child.name);
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
      is.Object(a[0])
        ? _each(a[0], (v, k) => this.style(property + nice.capitalize(k), v))
        : this.style(property, is.String(a[0]) ? nice.format(...a) : a[0]);
      return this;
    });
    def(Style.proto, property, function(...a) {
      is.Object(a[0])
        ? _each(a[0], (v, k) => this(property + nice.capitalize(k), v))
        : this(property, is.String(a[0]) ? nice.format(...a) : a[0]);
      return this;
    });
  });


//'span' removed to avoid conflict with creating 'span' child
'value,checked,accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,cite,code,codebase,cols,colspan,contenteditable,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,wrap'
  .split(',').forEach( property => {
    Html.proto[property] = function(...a){
      return a.length
        ? this.attributes(property, ...a)
        : nice.Switch(this.attributes(property)).Value.use(v => v()).default('');
    };
  });


function text(){
  return this.children
      .map(v => v.text
        ? v.text
        : nice.htmlEscape(is.function(v) ? v(): v))
      .getResult().join('');
};


function compileStyle (s){
  const a = [];
  _each(s, (v, k) => a.push(k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + v));
  return a.join(';');
};

function compileSelectors (r){
  const a = [];
  _each(r.cssSelectors, (v, k) => a.push('.', getAutoClass(r.attributes.className),
    ' ', k, '{', compileStyle (v), '}'));
  return a.length ? '<style>' + a.join('') + '</style>' : '';
};


const resultToHtml = r => {
  const a = [compileSelectors(r), '<', r.tag ];
  const style = compileStyle(r.style);
  style && a.push(" ", 'style="', style, '"');

  _each(r.attributes, (v, k) => {
    k === 'className' && (k = 'class', v = v.trim());
    a.push(" ", k , '="', v, '"');
  });

  a.push('>');

  _each(r.children, c => a.push(c && c.tag
    ? resultToHtml(c)
    : nice.htmlEscape(c)));

  a.push('</', r.tag, '>');
  return a.join('');
};


function html(){
  return resultToHtml(this._result);
};


defAll(nice, {
  htmlEscape: s => (''+s).replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
});


const getAutoClass = s => s.match(/(_nn_\d+)/)[0];


if(nice.isEnvBrowser){
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  const styleSheet = styleEl.sheet;

  const addStyle = Switch
    .Box.use((s, k, node) => {
      const f = v => addStyle(v, k, node);
      s.listen(f);
      nice._set(node, ['styleSubscriptions', k], () => s.unsubscribe(f));
    })
    .default.use((v, k, node) => node.style[k] = v);

  const delStyle = Switch
    .Box.use((s, k, node) => {
      node.styleSubscriptions[k]();
      delete node.styleSubscriptions[k];
      node.style[k] = '';
    })
    .default.use((v, k, node) => node.style && (node.style[k] = ''));


  const addAttribute = Switch
    .Box.use((s, k, node) => {
      const f = v => addAttribute(v, k, node);
      s.listen(f);
      nice._set(node, ['attrSubscriptions', k], () => s.unsubscribe(f));
    })
    .default.use((v, k, node) => node[k] = v);

  const delAttribute = Switch
    .Box.use((s, k, node) => {
      node.attrSubscriptions[k]();
      delete node.attrSubscriptions[k];
      node[k] = '';
    })
    .default.use((v, k, node) => node[k] = '');



  const addSelectors = (selectors, node) => {
    _each(selectors, (_v, k) => addRules(_v, k, getAutoClass(node.className)));
  };


  const addRules = (vs, selector, className) => {
    const rule = assertRule(selector, className);
    _each(vs, (value, prop) => rule.style[prop] = value);
  };


  const findRule = (selector, className) => {
    const s = `.${className} ${selector}`.toLowerCase();
    let rule;
    for (const r of styleSheet.cssRules)
      r.selectorText === s && (rule = r);
    return rule;
  };


  const assertRule = (selector, className) => {
    return findRule(selector, className) || styleSheet
        .cssRules[styleSheet.insertRule(`.${className} ${selector}` + '{}')];
  };

  const killSelectors = (css, node) => {
    _each(css, (_v, k) => killRules(_v, k, getAutoClass(node.className)));
  };


  const killRules = (vs, selector, id) => {
    const rule = findRule(selector, id);
    rule && _each(vs, (value, prop) => rule.style[prop] = null);
  };


  function killNode(n){
    n && n.parentNode && n.parentNode.removeChild(n);
  }


  function insertBefore(node, newNode){
    node.parentNode.insertBefore(newNode, node);
    return newNode;
  }


  function insertAfter(node, newNode){
    node.parentNode.insertBefore(newNode, node.nextSibling);
    return newNode;
  }


  function preserveAutoClass(add, del, node){
    const a = nice._get(add, ['attributes', 'className']) || '';
    const d = node && node.className || '';
    const ai = a.indexOf(AUTO_PREFIX);
    const di = d.indexOf(AUTO_PREFIX);

    if(ai >= 0 && di >= 0){
      const old = d.match(/(_nn_\d+)/)[0];
      delete del.attributes.className;
      add.attributes.className = a.replace(/_nn_(\d+)/, old);
    }
  }


  function handleNode(add, del, oldNode, parent){
    let node;

    if(del && !is.Nothing(del) && !oldNode)
      throw '!oldNode';

    preserveAutoClass(add, del, oldNode);

    del && Switch(del)
      .Box.use(b => {
        b.unsubscribe(oldNode.__niceSubscription);
        oldNode.__niceSubscription = null;
      })
      .Object.use(o => {
        if(o.tag && add === undefined){
          killNode(oldNode);
        } else {
          _each(o.style, (_v, k) => delStyle(_v, k, oldNode));
          _each(o.attributes, (_v, k) => delAttribute(_v, k, oldNode));
          killSelectors(o.cssSelectors, oldNode);
          nice._eachEach(o.eventHandlers, (f, _n, k) =>
                oldNode.removeEventListener(k, f, true));
        }
      })
      .default.use(t => add !== undefined || t !== undefined && killNode(oldNode));


    if(is.Box(add)) {
      const f = () => {
        const diff = add.getDiff();
        node = handleNode(diff.add, diff.del, node, parent);
      };
      add.listen(f);
      node = node || oldNode || document.createTextNode(' ');
      node.__niceSubscription = f;
      oldNode || parent.appendChild(node);
    } else if(add !== undefined) {
      if (add && typeof add === 'object') { //full node
        const newHtml = add.tag;
        if(newHtml){
          if(del && !is.String(del) && !is.Nothing(del)){
            node = changeHtml(oldNode, newHtml);
          }
          node = node || document.createElement(newHtml);
          oldNode ? insertBefore(oldNode, node) : parent.appendChild(node);
        } else {
          node = oldNode;
        }
        _each(add.style, (_v, k) => addStyle(_v, k, node));
        _each(add.attributes, (_v, k) => addAttribute(_v, k, node));
        addSelectors(add.cssSelectors, node);
        addHandlers(add.eventHandlers, node);
      } else {
        const text = is.Nothing(add) ? '' : '' + add;
        node = document.createTextNode(text);
        oldNode ? insertBefore(oldNode, node) : parent.appendChild(node);
      }
      oldNode && (oldNode !== node) && killNode(oldNode);
    }
    is.Box(add) || (node && node.nodeType === 3)
            || handleChildren(add, del, node || oldNode);
    return node || oldNode;
  }


  function handleChildren(add, del, target){
    const a = add && add.children;
    const d = del && del.children;
    const f = k => handleNode(a && a[k], d && d[k], target.childNodes[k], target);
    const keys = [];

    _each(a, (v, k) => f( + k));
    _each(d, (v, k) => (a && a[k]) || keys.push( + k));
    keys.sort((a,b) => b - a).forEach(f);
  };


  Func.Box(function show(source, parent = document.body){
    const i = parent.childNodes.length;
    let node = null;
    source.listenDiff(diff => node = handleNode(diff.add, diff.del, node, parent));
    return source;
  });


  function newNode(tag, parent = document.body){
    return parent.appendChild(document.createElement(tag));
  };


  Func.Html(function show(source, parent = document.body){
    handleNode(source.getResult(), undefined, null, parent);
    return source;
  });


  function changeHtml(old, tag){
    const node = document.createElement(tag);
    while (old.firstChild) node.appendChild(old.firstChild);
    for (let i = old.attributes.length - 1; i >= 0; --i) {
      node.attributes.setNamedItem(old.attributes[i].cloneNode());
    }
    addHandlers(old.__niceListeners, node);
    delete(old.__niceListeners);
    return node;
  }


  function addHandlers(eventHandlers, node){
    nice._eachEach(eventHandlers, (f, _n, k) => {
      if(k === 'domNode')
        return f(node);
      node.addEventListener(k, f, true);
      node.__niceListeners = node.__niceListeners || {};
      node.__niceListeners[k] = node.__niceListeners[k] || [];
      node.__niceListeners[k].push(f);
    });
  }

};
