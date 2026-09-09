import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';

const root=fileURLToPath(new URL('../',import.meta.url));
const url='http://localhost:4173/';
async function ready(){
  try{
    const response=await fetch(url,{signal:AbortSignal.timeout(1000)});
    return response.ok&&(await response.text()).includes('东水磨');
  }catch{return false;}
}
try{
  await fs.access(new URL('../dist/data/map.json',import.meta.url));
  if(!await ready()){
    const env={...process.env,PORT:'4173'};
    delete env.BASE_PATH;
    const child=spawn(process.execPath,['scripts/serve.mjs','--dist'],{
      cwd:root,env,detached:true,windowsHide:true,stdio:'ignore',
    });
    await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
    child.unref();
    let started=false;
    for(let i=0;i<30;i++){
      if(await ready()){started=true;break;}
      await new Promise(resolve=>setTimeout(resolve,200));
    }
    if(!started)throw Error('预览服务启动失败，请检查 4173 端口是否被其它程序占用。');
  }
  console.log('地图已就绪：'+url+'#/overview');
  if(!process.argv.includes('--no-open')){
    const command=process.platform==='win32'?'powershell.exe':process.platform==='darwin'?'open':'xdg-open';
    const args=process.platform==='win32'?['-NoProfile','-NonInteractive','-Command',"Start-Process 'http://localhost:4173/#/overview'"]:[url+'#/overview'];
    const browser=spawn(command,args,{detached:true,windowsHide:true,stdio:'ignore'});
    browser.on('error',()=>console.log('请在浏览器中打开上面的地址。'));
    browser.unref();
  }
}catch(error){
  console.error(error.code==='ENOENT'?'未找到静态成品，请先运行 npm run build。':error.message);
  process.exitCode=1;
}
