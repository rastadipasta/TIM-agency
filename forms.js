import {serviceKeys,parseServices,normalizeSelection,contactPayload} from './forms-core.mjs';
import { createSender } from './transport.mjs';

const menu = document.querySelector('#menu-dialog');
const toggle = document.querySelector('#menu-toggle');
toggle.addEventListener('click', () => { menu.showModal(); toggle.setAttribute('aria-expanded','true'); document.body.classList.add('dialog-open'); });
menu.querySelector('[data-close-menu]').addEventListener('click', () => menu.close());
menu.addEventListener('close', () => { toggle.setAttribute('aria-expanded','false'); document.body.classList.remove('dialog-open'); });
menu.addEventListener('click', e => { const r=menu.getBoundingClientRect(); if(e.target===menu&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))menu.close(); });

const form = document.querySelector('form');
const isBrief = form.id === 'project-brief';
const production = location.protocol === 'https:' && ['timdsgn.com','www.timdsgn.com'].includes(location.hostname);
const submit = form.querySelector('[type="submit"]');
const download = form.querySelector(isBrief ? '.brief-download' : '.download-copy');
const status = form.querySelector(isBrief ? '.brief-status' : '.form-status');
const delivery = form.querySelector('.delivery-options');
const fallback = form.querySelector(isBrief ? '.brief-fallback' : '.form-fallback');
const sender = createSender();
const steps = [...form.querySelectorAll('.brief-section')];
const stepButtons = [...document.querySelectorAll('[data-step]')];
const services = [...form.querySelectorAll('[name="services"]')];
let current = 0, furthest = 0;
submit.disabled = download.disabled = false;
submit.textContent = production ? (isBrief ? 'Send brief ↗' : 'Send Enquiry ↗') : 'Prepare email ↗';
form.noValidate = true;

