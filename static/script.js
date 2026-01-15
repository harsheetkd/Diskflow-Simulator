document.getElementById('run').addEventListener('click', runSim);
document.getElementById('play').addEventListener('click', ()=>{ if(!simData){ runSim().then(()=>{ animState.playing=true; requestAnimationFrame(animateHead); }); } else { animState.playing=true; lastTime=null; requestAnimationFrame(animateHead); } });
document.getElementById('pause').addEventListener('click', ()=>{ animState.playing=false; });
document.getElementById('reset').addEventListener('click', ()=>{ if(simData){ animState={playing:false, idx:0, t:0}; drawStatic(); } });
let simData = null
let animState = { playing: false, idx: 0, t: 0 }
let lastTime = null
let rafId = null
let chartState = { progressIdx: 0, progressT: 0 }

function cssVar(name){
  try{ const v = getComputedStyle(document.documentElement).getPropertyValue(name); return v ? v.trim() : name } catch(e){ return name }
}

function parseInputs(){
  const requestsRaw = document.getElementById('requests').value
  const requests = requestsRaw.split(',').map(s => parseInt(s.trim())).filter(x => !Number.isNaN(x))
  const head = parseInt(document.getElementById('head').value) || 0
  const disk_size = parseInt(document.getElementById('disk_size').value) || 199
  const algorithm = document.getElementById('algorithm').value
  return { requests, head, disk_size, algorithm }
}

async function runSim(){
  const { requests, head, disk_size, algorithm } = parseInputs()
  updateStatus('Computing...')
  try{
    const resp = await fetch('/simulate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requests, head, disk_size, algorithm }) })
    const data = await resp.json()
    if(!resp.ok) throw new Error(data.error || JSON.stringify(data))
    simData = data
    try{ window.__simData = simData; window.__animState = animState }catch(e){}
    console.log('simulate ->', simData)
    animState = { playing:false, idx:0, t:0 }
    lastTime = null
    buildLegend()
    updateStats()
    drawStatic()
  // fetch ML recommendation (non-blocking)
  fetchRecommendation()
    updateStatus('Ready — press Play to animate')
  }catch(e){
    updateStatus('Error: ' + e.message)
    console.error(e)
  }
}

function updateStatus(msg){
  document.getElementById('stat-alg').textContent = simData ? simData.algorithm : '—'
  document.getElementById('stat-dist').textContent = simData ? simData.total_distance : '—'
  document.getElementById('stat-steps').textContent = simData ? Math.max(0, simData.order.length-1) : '—'
  document.getElementById('stat-total-seek').textContent = simData && simData.total_seek !== undefined ? simData.total_seek : '—'
  document.getElementById('stat-avg-seek').textContent = simData && simData.avg_seek !== undefined ? Number(simData.avg_seek).toFixed(2) : '—'
  document.getElementById('stat-max-seek').textContent = simData && simData.max_seek !== undefined ? simData.max_seek : '—'
  document.getElementById('stat-total-req').textContent = simData && simData.total_requests !== undefined ? simData.total_requests : '—'
  document.getElementById('stat-error')?.remove()
}

async function fetchRecommendation(){
  try{
    const { requests, head, disk_size } = parseInputs()
    const resp = await fetch('/recommend', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ requests, head, disk_size }) })
    const data = await resp.json()
    const el = document.getElementById('ml-recommend')
    if(!resp.ok){ el.textContent = data.error || 'Model not available'; return }
    const ranking = data.ranking || []
    el.innerHTML = ''
    for(const [alg, prob] of ranking){
      const d = document.createElement('div')
      d.textContent = `${alg} — ${(prob*100).toFixed(1)}%`
      el.appendChild(d)
    }
  }catch(e){ console.warn('Recommendation error', e); document.getElementById('ml-recommend').textContent = 'Error fetching recommendation' }
}

function ensureCanvasSize(){
  const c = document.getElementById('track')
  const dpr = window.devicePixelRatio || 1
  const rect = c.getBoundingClientRect()
  const w = Math.max(300, Math.floor(rect.width))
  const h = Math.max(80, Math.floor(rect.height))
  if(c.width !== Math.floor(w * dpr) || c.height !== Math.floor(h * dpr)){
    c.width = Math.floor(w * dpr)
    c.height = Math.floor(h * dpr)
    c.style.width = w + 'px'
    c.style.height = h + 'px'
    const ctx = c.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0)
  }
}

function buildLegend(){
  const legend = document.getElementById('legend'); legend.innerHTML = ''
  const sw = (c)=>{ const el = document.createElement('span'); el.className='leg-swatch'; el.style.background = c; return el }
  const add = (label, color)=>{ const it = document.createElement('div'); it.className='leg-item'; it.appendChild(sw(color)); it.appendChild(document.createTextNode(label)); legend.appendChild(it) }
  const a1 = cssVar('--accent1')
  const a2 = cssVar('--accent2')
  const a3 = cssVar('--accent3')
  add('Disk head', `linear-gradient(90deg, ${a2}, ${a1})`)
  add('Requests', a3)
  add('Serviced order', a2)
}

