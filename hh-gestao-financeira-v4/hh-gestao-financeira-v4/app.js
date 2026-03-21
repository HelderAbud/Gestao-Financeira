
// app.js - lógica principal (base v3)




const MESES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const CATS_D=['Alimentação','Transporte','Saúde','Lazer','Moradia','Educação','Investimento','Outros'];
const CATS_R=['Salário','Freelance','Investimento','Bônus','Outros'];
const CORES={'Alimentação':'#f87171','Transporte':'#60a5fa','Saúde':'#34d399','Lazer':'#f472b6','Moradia':'#a78bfa','Educação':'#fbbf24','Investimento':'#2dd4bf','Salário':'#22c55e','Freelance':'#86efac','Bônus':'#fcd34d','Outros':'#94a3b8'};
const KEY='hh_v4_dados_migracao', KEY_PASS='hh_v4_senha';
const LEGACY_KEY='hh_v2_dados', LEGACY_KEY_PASS='hh_v2_senha';
const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2MB

// Mantém a senha em memória após autenticação.
let AUTH_PASS = null;

function canSecure(){
  return !!(
    window.crypto &&
    window.crypto.subtle &&
    typeof encryptData === 'function' &&
    typeof decryptData === 'function' &&
    typeof saveDB === 'function' &&
    typeof loadDB === 'function'
  );
}

function getLocalFallbackDB(){
  try{
    const r = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY);
    if(r) return JSON.parse(r);
  }catch{}
  return null;
}

async function loadPersistedDB(pass){
  if(!canSecure()){
    return getLocalFallbackDB();
  }
  const stored = await loadDB().catch(()=>null);
  if(stored && stored.enc){
    return await decryptData(pass, stored.enc);
  }
  // Migração de dados antigos em texto plano.
  return getLocalFallbackDB();
}

async function savePersistedDB(pass){
  if(!pass) return;
  if(!canSecure()){
    // fallback para ambientes sem WebCrypto/IndexedDB
    try{ localStorage.setItem(KEY, JSON.stringify(DB)); }catch{}
    return;
  }
  const enc = await encryptData(pass, DB);
  await saveDB({ enc }).catch(()=>{});
}

async function initAfterAuth(pass){
  AUTH_PASS = pass;
  const loaded = await loadPersistedDB(pass);
  if(loaded && typeof loaded === 'object'){
    DB = normalizarDB(loaded);
  }else{
    DB = normalizarDB(carregarDB());
  }
  await savePersistedDB(pass);
}

function showLockError(msg){
  try{
    const el=document.getElementById('lock-err');
    if(el) el.textContent=String(msg || '');
  }catch{}
}

// Ajuda a depurar: em alguns navegadores (file://) erros podem "sumir" sem feedback.
window.addEventListener('error',e=>{ showLockError('Erro JS: '+(e && e.message ? e.message : 'desconhecido')); });
window.addEventListener('unhandledrejection',e=>{
  const r = e && e.reason ? e.reason : null;
  showLockError('Erro: '+(r && r.message ? r.message : r ? String(r) : 'desconhecido'));
});

// SENHA SHA-256 (WebCrypto com fallback puro JS)
function utf8Encode(str){
  // Converte string JS para bytes UTF-8 (string binária com charcodes 0..255)
  return unescape(encodeURIComponent(str));
}

function sha256Fallback(ascii){
  // Implementacao SHA-256 em JavaScript (hex) para ambientes sem WebCrypto.
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];

  function rotr(x,n){ return (x>>>n) | (x<<(32-n)); }
  function ch(x,y,z){ return (x & y) ^ ((~x) & z); }
  function maj(x,y,z){ return (x & y) ^ (x & z) ^ (y & z); }
  function sig0(x){ return rotr(x,2) ^ rotr(x,13) ^ rotr(x,22); }
  function sig1(x){ return rotr(x,6) ^ rotr(x,11) ^ rotr(x,25); }
  function theta0(x){ return rotr(x,7) ^ rotr(x,18) ^ (x>>>3); }
  function theta1(x){ return rotr(x,17) ^ rotr(x,19) ^ (x>>>10); }

  const str = utf8Encode(String(ascii));
  const l = str.length;

  // Preprocessamento: bytes + padding
  let bytes = new Array(l);
  for(let i=0;i<l;i++) bytes[i] = str.charCodeAt(i);
  bytes.push(0x80);
  while((bytes.length % 64) !== 56) bytes.push(0x00);

  // Comprimento em bits (64-bit big-endian)
  const bitLenHi = Math.floor((l * 8) / 0x100000000);
  const bitLenLo = (l * 8) >>> 0;
  bytes.push((bitLenHi>>>24)&0xff,(bitLenHi>>>16)&0xff,(bitLenHi>>>8)&0xff,bitLenHi&0xff);
  bytes.push((bitLenLo>>>24)&0xff,(bitLenLo>>>16)&0xff,(bitLenLo>>>8)&0xff,bitLenLo&0xff);

  // Estados iniciais
  let H = [
    0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,
    0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19
  ];

  const W = new Array(64);
  for(let i=0;i<bytes.length;i+=64){
    for(let t=0;t<16;t++){
      const j = i + t*4;
      W[t] = ((bytes[j]<<24) | (bytes[j+1]<<16) | (bytes[j+2]<<8) | (bytes[j+3])) >>> 0;
    }
    for(let t=16;t<64;t++){
      W[t] = (theta1(W[t-2]) + W[t-7] + theta0(W[t-15]) + W[t-16]) >>> 0;
    }

    let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(let t=0;t<64;t++){
      const T1 = (h + sig1(e) + ch(e,f,g) + K[t] + W[t]) >>> 0;
      const T2 = (sig0(a) + maj(a,b,c)) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) >>> 0;
    }

    H[0]=(H[0]+a)>>>0;
    H[1]=(H[1]+b)>>>0;
    H[2]=(H[2]+c)>>>0;
    H[3]=(H[3]+d)>>>0;
    H[4]=(H[4]+e)>>>0;
    H[5]=(H[5]+f)>>>0;
    H[6]=(H[6]+g)>>>0;
    H[7]=(H[7]+h)>>>0;
  }

  return H.map(x=>x.toString(16).padStart(8,'0')).join('');
}

