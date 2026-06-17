const fs2=require('fs');
const p='D:/lain_lain/Coding/project/MoonStrike/components/scrolling-tab-list.tsx';
const c=fs2.readFileSync(p,'utf8');
const d='maxWidth: 560,\n                   overflow:';
const r='overflow:';
const fixed=c.replace(d,r);
fs2.writeFileSync(p,fixed,'utf8');
console.log('done');