import json, os, uuid
from datetime import datetime, timezone
from typing import Any
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
API_KEY=os.getenv('SOVEREIGN_API_KEY')
if not API_KEY: raise RuntimeError('SOVEREIGN_API_KEY is required')
with open(os.path.join(os.path.dirname(__file__),'agent_card.json'),encoding='utf-8') as f: AGENT_CARD=json.load(f)
app=FastAPI(title='Sovereign WorkAI',version='1.0.0')
def auth(x_sovereign_api_key:str|None=Header(default=None)):
    if x_sovereign_api_key!=API_KEY: raise HTTPException(401,'Invalid or missing API key')
def text_of(message:dict[str,Any])->str:
    return '\n'.join(str(p.get('text','')) for p in message.get('parts',[]) if p.get('type')=='text' or 'text' in p)
@app.get('/healthz')
async def healthz(): return {'ok':True,'service':'workai','version':'1.0.0'}
@app.get('/.well-known/agent-card.json')
async def card(): return JSONResponse(AGENT_CARD,headers={'Cache-Control':'public,max-age=3600'})
@app.post('/a2a/v1')
async def a2a(request:Request,_=Depends(auth)):
    body=await request.json();rid=body.get('id');method=body.get('method')
    if method not in {'message/send','message/stream'}: return {'jsonrpc':'2.0','id':rid,'error':{'code':-32601,'message':'Method not found'}}
    message=body.get('params',{}).get('message',{});skill=message.get('metadata',{}).get('preferredSkill','general-companion');content=text_of(message);result=dispatch(skill,content)
    task={'id':str(uuid.uuid4()),'status':{'state':'COMPLETED','timestamp':datetime.now(timezone.utc).isoformat()},'artifacts':[{'artifactId':str(uuid.uuid4()),'parts':[{'type':'text','text':json.dumps(result,ensure_ascii=False) if not isinstance(result,str) else result}]}]}
    return {'jsonrpc':'2.0','id':rid,'result':task}
def dispatch(skill:str,content:str):
    if skill=='mu-build-advisor': return {'skill':skill,'recommendation':'Build-Daten empfangen. Ein produktiver Model-Provider wird hier serverseitig orchestriert.','input':content}
    if skill=='sensei-matcher': return {'skill':skill,'recommendations':[],'message':'Matcher bereit; keine Demo-Senseis hardcodiert.'}
    if skill=='fraud-analyzer': return {'skill':skill,'riskScore':0.0,'flags':[],'recommendation':'review-provider-required'}
    return {'skill':'general-companion','message':'WorkAI Gateway ist online.'}