async function hashS(s){
  const v = String(s);
  if(window.crypto && window.crypto.subtle && window.TextEncoder){
    const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));
    return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  return sha256Fallback(v);
}

function escHtml(s){
  const v = s == null ? '' : String(s);
  return v
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function num(v, def=0){
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : def;
}

function clampPct(pct){
  if(!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function pctFromParts(atual, alvo){
  if(num(alvo,0) <= 0) return num(atual,0) > 0 ? 100 : 0;
  return clampPct((num(atual,0) / num(alvo,0)) * 100);
}

async function getSH(){
  return localStorage.getItem(KEY_PASS) || localStorage.getItem(LEGACY_KEY_PASS); // null se nunca definiu senha
}

async function entrar(){
  const v=document.getElementById('lock-inp').value;
  const inp=document.getElementById('lock-inp');
  const err=document.getElementById('lock-err');

  err.textContent=''; // limpa feedback anterior

  try{
    const storedHash = await getSH();
    if(!storedHash){
      err.textContent='Abrindo criação de senha...';
      await abrirSenha(true);
      return;
    }

    if((await hashS(v))===storedHash){
      // Migra hash legado para chave v4.
      if(!localStorage.getItem(KEY_PASS)){
        try{ localStorage.setItem(KEY_PASS, storedHash); }catch{}
      }
      document.getElementById('lock').classList.add('hidden');
      document.getElementById('app').classList.add('visible');
      inp.value='';
      err.textContent='';
      await initAfterAuth(v);
      aplicarAssinaturas();
      render();
    }else{
      err.textContent='❌ Senha incorreta.';
      inp.classList.add('err');inp.value='';
      setTimeout(()=>{inp.classList.remove('err');inp.focus();},400);
    }
  }catch(e){
    err.textContent='Erro ao tentar entrar: '+(e && e.message ? e.message : e);
    inp.classList.add('err');inp.value='';
    setTimeout(()=>{inp.classList.remove('err');inp.focus();},400);
  }
}
function bloquear(){document.getElementById('app').classList.remove('visible');document.getElementById('lock').classList.remove('hidden');document.getElementById('lock-inp').value='';document.getElementById('lock-err').textContent='';setTimeout(()=>document.getElementById('lock-inp').focus(),200);}
async function abrirSenha(primeiraVez=false){
  try{
    ['s-atual','s-nova','s-conf'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.value='';
    });
    const sErr=document.getElementById('s-err');
    if(sErr) sErr.textContent='';

    const storedHash = primeiraVez ? null : await getSH();

    const titulo = document.getElementById('senha-titulo');
    if(primeiraVez || !storedHash){
      if(titulo) titulo.textContent='🔑 Criar senha';
      setTimeout(()=>{ const el=document.getElementById('s-nova'); if(el) el.focus(); },120);
    } else {
      if(titulo) titulo.textContent='🔑 Alterar senha';
      setTimeout(()=>{ const el=document.getElementById('s-atual'); if(el) el.focus(); },120);
    }

    document.getElementById('mo-senha').classList.add('open');
  }catch(e){
    showLockError('Erro ao abrir senha: '+(e && e.message ? e.message : e));
  }
}
function fecharSenha(){document.getElementById('mo-senha').classList.remove('open');}
async function salvarSenha(){
  const a=document.getElementById('s-atual').value;
  const n=document.getElementById('s-nova').value;
  const c=document.getElementById('s-conf').value;
  const er=document.getElementById('s-err');

  er.textContent='';

  let storedHash;
  try{
    storedHash = await getSH();
  }catch(e){
    er.textContent='Erro ao acessar senha salva. LocalStorage pode estar bloqueado.';
    return;
  }
  const primeiraVez = !storedHash;

  try{
    if(!primeiraVez){
      if((await hashS(a))!==storedHash){er.textContent='Senha atual incorreta.';return;}
    }
  }catch(e){
    er.textContent='Erro criptográfico ao validar senha atual.';
    return;
  }
  if(n.length<4){
    er.textContent = primeiraVez ? 'Crie uma senha com pelo menos 4 caracteres.' : 'Nova senha deve ter pelo menos 4 caracteres.';
    return;
  }
  if(n!==c){er.textContent='As senhas não coincidem.';return;}

  // Se já existia uma senha, carregamos o payload com a senha antiga
  // para re-criptografar com a nova.
  if(!primeiraVez){
    try{
      const loaded = await loadPersistedDB(a);
      if(loaded && typeof loaded === 'object') DB = normalizarDB(loaded);
    }catch(e){}
  }

  try{
    localStorage.setItem(KEY_PASS,await hashS(n));
  }catch(e){
    er.textContent='Erro ao gravar senha. LocalStorage pode estar bloqueado.';
    return;
  }

  fecharSenha();
  toast(primeiraVez ? '✅ Senha criada com sucesso!' : '✅ Senha alterada com sucesso!');

  // Auto-login (pra não depender de clicar em "Entrar" de novo)
  AUTH_PASS = n;
  await savePersistedDB(n);
  aplicarAssinaturas();
  document.getElementById('lock').classList.add('hidden');
  document.getElementById('app').classList.add('visible');
  render();
}

// DADOS
let now=new Date(),curMes=now.getMonth(),curAno=now.getFullYear();
let modalMode='',editId=null,depMetaId=null,nextId=Date.now();
let catCI=null,evolCI=null,yearCI=null;

function carregarDB(){
  try{
    const r=localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY);
    if(r)return JSON.parse(r);
  }catch(e){}
  const m=now.getMonth(),a=now.getFullYear();
  return{despesas:[
    {id:1,desc:'Supermercado',valor:320,cat:'Alimentação',tipo:'variavel',mes:m,ano:a,data:'',obs:''},
    {id:2,desc:'Aluguel',valor:1200,cat:'Moradia',tipo:'fixa',mes:m,ano:a,data:'',obs:''},
    {id:3,desc:'Gasolina',valor:180,cat:'Transporte',tipo:'variavel',mes:m,ano:a,data:'',obs:''},
    {id:4,desc:'Academia',valor:99,cat:'Saúde',tipo:'fixa',mes:m,ano:a,data:'',obs:''},
  ],receitas:[
    {id:5,desc:'Salário',valor:5000,cat:'Salário',mes:m,ano:a,data:'',obs:''},
    {id:6,desc:'Freelance',valor:800,cat:'Freelance',mes:m,ano:a,data:'',obs:''},
  ],metas:[
    {id:7,desc:'Viagem Europa',alvo:8000,atual:2400,historico:[]},
    {id:8,desc:'Reserva emergência',alvo:15000,atual:7500,historico:[]},
  ],assinaturas:[
    {id:9,desc:'Netflix',valor:39.90,cat:'Lazer'},
    {id:10,desc:'Spotify',valor:21.90,cat:'Lazer'},
    {id:11,desc:'Internet',valor:99.90,cat:'Moradia'},
  ],planejado:{'Alimentação':800,'Transporte':300,'Saúde':200,'Lazer':250,'Moradia':1200,'Educação':200,'Investimento':500,'Outros':150},
  assinLancadas:[]};
}
let DB=carregarDB();
if(!DB.assinLancadas)DB.assinLancadas=[];
DB.despesas.forEach(d=>{if(!d.obs)d.obs='';if(!d.data)d.data='';});
DB.receitas.forEach(r=>{if(!r.obs)r.obs='';if(!r.data)r.data='';});
DB.metas.forEach(m=>{if(!m.historico)m.historico=[];});
DB.assinaturas.forEach(a=>{if(!a.cat)a.cat='Outros';});

function safeMes(v){
  const n=parseInt(v,10);
  return Number.isFinite(n) ? Math.max(0,Math.min(11,n)) : curMes;
}
function safeAno(v){
  const n=parseInt(v,10);
  return Number.isFinite(n) ? Math.max(1900,Math.min(2100,n)) : curAno;
}
function normalizarTexto(v){ return v == null ? '' : String(v); }

function normalizarDB(inObj){
  const src = (inObj && typeof inObj === 'object') ? inObj : {};
  const base = carregarDB();

  if(Array.isArray(src.despesas)){
    base.despesas = src.despesas.map((d,idx)=>({
      id: Number.isFinite(parseInt(d?.id,10)) ? parseInt(d.id,10) : (Date.now()+idx),
      desc: normalizarTexto(d?.desc),
      valor: num(d?.valor,0),
      cat: normalizarTexto(d?.cat),
      tipo: (d?.tipo==='fixa' || d?.tipo==='variavel') ? d.tipo : 'variavel',
      mes: safeMes(d?.mes),
      ano: safeAno(d?.ano),
      data: normalizarTexto(d?.data),
      obs: normalizarTexto(d?.obs),
      ...(d?.assinId != null ? {assinId: d.assinId} : {})
    })).filter(x=>x.desc.length>0);
  }

  if(Array.isArray(src.receitas)){
    base.receitas = src.receitas.map((r,idx)=>({
      id: Number.isFinite(parseInt(r?.id,10)) ? parseInt(r.id,10) : (Date.now()+idx),
      desc: normalizarTexto(r?.desc),
      valor: num(r?.valor,0),
      cat: normalizarTexto(r?.cat),
      mes: safeMes(r?.mes),
      ano: safeAno(r?.ano),
      data: normalizarTexto(r?.data),
      obs: normalizarTexto(r?.obs)
    })).filter(x=>x.desc.length>0);
  }

  if(Array.isArray(src.metas)){
    base.metas = src.metas.map((m,idx)=>({
      id: Number.isFinite(parseInt(m?.id,10)) ? parseInt(m.id,10) : (Date.now()+idx),
      desc: normalizarTexto(m?.desc),
      alvo: num(m?.alvo,0),
      atual: num(m?.atual,0),
      historico: Array.isArray(m?.historico) ? m.historico.map(h=>({val:num(h?.val,0), data: normalizarTexto(h?.data)})) : []
    })).filter(x=>x.desc.length>0);
  }

  if(Array.isArray(src.assinaturas)){
    base.assinaturas = src.assinaturas.map((a,idx)=>({
      id: Number.isFinite(parseInt(a?.id,10)) ? parseInt(a.id,10) : (Date.now()+idx),
      desc: normalizarTexto(a?.desc),
      valor: num(a?.valor,0),
      cat: normalizarTexto(a?.cat||'Outros')
    })).filter(x=>x.desc.length>0);
  }

  if(src.planejado && typeof src.planejado === 'object'){
    base.planejado = src.planejado;
    Object.keys(base.planejado).forEach(k=>{ base.planejado[k] = num(base.planejado[k],0); });
  }

  base.assinLancadas = Array.isArray(src.assinLancadas) ? src.assinLancadas.map(x=>normalizarTexto(x)) : [];

  // Atualiza nextId para evitar colisões nos CRUD
  let max=-1;
  [...base.despesas,...base.receitas,...base.metas,...base.assinaturas].forEach(it=>{
    const id = parseInt(it?.id,10);
    if(Number.isFinite(id)) max=Math.max(max,id);
  });
  nextId = max + 1;

  return base;
}

function aplicarAssinaturas(){
  const chave=`${now.getFullYear()}-${now.getMonth()}`;
  if(DB.assinLancadas.includes(chave))return;
  let n=0;
  DB.assinaturas.forEach(a=>{
    const ja=DB.despesas.some(d=>d.assinId===a.id&&d.mes===now.getMonth()&&d.ano===now.getFullYear());
    if(!ja){DB.despesas.push({id:nextId++,desc:a.desc,valor:a.valor,cat:a.cat||'Outros',tipo:'fixa',mes:now.getMonth(),ano:now.getFullYear(),data:'',obs:'Assinatura automática',assinId:a.id});n++;}
  });
  DB.assinLancadas.push(chave);salvar();
  if(n>0)toast(`🔄 ${n} assinatura(s) lançada(s) automaticamente`);
}

function fmt(v){return'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});}
function fmtD(s){if(!s)return'';try{const[a,m,d]=s.split('-');return`${d}/${m}`;}catch{return s;}}
function despMes(m=curMes,a=curAno){return DB.despesas.filter(d=>d.mes===m&&d.ano===a);}
function recMes(m=curMes,a=curAno){return DB.receitas.filter(r=>r.mes===m&&r.ano===a);}
function totD(m=curMes,a=curAno){return despMes(m,a).filter(d=>d.cat!=='Investimento').reduce((s,d)=>s+d.valor,0);}
function totR(m=curMes,a=curAno){return recMes(m,a).reduce((s,r)=>s+r.valor,0);}
function totI(m=curMes,a=curAno){return despMes(m,a).filter(d=>d.cat==='Investimento').reduce((s,d)=>s+d.valor,0);}
function salMes(m=curMes,a=curAno){return totR(m,a)-totD(m,a)-totI(m,a);}
function toast(msg,ms=2600){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),ms);}
function salvar(){
  try{
    // Persistência async (IndexedDB + criptografia quando disponível)
    if(AUTH_PASS){
      savePersistedDB(AUTH_PASS).catch(()=>{ /* ignora falha de persistência */ });
    }else{
      // fallback: só para estados iniciais (antes de autenticar)
      localStorage.setItem(KEY,JSON.stringify(DB));
    }
    const el=document.getElementById('save-txt');
    if(el){
      const t=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      el.textContent='Salvo às '+t;
    }
  }catch(e){
    toast('⚠ Erro ao salvar');
  }
}
function exportar(){const b=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='HH_v4_'+new Date().toISOString().slice(0,10)+'.json';a.click();toast('✅ Backup exportado!');}
function importar(e){
  const f=e.target.files[0]; if(!f) return;
  if(f.size > MAX_IMPORT_BYTES){ toast('⚠ Arquivo muito grande (máx. 2MB).'); return; }
  const rd=new FileReader();
  rd.onload=ev=>{
    try{
      const parsed = JSON.parse(ev.target.result);
      DB = normalizarDB(parsed);
      salvar();
      aplicarAssinaturas();
      render();
      toast('✅ Dados importados!');
    }catch{
      toast('⚠ Arquivo inválido ou corrompido');
    }
  };
  rd.readAsText(f);
}

