(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{167:function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),c=n(54),u=n.n(c);n(61),Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var o=n(55),s=n(17),l=n(18),i=n(21),h=n(19),m=n(20),p=n(7),f=n(22),d=n.n(f),b=function(e){function t(e){var n;return Object(s.a)(this,t),(n=Object(i.a)(this,Object(h.a)(t).call(this,e))).updateSelected=n.updateSelected.bind(Object(p.a)(Object(p.a)(n))),n}return Object(m.a)(t,e),Object(l.a)(t,[{key:"updateSelected",value:function(e){this.props.onSelect(e)}},{key:"render",value:function(){var e=this.props.selected;return e>=0?r.a.createElement(d.a,{multiple:!1,items:this.props.items,onChange:this.updateSelected,selected:[e]}):r.a.createElement(d.a,{multiple:!1,items:this.props.items,onChange:this.updateSelected})}}]),t}(d.a),E="https://orario-syncunibo-tvwqqxhvxt.now.sh/",g={"[LMCU]":6,"[L]":3,"[LM]":2,"":0},y=["Primo","Secondo","Terzo","Quarto","Quinto","Sesto"],S=r.a.createElement(r.a.Fragment,null,"OrarioSync"),v=r.a.createElement(r.a.Fragment,null,"Seleziona la tua Scuola"),w=r.a.createElement(r.a.Fragment,null,"Seleziona il tuo corso di studi"),j=r.a.createElement(r.a.Fragment,null,"Seleziona l'anno a cui sei iscritto"),N=r.a.createElement(r.a.Fragment,null,"Seleziona il tuo curriculum"),O=r.a.createElement(r.a.Fragment,null,"Scarica orario in iCal"),k=new RegExp("\\[(.*?)]"),F=function(e){function t(){var e,n;Object(s.a)(this,t);for(var a=arguments.length,r=new Array(a),c=0;c<a;c++)r[c]=arguments[c];return(n=Object(i.a)(this,(e=Object(h.a)(t)).call.apply(e,[this].concat(r)))).state={schools:[],schoolNumber:-1,courses:[],courseNumber:-1,courseType:"",years:[],year:-1,curricula:[],curriculumNumber:-1},n}return Object(m.a)(t,e),Object(l.a)(t,[{key:"componentDidMount",value:function(){var e=this;fetch(E+"/getschools").then(function(e){return e.json()}).then(function(t){e.setState({schools:t})})}},{key:"componentDidUpdate",value:function(e,t){var n=this,a=this.state.schoolNumber,r=this.state.courseNumber,c=this.state.courseType,u=this.state.year;if(t.schoolNumber!==a&&(fetch(E+"/getcourses/"+a).then(function(e){return e.json()}).then(function(e){return n.setState({courses:e})}),this.setState({courseNumber:-1,courseType:"",year:-1,curricula:[],curriculumNumber:-1})),t.courseType!==c){var s=[];Object(o.a)(Array(g[this.state.courseType]).keys()).forEach(function(e){return s.push(y[e])}),this.setState({years:s})}(t.courseNumber!==r&&u>0||t.year!==u)&&(fetch(E+"/getcurricula/"+a+"/"+r+"/"+u).then(function(e){return e.json()}).then(function(e){return n.setState({curricula:e})}),this.setState({curricula:[],curriculumNumber:-1}))}},{key:"render",value:function(){var e=this,t=this.state.schools,n=this.state.schoolNumber,a=this.state.courses,c=this.state.courseType,u=this.state.courseNumber,o=this.state.year,s=this.state.curricula,l=this.state.curriculumNumber;if(!t.length)return r.a.createElement("span",null,"Getting schools...");var i=[];if(t.forEach(function(e){return i.push(e.name)}),!a.length&&n>=0)return r.a.createElement("span",null,"Getting courses...");var h=[];if(a.forEach(function(e){return h.push(e.name)}),!s.length&&o>=0)return r.a.createElement("span",null,"Getting curricula...");var m=[];return s.forEach(function(e){return m.push(e.name)}),r.a.createElement(r.a.Fragment,null,r.a.createElement("h1",null,S),r.a.createElement("h2",null,v),r.a.createElement(b,{items:i,onSelect:function(t){return e.setState({schoolNumber:t})},selected:n}),a.length&&r.a.createElement(r.a.Fragment,null,r.a.createElement("h2",null,w),r.a.createElement(b,{items:h,onSelect:function(t){e.setState({courseNumber:t}),e.setState({courseType:k.exec(h[t])[0]})},selected:u})),c.length&&r.a.createElement(r.a.Fragment,null,r.a.createElement("h2",null,j),r.a.createElement(b,{items:this.state.years,onSelect:function(t){return e.setState({year:t+1})},selected:o-1})),o>=0&&r.a.createElement(r.a.Fragment,null,r.a.createElement("h2",null,N),r.a.createElement(b,{items:m,onSelect:function(t){return e.setState({curriculumNumber:t})},selected:l})),l>=0&&r.a.createElement("div",null,r.a.createElement("button",{type:"button",onClick:function(e){return window.open(E+"/getical/"+n+"/"+u+"/"+o+"/"+l)}},O)))}}]),t}(r.a.Component),T=r.a.createElement(F,null);u.a.render(T,document.getElementById("container")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})},56:function(e,t,n){e.exports=n(167)},61:function(e,t,n){}},[[56,2,1]]]);
//# sourceMappingURL=main.3172dc56.chunk.js.map