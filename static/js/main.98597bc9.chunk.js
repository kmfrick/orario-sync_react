(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{167:function(e,t,n){"use strict";n.r(t);var a=n(0),s=n.n(a),r=n(54),c=n.n(r);n(61),Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var l=n(55),u=n(17),o=n(18),i=n(21),h=n(19),m=n(20),d=n(7),p=n(22),f=n.n(p),g=function(e){function t(e){var n;return Object(u.a)(this,t),(n=Object(i.a)(this,Object(h.a)(t).call(this,e))).updateSelected=n.updateSelected.bind(Object(d.a)(Object(d.a)(n))),n}return Object(m.a)(t,e),Object(o.a)(t,[{key:"updateSelected",value:function(e){this.props.onSelect(e)}},{key:"render",value:function(){return this.props.multiple?s.a.createElement(f.a,{multiple:!0,items:this.props.items,onChange:this.updateSelected,selected:this.props.selected}):s.a.createElement(f.a,{multiple:!1,items:this.props.items,onChange:this.updateSelected,selected:[this.props.selected]})}}]),t}(f.a),E="https://orario-syncunibo-aoajqpirse.now.sh",S={"[LMCU]":6,"[L]":3,"[LM]":2,"":0},y=["Primo","Secondo","Terzo","Quarto","Quinto","Sesto"],v=s.a.createElement(s.a.Fragment,null,"OrarioSync"),x=s.a.createElement(s.a.Fragment,null,"Seleziona la tua Scuola"),b=s.a.createElement(s.a.Fragment,null,"Seleziona il tuo corso di studi"),I=s.a.createElement(s.a.Fragment,null,"Seleziona l'anno a cui sei iscritto"),j=s.a.createElement(s.a.Fragment,null,"Seleziona il tuo curriculum"),w=s.a.createElement(s.a.Fragment,null,"Seleziona i corsi che segui"),O=s.a.createElement(s.a.Fragment,null,"Scarica orario in iCal"),C=new RegExp("\\[(.*?)]"),F=function(e){function t(){var e,n;Object(u.a)(this,t);for(var a=arguments.length,s=new Array(a),r=0;r<a;r++)s[r]=arguments[r];return(n=Object(i.a)(this,(e=Object(h.a)(t)).call.apply(e,[this].concat(s)))).state={schools:[],schoolIndex:-1,courses:[],courseIndex:-1,courseType:"",years:[],year:-1,curricula:[],curriculumIndex:-1,classes:[],selectedClasses:[],classesBtm:0},n}return Object(m.a)(t,e),Object(o.a)(t,[{key:"componentDidMount",value:function(){var e=this;fetch(E+"/getschools").then(function(e){return e.json()}).then(function(t){e.setState({schools:t})})}},{key:"componentDidUpdate",value:function(e,t){var n=this,a=this.state.schoolIndex,s=this.state.courseIndex,r=this.state.courseType,c=this.state.curriculumIndex,u=(this.state.classes,this.state.classesBtm,this.state.selectedClasses),o=this.state.year;if(t.schoolIndex!==a&&(fetch(E+"/getcourses?school="+a).then(function(e){return e.json()}).then(function(e){return n.setState({courses:e})}),this.setState({courseIndex:-1,courseType:"",year:-1,curricula:[],curriculumIndex:-1})),t.courseType!==r){var i=[];Object(l.a)(Array(S[this.state.courseType]).keys()).forEach(function(e){return i.push(y[e])}),this.setState({years:i})}if((t.courseIndex!==s&&o>0||t.year!==o)&&(fetch(E+"/getcurricula?school="+a+"&course="+s+"&year="+o).then(function(e){return e.json()}).then(function(e){return n.setState({curricula:e})}),this.setState({curricula:[],curriculumIndex:-1})),t.curriculumIndex!==c&&(console.log("Curriculum changed, resetting classes"),fetch(E+"/getclasses?school="+a+"&course="+s+"&year="+o+"&curr="+c).then(function(e){return e.json()}).then(function(e){return n.setState({classes:e})}),this.setState({classes:[],selectedClasses:[],classesBtm:0})),t.selectedClasses!==u){for(var h={},m=0;m<u.length;m++){var d=u[m];h[d]=h[d]?h[d]+1:1}var p=[];u.forEach(function(e){h[e]%2!==0&&p.push(e)});var f=0;p.forEach(function(e){return f^=1<<e}),console.log("btm="+f+"\nclasses="+JSON.stringify(p)),this.setState({classesBtm:f})}}},{key:"render",value:function(){var e=this,t=this.state.schools,n=this.state.schoolIndex,a=this.state.courses,r=this.state.courseType,c=this.state.courseIndex,l=this.state.year,u=this.state.curricula,o=this.state.curriculumIndex,i=this.state.classes,h=this.state.selectedClasses,m=this.state.classesBtm;if(!t.length)return s.a.createElement("span",null,"Getting schools...");var d=[];if(t.forEach(function(e){return d.push(e.name)}),!a.length&&n>=0)return s.a.createElement("span",null,"Getting courses...");var p=[];if(a.forEach(function(e){return p.push(e.name)}),!u.length&&l>=0)return s.a.createElement("span",null,"Getting curricula...");var f=[];if(u.forEach(function(e){return f.push(e.name)}),!i.length&&o>=0)return s.a.createElement("span",null,"Getting classes...");var S=[];return i.forEach(function(e){return S.push(e.name)}),s.a.createElement(s.a.Fragment,null,s.a.createElement("h1",null,v),s.a.createElement("h2",null,x),s.a.createElement(g,{items:d,onSelect:function(t){return e.setState({schoolIndex:t})},selected:n,multiple:!1}),a.length&&s.a.createElement(s.a.Fragment,null,s.a.createElement("h2",null,b),s.a.createElement(g,{items:p,onSelect:function(t){e.setState({courseIndex:t}),e.setState({courseType:C.exec(p[t])[0]})},selected:c,multiple:!1})),r.length&&s.a.createElement(s.a.Fragment,null,s.a.createElement("h2",null,I),s.a.createElement(g,{items:this.state.years,onSelect:function(t){return e.setState({year:t+1})},selected:l-1,multiple:!1})),l>=0&&s.a.createElement(s.a.Fragment,null,s.a.createElement("h2",null,j),s.a.createElement(g,{items:f,onSelect:function(t){return e.setState({curriculumIndex:t})},selected:o,multiple:!1})),o>=0&&s.a.createElement(s.a.Fragment,null,s.a.createElement("h2",null,w),s.a.createElement(g,{items:i,multiple:!0,onSelect:function(t){e.setState({selectedClasses:t})},selected:h})),m>0&&s.a.createElement("div",null,s.a.createElement("button",{type:"button",onClick:function(e){return window.open(E+"/getical?school="+n+"&course="+c+"&year="+l+"&curr="+o+"&classes="+m)}},O)))}}]),t}(s.a.Component),k=s.a.createElement(F,null);c.a.render(k,document.getElementById("container")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})},56:function(e,t,n){e.exports=n(167)},61:function(e,t,n){}},[[56,2,1]]]);
//# sourceMappingURL=main.98597bc9.chunk.js.map