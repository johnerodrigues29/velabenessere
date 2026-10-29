// Executado exclusivamente no servidor Cloudflare Pages Functions.
// O token nunca é incluído no frontend e não deve ser escrito neste arquivo.
const OFFERS=Object.freeze({'testosteron-boost':400,'curcuma-complex':357,cystobact:281,'artroflex-active':208,'parazax-complex':20,erectrum:442,'ketoslim-cream':583,'reprostat-cream':447,'venarix-caps':615,'venarix-cream':609});
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const active=env=>env.LEADS_ENABLED==='true'&&typeof env.WEBVORK_TOKEN==='string'&&!!env.WEBVORK_TOKEN.trim();
async function readBody(request){const reader=request.body?.getReader();if(!reader)throw new Error('empty');const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();throw new Error('large')}chunks.push(value)}const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length}return JSON.parse(new TextDecoder().decode(all))}
export async function onRequest({request,env}){
 if(request.method==='GET')return json({enabled:active(env)});
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
  const response=await fetch('https://api.webvork.com/v1/new-lead',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:payload,redirect:'error',signal:AbortSignal.timeout(15000)});
  let result;try{result=await response.json()}catch{return json({ok:false,message:'Ricezione non confermata. Evita invii ripetuti e riprova più tardi.'},502)}
  // Contratto documentato Webvork: status=ok e guid dell'ordine.
  if(response.ok&&result?.status==='ok'&&typeof result.guid==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(result.guid))return json({ok:true});
  return json({ok:false,message:'Il servizio non ha confermato la richiesta. I dati compilati sono stati conservati.'},502);
 }catch{return json({ok:false,message:'Ricezione non confermata. Il servizio potrebbe aver ricevuto la richiesta: evita invii ripetuti e riprova più tardi.'},504)}
}
