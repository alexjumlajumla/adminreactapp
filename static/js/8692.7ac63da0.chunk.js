"use strict";(self.webpackChunkgithubit_dashboard=self.webpackChunkgithubit_dashboard||[]).push([[8692],{75336:(e,t,l)=>{function i(e,t){let l=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"title";const i=null===e||void 0===e?void 0:e.map((e=>({[null===e||void 0===e?void 0:e.locale]:t[`${l}[${null===e||void 0===e?void 0:e.locale}]`]?t[`${l}[${null===e||void 0===e?void 0:e.locale}]`]:void 0})));return Object.assign({},...i)}l.d(t,{Z:()=>i})},28692:(e,t,l)=>{l.r(t),l.d(t,{default:()=>Z});var i=l(47313),s=l(97890),n=l(23560),o=l(10976),a=l(77181),c=l(72652),d=l(2717),u=l(90954),r=l(94843),v=l(56078),f=l(73431),h=l(75336),g=l(8550),b=l(24511),m=l(44287),p=l(46417);function Z(){const{t:e}=(0,b.$)(),{activeMenu:t}=(0,d.v9)((e=>e.menu),d.wU),{languages:l}=(0,d.v9)((e=>e.formLang),d.wU),Z=(0,d.I0)(),[j]=o.Z.useForm(),x=(0,s.s0)(),{uuid:$}=(0,s.UO)(),[y,_]=(0,i.useState)(!1);(0,i.useEffect)((()=>()=>{const e=j.getFieldsValue(!0);Z((0,u.nc)({activeMenu:t,data:e}))}),[]);function k(e){if(!e)return{};const{translations:t}=e,i=l.map((e=>{var l,i,s;return{[`title[${e.locale}]`]:null===(l=t.find((t=>t.locale===e.locale)))||void 0===l?void 0:l.title,[`description[${e.locale}]`]:null===(i=t.find((t=>t.locale===e.locale)))||void 0===i?void 0:i.description,[`short_desc[${e.locale}]`]:null===(s=t.find((t=>t.locale===e.locale)))||void 0===s?void 0:s.short_desc}}));return Object.assign({},...i)}return(0,i.useEffect)((()=>{t.refetch&&(e=>{_(!0),v.Z.getById(e).then((e=>{let l=e.data;const i={...l,...k(l),image:[(0,g.Z)(l.img)]};j.setFieldsValue(i),Z((0,u.nc)({activeMenu:t,data:i}))})).finally((()=>{_(!1),Z((0,u.A_)(t))}))})($)}),[t.refetch]),(0,p.jsx)(a.Z,{title:e("clone.blog"),extra:(0,p.jsx)(f.Z,{}),children:y?(0,p.jsx)("div",{className:"d-flex justify-content-center align-items-center",children:(0,p.jsx)(c.Z,{size:"large",className:"py-5"})}):(0,p.jsx)(m.Z,{form:j,handleSubmit:(i,s)=>{var o;const a="blogs",c={status:"published",type:"blog"},f={type:"blog",active:i.active?1:0,images:[null===(o=s[0])||void 0===o?void 0:o.name],title:(0,h.Z)(l,i),description:(0,h.Z)(l,i,"description"),short_desc:(0,h.Z)(l,i,"short_desc")};return v.Z.create(f).then((()=>{n.Am.success(e("successfully.cloned")),(0,d.dC)((()=>{Z((0,u.ph)({...t,nextUrl:a})),Z((0,r.J)(c))})),x("/blogs")}))}})})}}}]);