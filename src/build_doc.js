const fs=require('fs');
const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,Header,Footer,
  AlignmentType,LevelFormat,HeadingLevel,BorderStyle,WidthType,ShadingType,VerticalAlign,PageNumber}=require('docx');
const S=JSON.parse(fs.readFileSync('data/stats.json','utf8'));

const BRAND="F5C518", BLUE="0EA5E9", DARK="171717", HEADTXT="171717", ALT="FFFBEA", LINE="E5E7EB";
const CW=9360;
function fmt(n){if(n==null||isNaN(n))return '–';n=Math.round(n);
  if(Math.abs(n)>=1e7)return (n/1e7).toFixed(2)+' Cr';
  if(Math.abs(n)>=1e5)return (n/1e5).toFixed(2)+' L';
  return n.toLocaleString('en-IN');}
function ci(n){return n==null?'–':Math.round(n).toLocaleString('en-IN');}
const border={style:BorderStyle.SINGLE,size:1,color:LINE};
const borders={top:border,bottom:border,left:border,right:border};

function cell(text,w,opt){opt=opt||{};
  return new TableCell({borders,width:{size:w,type:WidthType.DXA},
    shading:opt.fill?{fill:opt.fill,type:ShadingType.CLEAR}:undefined,
    margins:{top:60,bottom:60,left:110,right:110},verticalAlign:VerticalAlign.CENTER,
    children:[new Paragraph({alignment:opt.align||AlignmentType.LEFT,
      children:[new TextRun({text:String(text),bold:!!opt.bold,color:opt.color||"1B2430",size:opt.size||18,font:"Arial"})]})]});
}
function headRow(labels,widths){
  return new TableRow({tableHeader:true,children:labels.map(function(l,i){
    return cell(l,widths[i],{fill:BRAND,bold:true,color:HEADTXT,align:(i===0?AlignmentType.LEFT:AlignmentType.RIGHT),size:17});})});
}
function dataRow(cells,widths,alt){
  return new TableRow({children:cells.map(function(c,i){
    return cell(c.t,widths[i],{align:(i===0?AlignmentType.LEFT:AlignmentType.RIGHT),fill:alt?ALT:undefined,bold:c.b,color:c.c,size:17});})});
}
function mkTable(widths,headLabels,rows){
  return new Table({width:{size:CW,type:WidthType.DXA},columnWidths:widths,
    rows:[headRow(headLabels,widths)].concat(rows)});
}
function H(text,lvl){return new Paragraph({heading:lvl||HeadingLevel.HEADING_1,children:[new TextRun({text:text})]});}
function P(runs){return new Paragraph({spacing:{after:120},children:runs});}
function T(text,o){o=o||{};return new TextRun({text:text,bold:o.b,italics:o.i,color:o.c,size:o.size,font:"Arial"});}
function bullet(runs){return new Paragraph({numbering:{reference:"b",level:0},spacing:{after:80},children:runs});}

const t=S.total, P_=t.p;
const momentum=S.prior>0?(100*(S.recent-S.prior)/S.prior):0;
const resType=S.types.find(function(x){return x.name.indexOf('Residential')>=0;})||{c:0};
const resShare=100*resType.c/P_;

// ---- year trend rows ----
const yrKeys=Object.keys(S.years).map(Number).sort(function(a,b){return a-b;});
const peakY=yrKeys.reduce(function(a,b){return S.years[b]>S.years[a]?b:a;},yrKeys[0]);

// ============ DOCUMENT ============
const children=[];

// Title block
children.push(new Paragraph({spacing:{after:0},border:{bottom:{style:BorderStyle.SINGLE,size:24,color:BRAND,space:6}},
  children:[new TextRun({text:"RERA",bold:true,size:36,color:DARK,font:"Arial"}),new TextRun({text:"Easy",bold:true,italics:true,size:36,color:"C79500",font:"Arial"}),new TextRun({text:"   Real Estate Market Intelligence",size:20,color:"6B7A90",font:"Arial"})]}));
children.push(new Paragraph({spacing:{before:220,after:40},children:[new TextRun({text:"Maharashtra Real Estate Market Analysis",bold:true,size:40,color:DARK,font:"Arial"})]}));
children.push(P([T("Area-wise market report derived from the MahaRERA project registry · Registration years "+S.minYear+"–"+S.maxYear,{size:19,c:"5A6B82"})]));
children.push(P([T("Prepared for Business Development & Developer Relations  |  Confidential",{size:18,c:"5A6B82",i:true})]));
children.push(P([T("RERA Easy  ·  Pune +91 91384 90809  ·  Mumbai +91 99879 57851  ·  info@reraeasy.com",{size:17,c:"8A7A3A"})]));

