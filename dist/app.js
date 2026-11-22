const sampleApplications = [
  {id:1,name:"Anna Weber",email:"anna.weber@beispiel.de",people:1,moveIn:"2027-01-01",income:"3.500–4.499 €",pets:"Keine",message:"Ich arbeite unbefristet als Physiotherapeutin in Neukölln und suche langfristig eine ruhige Wohnung.",created:"2026-11-11T10:24:00",status:"new",complete:true},
  {id:2,name:"Jonas & Lea",email:"jonas.lea@beispiel.de",people:2,moveIn:"2027-01-01",income:"4.500–5.499 €",pets:"Katze",message:"Wir wohnen bereits im Kiez und möchten uns gern vergrößern. Unsere Wohnungskatze ist sieben Jahre alt.",created:"2026-11-11T09:12:00",status:"shortlist",complete:true},
  {id:3,name:"Mehmet Kaya",email:"mehmet.kaya@beispiel.de",people:2,moveIn:"2027-02-01",income:"",pets:"Keine",message:"Meine Tochter und ich suchen eine Wohnung in der Nähe ihrer Schule. Besichtigung flexibel möglich.",created:"2026-11-10T18:43:00",status:"new",complete:false},
  {id:4,name:"Sophie Brandt",email:"sophie.brandt@beispiel.de",people:1,moveIn:"2027-01-15",income:"3.500–4.499 €",pets:"Hund",message:"Ich ziehe beruflich nach Berlin. Mein kleiner, ruhiger Hund würde mit einziehen.",created:"2026-11-10T15:07:00",status:"reviewed",complete:true},
  {id:5,name:"Lukas Neumann",email:"lukas.n@beispiel.de",people:3,moveIn:"2027-01-01",income:"ab 5.500 €",pets:"Keine",message:"Wir sind eine dreiköpfige Familie und interessieren uns sehr für die Wohnung.",created:"2026-11-10T12:31:00",status:"new",complete:true},
  {id:6,name:"Mara Hoffmann",email:"mara.h@beispiel.de",people:1,moveIn:"2027-03-01",income:"2.500–3.499 €",pets:"Keine",message:"Ein früherer Einzug wäre eventuell möglich, müsste ich aber noch abstimmen.",created:"2026-11-09T17:20:00",status:"reviewed",complete:true}
];

const stored = localStorage.getItem("mietsort-applications");
let applications = stored ? JSON.parse(stored) : sampleApplications;
let currentFilter = "all";
let currentSelected = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const initials = name => name.split(/\s|&/).filter(Boolean).slice(0,2).map(n=>n[0]).join("").toUpperCase();
const dateLabel = iso => new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(iso));
const timeLabel = iso => {
  const d=new Date(iso), today=new Date("2026-11-11T12:00:00");
  if(d.toDateString()===today.toDateString()) return `Heute, ${d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"})}`;
  return d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"});
};
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

function save(){localStorage.setItem("mietsort-applications",JSON.stringify(applications));}
function toast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}

function criteriaFor(app){
  return [
    {label:app.moveIn==="2027-01-01"?"Einzug passt":"Einzug prüfen",type:app.moveIn==="2027-01-01"?"fit":"check"},
    {label:app.people<=2?"Haushaltsgröße passt":"Haushaltsgröße prüfen",type:app.people<=2?"fit":"check"},
    {label:app.income?"Einkommen angegeben":"Einkommen fehlt",type:app.income?"fit":"missing"},
    {label:app.pets==="Keine"?"Keine Haustiere":"Haustier prüfen",type:app.pets==="Keine"?"fit":"check"}
  ];
}

function renderStats(){
  const total=applications.length, complete=applications.filter(a=>a.complete).length;
  $("#statTotal").textContent=total;$("#statNew").textContent=`${applications.filter(a=>a.status==="new").length} neu`;
  $("#statShortlist").textContent=applications.filter(a=>a.status==="shortlist").length;
  $("#statComplete").textContent=complete;$("#completeRate").textContent=`${total?Math.round(complete/total*100):0} % aller Anfragen`;
  $("#statOpen").textContent=applications.filter(a=>a.status==="new").length;
  $("#navCount").textContent=total;$("#allCount").textContent=total;
  $("#recentApplications").innerHTML=applications.slice().sort((a,b)=>new Date(b.created)-new Date(a.created)).slice(0,5).map(a=>`
    <div class="recent-item"><span class="initials">${initials(a.name)}</span><div><h3>${escapeHtml(a.name)} ${a.status==="new"?'<span class="status-dot new"></span>':''}</h3><p>${a.people} Pers. · Einzug ${dateLabel(a.moveIn)} · ${a.complete?"Angaben vollständig":"Angaben fehlen"}</p></div><time>${timeLabel(a.created)}</time></div>`).join("");
}

function filteredApplications(){
  const q=$("#searchInput")?.value.toLowerCase()||"";
  let list=applications.filter(a=>(a.name+" "+a.message).toLowerCase().includes(q));
  if(currentFilter==="new")list=list.filter(a=>a.status==="new");
  if(currentFilter==="shortlist")list=list.filter(a=>a.status==="shortlist");
  if(currentFilter==="incomplete")list=list.filter(a=>!a.complete);
  const sort=$("#sortSelect")?.value||"newest";
  if(sort==="newest")list.sort((a,b)=>new Date(b.created)-new Date(a.created));
  if(sort==="complete")list.sort((a,b)=>Number(b.complete)-Number(a.complete));
  if(sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name,"de"));
  return list;
}

