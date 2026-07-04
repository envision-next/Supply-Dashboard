#!/usr/bin/env python3
"""Aggregate data/data.json into data/stats.json (feeds the Word report).
Run from project root:  python src/build_stats.py
"""
import json
d = json.load(open('data/data.json')); C = d['cols']; N = d['n']; D = d['dict']
def blank(): return dict(p=0,u=0,land=0,carp=0,bu=0,comp=0,act=0,laps=0,cx=0,dsum=0,dcnt=0)
def add(o, i):
    o['p']+=1; o['u']+=C['un'][i]; o['land']+=C['la'][i]
    if C['ca'][i] is not None: o['carp']+=C['ca'][i]
    if C['bu'][i] is not None: o['bu']+=C['bu'][i]
    o['cx']+=C['cp'][i]
    if C['dy'][i] is not None: o['dsum']+=C['dy'][i]; o['dcnt']+=1
    cs=C['cs'][i]
    if cs==2: o['comp']+=1
    elif cs==1: o['laps']+=1
    else: o['act']+=1
ov=blank(); byyear={}; bytype={}; bydiv={}; bydist={}
for i in range(N):
    add(ov,i)
    y=C['yr'][i]; byyear[str(y)]=byyear.get(str(y),0)+1
    bytype[C['pt'][i]]=bytype.get(C['pt'][i],0)+1
    dv=C['dv'][i]; bydiv.setdefault(dv,blank()); add(bydiv[dv],i)
    di=C['di'][i]; bydist.setdefault(di,blank()); add(bydist[di],i)
rate=lambda o,k: round(100*o[k]/o['p'],1) if o['p'] else 0
def pack(name,o): return dict(name=name,p=o['p'],u=o['u'],land=o['land'],carp=o['carp'],bu=o['bu'],
    comp=o['comp'],laps=o['laps'],act=o['act'],cx=o['cx'],compR=rate(o,'comp'),lapsR=rate(o,'laps'),
    avgd=round(o['dsum']/o['dcnt']) if o['dcnt'] else 0)
divs=sorted([pack(D['div'][k],bydiv[k]) for k in bydiv if D['div'][k]!='(Unknown)'],key=lambda x:-x['p'])
dists=sorted([pack(D['dist'][k],bydist[k]) for k in bydist],key=lambda x:-x['p'])
types=sorted([dict(name=D['ptype'][k],c=bytype[k]) for k in bytype],key=lambda x:-x['c'])
allp=sorted([x['p'] for x in dists],reverse=True)
elig=[x for x in dists if x['p']>=300]
# Derive year metadata from the data (so any same-structure export "just works").
yrs=sorted(int(y) for y in byyear); minY,maxY=yrs[0],yrs[-1]
recentYears=[maxY-3,maxY-2,maxY-1]; priorYears=[maxY-6,maxY-5,maxY-4]  # last 3 full years vs prior 3 (maxY is partial/YTD)
lbl=lambda a,b: str(a)+"–"+str(b)[2:]  # e.g. 2023–25
out=dict(total=pack('Maharashtra',ov),unitsPer=round(ov['u']/ov['p'],1),carpPer=round(ov['carp']/ov['p']),
    years=byyear,types=types,divisions=divs,districts=dists,
    minYear=minY,maxYear=maxY,recentYears=recentYears,priorYears=priorYears,
    recentLabel=lbl(recentYears[0],recentYears[-1]),priorLabel=lbl(priorYears[0],priorYears[-1]),
    conc=dict(top3=round(100*sum(allp[:3])/N,1),top5=round(100*sum(allp[:5])/N,1),top10=round(100*sum(allp[:10])/N,1)),
    risk=sorted(elig,key=lambda x:-x['lapsR'])[:6],reliable=sorted(elig,key=lambda x:-x['compR'])[:6],
    recent=sum(byyear.get(str(y),0) for y in recentYears),prior=sum(byyear.get(str(y),0) for y in priorYears))
json.dump(out,open('data/stats.json','w'),indent=0)
print("wrote data/stats.json | projects:",ov['p'],"| divisions:",len(divs),"| districts:",len(dists))