function updateStats(){
  if(!simData) return
  document.getElementById('stat-alg').textContent = simData.algorithm
  document.getElementById('stat-dist').textContent = simData.total_distance
  document.getElementById('stat-steps').textContent = Math.max(0, simData.order.length-1)
  document.getElementById('stat-total-seek').textContent = simData.total_seek !== undefined ? simData.total_seek : '—'
  document.getElementById('stat-avg-seek').textContent = simData.avg_seek !== undefined ? Number(simData.avg_seek).toFixed(2) : '—'
  document.getElementById('stat-max-seek').textContent = simData.max_seek !== undefined ? simData.max_seek : '—'
  document.getElementById('stat-total-req').textContent = simData.total_requests !== undefined ? simData.total_requests : '—'
}

function drawStatic(){
  const canvas = document.getElementById('track')
  ensureCanvasSize()
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  const w = rect.width; const h = rect.height; ctx.clearRect(0,0,canvas.width,canvas.height)
  const pad = 40; const trackY = h/2; ctx.lineWidth=8; ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(pad, trackY); ctx.lineTo(w-pad, trackY); ctx.stroke()
  if(!simData) return
  const order = simData.order
  const minv = 0; const maxv = parseInt(document.getElementById('disk_size').value)||199
  const mapX = v => pad + ((v - minv)/(maxv - minv))*(w - pad*2)
  const reqs = simData.requests
  for(let i=0;i<reqs.length;i++){
    const x = mapX(reqs[i]); 
    ctx.beginPath(); 
    ctx.fillStyle=cssVar('--accent3'); 
    ctx.arc(x, trackY, 8, 0, Math.PI*2); 
    ctx.fill();
    // Display the number above the dot
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.font='12px Inter,Arial';
    ctx.textAlign='center';
    ctx.fillText(String(reqs[i]), x, trackY-15);
  }
  ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.font='12px Inter,Arial'; ctx.textAlign='center'; ctx.fillText('0', pad, trackY+30); ctx.fillText(String(maxv), w-pad, trackY+30)
}

function ensureChartSize(){
  const c = document.getElementById('chart')
  const dpr = window.devicePixelRatio || 1
  const rect = c.getBoundingClientRect()
  const w = Math.max(300, Math.floor(rect.width))
  const h = Math.max(100, Math.floor(rect.height))
  if(c.width !== Math.floor(w * dpr) || c.height !== Math.floor(h * dpr)){
    c.width = Math.floor(w * dpr)
    c.height = Math.floor(h * dpr)
    c.style.width = w + 'px'
    c.style.height = h + 'px'
    const ctx = c.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0)
  }
}

function drawChart(progress){
  const c = document.getElementById('chart'); if(!c) return; ensureChartSize(); const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height)
  if(!simData) return
  const order = simData.order
  const steps = order.length
  const pad = 36; const rect = c.getBoundingClientRect(); const w = rect.width; const h = rect.height
  const mapX = i => pad + (i/(Math.max(1,steps-1)))*(w - pad*2)
  const minv = 0; const maxv = parseInt(document.getElementById('disk_size').value)||199; const mapY = v => pad + ((maxv - v)/(maxv - minv))*(h - pad*2)
  ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, h-pad); ctx.lineTo(w-pad, h-pad); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(mapX(0), mapY(order[0])); for(let i=1;i<steps;i++) ctx.lineTo(mapX(i), mapY(order[i])); ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=2; ctx.stroke()
  const totalProgress = Math.max(0, Math.min(1, progress)); const lastIndexF = totalProgress * (steps-1); const lastIndex = Math.floor(lastIndexF); const subT = lastIndexF - lastIndex
  if(lastIndex >= 0){
    ctx.beginPath(); ctx.moveTo(mapX(0), mapY(order[0])); for(let i=1;i<=lastIndex;i++) ctx.lineTo(mapX(i), mapY(order[i]))
    if(lastIndex < steps-1){ ctx.lineTo(mapX(lastIndex) + (mapX(lastIndex+1)-mapX(lastIndex))*subT, mapY(order[lastIndex] + (order[lastIndex+1]-order[lastIndex])*subT)) }
    ctx.strokeStyle='rgba(6,182,212,0.95)'; ctx.lineWidth=3; ctx.stroke()
  }
  ctx.fillStyle=cssVar('--accent3'); for(let i=0;i<=lastIndex;i++){ ctx.beginPath(); ctx.arc(mapX(i), mapY(order[i]), 4, 0, Math.PI*2); ctx.fill() }
  if(lastIndex < steps-1){ const x = mapX(lastIndex) + (mapX(lastIndex+1)-mapX(lastIndex))*subT; const y = mapY(order[lastIndex] + (order[lastIndex+1]-order[lastIndex])*subT); ctx.beginPath(); ctx.fillStyle=cssVar('--accent2'); ctx.arc(x,y,6,0,Math.PI*2); ctx.fill() }
  ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='12px Inter, Arial'; ctx.textAlign='center'; ctx.fillText('Step', w/2, h-8); ctx.textAlign='left'; ctx.fillText('Cylinder', 8, 18)
}

