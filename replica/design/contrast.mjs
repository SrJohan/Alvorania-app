import fs from 'node:fs';
const t = JSON.parse(fs.readFileSync(process.argv[2] ?? 'tokens.json', 'utf8'));
const lum = h => { const [r,g,b] = [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255).map(c => c<=.04045 ? c/12.92 : ((c+.055)/1.055)**2.4); return .2126*r+.7152*g+.0722*b; };
const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return (x+.05)/(y+.05); };
const need = {normal:4.5, large:3, ui:3};
let fails = 0;
for (const [f,b,s='normal'] of t.pairs) {
  const r = ratio(t.color[f], t.color[b]); const ok = r >= need[s]; if (!ok) fails++;
  console.log(`${ok?'PASS':'FAIL'} ${r.toFixed(2).padStart(5)}:1  ${f} on ${b} ${s==='normal'?'':s}`);
}
console.log(`\n${t.pairs.length} pairs, ${fails} failing AA`);
process.exit(fails ? 1 : 0);
