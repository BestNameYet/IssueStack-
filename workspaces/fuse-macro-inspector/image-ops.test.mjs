import test from 'node:test';
import assert from 'node:assert/strict';
import {copyImage,tone,grayscale,sobel,sharpen,clahe,invert,process,distance} from './image-ops.mjs';
const make=(w,h,fn)=>{const d=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=fn(x,y),i=4*(y*w+x);d.set([v,v,v,255],i)}return{width:w,height:h,data:d}};
test('does not mutate original pixels or alpha',()=>{
 const im=make(4,4,(x,y)=>30+20*x+5*y),orig=Array.from(im.data);
 for(const mode of ['original','grayscale','edges','sharpen','clahe','invert']){
  const out=process(im,{mode,brightness:5,contrast:1.5,gamma:1.3});
  assert.equal(out.data.length,im.data.length);assert.notEqual(out.data,im.data);assert.equal(out.data[3],255);
 }
 assert.deepEqual(Array.from(im.data),orig);assert.deepEqual(Array.from(copyImage(im).data),orig);
});
test('brightness and gamma behave monotonically',()=>{
 const im=make(1,1,()=>128);
 assert.ok(tone(im,{brightness:50}).data[0]>128);
 assert.ok(tone(im,{brightness:-50}).data[0]<128);
 assert.ok(tone(im,{gamma:2}).data[0]>128);
});
test('Sobel reveals a high-contrast boundary in synthetic bridge fixture',()=>{
 const im=make(32,32,(x,y)=>x>14?230:20),out=sobel(im);
 assert.ok(out.data[4*(16*32+14)]>180);assert.equal(out.data[4*(16*32+5)],0);
});
test('CLAHE changes a low-contrast dark-gap synthetic image without source mutation',()=>{
 const im=make(64,64,(x,y)=>x>30&&x<36?24:42+(y%4)),out=clahe(im,16,2);
 assert.equal(out.width,64);assert.equal(out.height,64);
 assert.notDeepEqual(Array.from(out.data),Array.from(im.data));assert.equal(im.data[0],42);
});
test('pixel separation calculation is exact in source coordinates',()=>{
 assert.equal(distance({x:0,y:0},{x:3,y:4}),5);
});
test('inversion is byte-exactly reversible',()=>{
 const im=make(12,12,(x,y)=>(x*11+y*7)%256);
 assert.deepEqual(Array.from(invert(invert(im)).data),Array.from(im.data));
});
test('edge cases do not crash with one-pixel or extreme values',()=>{
 for(const v of [0,255]){const im=make(1,1,()=>v);
  for(const fn of [grayscale,sobel,sharpen,clahe,invert]){
   let o=fn(im);assert.equal(o.data.length,4);assert.equal(o.data[3],255);
  }
 }
});
