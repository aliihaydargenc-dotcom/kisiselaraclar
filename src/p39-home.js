const NOTES_KEY="kisiselaraclar:p16:notes";
const TASKS_KEY="kisiselaraclar:p16:tasks";
const CHANGE_EVENT="kisiselaraclar:local-change";
const UI_RENDER_EVENT="kisiselaraclar:ui-rendered";

function storage(){try{return localStorage}catch{return null}}
function parse(key){try{const value=JSON.parse(storage()?.getItem(key)||"[]");return Array.isArray(value)?value:[]}catch{return[]}}
function save(key,value){const target=storage();if(!target?.setItem)return false;try{target.setItem(key,JSON.stringify(value));globalThis.dispatchEvent(new CustomEvent(CHANGE_EVENT,{detail:{key}}));return true}catch{return false}}
function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function compact(value,max=72){const text=String(value??"").replace(/\s+/g," ").trim();return text.length>max?`${text.slice(0,max-1)}…`:text}
function localDate(){const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function makeId(prefix){return `${prefix}-${Date.now().toString(36)}-${globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)}`}
function dateLabel(){try{return new Intl.DateTimeFormat("tr-TR",{weekday:"long",day:"numeric",month:"long"}).format(new Date())}catch{return localDate()}}
function timeLabel(value){try{return value?new Intl.DateTimeFormat("tr-TR",{hour:"2-digit",minute:"2-digit"}).format(new Date(value)):""}catch{return""}}
function shortDate(value){try{return new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"short"}).format(new Date(`${value}T12:00:00`))}catch{return value}}

function summary(){
  const today=localDate();
  const notes=parse(NOTES_KEY).filter(Boolean).map(item=>({...item,id:String(item.id||makeId("note")),title:String(item.title||""),text:String(item.text||""),updatedAt:Number(item.updatedAt)||0})).sort((a,b)=>b.updatedAt-a.updatedAt);
  const tasks=parse(TASKS_KEY).filter(item=>item&&String(item.title||"").trim()).map(item=>({...item,id:String(item.id||makeId("task")),title:String(item.title||"").trim(),date:String(item.date||""),time:String(item.time||""),done:Boolean(item.done),updatedAt:Number(item.updatedAt)||0}));
  const open=tasks.filter(item=>!item.done);
  const todayAll=tasks.filter(item=>item.date===today).sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99"));
  const overdue=open.filter(item=>item.date&&item.date<today).sort((a,b)=>a.date.localeCompare(b.date));
  const focus=[...overdue.map(item=>({...item,state:"Gecikti"})),...todayAll.filter(item=>!item.done).map(item=>({...item,state:"Bugün"}))].slice(0,7);
  return{today,notes,tasks,todayAll,overdue,focus,doneToday:todayAll.filter(item=>item.done).length,openToday:todayAll.filter(item=>!item.done).length};
}

function taskRows(state){
  if(!state.focus.length)return`<button class="p39-empty-row" type="button" data-tool="tasks-calendar" data-tool-action="new-task"><span>Bugün için açık iş yok</span><b>Görev ekle</b></button>`;
  return state.focus.map(item=>`<label class="p39-task-row ${item.state==="Gecikti"?"is-overdue":""}"><input type="checkbox" data-p39-task="${esc(item.id)}"><span class="p39-task-check"></span><span class="p39-task-copy"><strong>${esc(item.title)}</strong><small>${item.state==="Gecikti"?`Gecikti · ${esc(shortDate(item.date))}${item.time?` · ${esc(item.time)}`:""}`:(item.time?esc(item.time):"Bugün")}</small></span></label>`).join("");
}

function noteRows(state){
  if(!state.notes.length)return`<button class="p39-empty-row" type="button" data-tool="quick-note" data-tool-action="new-note"><span>Henüz not yok</span><b>İlk notu yaz</b></button>`;
  return state.notes.slice(0,5).map(item=>`<button class="p39-note-row" type="button" data-tool="quick-note" data-tool-action="note:${esc(item.id)}"><span><strong>${esc(item.title||compact(item.text,42)||"Adsız not")}</strong><small>${esc(compact(item.text,78)||"Not")}</small></span><time>${esc(timeLabel(item.updatedAt))}</time></button>`).join("");
}