function labelOf(field) { return field.dataset.label || [...(field.labels||[])].map(l=>l.textContent).join(' ').replace(/\s+/g,' ').replace(/\*|\(optional\)/g,'').trim() || field.name; }
function selected() { return services.filter(input => input.checked); }
function clearError(field) {
  field.removeAttribute('aria-invalid');
  const error=document.getElementById(`${field.id}-error`);
  if(error)error.textContent='';
}
function showError(field, message) {
  field.setAttribute('aria-invalid','true');
  if (!field.id) return;
  let error = document.getElementById(`${field.id}-error`);
  if (!error) { error=document.createElement('p');error.id=`${field.id}-error`;error.className='field-error';field.after(error); }
  error.textContent=message;
  field.setAttribute('aria-describedby',error.id);
}
function validateFields(scope) {
  const fields = [...scope.querySelectorAll('input,select,textarea')].filter(f => f.willValidate && !f.matches(':disabled'));
  let first=null;
  fields.forEach(field => {
    clearError(field);
    if ((field.required && !field.value.trim()) || !field.validity.valid) {
      const message=field.validity.typeMismatch ? (field.type==='url'?'Please enter a full URL, starting with https://.':'Please enter a valid email address.') : `Please complete ${labelOf(field).toLowerCase()}.`;
      showError(field,message);first ||= field;
    }
  });
  return first;
}
function validateServices() {
  const error = document.querySelector('#services-error');
  if (!selected().length) { error.textContent='Choose at least one service or “I need guidance”.';services.forEach(s=>s.setAttribute('aria-invalid','true')); return false; }
  error.textContent='';services.forEach(s=>s.removeAttribute('aria-invalid'));return true;
}
function focusInvalid(field) {
  if (isBrief) { const i=steps.indexOf(field.closest('.brief-section')); if(i>=0) showStep(i,false); }
  field.closest('details')?.setAttribute('open','');field.focus();
}
function validateAll() {
  if(isBrief&&!validateServices()){showStep(0,false);services[0].focus();return false;}
  const invalid=validateFields(form);
  if(invalid){focusInvalid(invalid);status.textContent=`Please check ${labelOf(invalid).toLowerCase()}.`;return false;}
  return true;
}
function showStep(index, focus=true) {
  current=index;
  steps.forEach((step,i)=>{step.hidden=i!==index;});
  stepButtons.forEach((b,i)=>{b.disabled=i>furthest;b.classList.toggle('is-complete',i<furthest);if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  document.querySelector('#previous-step').disabled=index===0;
  document.querySelector('#next-step').hidden=index===4;
  document.querySelector('#step-count').textContent=`${String(index+1).padStart(2,'0')} / 05`;
  delivery.hidden=true;
  document.querySelector('.wizard-status').textContent=`Step ${index+1} of 5: ${stepButtons[index].querySelectorAll('span')[1].textContent}`;
  if(focus){const heading=steps[index].querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});steps[index].scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  refreshReview();
}
function nextStep() {
  if(current===0&&!validateServices()){services[0].focus();return;}
  const invalid=validateFields(steps[current]);if(invalid){focusInvalid(invalid);return;}
  furthest=Math.max(furthest,Math.min(4,current+1));showStep(Math.min(4,current+1));
}
function summary() {
  const lines=[`TIMDSGN / ${isBrief?'Project brief':'Project enquiry'}`];
  if(isBrief) {
    for(const section of steps){
      const values=new Map();
      if(section===steps[0]&&selected().length)values.set('Services',selected().map(s=>s.dataset.title));
      for(const input of section.querySelectorAll('[data-label]')){
        if(input.matches(':disabled')||(input.type==='checkbox'&&!input.checked)||!input.value.trim())continue;
        const label=input.dataset.label;values.set(label,[...(values.get(label)||[]),input.value.trim()]);
      }
      if(values.size){lines.push('',section.querySelector('h2').textContent.trim());values.forEach((values,label)=>lines.push(`${label}: ${values.join(', ')}`));}
    }
  } else {
    for(const field of form.querySelectorAll('input,select,textarea')){
      if(!field.name||field.name==='fax'||field.matches(':disabled')||!field.value.trim())continue;
      const value=field.tagName==='SELECT'?field.selectedOptions[0].textContent:field.value.trim();
      lines.push(`${labelOf(field)}: ${value}`);
    }
  }
  return lines.join('\n');
}
function refreshReview(){if(isBrief)document.querySelector('#brief-preview').textContent=summary();}
function refreshServices(){
  if(isBrief){
    const keys=selected().map(s=>s.value);
    form.querySelectorAll('[data-category]').forEach(group=>{group.hidden=!keys.includes(group.dataset.category);group.disabled=group.hidden;});
    const hint=document.querySelector('#brief-detail-hint');hint.hidden=keys.some(k=>serviceKeys.has(k));
    hint.textContent=keys.includes('guidance')?'Describe your idea and visual direction. We will recommend the right services together.':'Select services in the first step to see questions for your project.';
    document.querySelector('#brief-selected').replaceChildren(...(selected().length?selected().map(s=>s.dataset.title):['Nothing selected yet.']).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  } else {
    form.querySelectorAll('[data-service]').forEach(group=>{group.hidden=group.dataset.service!==form.elements.service.value;group.disabled=group.hidden;});
  }
  if(!isBrief){const chosen=form.elements.service.value;const link=document.querySelector('.brief-link');if(link)link.href='/brief.html'+(serviceKeys.has(chosen)?'?services='+encodeURIComponent(chosen):chosen==='general'?'?services=guidance':'');}
  refreshReview();
}
function payload() {
  const data=Object.fromEntries(new FormData(form));
  if(!isBrief)return contactPayload(data,[...form.querySelectorAll('[data-service]:not([hidden]) [data-label]')].map(f=>({label:f.dataset.label,value:f.value})));
  const body=Object.fromEntries(['name','email','company','phone','website','message','deadline','budget','fax'].map(key=>[key,(data[key]||'').trim()]));
  return {...body,service:'brief',briefServices:selected().map(s=>s.dataset.title).join(', '),projectBrief:summary()};
}
function prepareEmail() {
  const name=form.elements.name.value.trim();
  const info=isBrief?selected().map(s=>s.dataset.title).join(', '):form.elements.service.selectedOptions[0].textContent;
  const body=`Hello TIMDSGN,\n\nI would like to discuss a project.\n\nName: ${name}\nEmail: ${form.elements.email.value.trim()}\nServices: ${info}\n\n${form.elements.message.value.trim().slice(0,650)}\n\nI will attach the downloaded ${isBrief?'project brief':'enquiry'} TXT with the full details.\n`;
  document.querySelector('#prepared-email').href=`mailto:studio@timdsgn.com?subject=${encodeURIComponent(`Project ${isBrief?'brief':'enquiry'} — ${name}`)}&body=${encodeURIComponent(body)}`;
  delivery.querySelector('.delivery-instructions').textContent=`Download your full ${isBrief?'brief':'enquiry'} using “Download a copy (.txt)”, then attach that file to your email. Your answers remain on this page.`;
  delivery.hidden=false;status.textContent='Your email is ready to open. Nothing has been sent automatically.';
  status.focus();
}
download.addEventListener('click',()=>{
  if(!validateAll())return;
  const url=URL.createObjectURL(new Blob(['\uFEFF'+summary()],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=isBrief?'TIMDSGN-brief.txt':'TIMDSGN-enquiry.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  status.textContent='Your TXT copy is ready. Attach it when you email studio@timdsgn.com.';
});
form.addEventListener('input',e=>{if(isBrief&&e.target.name==='services'){const values=normalizeSelection(selected().map(s=>s.value),e.target.value);services.forEach(s=>s.checked=values.includes(s.value));}clearError(e.target);if(e.target.name==='services')document.querySelector('#services-error').textContent='';delivery.hidden=true;refreshServices();});
form.addEventListener('change',refreshServices);
form.addEventListener('submit',async e=>{
  e.preventDefault();if(sender.sending)return;
  if(isBrief&&current<4){nextStep();return;}
  status.textContent='';fallback.hidden=true;
  if(!validateAll())return;
  const data=payload();
  if(!isBrief&&data.serviceDetails.length>4000){status.textContent='Your service details are too long. Please shorten your answers.';status.focus();return;}
  if(isBrief&&data.projectBrief.length>16000){status.textContent='Your brief is too long. Shorten the descriptions or share longer materials using a link.';status.focus();return;}
  if(!production){prepareEmail();return;}
  const controls=[...form.elements,...stepButtons].filter(c=>'disabled' in c).map(c=>[c,c.disabled]);
  const submitLabel=submit.textContent;controls.forEach(([c])=>c.disabled=true);form.setAttribute('aria-busy','true');submit.textContent='Sending…';status.textContent='Sending your enquiry.';
  try{await sender.send(data);status.textContent=isBrief?'Thank you! Your brief has been sent. We will get back to you with the next steps.':'Thank you! Your enquiry has been sent. We will reply within 24 hours.';delivery.hidden=true;}
  catch(error){status.textContent=error.message;fallback.hidden=false;for(const [key] of Object.entries(error.fields||{})){const field=form.elements.namedItem(key);if(field?.tagName)showError(field,'Please check this field.');}delivery.hidden=false;document.querySelector('#prepared-email').href='mailto:studio@timdsgn.com';delivery.querySelector('.delivery-instructions').textContent='You can download a copy and attach it to an email to studio@timdsgn.com.';}
  finally{controls.forEach(([c,disabled])=>c.disabled=disabled);form.removeAttribute('aria-busy');submit.textContent=submitLabel;status.focus();}
});
if(isBrief){
  const initial=parseServices(new URLSearchParams(location.search).get('services'));
  const normalized=normalizeSelection(initial,initial.length===1?initial[0]:'');
  services.forEach(s=>s.checked=normalized.includes(s.value));
  document.querySelector('#previous-step').addEventListener('click',()=>showStep(Math.max(0,current-1)));
  document.querySelector('#next-step').addEventListener('click',nextStep);
  stepButtons.forEach((b,i)=>b.addEventListener('click',()=>{if(i<=furthest)showStep(i);}));
  document.querySelector('.brief-review').addEventListener('toggle',refreshReview);
  refreshServices();showStep(0,false);
}else{
  const preselection=new URLSearchParams(location.search).get('service');
  if([...form.elements.service.options].some(o=>o.value===preselection))form.elements.service.value=preselection;
  refreshServices();
}
