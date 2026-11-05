const dialog=document.querySelector('#menu-dialog'),toggle=document.querySelector('#menu-toggle');
toggle?.addEventListener('click',()=>{dialog.showModal();toggle.setAttribute('aria-expanded','true');});
dialog?.querySelector('[data-close-menu]').addEventListener('click',()=>dialog.close());
dialog?.addEventListener('close',()=>toggle.setAttribute('aria-expanded','false'));
dialog?.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
