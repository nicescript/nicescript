def(nice, 'Block', (name, by) => {
  const cfg = nice.Type(name);
  cfg.by((z, ...a) => {
    z.tag('div');
    by && by(z, ...a);
  });

  name === 'Tag' || cfg.extends('Tag');
  nice.Tag.proto[name] = function (...a){
    const res = nice[name](...a);
    this.add(res);
    return res;
  };
  return cfg;
});

nice.Block('Tag', (z, tag) => tag && z.tag(tag))
  .String('tag')
  .Object('eventHandlers')
  .Action(function on(z, name, f){
    if(name === 'domNode' && nice.isEnvBrowser){
      if(!z.id())
        throw `Give elemen an id to use domNode event.`;
      const el = document.getElementById(z.id());
      el && f(el);
    }
    nice.Switch(z.eventHandlers(name))
      .Nothing.use(() => z.eventHandlers(name, [f]))
      .default.use(a => a.push(f));
  })
  .Object('style')
  .Object('attributes')
  .Array('class')
  .Array('children')
  .ReadOnly(text)
  .ReadOnly(html)
  .Method(function scrollTo(z, offset = 10){
    z.on('domNode', node => {
      node && window.scrollTo(node.offsetLeft - offset, node.offsetTop - offset);
    });
    return z;
  })
  .Action('focus', z => z.on('domNode', node => node.focus()))
  .Action(function add(z, ...children) {
    children.forEach(c => {
      if(is.Array(c))
        return c.each(_c => z.add(_c));

      if(is.array(c))
        return _each(c, _c => z.add(_c));

      if(c === undefined || c === null)
        return;

      if(is.string(c))
        return z.children(c);

      if(is.number(c))
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

const Tag = nice.Tag;

Tag.proto.Box = function(...a) {
  const res = Box(...a);
  res.up = this;
  this.add(res);
  return res;
};


'clear,alignContent,alignItems,alignSelf,alignmentBaseline,all,animation,animationDelay,animationDirection,animationDuration,animationFillMode,animationIterationCount,animationName,animationPlayState,animationTimingFunction,backfaceVisibility,background,backgroundAttachment,backgroundBlendMode,backgroundClip,backgroundColor,backgroundImage,backgroundOrigin,backgroundPosition,backgroundPositionX,backgroundPositionY,backgroundRepeat,backgroundRepeatX,backgroundRepeatY,backgroundSize,baselineShift,border,borderBottom,borderBottomColor,borderBottomLeftRadius,borderBottomRightRadius,borderBottomStyle,borderBottomWidth,borderCollapse,borderColor,borderImage,borderImageOutset,borderImageRepeat,borderImageSlice,borderImageSource,borderImageWidth,borderLeft,borderLeftColor,borderLeftStyle,borderLeftWidth,borderRadius,borderRight,borderRightColor,borderRightStyle,borderRightWidth,borderSpacing,borderStyle,borderTop,borderTopColor,borderTopLeftRadius,borderTopRightRadius,borderTopStyle,borderTopWidth,borderWidth,bottom,boxShadow,boxSizing,breakAfter,breakBefore,breakInside,bufferedRendering,captionSide,clip,clipPath,clipRule,color,colorInterpolation,colorInterpolationFilters,colorRendering,columnCount,columnFill,columnGap,columnRule,columnRuleColor,columnRuleStyle,columnRuleWidth,columnSpan,columnWidth,columns,content,counterIncrement,counterReset,cursor,cx,cy,direction,display,dominantBaseline,emptyCells,fill,fillOpacity,fillRule,filter,flex,flexBasis,flexDirection,flexFlow,flexGrow,flexShrink,flexWrap,float,floodColor,floodOpacity,font,fontFamily,fontFeatureSettings,fontKerning,fontSize,fontStretch,fontStyle,fontVariant,fontVariantLigatures,fontWeight,height,imageRendering,isolation,justifyContent,left,letterSpacing,lightingColor,lineHeight,listStyle,listStyleImage,listStylePosition,listStyleType,margin,marginBottom,marginLeft,marginRight,marginTop,marker,markerEnd,markerMid,markerStart,mask,maskType,maxHeight,maxWidth,maxZoom,minHeight,minWidth,minZoom,mixBlendMode,motion,motionOffset,motionPath,motionRotation,objectFit,objectPosition,opacity,order,orientation,orphans,outline,outlineColor,outlineOffset,outlineStyle,outlineWidth,overflow,overflowWrap,overflowX,overflowY,padding,paddingBottom,paddingLeft,paddingRight,paddingTop,page,pageBreakAfter,pageBreakBefore,pageBreakInside,paintOrder,perspective,perspectiveOrigin,pointerEvents,position,quotes,r,resize,right,rx,ry,shapeImageThreshold,shapeMargin,shapeOutside,shapeRendering,speak,stopColor,stopOpacity,stroke,strokeDasharray,strokeDashoffset,strokeLinecap,strokeLinejoin,strokeMiterlimit,strokeOpacity,strokeWidth,tabSize,tableLayout,textAlign,textAlignLast,textAnchor,textCombineUpright,textDecoration,textIndent,textOrientation,textOverflow,textRendering,textShadow,textTransform,top,touchAction,transform,transformOrigin,transformStyle,transition,transitionDelay,transitionDuration,transitionProperty,transitionTimingFunction,unicodeBidi,unicodeRange,userZoom,vectorEffect,verticalAlign,visibility,whiteSpace,widows,width,willChange,wordBreak,wordSpacing,wordWrap,writingMode,x,y,zIndex,zoom'
  .split(',').forEach( property => {
    nice.define(nice.Tag.proto, property, function(...a) {
      is.object(a[0])
        ? _each(a[0], (v, k) => this.style(property + nice.capitalize(k), v))
        : this.style(property, is.string(a[0]) ? nice.format(...a) : a[0]);
      return this;
    });
  });


'value,checked,accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,cite,code,codebase,cols,colspan,contenteditable,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,wrap'
  .split(',').forEach( property => {
    nice.Tag.proto[property] = function(...a){
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


function compileStyle (div){
  return div.style
    .mapToArray((v, k) => k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + v)
    .getResult().join(';');
};


function html(){
  const z = this, tag = z.tag(), a = ['<', tag];

  z.style.size && a.push(" ", 'style="', compileStyle(z), '"');
  z.class.size && a.push(" ", 'class="', z.class().join(' '), '"');

  z.attributes.each((v, k) => is.Value(v) && a.push(" ", k , '="', v(), '"'));

  a.push('>');

  z.children.each(c => a.push(is.Tag(c) ? c.html : nice.htmlEscape(c)));

  a.push('</', tag, '>');
  return a.join('');
};


defAll(nice, {
  htmlEscape: s => (''+s).replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
});


if(nice.isEnvBrowser){
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


  function handleNode(add, del, oldNode, parent){
    let node;

    if(del && !is.Nothing(del) && !oldNode)
      throw '!oldNode';

    del && Switch(del)
      .Box.use(b => {
        b.unsubscribe(oldNode.__niceSubscription);
        oldNode.__niceSubscription = null;
      })
      .object.use(o => {
        const v = o._nv_;
        if(v.tag && add === undefined){
          killNode(oldNode);
        } else {
          _each(v.style, (_v, k) => delStyle(_v, k, oldNode));
          _each(v.attributes, (_v, k) => delAttribute(_v, k, oldNode));
          nice._eachEach(v.eventHandlers, (f, _n, k) =>
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
      if (add && add._nv_) { //full node
        const v = add._nv_;
        const newTag = v.tag;
        if(newTag){
          if(del && !is.string(del) && !is.Nothing(del)){
            node = changeTag(oldNode, newTag);
          }
          node = node || document.createElement(newTag);
          oldNode ? insertBefore(oldNode, node) : parent.appendChild(node);
        } else {
          node = oldNode;
        }
        _each(v.style, (_v, k) => addStyle(_v, k, node));
        _each(v.attributes, (_v, k) => addAttribute(_v, k, node));
        addHandlers(v.eventHandlers, node);
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
    const a = add && add._nv_ && add._nv_.children;
    const d = del && del._nv_ && del._nv_.children;
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


  Func.Tag(function show(source, parent = document.body){
    handleNode({_nv_: source.getResult()}, undefined, null, parent);
    return source;
  });


  function changeTag(old, tag){
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
