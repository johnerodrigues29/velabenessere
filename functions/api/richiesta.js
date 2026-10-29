// Executado exclusivamente no servidor Cloudflare Pages Functions.
// O token nunca é incluído no frontend e não deve ser escrito neste arquivo.
const OFFERS=Object.freeze({'testosteron-boost':400,'curcuma-complex':357,cystobact:281,'artroflex-active':208,'parazax-complex':20,erectrum:442,'ketoslim-cream':583,'reprostat-cream':447,'venarix-caps':615,'venarix-cream':609});
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const active=env=>env.LEADS_ENABLED==='true'&&typeof env.WEBVORK_TOKEN==='string'&&!!env.WEBVORK_TOKEN.trim();
async function readBody(request){const reader=request.body?.getReader();if(!reader)throw new Error('empty');const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new Error('large')}chunks.push(value)}const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length}return JSON.parse(new TextDecoder().decode(all))}

// Timeout portátil; não depende de AbortSignal.timeout no runtime.
async function transport(url, options={}, timeoutMs=15000){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{return await fetch(url,{...options,signal:controller.signal})}finally{clearTimeout(timer)}
}
function errorKind(error){const message=String(error?.message||'');if(error?.name==='AbortError'||error?.name==='TimeoutError')return 'TIMEOUT';if(/not implemented|unsupported/i.test(message)&&/redirect/i.test(message))return 'RUNTIME_REDIRECT_MODE';if(/redirect/i.test(message))return 'REDIRECT';if(/dns|resolve|host/i.test(message))return 'DNS_OR_HOST';if(/tls|ssl|certificate/i.test(message))return 'TLS';return 'CONNECTION_OR_RUNTIME'}
async function probe(host){
 const start=Date.now();
 try{
  // SEM token, nome, telefone ou oferta. Não cria um lead.
  const response=await transport('https://'+host+'/v1/new-lead',{method:'GET',headers:{Accept:'application/json'},redirect:'manual'},5000);
  let body;try{body=await readBody(response)}catch{}
  const message=typeof body?.message==='string'?body.message:typeof body?.msg==='string'?body.msg:'';
  const expected=body?.status==='error'&&/empty token|token.*(?:empty|missing)|(?:missing|empty).*token/i.test(message);
  if(response.body&&!response.bodyUsed)await response.body.cancel();
  return {host,httpStatus:response.status,elapsedMs:Date.now()-start,apiResponded:!!body,expectedMissingToken:expected,redirect:response.status>=300&&response.status<400};
 }catch(error){return {host,error:errorKind(error),errorName:String(error?.name||'Error').slice(0,50),detail:String(error?.message||'').slice(0,240),elapsedMs:Date.now()-start}}
}

export async function onRequest({request,env}){
 if(request.method==='GET'){
  if(new URL(request.url).searchParams.get('diagnostico')==='1'){
   if(env.WEBVORK_DIAGNOSTICS!=='true')return json({enabled:active(env),diagnosticsEnabled:false,instruction:'Impostare WEBVORK_DIAGNOSTICS=true e ripubblicare per il test di sola connessione.'});
   const apis=await Promise.all(['api.webvork.com','api2.webvork.com'].map(probe));
   return json({version:'diagnostics-1',enabled:active(env),tokenValidated:false,leadSent:false,runtime:{abortController:typeof AbortController==='function',abortSignalTimeout:typeof AbortSignal?.timeout==='function'},apis});
  }
  return json({enabled:active(env)});
 }
 if(request.method!=='POST')return json({ok:false,message:'Metodo non consentito.'},405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,message:'Origine non consentita.'},403);
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({ok:false,message:'Formato non valido.'},415);
 let data;try{data=await readBody(request)}catch{return json({ok:false,message:'Richiesta non valida o troppo grande.'},400)}
 if(!data||typeof data!=='object'||Array.isArray(data))return json({ok:false,message:'Richiesta non valida.'},400);
 if(!Object.hasOwn(OFFERS,data.product)||typeof data.name!=='string'||data.name.trim().length<2||data.name.length>100||/[\u0000-\u001f\u007f]/.test(data.name)||typeof data.phone!=='string'||!/^[+()\d .-]{7,25}$/.test(data.phone)||data.phone.replace(/\D/g,'').length<7||data.consent!==true||data.website)return json({ok:false,message:'Controlla nome, telefono e consenso prima di riprovare.'},400);
 if(!active(env))return json({ok:false,message:'Il servizio di ricontatto non è ancora attivo. Nessun dato è stato inviato.'},503);
 const ip=request.headers.get('CF-Connecting-IP');if(!ip)return json({ok:false,message:'Dati tecnici mancanti. Riprova dal sito pubblicato.'},400);
 const payload=new URLSearchParams({token:env.WEBVORK_TOKEN.trim(),offer_id:String(OFFERS[data.product]),name:data.name.trim(),phone:data.phone.trim(),country:'IT',lang:'it',ip});
 for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'])if(typeof data.utm?.[key]==='string')payload.set(key,data.utm[key].slice(0,200));
 try{
  const response=await transport('https://api.webvork.com/v1/new-lead',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:payload,redirect:'manual'});
  if(response.status>=300&&response.status<400){if(response.body)await response.body.cancel();return json({ok:false,code:'UPSTREAM_REDIRECT',message:'Il servizio ha richiesto un reindirizzamento. La ricezione non è confermata; non ripetere subito l’invio.'},502)}
  let result;try{result=await response.json()}catch{return json({ok:false,message:'Ricezione non confermata. Evita invii ripetuti e riprova più tardi.'},502)}
  // Contratto documentato Webvork: status=ok e guid dell'ordine.
  if(response.ok&&result?.status==='ok'&&typeof result.guid==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(result.guid))return json({ok:true});
  return json({ok:false,message:'Il servizio non ha confermato la richiesta. I dati compilati sono stati conservati.'},502);
 }catch(error){const reference=crypto.randomUUID();const code=errorKind(error);console.error(JSON.stringify({event:'WEBVORK_TRANSPORT_FAILURE',reference,code}));return json({ok:false,code,reference,message:'Ricezione non confermata. Il servizio potrebbe aver ricevuto la richiesta: evita invii ripetuti e riprova più tardi. Riferimento: '+reference},504)}
}