// 1. Executive summary
children.push(H("1. Executive Summary"));
children.push(P([
  T("Maharashtra's RERA-registered pipeline comprises ",{size:20}),
  T(ci(P_)+" projects",{b:true,size:20}),
  T(", spanning ",{size:20}),
  T(fmt(t.u)+" units",{b:true,size:20}),
  T(", ",{size:20}),
  T(fmt(t.carp)+" sq. m of carpet area",{b:true,size:20}),
  T(" and "+fmt(t.bu)+" sq. m of sanctioned built-up area across the period "+S.minYear+"–"+S.maxYear+". ",{size:20}),
  T("The market is predominantly residential, with residential / group housing making up ",{size:20}),
  T(resShare.toFixed(0)+"%",{b:true,size:20}),
  T(" of all registrations. Delivery performance stands at a ",{size:20}),
  T(t.compR+"% completion rate",{b:true,size:20}),
  T(" against a ",{size:20}),
  T(t.lapsR+"% lapse rate",{b:true,size:20}),
  T(", with the average project taking "+ci(t.avgd)+" days (~"+(t.avgd/365).toFixed(1)+" years) to complete.",{size:20})
]));
children.push(P([
  T("Supply is heavily concentrated: the ",{size:20}),
  T("top three districts account for "+S.conc.top3+"%",{b:true,size:20}),
  T(" of all registered projects and the top ten for "+S.conc.top10+"%. ",{size:20}),
  T("New-launch momentum has effectively plateaued — the last three full years ("+S.recentLabel+") registered "+ci(S.recent)+" projects versus "+ci(S.prior)+" in "+S.priorLabel+" ("+(momentum>=0?"+":"")+momentum.toFixed(0)+"%), signalling a market shifting from fresh supply toward absorption and completion of existing inventory.",{size:20})
]));

// key metrics table
children.push(H("Key Metrics at a Glance",HeadingLevel.HEADING_2));
const kmW=[3200,1480,3200,1480];
children.push(new Table({width:{size:CW,type:WidthType.DXA},columnWidths:kmW,rows:[
  new TableRow({children:[cell("Registered Projects",kmW[0],{fill:ALT,bold:true}),cell(ci(P_),kmW[1],{align:AlignmentType.RIGHT}),
    cell("Completion Rate",kmW[2],{fill:ALT,bold:true}),cell(t.compR+"%",kmW[3],{align:AlignmentType.RIGHT})]}),
  new TableRow({children:[cell("Total Units",kmW[0],{fill:ALT,bold:true}),cell(fmt(t.u),kmW[1],{align:AlignmentType.RIGHT}),
    cell("Lapse Rate",kmW[2],{fill:ALT,bold:true}),cell(t.lapsR+"%",kmW[3],{align:AlignmentType.RIGHT})]}),
  new TableRow({children:[cell("Land Area (sq. m)",kmW[0],{fill:ALT,bold:true}),cell(fmt(t.land),kmW[1],{align:AlignmentType.RIGHT}),
    cell("Active / Ongoing",kmW[2],{fill:ALT,bold:true}),cell(ci(t.act),kmW[3],{align:AlignmentType.RIGHT})]}),
  new TableRow({children:[cell("Carpet Area (sq. m)",kmW[0],{fill:ALT,bold:true}),cell(fmt(t.carp),kmW[1],{align:AlignmentType.RIGHT}),
    cell("Avg. Completion Time",kmW[2],{fill:ALT,bold:true}),cell((t.avgd/365).toFixed(1)+" yrs",kmW[3],{align:AlignmentType.RIGHT})]}),
  new TableRow({children:[cell("Built-Up Area (sq. m)",kmW[0],{fill:ALT,bold:true}),cell(fmt(t.bu),kmW[1],{align:AlignmentType.RIGHT}),
    cell("Total Complaints",kmW[2],{fill:ALT,bold:true}),cell(ci(t.cx),kmW[3],{align:AlignmentType.RIGHT})]}),
]}));

// 2. Supply composition
children.push(H("2. Market Size & Supply Composition"));
children.push(P([T("Average project size is "+(t.u/P_).toFixed(0)+" units and "+fmt(t.carp/P_)+" sq. m of carpet area. The supply mix by project type:",{size:20})]));
const tyW=[4360,2500,2500];
children.push(mkTable(tyW,["Project Type","Projects","Share"],
  S.types.map(function(r,i){return dataRow([{t:r.name},{t:ci(r.c)},{t:(100*r.c/P_).toFixed(1)+"%"}],tyW,i%2===1);})));