function renderApplications(){
  const list=filteredApplications();
  $("#resultCount").textContent=`${list.length} ${list.length===1?"Bewerbung":"Bewerbungen"}`;
  $("#applicationList").innerHTML=list.length?list.map(a=>`
    <article class="application-card ${currentSelected===a.id?"selected":""}" data-id="${a.id}">
      <span class="applicant-avatar">${initials(a.name)}</span>
      <div><div class="card-title"><h3>${escapeHtml(a.name)}</h3>${a.status==="new"?'<span class="badge new">Neu</span>':a.status==="shortlist"?'<span class="badge shortlist">Vorgemerkt</span>':''}</div>
      <div class="card-meta"><span>${a.people} ${a.people===1?"Person":"Personen"}</span><span>Einzug ${dateLabel(a.moveIn)}</span><span>${escapeHtml(a.income||"Einkommen offen")}</span></div>
      <div class="criteria-row">${criteriaFor(a).map(c=>`<span class="criterion ${c.type}">${escapeHtml(c.label)}</span>`).join("")}</div></div>
      <div class="card-side"><time>${timeLabel(a.created)}</time><button class="star ${a.status==="shortlist"?"active":""}" data-star="${a.id}" aria-label="Vormerken">★</button></div>
    </article>`).join(""):'<div class="empty-detail panel"><h3>Keine Treffer</h3><p>Ändere den Filter oder den Suchbegriff.</p></div>';
  $$(".application-card").forEach(card=>card.addEventListener("click",e=>{if(e.target.closest("[data-star]"))return;selectApplication(Number(card.dataset.id))}));
  $$('[data-star]').forEach(btn=>btn.addEventListener("click",()=>toggleShortlist(Number(btn.dataset.star))));
}

function selectApplication(id){currentSelected=id;const a=applications.find(x=>x.id===id);if(!a)return;
  $("#detailPanel").innerHTML=`<div class="detail-content">
    <div class="detail-head"><span class="applicant-avatar">${initials(a.name)}</span><div><h2>${escapeHtml(a.name)}</h2><p>Eingegangen ${timeLabel(a.created)}</p></div><button class="detail-close" aria-label="Schließen">×</button></div>
    <section class="detail-section"><h3>Angaben</h3><div class="detail-facts"><span>Personen<b>${a.people}</b></span><span>Einzug<b>${dateLabel(a.moveIn)}</b></span><span>Einkommen<b>${escapeHtml(a.income||"Nicht angegeben")}</b></span><span>Haustiere<b>${escapeHtml(a.pets)}</b></span></div></section>
    <section class="detail-section"><h3>Nachricht</h3><div class="message-box">${escapeHtml(a.message)||"Keine Nachricht angegeben."}</div></section>
    <section class="detail-section"><h3>Nachvollziehbare Hinweise</h3><div class="hint-list">${criteriaFor(a).map(c=>`<div class="hint ${c.type}"><span>${c.type==="fit"?"✓":c.type==="check"?"!":"–"}</span>${escapeHtml(c.label)}</div>`).join("")}</div></section>
    <div class="detail-actions"><button class="button ${a.status==="shortlist"?"primary":"ghost"}" id="shortlistBtn">★ ${a.status==="shortlist"?"Vorgemerkt":"Vormerken"}</button><button class="button ghost" id="reviewBtn">Als geprüft markieren</button><button class="button dark full-row" id="mailBtn">Antwort vorbereiten</button></div>
  </div>`;
  $(".detail-close").onclick=()=>{currentSelected=null;$("#detailPanel").innerHTML='<div class="empty-detail"><span>☷</span><h3>Bewerbung auswählen</h3><p>Klicke links auf einen Eintrag, um Angaben und Hinweise zu prüfen.</p></div>';renderApplications()};
  $("#shortlistBtn").onclick=()=>toggleShortlist(id);
  $("#reviewBtn").onclick=()=>{a.status="reviewed";save();renderAll();selectApplication(id);toast("Als geprüft markiert")};
  $("#mailBtn").onclick=()=>toast("Antwortvorlagen kommen im nächsten Schritt");
  renderApplications();
}

function toggleShortlist(id){const a=applications.find(x=>x.id===id);a.status=a.status==="shortlist"?"reviewed":"shortlist";save();renderAll();if(currentSelected===id)selectApplication(id);toast(a.status==="shortlist"?"Bewerbung vorgemerkt":"Vormerkung entfernt")}
function renderAll(){renderStats();renderApplications()}

function switchView(name){
  $$(".view").forEach(v=>v.classList.remove("active"));$(`#${name}View`).classList.add("active");
  $$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===name));
  $(".sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});
  if(name==="applications")renderApplications();
}

$$('[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));
$$('[data-go]').forEach(b=>b.onclick=()=>switchView(b.dataset.go));
$(".mobile-menu").onclick=()=>$(".sidebar").classList.toggle("open");
$("#searchInput").addEventListener("input",renderApplications);$("#sortSelect").addEventListener("change",renderApplications);
$$('[data-filter]').forEach(b=>b.onclick=()=>{currentFilter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.classList.toggle("active",x===b));renderApplications()});
$("#copyLinkBtn").onclick=async()=>{try{await navigator.clipboard.writeText(location.href.split("#")[0]+"#bewerben");toast("Bewerbungslink kopiert")}catch{toast("Link: "+location.href)}};
$("#applicationForm").addEventListener("submit",e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));applications.unshift({id:Date.now(),name:data.name,email:data.email,people:Number(data.people),moveIn:data.moveIn,income:data.income,pets:data.pets,message:data.message,created:new Date().toISOString(),status:"new",complete:Boolean(data.income)});save();e.target.reset();renderAll();switchView("applications");toast("Testbewerbung wurde hinzugefügt")});
if(location.hash==="#bewerben")switchView("form");
renderAll();