function setupSels(){
  const sm=document.getElementById('sel-mes'),sa=document.getElementById('sel-ano');
  sm.innerHTML=MESES.map((n,i)=>`<option value="${i}"${i===curMes?' selected':''}>${n}</option>`).join('');
  const ay=now.getFullYear();
  sa.innerHTML='';
  for(let a=ay-3;a<=ay+1;a++){const o=document.createElement('option');o.value=a;o.textContent=a;if(a===curAno)o.selected=true;sa.appendChild(o);}
  sm.onchange=()=>{curMes=parseInt(sm.value);render();};
  sa.onchange=()=>{curAno=parseInt(sa.value);render();};
  const df=document.getElementById('desp-cat-fil');
  df.innerHTML='<option value="">Todas categorias</option>'+CATS_D.map(c=>`<option value="${c}">${c}</option>`).join('');
}

function render(){
  document.getElementById('mes-label').textContent=MESES[curMes]+' de '+curAno;
  const ent=totR(),sai=totD(),inv=totI(),sal=salMes();
  document.getElementById('m-ent').textContent=fmt(ent);
  document.getElementById('m-sai').textContent=fmt(sai);
  document.getElementById('m-inv').textContent=fmt(inv);
  const se=document.getElementById('m-sal');se.textContent=fmt(sal);se.style.color=sal>=0?'var(--green)':'var(--red)';
  document.getElementById('m-ent-sub').textContent=recMes().length+' lançamento(s)';
  document.getElementById('m-sai-sub').textContent=despMes().length+' lançamento(s)';
  rResumo();rDespesas();rReceitas();rMetas();rAssinaturas();rPlanejamento();rAnual();
}

