nice.block = nice.memoize(function(name, initBy){
  var type = nice.class(name);
  initBy && type.initBy(initBy);
  name === 'Div' || type.extends('Div');
  nice.define(nice.class('Div').itemProto, name, function(...a){
    var res = nice[name](...a);
    this.add(res);
    return res;
  });
  return type;
});


nice.block('Div', (z, tag) => z.tag(tag || 'div'))
  .String('tag')
  .Method(function on(name, f){
    if(name.forEach){
      name.forEach(v => this.on(v, f));
    } else {
      this._on = this._on || {};
      this._on[name] = this._on[name] || [];
      this._on[name].push(f);
      this.pane && this.pane.addEventListener(name, e => f(e, this));
    }
    return this;
  })
  .Map('style')
  .Map('attributes')
  .Array('class')
  .Array('children')
  .ReadOnly(text)
  .ReadOnly(html)
  .Method(dom)
  .Method(function error(error){
    error && this.children.replace([nice.errorPane(error)]);
  })
  .Method(function childrenBy(f){
    this.children.by(z => z.replace(f(z)));
    return this;
  })
  .Method(function show(target = document.body){
    target.appendChild(this.dom());
    return this;
  })
  .Method(function scrollTo(offset = 10){
    var pane = this.pane;
    pane && window.scrollTo(pane.offsetLeft - offset, pane.offsetTop - offset);
    return false;
  })
  .Method(function kill(){
    nice.kill(this);
    this.children.each(nice.kill);
    killNode(this.pane);
  })
  .Method(function add(...children) {
    var z = this;
    children.forEach(c => {
      if(c === undefined)
        return;

      if(nice.is.String(c) || nice.is.Number(c))
        return z.children('' + c);

      if(!c || !nice.is.Item(c) || c === z)
        return z.error('Bad child');

      c.up = z;
      z.children(c);
    });
    return z;
  });


'clear,alignContent,alignItems,alignSelf,alignmentBaseline,all,animation,animationDelay,animationDirection,animationDuration,animationFillMode,animationIterationCount,animationName,animationPlayState,animationTimingFunction,backfaceVisibility,background,backgroundAttachment,backgroundBlendMode,backgroundClip,backgroundColor,backgroundImage,backgroundOrigin,backgroundPosition,backgroundPositionX,backgroundPositionY,backgroundRepeat,backgroundRepeatX,backgroundRepeatY,backgroundSize,baselineShift,border,borderBottom,borderBottomColor,borderBottomLeftRadius,borderBottomRightRadius,borderBottomStyle,borderBottomWidth,borderCollapse,borderColor,borderImage,borderImageOutset,borderImageRepeat,borderImageSlice,borderImageSource,borderImageWidth,borderLeft,borderLeftColor,borderLeftStyle,borderLeftWidth,borderRadius,borderRight,borderRightColor,borderRightStyle,borderRightWidth,borderSpacing,borderStyle,borderTop,borderTopColor,borderTopLeftRadius,borderTopRightRadius,borderTopStyle,borderTopWidth,borderWidth,bottom,boxShadow,boxSizing,breakAfter,breakBefore,breakInside,bufferedRendering,captionSide,clip,clipPath,clipRule,color,colorInterpolation,colorInterpolationFilters,colorRendering,columnCount,columnFill,columnGap,columnRule,columnRuleColor,columnRuleStyle,columnRuleWidth,columnSpan,columnWidth,columns,content,counterIncrement,counterReset,cursor,cx,cy,direction,display,dominantBaseline,emptyCells,fill,fillOpacity,fillRule,filter,flex,flexBasis,flexDirection,flexFlow,flexGrow,flexShrink,flexWrap,float,floodColor,floodOpacity,font,fontFamily,fontFeatureSettings,fontKerning,fontSize,fontStretch,fontStyle,fontVariant,fontVariantLigatures,fontWeight,height,imageRendering,isolation,justifyContent,left,letterSpacing,lightingColor,lineHeight,listStyle,listStyleImage,listStylePosition,listStyleType,margin,marginBottom,marginLeft,marginRight,marginTop,marker,markerEnd,markerMid,markerStart,mask,maskType,maxHeight,maxWidth,maxZoom,minHeight,minWidth,minZoom,mixBlendMode,motion,motionOffset,motionPath,motionRotation,objectFit,objectPosition,opacity,order,orientation,orphans,outline,outlineColor,outlineOffset,outlineStyle,outlineWidth,overflow,overflowWrap,overflowX,overflowY,padding,paddingBottom,paddingLeft,paddingRight,paddingTop,page,pageBreakAfter,pageBreakBefore,pageBreakInside,paintOrder,perspective,perspectiveOrigin,pointerEvents,position,quotes,r,resize,right,rx,ry,shapeImageThreshold,shapeMargin,shapeOutside,shapeRendering,size,speak,stopColor,stopOpacity,stroke,strokeDasharray,strokeDashoffset,strokeLinecap,strokeLinejoin,strokeMiterlimit,strokeOpacity,strokeWidth,tabSize,tableLayout,textAlign,textAlignLast,textAnchor,textCombineUpright,textDecoration,textIndent,textOrientation,textOverflow,textRendering,textShadow,textTransform,top,touchAction,transform,transformOrigin,transformStyle,transition,transitionDelay,transitionDuration,transitionProperty,transitionTimingFunction,unicodeBidi,unicodeRange,userZoom,vectorEffect,verticalAlign,visibility,whiteSpace,widows,width,willChange,wordBreak,wordSpacing,wordWrap,writingMode,x,y,zIndex,zoom'
  .split(',').forEach( property => {
    Object.defineProperty(nice.class('Div').itemProto, property, {
      get: function(){
        return (...a) => {
          nice.is.Object(a[0])
            ? nice.each(
                (v, k) => this.style(property + k[0].toUpperCase() + k.substr(1), v),
                a[0]
              )
            : this.style(property, nice.format(...a));
          return this;
        }
      },
      set: function(){
        this.error('Please use "property(value)" notation to set css value');
      }
    });
    Object.defineProperty(nice.class('Div').itemProto, property + 'By', {
      get: function(){
        return (f) => {
          nice.String().by(f).listenBy(z => this.style(property, z()));
          return this;
        };
      }
    });
  });

