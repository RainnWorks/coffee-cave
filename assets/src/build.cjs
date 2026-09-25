// Deterministic SVG composition and PNG export. See README.md for dependencies.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const fontkit = require('fontkit');
const root = __dirname;
const out = path.resolve(root, '..');
const C = {bg:'#211410', ink:'#151513', card:'#2B1B14', copper:'#C08960', gold:'#E8B33C', cream:'#F7EDE6'};
const sans = fontkit.openSync(path.join(root,'fonts/InstrumentSans.ttf')).getVariation({wght:550, wdth:100});
const mono = fontkit.openSync(path.join(root,'fonts/IBMPlexMono-Regular.ttf'));
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
// Text is composed as SVG glyph paths for identical rendering without installed fonts.
// The original string and font are retained on every group, and in this editable source.
function text(s,x,y,size=40,font='sans',fill=C.cream,align='left') {
  const f=font==='mono'?mono:sans, run=f.layout(s), scale=size/f.unitsPerEm;
  const width=run.positions.reduce((n,p)=>n+p.xAdvance,0)*scale;
  if(align==='center')x-=width/2;
  if(align==='right')x-=width;
  let cursor=0;
  const paths=run.glyphs.map((g,i)=>{const p=run.positions[i]; const v=`<path transform="translate(${cursor+p.xOffset} ${p.yOffset})" d="${g.path.toSVG()}"/>`;cursor+=p.xAdvance;return v;}).join('');
  return `<g aria-label="${esc(s)}" data-font="${font==='mono'?'IBM Plex Mono':'Instrument Sans'}" fill="${fill}" transform="translate(${x} ${y}) scale(${scale} ${-scale})">${paths}</g>`;
}
const rect=(x,y,w,h,r,fill,stroke='none',sw=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const line=(d,color=C.copper,sw=5)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const arrow=(x1,x2,y,sw=6)=>line(`M${x1} ${y}H${x2} M${x2-14} ${y-14}L${x2} ${y}L${x2-14} ${y+14}`,C.copper,sw);
function svg(w,h,label,body,bg=C.bg){return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${rect(0,0,w,h,0,bg)}${body}</svg>\n`;}
function icon(){return svg(1024,1024,'Coffee Cave: a cup under a cave arch',
  line('M192 820V432C192 236 324 136 512 136S832 236 832 432V820',C.copper,80)+
  line('M628 456H682C782 456 782 610 682 610H628',C.cream,56)+
  `<path d="M320 420H656V626C656 724 594 770 488 770S320 724 320 626Z" fill="${C.cream}"/>`);}
function favicon(){return svg(16,16,'Coffee Cave',
  line('M2.5 13V6.8C2.5 3.6 4.6 2 8 2S13.5 3.6 13.5 6.8V13',C.copper,1.5)+
  line('M10 7.4H10.7C12.4 7.4 12.4 10 10.7 10H10',C.cream,1)+
  `<path d="M5 6.7H10.4V10C10.4 11.6 9.4 12.3 7.7 12.3S5 11.6 5 10Z" fill="${C.cream}"/>`);}
function hero(){let b='';
  // Silhouettes: a counter tablet and a kitchen display on a short stand.
  b+=rect(72,92,710,664,36,C.ink,C.copper,3);
  b+=rect(96,116,662,616,18,C.card);
  b+=rect(1018,92,710,664,28,C.ink,C.copper,3);
  b+=rect(1042,116,662,616,12,C.card);
  b+=rect(1331,758,84,23,0,C.copper)+rect(1267,780,212,8,4,C.copper);
  b+=text('Order Recap',132,199,52);
  b+=line('M132 230H722',C.copper,2);
  b+=text('Table 2',132,296,52,'mono');
  b+=text('Flat White',132,393,56,'mono');
  b+=text('×1  €3.75',132,455,50,'mono',C.copper);
  b+=line('M132 494H722',C.copper,2);
  b+=text('Almond Croissant',132,566,56,'mono');
  b+=text('×1  €3.50',132,628,50,'mono',C.copper);
  // Selected prep tab, inactive serve tab. All UI is SVG.
  b+=rect(1074,144,274,72,16,C.copper);
  b+=text('Prep (2)',1211,194,50,'sans',C.ink,'center');
  b+=text('Serve (0)',1521,194,50,'sans',C.cream,'center');
  b+=rect(1074,242,598,460,14,C.bg);
  b+=text('Table 2',1100,305,52,'mono');
  b+=line('M1100 332H1646',C.copper,2);
  b+=text('Flat White',1100,394,56,'mono');
  b+=text('×1  €3.75',1100,451,50,'mono',C.copper);
  b+=text('Almond Croissant',1100,533,56,'mono');
  b+=text('×1  €3.50',1100,587,50,'mono',C.copper);
  b+=rect(1100,617,296,62,10,C.gold);
  b+=text('Tree Nuts',1248,662,46,'mono',C.ink,'center');
  b+=arrow(834,966,425,8);
  b+=text('Counter',427,847,50,'sans',C.cream,'center');
  b+=text('Kitchen',1373,847,50,'sans',C.cream,'center');
  return svg(1800,900,'Counter Order Recap for Table 2 flows to the Kitchen Prep (2) ticket. Flat White ×1 €3.75; Almond Croissant ×1 €3.50, Tree Nuts.',b);
}
function diagram(){
  const xs=[56,402,748,1094,1440], w=304, y=138, h=300;
  let b='';
  for(let i=0;i<5;i++){
    const x=xs[i], cx=x+w/2;
    b+=rect(x,y,w,h,22,C.card,i===3?C.copper:C.card,i===3?5:0);
    if(i<4)b+=arrow(x+w+9,x+w+33,288,4);
    // Large, restrained object marks distinguish the five steps without more copy.
    if(i===0||i===4){
      b+=rect(cx-56,184,112,76,10,'none',C.copper,5);
      b+=line(`M${cx-35} 210H${cx+35} M${cx-35} 232H${cx+13}`,C.copper,5);
      if(i===4)b+=line(`M${cx} 263V280 M${cx-30} 280H${cx+30}`,C.copper,5);
    }
    if(i===1){
      b+=rect(cx-54,184,108,36,7,'none',C.copper,5)+rect(cx-54,237,108,36,7,'none',C.copper,5);
      b+=`<circle cx="${cx-34}" cy="202" r="4" fill="${C.copper}"/><circle cx="${cx-34}" cy="255" r="4" fill="${C.copper}"/>`;
    }
    if(i===2){
      b+=`<ellipse cx="${cx}" cy="195" rx="53" ry="18" fill="none" stroke="${C.copper}" stroke-width="5"/>`;
      b+=line(`M${cx-53} 195V259C${cx-53} 283 ${cx+53} 283 ${cx+53} 259V195 M${cx-53} 226C${cx-53} 250 ${cx+53} 250 ${cx+53} 226`,C.copper,5);
    }
    if(i===3){
      b+=line(`M${cx-55} 209H${cx+55} M${cx+37} 191L${cx+55} 209L${cx+37} 227 M${cx+55} 257H${cx-55} M${cx-37} 239L${cx-55} 257L${cx-37} 275`,C.copper,6);
    }
    const names=[['Counter','tablet'],['Coffee Cave','server'],['Postgres'],['Zero sync'],['Kitchen','screen']][i];
    names.forEach((s,j)=>b+=text(s,cx,names.length===1?371:348+j*58,i===1?48:52,'sans',C.cream,'center'));
    const captions=[['shows it','at once'],['checks role','and café'],['one','database'],['streams','changes'],['updates','live']][i];
    captions.forEach((s,j)=>b+=text(s,cx,513+j*58,48,'sans',C.cream,'center'));
  }
  return svg(1800,700,'Counter tablet: shows it at once → Coffee Cave server: checks role and café → Postgres: one database → Zero sync: streams changes → Kitchen screen: updates live',b);
}
async function main(){
 for(const [name,data] of [['icon-1024',icon()],['hero',hero()],['how-it-works',diagram()]]){
   fs.writeFileSync(path.join(root,`${name}.svg`),data);
   await sharp(Buffer.from(data)).png().toFile(path.join(out,`${name}.png`));
 }
 const fav=favicon();fs.writeFileSync(path.join(root,'favicon.svg'),fav);fs.writeFileSync(path.join(out,'favicon.svg'),fav);
 const previews=path.join(root,'previews');fs.mkdirSync(previews,{recursive:true});
 for(const n of [16,32])await sharp(path.join(out,'icon-1024.png')).resize(n,n).png().toFile(path.join(previews,`icon-${n}.png`));
 await sharp(Buffer.from(fav)).png().toFile(path.join(previews,'favicon-16.png'));
 for(const name of ['hero','how-it-works'])for(const width of [900,390])await sharp(path.join(out,`${name}.png`)).resize({width}).png().toFile(path.join(previews,`${name}-${width}.png`));
}
main().catch(e=>{console.error(e);process.exit(1);});
