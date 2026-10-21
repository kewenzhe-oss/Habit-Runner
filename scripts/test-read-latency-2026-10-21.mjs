import {PrismaClient} from '@prisma/client'
import {createRequire} from 'node:module'
import {writeFileSync} from 'node:fs'
const {encode}=createRequire(import.meta.url)('next-auth/jwt')
const url=new URL(process.env.DATABASE_URL)
if(!['localhost','127.0.0.1'].includes(url.hostname)||url.pathname!='/habit_runner_perf')throw Error('Isolated local DB required')
const db=new PrismaClient()
const user=await db.user.findUniqueOrThrow({where:{email:'demo@habitrunner.dev'}})
await db.$disconnect()
const token=await encode({secret:process.env.NEXTAUTH_SECRET,maxAge:3600,token:{id:user.id,name:user.name,email:user.email,picture:user.image}})
const results={date:new Date().toISOString(),kind:'read-only loopback HTTP warmed production; not browser INP',samples:7,rows:[]}
for(const path of ['/api/dashboard/today','/dashboard','/insights','/settings','/items/local_perf_water']){
 const samples=[]
 for(let i=0;i<9;i++){
  const start=performance.now();const res=await fetch('http://localhost:3000'+path,{redirect:'manual',headers:{Cookie:`next-auth.session-token=${token}`}})
  const ttfb=performance.now()-start;const body=await res.arrayBuffer()
  if(res.status!==200)throw Error(`${path}: ${res.status}`)
  if(i>=2)samples.push({totalMs:+(performance.now()-start).toFixed(1),ttfbMs:+ttfb.toFixed(1),bytes:body.byteLength,serverTiming:res.headers.get('server-timing')})
 }
 const sorted=samples.map(x=>x.totalMs).sort((a,b)=>a-b)
 results.rows.push({path,medianMs:sorted[3],maxMs:sorted[6],samples})
}
writeFileSync('docs/testing-read-latency-2026-10-21.json',JSON.stringify(results,null,2)+'\n')
console.log(results.rows.map(({path,medianMs,maxMs})=>({path,medianMs,maxMs})))
