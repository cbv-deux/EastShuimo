import * as T from '../vendor/three.module.js';
export const stateKey='eastshuimo-map-view-v6';
export const defaults=()=>({expanded:true,overviewFocus:'G',roofVisible:true,groundVisible:true,hiddenFloors:[],hiddenBuildings:[],hiddenDistricts:[],hiddenBlocks:[],interiors:{overview:false,building:true,floor:true},labels:true,legend:true});
export function loadState(storage){try{const s=JSON.parse(storage.getItem(stateKey)||'null');return {...defaults(),...s,interiors:{...defaults().interiors,...s?.interiors}};}catch{return defaults();}}
export function saveState(storage,s){try{storage.setItem(stateKey,JSON.stringify(s));return true;}catch{return false;}}
export function isBuildingVisible(p,s,route){return !(p.buildingIds?.length)||p.buildingIds.some(id=>!s.hiddenBuildings.includes(id)&&(route.type!=='building'||id===Number(route.id)));}
export function floorOffsets(data,s){let lift=0;const out={};for(const f of data.floors){out[f.id]=f.elevation+(s.expanded?lift:0);lift+=3*(f.storyHeight||3.6);}return out;}
export function hiddenDistricts(data,s){const out=new Set(s.hiddenDistricts);let changed=true;while(changed){changed=false;for(const d of data.districts)if(d.parentId&&out.has(d.parentId)&&!out.has(d.id)){out.add(d.id);changed=true;}}return out;}
export function createMask(f,data,s,route){
 const canvas=document.createElement('canvas'),b=f.bounds;canvas.width=3072;canvas.height=Math.max(1,Math.round(canvas.width*(b[3]-b[1])/(b[2]-b[0])));const ctx=canvas.getContext('2d',{willReadFrequently:true}),scale=canvas.width/(b[2]-b[0]);ctx.fillStyle='black';ctx.fillRect(0,0,canvas.width,canvas.height);
 function path(p){ctx.beginPath();for(const ring of [p.polygon,...p.holes||[]]){ring.forEach(([x,z],i)=>ctx[i?'lineTo':'moveTo']((x-b[0])*scale,(z-b[1])*scale));ctx.closePath();}}
 function paint(p,color,stroke=0){path(p);ctx.fillStyle=color;ctx.fill('evenodd');if(stroke){ctx.strokeStyle=color;ctx.lineWidth=stroke*scale;ctx.lineJoin='miter';ctx.stroke();}}
 for(const p of [...f.floorParts,...(f.exteriorShells||[]).flatMap(x=>x.footprintParts||x.parts)])if(isBuildingVisible(p,s,route))paint(p,'white',.65);
 // A transport entrance lies over a shaft opening; it still needs a visible marker.
 for(const stop of f.transportStops||[])if(isBuildingVisible(stop,s,route))for(const p of stop.parts)paint(p,'white',.08);
 const excludedDistricts=hiddenDistricts(data,s);for(const dt of data.districts)if(dt.floor===f.id&&excludedDistricts.has(dt.id))for(const p of dt.surfaceParts||dt.parts)paint(p,'black',.16);
 for(const block of f.overview)if(s.hiddenBlocks.includes(block.id))for(const p of block.parts)paint(p,'black',.24);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 const test=xy=>{const x=Math.floor((xy[0]-b[0])*scale),z=Math.floor((xy[1]-b[1])*scale);return x>=0&&z>=0&&x<canvas.width&&z<canvas.height&&pixels[(z*canvas.width+x)*4]>127;};
 let x0=canvas.width,z0=canvas.height,x1=0,z1=0;for(let z=0;z<canvas.height;z+=3)for(let x=0;x<canvas.width;x+=3)if(pixels[(z*canvas.width+x)*4]>127){x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);}
 const texture=new T.CanvasTexture(canvas);texture.minFilter=T.NearestFilter;texture.magFilter=T.NearestFilter;texture.generateMipmaps=false;texture.colorSpace=T.NoColorSpace;
 return {texture,bounds:b,test,visibleBounds:x1>=x0&&z1>=z0?[x0/scale+b[0],z0/scale+b[1],x1/scale+b[0],z1/scale+b[1]]:null};
}

export function districtTint(f,data,state,level){
 const b=f.bounds,canvas=document.createElement('canvas');canvas.width=3072;canvas.height=Math.round(canvas.width*(b[3]-b[1])/(b[2]-b[0]));const ctx=canvas.getContext('2d'),scale=canvas.width/(b[2]-b[0]),hidden=hiddenDistricts(data,state);
 for(const dt of data.districts.filter(d=>d.floor===f.id&&d.level<=level&&!hidden.has(d.id)).sort((a,b)=>a.level-b.level))for(const p of dt.surfaceParts||dt.parts){ctx.beginPath();for(const ring of[p.polygon,...p.holes||[]]){ring.forEach(([x,z],i)=>ctx[i?'lineTo':'moveTo']((x-b[0])*scale,(z-b[1])*scale));ctx.closePath();}ctx.fillStyle=dt.color;ctx.fill('evenodd');ctx.strokeStyle=dt.color;ctx.lineWidth=.13*scale;ctx.stroke();}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;return texture;
}
