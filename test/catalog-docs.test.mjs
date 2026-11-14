import {test} from 'node:test';import assert from 'node:assert/strict';import {renderDirectory} from '../scripts/build-catalog-docs.mjs';
test('directory escapes table content and preserves partial status',()=>{const s=renderDirectory([{id:'sample',category:'测试',name:'A|B',summary:'<test>\ntext',auth:{mode:'api-key'},probeStatus:'partial'}]);assert.match(s,/A&#124;B/);assert.match(s,/&lt;test&gt; text/);assert.match(s,/partial/);assert.match(s,/测试（1）/);});
test('unsafe source link rejected',()=>assert.throws(()=>renderDirectory([{id:'../x',category:'测试'}])));
