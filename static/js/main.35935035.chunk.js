(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{168:function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),s=n(55),c=n.n(s);n(62),Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var l=n(56),o=n(17),i=n(18),u=n(21),h=n(19),m=n(20),d=n(7),p=n(22),f=n.n(p),y=function(e){function t(e){var n;return Object(o.a)(this,t),(n=Object(u.a)(this,Object(h.a)(t).call(this,e))).updateSelected=n.updateSelected.bind(Object(d.a)(Object(d.a)(n))),n}return Object(m.a)(t,e),Object(i.a)(t,[{key:"updateSelected",value:function(e){this.props.onSelect(e)}},{key:"render",value:function(){return this.props.multiple?r.a.createElement(f.a,{multiple:!0,items:this.props.items,onChange:this.updateSelected,selected:this.props.selected}):r.a.createElement(f.a,{multiple:!1,items:this.props.items,onChange:this.updateSelected,selected:[this.props.selected]})}}]),t}(f.a),E=n(23),g=n.n(E),S="https://orario-sync-unibo.vercel.app/api",v={"[LMCU]":6,"[L]":3,"[LM]":2,"":0},F=["Primo","Secondo","Terzo","Quarto","Quinto","Sesto"],x=r.a.createElement(r.a.Fragment,null,"OrarioSync"),b=r.a.createElement(r.a.Fragment,null,"Seleziona il tuo ambito di studi"),C=r.a.createElement(r.a.Fragment,null,"Seleziona il tuo corso di studi"),I=r.a.createElement(r.a.Fragment,null,"Seleziona l'anno a cui sei iscritto"),j=r.a.createElement(r.a.Fragment,null,"Seleziona il tuo curriculum"),w=r.a.createElement(r.a.Fragment,null,"Seleziona i corsi che segui"),z=r.a.createElement(r.a.Fragment,null,"Scarica orario in iCal"),O=new RegExp("\\[(.*?)]"),A=function(e){function t(){var e,n;Object(o.a)(this,t);for(var a=arguments.length,r=new Array(a),s=0;s<a;s++)r[s]=arguments[s];return(n=Object(u.a)(this,(e=Object(h.a)(t)).call.apply(e,[this].concat(r)))).state={schools:[],schoolIndex:-1,courses:[],courseIndex:-1,courseType:"",years:[],year:-1,curricula:[],curriculumIndex:-1,classes:[],selectedClasses:[],classesBtm:g.a.fromBinaryString("0"),listBgColor:"#fafafa",listTextColor:"#000000",listSelColor:"#d7e7ff"},n}return Object(m.a)(t,e),Object(i.a)(t,[{key:"componentDidMount",value:function(){var e=this;fetch(S+"/getschools.py").then(function(e){return e.json()}).then(function(t){e.setState({schools:t})})}},{key:"componentDidUpdate",value:function(e,t){var n=this,a=this.state.schoolIndex,r=this.state.courseIndex,s=this.state.courseType,c=this.state.curriculumIndex,o=this.state.selectedClasses,i=this.state.year;if(t.schoolIndex!==a&&(fetch(S+"/getcourses.py?school="+a).then(function(e){return e.json()}).then(function(e){return n.setState({courses:e})}),this.setState({courseIndex:-1,courseType:"",year:-1,curricula:[],curriculumIndex:-1}),document.body.style.borderColor=["#EFAA00","#FF7D18","#68A9E0","#000000","#AA005F","#CE1126","#8B2346","#AA005F","#008633","#008633","#FF7D18","#CE1126","#8B2346","#EFAA00","#AA005F","#FFFFFF"][a]),t.courseType!==s){var u=[];Object(l.a)(Array(v[this.state.courseType]).keys()).forEach(function(e){return u.push(F[e])}),this.setState({years:u})}if((t.courseIndex!==r&&i>0||t.year!==i)&&(fetch(S+"/getcurricula.py?school="+a+"&course="+r+"&year="+i).then(function(e){return e.json()}).then(function(e){return n.setState({curricula:e})}),this.setState({curricula:[],curriculumIndex:-1})),t.curriculumIndex!==c&&(fetch(S+"/getclasses.py?school="+a+"&course="+r+"&year="+i+"&curr="+c).then(function(e){return e.json()}).then(function(e){return n.setState({classes:e})}),this.setState({classes:[],selectedClasses:[],classesBtm:g.a.fromBinaryString("0")})),t.selectedClasses!==o){for(var h={},m=0;m<o.length;m++){var d=o[m];h[d]=h[d]?h[d]+1:1}var p=[];o.forEach(function(e){h[e]%2!==0&&p.push(e)});var f=g.a.fromBinaryString("0");p.forEach(function(e){return f.flip(e)}),this.setState({classesBtm:f})}}},{key:"render",value:function(){var e=this,t=this.state.schools,n=this.state.schoolIndex,a=this.state.courses,s=this.state.courseType,c=this.state.courseIndex,l=this.state.year,o=this.state.curricula,i=this.state.curriculumIndex,u=this.state.classes,h=this.state.selectedClasses,m=this.state.classesBtm,d={backgroundColor:this.state.listBgColor,color:this.state.listTextColor},p={fontSize:"18pt",padding:"16px",margin:"16px"};if(!t.length)return r.a.createElement("span",null,"Inizializzazione in breve tempo...");var f=[];if(t.forEach(function(e){return f.push(e.name)}),!a.length&&n>=0)return r.a.createElement("span",null,"Sto chiedendo alla scuola i corsi di studio...");var E=[];if(a.forEach(function(e){return E.push(e.name)}),!o.length&&l>=0)return r.a.createElement("span",null,"Sto chiedendo al corso di studio i curricula...");var g=[];if(o.forEach(function(e){return g.push(e.name)}),!u.length&&i>=0)return r.a.createElement("span",null,"Sto chiedendo al corso di studio i corsi...");var v=[];return u.forEach(function(e){return v.push(e.name)}),r.a.createElement(r.a.Fragment,null,r.a.createElement("h1",null,x),r.a.createElement("h2",null,b),r.a.createElement(y,{items:f,onSelect:function(t){return e.setState({schoolIndex:t})},selected:n,multiple:!1,style:d}),a.length&&r.a.createElement(r.a.Fragment,null,r.a.createElement("h2",null,C),r.a.createElement(y,{items:E,onSelect:function(t){e.setState({courseIndex:t}),e.setState({courseType:O.exec(E[t])[0]})},selected:c,multiple:!1})),s.length&&r.a.createElement(r.a.Fragment,null,r.a.createElement("h2",null,I),r.a.createElement(y,{items:this.state.years,onSelect:function(t){return e.setState({year:t+1})},selected:l-1,multiple:!1})),l>=0&&r.a.createElement(r.a.Fragment,null,r.a.createElement("h2",null,j),r.a.createElement(y,{items:g,onSelect:function(t){return e.setState({curriculumIndex:t})},selected:i,multiple:!1})),i>=0&&r.a.createElement(r.a.Fragment,null,r.a.createElement("h2",null,w),r.a.createElement(y,{items:u,multiple:!0,onSelect:function(t){e.setState({selectedClasses:t})},selected:h})),m>0&&r.a.createElement("div",null,r.a.createElement("div",{style:p},"Sincronizza il calendario al seguente indirizzo per avere l'orario sempre aggiornato!"),r.a.createElement("div",{style:p},r.a.createElement("input",{type:"textarea",value:S+"/getical.py?school="+n+"&course="+c+"&year="+l+"&curr="+i+"&classes="+m.toString(10)})),r.a.createElement("div",{style:p},"oppure"),r.a.createElement("button",{type:"button",onClick:function(e){return window.open(S+"/getical.py?school="+n+"&course="+c+"&year="+l+"&curr="+i+"&classes="+m.toString(10))}},z)))}}]),t}(r.a.Component),B=r.a.createElement(A,null);c.a.render(B,document.getElementById("container")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})},57:function(e,t,n){e.exports=n(168)},62:function(e,t,n){}},[[57,2,1]]]);
//# sourceMappingURL=main.35935035.chunk.js.map