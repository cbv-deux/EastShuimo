import * as T from '../vendor/three.module.js';
import {surface,material} from './appearance.js';
export function roofElevation(data,state,yOf,route){const f=data.floors.find(x=>x.id==='F2'),base=yOf('F2')+(f.storyHeight||3.6);return base+(state.expanded&&route.type!=='floor'?3*(f.storyHeight||3.6):0);}
export function atriumMesh(a,low,high,accept=()=>true){
 const group=new T.Group();group.name='贯通天井';const verts=[];
 for(const p of a.parts)for(const ring of[p.polygon,...p.holes||[]])for(let i=0;i<ring.length;i++){const[x,z]=ring[i],[xx,zz]=ring[(i+1)%ring.length];if(!accept([(x+xx)/2,(z+zz)/2])&&!accept([x,z]))continue;verts.push(x,low,z,xx,low,zz,xx,high,zz,x,low,z,xx,high,zz,x,high,z);}
 if(verts.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.computeVertexNormals();group.add(new T.Mesh(g,material('glass',null,{color:0x8ec7e6,opacity:.15})));}
 for(const[x,z]of a.columns||[]){if(!accept([x,z]))continue;const m=new T.Mesh(new T.CylinderGeometry(.12,.12,high-low,10),material('column',null,{color:0x11171c,transparent:true,opacity:.24,depthWrite:false}));m.position.set(x,(high+low)/2,z);group.add(m);}
 return group;
}
export function addArchitecture(parent,data,route,state,masks,yOf,owned){
 const roofOnly=route.type==='floor'&&route.id==='ROOF',roofOn=(roofOnly||route.type!=='floor'&&route.level==='ROOF')&&state.roofVisible!==false;
 if(roofOn&&masks.has('F2'))for(const roof of data.roofs||[]){const ps=roof.parts.filter(owned);if(!ps.length)continue;const m=surface({parts:ps},roof.thickness||.18,material('stone',masks.get('F2'),{color:0xb5b9b8}),roofElevation(data,state,yOf,route));m.name='屋顶 · '+roof.buildingIds.join('/');parent.add(m);}
 if(!roofOnly&&state.groundVisible!==false&&masks.has('F1')&&data.siteGround){let ps=data.siteGround.parts;if(route.type==='building'){const b=masks.get('F1').visibleBounds;if(b){const[x,z,xx,zz]=[b[0]-1,b[1]-1,b[2]+1,b[3]+1],holes=ps.flatMap(p=>p.holes||[]).filter(r=>r.every(q=>q[0]>=x&&q[0]<=xx&&q[1]>=z&&q[1]<=zz));ps=[{polygon:[[x,z],[xx,z],[xx,zz],[x,zz]],holes}];}}const m=surface({parts:ps},0,material('ground',null,{color:0x9eaaa8,transparent:true,opacity:data.siteGround.opacity||.12,depthWrite:false}),yOf('F1')+data.siteGround.offset);m.name='透明场地地面';parent.add(m);}
 if(route.type==='floor')return;
 for(const a of data.atriums||[]){if(!owned(a)||!masks.has(a.baseFloor))continue;const top=[...a.openingFloors].reverse().find(f=>masks.has(f));if(!top)continue;const lo=data.floors.findIndex(f=>f.id===a.baseFloor),hi=data.floors.findIndex(f=>f.id===top);if(data.floors.slice(lo,hi+1).some(f=>!masks.has(f.id)))continue;const accept=p=>masks.get(a.baseFloor)?.test(p)||masks.get(top)?.test(p),high=roofOn&&top==='F2'?roofElevation(data,state,yOf,route):yOf(top)+(data.floors[hi].storyHeight||3.6);parent.add(atriumMesh(a,yOf(a.baseFloor),high,accept));}
}