function rResumo(){
  const dm=despMes(),cats={};
  dm.forEach(d=>{if(!cats[d.cat])cats[d.cat]=0;cats[d.cat]+=d.valor;});
  const lb=Object.keys(cats),vl=lb.map(l=>cats[l]),co=lb.map(l=>CORES[l]||'#94a3b8');
  if(catCI)catCI.destroy();
  if(lb.length)catCI=new Chart(document.getElementById('catChart'),{type:'doughnut',data:{labels:lb,datasets:[{data:vl,backgroundColor:co,borderWidth:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+fmt(c.parsed)}}}}});
  document.getElementById('cat-leg').innerHTML=lb.map((l,i)=>`<span class="li"><span class="ld" style="background:${co[i]}"></span>${escHtml(l)} ${fmt(vl[i])}</span>`).join('');
  const months=[];for(let i=5;i>=0;i--){let m=curMes-i,a=curAno;if(m<0){m+=12;a--;}months.push({m,a,lb:MESES[m].substring(0,3)});}
  if(evolCI)evolCI.destroy();
  evolCI=new Chart(document.getElementById('evolChart'),{type:'line',data:{labels:months.map(x=>x.lb),datasets:[{label:'Entradas',data:months.map(({m,a})=>totR(m,a)),borderColor:'#22c55e',backgroundColor:'rgba(34,197,94,0.07)',tension:0.4,fill:true,pointRadius:4,pointBackgroundColor:'#22c55e'},{label:'Saídas',data:months.map(({m,a})=>totD(m,a)),borderColor:'#f87171',backgroundColor:'rgba(248,113,113,0.07)',tension:0.4,fill:true,pointRadius:4,pointBackgroundColor:'#f87171'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4e566e',font:{size:11}}},y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4e566e',font:{size:11},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}});
  const all=[...dm,...recMes()].slice(-8).reverse();
  const list=document.getElementById('res-list');
  if(!all.length){list.innerHTML='<div class="empty">Nenhum lançamento neste mês.</div>';return;}
  list.innerHTML=all.map(item=>{
    const isR=!!DB.receitas.find(r=>r.id===item.id);
    return`<div class="ri"><div><div>${escHtml(item.desc)}${item.data?` <span style="font-size:11px;color:var(--text3)">${escHtml(fmtD(item.data))}</span>`:''}</div><div class="ri-sub">${escHtml(item.cat||'')}</div></div><div class="ri-r"><span class="badge ${isR?'bg':'br'}">${isR?'Receita':'Despesa'}</span><span style="font-family:'DM Mono',monospace;font-size:14px;color:${isR?'var(--green)':'var(--red)'}">${fmt(item.valor)}</span></div></div>`;
  }).join('');
}

function rDespesas(){
  let dm=despMes();
  const b=(document.getElementById('desp-busca').value||'').toLowerCase();
  const cf=document.getElementById('desp-cat-fil').value;
  const tf=document.getElementById('desp-tipo-fil').value;
  if(b)dm=dm.filter(d=>d.desc.toLowerCase().includes(b));
  if(cf)dm=dm.filter(d=>d.cat===cf);
  if(tf)dm=dm.filter(d=>d.tipo===tf);
  dm.sort((a,b)=>(b.data||'').localeCompare(a.data||'')||b.id-a.id);
  const list=document.getElementById('desp-list');
  if(!dm.length){list.innerHTML='<div class="empty">Nenhuma despesa encontrada.</div>';document.getElementById('desp-total').textContent='';return;}
  list.innerHTML=dm.map(d=>`<div class="ri"><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span>${escHtml(d.desc)}</span>${d.data?`<span style="font-size:11px;color:var(--text3)">${escHtml(fmtD(d.data))}</span>`:''}</div><div class="ri-sub">${d.tipo==='fixa'?'Fixa':'Variável'} · ${escHtml(d.cat)}${d.obs?` · ${escHtml(d.obs)}`:''}</div></div><div class="ri-r"><span class="badge br">${escHtml(d.cat)}</span><span style="font-family:'DM Mono',monospace;font-size:14px;color:var(--red)">${fmt(d.valor)}</span><button class="btn-ico" onclick="editarItem('despesas',${d.id})" title="Editar">✏</button><button class="btn-del" onclick="del('despesas',${d.id})">×</button></div></div>`).join('');
  const tot=dm.reduce((s,d)=>s+d.valor,0);
  document.getElementById('desp-total').textContent=`Total: ${fmt(tot)} (${dm.length} itens)`;
}

function rReceitas(){
  let rm=recMes();
  const b=(document.getElementById('rec-busca').value||'').toLowerCase();
  if(b)rm=rm.filter(r=>r.desc.toLowerCase().includes(b));
  rm.sort((a,b)=>(b.data||'').localeCompare(a.data||'')||b.id-a.id);
  const list=document.getElementById('rec-list');
  if(!rm.length){list.innerHTML='<div class="empty">Nenhuma receita encontrada.</div>';document.getElementById('rec-total').textContent='';return;}
  list.innerHTML=rm.map(r=>`<div class="ri"><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span>${escHtml(r.desc)}</span>${r.data?`<span style="font-size:11px;color:var(--text3)">${escHtml(fmtD(r.data))}</span>`:''}</div><div class="ri-sub">${escHtml(r.cat)}${r.obs?` · ${escHtml(r.obs)}`:''}</div></div><div class="ri-r"><span style="font-family:'DM Mono',monospace;font-size:14px;color:var(--green)">${fmt(r.valor)}</span><button class="btn-ico" onclick="editarItem('receitas',${r.id})" title="Editar">✏</button><button class="btn-del" onclick="del('receitas',${r.id})">×</button></div></div>`).join('');
  document.getElementById('rec-total').textContent=`Total: ${fmt(rm.reduce((s,r)=>s+r.valor,0))} (${rm.length} itens)`;
}

function rMetas(){
  const list=document.getElementById('metas-list');
  if(!DB.metas.length){list.innerHTML='<div class="empty">Nenhuma meta cadastrada.</div>';return;}
  list.innerHTML=DB.metas.map(m=>{
    const pct=pctFromParts(m.atual,m.alvo);
    const cor=pct>=100?'var(--green)':pct>=60?'var(--blue)':'var(--amber)';
    return`<div class="pw"><div class="pr"><span style="font-size:14px;font-weight:500">${escHtml(m.desc)}</span><div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap"><span style="font-size:12px;color:var(--text3)">${fmt(m.atual)} / ${fmt(m.alvo)}</span><span style="font-family:'DM Mono',monospace;font-size:12px;color:${cor}">${pct}%</span><button class="meta-dep-btn" onclick="abrirDep(${m.id})">+ Depósito</button><button class="btn-ico" onclick="editarItem('metas',${m.id})">✏</button><button class="btn-del" onclick="del('metas',${m.id})">×</button></div></div><div class="pb" style="margin-bottom:5px"><div class="pf" style="width:${pct}%;background:${cor}"></div></div>${pct<100?`<div style="font-size:12px;color:var(--text3)">Falta ${fmt(m.alvo-m.atual)} para atingir a meta</div>`:`<div style="font-size:12px;color:var(--green)">✅ Meta atingida!</div>`}${m.historico&&m.historico.length?`<div style="font-size:11px;color:var(--text3);margin-top:4px">Último depósito: ${fmt(m.historico[m.historico.length-1].val)} em ${escHtml(m.historico[m.historico.length-1].data)}</div>`:''}</div>`;
  }).join('<div style="border-top:1px solid var(--border);margin:12px 0"></div>');
}

function abrirDep(id){depMetaId=id;const m=DB.metas.find(x=>x.id===id);document.getElementById('dep-nome').textContent=m.desc;document.getElementById('dep-val').value='';document.getElementById('mo-dep').classList.add('open');setTimeout(()=>document.getElementById('dep-val').focus(),120);}
function fecharDep(){document.getElementById('mo-dep').classList.remove('open');}
function salvarDep(){
  const val=parseFloat(document.getElementById('dep-val').value)||0;
  if(!val){toast('⚠ Informe o valor');return;}
  const m=DB.metas.find(x=>x.id===depMetaId);if(!m)return;
  m.atual+=val;if(!m.historico)m.historico=[];
  m.historico.push({val,data:new Date().toLocaleDateString('pt-BR')});
  fecharDep();salvar();rMetas();toast(`✅ ${fmt(val)} adicionado à meta "${m.desc}"`);
}

function rAssinaturas(){
  const list=document.getElementById('assin-list');
  if(!DB.assinaturas.length){list.innerHTML='<div class="empty">Nenhuma assinatura cadastrada.</div>';}
  else list.innerHTML=DB.assinaturas.map(a=>`<div class="ri"><div><div>${escHtml(a.desc)}</div><div class="ri-sub">${escHtml(a.cat||'Outros')}</div></div><div class="ri-r"><span class="badge bt">Mensal</span><span style="font-family:'DM Mono',monospace;font-size:14px;color:var(--amber)">${fmt(a.valor)}</span><button class="btn-ico" onclick="editarItem('assinaturas',${a.id})">✏</button><button class="btn-del" onclick="del('assinaturas',${a.id})">×</button></div></div>`).join('');
  document.getElementById('assin-total').textContent=fmt(DB.assinaturas.reduce((s,a)=>s+a.valor,0));
}

function rPlanejamento(){
  const dm=despMes(),cats={};
  dm.forEach(d=>{if(!cats[d.cat])cats[d.cat]=0;cats[d.cat]+=d.valor;});
  document.getElementById('plan-list').innerHTML=Object.keys(DB.planejado).map(cat=>{
    const real=cats[cat]||0;
    const plan=num(DB.planejado[cat],0);
    const pct = plan>0 ? Math.min(100,Math.round((real/plan)*100)) : (real>0?100:0);
    const over = plan>0 ? real>plan : real>0;
    return`<div class="pw"><div class="pr"><span>${escHtml(cat)}</span><div style="display:flex;align-items:center;gap:8px"><span style="font-size:12px;color:${over?'var(--red)':'var(--text3)'}">${fmt(real)} / ${fmt(plan)}</span>${over?'<span style="font-size:11px;color:var(--red)">⚠ Estourou</span>':''}</div></div><div class="pb"><div class="pf" style="width:${pct}%;background:${over?'var(--red)':'var(--blue)'}"></div></div></div>`;
  }).join('');
}
function abrirPlan(){document.getElementById('plan-inputs').innerHTML=Object.keys(DB.planejado).map(cat=>`<div class="fg"><label class="fl">${escHtml(cat)}</label><input class="fi" id="pl-${cat.replace(/\s/g,'_')}" type="number" value="${DB.planejado[cat]}" step="50"/></div>`).join('');document.getElementById('mo-plan').classList.add('open');}
function fecharPlan(){document.getElementById('mo-plan').classList.remove('open');}
function salvarPlan(){Object.keys(DB.planejado).forEach(cat=>{const el=document.getElementById('pl-'+cat.replace(/\s/g,'_'));if(el)DB.planejado[cat]=parseFloat(el.value)||0;});fecharPlan();salvar();render();toast('✅ Metas atualizadas!');}

function rAnual(){
  const eD=Array.from({length:12},(_,i)=>totR(i,curAno));
  const sD=Array.from({length:12},(_,i)=>totD(i,curAno));
  const slD=Array.from({length:12},(_,i)=>salMes(i,curAno));
  const tE=eD.reduce((s,v)=>s+v,0),tS=sD.reduce((s,v)=>s+v,0),tSl=slD.reduce((s,v)=>s+v,0);
  document.getElementById('ano-ent').textContent=fmt(tE);
  document.getElementById('ano-sai').textContent=fmt(tS);
  const se=document.getElementById('ano-sal');se.textContent=fmt(tSl);se.style.color=tSl>=0?'var(--green)':'var(--red)';
  if(yearCI)yearCI.destroy();
  yearCI=new Chart(document.getElementById('yearChart'),{type:'bar',data:{labels:MESES.map(m=>m.substring(0,3)),datasets:[{label:'Entradas',data:eD,backgroundColor:'rgba(34,197,94,0.6)',borderRadius:4},{label:'Saídas',data:sD,backgroundColor:'rgba(248,113,113,0.6)',borderRadius:4},{type:'line',label:'Saldo',data:slD,borderColor:'#fbbf24',backgroundColor:'transparent',tension:0.4,pointRadius:4,pointBackgroundColor:'#fbbf24',yAxisID:'y1'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4e566e',font:{size:11}}},y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#4e566e',font:{size:11},callback:v=>'R$'+Math.round(v/1000)+'k'},position:'left'},y1:{position:'right',grid:{display:false},ticks:{color:'#fbbf24',font:{size:10},callback:v=>'R$'+Math.round(v/1000)+'k'}}}}});
  document.getElementById('ano-tabela').innerHTML=MESES.map((mes,i)=>{
    if(eD[i]===0&&sD[i]===0)return'';
    return`<div class="ri"><span style="font-size:14px;min-width:90px">${escHtml(mes)}</span><div class="ri-r"><span style="font-size:13px;color:var(--green);min-width:100px;text-align:right">${fmt(eD[i])}</span><span style="font-size:13px;color:var(--red);min-width:100px;text-align:right">${fmt(sD[i])}</span><span style="font-family:'DM Mono',monospace;font-size:13px;min-width:110px;text-align:right;color:${slD[i]>=0?'var(--green)':'var(--red)'}">${fmt(slD[i])}</span></div></div>`;
  }).join('')||'<div class="empty">Nenhum dado neste ano.</div>';
}

