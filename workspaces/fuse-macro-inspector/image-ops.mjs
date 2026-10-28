// Pure browser-compatible pixel operations; no algorithm claims to prove electrical continuity.
const byte=n=>Math.max(0,Math.min(255,Math.round(n)));
export const copyImage=image=>({width:image.width,height:image.height,data:new Uint8ClampedArray(image.data)});
export function tone(image,{brightness=0,contrast=1,gamma=1}={}){
 const out=copyImage(image);
 for(let i=0;i<out.data.length;i+=4)for(let k=0;k<3;k++){
  const c=(image.data[i+k]/255-0.5)*contrast+0.5+brightness/255;
  out.data[i+k]=byte(255*Math.pow(Math.max(0,Math.min(1,c)),1/gamma));
 }
 return out;
}
export function grayscale(image){
 const out=copyImage(image);for(let i=0;i<out.data.length;i+=4){
  const y=byte(0.2126*out.data[i]+0.7152*out.data[i+1]+0.0722*out.data[i+2]);
  out.data[i]=out.data[i+1]=out.data[i+2]=y;
 }return out;
}
export function invert(image){const out=copyImage(image);for(let i=0;i<out.data.length;i+=4)for(let k=0;k<3;k++)out.data[i+k]=255-out.data[i+k];return out;}
const lum=(d,i)=>0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2];
export function sobel(image){
 const {width:w,height:h,data:d}=image,out=copyImage(image);
 const a=new Float32Array(w*h);for(let i=0;i<a.length;i++)a[i]=lum(d,i*4);
 const p=(x,y)=>a[Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x))];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const gx=-p(x-1,y-1)+p(x+1,y-1)-2*p(x-1,y)+2*p(x+1,y)-p(x-1,y+1)+p(x+1,y+1);
  const gy=-p(x-1,y-1)-2*p(x,y-1)-p(x+1,y-1)+p(x-1,y+1)+2*p(x,y+1)+p(x+1,y+1);
  const v=byte(Math.hypot(gx,gy)),i=4*(y*w+x);
  out.data[i]=out.data[i+1]=out.data[i+2]=v;
 }return out;
}
export function sharpen(image){
 const {width:w,height:h,data:d}=image,out=copyImage(image);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=4*(y*w+x);
  for(let k=0;k<3;k++){
   const p=(xx,yy)=>d[4*(Math.max(0,Math.min(h-1,yy))*w+Math.max(0,Math.min(w-1,xx)))+k];
   out.data[i+k]=byte(5*p(x,y)-p(x-1,y)-p(x+1,y)-p(x,y-1)-p(x,y+1));
  }
 }return out;
}
// Contrast-limited adaptive histogram equalization with a bilinear tile map.
export function clahe(image,tileSize=32,clipFactor=2){
 const {width:w,height:h,data:d}=image,out=copyImage(image);
 const nx=Math.ceil(w/tileSize),ny=Math.ceil(h/tileSize),maps=[];
 for(let ty=0;ty<ny;ty++)for(let tx=0;tx<nx;tx++){
  const x0=tx*tileSize,y0=ty*tileSize,x1=Math.min(w,x0+tileSize),y1=Math.min(h,y0+tileSize),count=(x1-x0)*(y1-y0),hist=new Float64Array(256);
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)hist[byte(lum(d,4*(y*w+x)))]++;
  const limit=Math.max(1,Math.ceil(clipFactor*count/256));let excess=0;
  for(let k=0;k<256;k++)if(hist[k]>limit){excess+=hist[k]-limit;hist[k]=limit;}
  for(let k=0;k<256;k++)hist[k]+=excess/256;
  const map=new Float64Array(256);let c=0;for(let k=0;k<256;k++){c+=hist[k];map[k]=255*c/count;}maps.push(map);
 }
 const lookup=(x,y,v)=>maps[y*nx+x][v];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=4*(y*w+x),l=byte(lum(d,i));
  const fx=x/tileSize-0.5,fy=y/tileSize-0.5;
  const a=Math.max(0,Math.min(nx-1,Math.floor(fx))),b=Math.max(0,Math.min(ny-1,Math.floor(fy)));
  const c=Math.min(nx-1,a+1),e=Math.min(ny-1,b+1),wx=Math.max(0,Math.min(1,fx-a)),wy=Math.max(0,Math.min(1,fy-b));
  const top=lookup(a,b,l)*(1-wx)+lookup(c,b,l)*wx,bot=lookup(a,e,l)*(1-wx)+lookup(c,e,l)*wx;
  const mapped=top*(1-wy)+bot*wy;
  if(l<1){out.data[i]=out.data[i+1]=out.data[i+2]=byte(mapped);}
  else{const r=mapped/l;for(let k=0;k<3;k++)out.data[i+k]=byte(d[i+k]*r);}
 }return out;
}
export function process(image,{mode='original',brightness=0,contrast=1,gamma=1}={}){
 const out=tone(image,{brightness,contrast,gamma});
 return mode==='grayscale'?grayscale(out):mode==='invert'?invert(out):mode==='edges'?sobel(out):mode==='sharpen'?sharpen(out):mode==='clahe'?clahe(out):out;
}
export const distance=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
