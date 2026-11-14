import {test} from 'node:test';import assert from 'node:assert/strict';import {renderDirectory} from '../scripts/build-catalog-docs.mjs';
test('directory escapes table content and preserves partial status',()=>{const s=renderDirectory([{id:'sample',category:'测试',name:'A|B',summary:'<test>\ntext',auth:{mode:'api-key'},probeStatus:'partial'}]);assert.match(s,/A&#124;B/);assert.match(s,/&lt;test&gt; text/);assert.match(s,/partial/);assert.match(s,/共 1 个连接器/);});
test('unsafe source link rejected',()=>assert.throws(()=>renderDirectory([{id:'../x',category:'测试'}])));
import {renderOverview} from '../scripts/build-catalog-docs.mjs';
test('overview has nine categories including bundled enterprise cards without duplicate counts',()=>{
 const b=[{id:'qcc-company',name:'企查查',category:'企业数据'}];const s=renderOverview([...b,{id:'sample',name:'sample',category:'法律合规'}],b);
 assert.match(s,/企业数据\]\([^\n]+\) \| 1/);assert.match(s,/法律合规\]\([^\n]+\) \| 1/);
 assert.equal(s.split('\n').filter(l=>l.startsWith('| ')&&!l.startsWith('| 分类')).length,9);
});

test('overview truncates examples, links stable category anchors and directory includes bundled cards',()=>{
 const cards=Array.from({length:4},(_,i)=>({id:'sample-'+i,name:'Example'+i,category:'企业数据'}));
 const b=[cards[0]];const overview=renderOverview(cards,b);const directory=renderDirectory(cards,b);
 assert.match(overview,/\| 4 \|/);assert.match(overview,/ 等 \|/);assert.doesNotMatch(overview,/Example3/);
 assert.match(overview,/#%E4%BC%81%E4%B8%9A%E6%95%B0%E6%8D%AE/);
 assert.match(directory,/## 企业数据\n/);assert.match(directory,/共 4 个连接器/);
 assert.equal(directory.split('Example0').length-1,1);assert.match(directory,/插件内置/);assert.match(directory,/公共目录/);
 assert.doesNotMatch(renderOverview(cards.slice(0,2),b),/ 等 \|/);
});
