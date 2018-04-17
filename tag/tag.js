def(nice, 'Block', (name, by) => {
  const cfg = nice.Type(name);
  by && cfg.by(by);
  name === 'Tag' || cfg.extends('Tag');
  nice.Tag.proto[name] = function (...a){
    const res = nice[name](...a);
    this.add(res);
    return res;
  };
  return cfg;
});

nice.Block('Tag', (z, tag) => z.tag(tag || 'div'))
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
      .replace(/>/g, '&gt;'),

});


const set = (o, path, v) => {
  let i = 0;
  let last = path.length - 1;
  for(let i = 0; i < last; i++){
    o = (o[path[i]] = o[path[i]] || {});
  }
  o[path[last]] = v;
};



if(nice.isEnvBrowser){
  const addStyle = Switch
    .Box.use((s, k, node) => {
      const f = v => addStyle(v, k, node);
      s.listen(f);
      set(node, ['styleSubscriptions', k], () => s.unsubscribe(f));
    })
    .default.use((v, k, node) => node.style[k] = v);

  const delStyle = Switch
    .Box.use((s, k, node) => {
      node.styleSubscriptions[k]();
      delete node.styleSubscriptions[k];
      node.style[k] = '';
    })
    .default.use((v, k, node) => node.style[k] = '');


  const addAttribute = Switch
    .Box.use((s, k, node) => {
      const f = v => addAttribute(v, k, node);
      s.listen(f);
      set(node, ['attrSubscriptions', k], () => s.unsubscribe(f));
    })
    .default.use((v, k, node) => node[k] = v);

  const delAttribute = Switch
    .Box.use((s, k, node) => {
      node.attrSubscriptions[k]();
      delete node.attrSubscriptions[k];
      node[k] = '';
    })
    .default.use((v, k, node) => node[k] = '');


  function handleNode(add, del, parent, i = parent.childNodes.length){
    const oldNode = parent.childNodes[i];
    let node;

    Switch(del)
      .Box.use(b => {
        b.unsubscribe(parent.subscriptions[i]);
        parent.subscriptions[i] = null;
      })
      .object.use(o => {
        const v = o._nv_;
        _each(v.style, (_v, k) => delStyle(_v, k, oldNode));
        _each(v.attributes, (_v, k) => delAttribute(_v, k, oldNode));
        nice._eachEach(v.eventHandlers, (f, _n, k) => oldNode.removeEventListener(k, f, true));
        nice.reverseEach(v.children || [], (v, k) => {
          Switch(v)
            .object.use(o => o._nv_ && o._nv_.tag && !add)
            .default.use(() => !add)
              && oldNode.removeChild(oldNode.childNodes[k]);
        });
      })
      .default.use(t => add || t && oldNode && parent.removeChild(oldNode));


    if(is.Box(add)) {
      const f = () => {
        const diff = add.getDiff();
        handleNode(diff.add, diff.del, parent, i);
      };
      add.listen(f);
      set(parent, ['subscriptions', i], f);
    } else if(add) {
      if (add._nv_) {//node
        const v = add._nv_;
        const newTag = v.tag;
        if(newTag){
          if(del && is.string(del)){
            throw `Can't change existing tag name`;
          }
          node = node || document.createElement(newTag);
          parent.insertBefore(node, oldNode);
        } else {
          node = oldNode;
        }
        _each(v.style, (_v, k) => addStyle(_v, k, node));
        _each(v.attributes, (_v, k) => addAttribute(_v, k, node));
        nice._eachEach(v.eventHandlers, (f, _n, k) => k === 'domNode'
          ? f(node) : node.addEventListener(k, f, true));
        handleChildren(add, del, node);
      } else {
        const text = is.Nothing(add) ? '' : '' + add;
        node = parent.insertBefore(document.createTextNode(text), oldNode);
      }
      oldNode && (oldNode !== node) && parent.removeChild(oldNode);
    }
  }


  function handleChildren(add, del, target){
    const a = add && add._nv_ && add._nv_.children;
    const d = del && del._nv_ && del._nv_.children;
    const f = (v, k) => handleNode(a && a[k], d && d[k], target, k);
    _each(a, f);
    _each(d, f);
  };


  Func.Box(function show(source, parent = document.body){
    const i = parent.childNodes.length;
    source.listenDiff(diff => handleNode(diff.add, diff.del, parent, i));
    return source;
  });


  function newNode(tag, parent = document.body){
    return parent.appendChild(document.createElement(tag));
  };


  Func.Tag(function show(source, parent = document.body){
    handleNode({_nv_: source.getResult()}, undefined, parent);
    return source;
  });
};
