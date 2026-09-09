import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await fs.readFile(path.join(root,'data/map.json'),'utf8'));
const floorIds=data.floors.map(f=>f.id),rootData={...data,floors:undefined,floorIds};
delete rootData.floors;
await fs.mkdir(path.join(root,'data/map-floors'),{recursive:true});
await fs.mkdir(path.join(root,'data/map-floors-v9'),{recursive:true});
const rootBytes=gzipSync(JSON.stringify(rootData),{level:9});
await Promise.all([
 fs.writeFile(path.join(root,'data/map.json.gz'),gzipSync(JSON.stringify(data),{level:9})),
 fs.writeFile(path.join(root,'data/map-root.json.gz'),rootBytes),
 fs.writeFile(path.join(root,'data/map-v9-root.json.gz'),rootBytes),
 ...data.floors.map(f=>fs.writeFile(path.join(root,`data/map-floors/${f.id}.json.gz`),gzipSync(JSON.stringify(f),{level:9}))),
 ...data.floors.map(f=>fs.writeFile(path.join(root,`data/map-floors-v9/${f.id}.json.gz`),gzipSync(JSON.stringify(f),{level:9}))),
]);
console.log(`Compressed ${data.revision}: ${floorIds.join(', ')}`);
