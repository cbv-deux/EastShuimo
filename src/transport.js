import * as T from '../vendor/three.module.js';
import {material} from './appearance.js';

// Both flights use the same material. Direction belongs to landing controls only.
export function addStairConnection(parent,c,stop,low,high,expanded){
 const p=stop.parts.flatMap(p=>p.polygon),xs=p.map(p=>p[0]),zs=p.map(p=>p[1]),dx=Math.max(...xs)-Math.min(...xs),dz=Math.max(...zs)-Math.min(...zs),alongX=dx>dz;
 const length=Math.max(.8,Math.max(dx,dz)-.5),span=Math.min(dx,dz),double=span>2.2,wide=Math.max(.45,(span-.28)/(double?2:1)),flights=double?2:1,h=high-low;
 const mat=material('glass',null,{color:0xa6bdc5,opacity:expanded?.38:.88}),start=new T.Vector3(c.fromPosition[0],low,c.fromPosition[1]),end=new T.Vector3(c.toPosition[0],high,c.toPosition[1]);
 const point=(flight,t)=>{const v=start.clone().lerp(end,(flight+t)/flights),run=((flight===1?1-t:t)-.5)*length,side=double?(flight-.5)*wide:0;v.x+=alongX?run:side;v.z+=alongX?side:run;return v;};
 const beam=(a,b,r)=>{const mesh=new T.Mesh(new T.CylinderGeometry(r,r,a.distanceTo(b),6),mat);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());parent.add(mesh);};
 const group=new T.Group();group.name='连续楼梯';parent.add(group);
 for(let flight=0;flight<flights;flight++){
  const count=expanded?12:Math.max(5,Math.ceil(h/flights/.18));
  for(let i=0;i<count;i++){const mesh=new T.Mesh(new T.BoxGeometry(alongX?length/count:wide,.10,alongX?wide:length/count),mat);mesh.position.copy(point(flight,(i+.5)/count));group.add(mesh);}
  const a=point(flight,0),b=point(flight,1),corners=[];
  for(const [v,s] of [[a,-1],[a,1],[b,1],[b,-1]])corners.push(new T.Vector3(v.x+(alongX?0:s*wide/2),v.y-.09,v.z+(alongX?s*wide/2:0)));
  const geo=new T.BufferGeometry(),verts=[];for(const i of [0,1,2,0,2,3])verts.push(...corners[i].toArray());geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();group.add(new T.Mesh(geo,mat));
  for(const side of [-1,1]){const aa=a.clone(),bb=b.clone();aa.y+=.8;bb.y+=.8;aa.x+=alongX?0:side*wide/2;bb.x+=alongX?0:side*wide/2;aa.z+=alongX?side*wide/2:0;bb.z+=alongX?side*wide/2:0;beam(aa,bb,.035);}
 }
 if(double){const landing=new T.Mesh(new T.BoxGeometry(alongX?.65:wide*2,.16,alongX?wide*2:.65),mat);landing.position.copy(start).lerp(end,.5);if(alongX)landing.position.x+=length/2;else landing.position.z+=length/2;group.add(landing);}
 return group;
}
