import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const cell=value=>String(value??'未注明').replace(/[\r\n]+/g,' ').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\|/g,'&#124;');
const bundledUrl='https://github.com/duhu2000/dsh-mcp-connector/blob/main/catalog/catalog.json';
export function renderDirectory(cards,bundled=[]){
 const all=[...bundled,...cards.filter(c=>!bundled.some(b=>b.id===c.id))];
 const groups=all.reduce((m,c)=>m.set(c.category,[...(m.get(c.category)||[]),c]),new Map());
 let out='# 连接器分类目录\n\n汇总正式公共目录与插件内置卡片，按连接器 ID 去重；不包含候选草稿。来源在详情表中标明。探测状态不是全部业务能力验收，具体账号、权限与费用请查看服务商说明。\n\n';
 for(const [category,items] of groups){
 out+=`## ${cell(category)}\n\n共 ${items.length} 个连接器。\n\n| 数据源 / 连接器 | 用途 | 提供方 | 接入方式 | 来源 | 探测状态 |\n|---|---|---|---|---|---|\n`;
 for(const c of items){
 if(!/^[a-z0-9-]+$/.test(c.id))throw Error('Unsafe connector id');
 const local=bundled.some(b=>b.id===c.id);
 out+=`| [${cell(c.name)}](${local?bundledUrl:'../connectors/'+c.id+'.json'}) | ${cell(c.summary)} | ${cell(c.vendor)} | ${cell(c.auth?.mode)} | ${local?'插件内置':'公共目录'} | ${cell(c.probeStatus)} |\n`;
 }out+='\n';}return out;
}
export function renderOverview(cards,bundled){
 const order=['企业数据','金融投资','法律合规','调研分析','办公协作','开发工具','设计创意','效率工具','其他'];
 const base='https://github.com/duhu2000/dsh-mcp-connector-registry/blob/main/';
 const preferred=['wind-stock-data','pkulaw-legal','variflight-aviation-data','tushare','akshare','patsnap','openalex-research-catalog','pubmed-biomedical-literature','tencent-docs','feishu','notion','github','playwright'];
 const rows=order.map(category=>{
 const local=bundled.filter(c=>c.category===category);
 const remote=cards.filter(c=>c.category===category&&!bundled.some(b=>b.id===c.id));
 const examples=[...local,...remote.filter(c=>preferred.includes(c.id)).sort((a,b)=>preferred.indexOf(a.id)-preferred.indexOf(b.id)),...remote.filter(c=>!preferred.includes(c.id))].slice(0,3);
 const links=examples.map(c=>`[${cell(c.name)}](${local.includes(c)?'https://github.com/duhu2000/dsh-mcp-connector/blob/main/catalog/catalog.json':base+'connectors/'+c.id+'.json'})`).join('、');
 return `| [${category}](${base}docs/CONNECTOR-DIRECTORY.md#${encodeURIComponent(category)}) | ${remote.length+local.length} | ${links||'暂无条目'}${remote.length+local.length>examples.length?' 等':''} |`;
 });
 return '<!-- catalog-directory:start -->\n## 按分类寻找连接器\n\n覆盖全部 9 个分类，数量按连接器去重统计。点击分类查看完整列表；以下为部分连接器示例。\n\n| 分类 | 连接器数量 | 主要连接器 |\n|---|---:|---|\n'+rows.join('\n')+'\n\n[完整分类目录]('+base+'docs/CONNECTOR-DIRECTORY.md) · [近期新增]('+base+'docs/RECENT-ADDITIONS.md)\n<!-- catalog-directory:end -->';
}
export async function build(){
 const catalog=JSON.parse(await readFile('catalog.json','utf8'));const cards=catalog.connectors.filter(c=>c.published!==false);
 const entries=JSON.parse(await readFile('docs/catalog-additions.json','utf8'));
 const lines=[];for(const entry of entries){const c=cards.find(c=>c.id===entry.id);if(!c)throw Error('Addition not published: '+entry.id);if(!/^\d{4}-\d{2}-\d{2}$/.test(entry.publishedOn)||!Number.isInteger(entry.pr))throw Error('Invalid addition evidence');lines.push(`### ${entry.publishedOn} · ${cell(c.name)}\n\n${cell(c.summary)}。接入方式：${cell(c.auth?.mode)}；探测状态：${cell(c.probeStatus)}。\n\n${cell(entry.acceptance)}\n\n[上架 PR #${entry.pr}](https://github.com/duhu2000/dsh-mcp-connector-registry/pull/${entry.pr}) · [卡片详情](../connectors/${c.id}.json)\n`);}
 const bundled=JSON.parse(await readFile('docs/bundled-overview.json','utf8')).connectors;
 await mkdir('docs',{recursive:true});await writeFile('docs/CONNECTOR-DIRECTORY.md',renderDirectory(cards,bundled));
 await writeFile('docs/RECENT-ADDITIONS.md','# 近期新增数据源\n\n仅收录有合并证据的正式上架；不将修改日期当作上架日期。历史条目尚未全部回溯。\n\n'+lines.join('\n'));
 await writeFile('docs/ANNOUNCEMENT-DRAFT.md','# 新数据源宣传素材草稿（未发布）\n\n供运营审核选用；不得将部分验证宣传为全部业务可用。未自动发布到任何平台。\n\n'+lines.join('\n'));
 const block=renderOverview(cards,bundled);
 await writeFile('docs/CATEGORY-OVERVIEW.md',block+'\n');
 let readme=await readFile('README.md','utf8');
 readme=readme.replace(/<!-- catalog-directory:start -->[\s\S]*?<!-- catalog-directory:end -->\s*/, '');
 readme=readme.replace('## 公共目录',block+'\n\n## 公共目录');
 await writeFile('README.md',readme);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await build();