// 3. Trend
children.push(H("3. Registration Trend & Demand Momentum"));
const yrW=[3120,3120,3120];
const yrRows=[];
for(let k=0;k<yrKeys.length;k+=1){
  const y=yrKeys[k];
  yrRows.push(dataRow([{t:String(y)+(y===S.minYear?" (RERA launch)":y===S.maxYear?" (YTD)":"")},{t:ci(S.years[y])},{t:(100*S.years[y]/P_).toFixed(1)+"%"}],yrW,k%2===1));
}
children.push(mkTable(yrW,["Registration Year","New Registrations","Share of Total"],yrRows));
children.push(P([
  T("The "+peakY+" peak ("+ci(S.years[peakY])+" projects) reflects the launch-year backlog when MahaRERA first opened registrations; trend reading is most reliable from 2018 onward. ",{size:20}),
  T("Volumes rebuilt to a secondary peak mid-period and have eased since, leaving overall momentum broadly flat. "+S.maxYear+" is year-to-date and partial. For business development this points to a maturing market where completion track-record and inventory absorption matter more than raw new-launch counts.",{size:20})
]));

// 4. Division analysis
children.push(H("4. Regional Analysis — Division-wise"));
const dvW=[1660,1000,780,1240,1060,1020,1100,1500];
children.push(mkTable(dvW,["Division","Projects","Share","Units","Compl.%","Lapse%","Avg Days","Complaints"],
  S.divisions.map(function(d,i){return dataRow([{t:d.name},{t:ci(d.p)},{t:(100*d.p/P_).toFixed(1)+"%"},{t:fmt(d.u)},
    {t:d.compR+"%"},{t:d.lapsR+"%"},{t:ci(d.avgd)},{t:ci(d.cx)}],dvW,i%2===1);})));
const topDiv=S.divisions[0], topDiv2=S.divisions[1];
children.push(P([
  T(topDiv.name+" (the Mumbai Metropolitan belt) leads with "+ci(topDiv.p)+" projects ("+(100*topDiv.p/P_).toFixed(0)+"% of the state), followed by "+topDiv2.name+" at "+(100*topDiv2.p/P_).toFixed(0)+"%. Together these two divisions hold roughly "+((100*(topDiv.p+topDiv2.p)/P_)).toFixed(0)+"% of all registered development — the clear focus for volume-led campaigns.",{size:20})
]));

// 5. District breakdown
children.push(H("5. District-wise Breakdown (Top 18)"));
const diW=[1660,1000,780,1240,1060,1020,1100,1500];
children.push(mkTable(diW,["District","Projects","Share","Units","Compl.%","Lapse%","Avg Days","Complaints"],
  S.districts.slice(0,18).map(function(d,i){return dataRow([{t:d.name},{t:ci(d.p)},{t:(100*d.p/P_).toFixed(1)+"%"},{t:fmt(d.u)},
    {t:d.compR+"%"},{t:d.lapsR+"%"},{t:ci(d.avgd)},{t:ci(d.cx)}],diW,i%2===1);})));

// 6. Concentration
children.push(H("6. Market Concentration"));
children.push(P([
  T("Supply concentration is high. The top 3 districts ("+S.districts.slice(0,3).map(function(d){return d.name;}).join(", ")+") represent "+S.conc.top3+"% of registered projects; the top 5 reach "+S.conc.top5+"% and the top 10 "+S.conc.top10+"%. ",{size:20}),
  T("This means campaign efficiency is maximised by prioritising a short list of dominant micro-markets, while the long tail of 29+ smaller districts offers lower-competition, white-space opportunities for differentiated positioning.",{size:20})
]));

// 7. Delivery & risk
children.push(H("7. Delivery Performance & Risk"));
children.push(P([
  T("Of "+ci(P_)+" projects, ",{size:20}),
  T(ci(t.comp)+" ("+t.compR+"%) are completed",{b:true,c:"0F8A4F",size:20}),
  T(", "+ci(t.act)+" are active/ongoing, and ",{size:20}),
  T(ci(t.laps)+" ("+t.lapsR+"%) have lapsed",{b:true,c:"C43B2F",size:20}),
  T(". Registered complaints total "+ci(t.cx)+" ("+(t.cx/P_).toFixed(2)+" per project).",{size:20})
]));
children.push(H("Higher-risk districts — elevated lapse rate (≥300 projects)",HeadingLevel.HEADING_2));
S.risk.forEach(function(d){children.push(bullet([T(d.name+" — ",{b:true,size:20}),T(d.lapsR+"% lapsed, "+d.compR+"% completed ("+ci(d.p)+" projects)",{size:20})]));});
children.push(H("Most reliable delivery track record (≥300 projects)",HeadingLevel.HEADING_2));
S.reliable.forEach(function(d){children.push(bullet([T(d.name+" — ",{b:true,size:20}),T(d.compR+"% completed, "+d.lapsR+"% lapsed ("+ci(d.p)+" projects)",{size:20})]));});

