import {process,distance} from './image-ops.mjs';
const $=id=>document.getElementById(id),message=$('message');
const panels={a:{image:null,points:[],roi:null},b:{image:null,points:[],roi:null}};
const value=id=>Number($(id).value);
function printControls(){
 for(const id of ['cx','cy','brightness','contrast','gamma','zoom-a','zoom-b']){
  const el=$(id),out=$(id+'-value');
  out.textContent=id==='cx'||id==='cy'?el.value+'%':id==='zoom-a'||id==='zoom-b'?el.value+'×':id==='gamma'||id==='contrast'?Number(el.value).toFixed(1):el.value;
 }
}
const config=()=>({brightness:value('brightness'),contrast:value('contrast'),gamma:value('gamma')});
async function load(panel,file){
 if(!file)return;
 if(!file.type.startsWith('image/')){message.textContent='Choose an image file.';return;}
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  if(!image.naturalWidth||!image.naturalHeight)throw new Error('Image is empty');
  panels[panel]={image,points:[],roi:null,name:file.name};
  message.textContent='Opened '+file.name+' locally ('+image.naturalWidth+'×'+image.naturalHeight+')';
  draw(panel);
 }catch(e){message.textContent='Image could not be decoded: '+e.message;}
 finally{URL.revokeObjectURL(url);}
}
function sourceRoi(image,zoom){
 const side=Math.min(image.naturalWidth,image.naturalHeight)/zoom;
 const cx=value('cx')/100*image.naturalWidth,cy=value('cy')/100*image.naturalHeight;
 const x=Math.max(0,Math.min(image.naturalWidth-side,cx-side/2));
 const y=Math.max(0,Math.min(image.naturalHeight-side,cy-side/2));
 return {x,y,side};
}
function draw(id){
 const panel=panels[id],canvas=$('canvas-'+id),ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.fillStyle='#080c13';ctx.fillRect(0,0,canvas.width,canvas.height);
 if(!panel.image){
  ctx.fillStyle='#d3dfef';ctx.font='18px system-ui';
  ctx.fillText('Choose an image',28,256);return;
 }
 const src=panel.image,roi=sourceRoi(src,value('zoom-'+id)),size=Math.max(1,Math.round(roi.side));
 const base=document.createElement('canvas');base.width=size;base.height=size;
 const bctx=base.getContext('2d',{willReadFrequently:true});
 bctx.drawImage(src,roi.x,roi.y,roi.side,roi.side,0,0,size,size);
 const pixels=bctx.getImageData(0,0,size,size);
 const result=process(pixels,{...config(),mode:$('mode-'+id).value});
 bctx.putImageData(new ImageData(result.data,size,size),0,0);
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(base,0,0,canvas.width,canvas.height);
 panel.roi={...roi,size};
 ctx.lineWidth=3;ctx.strokeStyle='#ff5252';ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';
 panel.points.forEach((p,i)=>{
  ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.stroke();
  ctx.fillText(String(i+1),p.x+10,p.y-10);
 });
 if(panel.points.length===2){
  const [a,b]=panel.points;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 }
 const details=panel.points.length===2?
  ' • marker separation ≈ '+(distance(panel.points[0],panel.points[1])*roi.side/canvas.width).toFixed(1)+' source px':
  ' • '+panel.points.length+'/2 markers';
 $('status-'+id).textContent=src.naturalWidth+'×'+src.naturalHeight+'; crop '+size+'×'+size+
  ' pixels; '+$('mode-'+id).selectedOptions[0].text+details+'. Click twice for markers.';
}
function drawAll(){printControls();draw('a');draw('b');}
for(const id of ['a','b']){
 $('file-'+id).addEventListener('change',event=>load(id,event.target.files[0]));
 $('mode-'+id).addEventListener('change',()=>draw(id));
 $('zoom-'+id).addEventListener('input',()=>{
  printControls();panels[id].points=[];draw(id);
 });
 $('clear-'+id).addEventListener('click',()=>{panels[id].points=[];draw(id);});
 $('canvas-'+id).addEventListener('click',event=>{
  const p=panels[id];if(!p.image)return;
  const box=event.currentTarget.getBoundingClientRect();
  const x=(event.clientX-box.left)*512/box.width,y=(event.clientY-box.top)*512/box.height;
  if(p.points.length===2)p.points=[];
  p.points.push({x,y});draw(id);
 });
}
for(const id of ['cx','cy','brightness','contrast','gamma'])
 $(id).addEventListener('input',()=>{
  if(id==='cx'||id==='cy'){panels.a.points=[];panels.b.points=[];}
  drawAll();
 });
$('reset').addEventListener('click',()=>{
 for(const [id,v] of Object.entries({cx:50,cy:50,brightness:0,contrast:1,gamma:1,'zoom-a':4,'zoom-b':4}))$(id).value=v;
 for(const id of ['a','b']){$('mode-'+id).value='original';panels[id].points=[];}
 drawAll();
});
$('export').addEventListener('click',()=>{
 if(!panels.a.image||!panels.b.image){message.textContent='Choose both images before exporting.';return;}
 const out=document.createElement('canvas');out.width=1024;out.height=550;
 const ctx=out.getContext('2d');ctx.fillStyle='#101a2b';ctx.fillRect(0,0,1024,550);
 ctx.drawImage($('canvas-a'),0,38,512,512);ctx.drawImage($('canvas-b'),512,38,512,512);
 ctx.fillStyle='white';ctx.font='bold 20px system-ui';
 ctx.fillText('SUSPECT',15,27);ctx.fillText('REFERENCE',529,27);
 out.toBlob(blob=>{
  if(!blob)return;
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='fuse-bridge-comparison.png';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  message.textContent='Exported comparison locally.';
 },'image/png');
});
printControls();drawAll();
