import{R as N,G as P,j as i,r as b,n as en,J as nn,K as Jn,O as Mt,Q as Zn,V as zt}from"./index-FDuPggmr.js";import{u as Pt,w as V,a as an,S as Qn,A as ta,C as ea}from"./useSubscription-D8wRsjCn.js";import{GiftedChat as ve}from"react-native-gifted-chat";import{B as Se}from"./Button-C1BsRgvR.js";/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */function na(t,e,n){return(e=ra(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function Ce(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);e&&(a=a.filter(function(r){return Object.getOwnPropertyDescriptor(t,r).enumerable})),n.push.apply(n,a)}return n}function u(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?Ce(Object(n),!0).forEach(function(a){na(t,a,n[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):Ce(Object(n)).forEach(function(a){Object.defineProperty(t,a,Object.getOwnPropertyDescriptor(n,a))})}return t}function aa(t,e){if(typeof t!="object"||!t)return t;var n=t[Symbol.toPrimitive];if(n!==void 0){var a=n.call(t,e);if(typeof a!="object")return a;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}function ra(t){var e=aa(t,"string");return typeof e=="symbol"?e:e+""}const we=()=>{};let le={},rn={},on=null,sn={mark:we,measure:we};try{typeof window<"u"&&(le=window),typeof document<"u"&&(rn=document),typeof MutationObserver<"u"&&(on=MutationObserver),typeof performance<"u"&&(sn=performance)}catch{}const{userAgent:ke=""}=le.navigator||{},J=le,I=rn,Pe=on,yt=sn;J.document;const q=!!I.documentElement&&!!I.head&&typeof I.addEventListener=="function"&&typeof I.createElement=="function",ln=~ke.indexOf("MSIE")||~ke.indexOf("Trident/");var oa=/fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/,sa=/Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i,cn={classic:{fa:"solid",fas:"solid","fa-solid":"solid",far:"regular","fa-regular":"regular",fal:"light","fa-light":"light",fat:"thin","fa-thin":"thin",fab:"brands","fa-brands":"brands"},duotone:{fa:"solid",fad:"solid","fa-solid":"solid","fa-duotone":"solid",fadr:"regular","fa-regular":"regular",fadl:"light","fa-light":"light",fadt:"thin","fa-thin":"thin"},sharp:{fa:"solid",fass:"solid","fa-solid":"solid",fasr:"regular","fa-regular":"regular",fasl:"light","fa-light":"light",fast:"thin","fa-thin":"thin"},"sharp-duotone":{fa:"solid",fasds:"solid","fa-solid":"solid",fasdr:"regular","fa-regular":"regular",fasdl:"light","fa-light":"light",fasdt:"thin","fa-thin":"thin"}},ia={GROUP:"duotone-group",PRIMARY:"primary",SECONDARY:"secondary"},fn=["fa-classic","fa-duotone","fa-sharp","fa-sharp-duotone"],D="classic",jt="duotone",la="sharp",ca="sharp-duotone",un=[D,jt,la,ca],fa={classic:{900:"fas",400:"far",normal:"far",300:"fal",100:"fat"},duotone:{900:"fad",400:"fadr",300:"fadl",100:"fadt"},sharp:{900:"fass",400:"fasr",300:"fasl",100:"fast"},"sharp-duotone":{900:"fasds",400:"fasdr",300:"fasdl",100:"fasdt"}},ua={"Font Awesome 6 Free":{900:"fas",400:"far"},"Font Awesome 6 Pro":{900:"fas",400:"far",normal:"far",300:"fal",100:"fat"},"Font Awesome 6 Brands":{400:"fab",normal:"fab"},"Font Awesome 6 Duotone":{900:"fad",400:"fadr",normal:"fadr",300:"fadl",100:"fadt"},"Font Awesome 6 Sharp":{900:"fass",400:"fasr",normal:"fasr",300:"fasl",100:"fast"},"Font Awesome 6 Sharp Duotone":{900:"fasds",400:"fasdr",normal:"fasdr",300:"fasdl",100:"fasdt"}},da=new Map([["classic",{defaultShortPrefixId:"fas",defaultStyleId:"solid",styleIds:["solid","regular","light","thin","brands"],futureStyleIds:[],defaultFontWeight:900}],["sharp",{defaultShortPrefixId:"fass",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["duotone",{defaultShortPrefixId:"fad",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["sharp-duotone",{defaultShortPrefixId:"fasds",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}]]),ma={classic:{solid:"fas",regular:"far",light:"fal",thin:"fat",brands:"fab"},duotone:{solid:"fad",regular:"fadr",light:"fadl",thin:"fadt"},sharp:{solid:"fass",regular:"fasr",light:"fasl",thin:"fast"},"sharp-duotone":{solid:"fasds",regular:"fasdr",light:"fasdl",thin:"fasdt"}},ha=["fak","fa-kit","fakd","fa-kit-duotone"],je={kit:{fak:"kit","fa-kit":"kit"},"kit-duotone":{fakd:"kit-duotone","fa-kit-duotone":"kit-duotone"}},pa=["kit"],ga={kit:{"fa-kit":"fak"}},ya=["fak","fakd"],ba={kit:{fak:"fa-kit"}},Ae={kit:{kit:"fak"},"kit-duotone":{"kit-duotone":"fakd"}},bt={GROUP:"duotone-group",SWAP_OPACITY:"swap-opacity",PRIMARY:"primary",SECONDARY:"secondary"},xa=["fa-classic","fa-duotone","fa-sharp","fa-sharp-duotone"],va=["fak","fa-kit","fakd","fa-kit-duotone"],Sa={"Font Awesome Kit":{400:"fak",normal:"fak"},"Font Awesome Kit Duotone":{400:"fakd",normal:"fakd"}},Ca={classic:{"fa-brands":"fab","fa-duotone":"fad","fa-light":"fal","fa-regular":"far","fa-solid":"fas","fa-thin":"fat"},duotone:{"fa-regular":"fadr","fa-light":"fadl","fa-thin":"fadt"},sharp:{"fa-solid":"fass","fa-regular":"fasr","fa-light":"fasl","fa-thin":"fast"},"sharp-duotone":{"fa-solid":"fasds","fa-regular":"fasdr","fa-light":"fasdl","fa-thin":"fasdt"}},wa={classic:["fas","far","fal","fat","fad"],duotone:["fadr","fadl","fadt"],sharp:["fass","fasr","fasl","fast"],"sharp-duotone":["fasds","fasdr","fasdl","fasdt"]},Bt={classic:{fab:"fa-brands",fad:"fa-duotone",fal:"fa-light",far:"fa-regular",fas:"fa-solid",fat:"fa-thin"},duotone:{fadr:"fa-regular",fadl:"fa-light",fadt:"fa-thin"},sharp:{fass:"fa-solid",fasr:"fa-regular",fasl:"fa-light",fast:"fa-thin"},"sharp-duotone":{fasds:"fa-solid",fasdr:"fa-regular",fasdl:"fa-light",fasdt:"fa-thin"}},ka=["fa-solid","fa-regular","fa-light","fa-thin","fa-duotone","fa-brands"],Ut=["fa","fas","far","fal","fat","fad","fadr","fadl","fadt","fab","fass","fasr","fasl","fast","fasds","fasdr","fasdl","fasdt",...xa,...ka],Pa=["solid","regular","light","thin","duotone","brands"],dn=[1,2,3,4,5,6,7,8,9,10],ja=dn.concat([11,12,13,14,15,16,17,18,19,20]),Aa=[...Object.keys(wa),...Pa,"2xs","xs","sm","lg","xl","2xl","beat","border","fade","beat-fade","bounce","flip-both","flip-horizontal","flip-vertical","flip","fw","inverse","layers-counter","layers-text","layers","li","pull-left","pull-right","pulse","rotate-180","rotate-270","rotate-90","rotate-by","shake","spin-pulse","spin-reverse","spin","stack-1x","stack-2x","stack","ul",bt.GROUP,bt.SWAP_OPACITY,bt.PRIMARY,bt.SECONDARY].concat(dn.map(t=>"".concat(t,"x"))).concat(ja.map(t=>"w-".concat(t))),Ta={"Font Awesome 5 Free":{900:"fas",400:"far"},"Font Awesome 5 Pro":{900:"fas",400:"far",normal:"far",300:"fal"},"Font Awesome 5 Brands":{400:"fab",normal:"fab"},"Font Awesome 5 Duotone":{900:"fad"}};const G="___FONT_AWESOME___",Vt=16,mn="fa",hn="svg-inline--fa",et="data-fa-i2svg",$t="data-fa-pseudo-element",Oa="data-fa-pseudo-element-pending",ce="data-prefix",fe="data-icon",Te="fontawesome-i2svg",Ia="async",Ea=["HTML","HEAD","STYLE","SCRIPT"],pn=(()=>{try{return!0}catch{return!1}})();function pt(t){return new Proxy(t,{get(e,n){return n in e?e[n]:e[D]}})}const gn=u({},cn);gn[D]=u(u(u(u({},{"fa-duotone":"duotone"}),cn[D]),je.kit),je["kit-duotone"]);const Na=pt(gn),Yt=u({},ma);Yt[D]=u(u(u(u({},{duotone:"fad"}),Yt[D]),Ae.kit),Ae["kit-duotone"]);const Oe=pt(Yt),Ht=u({},Bt);Ht[D]=u(u({},Ht[D]),ba.kit);const ue=pt(Ht),Gt=u({},Ca);Gt[D]=u(u({},Gt[D]),ga.kit);pt(Gt);const Ma=oa,yn="fa-layers-text",za=sa,La=u({},fa);pt(La);const Da=["class","data-prefix","data-icon","data-fa-transform","data-fa-mask"],Lt=ia,Fa=[...pa,...Aa],ut=J.FontAwesomeConfig||{};function _a(t){var e=I.querySelector("script["+t+"]");if(e)return e.getAttribute(t)}function Ra(t){return t===""?!0:t==="false"?!1:t==="true"?!0:t}I&&typeof I.querySelector=="function"&&[["data-family-prefix","familyPrefix"],["data-css-prefix","cssPrefix"],["data-family-default","familyDefault"],["data-style-default","styleDefault"],["data-replacement-class","replacementClass"],["data-auto-replace-svg","autoReplaceSvg"],["data-auto-add-css","autoAddCss"],["data-auto-a11y","autoA11y"],["data-search-pseudo-elements","searchPseudoElements"],["data-observe-mutations","observeMutations"],["data-mutate-approach","mutateApproach"],["data-keep-original-source","keepOriginalSource"],["data-measure-performance","measurePerformance"],["data-show-missing-icons","showMissingIcons"]].forEach(e=>{let[n,a]=e;const r=Ra(_a(n));r!=null&&(ut[a]=r)});const bn={styleDefault:"solid",familyDefault:D,cssPrefix:mn,replacementClass:hn,autoReplaceSvg:!0,autoAddCss:!0,autoA11y:!0,searchPseudoElements:!1,observeMutations:!0,mutateApproach:"async",keepOriginalSource:!0,measurePerformance:!1,showMissingIcons:!0};ut.familyPrefix&&(ut.cssPrefix=ut.familyPrefix);const it=u(u({},bn),ut);it.autoReplaceSvg||(it.observeMutations=!1);const p={};Object.keys(bn).forEach(t=>{Object.defineProperty(p,t,{enumerable:!0,set:function(e){it[t]=e,dt.forEach(n=>n(p))},get:function(){return it[t]}})});Object.defineProperty(p,"familyPrefix",{enumerable:!0,set:function(t){it.cssPrefix=t,dt.forEach(e=>e(p))},get:function(){return it.cssPrefix}});J.FontAwesomeConfig=p;const dt=[];function Wa(t){return dt.push(t),()=>{dt.splice(dt.indexOf(t),1)}}const K=Vt,Y={size:16,x:0,y:0,rotate:0,flipX:!1,flipY:!1};function Ba(t){if(!t||!q)return;const e=I.createElement("style");e.setAttribute("type","text/css"),e.innerHTML=t;const n=I.head.childNodes;let a=null;for(let r=n.length-1;r>-1;r--){const o=n[r],s=(o.tagName||"").toUpperCase();["STYLE","LINK"].indexOf(s)>-1&&(a=o)}return I.head.insertBefore(e,a),t}const Ua="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";function mt(){let t=12,e="";for(;t-- >0;)e+=Ua[Math.random()*62|0];return e}function lt(t){const e=[];for(let n=(t||[]).length>>>0;n--;)e[n]=t[n];return e}function de(t){return t.classList?lt(t.classList):(t.getAttribute("class")||"").split(" ").filter(e=>e)}function xn(t){return"".concat(t).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Va(t){return Object.keys(t||{}).reduce((e,n)=>e+"".concat(n,'="').concat(xn(t[n]),'" '),"").trim()}function At(t){return Object.keys(t||{}).reduce((e,n)=>e+"".concat(n,": ").concat(t[n].trim(),";"),"")}function me(t){return t.size!==Y.size||t.x!==Y.x||t.y!==Y.y||t.rotate!==Y.rotate||t.flipX||t.flipY}function $a(t){let{transform:e,containerWidth:n,iconWidth:a}=t;const r={transform:"translate(".concat(n/2," 256)")},o="translate(".concat(e.x*32,", ").concat(e.y*32,") "),s="scale(".concat(e.size/16*(e.flipX?-1:1),", ").concat(e.size/16*(e.flipY?-1:1),") "),l="rotate(".concat(e.rotate," 0 0)"),c={transform:"".concat(o," ").concat(s," ").concat(l)},f={transform:"translate(".concat(a/2*-1," -256)")};return{outer:r,inner:c,path:f}}function Ya(t){let{transform:e,width:n=Vt,height:a=Vt,startCentered:r=!1}=t,o="";return r&&ln?o+="translate(".concat(e.x/K-n/2,"em, ").concat(e.y/K-a/2,"em) "):r?o+="translate(calc(-50% + ".concat(e.x/K,"em), calc(-50% + ").concat(e.y/K,"em)) "):o+="translate(".concat(e.x/K,"em, ").concat(e.y/K,"em) "),o+="scale(".concat(e.size/K*(e.flipX?-1:1),", ").concat(e.size/K*(e.flipY?-1:1),") "),o+="rotate(".concat(e.rotate,"deg) "),o}var Ha=`:root, :host {
  --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";
  --fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";
  --fa-font-light: normal 300 1em/1 "Font Awesome 6 Pro";
  --fa-font-thin: normal 100 1em/1 "Font Awesome 6 Pro";
  --fa-font-duotone: normal 900 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 6 Duotone";
  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 6 Duotone";
  --fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";
  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 6 Sharp";
  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 6 Sharp Duotone";
  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 6 Sharp Duotone";
}

svg:not(:root).svg-inline--fa, svg:not(:host).svg-inline--fa {
  overflow: visible;
  box-sizing: content-box;
}

.svg-inline--fa {
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285705em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left {
  margin-right: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-pull-right {
  margin-left: var(--fa-pull-margin, 0.3em);
  width: auto;
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  top: 0.25em;
}
.svg-inline--fa.fa-fw {
  width: var(--fa-fw-width, 1.25em);
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}
.fa-layers svg.svg-inline--fa {
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: 0.625em;
  line-height: 0.1em;
  vertical-align: 0.225em;
}

.fa-xs {
  font-size: 0.75em;
  line-height: 0.0833333337em;
  vertical-align: 0.125em;
}

.fa-sm {
  font-size: 0.875em;
  line-height: 0.0714285718em;
  vertical-align: 0.0535714295em;
}

.fa-lg {
  font-size: 1.25em;
  line-height: 0.05em;
  vertical-align: -0.075em;
}

.fa-xl {
  font-size: 1.5em;
  line-height: 0.0416666682em;
  vertical-align: -0.125em;
}

.fa-2xl {
  font-size: 2em;
  line-height: 0.03125em;
  vertical-align: -0.1875em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: var(--fa-li-margin, 2.5em);
  padding-left: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  left: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.08em);
  padding: var(--fa-border-padding, 0.2em 0.25em 0.15em);
}

.fa-pull-left {
  float: left;
  margin-right: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right {
  float: right;
  margin-left: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
.fa-bounce,
.fa-fade,
.fa-beat-fade,
.fa-flip,
.fa-pulse,
.fa-shake,
.fa-spin,
.fa-spin-pulse {
    animation-delay: -1ms;
    animation-duration: 1ms;
    animation-iteration-count: 1;
    transition-delay: 0s;
    transition-duration: 0s;
  }
}
@keyframes fa-beat {
  0%, 90% {
    transform: scale(1);
  }
  45% {
    transform: scale(var(--fa-beat-scale, 1.25));
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
  }
  10% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);
  }
  30% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));
  }
  50% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);
  }
  57% {
    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));
  }
  64% {
    transform: scale(1, 1) translateY(0);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  50% {
    opacity: var(--fa-fade-opacity, 0.4);
  }
}
@keyframes fa-beat-fade {
  0%, 100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.125));
  }
}
@keyframes fa-flip {
  50% {
    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(-15deg);
  }
  4% {
    transform: rotate(15deg);
  }
  8%, 24% {
    transform: rotate(-18deg);
  }
  12%, 28% {
    transform: rotate(18deg);
  }
  16% {
    transform: rotate(-22deg);
  }
  20% {
    transform: rotate(22deg);
  }
  32% {
    transform: rotate(-12deg);
  }
  36% {
    transform: rotate(12deg);
  }
  40%, 100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.fa-stack {
  display: inline-block;
  vertical-align: middle;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
  z-index: var(--fa-stack-z-index, auto);
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}
.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.sr-only,
.fa-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:not(:focus),
.fa-sr-only-focusable:not(:focus) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}`;function vn(){const t=mn,e=hn,n=p.cssPrefix,a=p.replacementClass;let r=Ha;if(n!==t||a!==e){const o=new RegExp("\\.".concat(t,"\\-"),"g"),s=new RegExp("\\--".concat(t,"\\-"),"g"),l=new RegExp("\\.".concat(e),"g");r=r.replace(o,".".concat(n,"-")).replace(s,"--".concat(n,"-")).replace(l,".".concat(a))}return r}let Ie=!1;function Dt(){p.autoAddCss&&!Ie&&(Ba(vn()),Ie=!0)}var Ga={mixout(){return{dom:{css:vn,insertCss:Dt}}},hooks(){return{beforeDOMElementCreation(){Dt()},beforeI2svg(){Dt()}}}};const X=J||{};X[G]||(X[G]={});X[G].styles||(X[G].styles={});X[G].hooks||(X[G].hooks={});X[G].shims||(X[G].shims=[]);var H=X[G];const Sn=[],Cn=function(){I.removeEventListener("DOMContentLoaded",Cn),Ct=1,Sn.map(t=>t())};let Ct=!1;q&&(Ct=(I.documentElement.doScroll?/^loaded|^c/:/^loaded|^i|^c/).test(I.readyState),Ct||I.addEventListener("DOMContentLoaded",Cn));function Xa(t){q&&(Ct?setTimeout(t,0):Sn.push(t))}function gt(t){const{tag:e,attributes:n={},children:a=[]}=t;return typeof t=="string"?xn(t):"<".concat(e," ").concat(Va(n),">").concat(a.map(gt).join(""),"</").concat(e,">")}function Ee(t,e,n){if(t&&t[e]&&t[e][n])return{prefix:e,iconName:n,icon:t[e][n]}}var Ft=function(e,n,a,r){var o=Object.keys(e),s=o.length,l=n,c,f,d;for(a===void 0?(c=1,d=e[o[0]]):(c=0,d=a);c<s;c++)f=o[c],d=l(d,e[f],f,e);return d};function qa(t){const e=[];let n=0;const a=t.length;for(;n<a;){const r=t.charCodeAt(n++);if(r>=55296&&r<=56319&&n<a){const o=t.charCodeAt(n++);(o&64512)==56320?e.push(((r&1023)<<10)+(o&1023)+65536):(e.push(r),n--)}else e.push(r)}return e}function Xt(t){const e=qa(t);return e.length===1?e[0].toString(16):null}function Ka(t,e){const n=t.length;let a=t.charCodeAt(e),r;return a>=55296&&a<=56319&&n>e+1&&(r=t.charCodeAt(e+1),r>=56320&&r<=57343)?(a-55296)*1024+r-56320+65536:a}function Ne(t){return Object.keys(t).reduce((e,n)=>{const a=t[n];return!!a.icon?e[a.iconName]=a.icon:e[n]=a,e},{})}function qt(t,e){let n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{};const{skipHooks:a=!1}=n,r=Ne(e);typeof H.hooks.addPack=="function"&&!a?H.hooks.addPack(t,Ne(e)):H.styles[t]=u(u({},H.styles[t]||{}),r),t==="fas"&&qt("fa",e)}const{styles:ht,shims:Ja}=H,wn=Object.keys(ue),Za=wn.reduce((t,e)=>(t[e]=Object.keys(ue[e]),t),{});let he=null,kn={},Pn={},jn={},An={},Tn={};function Qa(t){return~Fa.indexOf(t)}function tr(t,e){const n=e.split("-"),a=n[0],r=n.slice(1).join("-");return a===t&&r!==""&&!Qa(r)?r:null}const On=()=>{const t=a=>Ft(ht,(r,o,s)=>(r[s]=Ft(o,a,{}),r),{});kn=t((a,r,o)=>(r[3]&&(a[r[3]]=o),r[2]&&r[2].filter(l=>typeof l=="number").forEach(l=>{a[l.toString(16)]=o}),a)),Pn=t((a,r,o)=>(a[o]=o,r[2]&&r[2].filter(l=>typeof l=="string").forEach(l=>{a[l]=o}),a)),Tn=t((a,r,o)=>{const s=r[2];return a[o]=o,s.forEach(l=>{a[l]=o}),a});const e="far"in ht||p.autoFetchSvg,n=Ft(Ja,(a,r)=>{const o=r[0];let s=r[1];const l=r[2];return s==="far"&&!e&&(s="fas"),typeof o=="string"&&(a.names[o]={prefix:s,iconName:l}),typeof o=="number"&&(a.unicodes[o.toString(16)]={prefix:s,iconName:l}),a},{names:{},unicodes:{}});jn=n.names,An=n.unicodes,he=Tt(p.styleDefault,{family:p.familyDefault})};Wa(t=>{he=Tt(t.styleDefault,{family:p.familyDefault})});On();function pe(t,e){return(kn[t]||{})[e]}function er(t,e){return(Pn[t]||{})[e]}function tt(t,e){return(Tn[t]||{})[e]}function In(t){return jn[t]||{prefix:null,iconName:null}}function nr(t){const e=An[t],n=pe("fas",t);return e||(n?{prefix:"fas",iconName:n}:null)||{prefix:null,iconName:null}}function Z(){return he}const En=()=>({prefix:null,iconName:null,rest:[]});function ar(t){let e=D;const n=wn.reduce((a,r)=>(a[r]="".concat(p.cssPrefix,"-").concat(r),a),{});return un.forEach(a=>{(t.includes(n[a])||t.some(r=>Za[a].includes(r)))&&(e=a)}),e}function Tt(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};const{family:n=D}=e,a=Na[n][t];if(n===jt&&!t)return"fad";const r=Oe[n][t]||Oe[n][a],o=t in H.styles?t:null;return r||o||null}function rr(t){let e=[],n=null;return t.forEach(a=>{const r=tr(p.cssPrefix,a);r?n=r:a&&e.push(a)}),{iconName:n,rest:e}}function Me(t){return t.sort().filter((e,n,a)=>a.indexOf(e)===n)}function Ot(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};const{skipLookups:n=!1}=e;let a=null;const r=Ut.concat(va),o=Me(t.filter(g=>r.includes(g))),s=Me(t.filter(g=>!Ut.includes(g))),l=o.filter(g=>(a=g,!fn.includes(g))),[c=null]=l,f=ar(o),d=u(u({},rr(s)),{},{prefix:Tt(c,{family:f})});return u(u(u({},d),lr({values:t,family:f,styles:ht,config:p,canonical:d,givenPrefix:a})),or(n,a,d))}function or(t,e,n){let{prefix:a,iconName:r}=n;if(t||!a||!r)return{prefix:a,iconName:r};const o=e==="fa"?In(r):{},s=tt(a,r);return r=o.iconName||s||r,a=o.prefix||a,a==="far"&&!ht.far&&ht.fas&&!p.autoFetchSvg&&(a="fas"),{prefix:a,iconName:r}}const sr=un.filter(t=>t!==D||t!==jt),ir=Object.keys(Bt).filter(t=>t!==D).map(t=>Object.keys(Bt[t])).flat();function lr(t){const{values:e,family:n,canonical:a,givenPrefix:r="",styles:o={},config:s={}}=t,l=n===jt,c=e.includes("fa-duotone")||e.includes("fad"),f=s.familyDefault==="duotone",d=a.prefix==="fad"||a.prefix==="fa-duotone";if(!l&&(c||f||d)&&(a.prefix="fad"),(e.includes("fa-brands")||e.includes("fab"))&&(a.prefix="fab"),!a.prefix&&sr.includes(n)&&(Object.keys(o).find(m=>ir.includes(m))||s.autoFetchSvg)){const m=da.get(n).defaultShortPrefixId;a.prefix=m,a.iconName=tt(a.prefix,a.iconName)||a.iconName}return(a.prefix==="fa"||r==="fa")&&(a.prefix=Z()||"fas"),a}class cr{constructor(){this.definitions={}}add(){for(var e=arguments.length,n=new Array(e),a=0;a<e;a++)n[a]=arguments[a];const r=n.reduce(this._pullDefinitions,{});Object.keys(r).forEach(o=>{this.definitions[o]=u(u({},this.definitions[o]||{}),r[o]),qt(o,r[o]);const s=ue[D][o];s&&qt(s,r[o]),On()})}reset(){this.definitions={}}_pullDefinitions(e,n){const a=n.prefix&&n.iconName&&n.icon?{0:n}:n;return Object.keys(a).map(r=>{const{prefix:o,iconName:s,icon:l}=a[r],c=l[2];e[o]||(e[o]={}),c.length>0&&c.forEach(f=>{typeof f=="string"&&(e[o][f]=l)}),e[o][s]=l}),e}}let ze=[],rt={};const st={},fr=Object.keys(st);function ur(t,e){let{mixoutsTo:n}=e;return ze=t,rt={},Object.keys(st).forEach(a=>{fr.indexOf(a)===-1&&delete st[a]}),ze.forEach(a=>{const r=a.mixout?a.mixout():{};if(Object.keys(r).forEach(o=>{typeof r[o]=="function"&&(n[o]=r[o]),typeof r[o]=="object"&&Object.keys(r[o]).forEach(s=>{n[o]||(n[o]={}),n[o][s]=r[o][s]})}),a.hooks){const o=a.hooks();Object.keys(o).forEach(s=>{rt[s]||(rt[s]=[]),rt[s].push(o[s])})}a.provides&&a.provides(st)}),n}function Kt(t,e){for(var n=arguments.length,a=new Array(n>2?n-2:0),r=2;r<n;r++)a[r-2]=arguments[r];return(rt[t]||[]).forEach(s=>{e=s.apply(null,[e,...a])}),e}function nt(t){for(var e=arguments.length,n=new Array(e>1?e-1:0),a=1;a<e;a++)n[a-1]=arguments[a];(rt[t]||[]).forEach(o=>{o.apply(null,n)})}function Q(){const t=arguments[0],e=Array.prototype.slice.call(arguments,1);return st[t]?st[t].apply(null,e):void 0}function Jt(t){t.prefix==="fa"&&(t.prefix="fas");let{iconName:e}=t;const n=t.prefix||Z();if(e)return e=tt(n,e)||e,Ee(Nn.definitions,n,e)||Ee(H.styles,n,e)}const Nn=new cr,dr=()=>{p.autoReplaceSvg=!1,p.observeMutations=!1,nt("noAuto")},mr={i2svg:function(){let t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};return q?(nt("beforeI2svg",t),Q("pseudoElements2svg",t),Q("i2svg",t)):Promise.reject(new Error("Operation requires a DOM of some kind."))},watch:function(){let t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};const{autoReplaceSvgRoot:e}=t;p.autoReplaceSvg===!1&&(p.autoReplaceSvg=!0),p.observeMutations=!0,Xa(()=>{pr({autoReplaceSvgRoot:e}),nt("watch",t)})}},hr={icon:t=>{if(t===null)return null;if(typeof t=="object"&&t.prefix&&t.iconName)return{prefix:t.prefix,iconName:tt(t.prefix,t.iconName)||t.iconName};if(Array.isArray(t)&&t.length===2){const e=t[1].indexOf("fa-")===0?t[1].slice(3):t[1],n=Tt(t[0]);return{prefix:n,iconName:tt(n,e)||e}}if(typeof t=="string"&&(t.indexOf("".concat(p.cssPrefix,"-"))>-1||t.match(Ma))){const e=Ot(t.split(" "),{skipLookups:!0});return{prefix:e.prefix||Z(),iconName:tt(e.prefix,e.iconName)||e.iconName}}if(typeof t=="string"){const e=Z();return{prefix:e,iconName:tt(e,t)||t}}}},W={noAuto:dr,config:p,dom:mr,parse:hr,library:Nn,findIconDefinition:Jt,toHtml:gt},pr=function(){let t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};const{autoReplaceSvgRoot:e=I}=t;(Object.keys(H.styles).length>0||p.autoFetchSvg)&&q&&p.autoReplaceSvg&&W.dom.i2svg({node:e})};function It(t,e){return Object.defineProperty(t,"abstract",{get:e}),Object.defineProperty(t,"html",{get:function(){return t.abstract.map(n=>gt(n))}}),Object.defineProperty(t,"node",{get:function(){if(!q)return;const n=I.createElement("div");return n.innerHTML=t.html,n.children}}),t}function gr(t){let{children:e,main:n,mask:a,attributes:r,styles:o,transform:s}=t;if(me(s)&&n.found&&!a.found){const{width:l,height:c}=n,f={x:l/c/2,y:.5};r.style=At(u(u({},o),{},{"transform-origin":"".concat(f.x+s.x/16,"em ").concat(f.y+s.y/16,"em")}))}return[{tag:"svg",attributes:r,children:e}]}function yr(t){let{prefix:e,iconName:n,children:a,attributes:r,symbol:o}=t;const s=o===!0?"".concat(e,"-").concat(p.cssPrefix,"-").concat(n):o;return[{tag:"svg",attributes:{style:"display: none;"},children:[{tag:"symbol",attributes:u(u({},r),{},{id:s}),children:a}]}]}function ge(t){const{icons:{main:e,mask:n},prefix:a,iconName:r,transform:o,symbol:s,title:l,maskId:c,titleId:f,extra:d,watchable:g=!1}=t,{width:m,height:y}=n.found?n:e,h=ya.includes(a),O=[p.replacementClass,r?"".concat(p.cssPrefix,"-").concat(r):""].filter(F=>d.classes.indexOf(F)===-1).filter(F=>F!==""||!!F).concat(d.classes).join(" ");let j={children:[],attributes:u(u({},d.attributes),{},{"data-prefix":a,"data-icon":r,class:O,role:d.attributes.role||"img",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 ".concat(m," ").concat(y)})};const A=h&&!~d.classes.indexOf("fa-fw")?{width:"".concat(m/y*16*.0625,"em")}:{};g&&(j.attributes[et]=""),l&&(j.children.push({tag:"title",attributes:{id:j.attributes["aria-labelledby"]||"title-".concat(f||mt())},children:[l]}),delete j.attributes.title);const x=u(u({},j),{},{prefix:a,iconName:r,main:e,mask:n,maskId:c,transform:o,symbol:s,styles:u(u({},A),d.styles)}),{children:k,attributes:E}=n.found&&e.found?Q("generateAbstractMask",x)||{children:[],attributes:{}}:Q("generateAbstractIcon",x)||{children:[],attributes:{}};return x.children=k,x.attributes=E,s?yr(x):gr(x)}function Le(t){const{content:e,width:n,height:a,transform:r,title:o,extra:s,watchable:l=!1}=t,c=u(u(u({},s.attributes),o?{title:o}:{}),{},{class:s.classes.join(" ")});l&&(c[et]="");const f=u({},s.styles);me(r)&&(f.transform=Ya({transform:r,startCentered:!0,width:n,height:a}),f["-webkit-transform"]=f.transform);const d=At(f);d.length>0&&(c.style=d);const g=[];return g.push({tag:"span",attributes:c,children:[e]}),o&&g.push({tag:"span",attributes:{class:"sr-only"},children:[o]}),g}function br(t){const{content:e,title:n,extra:a}=t,r=u(u(u({},a.attributes),n?{title:n}:{}),{},{class:a.classes.join(" ")}),o=At(a.styles);o.length>0&&(r.style=o);const s=[];return s.push({tag:"span",attributes:r,children:[e]}),n&&s.push({tag:"span",attributes:{class:"sr-only"},children:[n]}),s}const{styles:_t}=H;function Zt(t){const e=t[0],n=t[1],[a]=t.slice(4);let r=null;return Array.isArray(a)?r={tag:"g",attributes:{class:"".concat(p.cssPrefix,"-").concat(Lt.GROUP)},children:[{tag:"path",attributes:{class:"".concat(p.cssPrefix,"-").concat(Lt.SECONDARY),fill:"currentColor",d:a[0]}},{tag:"path",attributes:{class:"".concat(p.cssPrefix,"-").concat(Lt.PRIMARY),fill:"currentColor",d:a[1]}}]}:r={tag:"path",attributes:{fill:"currentColor",d:a}},{found:!0,width:e,height:n,icon:r}}const xr={found:!1,width:512,height:512};function vr(t,e){!pn&&!p.showMissingIcons&&t&&console.error('Icon with name "'.concat(t,'" and prefix "').concat(e,'" is missing.'))}function Qt(t,e){let n=e;return e==="fa"&&p.styleDefault!==null&&(e=Z()),new Promise((a,r)=>{if(n==="fa"){const o=In(t)||{};t=o.iconName||t,e=o.prefix||e}if(t&&e&&_t[e]&&_t[e][t]){const o=_t[e][t];return a(Zt(o))}vr(t,e),a(u(u({},xr),{},{icon:p.showMissingIcons&&t?Q("missingIconAbstract")||{}:{}}))})}const De=()=>{},te=p.measurePerformance&&yt&&yt.mark&&yt.measure?yt:{mark:De,measure:De},ft='FA "6.7.2"',Sr=t=>(te.mark("".concat(ft," ").concat(t," begins")),()=>Mn(t)),Mn=t=>{te.mark("".concat(ft," ").concat(t," ends")),te.measure("".concat(ft," ").concat(t),"".concat(ft," ").concat(t," begins"),"".concat(ft," ").concat(t," ends"))};var ye={begin:Sr,end:Mn};const vt=()=>{};function Fe(t){return typeof(t.getAttribute?t.getAttribute(et):null)=="string"}function Cr(t){const e=t.getAttribute?t.getAttribute(ce):null,n=t.getAttribute?t.getAttribute(fe):null;return e&&n}function wr(t){return t&&t.classList&&t.classList.contains&&t.classList.contains(p.replacementClass)}function kr(){return p.autoReplaceSvg===!0?St.replace:St[p.autoReplaceSvg]||St.replace}function Pr(t){return I.createElementNS("http://www.w3.org/2000/svg",t)}function jr(t){return I.createElement(t)}function zn(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};const{ceFn:n=t.tag==="svg"?Pr:jr}=e;if(typeof t=="string")return I.createTextNode(t);const a=n(t.tag);return Object.keys(t.attributes||[]).forEach(function(o){a.setAttribute(o,t.attributes[o])}),(t.children||[]).forEach(function(o){a.appendChild(zn(o,{ceFn:n}))}),a}function Ar(t){let e=" ".concat(t.outerHTML," ");return e="".concat(e,"Font Awesome fontawesome.com "),e}const St={replace:function(t){const e=t[0];if(e.parentNode)if(t[1].forEach(n=>{e.parentNode.insertBefore(zn(n),e)}),e.getAttribute(et)===null&&p.keepOriginalSource){let n=I.createComment(Ar(e));e.parentNode.replaceChild(n,e)}else e.remove()},nest:function(t){const e=t[0],n=t[1];if(~de(e).indexOf(p.replacementClass))return St.replace(t);const a=new RegExp("".concat(p.cssPrefix,"-.*"));if(delete n[0].attributes.id,n[0].attributes.class){const o=n[0].attributes.class.split(" ").reduce((s,l)=>(l===p.replacementClass||l.match(a)?s.toSvg.push(l):s.toNode.push(l),s),{toNode:[],toSvg:[]});n[0].attributes.class=o.toSvg.join(" "),o.toNode.length===0?e.removeAttribute("class"):e.setAttribute("class",o.toNode.join(" "))}const r=n.map(o=>gt(o)).join(`
`);e.setAttribute(et,""),e.innerHTML=r}};function _e(t){t()}function Ln(t,e){const n=typeof e=="function"?e:vt;if(t.length===0)n();else{let a=_e;p.mutateApproach===Ia&&(a=J.requestAnimationFrame||_e),a(()=>{const r=kr(),o=ye.begin("mutate");t.map(r),o(),n()})}}let be=!1;function Dn(){be=!0}function ee(){be=!1}let wt=null;function Re(t){if(!Pe||!p.observeMutations)return;const{treeCallback:e=vt,nodeCallback:n=vt,pseudoElementsCallback:a=vt,observeMutationsRoot:r=I}=t;wt=new Pe(o=>{if(be)return;const s=Z();lt(o).forEach(l=>{if(l.type==="childList"&&l.addedNodes.length>0&&!Fe(l.addedNodes[0])&&(p.searchPseudoElements&&a(l.target),e(l.target)),l.type==="attributes"&&l.target.parentNode&&p.searchPseudoElements&&a(l.target.parentNode),l.type==="attributes"&&Fe(l.target)&&~Da.indexOf(l.attributeName))if(l.attributeName==="class"&&Cr(l.target)){const{prefix:c,iconName:f}=Ot(de(l.target));l.target.setAttribute(ce,c||s),f&&l.target.setAttribute(fe,f)}else wr(l.target)&&n(l.target)})}),q&&wt.observe(r,{childList:!0,attributes:!0,characterData:!0,subtree:!0})}function Tr(){wt&&wt.disconnect()}function Or(t){const e=t.getAttribute("style");let n=[];return e&&(n=e.split(";").reduce((a,r)=>{const o=r.split(":"),s=o[0],l=o.slice(1);return s&&l.length>0&&(a[s]=l.join(":").trim()),a},{})),n}function Ir(t){const e=t.getAttribute("data-prefix"),n=t.getAttribute("data-icon"),a=t.innerText!==void 0?t.innerText.trim():"";let r=Ot(de(t));return r.prefix||(r.prefix=Z()),e&&n&&(r.prefix=e,r.iconName=n),r.iconName&&r.prefix||(r.prefix&&a.length>0&&(r.iconName=er(r.prefix,t.innerText)||pe(r.prefix,Xt(t.innerText))),!r.iconName&&p.autoFetchSvg&&t.firstChild&&t.firstChild.nodeType===Node.TEXT_NODE&&(r.iconName=t.firstChild.data)),r}function Er(t){const e=lt(t.attributes).reduce((r,o)=>(r.name!=="class"&&r.name!=="style"&&(r[o.name]=o.value),r),{}),n=t.getAttribute("title"),a=t.getAttribute("data-fa-title-id");return p.autoA11y&&(n?e["aria-labelledby"]="".concat(p.replacementClass,"-title-").concat(a||mt()):(e["aria-hidden"]="true",e.focusable="false")),e}function Nr(){return{iconName:null,title:null,titleId:null,prefix:null,transform:Y,symbol:!1,mask:{iconName:null,prefix:null,rest:[]},maskId:null,extra:{classes:[],styles:{},attributes:{}}}}function We(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{styleParser:!0};const{iconName:n,prefix:a,rest:r}=Ir(t),o=Er(t),s=Kt("parseNodeAttributes",{},t);let l=e.styleParser?Or(t):[];return u({iconName:n,title:t.getAttribute("title"),titleId:t.getAttribute("data-fa-title-id"),prefix:a,transform:Y,mask:{iconName:null,prefix:null,rest:[]},maskId:null,symbol:!1,extra:{classes:r,styles:l,attributes:o}},s)}const{styles:Mr}=H;function Fn(t){const e=p.autoReplaceSvg==="nest"?We(t,{styleParser:!1}):We(t);return~e.extra.classes.indexOf(yn)?Q("generateLayersText",t,e):Q("generateSvgReplacementMutation",t,e)}function zr(){return[...ha,...Ut]}function Be(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;if(!q)return Promise.resolve();const n=I.documentElement.classList,a=d=>n.add("".concat(Te,"-").concat(d)),r=d=>n.remove("".concat(Te,"-").concat(d)),o=p.autoFetchSvg?zr():fn.concat(Object.keys(Mr));o.includes("fa")||o.push("fa");const s=[".".concat(yn,":not([").concat(et,"])")].concat(o.map(d=>".".concat(d,":not([").concat(et,"])"))).join(", ");if(s.length===0)return Promise.resolve();let l=[];try{l=lt(t.querySelectorAll(s))}catch{}if(l.length>0)a("pending"),r("complete");else return Promise.resolve();const c=ye.begin("onTree"),f=l.reduce((d,g)=>{try{const m=Fn(g);m&&d.push(m)}catch(m){pn||m.name==="MissingIcon"&&console.error(m)}return d},[]);return new Promise((d,g)=>{Promise.all(f).then(m=>{Ln(m,()=>{a("active"),a("complete"),r("pending"),typeof e=="function"&&e(),c(),d()})}).catch(m=>{c(),g(m)})})}function Lr(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;Fn(t).then(n=>{n&&Ln([n],e)})}function Dr(t){return function(e){let n=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};const a=(e||{}).icon?e:Jt(e||{});let{mask:r}=n;return r&&(r=(r||{}).icon?r:Jt(r||{})),t(a,u(u({},n),{},{mask:r}))}}const Fr=function(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};const{transform:n=Y,symbol:a=!1,mask:r=null,maskId:o=null,title:s=null,titleId:l=null,classes:c=[],attributes:f={},styles:d={}}=e;if(!t)return;const{prefix:g,iconName:m,icon:y}=t;return It(u({type:"icon"},t),()=>(nt("beforeDOMElementCreation",{iconDefinition:t,params:e}),p.autoA11y&&(s?f["aria-labelledby"]="".concat(p.replacementClass,"-title-").concat(l||mt()):(f["aria-hidden"]="true",f.focusable="false")),ge({icons:{main:Zt(y),mask:r?Zt(r.icon):{found:!1,width:null,height:null,icon:{}}},prefix:g,iconName:m,transform:u(u({},Y),n),symbol:a,title:s,maskId:o,titleId:l,extra:{attributes:f,styles:d,classes:c}})))};var _r={mixout(){return{icon:Dr(Fr)}},hooks(){return{mutationObserverCallbacks(t){return t.treeCallback=Be,t.nodeCallback=Lr,t}}},provides(t){t.i2svg=function(e){const{node:n=I,callback:a=()=>{}}=e;return Be(n,a)},t.generateSvgReplacementMutation=function(e,n){const{iconName:a,title:r,titleId:o,prefix:s,transform:l,symbol:c,mask:f,maskId:d,extra:g}=n;return new Promise((m,y)=>{Promise.all([Qt(a,s),f.iconName?Qt(f.iconName,f.prefix):Promise.resolve({found:!1,width:512,height:512,icon:{}})]).then(h=>{let[O,j]=h;m([e,ge({icons:{main:O,mask:j},prefix:s,iconName:a,transform:l,symbol:c,maskId:d,title:r,titleId:o,extra:g,watchable:!0})])}).catch(y)})},t.generateAbstractIcon=function(e){let{children:n,attributes:a,main:r,transform:o,styles:s}=e;const l=At(s);l.length>0&&(a.style=l);let c;return me(o)&&(c=Q("generateAbstractTransformGrouping",{main:r,transform:o,containerWidth:r.width,iconWidth:r.width})),n.push(c||r.icon),{children:n,attributes:a}}}},Rr={mixout(){return{layer(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};const{classes:n=[]}=e;return It({type:"layer"},()=>{nt("beforeDOMElementCreation",{assembler:t,params:e});let a=[];return t(r=>{Array.isArray(r)?r.map(o=>{a=a.concat(o.abstract)}):a=a.concat(r.abstract)}),[{tag:"span",attributes:{class:["".concat(p.cssPrefix,"-layers"),...n].join(" ")},children:a}]})}}}},Wr={mixout(){return{counter(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};const{title:n=null,classes:a=[],attributes:r={},styles:o={}}=e;return It({type:"counter",content:t},()=>(nt("beforeDOMElementCreation",{content:t,params:e}),br({content:t.toString(),title:n,extra:{attributes:r,styles:o,classes:["".concat(p.cssPrefix,"-layers-counter"),...a]}})))}}}},Br={mixout(){return{text(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};const{transform:n=Y,title:a=null,classes:r=[],attributes:o={},styles:s={}}=e;return It({type:"text",content:t},()=>(nt("beforeDOMElementCreation",{content:t,params:e}),Le({content:t,transform:u(u({},Y),n),title:a,extra:{attributes:o,styles:s,classes:["".concat(p.cssPrefix,"-layers-text"),...r]}})))}}},provides(t){t.generateLayersText=function(e,n){const{title:a,transform:r,extra:o}=n;let s=null,l=null;if(ln){const c=parseInt(getComputedStyle(e).fontSize,10),f=e.getBoundingClientRect();s=f.width/c,l=f.height/c}return p.autoA11y&&!a&&(o.attributes["aria-hidden"]="true"),Promise.resolve([e,Le({content:e.innerHTML,width:s,height:l,transform:r,title:a,extra:o,watchable:!0})])}}};const Ur=new RegExp('"',"ug"),Ue=[1105920,1112319],Ve=u(u(u(u({},{FontAwesome:{normal:"fas",400:"fas"}}),ua),Ta),Sa),ne=Object.keys(Ve).reduce((t,e)=>(t[e.toLowerCase()]=Ve[e],t),{}),Vr=Object.keys(ne).reduce((t,e)=>{const n=ne[e];return t[e]=n[900]||[...Object.entries(n)][0][1],t},{});function $r(t){const e=t.replace(Ur,""),n=Ka(e,0),a=n>=Ue[0]&&n<=Ue[1],r=e.length===2?e[0]===e[1]:!1;return{value:Xt(r?e[0]:e),isSecondary:a||r}}function Yr(t,e){const n=t.replace(/^['"]|['"]$/g,"").toLowerCase(),a=parseInt(e),r=isNaN(a)?"normal":a;return(ne[n]||{})[r]||Vr[n]}function $e(t,e){const n="".concat(Oa).concat(e.replace(":","-"));return new Promise((a,r)=>{if(t.getAttribute(n)!==null)return a();const s=lt(t.children).filter(m=>m.getAttribute($t)===e)[0],l=J.getComputedStyle(t,e),c=l.getPropertyValue("font-family"),f=c.match(za),d=l.getPropertyValue("font-weight"),g=l.getPropertyValue("content");if(s&&!f)return t.removeChild(s),a();if(f&&g!=="none"&&g!==""){const m=l.getPropertyValue("content");let y=Yr(c,d);const{value:h,isSecondary:O}=$r(m),j=f[0].startsWith("FontAwesome");let A=pe(y,h),x=A;if(j){const k=nr(h);k.iconName&&k.prefix&&(A=k.iconName,y=k.prefix)}if(A&&!O&&(!s||s.getAttribute(ce)!==y||s.getAttribute(fe)!==x)){t.setAttribute(n,x),s&&t.removeChild(s);const k=Nr(),{extra:E}=k;E.attributes[$t]=e,Qt(A,y).then(F=>{const at=ge(u(u({},k),{},{icons:{main:F,mask:En()},prefix:y,iconName:x,extra:E,watchable:!0})),R=I.createElementNS("http://www.w3.org/2000/svg","svg");e==="::before"?t.insertBefore(R,t.firstChild):t.appendChild(R),R.outerHTML=at.map(T=>gt(T)).join(`
`),t.removeAttribute(n),a()}).catch(r)}else a()}else a()})}function Hr(t){return Promise.all([$e(t,"::before"),$e(t,"::after")])}function Gr(t){return t.parentNode!==document.head&&!~Ea.indexOf(t.tagName.toUpperCase())&&!t.getAttribute($t)&&(!t.parentNode||t.parentNode.tagName!=="svg")}function Ye(t){if(q)return new Promise((e,n)=>{const a=lt(t.querySelectorAll("*")).filter(Gr).map(Hr),r=ye.begin("searchPseudoElements");Dn(),Promise.all(a).then(()=>{r(),ee(),e()}).catch(()=>{r(),ee(),n()})})}var Xr={hooks(){return{mutationObserverCallbacks(t){return t.pseudoElementsCallback=Ye,t}}},provides(t){t.pseudoElements2svg=function(e){const{node:n=I}=e;p.searchPseudoElements&&Ye(n)}}};let He=!1;var qr={mixout(){return{dom:{unwatch(){Dn(),He=!0}}}},hooks(){return{bootstrap(){Re(Kt("mutationObserverCallbacks",{}))},noAuto(){Tr()},watch(t){const{observeMutationsRoot:e}=t;He?ee():Re(Kt("mutationObserverCallbacks",{observeMutationsRoot:e}))}}}};const Ge=t=>{let e={size:16,x:0,y:0,flipX:!1,flipY:!1,rotate:0};return t.toLowerCase().split(" ").reduce((n,a)=>{const r=a.toLowerCase().split("-"),o=r[0];let s=r.slice(1).join("-");if(o&&s==="h")return n.flipX=!0,n;if(o&&s==="v")return n.flipY=!0,n;if(s=parseFloat(s),isNaN(s))return n;switch(o){case"grow":n.size=n.size+s;break;case"shrink":n.size=n.size-s;break;case"left":n.x=n.x-s;break;case"right":n.x=n.x+s;break;case"up":n.y=n.y-s;break;case"down":n.y=n.y+s;break;case"rotate":n.rotate=n.rotate+s;break}return n},e)};var Kr={mixout(){return{parse:{transform:t=>Ge(t)}}},hooks(){return{parseNodeAttributes(t,e){const n=e.getAttribute("data-fa-transform");return n&&(t.transform=Ge(n)),t}}},provides(t){t.generateAbstractTransformGrouping=function(e){let{main:n,transform:a,containerWidth:r,iconWidth:o}=e;const s={transform:"translate(".concat(r/2," 256)")},l="translate(".concat(a.x*32,", ").concat(a.y*32,") "),c="scale(".concat(a.size/16*(a.flipX?-1:1),", ").concat(a.size/16*(a.flipY?-1:1),") "),f="rotate(".concat(a.rotate," 0 0)"),d={transform:"".concat(l," ").concat(c," ").concat(f)},g={transform:"translate(".concat(o/2*-1," -256)")},m={outer:s,inner:d,path:g};return{tag:"g",attributes:u({},m.outer),children:[{tag:"g",attributes:u({},m.inner),children:[{tag:n.icon.tag,children:n.icon.children,attributes:u(u({},n.icon.attributes),m.path)}]}]}}}};const Rt={x:0,y:0,width:"100%",height:"100%"};function Xe(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!0;return t.attributes&&(t.attributes.fill||e)&&(t.attributes.fill="black"),t}function Jr(t){return t.tag==="g"?t.children:[t]}var Zr={hooks(){return{parseNodeAttributes(t,e){const n=e.getAttribute("data-fa-mask"),a=n?Ot(n.split(" ").map(r=>r.trim())):En();return a.prefix||(a.prefix=Z()),t.mask=a,t.maskId=e.getAttribute("data-fa-mask-id"),t}}},provides(t){t.generateAbstractMask=function(e){let{children:n,attributes:a,main:r,mask:o,maskId:s,transform:l}=e;const{width:c,icon:f}=r,{width:d,icon:g}=o,m=$a({transform:l,containerWidth:d,iconWidth:c}),y={tag:"rect",attributes:u(u({},Rt),{},{fill:"white"})},h=f.children?{children:f.children.map(Xe)}:{},O={tag:"g",attributes:u({},m.inner),children:[Xe(u({tag:f.tag,attributes:u(u({},f.attributes),m.path)},h))]},j={tag:"g",attributes:u({},m.outer),children:[O]},A="mask-".concat(s||mt()),x="clip-".concat(s||mt()),k={tag:"mask",attributes:u(u({},Rt),{},{id:A,maskUnits:"userSpaceOnUse",maskContentUnits:"userSpaceOnUse"}),children:[y,j]},E={tag:"defs",children:[{tag:"clipPath",attributes:{id:x},children:Jr(g)},k]};return n.push(E,{tag:"rect",attributes:u({fill:"currentColor","clip-path":"url(#".concat(x,")"),mask:"url(#".concat(A,")")},Rt)}),{children:n,attributes:a}}}},Qr={provides(t){let e=!1;J.matchMedia&&(e=J.matchMedia("(prefers-reduced-motion: reduce)").matches),t.missingIconAbstract=function(){const n=[],a={fill:"currentColor"},r={attributeType:"XML",repeatCount:"indefinite",dur:"2s"};n.push({tag:"path",attributes:u(u({},a),{},{d:"M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"})});const o=u(u({},r),{},{attributeName:"opacity"}),s={tag:"circle",attributes:u(u({},a),{},{cx:"256",cy:"364",r:"28"}),children:[]};return e||s.children.push({tag:"animate",attributes:u(u({},r),{},{attributeName:"r",values:"28;14;28;28;14;28;"})},{tag:"animate",attributes:u(u({},o),{},{values:"1;0;1;1;0;1;"})}),n.push(s),n.push({tag:"path",attributes:u(u({},a),{},{opacity:"1",d:"M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"}),children:e?[]:[{tag:"animate",attributes:u(u({},o),{},{values:"1;0;0;0;0;1;"})}]}),e||n.push({tag:"path",attributes:u(u({},a),{},{opacity:"0",d:"M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"}),children:[{tag:"animate",attributes:u(u({},o),{},{values:"0;0;1;1;0;0;"})}]}),{tag:"g",attributes:{class:"missing"},children:n}}}},to={hooks(){return{parseNodeAttributes(t,e){const n=e.getAttribute("data-fa-symbol"),a=n===null?!1:n===""?!0:n;return t.symbol=a,t}}}},eo=[Ga,_r,Rr,Wr,Br,Xr,qr,Kr,Zr,Qr,to];ur(eo,{mixoutsTo:W});W.noAuto;W.config;W.library;W.dom;const ae=W.parse;W.findIconDefinition;W.toHtml;const no=W.icon;W.layer;W.text;W.counter;function qe(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);e&&(a=a.filter(function(r){return Object.getOwnPropertyDescriptor(t,r).enumerable})),n.push.apply(n,a)}return n}function $(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};e%2?qe(Object(n),!0).forEach(function(a){ot(t,a,n[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):qe(Object(n)).forEach(function(a){Object.defineProperty(t,a,Object.getOwnPropertyDescriptor(n,a))})}return t}function kt(t){"@babel/helpers - typeof";return kt=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},kt(t)}function ot(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function ao(t,e){if(t==null)return{};var n={},a=Object.keys(t),r,o;for(o=0;o<a.length;o++)r=a[o],!(e.indexOf(r)>=0)&&(n[r]=t[r]);return n}function ro(t,e){if(t==null)return{};var n=ao(t,e),a,r;if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);for(r=0;r<o.length;r++)a=o[r],!(e.indexOf(a)>=0)&&Object.prototype.propertyIsEnumerable.call(t,a)&&(n[a]=t[a])}return n}function re(t){return oo(t)||so(t)||io(t)||lo()}function oo(t){if(Array.isArray(t))return oe(t)}function so(t){if(typeof Symbol<"u"&&t[Symbol.iterator]!=null||t["@@iterator"]!=null)return Array.from(t)}function io(t,e){if(t){if(typeof t=="string")return oe(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);if(n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set")return Array.from(t);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return oe(t,e)}}function oe(t,e){(e==null||e>t.length)&&(e=t.length);for(var n=0,a=new Array(e);n<e;n++)a[n]=t[n];return a}function lo(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function co(t){var e,n=t.beat,a=t.fade,r=t.beatFade,o=t.bounce,s=t.shake,l=t.flash,c=t.spin,f=t.spinPulse,d=t.spinReverse,g=t.pulse,m=t.fixedWidth,y=t.inverse,h=t.border,O=t.listItem,j=t.flip,A=t.size,x=t.rotation,k=t.pull,E=(e={"fa-beat":n,"fa-fade":a,"fa-beat-fade":r,"fa-bounce":o,"fa-shake":s,"fa-flash":l,"fa-spin":c,"fa-spin-reverse":d,"fa-spin-pulse":f,"fa-pulse":g,"fa-fw":m,"fa-inverse":y,"fa-border":h,"fa-li":O,"fa-flip":j===!0,"fa-flip-horizontal":j==="horizontal"||j==="both","fa-flip-vertical":j==="vertical"||j==="both"},ot(e,"fa-".concat(A),typeof A<"u"&&A!==null),ot(e,"fa-rotate-".concat(x),typeof x<"u"&&x!==null&&x!==0),ot(e,"fa-pull-".concat(k),typeof k<"u"&&k!==null),ot(e,"fa-swap-opacity",t.swapOpacity),e);return Object.keys(E).map(function(F){return E[F]?F:null}).filter(function(F){return F})}function fo(t){return t=t-0,t===t}function _n(t){return fo(t)?t:(t=t.replace(/[\-_\s]+(.)?/g,function(e,n){return n?n.toUpperCase():""}),t.substr(0,1).toLowerCase()+t.substr(1))}var uo=["style"];function mo(t){return t.charAt(0).toUpperCase()+t.slice(1)}function ho(t){return t.split(";").map(function(e){return e.trim()}).filter(function(e){return e}).reduce(function(e,n){var a=n.indexOf(":"),r=_n(n.slice(0,a)),o=n.slice(a+1).trim();return r.startsWith("webkit")?e[mo(r)]=o:e[r]=o,e},{})}function Rn(t,e){var n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{};if(typeof e=="string")return e;var a=(e.children||[]).map(function(c){return Rn(t,c)}),r=Object.keys(e.attributes||{}).reduce(function(c,f){var d=e.attributes[f];switch(f){case"class":c.attrs.className=d,delete e.attributes.class;break;case"style":c.attrs.style=ho(d);break;default:f.indexOf("aria-")===0||f.indexOf("data-")===0?c.attrs[f.toLowerCase()]=d:c.attrs[_n(f)]=d}return c},{attrs:{}}),o=n.style,s=o===void 0?{}:o,l=ro(n,uo);return r.attrs.style=$($({},r.attrs.style),s),t.apply(void 0,[e.tag,$($({},r.attrs),l)].concat(re(a)))}var Wn=!1;try{Wn=!0}catch{}function po(){if(!Wn&&console&&typeof console.error=="function"){var t;(t=console).error.apply(t,arguments)}}function Ke(t){if(t&&kt(t)==="object"&&t.prefix&&t.iconName&&t.icon)return t;if(ae.icon)return ae.icon(t);if(t===null)return null;if(t&&kt(t)==="object"&&t.prefix&&t.iconName)return t;if(Array.isArray(t)&&t.length===2)return{prefix:t[0],iconName:t[1]};if(typeof t=="string")return{prefix:"fas",iconName:t}}function Wt(t,e){return Array.isArray(e)&&e.length>0||!Array.isArray(e)&&e?ot({},t,e):{}}var Je={border:!1,className:"",mask:null,maskId:null,fixedWidth:!1,inverse:!1,flip:!1,icon:null,listItem:!1,pull:null,pulse:!1,rotation:null,size:null,spin:!1,spinPulse:!1,spinReverse:!1,beat:!1,fade:!1,beatFade:!1,bounce:!1,shake:!1,symbol:!1,title:"",titleId:null,transform:null,swapOpacity:!1},_=N.forwardRef(function(t,e){var n=$($({},Je),t),a=n.icon,r=n.mask,o=n.symbol,s=n.className,l=n.title,c=n.titleId,f=n.maskId,d=Ke(a),g=Wt("classes",[].concat(re(co(n)),re((s||"").split(" ")))),m=Wt("transform",typeof n.transform=="string"?ae.transform(n.transform):n.transform),y=Wt("mask",Ke(r)),h=no(d,$($($($({},g),m),y),{},{symbol:o,title:l,titleId:c,maskId:f}));if(!h)return po("Could not find icon",d),null;var O=h.abstract,j={ref:e};return Object.keys(n).forEach(function(A){Je.hasOwnProperty(A)||(j[A]=n[A])}),go(O[0],j)});_.displayName="FontAwesomeIcon";_.propTypes={beat:P.bool,border:P.bool,beatFade:P.bool,bounce:P.bool,className:P.string,fade:P.bool,flash:P.bool,mask:P.oneOfType([P.object,P.array,P.string]),maskId:P.string,fixedWidth:P.bool,inverse:P.bool,flip:P.oneOf([!0,!1,"horizontal","vertical","both"]),icon:P.oneOfType([P.object,P.array,P.string]),listItem:P.bool,pull:P.oneOf(["right","left"]),pulse:P.bool,rotation:P.oneOf([0,90,180,270]),shake:P.bool,size:P.oneOf(["2xs","xs","sm","lg","xl","2xl","1x","2x","3x","4x","5x","6x","7x","8x","9x","10x"]),spin:P.bool,spinPulse:P.bool,spinReverse:P.bool,symbol:P.oneOfType([P.bool,P.string]),title:P.string,titleId:P.string,transform:P.oneOfType([P.string,P.object]),swapOpacity:P.bool};var go=Rn.bind(null,N.createElement);/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */const yo={prefix:"fas",iconName:"comments",icon:[640,512,[128490,61670],"f086","M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2s0 0 0 0s0 0 0 0C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.2-11.4C134.1 343.3 169.8 352 208 352zM448 176c0 112.3-99.1 196.9-216.5 207C255.8 457.4 336.4 512 432 512c38.2 0 73.9-8.7 104.7-23.9c7.5 4 16 7.9 25.2 11.4c18.3 6.9 40.3 12.5 62.1 12.5c6.9 0 13.1-4.5 15.2-11.1c2.1-6.6-.2-13.8-5.8-17.9c0 0 0 0 0 0s0 0 0 0l-.2-.2c-.2-.2-.6-.4-1.1-.8c-1-.8-2.5-2-4.3-3.7c-3.6-3.3-8.5-8.1-13.3-14.3c-5.5-7-10.7-15.4-14.2-24.7c24.9-29 39.6-64.7 39.6-103.4c0-92.8-84.9-168.9-192.6-175.5c.4 5.1 .6 10.3 .6 15.5z"]},bo={prefix:"fas",iconName:"microphone-slash",icon:[640,512,[],"f131","M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L472.1 344.7c15.2-26 23.9-56.3 23.9-88.7l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 21.2-5.1 41.1-14.2 58.7L416 300.8 416 96c0-53-43-96-96-96s-96 43-96 96l0 54.3L38.8 5.1zM344 430.4c20.4-2.8 39.7-9.1 57.3-18.2l-43.1-33.9C346.1 382 333.3 384 320 384c-70.7 0-128-57.3-128-128l0-8.7L144.7 210c-.5 1.9-.7 3.9-.7 6l0 40c0 89.1 66.2 162.7 152 174.4l0 33.6-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l72 0 72 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-33.6z"]},xo={prefix:"fas",iconName:"share-nodes",icon:[448,512,["share-alt"],"f1e0","M352 224c53 0 96-43 96-96s-43-96-96-96s-96 43-96 96c0 4 .2 8 .7 11.9l-94.1 47C145.4 170.2 121.9 160 96 160c-53 0-96 43-96 96s43 96 96 96c25.9 0 49.4-10.2 66.6-26.9l94.1 47c-.5 3.9-.7 7.8-.7 11.9c0 53 43 96 96 96s96-43 96-96s-43-96-96-96c-25.9 0-49.4 10.2-66.6 26.9l-94.1-47c.5-3.9 .7-7.8 .7-11.9s-.2-8-.7-11.9l94.1-47C302.6 213.8 326.1 224 352 224z"]},vo=xo,So={prefix:"fas",iconName:"users",icon:[640,512,[],"f0c0","M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192l42.7 0c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0L21.3 320C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7l42.7 0C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3l-213.3 0zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352l117.3 0C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7l-330.7 0c-14.7 0-26.7-11.9-26.7-26.7z"]},Co={prefix:"fas",iconName:"crown",icon:[576,512,[128081],"f521","M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6l277.2 0c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z"]},wo={prefix:"fas",iconName:"microphone",icon:[384,512,[],"f130","M192 0C139 0 96 43 96 96l0 160c0 53 43 96 96 96s96-43 96-96l0-160c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 89.1 66.2 162.7 152 174.4l0 33.6-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l72 0 72 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0 0-33.6c85.8-11.7 152-85.3 152-174.4l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c0 70.7-57.3 128-128 128s-128-57.3-128-128l0-40z"]},ko={prefix:"fas",iconName:"gear",icon:[512,512,[9881,"cog"],"f013","M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"]},Po=ko,jo={prefix:"fas",iconName:"xmark",icon:[384,512,[128473,10005,10006,10060,215,"close","multiply","remove","times"],"f00d","M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"]},xe=jo,Ze={prefix:"fas",iconName:"desktop",icon:[576,512,[128421,61704,"desktop-alt"],"f390","M64 0C28.7 0 0 28.7 0 64L0 352c0 35.3 28.7 64 64 64l176 0-10.7 32L160 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l256 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-69.3 0L336 416l176 0c35.3 0 64-28.7 64-64l0-288c0-35.3-28.7-64-64-64L64 0zM512 64l0 224L64 288 64 64l448 0z"]},S=({style:t,children:e,...n})=>i.jsx("div",{style:{...t},...n,children:e}),C=({style:t,children:e,numberOfLines:n,...a})=>{const r={...t,...n&&{overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:n,WebkitBoxOrient:"vertical"}};return i.jsx("span",{style:r,...a,children:e})},L=({style:t,onPress:e,children:n,...a})=>i.jsx("div",{style:{...t,cursor:"pointer",userSelect:"none"},onClick:e,...a,children:n}),Ao=({source:t,style:e,...n})=>i.jsx("img",{src:t.uri||t,style:e,alt:n.alt||"",...n}),Bn=({style:t,children:e,...n})=>i.jsx("div",{style:{...t,overflowY:"auto",WebkitOverflowScrolling:"touch"},...n,children:e}),xt=({value:t,onValueChange:e,disabled:n,trackColor:a,thumbColor:r,style:o,...s})=>{const l={position:"relative",width:40,height:20,borderRadius:10,backgroundColor:t?(a==null?void 0:a.true)||"#4cd964":(a==null?void 0:a.false)||"#e5e5e5",transition:"background-color 0.2s",cursor:n?"not-allowed":"pointer",opacity:n?.5:1,...o},c={position:"absolute",top:2,left:t?22:2,width:16,height:16,borderRadius:8,backgroundColor:r||"#ffffff",boxShadow:"0 1px 3px rgba(0, 0, 0, 0.4)",transition:"left 0.2s"};return i.jsx("div",{style:l,onClick:()=>!n&&e(!t),...s,children:i.jsx("div",{style:c})})},To=({data:t,renderItem:e,keyExtractor:n,style:a,contentContainerStyle:r,...o})=>i.jsx("div",{style:a,...o,children:i.jsx("div",{style:r,children:t.map((s,l)=>i.jsx(N.Fragment,{children:e({item:s,index:l})},n?n(s,l):l))})}),Oo=({style:t,value:e,onChangeText:n,placeholder:a,multiline:r,numberOfLines:o,...s})=>{const l={...t,padding:"8px",border:"1px solid #ccc",borderRadius:"4px"};return r?i.jsx("textarea",{style:l,value:e,onChange:c=>n(c.target.value),placeholder:a,rows:o||4,...s}):i.jsx("input",{type:"text",style:l,value:e,onChange:c=>n(c.target.value),placeholder:a,...s})},Et={create:t=>t,flatten:t=>Array.isArray(t)?Object.assign({},...t):t},Qe={alert:(t,e,n=[{text:"OK"}])=>{typeof window<"u"&&window.alert(`${t}

${e}`)}},Io=({videoUrl:t,title:e,poster:n,autoplay:a=!1,onPlay:r,onPause:o,onEnded:s,onError:l,onQualityChange:c})=>{const[f,d]=N.useState(a),[g,m]=N.useState({currentTime:0,duration:0,buffered:0,quality:"auto"}),y=N.useRef(null),h=N.useCallback(()=>{d(!0),r==null||r()},[r]),O=N.useCallback(()=>{d(!1),o==null||o()},[o]),j=N.useCallback(()=>{d(!1),s==null||s()},[s]),A=N.useCallback(T=>{l==null||l(T)},[l]),x=N.useCallback(T=>{m(z=>({...z,quality:T})),c==null||c(T)},[c]),k=N.useCallback(()=>{const T=y.current;T&&m(z=>({...z,currentTime:T.currentTime}))},[]),E=N.useCallback(()=>{const T=y.current;T&&m(z=>({...z,duration:T.duration}))},[]),F=N.useCallback(()=>{const T=y.current;if(T&&T.buffered.length>0){const z=T.buffered.end(T.buffered.length-1);m(ct=>({...ct,buffered:z}))}},[]),at=N.useCallback(()=>{const T=y.current;T&&(T.paused?T.play().catch(z=>A(z)):T.pause())},[A]),R=T=>{const z=Math.floor(T/60),ct=Math.floor(T%60);return`${z}:${ct.toString().padStart(2,"0")}`};return N.createElement("div",{style:{width:"100%",maxWidth:1280,backgroundColor:"#1a1a1a",borderRadius:8,overflow:"hidden"},"data-testid":"video-player-container"},N.createElement("video",{key:"video",ref:y,src:t,poster:n,autoPlay:a,onPlay:h,onPause:O,onEnded:j,onError:T=>{const z=T.currentTarget;z&&z.error?A(new Error(z.error.message||"Erreur de lecture vidéo")):A(new Error("Erreur inconnue lors de la lecture"))},onTimeUpdate:k,onDurationChange:E,onProgress:F,style:{width:"100%",aspectRatio:"16/9"},"data-testid":"video-element"}),N.createElement("div",{key:"controls",style:{padding:16,display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"space-between"},"data-testid":"video-controls"},N.createElement("button",{key:"play-pause",onClick:at,style:{backgroundColor:"#007aff",padding:8,borderRadius:4,border:"none",cursor:"pointer",color:"#ffffff"},"data-testid":"play-pause-button"},f?"Pause":"Lecture"),N.createElement("div",{key:"time",style:{display:"flex",flexDirection:"row",alignItems:"center",gap:8,color:"#ffffff"},"data-testid":"time-display"},`${R(g.currentTime)} / ${R(g.duration)}`),N.createElement("div",{key:"quality",style:{display:"flex",flexDirection:"row",alignItems:"center",gap:8,cursor:"pointer",color:"#ffffff"},"data-testid":"quality-selector",onClick:()=>x("hd")},`Qualité: ${g.quality}`)),N.createElement("h2",{key:"title",style:{padding:16,color:"#ffffff",fontSize:18,fontWeight:"bold",margin:0},"data-testid":"video-title"},e))},Un=({currentMessage:t,position:e,nextMessage:n,previousMessage:a,renderTime:r,renderTicks:o,renderUsername:s,...l})=>{const c=e==="right";return i.jsxs(S,{style:{alignSelf:c?"flex-end":"flex-start",backgroundColor:c?"#3f51b5":"#f0f0f0",borderRadius:15,marginBottom:10,marginLeft:c?50:0,marginRight:c?0:50,padding:10,maxWidth:"80%"},children:[s&&t.user&&t.user.name&&!c&&i.jsx(C,{style:{fontWeight:"bold",marginBottom:5,fontSize:12},children:t.user.name}),i.jsx(C,{style:{color:c?"white":"black"},children:t.text}),r&&i.jsx(C,{style:{fontSize:10,color:c?"rgba(255,255,255,0.7)":"gray",alignSelf:"flex-end",marginTop:5},children:new Date(t.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})})]})},se=({text:t,onSend:e,...n})=>i.jsx(L,{style:{height:40,width:40,borderRadius:20,backgroundColor:t?"#3f51b5":"#cccccc",alignItems:"center",justifyContent:"center",marginRight:5},disabled:!t,onPress:()=>{t&&e&&e({text:t},!0)},children:i.jsx(C,{style:{color:"white",fontWeight:"bold"},children:"➤"})}),Vn=({currentMessage:t,...e})=>!t||!t.text?null:i.jsx(S,{style:{alignItems:"center",marginVertical:10},children:i.jsx(C,{style:{backgroundColor:"rgba(0,0,0,0.1)",borderRadius:10,color:"#666",fontSize:12,fontWeight:"400",padding:5,paddingHorizontal:10},children:t.text})}),$n=({composerHeight:t,onSend:e,text:n,onTextChanged:a,renderSend:r,...o})=>i.jsxs(S,{style:{flexDirection:"row",alignItems:"center",padding:10,backgroundColor:"#f8f8f8",borderTopWidth:1,borderTopColor:"#e0e0e0"},children:[i.jsx(Oo,{style:{flex:1,borderWidth:1,borderColor:"#e0e0e0",borderRadius:20,paddingHorizontal:15,paddingVertical:8,marginRight:10,backgroundColor:"white"},placeholder:"Tapez un message...",value:n,onChangeText:a,multiline:!0,numberOfLines:1}),r&&r({text:n,onSend:e})]}),Eo=({messages:t=[],onSend:e,user:n,renderBubble:a,renderSend:r,renderSystemMessage:o,renderInputToolbar:s,renderTime:l,renderDay:c,...f})=>{const[d,g]=b.useState(""),m=(h=[])=>{e&&e(h),g("")},y=(h,O)=>{const j=h.user._id===n._id?"right":"left",A=j==="left";return h.system?o?o({currentMessage:h}):i.jsx(Vn,{currentMessage:h},`system_${O}`):a?a({currentMessage:h,position:j,renderUsername:A,renderTime:!0}):i.jsx(Un,{currentMessage:h,position:j,renderUsername:A,renderTime:!0},`bubble_${O}`)};return i.jsxs(S,{style:{flex:1,height:"100%"},children:[i.jsx(Bn,{style:{flex:1,padding:10},contentContainerStyle:{flexGrow:1,justifyContent:"flex-end"},children:t.map((h,O)=>y(h,O))}),s?s({text:d,onTextChanged:g,onSend:m,renderSend:h=>r?r(h):i.jsx(se,{...h})}):i.jsx($n,{text:d,onTextChanged:g,onSend:m,renderSend:h=>r?r(h):i.jsx(se,{...h})})]})},Yn=t=>{const[e,n]=b.useState([]),[a,r]=b.useState({connected:!1,partyId:null}),[o,s]=b.useState([]),[l,c]=b.useState({timestamp:0,isPlaying:!1}),{user:f}=Pt();b.useEffect(()=>{if(t)return(async()=>{await V.joinParty(t)})(),()=>{V.leaveParty()}},[t]),b.useEffect(()=>{const y=h=>{n(O=>ve.append(O,[h]))};return V.addMessageListener(y),()=>{V.removeMessageListener(y)}},[]),b.useEffect(()=>{const y=h=>{r(h)};return V.addStatusListener(y),()=>{V.removeStatusListener(y)}},[]),b.useEffect(()=>{const y=h=>{c(h)};return V.addVideoSyncListener(y),()=>{V.removeVideoSyncListener(y)}},[]);const d=b.useCallback((y=[])=>{const[h]=y;if(h&&f){const O={...h,user:{_id:f.id,name:f.displayName||f.username,avatar:f.profilePicture}};V.sendMessage(O),n(j=>ve.append(j,[O]))}},[f]),g=b.useCallback((y,h)=>{V.syncVideoPosition(y,h)},[]);b.useCallback(y=>y.map(h=>({_id:h.id||Math.random().toString(),text:h.content,createdAt:new Date(h.timestamp||Date.now()),user:{_id:h.userId,name:h.username,avatar:h.userAvatar},videoTimestamp:h.videoTimestamp})),[]);const m=b.useCallback(async()=>{},[t]);return{messages:e,status:a,participants:o,videoSync:l,sendMessage:d,syncVideoPosition:g,loadPreviousMessages:m}},ie=(t,e=!1)=>{if(!t&&t!==0)return"--:--";const n=Math.floor(t),a=Math.floor(n/3600),r=Math.floor(n%3600/60),o=n%60;return a>0||e?`${a.toString().padStart(2,"0")}:${r.toString().padStart(2,"0")}:${o.toString().padStart(2,"0")}`:`${r.toString().padStart(2,"0")}:${o.toString().padStart(2,"0")}`},No=b.createContext(),Nt=()=>{const t=b.useContext(No);if(t===void 0)throw new Error("useTheme doit être utilisé à l'intérieur d'un ThemeProvider");return t},Mo=({partyId:t,videoTimestamp:e,onSeekTo:n,isPlaying:a,onVideoSync:r})=>{const{messages:o,status:s,sendMessage:l}=Yn(t),{user:c}=Pt(),{colors:f}=Nt(),[d,g]=b.useState(""),m=b.useCallback(()=>{if(d.trim()){const k=[{_id:Math.random().toString(),text:d,createdAt:new Date,user:{_id:(c==null?void 0:c.id)||"guest",name:(c==null?void 0:c.displayName)||"Invité",avatar:c==null?void 0:c.profilePicture},videoTimestamp:e}];l(k),g("")}},[d,e,c,l]),y=b.useCallback(k=>i.jsx(Un,{...k,wrapperStyle:{left:{backgroundColor:f.chatBubbleLeft},right:{backgroundColor:f.primary}},textStyle:{left:{color:f.text},right:{color:f.textOnPrimary}}}),[f]),h=b.useCallback(k=>i.jsxs(S,{style:U.sendContainer,children:[e>0&&i.jsx(L,{style:[U.timestampButton,{backgroundColor:f.secondary}],onPress:m,children:i.jsx(C,{style:[U.timestampText,{color:f.textOnSecondary}],children:ie(e)})}),i.jsx(se,{...k,containerStyle:U.sendButton,children:i.jsx(C,{style:{color:f.primary},children:"Envoyer"})})]}),[f,e,m]),O=b.useCallback(k=>i.jsx(Vn,{...k,containerStyle:U.systemMessageContainer,textStyle:{color:f.textSecondary,fontSize:12,fontStyle:"italic"}}),[f]),j=b.useCallback(k=>{const{currentMessage:E}=k;return E.videoTimestamp?i.jsxs(L,{style:[U.timestampContainer,{backgroundColor:f.background2}],onPress:()=>n(E.videoTimestamp),children:[i.jsx(C,{style:[U.timestampLabel,{color:f.textSecondary}],children:"Aller à"}),i.jsx(C,{style:[U.timestamp,{color:f.accent}],children:ie(E.videoTimestamp)})]}):null},[f,n]),A=b.useCallback(()=>s.connected?null:i.jsx(S,{style:U.disconnectedContainer,children:i.jsx(C,{style:[U.disconnectedText,{color:f.error}],children:"Déconnecté de la Watch Party. Reconnexion en cours..."})}),[s,f]),x=b.useCallback(k=>s.connected?i.jsx($n,{...k,containerStyle:{backgroundColor:f.background,borderTopColor:f.border}}):null,[s,f]);return i.jsx(S,{style:[U.container,{backgroundColor:f.background}],children:i.jsx(Eo,{messages:o,onSend:l,user:{_id:(c==null?void 0:c.id)||"guest",name:(c==null?void 0:c.displayName)||"Invité",avatar:c==null?void 0:c.profilePicture},renderBubble:y,renderSend:h,renderSystemMessage:O,renderCustomView:j,renderFooter:A,renderInputToolbar:x,placeholder:"Discutez pendant le visionnage...",alwaysShowSend:!0,scrollToBottom:!0,text:d,onInputTextChanged:g,textInputProps:{style:{color:f.text,backgroundColor:f.inputBackground,borderRadius:20,paddingHorizontal:12,marginRight:10}}})})},U=Et.create({container:{flex:1,height:"100%"},sendContainer:{flexDirection:"row",alignItems:"center",justifyContent:"flex-end",marginRight:10},sendButton:{justifyContent:"center",alignItems:"center",marginRight:5},timestampButton:{padding:6,borderRadius:15,marginRight:10},timestampText:{fontSize:12,fontWeight:"bold"},timestampContainer:{flexDirection:"row",alignItems:"center",padding:5,borderRadius:10,marginTop:5,marginBottom:5},timestampLabel:{fontSize:12,marginRight:5},timestamp:{fontSize:12,fontWeight:"bold"},systemMessageContainer:{marginBottom:10,marginTop:5},disconnectedContainer:{padding:10,alignItems:"center"},disconnectedText:{fontSize:12,fontStyle:"italic"}}),zo=({participants:t=[],onClose:e})=>{const{colors:n}=Nt(),{user:a}=Pt(),r=[...t].sort((s,l)=>s.isHost&&!l.isHost?-1:!s.isHost&&l.isHost?1:s.displayName.localeCompare(l.displayName)),o=({item:s})=>{const l=s.id===(a==null?void 0:a.id);return i.jsxs(S,{style:[M.participantItem,l&&{backgroundColor:n.backgroundHighlight}],children:[i.jsx(Ao,{source:{uri:s.avatar||"https://via.placeholder.com/40"},style:M.avatar}),i.jsxs(S,{style:M.participantInfo,children:[i.jsxs(C,{style:[M.participantName,{color:n.text}],children:[s.displayName,l&&" (Vous)"]}),s.status&&i.jsx(C,{style:[M.participantStatus,{color:n.textSecondary}],children:s.status})]}),i.jsxs(S,{style:M.participantIcons,children:[s.isHost&&i.jsx(_,{icon:Co,color:n.warning,size:14,style:M.icon}),s.isMuted?i.jsx(_,{icon:bo,color:n.error,size:14,style:M.icon}):i.jsx(_,{icon:wo,color:n.success,size:14,style:M.icon})]})]})};return i.jsx(S,{style:[M.overlay,{backgroundColor:"rgba(0, 0, 0, 0.5)"}],children:i.jsxs(S,{style:[M.container,{backgroundColor:n.background}],children:[i.jsxs(S,{style:M.header,children:[i.jsxs(C,{style:[M.title,{color:n.text}],children:["Participants (",t.length,")"]}),i.jsx(L,{onPress:e,style:M.closeButton,children:i.jsx(_,{icon:xe,color:n.text,size:18})})]}),t.length===0?i.jsxs(S,{style:M.emptyContainer,children:[i.jsx(C,{style:[M.emptyText,{color:n.textSecondary}],children:"Aucun autre participant pour le moment."}),i.jsx(C,{style:[M.emptySubtext,{color:n.textSecondary}],children:"Partagez le lien de la Watch Party pour inviter vos amis !"})]}):i.jsx(To,{data:r,renderItem:o,keyExtractor:s=>s.id.toString(),contentContainerStyle:M.listContent})]})})},M=Et.create({overlay:{position:"absolute",top:0,left:0,right:0,bottom:0,justifyContent:"center",alignItems:"center",zIndex:1e3},container:{width:"80%",maxWidth:400,maxHeight:"80%",borderRadius:10,overflow:"hidden",shadowColor:"#000",shadowOffset:{width:0,height:2},shadowOpacity:.25,shadowRadius:3.84,elevation:5},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:15,borderBottomWidth:1,borderBottomColor:"rgba(0, 0, 0, 0.1)"},title:{fontSize:18,fontWeight:"bold"},closeButton:{padding:5},listContent:{padding:10},participantItem:{flexDirection:"row",alignItems:"center",padding:10,borderRadius:8,marginBottom:8},avatar:{width:40,height:40,borderRadius:20},participantInfo:{flex:1,marginLeft:10},participantName:{fontSize:16,fontWeight:"500"},participantStatus:{fontSize:12,marginTop:2},participantIcons:{flexDirection:"row",alignItems:"center"},icon:{marginLeft:8},emptyContainer:{padding:20,alignItems:"center",justifyContent:"center"},emptyText:{fontSize:16,textAlign:"center",marginBottom:10},emptySubtext:{fontSize:14,textAlign:"center",fontStyle:"italic"}}),Lo=({layout:t,onLayoutChange:e,onClose:n})=>{const{colors:a}=Nt(),[r,o]=b.useState(!0),[s,l]=b.useState(!0),[c,f]=b.useState(!0),[d,g]=b.useState(!0),m=y=>{e(y)};return i.jsx(S,{style:[w.overlay,{backgroundColor:"rgba(0, 0, 0, 0.5)"}],children:i.jsxs(S,{style:[w.container,{backgroundColor:a.background}],children:[i.jsxs(S,{style:w.header,children:[i.jsx(C,{style:[w.title,{color:a.text}],children:"Paramètres de la Watch Party"}),i.jsx(L,{onPress:n,style:w.closeButton,children:i.jsx(_,{icon:xe,color:a.text,size:18})})]}),i.jsxs(Bn,{style:w.content,children:[i.jsxs(S,{style:w.section,children:[i.jsx(C,{style:[w.sectionTitle,{color:a.text}],children:"Disposition"}),i.jsxs(S,{style:w.layoutOptions,children:[i.jsxs(L,{style:[w.layoutOption,t==="side-by-side"&&[w.selectedOption,{borderColor:a.primary}]],onPress:()=>m("side-by-side"),children:[i.jsx(_,{icon:Ze,color:t==="side-by-side"?a.primary:a.icon,size:20}),i.jsx(C,{style:[w.layoutText,{color:t==="side-by-side"?a.primary:a.text}],children:"Côte à côte"})]}),i.jsxs(L,{style:[w.layoutOption,t==="video-focus"&&[w.selectedOption,{borderColor:a.primary}]],onPress:()=>m("video-focus"),children:[i.jsx(_,{icon:Ze,color:t==="video-focus"?a.primary:a.icon,size:24}),i.jsx(C,{style:[w.layoutText,{color:t==="video-focus"?a.primary:a.text}],children:"Focus vidéo"})]}),i.jsxs(L,{style:[w.layoutOption,t==="chat-focus"&&[w.selectedOption,{borderColor:a.primary}]],onPress:()=>m("chat-focus"),children:[i.jsx(_,{icon:yo,color:t==="chat-focus"?a.primary:a.icon,size:20}),i.jsx(C,{style:[w.layoutText,{color:t==="chat-focus"?a.primary:a.text}],children:"Focus chat"})]})]})]}),i.jsxs(S,{style:w.section,children:[i.jsx(C,{style:[w.sectionTitle,{color:a.text}],children:"Notifications"}),i.jsxs(S,{style:w.settingItem,children:[i.jsxs(S,{style:w.settingInfo,children:[i.jsx(C,{style:[w.settingLabel,{color:a.text}],children:"Notifications de messages"}),i.jsx(C,{style:[w.settingDescription,{color:a.textSecondary}],children:"Afficher une notification lorsque vous recevez un message"})]}),i.jsx(xt,{value:r,onValueChange:o,trackColor:{false:a.switchTrackOff,true:a.primary},thumbColor:a.switchThumb})]}),i.jsxs(S,{style:w.settingItem,children:[i.jsxs(S,{style:w.settingInfo,children:[i.jsx(C,{style:[w.settingLabel,{color:a.text}],children:"Sons de notification"}),i.jsx(C,{style:[w.settingDescription,{color:a.textSecondary}],children:"Jouer un son lors de la réception d'un message"})]}),i.jsx(xt,{value:s,onValueChange:l,trackColor:{false:a.switchTrackOff,true:a.primary},thumbColor:a.switchThumb})]})]}),i.jsxs(S,{style:w.section,children:[i.jsx(C,{style:[w.sectionTitle,{color:a.text}],children:"Synchronisation"}),i.jsxs(S,{style:w.settingItem,children:[i.jsxs(S,{style:w.settingInfo,children:[i.jsx(C,{style:[w.settingLabel,{color:a.text}],children:"Synchronisation automatique"}),i.jsx(C,{style:[w.settingDescription,{color:a.textSecondary}],children:"Synchroniser automatiquement avec les autres participants"})]}),i.jsx(xt,{value:c,onValueChange:f,trackColor:{false:a.switchTrackOff,true:a.primary},thumbColor:a.switchThumb})]}),i.jsxs(S,{style:w.settingItem,children:[i.jsxs(S,{style:w.settingInfo,children:[i.jsx(C,{style:[w.settingLabel,{color:a.text}],children:"Afficher les timestamps"}),i.jsx(C,{style:[w.settingDescription,{color:a.textSecondary}],children:"Afficher les timestamps cliquables dans les messages"})]}),i.jsx(xt,{value:d,onValueChange:g,trackColor:{false:a.switchTrackOff,true:a.primary},thumbColor:a.switchThumb})]})]})]}),i.jsx(S,{style:[w.footer,{borderTopColor:a.border}],children:i.jsx(L,{style:[w.button,{backgroundColor:a.primary}],onPress:n,children:i.jsx(C,{style:[w.buttonText,{color:a.textOnPrimary}],children:"Appliquer"})})})]})})},w=Et.create({overlay:{position:"absolute",top:0,left:0,right:0,bottom:0,justifyContent:"center",alignItems:"center",zIndex:1e3},container:{width:"80%",maxWidth:500,maxHeight:"80%",borderRadius:10,overflow:"hidden",shadowColor:"#000",shadowOffset:{width:0,height:2},shadowOpacity:.25,shadowRadius:3.84,elevation:5},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:15,borderBottomWidth:1,borderBottomColor:"rgba(0, 0, 0, 0.1)"},title:{fontSize:18,fontWeight:"bold"},closeButton:{padding:5},content:{padding:15},section:{marginBottom:20},sectionTitle:{fontSize:16,fontWeight:"bold",marginBottom:10},layoutOptions:{flexDirection:"row",justifyContent:"space-between",flexWrap:"wrap"},layoutOption:{width:"30%",padding:15,borderRadius:8,borderWidth:1,borderColor:"rgba(0, 0, 0, 0.1)",alignItems:"center",justifyContent:"center"},selectedOption:{borderWidth:2},layoutText:{marginTop:8,fontSize:14,textAlign:"center"},settingItem:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:12,borderBottomWidth:1,borderBottomColor:"rgba(0, 0, 0, 0.05)"},settingInfo:{flex:1,marginRight:10},settingLabel:{fontSize:16,marginBottom:4},settingDescription:{fontSize:12},footer:{padding:15,borderTopWidth:1,alignItems:"flex-end"},button:{paddingVertical:8,paddingHorizontal:20,borderRadius:20},buttonText:{fontSize:14,fontWeight:"500"}}),Hn=async t=>{try{if(navigator.clipboard&&navigator.clipboard.writeText)return await navigator.clipboard.writeText(t),!0;if(document.execCommand){const e=document.createElement("textarea");e.value=t,e.style.position="fixed",e.style.left="-999999px",e.style.top="-999999px",document.body.appendChild(e),e.focus(),e.select();const n=document.execCommand("copy");return document.body.removeChild(e),n}return console.warn("Aucune méthode de copie disponible dans ce navigateur"),!1}catch(e){return console.error("Erreur lors de la copie dans le presse-papiers:",e),!1}},Do=()=>{const{partyId:t,dramaId:e}=en(),n=nn(),{colors:a}=Nt(),{hasActiveSubscription:r,currentPlan:o}=an(),[s,l]=b.useState(""),[c,f]=b.useState(null),[d,g]=b.useState(0),[m,y]=b.useState(!1),[h,O]=b.useState(!1),[j,A]=b.useState(!1),[x,k]=b.useState("side-by-side"),E=b.useRef(null),{status:F,participants:at,videoSync:R,syncVideoPosition:T}=Yn(t);b.useEffect(()=>{(async()=>{try{f({id:e,title:"Drama Test",episode:1,season:1,thumbnail:"https://via.placeholder.com/300x150",description:"Description du drama pour la Watch Party"}),l("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")}catch(Kn){console.error("Erreur lors du chargement des informations du drama:",Kn),Qe.alert("Erreur","Impossible de charger la vidéo. Veuillez réessayer."),n("/browse")}})()},[e,n]),b.useEffect(()=>{R&&E.current&&(Math.abs(d-R.timestamp)>3&&E.current.seekTo(R.timestamp),m!==R.isPlaying&&(R.isPlaying?E.current.play():E.current.pause()))},[R,d,m]);const z=b.useCallback(B=>{g(B)},[]),ct=b.useCallback(B=>{y(B),T(d,B)},[d,T]),Gn=b.useCallback(B=>{E.current&&(E.current.seekTo(B),T(B,m))},[m,T]),Xn=b.useCallback(()=>{const B=`${window.location.origin}/watch-party/${t}/${e}`;Hn(B),Qe.alert("Lien copié !","Le lien de la Watch Party a été copié dans le presse-papiers. Partagez-le avec vos amis pour qu'ils puissent vous rejoindre.")},[t,e]),qn=b.useCallback(()=>{n(`/watch/${e}`)},[e,n]);return!r&&o!=="ultimate"?i.jsx(S,{style:[v.container,{backgroundColor:a.background}],children:i.jsxs(S,{style:v.subscriptionRequired,children:[i.jsx(C,{style:[v.subscriptionTitle,{color:a.text}],children:"Fonctionnalité Premium"}),i.jsx(C,{style:[v.subscriptionText,{color:a.textSecondary}],children:"La Watch Party est disponible uniquement pour les abonnements Ultimate."}),i.jsx(L,{style:[v.subscriptionButton,{backgroundColor:a.primary}],onPress:()=>n("/subscription"),children:i.jsx(C,{style:[v.buttonText,{color:a.textOnPrimary}],children:"Découvrir les abonnements"})})]})}):i.jsxs(S,{style:[v.container,{backgroundColor:a.background}],children:[i.jsxs(S,{style:[v.header,{backgroundColor:a.background2}],children:[i.jsx(S,{style:v.dramaInfo,children:c&&i.jsxs(i.Fragment,{children:[i.jsx(C,{style:[v.dramaTitle,{color:a.text}],children:c.title}),i.jsxs(C,{style:[v.dramaEpisode,{color:a.textSecondary}],children:["Saison ",c.season,", Épisode ",c.episode]})]})}),i.jsxs(S,{style:v.headerControls,children:[i.jsxs(L,{style:v.headerButton,onPress:()=>O(!h),children:[i.jsx(_,{icon:So,color:a.icon,size:18}),i.jsx(C,{style:[v.headerButtonText,{color:a.textSecondary}],children:at.length})]}),i.jsx(L,{style:v.headerButton,onPress:Xn,children:i.jsx(_,{icon:vo,color:a.icon,size:18})}),i.jsx(L,{style:v.headerButton,onPress:()=>A(!j),children:i.jsx(_,{icon:Po,color:a.icon,size:18})}),i.jsx(L,{style:[v.headerButton,v.leaveButton],onPress:qn,children:i.jsx(_,{icon:xe,color:a.error,size:18})})]})]}),i.jsxs(S,{style:[v.content,x==="side-by-side"&&v.contentSideBySide,x==="video-focus"&&v.contentVideoFocus,x==="chat-focus"&&v.contentChatFocus],children:[i.jsxs(S,{style:[v.videoContainer,x==="side-by-side"&&v.videoContainerSideBySide,x==="video-focus"&&v.videoContainerFocus,x==="chat-focus"&&v.videoContainerMinimized],children:[s?i.jsx(Io,{ref:E,source:s,poster:c==null?void 0:c.thumbnail,onTimeUpdate:z,onPlayStateChange:ct,style:v.videoPlayer}):i.jsx(S,{style:[v.loadingContainer,{backgroundColor:a.background2}],children:i.jsx(C,{style:[v.loadingText,{color:a.textSecondary}],children:"Chargement de la vidéo..."})}),F.connected&&i.jsx(S,{style:[v.syncIndicator,{backgroundColor:a.background2}],children:i.jsxs(C,{style:[v.syncText,{color:a.textSecondary}],children:[m?"Lecture synchronisée":"Pause synchronisée"," • ",ie(d)]})})]}),i.jsx(S,{style:[v.chatContainer,x==="side-by-side"&&v.chatContainerSideBySide,x==="video-focus"&&v.chatContainerMinimized,x==="chat-focus"&&v.chatContainerFocus],children:i.jsx(Mo,{partyId:t,videoTimestamp:d,onSeekTo:Gn,isPlaying:m})})]}),h&&i.jsx(zo,{participants:at,onClose:()=>O(!1)}),j&&i.jsx(Lo,{layout:x,onLayoutChange:k,onClose:()=>A(!1)}),i.jsxs(S,{style:[v.layoutControls,{backgroundColor:a.background2}],children:[i.jsx(L,{style:[v.layoutButton,x==="side-by-side"&&{borderBottomColor:a.primary,borderBottomWidth:2}],onPress:()=>k("side-by-side"),children:i.jsx(C,{style:[v.layoutButtonText,{color:x==="side-by-side"?a.primary:a.textSecondary}],children:"Côte à côte"})}),i.jsx(L,{style:[v.layoutButton,x==="video-focus"&&{borderBottomColor:a.primary,borderBottomWidth:2}],onPress:()=>k("video-focus"),children:i.jsx(C,{style:[v.layoutButtonText,{color:x==="video-focus"?a.primary:a.textSecondary}],children:"Vidéo"})}),i.jsx(L,{style:[v.layoutButton,x==="chat-focus"&&{borderBottomColor:a.primary,borderBottomWidth:2}],onPress:()=>k("chat-focus"),children:i.jsx(C,{style:[v.layoutButtonText,{color:x==="chat-focus"?a.primary:a.textSecondary}],children:"Chat"})})]})]})},v=Et.create({container:{flex:1,height:"100vh",width:"100%"},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:15,borderBottomWidth:1,borderBottomColor:"rgba(0, 0, 0, 0.1)"},dramaInfo:{flex:1},dramaTitle:{fontSize:18,fontWeight:"bold"},dramaEpisode:{fontSize:14},headerControls:{flexDirection:"row",alignItems:"center"},headerButton:{padding:10,marginLeft:10,borderRadius:20,flexDirection:"row",alignItems:"center"},headerButtonText:{marginLeft:5,fontSize:14},leaveButton:{backgroundColor:"rgba(255, 0, 0, 0.1)"},content:{flex:1,flexDirection:"row"},contentSideBySide:{flexDirection:"row"},contentVideoFocus:{flexDirection:"column"},contentChatFocus:{flexDirection:"column-reverse"},videoContainer:{position:"relative"},videoContainerSideBySide:{flex:2},videoContainerFocus:{flex:3},videoContainerMinimized:{height:200},videoPlayer:{width:"100%",height:"100%"},chatContainer:{borderLeftWidth:1,borderLeftColor:"rgba(0, 0, 0, 0.1)"},chatContainerSideBySide:{flex:1},chatContainerFocus:{flex:3},chatContainerMinimized:{flex:1},loadingContainer:{flex:1,justifyContent:"center",alignItems:"center"},loadingText:{fontSize:16},syncIndicator:{position:"absolute",bottom:10,right:10,padding:8,borderRadius:15,opacity:.8},syncText:{fontSize:12},layoutControls:{flexDirection:"row",justifyContent:"space-around",padding:10,borderTopWidth:1,borderTopColor:"rgba(0, 0, 0, 0.1)",display:"none"},layoutButton:{paddingVertical:10,paddingHorizontal:15},layoutButtonText:{fontSize:14,fontWeight:"500"},subscriptionRequired:{flex:1,justifyContent:"center",alignItems:"center",padding:20},subscriptionTitle:{fontSize:24,fontWeight:"bold",marginBottom:15},subscriptionText:{fontSize:16,textAlign:"center",marginBottom:30},subscriptionButton:{paddingVertical:12,paddingHorizontal:30,borderRadius:25},buttonText:{fontSize:16,fontWeight:"bold"},"@media (max-width: 768px)":{contentSideBySide:{flexDirection:"column"},videoContainerSideBySide:{height:"50%"},chatContainerSideBySide:{height:"50%",borderLeftWidth:0,borderTopWidth:1,borderTopColor:"rgba(0, 0, 0, 0.1)"},layoutControls:{display:"flex"}}}),tn=Jn(ea)(({theme:t})=>({paddingTop:t.spacing(3),paddingBottom:t.spacing(3),height:"100vh",display:"flex",flexDirection:"column"})),Bo=()=>{const{partyId:t,dramaId:e}=en(),n=nn(),{user:a,isAuthenticated:r}=Pt(),{hasActiveSubscription:o,currentPlan:s}=an(),[l,c]=b.useState(!0),[f,d]=b.useState(null),[g,m]=b.useState(!1),[y,h]=b.useState(""),[O,j]=b.useState("info");b.useEffect(()=>{r&&!l&&(!o||s!=="ultimate")&&d("La fonctionnalité Watch Party est disponible uniquement pour les abonnements Ultimate.")},[r,o,s,l]),b.useEffect(()=>{e&&t&&(async()=>{try{c(!0),setTimeout(()=>{c(!1)},1500)}catch(k){console.error("Erreur lors du chargement des détails du drama:",k),d("Impossible de charger les détails du drama. Veuillez réessayer."),c(!1)}})()},[e,t,a]);const A=(x,k)=>{k!=="clickaway"&&m(!1)};return l?i.jsx(tn,{children:i.jsxs(Mt,{sx:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"70vh"},children:[i.jsx(Zn,{size:60}),i.jsx(zt,{variant:"h6",sx:{mt:3},children:"Préparation de la Watch Party..."})]})}):f?i.jsx(tn,{children:i.jsxs(Mt,{sx:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"70vh"},children:[i.jsx(zt,{variant:"h5",color:"error",gutterBottom:!0,children:"Oups ! Un problème est survenu"}),i.jsx(zt,{variant:"body1",sx:{mb:3,textAlign:"center"},children:f}),!o&&i.jsx(Se,{variant:"contained",color:"primary",onClick:()=>n("/subscription"),sx:{mt:2},children:"Découvrir les abonnements"}),i.jsx(Se,{variant:"outlined",onClick:()=>n(-1),sx:{mt:2},children:"Retour"})]})}):i.jsxs(Mt,{sx:{height:"100vh",overflow:"hidden"},children:[i.jsx(Do,{partyId:t,dramaId:e,onShareSuccess:x=>{Hn(x),h("Lien de la Watch Party copié dans le presse-papiers !"),j("success"),m(!0)},onLeave:()=>n(`/watch/${e}`)}),i.jsx(Qn,{open:g,autoHideDuration:6e3,onClose:A,anchorOrigin:{vertical:"bottom",horizontal:"center"},children:i.jsx(ta,{onClose:A,severity:O,sx:{width:"100%"},children:y})})]})};export{Bo as default};
//# sourceMappingURL=WatchPartyPage-Dc4Q5RYM.js.map