// 8. Recommendations
children.push(H("8. Opportunity & Business-Development Recommendations"));
const anchors=S.districts.slice(0,5).map(function(d){return d.name;}).join(", ");
const qualityGrowth=S.districts.filter(function(d){return d.p>=300 && d.compR>=t.compR && d.lapsR<=t.lapsR;}).sort(function(a,b){return b.p-a.p;}).slice(0,4).map(function(d){return d.name;});
children.push(bullet([T("Anchor markets: ",{b:true,size:20}),T(anchors+" carry the bulk of supply — prioritise these for volume campaigns and flagship developer relationships.",{size:20})]));
if(qualityGrowth.length)children.push(bullet([T("Quality-growth targets: ",{b:true,size:20}),T(qualityGrowth.join(", ")+" combine scale with above-average completion and below-average lapse — ideal for premium positioning and reliable-delivery messaging.",{size:20})]));
children.push(bullet([T("Diligence flags: ",{b:true,size:20}),T("Exercise caution in "+S.risk.slice(0,3).map(function(d){return d.name;}).join(", ")+" where lapse rates run high; turn delivery certainty into a pitch differentiator.",{size:20})]));
children.push(bullet([T("Demand signal: ",{b:true,size:20}),T("New-launch momentum is broadly flat after a 2022 peak — lead with inventory absorption and completion-led demand narratives rather than fresh-supply expansion.",{size:20})]));
children.push(bullet([T("Product mix: ",{b:true,size:20}),T("With residential at "+resShare.toFixed(0)+"% of registrations, residential remains the core campaign focus; commercial, plotted and mixed-use together form a ~"+(100-resShare).toFixed(0)+"% niche worth dedicated, differentiated outreach.",{size:20})]));
children.push(bullet([T("Micro-market drill-down: ",{b:true,size:20}),T("Use the companion interactive dashboard to drill from division to district, taluka and village, then export a scope-specific report tailored to each developer pitch.",{size:20})]));

// 9. Methodology
children.push(H("9. Methodology & Notes"));
children.push(P([T("Source: MahaRERA project registry, covering "+ci(P_)+" registered projects with registration years from "+S.minYear+" to "+S.maxYear+". Figures are aggregated from registered project filings. ",{size:18,c:"5A6B82"}),
  T("Data cleaning: a small number of records with corrupt carpet-area values and negative completion-day values were excluded from those specific metrics only; all projects are retained in counts. \"Completed/Active/Lapsed\" reflects the project's current RERA status. \"Avg Days to Complete\" is the registry's reported average days metric. Areas are in the source units. 2026 figures are year-to-date.",{size:18,c:"5A6B82"})]));

// ============ ASSEMBLE ============
const doc=new Document({
  creator:"RERA Easy",title:"Maharashtra Real Estate Market Analysis",
  styles:{default:{document:{run:{font:"Arial",size:20}}},
    paragraphStyles:[
      {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:26,bold:true,color:DARK,font:"Arial"},
        paragraph:{spacing:{before:300,after:140},border:{left:{style:BorderStyle.SINGLE,size:28,color:BRAND,space:8}},outlineLevel:0}},
      {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:21,bold:true,color:"35506B",font:"Arial"},
        paragraph:{spacing:{before:180,after:90},outlineLevel:1}}]},
  numbering:{config:[{reference:"b",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,
    style:{paragraph:{indent:{left:560,hanging:280}}}}]}]},
  sections:[{
    properties:{page:{size:{width:12240,height:15840},margin:{top:1080,right:1440,bottom:1080,left:1440}}},
    headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,
      border:{bottom:{style:BorderStyle.SINGLE,size:4,color:BRAND,space:4}},
      children:[new TextRun({text:"RERA Easy · Market Intelligence",size:16,color:"8A98AC",font:"Arial"})]})]})},
    footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,
      children:[new TextRun({text:"Confidential · RERA Easy   |   Page ",size:16,color:"8A98AC",font:"Arial"}),
        new TextRun({children:[PageNumber.CURRENT],size:16,color:"8A98AC",font:"Arial"}),
        new TextRun({text:" of ",size:16,color:"8A98AC",font:"Arial"}),
        new TextRun({children:[PageNumber.TOTAL_PAGES],size:16,color:"8A98AC",font:"Arial"})]})]})},
    children:children
  }]
});
Packer.toBuffer(doc).then(function(buf){
  fs.writeFileSync("RERA Easy - Maharashtra Market Analysis.docx",buf);
  console.log("docx written",buf.length,"bytes");
});
