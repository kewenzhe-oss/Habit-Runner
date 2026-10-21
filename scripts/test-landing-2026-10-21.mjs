// node --experimental-websocket scripts/test-landing-2026-10-21.mjs --ready [--quick]
// Only run --ready after the coordinator confirms the NEW production build is READY.
// Anonymous, isolated CDP 9243. No env loading, credentials, DB access, build or service restart.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'

if (!process.argv.includes('--ready')) {
  console.error('Not run: wait for explicit NEW landing READY, then pass --ready.')
  process.exit(2)
}
const quick = process.argv.includes('--quick')
const base = 'http://127.0.0.1:3000'
const port = 9243
const outputDir = '/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/landing-20261021'
const reportPath = resolve('docs/testing-landing-2026-10-21.md')
const runId = new Date().toISOString().replace(/[:.]/g, '-')
const report = { startedAt: new Date().toISOString(), runId, base, port, quick, cases: [], errors: [], browserErrors: [], httpErrors: [], blockedWrites: [], blockedExternal: [] }
let chrome, ws, profile, currentCase = 'setup', nextId = 1
const pending = new Map()
const sleep = ms => new Promise(r => setTimeout(r, ms))
const expectedCount = quick ? 1 : 8
const errorText = e => String(e?.message || e)
async function until(fn, label, timeout = 20000) {
  const start = Date.now()
  while (Date.now() - start < timeout) { const value = await fn(); if (value) return value; await sleep(80) }
  throw new Error(`Timed out: ${label}`)
}
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 20000)
    pending.set(id, { resolve, reject, timer })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
  return result.result.value
}
async function frame() { await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))') }
async function screenshot(c, name, selector) {
  if (selector) await evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)}); const fixed=[...document.querySelectorAll('header,nav')].filter(e=>['fixed','sticky'].includes(getComputedStyle(e).position)&&e.getBoundingClientRect().top<=1);const inset=Math.max(0,...fixed.map(e=>e.getBoundingClientRect().bottom));scrollTo({top:e.getBoundingClientRect().top+scrollY-inset-12,behavior:'instant'});})()`)
  else await evaluate("scrollTo({top:0,behavior:'instant'})")
  await frame()
  const path = join(outputDir, `${runId}-${c.id}-${name}.png`)
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(path, Buffer.from(shot.data, 'base64'))
  c.screenshots.push({ name, path })
  return path
}
async function navigateHome() {
  await send('Page.navigate', { url: base + '/' })
  await until(() => evaluate("location.pathname==='/' && document.readyState==='complete' && !!document.querySelector('main #landing-title') && !!document.querySelector('#adaptive-rhythm-heading') && !!document.querySelector('#trace-title')"), 'NEW landing headings (old build cannot pass)')
  await evaluate('document.fonts.ready.then(()=>true)')
  await frame()
  await sleep(250)
}
// This function is serialized into the page; it has no Node dependencies.
function auditPage(expectedTheme) {
  const main = document.querySelector('main')
  const rect = e => { const r = e.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom } }
  const visible = e => { const s = getComputedStyle(e); return !!e.getClientRects().length && s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' && !e.closest('[hidden]') }
  const identify = e => `${e.tagName.toLowerCase()}${e.id ? '#'+e.id : ''}${e.getAttribute('class') ? '.'+e.getAttribute('class').trim().replace(/\s+/g,'.') : ''}`.slice(0,240)
  const emoji = /\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*]\uFE0F?\u20E3/u
  const emojis = []
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const n = walker.currentNode
    if (!n.parentElement.closest('script,style,template') && emoji.test(n.textContent)) emojis.push({ element: identify(n.parentElement), text: n.textContent.trim().slice(0,180) })
  }
  const blurs = [], pseudoEmojis = [], overflowing = [], textOverflow = []
  for (const e of [main, ...main.querySelectorAll('*')]) {
    if (['SCRIPT','STYLE','TEMPLATE'].includes(e.tagName)) continue
    for (const attr of ['aria-label','alt','title']) if (emoji.test(e.getAttribute(attr)||'')) emojis.push({ element: identify(e), attribute:attr, text:e.getAttribute(attr) })
    if (!visible(e)) continue
    const r = rect(e), style = getComputedStyle(e)
    if (r.width && (r.x < -1 || r.right > innerWidth+1)) overflowing.push({ element:identify(e), ...r })
    for (const pseudo of [null,'::before','::after']) {
      const s = pseudo ? getComputedStyle(e,pseudo) : style
      if (pseudo && (!s.content || s.content==='none' || s.content==='normal')) continue
      if (/blur\(/i.test(s.filter+' '+s.backdropFilter)) blurs.push({ element:identify(e), pseudo, filter:s.filter, backdropFilter:s.backdropFilter })
      if (pseudo && emoji.test(s.content)) pseudoEmojis.push({ element:identify(e), pseudo, content:s.content })
    }
    if (e.tagName.toLowerCase()==='fegaussianblur') blurs.push({element:identify(e),type:'SVG Gaussian blur'})
  }
  const textWalker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
  while (textWalker.nextNode()) {
    const n=textWalker.currentNode, e=n.parentElement
    if (!n.textContent.trim() || e.closest('script,style,template') || !visible(e)) continue
    const range=document.createRange(); range.selectNodeContents(n)
    for(const r of range.getClientRects()) if(r.width && (r.x < -1 || r.right > innerWidth+1)) textOverflow.push({element:identify(e),text:n.textContent.trim().slice(0,100),x:r.x,right:r.right})
  }
  const sampleCheck = (selector, label, disclaimer) => {
    const section = main.querySelector(selector)
    if (!section) return { pass:false, missing:selector }
    const text = section.innerText
    const labels = [...section.querySelectorAll('p,h2,h3,span,figcaption')].filter(e=>visible(e)&&label.test(e.innerText)&&e.innerText.length<180).map(e=>e.innerText.trim())
    const disclaimerPresent = !disclaimer || disclaimer.test(text)
    return { pass:labels.length>0&&disclaimerPresent, labels, disclaimerPresent, heading:section.querySelector('h2')?.innerText }
  }
  const width = document.documentElement.clientWidth
  const scrollWidth = Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)
  const h1s=[...document.querySelectorAll('h1')].map(e=>({text:e.innerText,id:e.id,visible:visible(e)}))
  const ctas=[...main.querySelectorAll('a')].filter(e=>visible(e)&&new URL(e.href).pathname==='/signin').map(e=>({text:e.innerText,href:e.href,pass:new URL(e.href).origin===location.origin&&new URL(e.href).searchParams.get('redirect')==='/dashboard'}))
  const actualTheme = document.documentElement.classList.contains('dark')?'dark':'light'
  const scripts=[...document.scripts].map(e=>e.textContent).join('\n')
  const runtimeBuildId = window.__NEXT_DATA__?.buildId || scripts.match(/\\"b\\":\\"([^"\\]+)\\"/)?.[1] || scripts.match(/"b":"([^"\\]+)"/)?.[1] || null
  return {
    theme:{pass:actualTheme===expectedTheme,actual:actualTheme,expected:expectedTheme},
    anonymous:{pass:!document.cookie.split(';').some(c=>/session-token/.test(c)),note:'Fresh browser profile, no auth cookie inserted; anonymous CTA independently required.'},
    heading:{pass:h1s.length===1&&h1s[0].id==='landing-title'&&h1s[0].visible,h1s},
    emoji:{pass:emojis.length===0&&pseudoEmojis.length===0,matches:emojis,pseudoMatches:pseudoEmojis},
    blur:{pass:blurs.length===0,matches:blurs},
    overflow:{pass:scrollWidth<=width+1&&overflowing.length===0&&textOverflow.length===0,width,scrollWidth,elements:overflowing,text:textOverflow},
    adaptive:sampleCheck('#adaptive-rhythm',/阅读计划示例/),
    history:sampleCheck('#trace-history',/四周记录示例/,/示意数据[，,、\s]*非用户统计/),
    heroSample:sampleCheck('section:has(#landing-title)',/界面示例/),
    ctaLinks:{pass:ctas.length>0&&ctas.every(e=>e.pass),links:ctas},
    runtimeBuildId,
  }
}
async function clickCta(index) {
  const point=await evaluate(`(() => { const links=[...document.querySelectorAll('main a')].filter(e=>e.getClientRects().length&&new URL(e.href).pathname==='/signin'); const e=links[${index}]; if(!e)throw Error('CTA missing');e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`)
  await frame()
  const unobstructed=await evaluate(`(() => {const e=document.elementFromPoint(${point.x},${point.y});return !!e?.closest('main a[href^="/signin"]')})()`)
  if(!unobstructed)throw Error('CTA click point obstructed')
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point})
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point})
  await until(()=>evaluate("location.pathname==='/signin' && new URL(location.href).searchParams.get('redirect')==='/dashboard' && document.readyState==='complete' && !!document.querySelector('main h1')"),'CTA opens signin')
  await frame()
  return evaluate("({pass:location.origin==='http://127.0.0.1:3000'&&location.pathname==='/signin'&&new URL(location.href).searchParams.get('redirect')==='/dashboard'&&/Sign In to Habit Runner/.test(document.querySelector('main h1')?.innerText||''),url:location.href,title:document.querySelector('main h1')?.innerText,authButtons:[...document.querySelectorAll('main button')].map(e=>e.innerText),authAlert:document.querySelector('main [role=alert]')?.innerText||null})")
}
async function runCase(width, theme) {
  currentCase=`${width}-zh-${theme}`
  const c={id:currentCase,width,theme,checks:{},screenshots:[]}; report.cases.push(c)
  const startErrors=report.browserErrors.length, startHttp=report.httpErrors.length, startWrites=report.blockedWrites.length
  const script=await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('theme',${JSON.stringify(theme)});localStorage.setItem('habit_runner_locale','zh');`})
  try {
    await send('Network.clearBrowserCookies')
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768})
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme},{name:'prefers-reduced-motion',value:'reduce'}]})
    await navigateHome()
    const {runtimeBuildId,...checks}=await evaluate(`(${auditPage.toString()})(${JSON.stringify(theme)})`)
    c.checks=checks
    c.checks.build={pass:runtimeBuildId===report.expectedBuildId,expected:report.expectedBuildId,actual:runtimeBuildId}
    for (const [name,selector] of [['first-screen',null],['adaptive','#adaptive-rhythm'],['history','#trace-history']]) {
      const path=await screenshot(c,name,selector)
      console.log(JSON.stringify({case:c.id,screenshot:name,path}))
    }
    c.checks.ctaNavigation={pass:false,results:[]}
    for(let i=0;i<c.checks.ctaLinks.links.length;i++) {
      if(i)await navigateHome()
      c.checks.ctaNavigation.results.push(await clickCta(i))
    }
    c.checks.ctaNavigation.pass=c.checks.ctaNavigation.results.length>0&&c.checks.ctaNavigation.results.every(r=>r.pass)
    c.checks.diagnostics={pass:report.browserErrors.length===startErrors&&report.httpErrors.length===startHttp&&report.blockedWrites.length===startWrites,browserErrors:report.browserErrors.length-startErrors,httpErrors:report.httpErrors.length-startHttp,blockedWrites:report.blockedWrites.length-startWrites}
    c.pass=Object.values(c.checks).every(check=>check.pass)
  } catch(e) { c.error=errorText(e);c.pass=false;try{await screenshot(c,'error')}catch{} }
  finally {await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier})}
  console.log(JSON.stringify({case:c.id,pass:c.pass,failed:Object.entries(c.checks).filter(([,v])=>!v.pass).map(([k])=>k),error:c.error}))
}
function saveReport() {
  report.finishedAt=new Date().toISOString()
  report.passed=report.cases.filter(c=>c.pass).length
  report.complete=!quick&&report.cases.length===8&&report.passed===8&&!report.errors.length&&report.buildUnchanged
  const mark=c=>c===undefined?'未测':c?'通过':'失败'
  const lines=['# Landing 匿名浏览器验收 · 2026-10-21','',`状态：${quick?'375px 先行检查；尚未完成八组验收':report.complete?'八组自动检查通过；截图需结合人工审阅':'存在失败或未完成，不能宣称全部通过'}。`,'',`执行：${report.startedAt} → ${report.finishedAt}。READY 由主代理明确通知后执行。`,`目标：${base}/；Chrome ${report.browserVersion||'未连接'}；独立 CDP ${port}；构建 ${report.expectedBuildId||'未读取'}；构建起止一致：${mark(report.buildUnchanged)}。`,'','范围：320 / 375 / 768 / 1280px × 浅/深色，视口高 900，DPR 1；小于768使用mobile模拟，中文公开落地页。每组首屏、adaptive、history原始浏览器截图；真实指针点击main内全部登录CTA，验证登录页标题及redirect=/dashboard；不提交登录。登录UI使用OAuth按钮，不以form元素作为成功条件。','', '隔离：新Chrome临时profile，无登录cookie、无鉴权token、无.env和数据库连接。拦截所有非GET/HEAD/OPTIONS请求与站外HTTP请求。未改产品、未build、未启停应用或数据库。仅关闭本脚本启动的浏览器。','', '自动检查：main文本/可访问名称/伪元素无emoji，已渲染元素/伪元素无CSS blur与SVG Gaussian blur；页面及main元素/文字Range无横向越界；整页h1唯一且id=landing-title；浅深色实际生效；hero“界面示例”、adaptive“阅读计划示例”、history“四周记录示例”及“示意数据，非用户统计”。','',`自动结果：${report.passed}/${report.cases.length}，目标${expectedCount}；截图${report.cases.reduce((n,c)=>n+c.screenshots.length,0)}张。`,'','|组合|Emoji|Blur|横向溢出|唯一h1|Adaptive示例|History示例/非用户统计|CTA实跳|主题|构建|结果|','|---|---|---|---|---|---|---|---|---|---|---|']
  for(const c of report.cases) lines.push(`|${c.id}|${['emoji','blur','overflow','heading','adaptive','history','ctaNavigation','theme','build'].map(k=>mark(c.checks[k]?.pass)).join('|')}|${mark(c.pass)}|`)
  lines.push('','## 失败证据','')
  for(const c of report.cases.filter(c=>!c.pass)) lines.push(`- ${c.id}: ${c.error||Object.entries(c.checks).filter(([,v])=>!v.pass).map(([k])=>k).join(', ')}`)
  for(const e of report.errors)lines.push(`- 执行错误：${e}`)
  if(!report.errors.length&&report.cases.every(c=>c.pass))lines.push('当前执行范围未发现自动检查失败。')
  lines.push('','## 截图与人工视觉审查','','脚本只报告实际DOM与截图结果；人工视觉结论由审阅者补充，不能把自动通过等同于完整视觉验收。')
  for(const c of report.cases)lines.push(`- ${c.id}: ${c.screenshots.map(s=>`[${s.name}](${s.path})`).join(' · ')}`)
  lines.push('','## 方法限制','','本地生产构建、CDP模拟视口和主题，不是真机、线上测速或所有浏览器兼容性测试。只检查匿名公开landing；不测试登录提交或任何写入。示例标记验证是文案检查，不核验真实用户统计。blur检查针对当前已渲染样式；没有把未应用的CSS声明当作运行中装饰。','', '## 原始证据','','```json',JSON.stringify(report,null,2),'```','')
  writeFileSync(reportPath,lines.join('\n'))
}
try {
  if(typeof WebSocket==='undefined')throw Error('Use node --experimental-websocket')
  report.expectedBuildId=readFileSync(resolve('.next/BUILD_ID'),'utf8').trim()
  let occupied=false
  try {await fetch(`http://127.0.0.1:${port}/json/version`,{signal:AbortSignal.timeout(500)});occupied=true}catch{}
  if(occupied)throw Error('CDP 9243 occupied; will not reuse or close another browser')
  mkdirSync(outputDir,{recursive:true})
  profile=mkdtempSync(join(tmpdir(),'habit-landing-9243-'))
  chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--disable-extensions','--no-first-run',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'})
  chrome.on('error',e=>report.errors.push(errorText(e)))
  const targets=await until(async()=>{try{return await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()}catch{return false}},'independent Chrome CDP',10000)
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl)
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject})
  ws.onmessage=event=>{
    const data=JSON.parse(event.data)
    if(data.id&&pending.has(data.id)) {
      const p=pending.get(data.id);pending.delete(data.id);clearTimeout(p.timer)
      data.error?p.reject(Error(data.error.message)):p.resolve(data.result)
    }else if(data.method==='Fetch.requestPaused') {
      const {requestId,request}=data.params
      const readOnly=['GET','HEAD','OPTIONS'].includes(request.method)
      const external=/^https?:/.test(request.url)&&new URL(request.url).origin!==base
      if(!readOnly)report.blockedWrites.push({case:currentCase,method:request.method,url:request.url.split('?')[0]})
      if(external)report.blockedExternal.push({case:currentCase,url:request.url.split('?')[0]})
      send(readOnly&&!external?'Fetch.continueRequest':'Fetch.failRequest',readOnly&&!external?{requestId}:{requestId,errorReason:'BlockedByClient'}).catch(e=>report.errors.push(errorText(e)))
    }else if(data.method==='Runtime.exceptionThrown')report.browserErrors.push({case:currentCase,...data.params.exceptionDetails})
    else if(data.method==='Network.responseReceived'&&data.params.response.status>=400)report.httpErrors.push({case:currentCase,status:data.params.response.status,url:data.params.response.url.split('?')[0]})
  }
  for(const domain of ['Page','Runtime','Network'])await send(`${domain}.enable`)
  await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]})
  report.browserVersion=(await send('Browser.getVersion')).product
  const matrix=quick?[[375,'light']]:[320,375,768,1280].flatMap(w=>['light','dark'].map(t=>[w,t]))
  for(const [width,theme]of matrix)await runCase(width,theme)
  report.buildUnchanged=readFileSync(resolve('.next/BUILD_ID'),'utf8').trim()===report.expectedBuildId
}catch(e){report.errors.push(errorText(e));console.error(errorText(e))}
finally {
  if(ws){try{await send('Browser.close')}catch{};ws.close()}
  if(chrome)chrome.kill()
  if(profile){await sleep(200);try{rmSync(profile,{recursive:true,force:true})}catch{}}
  saveReport()
}
console.log(JSON.stringify({reportPath,passed:report.passed,total:report.cases.length,complete:report.complete,errors:report.errors}))
process.exitCode=report.errors.length||report.cases.length!==expectedCount||report.cases.some(c=>!c.pass)||!report.buildUnchanged?1:0
