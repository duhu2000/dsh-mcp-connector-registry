import {test} from 'node:test';import assert from 'node:assert/strict';import {renderDirectory} from '../scripts/build-catalog-docs.mjs';
test('directory escapes table content and preserves partial status',()=>{const s=renderDirectory([{id:'sample',category:'测试',name:'A|B',summary:'<test>\ntext',auth:{mode:'api-key'},probeStatus:'partial'}]);assert.match(s,/A&#124;B/);assert.match(s,/&lt;test&gt; text/);assert.match(s,/partial/);assert.match(s,/测试（1）/);});
test('unsafe source link rejected',()=>assert.throws(()=>renderDirectory([{id:'../x',category:'测试'}])));
import {renderOverview} from '../scripts/build-catalog-docs.mjs';
test('overview has nine categories including bundled enterprise cards without duplicate counts',()=>{
 const b=[{id:'qcc-company',name:'企查查',category:'企业数据'}];const s=renderOverview([...b,{id:'sample',name:'sample',category:'法律合规'}],b);
 assert.match(s,/企业数据 \| 公共 0＋内置 1/);assert.match(s,/法律合规 \| 公共 1＋内置 0/);
 assert.equal(s.split('\n').filter(l=>l.startsWith('| ')&&!l.startsWith('| 分类')).length,9);
});
