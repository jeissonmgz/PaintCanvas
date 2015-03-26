var x,y;
var mover=false;
//Ocultar-Mostrar
document.getElementById("tb0").onclick=function(){
	obj = document.getElementById("m_propiedades");
	obj.style.display=(obj.style.display=='none')?'block':'none';
	document.getElementById("tb0").style.background=(obj.style.display=='none')?'#3c3c3c':'#000';}
document.getElementById("tb1").onclick=function(){
	obj=document.getElementById("m_color");
	obj.style.display=(obj.style.display=='none')?'block':'none';
	document.getElementById("tb1").style.background=(obj.style.display=='none')?'#3c3c3c':'#000';}
document.getElementById("tb2").onclick=function(){
	obj = document.getElementById("m_figura");
	obj.style.display=(obj.style.display=='none')?'block':'none';
	document.getElementById("tb2").style.background=(obj.style.display=='none')?'#3c3c3c':'#000';}
//Guardar
document.getElementById("tb3").onclick=function(){
	window.open(document.getElementById("g").toDataURL());}
//Propiedades
document.getElementById("t_propiedades").onmousedown=function(evt){
	evt.preventDefault();
	x=evt.clientX;
    y=evt.clientY;
    mover=true;};
document.getElementById("t_propiedades").onmousemove=function(evt){
	if(mover){
        evt.preventDefault();
		var xInc = evt.clientX-x;
        var yInc = evt.clientY-y;
        x =evt.clientX;
        y =evt.clientY;
        var elemento=document.getElementById("m_propiedades");
        elemento.style.top=(parseInt(document.defaultView.getComputedStyle(elemento,null).getPropertyValue("top"))+yInc)+"px";
		elemento.style.left=(parseInt(document.defaultView.getComputedStyle(elemento,null).getPropertyValue("left"))+xInc)+"px";}};
document.getElementById("t_propiedades").onmouseout=function(e){mover=false;};
//Color
document.getElementById("t_color").onmousedown=function(evt){
	evt.preventDefault();
	x=evt.clientX;
    y=evt.clientY;
    mover=true;};
document.getElementById("t_color").onmousemove=function(evt){
	if(mover){
        evt.preventDefault();
		var xInc = evt.clientX-x;
        var yInc = evt.clientY-y;
        x =evt.clientX;
        y =evt.clientY;
        var elemento=document.getElementById("m_color");
        elemento.style.top=(parseInt(document.defaultView.getComputedStyle(elemento,null).getPropertyValue("top"))+yInc)+"px";
		elemento.style.left=(parseInt(document.defaultView.getComputedStyle(elemento,null).getPropertyValue("left"))+xInc)+"px";}};
document.getElementById("t_color").onmouseout=function(e){mover=false;};
//Linea
document.getElementById("t_linea").onmousedown=function(evt){
	evt.preventDefault();
	x=evt.clientX;
    y=evt.clientY;
    mover=true;};
document.getElementById("t_linea").onmousemove=function(evt){
	if(mover){
        evt.preventDefault();
		var xInc = evt.clientX-x;
        var yInc = evt.clientY-y;
        x =evt.clientX;
        y =evt.clientY;
        var elemento=document.getElementById("m_linea");
        elemento.style.top=(parseInt(document.defaultView.getComputedStyle(elemento,null).getPropertyValue("top"))+yInc)+"px";
		elemento.style.left=(parseInt(document.defaultView.getComputedStyle(elemento,null).getPropertyValue("left"))+xInc)+"px";}};
document.getElementById("t_linea").onmouseout=function(e){mover=false;};
//Figuras
document.getElementById("t_figura").onmousedown=function(evt){
	evt.preventDefault();
	x=evt.clientX;
    y=evt.clientY;
    mover=true;};
document.getElementById("m_figura").onmousemove=function(evt){
	if(mover){
        evt.preventDefault();
		var xInc = evt.clientX-x;
        var yInc = evt.clientY-y;
        x =evt.clientX;
        y =evt.clientY;
        var elemento=document.getElementById("m_figura");
        elemento.style.top=(parseInt(document.defaultView.getComputedStyle(elemento,null).getPropertyValue("top"))+yInc)+"px";
		elemento.style.left=(parseInt(document.defaultView.getComputedStyle(elemento,null).getPropertyValue("left"))+xInc)+"px";}};
document.getElementById("all").onmouseup=function(e){mover=false;};
document.getElementById("t_figura").onmouseout=function(e){mover=false;};