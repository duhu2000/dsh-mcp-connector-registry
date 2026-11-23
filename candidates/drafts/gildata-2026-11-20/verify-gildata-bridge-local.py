#!/usr/bin/env python3
"""Local connection-only acceptance; never tools/call or credential persistence."""
import argparse, datetime, getpass, hashlib, json, os, selectors, shutil, subprocess, time
from pathlib import Path
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--plugin-dir', type=Path, required=True, help='Local dsh-mcp-connector checkout or unpacked package')
args = parser.parse_args()
NODE = shutil.which('node')
BRIDGE = args.plugin_dir.resolve() / 'scripts/gildata-bridge.mjs'
if not NODE or not BRIDGE.is_file():
    raise SystemExit('Node.js or the local bridge script is unavailable; no request sent.')
print('仅验证聚源安全适配：initialize 与 tools/list，不调用 FinQuery 或其他业务工具、不重试。')
print('Key 隐藏输入、不落盘，仅发送给 api.gildata.com；报告只包含状态和工具名。')
if not os.isatty(0):
    raise SystemExit('请在本机交互终端运行，禁止通过参数或管道传入 Key。')
key = getpass.getpass('粘贴聚源 Token/API Key（输入隐藏）：').strip()
if not key: raise SystemExit('已取消。')
env = os.environ.copy(); env['GILDATA_API_KEY'] = key
proc = subprocess.Popen([NODE, BRIDGE], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=env)
del env['GILDATA_API_KEY']; del key
selector = selectors.DefaultSelector(); selector.register(proc.stdout, selectors.EVENT_READ)
report={'status':'fail','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(), 'acceptanceTransport':'stdio-bridge','endpoint':'https://api.gildata.com/mcp-servers/aidata-assistant-srv-tool','businessCallAttempts':0,'automaticRetries':0}
buffer=b''
def send(value):
    proc.stdin.write((json.dumps(value)+'\n').encode()); proc.stdin.flush()
def receive(expected):
    global buffer
    end=time.monotonic()+190
    while time.monotonic()<end:
        if b'\n' in buffer:
            line,buffer=buffer.split(b'\n',1); data=json.loads(line)
            if data.get('id')!=expected: raise RuntimeError('Unexpected response id')
            if 'error' in data: raise RuntimeError('Bridge rejected request; no retry')
            return data['result']
        if not selector.select(max(0,end-time.monotonic())): break
        chunk=os.read(proc.stdout.fileno(),65536)
        if not chunk: raise RuntimeError('Bridge exited without a response')
        buffer+=chunk
        if len(buffer)>2_500_000: raise RuntimeError('Response too large')
    raise RuntimeError('Timed out; no retry')
try:
    send({'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2025-03-26','capabilities':{},'clientInfo':{'name':'gildata-local-acceptance','version':'1.0.0'}}})
    initial=receive(1)
    send({'jsonrpc':'2.0','method':'notifications/initialized'})
    send({'jsonrpc':'2.0','id':2,'method':'tools/list','params':{}})
    listed=receive(2)
    names=[t['name'] for t in listed.get('tools',[]) if isinstance(t,dict) and isinstance(t.get('name'),str)]
    expected={'IcEnterpriseDataQuery','SmartStockSelection','SmartFundSelection','SmartFundManagerSelection','FinQuery','MacroIndustryData','AnnouncementData','FinDataFallbackQuery','WebSearch'}
    report.update(status='pass' if 'FinQuery' in names else 'needs-review',toolCount=len(names),recognizedTools=sorted(expected.intersection(names)),unknownToolCount=len(set(names)-expected),hasMoreTools=bool(listed.get('nextCursor')))
    fin=next((t for t in listed.get('tools',[]) if t.get('name')=='FinQuery'),{})
    schema=fin.get('inputSchema',{})
    report['finQueryRequiredQueryString']=schema.get('properties',{}).get('query',{}).get('type')=='string' and 'query' in schema.get('required',[])
    if not report['finQueryRequiredQueryString']: report['status']='needs-review'
except Exception:
    report['reason']='Connection or tool discovery failed; no business request or retry. Check local credential, network and account access.'
finally:
    selector.close()
    try:
        proc.stdin.close(); proc.wait(timeout=5)
    except Exception:
        proc.kill(); proc.wait()
    proc.stdout.close()
report['bridgeSha256']=hashlib.sha256(Path(BRIDGE).read_bytes()).hexdigest()
report['coreSha256']=hashlib.sha256((Path(BRIDGE).parent.parent/'lib/query-auth-bridge.js').read_bytes()).hexdigest()
target=Path.home()/'.dsh/acceptance'/('gildata-bridge-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.json')
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2)); print('脱敏报告：',target)