function markup(state){
  const total=state.todayAll.length;
  const progress=total?Math.round(state.doneToday/total*100):0;
  const headline=state.overdue.length?`${state.overdue.length} geciken iş var`:state.openToday?`${state.openToday} iş bugün seni bekliyor`:"Bugün temiz görünüyor";
  return`<div class="p39-home-shell">
    <section class="p39-hero" aria-labelledby="p17Title">
      <div class="p39-hero-copy"><span class="p39-kicker">${esc(dateLabel())}</span><h1 id="p17Title">Bugün.</h1><p>${esc(headline)}</p></div>
      <div class="p39-hero-meta"><span data-p30-connection><i></i><strong>Bağlantı kontrol ediliyor</strong></span><button type="button" data-p30-install hidden>Telefona yükle</button></div>
    </section>

    <button class="p39-command-launch" type="button" data-p39-command><span class="p39-command-icon">⌕</span><span><strong>Ne yapmak istiyorsun?</strong><small>Araç, not, görev veya hızlı komut</small></span><kbd>⌘ K</kbd></button>

    <div class="p39-quick-actions" aria-label="Hızlı işlemler">
      <button type="button" data-tool="quick-note" data-tool-action="new-note"><span>01</span><strong>Not yaz</strong><small>Fikri yakala</small></button>
      <button type="button" data-tool="tasks-calendar" data-tool-action="new-task"><span>02</span><strong>Görev ekle</strong><small>Bugüne planla</small></button>
      <button type="button" data-tool="voice-note"><span>03</span><strong>Sesle yaz</strong><small>Konuş, metne dönsün</small></button>
      <button type="button" data-tool="meeting-notes"><span>04</span><strong>Toplantı</strong><small>Kararları kaydet</small></button>
    </div>

    <div class="p39-work-grid">
      <section class="p39-section p39-focus-section">
        <header><div><span>Odak</span><h2>Bugünün akışı</h2></div><button type="button" data-tool="tasks-calendar">Tüm görevler</button></header>
        <div class="p39-progress"><div><span>${state.doneToday}/${total||0}</span><small>tamamlandı</small></div><i><b style="width:${progress}%"></b></i></div>
        <div class="p39-rows">${taskRows(state)}</div>
      </section>
      <section class="p39-section p39-notes-section">
        <header><div><span>Yakın zamanda</span><h2>Son notlar</h2></div><button type="button" data-tool="quick-note">Tüm notlar</button></header>
        <div class="p39-rows">${noteRows(state)}</div>
      </section>
    </div>

    <section class="p39-capture-strip">
      <form data-p39-quick-note><textarea rows="2" placeholder="Aklındaki şeyi buraya bırak…"></textarea><button>Kaydet</button></form>
    </section>
    <div class="p39-system-slot" data-p39-system-slot></div>
  </div>`;
}

function captureSystemNodes(root){return[...root.querySelectorAll(".p17-backup")].filter(node=>!node.closest("[data-p39-system-slot]"))}
function restoreSystemNodes(root,nodes){const slot=root.querySelector("[data-p39-system-slot]");if(!slot)return;nodes.forEach(node=>slot.append(node))}

function wire(root){
  root.querySelector("[data-p39-command]")?.addEventListener("click",()=>globalThis.dispatchEvent(new CustomEvent("kisiselaraclar:open-command")));
  root.querySelector("[data-p39-quick-note]")?.addEventListener("submit",event=>{event.preventDefault();const input=event.currentTarget.querySelector("textarea");const value=String(input?.value||"").trim();if(!value)return input?.focus();const notes=parse(NOTES_KEY);notes.unshift({id:makeId("note"),title:compact(value,46),text:value,kind:"written",pinned:false,completed:false,noteDate:localDate(),updatedAt:Date.now()});if(save(NOTES_KEY,notes)){input.value="";render(root)}});
  root.querySelectorAll("[data-p39-task]").forEach(input=>input.addEventListener("change",()=>{const key=String(input.dataset.p39Task||"");const tasks=parse(TASKS_KEY).map(item=>String(item?.id||"")===key?{...item,done:input.checked,updatedAt:Date.now()}:item);if(save(TASKS_KEY,tasks))render(root)}));
}

function render(root){if(!(root instanceof HTMLElement))return;const nodes=captureSystemNodes(root);root.dataset.p39Owner="true";root.className="p17-workspace p39-workspace";root.innerHTML=markup(summary());restoreSystemNodes(root,nodes);wire(root);document.documentElement.dataset.visualSystem="p39"}

function enhance(){document.querySelectorAll("#homeView #p17Workspace,#desktopHomeView #p17Workspace").forEach(root=>{if(root.dataset.p39Owner!=="true")render(root)})}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(()=>requestAnimationFrame(enhance),0)}
globalThis.addEventListener(UI_RENDER_EVENT,schedule);globalThis.addEventListener("kisiselaraclar:remote-change",schedule);globalThis.addEventListener(CHANGE_EVENT,schedule);document.readyState==="loading"?document.addEventListener("DOMContentLoaded",schedule,{once:true}):schedule();
