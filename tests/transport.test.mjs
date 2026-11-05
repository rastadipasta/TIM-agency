import assert from 'node:assert/strict';
import {createSender,SubmissionError} from '../transport.mjs';
const response=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});
const payload={name:'Test only',email:'test@example.test',service:'brief',briefServices:'Web design',projectBrief:'Unit test — no network'};
let calls=0;
const good=createSender({fetchImpl:async(url,options)=>{calls++;assert.equal(url,'/api/contact');assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),payload);return response(200,{ok:true});}});
assert.equal((await good.send(payload)).ok,true);assert.equal(good.sending,false);assert.equal(calls,1);
for(const status of [200,400,429,500]){
 const bad=createSender({fetchImpl:async()=>response(status,{ok:false,errors:{email:'Invalid'}})});
 await assert.rejects(bad.send(payload),e=>e instanceof SubmissionError&&e.status===status&&e.fields.email==='Invalid');assert.equal(bad.sending,false);
}
const network=createSender({fetchImpl:async()=>{throw new TypeError('Offline');}});
await assert.rejects(network.send(payload),e=>e.uncertain===true);assert.equal(network.sending,false);
const timeout=createSender({timeoutMs:5,fetchImpl:(_u,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'}))))});
await assert.rejects(timeout.send(payload),e=>e.uncertain===true&&/confirm receipt/.test(e.message));assert.equal(timeout.sending,false);
let release;const duplicate=createSender({fetchImpl:()=>new Promise(resolve=>release=resolve)});
const pending=duplicate.send(payload);await assert.rejects(duplicate.send(payload),/already being sent/);release(response(200,{ok:true}));await pending;assert.equal(duplicate.sending,false);
console.log('PASS: success, strict acknowledgement, 400 field errors, 429, 500, network failure, timeout, duplicate protection. No network requests sent.');