function animateHead(ts){
  if(!simData){ rafId = requestAnimationFrame(animateHead); return }
  if(!lastTime) lastTime = ts; const dt = (ts - lastTime)/1000; lastTime = ts
  if(!animState.playing){ drawStatic(); rafId = requestAnimationFrame(animateHead); return }
  const speed = parseFloat(document.getElementById('speed').value) || 1
  const order = simData.order
  const steps = order.length - 1
  if(steps <= 0){ rafId = requestAnimationFrame(animateHead); return }
  animState.t += dt * speed
  const duration = 0.6
  if(animState.t >= duration){
    const stepAdvance = Math.floor(animState.t / duration)
    animState.idx = Math.min(animState.idx + stepAdvance, steps-1)
    animState.t = animState.t - stepAdvance*duration
  }
  const curIdx = animState.idx; const progress = Math.min(1, animState.t / duration)
  const from = order[curIdx]; const to = order[curIdx+1]
  const xPos = interpPos(from, to, progress)
  drawFrame(xPos, from, to, progress)
  const overallProgress = (animState.idx + progress) / Math.max(1, order.length-1)
  drawChart(overallProgress)
  if(animState.idx >= steps-1 && animState.t >= duration-0.0001){ animState.playing = false }
  rafId = requestAnimationFrame(animateHead)
}

function interpPos(a,b,p){
  const pad = 40
  const track = document.getElementById('track')
  const rect = track.getBoundingClientRect()
  const w = rect.width
  const minv = 0
  const maxv = parseInt(document.getElementById('disk_size').value) || 199
  const mapX = v => pad + ((v - minv) / (maxv - minv)) * (w - pad * 2)
  return mapX(a) + (mapX(b) - mapX(a)) * p
}

function drawFrame(xHead, from, to, progress){
  const c = document.getElementById('track')
  ensureCanvasSize()
  const ctx = c.getContext('2d')
  const rect = c.getBoundingClientRect()
  const w = rect.width; const h = rect.height
  drawStatic()
  const trackY = h/2
  ctx.strokeStyle='rgba(6,182,212,0.18)'; ctx.lineWidth=8; ctx.beginPath()
  const pad = 40; const minv = 0; const maxv = parseInt(document.getElementById('disk_size').value)||199
  const mapX = v => pad + ((v - minv)/(maxv - minv))*(w - pad*2)
  const ord = simData.order; const upto = animState.idx+1; ctx.moveTo(mapX(ord[0]), trackY)
  for(let i=1;i<=upto;i++){ ctx.lineTo(mapX(ord[i]), trackY) }
  if(upto < ord.length){ ctx.lineTo(xHead, trackY) }
  ctx.stroke()
  const grad = ctx.createLinearGradient(xHead-20,0,xHead+20,0); grad.addColorStop(0, cssVar('--accent2')); grad.addColorStop(1, cssVar('--accent1'))
  ctx.beginPath(); ctx.fillStyle=grad; ctx.arc(xHead, trackY, 12, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle='white'; ctx.font='11px Inter, Arial'; ctx.textAlign='center'; ctx.fillText(String(Math.round(from + (to-from)*progress)), xHead, trackY+4)
}

// Update visualization when requests change
document.getElementById('requests').addEventListener('input', () => {
  const requestsRaw = document.getElementById('requests').value;
  const requests = requestsRaw.split(',').map(s => parseInt(s.trim())).filter(x => !Number.isNaN(x));
  if (requests.length > 0) {
    simData = { ...simData, requests };
    drawStatic();
  }
});

document.getElementById('run').addEventListener('click', runSim)
document.getElementById('play').addEventListener('click', ()=>{ if(!simData){ runSim().then(()=>{ animState.playing=true; requestAnimationFrame(animateHead) }); } else { animState.playing=true; lastTime=null; requestAnimationFrame(animateHead) } })
document.getElementById('pause').addEventListener('click', ()=>{ animState.playing=false })
document.getElementById('reset').addEventListener('click', ()=>{ if(simData){ animState={playing:false, idx:0, t:0}; drawStatic() } })

window.addEventListener('load', ()=>{ drawStatic(); document.getElementById('stat-alg').textContent='—'; document.getElementById('stat-dist').textContent='—'; document.getElementById('stat-steps').textContent='—' })
window.addEventListener('resize', ()=>{ ensureCanvasSize(); drawStatic() })

window.addEventListener('load', ()=>{ ensureCanvasSize(); if(rafId === null){ rafId = requestAnimationFrame(animateHead) } runSim().catch(()=>{}) })