function del(col,id){if(!confirm('Remover este item?'))return;DB[col]=DB[col].filter(x=>x.id!==id);salvar();render();toast('🗑 Item removido');}

function editarItem(col,id){
  const item=DB[col].find(x=>x.id===id);if(!item)return;
  const map={despesas:'despesa',receitas:'receita',metas:'meta',assinaturas:'assinatura'};
  editId=id;abrirModal(map[col],item);
}

function abrirModal(mode,item=null){
  modalMode=mode;editId=item?item.id:null;
  const isEdit=!!item;
  const titles={despesa:isEdit?'Editar despesa':'Nova despesa',receita:isEdit?'Editar receita':'Nova receita',meta:isEdit?'Editar meta':'Nova meta',assinatura:isEdit?'Editar assinatura':'Nova assinatura'};
  document.getElementById('mo-title').textContent=titles[mode];
  document.getElementById('mo-save').textContent=isEdit?'Salvar alterações':'Salvar';
  document.getElementById('f-desc').value=item?.desc||'';
  document.getElementById('f-val').value=item?.valor||'';
  document.getElementById('f-obs').value=item?.obs||'';
  document.getElementById('f-data').value=item?.data||'';
  document.getElementById('f-alvo').value=item?.alvo||'';
  document.getElementById('f-atual').value=item?.atual||'';
  const catSel=document.getElementById('f-cat');
  let cats=mode==='receita'?CATS_R:CATS_D;
  if(mode==='assinatura')cats=[...new Set([...CATS_D,...CATS_R])];
  catSel.innerHTML=cats.map(c=>`<option value="${c}"${item?.cat===c?' selected':''}>${c}</option>`).join('');
  document.getElementById('f-tipo').value=item?.tipo||'variavel';
  document.getElementById('g-cat').style.display=mode!=='meta'?'block':'none';
  document.getElementById('g-tipo').style.display=mode==='despesa'?'block':'none';
  document.getElementById('g-data').style.display=(mode==='despesa'||mode==='receita')?'block':'none';
  document.getElementById('g-obs').style.display=(mode==='despesa'||mode==='receita')?'block':'none';
  document.getElementById('g-val').style.display=mode!=='meta'?'block':'none';
  document.getElementById('g-alvo').style.display=mode==='meta'?'block':'none';
  document.getElementById('g-atual').style.display=mode==='meta'?'block':'none';
  document.getElementById('mo').classList.add('open');
  setTimeout(()=>document.getElementById('f-desc').focus(),120);
}
function fecharModal(){document.getElementById('mo').classList.remove('open');editId=null;}
function salvarModal(){
  const desc=document.getElementById('f-desc').value.trim();
  if(!desc){toast('⚠ Informe a descrição');return;}
  const valor=parseFloat(document.getElementById('f-val').value)||0;
  const cat=document.getElementById('f-cat').value;
  const tipo=document.getElementById('f-tipo').value;
  const data=document.getElementById('f-data').value||'';
  const obs=document.getElementById('f-obs').value.trim();
  if(editId){
    if(modalMode==='meta'){const alvo=parseFloat(document.getElementById('f-alvo').value)||0;if(!alvo){toast('⚠ Informe o valor alvo');return;}const m=DB.metas.find(x=>x.id===editId);if(m){m.desc=desc;m.alvo=alvo;m.atual=parseFloat(document.getElementById('f-atual').value)||m.atual;}}
    else if(modalMode==='assinatura'){if(!valor){toast('⚠ Informe o valor');return;}const a=DB.assinaturas.find(x=>x.id===editId);if(a){a.desc=desc;a.valor=valor;a.cat=cat;}}
    else if(modalMode==='receita'){if(!valor){toast('⚠ Informe o valor');return;}const r=DB.receitas.find(x=>x.id===editId);if(r){r.desc=desc;r.valor=valor;r.cat=cat;r.data=data;r.obs=obs;}}
    else{if(!valor){toast('⚠ Informe o valor');return;}const d=DB.despesas.find(x=>x.id===editId);if(d){d.desc=desc;d.valor=valor;d.cat=cat;d.tipo=tipo;d.data=data;d.obs=obs;}}
    toast('✅ Alteração salva!');
  }else{
    if(modalMode==='meta'){const alvo=parseFloat(document.getElementById('f-alvo').value)||0;if(!alvo){toast('⚠ Informe o valor alvo');return;}DB.metas.push({id:nextId++,desc,alvo,atual:parseFloat(document.getElementById('f-atual').value)||0,historico:[]});}
    else if(modalMode==='assinatura'){if(!valor){toast('⚠ Informe o valor');return;}DB.assinaturas.push({id:nextId++,desc,valor,cat});}
    else if(modalMode==='receita'){if(!valor){toast('⚠ Informe o valor');return;}DB.receitas.push({id:nextId++,desc,valor,cat,mes:curMes,ano:curAno,data,obs});}
    else{if(!valor){toast('⚠ Informe o valor');return;}DB.despesas.push({id:nextId++,desc,valor,cat,tipo,mes:curMes,ano:curAno,data,obs});}
    toast('✅ Lançamento salvo!');
  }
  fecharModal();salvar();render();
}

function goTab(name,el){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(el)el.classList.add('active');
  const t={resumo:'Resumo do Mês',despesas:'Despesas',receitas:'Receitas',metas:'Metas Financeiras',assinaturas:'Assinaturas',planejamento:'Planejamento',anual:'Visão Anual'};
  document.getElementById('page-title').textContent=t[name]||name;
}

['mo','mo-plan','mo-dep','mo-senha'].forEach(id=>{document.getElementById(id).addEventListener('click',e=>{if(e.target===e.currentTarget)document.getElementById(id).classList.remove('open');});});
document.addEventListener('keydown',e=>{if(e.key==='Escape')['mo','mo-plan','mo-dep','mo-senha'].forEach(id=>document.getElementById(id).classList.remove('open'));});

setupSels();
setTimeout(()=>document.getElementById('lock-inp').focus(),300);

