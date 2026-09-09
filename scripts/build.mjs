import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);await import('./validate.mjs');await import('./compress-data.mjs');
await fs.mkdir('dist',{recursive:true});for(const name of ['index.html','src','vendor','data'])await fs.cp(name,path.join('dist',name),{recursive:true});await fs.writeFile('dist/.nojekyll','');console.log('Built static map: dist/');
