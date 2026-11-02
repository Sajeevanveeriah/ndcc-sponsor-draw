const REPO_EDIT_URL = "https://github.com/Sajeevanveeriah/ndcc-sponsor-draw/edit/main/data/winners.json";
const PENDING_KEY = "ndcc-draw-pending";
const COLOURS = ["#7a1020","#15213a","#9d1a2c","#1e2c4a","#5c0c18","#24365c"];

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cv = $("wheel"), ctx = cv.getContext("2d");

let entries = [], saved = [], pending = [];
let angle = 0, spinning = false, pick = null;

function loadPending(){
  try { pending = JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch { pending = []; }
  // Drop anything that has since been committed to winners.json.
  pending = pending.filter(p => !saved.some(s => s.round === p.round && s.sponsor === p.sponsor));
  storePending();
}
function storePending(){
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(pending)); } catch {}
}

const winners = () => [...saved, ...pending].sort((a,b) => a.round - b.round);
const wonSponsors = () => new Set(winners().map(w => w.sponsor));
const pool = () => {
  const won = wonSponsors(), skip = $("skipWon").checked;
  return entries.filter(e => e.on && !(skip && won.has(e.sponsor)));
};

function drawWheel(){
  const p = pool(), n = p.length, r = cv.width/2, seg = 2*Math.PI/Math.max(n,1);
  ctx.clearRect(0,0,cv.width,cv.height);
  ctx.save(); ctx.translate(r,r); ctx.rotate(angle);
  p.forEach((e,i) => {
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r-10,i*seg,(i+1)*seg); ctx.closePath();
    ctx.fillStyle = COLOURS[i % COLOURS.length]; ctx.fill();
    ctx.strokeStyle = "#ffffff30"; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.rotate((i+.5)*seg); ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff"; ctx.font = `600 ${n > 30 ? 19 : n > 16 ? 24 : 30}px Inter, sans-serif`;
    let t = e.sponsor; if (t.length > 24) t = t.slice(0,23) + "…";
    ctx.fillText(t, r-34, 0); ctx.restore();
  });
  ctx.restore();
  ctx.beginPath(); ctx.arc(r,r,r-6,0,2*Math.PI); ctx.lineWidth = 12; ctx.strokeStyle = "#f2c14e"; ctx.stroke();
}

function renderEntries(){
  const won = wonSponsors(), skip = $("skipWon").checked;
  $("entries").innerHTML = entries.map(e => {
    const w = won.has(e.sponsor), off = !e.on || (skip && w);
    return `<label class="entry${off?" off":""}${w?" won":""}"><input type="checkbox" data-id="${e.id}" ${e.on?"checked":""} aria-label="Include ${esc(e.sponsor)} for ${esc(e.player)}"><img src="${esc(e.logo)}" alt=""><div><b>${esc(e.sponsor)}</b><span>for ${esc(e.player)}</span></div></label>`;
  }).join("");
  $("count").textContent = `${pool().length} of ${entries.length} in the wheel`;
  $("spin").disabled = spinning || !pool().length;
}

function renderHistory(){
  const fmt = d => d ? new Date(d + "T00:00").toLocaleDateString("en-AU", {day:"numeric", month:"short"}) : "-";
  $("hist").innerHTML = winners().map(w => `<tr class="${pending.includes(w) ? "unsaved" : ""}"><td>${w.round}</td><td>${fmt(w.date)}</td><td>${esc(w.sponsor)}</td><td>${esc(w.player || "-")}</td></tr>`).join("");
  const next = Math.max(0, ...winners().map(w => w.round)) + 1;
  $("wk").innerHTML = Array.from({length: Math.max(20, next)}, (_,i) => `<option ${i+1 === next ? "selected" : ""}>${i+1}</option>`).join("");
  $("pending").hidden = !pending.length;
  $("pendingText").textContent = pending.length === 1
    ? `${pending[0].sponsor} (round ${pending[0].round}) is only saved on this device.`
    : `${pending.length} winners are only saved on this device.`;
}

function refresh(){ renderEntries(); drawWheel(); renderHistory(); }

$("entries").addEventListener("change", ev => {
  const id = ev.target.dataset.id; if (id === undefined) return;
  entries[id].on = ev.target.checked; renderEntries(); drawWheel();
});
$("skipWon").addEventListener("change", () => { renderEntries(); drawWheel(); });

$("spin").onclick = () => {
  const p = pool(); if (spinning || !p.length) return;
  spinning = true; $("spin").disabled = true;
  const idx = crypto.getRandomValues(new Uint32Array(1))[0] % p.length;
  const seg = 2*Math.PI/p.length;
  const target = -(idx+.5)*seg + (Math.random()-.5)*seg*.7;
  const start = angle, turns = 6*2*Math.PI;
  const end = start + turns + ((target - start) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
  const dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 600 : 5200, t0 = performance.now();
  (function step(t){
    const k = Math.min((t-t0)/dur, 1), ease = 1 - Math.pow(1-k, 4);
    angle = start + (end-start)*ease; drawWheel();
    if (k < 1) return requestAnimationFrame(step);
    angle %= 2*Math.PI; spinning = false; $("spin").disabled = false; pick = p[idx]; showWinner();
  })(t0);
};

function showWinner(){
  $("wLogo").src = pick.logo; $("wLogo").alt = `${pick.sponsor} logo`;
  $("wName").textContent = pick.sponsor;
  $("wFor").textContent = `Round ${$("wk").value} · sponsor of ${pick.player}`;
  $("modal").classList.add("show"); $("confirm").focus();
}
const closeModal = () => { $("modal").classList.remove("show"); $("spin").focus(); };
$("redraw").onclick = () => { closeModal(); $("spin").click(); };
$("confirm").onclick = () => {
  if (!pick) return;
  pending.push({round: +$("wk").value, date: $("dt").value, sponsor: pick.sponsor, player: pick.player});
  pick = null; storePending(); closeModal(); refresh();
};
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && $("modal").classList.contains("show")) closeModal(); });

$("saveGit").onclick = async () => {
  const json = JSON.stringify(winners().map(({round,date,sponsor,player}) => ({round,date,sponsor,player})), null, 2) + "\n";
  try { await navigator.clipboard.writeText(json); }
  catch { prompt("Copy this, then paste it into winners.json on GitHub:", json); }
  window.open(REPO_EDIT_URL, "_blank", "noopener");
};
$("discard").onclick = () => {
  if (!confirm("Discard winners that are not saved to GitHub?")) return;
  pending = []; storePending(); refresh();
};

async function init(){
  const bust = `?v=${Date.now()}`;
  const [s, w] = await Promise.all([
    fetch("data/sponsors.json" + bust).then(r => r.json()),
    fetch("data/winners.json" + bust).then(r => r.json())
  ]);
  entries = s.map((e,i) => ({...e, id:i, on:true}));
  saved = w;
  loadPending();
  const d = new Date();
  $("dt").value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  refresh();
}
init().catch(() => { $("count").textContent = "Could not load sponsor list"; });
