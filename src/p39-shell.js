import "./p39-home.js";
import "./p38-command-center.js";

const NAVIGATE_EVENT="kisiselaraclar:navigate-tool";
const OPEN_COMMAND_EVENT="kisiselaraclar:open-command";

function dispatchCommand(seed=""){globalThis.dispatchEvent(new CustomEvent(OPEN_COMMAND_EVENT,{detail:{query:seed}}))}

function navigateTool(id,action=""){
  const toolId=String(id||"").trim();
  if(!toolId)return;
  const state={tool:toolId,action:action||null};
  history.pushState(state,"",`#tool=${encodeURIComponent(toolId)}`);
  globalThis.dispatchEvent(new PopStateEvent("popstate",{state}));
  if(action)globalThis.dispatchEvent(new CustomEvent("kisiselaraclar:tool-action",{detail:{id:toolId,action}}));
}

globalThis.addEventListener(NAVIGATE_EVENT,event=>navigateTool(event.detail?.id,event.detail?.action));

document.documentElement.dataset.visualSystem="p39";
document.body.classList.add("p39-ui");

function syncHeader(){
  const brand=document.querySelector(".site-brand");
  if(brand){brand.innerHTML='<span class="brand-mark" aria-hidden="true">K</span><span><strong>Kişisel Araçlar</strong><small>private workspace</small></span>'}
  const search=document.querySelector("#headerSearchButton");
  if(search){search.innerHTML='<span class="p39-search-dot" aria-hidden="true"></span><span>Her şeyi ara</span><kbd>⌘K</kbd>';search.setAttribute("aria-label","Komut merkezini aç")}
}

function installMobileCommand(){
  const dock=document.querySelector("#mobileDock");
  if(!dock||dock.querySelector("[data-p39-mobile-command]"))return;
  const button=document.createElement("button");
  button.type="button";
  button.dataset.p39MobileCommand="true";
  button.className="p39-mobile-command";
  button.setAttribute("aria-label","Hızlı işlem aç");
  button.innerHTML='<span class="p39-mobile-command-icon">+</span><strong>Ekle</strong>';
  const task=dock.querySelector('[data-mobile-action="task"]');
  dock.insertBefore(button,task||dock.lastElementChild);
}

function enhanceToolView(){
  const view=document.querySelector("#toolView");
  if(!view||view.classList.contains("hidden"))return;
  view.querySelectorAll(".tool-panel").forEach(panel=>panel.classList.add("p39-tool-surface"));
  const back=view.querySelector(".back-button");
  if(back&&!back.dataset.p39){back.dataset.p39="true";back.textContent="← Çalışma alanına dön"}
}

function enhance(){syncHeader();installMobileCommand();enhanceToolView()}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(()=>requestAnimationFrame(enhance),0)}

globalThis.addEventListener("kisiselaraclar:ui-rendered",schedule);
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",schedule,{once:true}):schedule();

document.addEventListener("click",event=>{
  const command=event.target.closest("#headerSearchButton,[data-p39-mobile-command],.desktop-tool-search");
  if(command){event.preventDefault();event.stopImmediatePropagation();dispatchCommand();return}
  const logo=event.target.closest(".site-brand");
  if(logo){event.preventDefault();const today=document.querySelector('[data-mobile-action="today"]');today?.click()}
},true);

document.addEventListener("keydown",event=>{
  if(event.key==="/"&&!event.ctrlKey&&!event.metaKey&&!event.altKey){const target=event.target;const typing=target?.matches?.("input,textarea,select")||target?.isContentEditable;if(!typing){event.preventDefault();dispatchCommand()}}
},true);

function applyToolAction(event){
  const action=String(event.detail?.action||"");
  if(!action)return;
  let attempts=0;
  const run=()=>{
    const view=document.querySelector("#toolView");
    if(!view||view.classList.contains("hidden")){if(attempts++<18)setTimeout(run,60);return}
    if(action.startsWith("note:")){
      const id=action.slice(5);const note=[...view.querySelectorAll("[data-note]")].find(node=>node.dataset.note===id);if(note){note.click();requestAnimationFrame(()=>view.querySelector("#p16NoteText")?.focus({preventScroll:true}));return}
    }
    if(action==="new-note"){
      const input=view.querySelector("#p16NoteText");if(input){requestAnimationFrame(()=>input.focus({preventScroll:true}));return}
    }
    if(action==="new-task"){
      const input=view.querySelector("#p16TaskTitle");if(input){requestAnimationFrame(()=>input.focus({preventScroll:true}));return}
    }
    if(attempts++<18)setTimeout(run,60);
  };
  setTimeout(run,50);
}

globalThis.addEventListener("kisiselaraclar:tool-action",applyToolAction);
