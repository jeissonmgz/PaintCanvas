var canvas=document.getElementById('g');
var aux_g,c1="#000000",c2="#000000",t1=1,t2=1;
var g=canvas.getContext('2d');
var ban=false,stroke=true,fill=false;
var x1,y1,x2,y2,opc=1;
grilla();
//grilla
function grilla(){
	var aux_c=g.strokeStyle;
	var aux_grosor=g.lineWidth;
	g.lineWidth=0.1;
	g.strokeStyle="#2217f4";
	for(i=0;i<canvas.width;i+=50){
		g.beginPath();
		g.moveTo(i,0);
		g.lineTo(i,canvas.height);
		g.closePath();
		g.stroke();}
	for(i=0;i<canvas.height;i+=50){
		g.beginPath();
		g.moveTo(0,i);
		g.lineTo(canvas.width,i);
		g.closePath();
		g.stroke();}
	g.lineWidth=aux_grosor;
	g.strokeStyle=aux_c;}
//Figuras
function guias(){
	var aux_c=g.strokeStyle;
	var aux_grosor=g.lineWidth;
	g.lineWidth=0.1;
	g.strokeStyle="#2217f4";
	g.beginPath();
	g.moveTo(x2,0);
	g.lineTo(x2,canvas.height);
	g.closePath();
	g.stroke();
	g.beginPath();
	g.moveTo(0,y2);
	g.lineTo(canvas.width,y2);
	g.closePath();
	g.stroke();
	g.lineWidth=aux_grosor;
	g.strokeStyle=aux_c;}
function dibujar(){
	switch(opc){
		case 1:linea();break;
		case 2:cuadrado();break;
		case 3:circulo();break;
		case 4:ovalo();break;
		case 5:poligono();break;
		case 6:texto();}}
function linea(){
	g.lineCap=document.getElementById('estilolinea').value;
	g.beginPath();
	g.moveTo(x1,y1);
	g.lineTo(x2,y2);
	g.stroke();}
function cuadrado(){
	g.fillRect(x1,y1,x2-x1,y2-y1);
	g.strokeRect(x1,y1,x2-x1,y2-y1);}
function circulo(){
	g.beginPath();
	var r=Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
	g.arc(x1,y1,r,0,2*Math.PI,false);
	g.closePath();
	g.fill();
	g.stroke();}
function ovalo(){
	var escala=Math.abs((y2-y1)/(x2-x1));
	g.save();
	g.scale(1,escala);
	g.beginPath();
	g.arc(x1,y1/escala,Math.abs(x2-x1),0,2*Math.PI,false);
	g.closePath();
	g.fill();
	g.stroke(); 
	g.restore();}
function poligono(){
	var num_ptas_pol=document.getElementById('num_ptas_pol').value;
	g.beginPath();
	var r=Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
	var ang_ini=((x2-x1)>=0)?Math.asin((y2-y1)/r):Math.acos((x2-x1)/r);
	if((x2-x1)<0&&(y2-y1)<0)ang_ini=Math.atan((y2-y1)/(x2-x1))+Math.PI;
	g.moveTo(r*Math.cos(0*2*Math.PI/num_ptas_pol+ang_ini)+x1,r*Math.sin(0*2*Math.PI/num_ptas_pol+ang_ini)+y1);
	for(var i=1;i<=num_ptas_pol;i++)g.lineTo(r*Math.cos(i*2*Math.PI/num_ptas_pol+ang_ini)+x1,r*Math.sin(i*2*Math.PI/num_ptas_pol+ang_ini)+y1);
	g.closePath();
	g.fill();
	g.stroke();}
function texto(){
	cursor}
//Efectos del Raton
function ptoX(e){
	var aux=canvas.getBoundingClientRect();
	return (e.clientX-aux.left*(canvas.width/aux.width));}
function ptoY(e){
	var aux=canvas.getBoundingClientRect();
	return (e.clientY-aux.top*(canvas.height/aux.height));}
canvas.onmousedown=function (e){
	aux_g=g.getImageData(0,0,canvas.width,canvas.height);
	x1=ptoX(e);
	y1=ptoY(e);
	ban=true;};
canvas.onmousemove=function(e){
	if(ban){
		g.putImageData(aux_g,0,0);
		x2=ptoX(e);
		y2=ptoY(e);
		guias();
		dibujar();}};
canvas.onmouseup=function(e){
	if(ban){
		g.putImageData(aux_g,0,0);
		x2=ptoX(e);
		y2=ptoY(e);
		dibujar();
		ban=false;}};
canvas.onkeypress=function(){
	if(ban){
		g.putImageData(aux_g,0,0);
		ban=false;}};
canvas.onmouseout=function(){
	if(ban){
		g.putImageData(aux_g,0,0);
		ban=false;}};
canvas.onclick=function(){
	if(ban){
		g.putImageData(aux_g,0,0);
		x2=ptoX(e);
		y2=ptoY(e);
		dibujar();
		ban=false;}}
//Seleccionar figuras
document.getElementById('b1').onclick=function(){opc=1;};
document.getElementById('b2').onclick=function(){opc=2;};
document.getElementById('b3').onclick=function(){opc=3;};
document.getElementById('b4').onclick=function(){opc=4;};
document.getElementById('b5').onclick=function(){opc=5;};
document.getElementById('b6').onclick=function(){opc=6;};
//Seleccionar color
document.getElementById('rb1').onclick=function(){
	stroke=true;
	fill=false;
	document.getElementById('color').value=c1;
	document.getElementById('alpha').value=t1;};
document.getElementById('rb2').onclick=function(){
	stroke=false;
	fill=true;
	document.getElementById('color').value=c2;
	document.getElementById('alpha').value=t2;};
document.getElementById('color').onchange=function(){
	var h=document.getElementById('color').value;
	h="rgba("+hexToR(h)+","+hexToG(h)+","+hexToB(h)+","+document.getElementById('alpha').value+")";
	if(stroke){
		c1=document.getElementById('color').value;
		t1=document.getElementById('alpha').value;
		g.strokeStyle=h;}
	if(fill){
		c2=document.getElementById('color').value;
		t2=document.getElementById('alpha').value;
		g.fillStyle=h;}};
document.getElementById('alpha').onchange=function(){
	var h=document.getElementById('color').value;
	h="rgba("+hexToR(h)+","+hexToG(h)+","+hexToB(h)+","+document.getElementById('alpha').value+")";
	if(stroke){
		c1=document.getElementById('color').value;
		t1=document.getElementById('alpha').value;
		g.strokeStyle=h;}
	if(fill){
		c2=document.getElementById('color').value;
		t2=document.getElementById('alpha').value;
		g.fillStyle=h;}};
function hexToR(h){return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h){return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h){return parseInt((cutHex(h)).substring(4,6),16)}
function cutHex(h){return (h.charAt(0)=="#") ? h.substring(1,7):h}
//Propiedades
document.getElementById('alto').onchange=function(){
	aux_g=g.getImageData(0,0,canvas.width,canvas.height);
	canvas.height=document.getElementById('alto').value;
	g.putImageData(aux_g,0,0);}
document.getElementById('ancho').onchange=function(){
	aux_g=g.getImageData(0,0,canvas.width,canvas.height);
	canvas.width=document.getElementById('ancho').value;
	g.putImageData(aux_g,0,0);}
//Linea
document.getElementById('grosorlinea').onchange=function(){g.lineWidth=document.getElementById('grosorlinea').value;}
document.getElementById('estilolinea').onchange=function(){g.lineCap=document.getElementById('estilolinea').value;}