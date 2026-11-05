(() => {
  const key='timdsgn:consent',lifetime=180*24*60*60*1000,id='G-WDE10848CZ';
  const defaults=()=>({necessary:true,preferences:false,analytics:false,marketing:false});
  function read(){try{const c=JSON.parse(localStorage.getItem(key));if(c?.version===2&&Number.isFinite(c.savedAt)&&c.savedAt<=Date.now()&&c.expiresAt===c.savedAt+lifetime&&c.expiresAt>Date.now()&&c.categories?.necessary===true&&['preferences','analytics','marketing'].every(k=>typeof c.categories[k]==='boolean'))return c;localStorage.removeItem(key);}catch{}return null;}
  let consent=read(),loaded=false;
  const get=()=>({version:2,savedAt:consent?.savedAt??null,expiresAt:consent?.expiresAt??null,categories:{...(consent?.categories??defaults())}});
  window.TIMDSGNConsent=Object.freeze({get});
  function syncAnalytics(){
    const allowed=get().categories.analytics;window['ga-disable-'+id]=!allowed;
    if(!allowed){document.cookie.split(';').forEach(entry=>{const name=entry.trim().split('=')[0];if(name!=='_ga'&&!name.startsWith('_ga_'))return;document.cookie=`${name}=; Max-Age=0; path=/`;const parts=location.hostname.split('.');while(parts.length>1){document.cookie=`${name}=; Max-Age=0; path=/; domain=${parts.join('.')}`;parts.shift();}});return;}
    if(loaded||!['timdsgn.com','www.timdsgn.com'].includes(location.hostname))return;loaded=true;
    window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});window.gtag('js',new Date());
    let referrer='';try{const u=new URL(document.referrer);referrer=u.origin+u.pathname;}catch{}
    window.gtag('config',id,{allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:15552000,page_location:location.origin+location.pathname,page_referrer:referrer});
    const tag=document.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.append(tag);
  }
  syncAnalytics();
  const button=(action,label,kind='')=>`<button type="button" class="cookie-button ${kind}" data-consent-action="${action}">${label}</button>`;
  const links='<p class="cookie-policy-links"><a href="/cookies.html">Cookie policy</a><a href="/privacy.html">Privacy policy</a></p>';
  const banner=document.createElement('section');banner.className='cookie-banner';banner.setAttribute('aria-labelledby','cookie-title');
  banner.innerHTML='<div class="cookie-banner-inner"><div class="cookie-copy"><h2 id="cookie-title">Your privacy, your choice.</h2><p>We use essential browser storage to keep the site working. With your permission, Google Analytics helps us understand website visits.</p>'+links+'</div><div class="cookie-actions">'+button('customize','Customize','secondary')+button('reject','Reject all','secondary')+button('accept','Accept all','lime')+'</div></div>';
  const spacer=document.createElement('div');spacer.className='cookie-spacer';spacer.setAttribute('aria-hidden','true');
  const dialog=document.createElement('dialog');dialog.className='cookie-dialog';dialog.setAttribute('aria-labelledby','cookie-settings-title');
  dialog.innerHTML='<div class="cookie-dialog-header"><h2 id="cookie-settings-title">Cookie settings</h2><button type="button" class="cookie-close" aria-label="Close cookie settings">×</button></div><p>Choose whether we may use analytics. You can change your choice at any time.</p><div class="cookie-category"><div><label for="cookie-necessary">Necessary</label><p>Remembers your consent and supports the site’s motion controls. Always active.</p></div><input id="cookie-necessary" type="checkbox" checked disabled></div><div class="cookie-category"><div><label for="cookie-analytics">Analytics</label><p>Google Analytics measures website visits. It loads only with your permission.</p></div><input id="cookie-analytics" type="checkbox"></div>'+links+'<div class="cookie-actions">'+button('save','Save preferences')+button('reject','Reject all','secondary')+button('accept','Accept all','lime')+'</div>';
  document.body.append(spacer,banner,dialog);
  const footerButton=document.createElement('button');footerButton.type='button';footerButton.className='cookie-settings-link';footerButton.textContent='Cookie settings';
  (document.querySelector('.footer-line')||document.querySelector('.site-footer')||document.body).append(footerButton);
  let opener;
  function refresh(){banner.hidden=Boolean(consent);document.documentElement.style.setProperty('--cookie-banner-height',banner.hidden?'0px':Math.ceil(banner.getBoundingClientRect().height)+'px');}
  function open(){opener=document.activeElement;dialog.querySelector('#cookie-analytics').checked=get().categories.analytics;dialog.showModal();document.body.classList.add('dialog-open');document.documentElement.classList.add('cookie-dialog-open');}
  function save(analytics){const savedAt=Date.now();consent={version:2,savedAt,expiresAt:savedAt+lifetime,categories:{...defaults(),analytics}};try{localStorage.setItem(key,JSON.stringify(consent));}catch{}syncAnalytics();refresh();if(dialog.open)dialog.close();window.dispatchEvent(new CustomEvent('timdsgn:consent-change',{detail:get()}));}
  function action(e){const a=e.target.closest('[data-consent-action]')?.dataset.consentAction;if(a==='customize')open();if(a==='reject')save(false);if(a==='accept')save(true);if(a==='save')save(dialog.querySelector('#cookie-analytics').checked);}
  banner.addEventListener('click',action);dialog.addEventListener('click',action);footerButton.addEventListener('click',open);dialog.querySelector('.cookie-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');document.documentElement.classList.remove('cookie-dialog-open');(opener?.isConnected?opener:footerButton).focus({preventScroll:true});});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
  document.querySelectorAll('.legal-content [data-consent-action="customize"]').forEach(b=>b.addEventListener('click',open));
  new ResizeObserver(refresh).observe(banner);
  window.addEventListener('storage',e=>{if(e.key===key||e.key===null){consent=read();syncAnalytics();refresh();}});
  refresh();
})();
