import {mkdir,copyFile,readdir,stat,rm,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const destination=resolve(root,'public');
if(destination!==join(resolve(root),'public'))throw Error('Unexpected output directory');
await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
const files=JSON.parse(await readFile(join(root,'scripts/public-files.json'),'utf8'));
async function copyTree(relative){for(const item of await readdir(join(root,relative),{withFileTypes:true})){if(item.isSymbolicLink())throw Error('Symlink in public assets');const name=join(relative,item.name);if(item.isDirectory())await copyTree(name);else{await mkdir(join(destination,relative),{recursive:true});await copyFile(join(root,name),join(destination,name));}}}
for(const name of files)await copyFile(join(root,name),join(destination,name));
await copyTree('assets');await copyTree('fonts');
console.log(`Production output: ${files.length} pages/scripts plus local assets and fonts. API remains server-side.`);
