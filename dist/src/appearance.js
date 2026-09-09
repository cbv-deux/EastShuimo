import * as T from '../vendor/three.module.js';

export const palette={wood:0xd9be91,stone:0x929b9e,green:0x77946d,glass:0x79b9e4,wall:0xe6e1d6,underground:0xd0d2cf};
export function shapes(item){return(item.parts||[item]).filter(p=>p.polygon?.length>=3).map(p=>{const s=new T.Shape(p.polygon.map(([x,z])=>new T.Vector2(x,-z)));for(const h of p.holes||[])if(h.length>=3)s.holes.push(new T.Path(h.map(([x,z])=>new T.Vector2(x,-z))));return s;});}
export function surface(item,height,mat,y=0){const ss=shapes(item);if(!ss.length)return null;const mesh=new T.Mesh(height?new T.ExtrudeGeometry(ss,{depth:height,bevelEnabled:false}):new T.ShapeGeometry(ss),mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;return mesh;}
export function contains(p,xy){const ring=ps=>{let b=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],c=ps[j];if((a[1]>xy[1])!==(c[1]>xy[1])&&xy[0]<(c[0]-a[0])*(xy[1]-a[1])/(c[1]-a[1])+a[0])b=!b;}return b;};return ring(p.polygon)&&!(p.holes||[]).some(ring);}
export function material(kind,mask=null,options={}){
 const opacity=options.opacity??(kind==='glass'?.48:1),transparent=options.transparent??(kind==='glass'||opacity<1);
 const mat=new T.MeshStandardMaterial({color:palette[kind]??0xe2ded3,roughness:kind==='glass'?.25:.9,side:T.DoubleSide,transparent,opacity,depthWrite:options.depthWrite??!transparent,...options});
 mat.userData.atlasMaterial=kind;mat.userData.districtTint=!!mask?.districtTexture;
 mat.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 atlasWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
   vec4 atlasP=vec4(transformed,1.0);
   #ifdef USE_INSTANCING
    atlasP=instanceMatrix*atlasP;
   #endif
   atlasWorld=(modelMatrix*atlasP).xyz;`);
  shader.fragmentShader='varying vec3 atlasWorld;\n'+(mask?'uniform sampler2D atlasMask;uniform vec4 atlasBounds;\n':'')+(mask?.districtTexture?'uniform sampler2D atlasDistrict;\n':'')+shader.fragmentShader;
  let code='';
  if(mask){shader.uniforms.atlasMask={value:mask.texture};shader.uniforms.atlasBounds={value:new T.Vector4(...mask.bounds)};code+=`vec2 atlasUV=(atlasWorld.xz-atlasBounds.xy)/(atlasBounds.zw-atlasBounds.xy);if(texture2D(atlasMask,vec2(atlasUV.x,1.0-atlasUV.y)).r<0.4)discard;`;}
  if(kind==='brick')code+=`float row=floor(atlasWorld.y/.095);float axis=atlasWorld.x+atlasWorld.z;float col=floor((axis+mod(row,2.0)*.14)/.28);float rnd=fract(sin(col*12.9898+row*78.233)*43758.5453);float west=mix(.80,.20,clamp(atlasWorld.x/245.0,0.0,1.0));vec3 brick=mix(vec3(.29,.36,.39),vec3(.57,.29,.21),step(rnd,west));float mortar=step(.035,fract(atlasWorld.y/.095))*step(.025,fract((axis+mod(row,2.0)*.14)/.28));diffuseColor.rgb=mix(vec3(.58,.55,.49),brick*(.88+.18*rnd),mortar);`;
  if(kind==='wood')code+=`float plank=fract(atlasWorld.x/.20);float grain=sin(atlasWorld.z*19.0+sin(atlasWorld.x*37.0)*1.3)*.018;diffuseColor.rgb*=.97+grain;diffuseColor.rgb*=mix(.86,1.0,smoothstep(.0,.016,plank));`;
  if(kind==='stone')code+=`vec2 joints=fract(atlasWorld.xz/.65);float joint=step(.022,joints.x)*step(.022,joints.y);diffuseColor.rgb*=mix(.77,1.0,joint);`;
  if(mask?.districtTexture&&!['transport','marker','furniture','object'].includes(kind)){shader.uniforms.atlasDistrict={value:mask.districtTexture};code+=`vec4 zone=texture2D(atlasDistrict,vec2(atlasUV.x,1.0-atlasUV.y));diffuseColor.rgb=mix(diffuseColor.rgb,mix(zone.rgb,vec3(1.0),.35),zone.a*.32);`;}
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+code);
 };
 mat.customProgramCacheKey=()=>`atlas-v6-${kind}-${!!mask}-${!!mask?.districtTexture}`;return mat;
}
export function walls(pieces,height,kind,mat){if(!pieces.length)return null;const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,pieces.length),dummy=new T.Object3D();pieces.forEach((p,i)=>{const[x,z,xx,zz]=p.segment,h=Math.min(p.displayHeight??height,height);dummy.position.set((x+xx)/2,h/2,(z+zz)/2);dummy.rotation.set(0,-Math.atan2(zz-z,xx-x),0);dummy.scale.set(Math.hypot(xx-x,zz-z),h,kind==='wall'?.10:.045);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});return mesh;}

// Reused by the browser and GLB export. Each prototype uses simple, source-sized solids.
export function addFurniture(group,items,mask=null,opacity=1){
 const batches=new Map();
 function box(item,color,cx,cy,cz,sx,sy,sz){const key=color;if(!batches.has(key))batches.set(key,[]);batches.get(key).push({item,position:[cx,cy,cz],scale:[sx,sy,sz]});}
 for(const it of items){const[w,h,d]=it.size;
  if(it.kind==='chair'){box(it,0x667b81,0,.44,0,w,.085,d*.78);box(it,0x667b81,0,.65,d*.36,w,.38,.07);for(const x of [-1,1])for(const z of [-1,1])box(it,0x495156,x*w*.35,.21,z*d*.28,.04,.42,.04);}
  else if(it.kind==='sofa'){box(it,0x9cacaa,0,.32,0,w,.5,d);box(it,0x829895,0,.66,d*.4,w,.42,d*.18);for(const x of [-1,1])box(it,0x829895,x*w*.46,.55,0,w*.08,.35,d);}
  else if(it.kind==='piano'){box(it,0x242c34,0,.68,0,w,.75,d*.75);box(it,0xf2eee3,0,.78,-d*.37,w*.86,.06,d*.22);for(let i=0;i<14;i++)box(it,0x22282e,-w*.39+i*w*.06,.825,-d*.36,w*.025,.035,d*.13);box(it,0x23292e,0,.26,0,w*.8,.5,d*.5);}
  else if(it.kind==='shelf'){for(let i=0;i<5;i++)box(it,0xc7ad81,0,.12+i*.34,0,w,.045,d);for(const x of [-1,1])box(it,0xb59e7b,x*w*.48,.82,0,.045,1.65,d);}
  else if(it.kind==='counter'){box(it,0xb5a180,0,.48,0,w,.96,d);box(it,0xe7ded0,0,1.0,0,w+.05,.08,d+.05);}
  else{box(it,0xd8bd91,0,.72,0,w,.06,d);for(const x of [-1,1])for(const z of [-1,1])box(it,0x70777a,x*w*.42,.34,z*d*.38,.055,.68,.055);if(it.kind==='workstation'){box(it,0x8daeb3,0,.92,0,w,.38,.04);if(w>3)box(it,0x8daeb3,0,.92,0,.04,.38,d);}}
 }
 const dummy=new T.Object3D(),parent=new T.Object3D();
 for(const[color,boxes]of batches){const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),material('furniture',mask,{color,opacity,transparent:opacity<1,depthWrite:opacity>=1}),boxes.length);for(let i=0;i<boxes.length;i++){const b=boxes[i],it=b.item;parent.position.set(it.position[0],it.localElevation||0,it.position[1]);parent.rotation.y=-it.rotation;parent.updateMatrix();dummy.position.set(...b.position);dummy.scale.set(...b.scale);dummy.rotation.set(0,0,0);dummy.updateMatrix();mesh.setMatrixAt(i,parent.matrix.clone().multiply(dummy.matrix));}mesh.name='原图家具简化模型';group.add(mesh);}
}