'accept,accesskey,action,align,alt,async,autocomplete,autofocus,autoplay,autosave,bgcolor,buffered,challenge,charset,checked,cite,code,codebase,cols,colspan,contenteditable,contextmenu,controls,coords,crossorigin,data,datetime,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,for,form,formaction,headers,hidden,high,href,hreflang,icon,id,integrity,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,manifest,max,maxlength,media,method,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,seamless,selected,shape,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,summary,tabindex,target,title,type,usemap,value,wrap'
  .split(',').forEach( property => {
    nice.class('Div').itemProto[property] ||
      Object.defineProperty(nice.class('Div').itemProto, property, {
        get: function() {
          return (...a) => {
            this.attributes(property, nice.format(...a));
            return this;
          };
        }
      });
  });


function text(){
  var div = this;
  return nice.item().by(z => z((div.actualChildren || div.children)
      .map(v => v.text ? v.text() : nice.htmlEscape(v))()
      .join(''))
  );
};


nice.compileStyle = function(div){
  return div.style
    .mapArray((v, k) => k.replace(/([A-Z])/g, "-$1").toLowerCase() + ':' + v)()
    .join(';');
};


function html(){
  var div = this;
  return nice.String().by(z => {
    z.try(div);
    var children = div.actualChildren || div.children;
    var tag = div.tag();
    var a = ['<', tag];

    div.style.size() && div.attributes('style', nice.compileStyle(div));
    div.class.size() && div.attributes('class', div.class().join(' '));

    div.attributes.each((v, k) => a.push(" ", k , '="', v, '"'));

    a.push('>');

    children.each(c => {
      if(nice.is.Item(c)){
        a.push(c.html ? c.html() : c());
      } else {
        a.push(nice.htmlEscape(c));
      }
    });

    a.push('</', tag, '>');
    z(a.join(''));
  });
};


function childToDom(c){
  if(c.nodeType > 0)
    return c;

  if(c.pane)
    return c.pane;

  if(nice.is.String(c) || nice.is.Number(c))
    return document.createTextNode('' + c);

  if(c.dom)
    return c.dom();

  if(nice.is.Item(c)){
    var res = document.createTextNode('');
    c.listenBy(() => res.textContent = '' + c());
    return res;
  }

  nice.error('Bad child', c);
  return document.createTextNode('' + c);
}


nice.block('Div').Method(function bindPane(pane){
  var classes = this.class();
  classes.length && (pane.className = classes.join(' '));
  this.style.onEach((v, k) => pane.style[k] = v);

  nice.eachEach((f, n, type) => {
    pane.addEventListener(type, e => f(e, this));
  }, this._on);

  this.attributes
    .onEach((v, k) => pane[k] = v)
    .onRemove((v, k) => delete pane[k]);

  this.style
    .onEach((v, k) => pane.style[k] = v)
    .onRemove((v, k) => delete pane.style[k]);

  (this.actualChildren || this.children)
    .onEach((c, i) => {
      var child = childToDom(c);
      pane.insertBefore(child, pane.childNodes[i]);
    })
    .onRemove((c, i) => {
      c.kill && c.kill();
      killNode(pane.childNodes[i]);
    });
});


function dom(){
  var z = this;

  if(z.pane)
    return z.pane;

  z.listenBy(() => {});

  var pane = z.pane = document.createElement(z.tag());
  z.bindPane(pane);
  z.isFocused && setTimeout(() => z.pane.focus(), 50);
  return pane;
};

nice.defineAll(nice, {
  htmlEscape: function(s){
    return (''+s).replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  errorPane: e => nice.Div().color('red').add('Error: ' + (e.message || e))
});


var killNode = e => e && e.parentNode && e.parentNode.removeChild(e);


nice.Div.wrapParts = function(text, pattern){
  var reArray = [pattern];
  var re = new RegExp('\\b('+reArray.join('|')+')\\b', 'gi');
  return text.replace(re, '<b>$1</b>');
};