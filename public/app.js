
const menu=document.querySelector('.menu'),navigation=document.querySelector('#navigation'),menuClose=document.querySelector('.menu-close');
const mobileView=window.matchMedia('(max-width: 740px)');let menuIsOpen=false,menuScroll=0;
function setMenu(open,restoreFocus=true){
 if(!navigation||!menu)return;open=!!open&&mobileView.matches;if(open===menuIsOpen)return;
 menuIsOpen=open;navigation.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);
 document.querySelector('main').inert=open;document.querySelector('footer').inert=open;
 if(open){document.querySelector('header')?.classList.remove('site-header-hidden');menuScroll=window.scrollY;document.body.style.position='fixed';document.body.style.top='-'+menuScroll+'px';document.body.style.width='100%';navigation.setAttribute('role','dialog');navigation.setAttribute('aria-modal','true');navigation.setAttribute('aria-label','Menu principale');menuClose.focus()}
 else{document.body.style.position='';document.body.style.top='';document.body.style.width='';navigation.removeAttribute('role');navigation.removeAttribute('aria-modal');navigation.setAttribute('aria-label','Navigazione principale');window.scrollTo({top:menuScroll,behavior:'instant'});if(restoreFocus)menu.focus()}
}
menu?.addEventListener('click',()=>setMenu(!menuIsOpen));menuClose?.addEventListener('click',()=>setMenu(false));navigation?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false,false)));
mobileView.addEventListener('change',()=>{if(!mobileView.matches)setMenu(false,false)});
document.addEventListener('keydown',event=>{if(!menuIsOpen)return;if(event.key==='Escape'){event.preventDefault();setMenu(false);return}if(event.key==='Tab'){const items=[...navigation.querySelectorAll('a[href],button:not([disabled])')].filter(el=>el.getClientRects().length);const first=items[0],last=items[items.length-1];if(!items.length){event.preventDefault();navigation.focus()}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}});
let filter='all';const search=document.querySelector('#search');function apply(){let count=0;document.querySelectorAll('[data-category]').forEach(card=>{const show=(filter==='all'||card.dataset.category===filter)&&card.dataset.name.includes((search?.value||'').trim().toLowerCase());card.hidden=!show;if(show)count++});const empty=document.querySelector('#empty');if(empty)empty.hidden=count>0}search?.addEventListener('input',apply);document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});apply()}));
const form=document.querySelector('#leadform'),modal=document.querySelector('#success');document.querySelector('#closemodal')?.addEventListener('click',()=>modal.close());modal?.addEventListener('click',e=>{if(e.target===modal){const b=modal.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)modal.close()}});
function normalizeItalianPhone(value){return String(value).trim().replace(/^(?:\+39|0039)\s*/, '').replace(/\D/g,'');}
const phoneInput=form?.querySelector('#phone');
phoneInput?.addEventListener('input',()=>{phoneInput.value=normalizeItalianPhone(phoneInput.value)});
const stickyOrder=document.querySelector('.mobileorder'),orderSection=document.querySelector('#richiesta');
if(stickyOrder&&orderSection){
 const updateSticky=()=>{const box=orderSection.getBoundingClientRect();const header=document.querySelector('header');const headerBottom=header?Math.max(0,header.getBoundingClientRect().bottom):0;stickyOrder.hidden=mobileView.matches&&box.top<window.innerHeight&&box.bottom>headerBottom};
 updateSticky();
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(updateSticky,{threshold:[0,0.01,0.25,0.5,0.75,1]});observer.observe(orderSection)}
 window.addEventListener('scroll',updateSticky,{passive:true});window.addEventListener('resize',updateSticky);mobileView.addEventListener('change',updateSticky);
}
form?.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const button=form.querySelector('button[type=submit]'),status=document.querySelector('#formstatus');button.disabled=true;const old=button.textContent;button.textContent='Invio in corso…';status.textContent='';try{const data=Object.fromEntries(new FormData(form));data.phone='+39'+normalizeItalianPhone(data.phone);data.product=form.dataset.product;data.consent=form.elements.consent.checked;const utm={};for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']){const v=new URLSearchParams(location.search).get(key);if(v)utm[key]=v.slice(0,200)}data.utm=utm;const endpoint=window.VELA_CONFIG?.leadEndpoint;if(!endpoint)throw new Error('Il servizio di ricontatto non è ancora attivo. Nessun dato è stato inviato.');const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.message||'Invio non riuscito. Riprova più tardi.');form.reset();modal.showModal()}catch(err){status.textContent=err.message||'Connessione non disponibile. I dati compilati sono stati conservati.'}finally{button.disabled=false;button.textContent=old}});

// La funzione rivela soltanto se il servizio è attivo, mai il token.
(async()=>{if(!form)return;const endpoint=window.VELA_CONFIG?.leadEndpoint;if(!endpoint)return;try{const response=await fetch(endpoint,{cache:'no-store'});if(!response.ok)return;const state=await response.json();if(state.enabled===true){const notice=form.closest('.ordermodule')?.querySelector('.policy-note');if(notice)notice.hidden=true;form.querySelector('button[type=submit]').textContent='Richiedi un ricontatto ↗';}}catch{/* Mantiene l'avviso di servizio non attivo. */}})();

// Il menu rimane accessibile mentre il contenuto ha più spazio durante la lettura.
(()=>{
 const siteHeader=document.querySelector('header');if(!siteHeader)return;
 let previousY=Math.max(0,window.scrollY),scheduled=false;
 const show=()=>siteHeader.classList.remove('site-header-hidden');
 const update=()=>{
  scheduled=false;const y=Math.max(0,window.scrollY);
  if(menuIsOpen||y<80){show();previousY=y;return}
  const focused=document.activeElement;
  if(siteHeader.contains(focused)&&focused?.matches(':focus-visible')){show();previousY=y;return}
  const delta=y-previousY;if(Math.abs(delta)<8)return;
  siteHeader.classList.toggle('site-header-hidden',delta>0);previousY=y;
 };
 window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});
 siteHeader.addEventListener('focusin',show);
 window.addEventListener('pageshow',()=>{previousY=Math.max(0,window.scrollY);show()});
})();
