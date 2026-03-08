import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { storage } from "./storage.js";

/* ══════════════════════════════════════════════════
   GLOBAL CSS
══════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Cairo',sans-serif;background:#F7F2EA;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:#EDE6DA;}
  ::-webkit-scrollbar-thumb{background:#2A6B45;border-radius:4px;}
  input,textarea,select,button{font-family:'Cairo',sans-serif;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  @keyframes slideUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pop{0%{transform:scale(1);}50%{transform:scale(1.18);}100%{transform:scale(1);}}
  .fade{animation:fadeIn .3s ease forwards;}
  .card-h{transition:transform .2s,box-shadow .2s;}
  .card-h:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(26,82,53,.14)!important;}
  .pop{animation:pop .25s ease;}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
  .typing span{display:inline-block;width:7px;height:7px;borderRadius:50%;background:#2A7A50;animation:pulse 1.2s infinite;}
  .typing span:nth-child(2){animation-delay:.2s;}
  .typing span:nth-child(3){animation-delay:.4s;}
  @keyframes slideRight{from{transform:translateX(120%);}to{transform:translateX(0);}}
  .ai-panel{animation:slideRight .3s ease;}
`;

/* ══════════════════════════════════════════════════
   TOKENS
══════════════════════════════════════════════════ */
const C = {
  g:"#1E5C3A",gL:"#2A7A50",gXL:"#3A9B66",
  gold:"#B8822A",goldL:"#D4A855",goldBg:"#FBF0DC",
  bg:"#F7F2EA",surf:"#FFFFFF",border:"#E4D9C8",
  dark:"#1C1815",mid:"#4A3F35",muted:"#8A7A6A",
  red:"#C0392B",redBg:"#FEE8E8",
  blue:"#2563A8",blueBg:"#E8F0FD",
  purple:"#7B3FA0",purpleBg:"#F3E8FD",
};

/* ══════════════════════════════════════════════════
   CONTENT TYPES
══════════════════════════════════════════════════ */
const TYPES={
  video:{label:"فيديو",icon:"🎬",color:C.g,bg:"#E8F5EE"},
  pdf:{label:"PDF",icon:"📄",color:C.gold,bg:C.goldBg},
  link:{label:"رابط",icon:"🔗",color:C.blue,bg:C.blueBg},
  page:{label:"صفحة",icon:"📝",color:C.purple,bg:C.purpleBg},
};
const CATS=["فقه النفس","التربية والأسرة","الروحانيات","الصحة النفسية","التطوير الذاتي","العلاقات","الإنتاجية","معرفة عامة","أخرى"];

/* ══════════════════════════════════════════════════
   PLANNER CONFIG
══════════════════════════════════════════════════ */
const PRAYERS=[
  {key:"fajrS",label:"ركعتا الفجر",icon:"🌙"},
  {key:"fajr", label:"الفجر",icon:"🌅"},
  {key:"duha", label:"ركعتا الضحى",icon:"☀️"},
  {key:"dhuhr",label:"الظهر",icon:"🕛"},
  {key:"asr",  label:"العصر",icon:"🕓"},
  {key:"maghrib",label:"المغرب",icon:"🌇"},
  {key:"isha", label:"العشاء",icon:"🌃"},
  {key:"witr", label:"ركعة الوتر",icon:"✨"},
];
const FRUITS=[
  {key:"wird",    label:"الورد اليومي",icon:"📖",color:"#1E5C3A",hint:"القرآن الكريم"},
  {key:"ilm",     label:"علم",          icon:"🌟",color:"#B8822A",hint:"علوم الوحي والاستخلاف"},
  {key:"istikhlaf",label:"استخلاف",    icon:"↩",color:"#2563A8",hint:"علوم الاستخلاف"},
  {key:"wahy",    label:"وحي",          icon:"🌿",color:"#1E5C3A",hint:"علوم الوحي"},
  {key:"riyada",  label:"رياضة",        icon:"🏃",color:"#C0392B",hint:"الصحة الجسدية"},
  {key:"tarwih",  label:"ترويح",        icon:"🎮",color:"#7B3FA0",hint:"الترفيه المباح"},
  {key:"taaaruf", label:"لتعارفوا",     icon:"👥",color:"#2563A8",hint:"التواصل الاجتماعي الواقعي"},
];
// Map fruit keys to library tag suggestions
const FRUIT_TAGS={
  wird:["قرآن","ورد","تلاوة","حفظ"],
  ilm:["علم","تعلم","دروس","فقه النفس"],
  istikhlaf:["استخلاف","علوم","طبيعة","مهنة"],
  wahy:["وحي","تفسير","سيرة","حديث"],
  riyada:["رياضة","صحة","جسد"],
  tarwih:["ترويح","فن","أدب","قصص"],
  taaaruf:["علاقات","أسرة","مجتمع","لتعارفوا"],
};

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
const genId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const ytId=u=>{const m=u?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&\n?#]+)/);return m?.[1]||null;};
const fmtDate=iso=>{if(!iso)return"";return new Date(iso).toLocaleDateString("ar-SA",{year:"numeric",month:"short",day:"numeric"});};
const todayStr=()=>new Date().toISOString().slice(0,10);
const monthStr=()=>new Date().toISOString().slice(0,7);
const fmtMonthAr=m=>{const[y,mo]=m.split("-");return new Date(y,mo-1,1).toLocaleDateString("ar-SA",{year:"numeric",month:"long"});};
const sharedTags=(a,b)=>{if(!a.tags||!b.tags)return 0;return a.tags.filter(t=>b.tags.includes(t)).length;};
const emptyDay=date=>({date,prayers:Object.fromEntries(PRAYERS.map(p=>[p.key,""])),fruits:Object.fromEntries(FRUITS.map(f=>[f.key,false])),notes:"",linkedFruits:{}});
const emptyMonth=month=>({month,allah:"",ana:"",akhar:""});

/* ══════════════════════════════════════════════════
   SMALL SHARED COMPONENTS
══════════════════════════════════════════════════ */
const GeoPat=()=>(
  <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.08,pointerEvents:"none"}}>
    <defs><pattern id="gp" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse">
      <polygon points="36,2 70,18 70,54 36,70 2,54 2,18" fill="none" stroke="#fff" strokeWidth="1"/>
      <circle cx="36" cy="36" r="7" fill="none" stroke="#fff" strokeWidth=".8"/>
      <circle cx="36" cy="36" r="2" fill="#fff" opacity=".5"/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#gp)"/>
  </svg>
);
const Stat=({icon,val,label})=>(
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",background:"rgba(255,255,255,.13)",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,.2)",borderRadius:14,padding:"10px 16px",minWidth:62}}>
    <span style={{fontSize:18}}>{icon}</span>
    <span style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1.2}}>{val}</span>
    <span style={{fontSize:10,color:"rgba(255,255,255,.7)",textAlign:"center",marginTop:2}}>{label}</span>
  </div>
);
const TypeBadge=({type,small})=>{const t=TYPES[type]||TYPES.page;return(
  <span style={{display:"inline-flex",alignItems:"center",gap:4,background:t.bg,color:t.color,borderRadius:20,padding:small?"2px 10px":"4px 14px",fontSize:small?11:12,fontWeight:700}}>{t.icon} {t.label}</span>
);};
const Tag=({label,onClick,active,small})=>(
  <span onClick={onClick} style={{display:"inline-flex",alignItems:"center",background:active?C.g:C.goldBg,color:active?"#fff":C.mid,borderRadius:20,padding:small?"2px 8px":"3px 12px",fontSize:small?10:12,fontWeight:600,cursor:onClick?"pointer":"default",border:`1px solid ${active?C.g:C.border}`,transition:"all .15s",userSelect:"none"}}>#{label}</span>
);

/* ══════════════════════════════════════════════════
   FRUIT CHECKBOX — with pop animation
══════════════════════════════════════════════════ */
function FruitCheck({fruit,checked,onChange}){
  const[pop,setPop]=useState(false);
  const handle=()=>{setPop(true);setTimeout(()=>setPop(false),300);onChange(!checked);};
  return(
    <div onClick={handle} style={{display:"flex",alignItems:"center",gap:10,background:checked?fruit.color+"18":C.surf,borderRadius:12,padding:"10px 14px",border:`2px solid ${checked?fruit.color:C.border}`,cursor:"pointer",transition:"all .2s",userSelect:"none"}}>
      <span style={{fontSize:22,transform:pop?"scale(1.3)":"scale(1)",transition:"transform .2s"}}>{fruit.icon}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:checked?fruit.color:C.dark}}>{fruit.label}</div>
        <div style={{fontSize:11,color:C.muted}}>{fruit.hint}</div>
      </div>
      <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${checked?fruit.color:C.border}`,background:checked?fruit.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0}}>
        {checked&&<span style={{color:"#fff",fontSize:13,lineHeight:1}}>✓</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PRAYER SLOT
══════════════════════════════════════════════════ */
function PrayerSlot({prayer,value,onChange}){
  const[open,setOpen]=useState(false);
  return(
    <div style={{background:C.surf,borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",cursor:"pointer",userSelect:"none"}}>
        <span style={{fontSize:20}}>{prayer.icon}</span>
        <span style={{fontSize:14,fontWeight:700,color:C.dark,flex:1}}>{prayer.label}</span>
        {value&&<span style={{width:8,height:8,borderRadius:"50%",background:C.gL,flexShrink:0}}/>}
        <span style={{color:C.muted,fontSize:16}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"0 16px 14px"}}>
          <textarea dir="rtl" value={value} onChange={e=>onChange(e.target.value)} rows={3}
            placeholder={`ما أعمالك في ${prayer.label}؟`}
            style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${C.border}`,background:"#FAFAF5",fontFamily:"Cairo",fontSize:13,color:C.dark,resize:"vertical",lineHeight:1.9}}/>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FRUIT-LIBRARY LINKER
══════════════════════════════════════════════════ */
function FruitLinker({fruit,linkedItems,allItems,onLink,onUnlink}){
  const[open,setOpen]=useState(false);
  const[q,setQ]=useState("");
  const suggested=allItems.filter(x=>{
    const tags=FRUIT_TAGS[fruit.key]||[];
    return tags.some(t=>x.tags?.some(xt=>xt.includes(t)||t.includes(xt)));
  });
  const pool=q?allItems.filter(x=>x.title.includes(q)||x.tags?.some(t=>t.includes(q))):suggested;
  if(!open)return(
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
      {linkedItems.map(x=>(
        <span key={x.id} style={{display:"inline-flex",alignItems:"center",gap:5,background:C.goldBg,borderRadius:20,padding:"3px 12px",fontSize:12,border:`1px solid ${C.border}`}}>
          {TYPES[x.type]?.icon} {x.title.slice(0,25)}{x.title.length>25?"…":""}
          <span onClick={e=>{e.stopPropagation();onUnlink(x.id);}} style={{color:C.muted,cursor:"pointer",fontSize:14}}>×</span>
        </span>
      ))}
      <span onClick={()=>setOpen(true)} style={{display:"inline-flex",alignItems:"center",background:"transparent",borderRadius:20,padding:"3px 12px",fontSize:12,border:`1px dashed ${C.border}`,cursor:"pointer",color:C.muted}}>+ ربط محتوى</span>
    </div>
  );
  return(
    <div style={{background:"#FAFAF5",borderRadius:12,padding:12,marginTop:8,border:`1px solid ${C.border}`}}>
      <input dir="rtl" value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث أو اختر من المقترحات..." style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontFamily:"Cairo",fontSize:13,marginBottom:8}}/>
      {pool.length===0&&<p style={{fontSize:12,color:C.muted,textAlign:"center",padding:"10px 0"}}>لا نتائج — أضف وسوماً لمحتواك</p>}
      <div style={{maxHeight:160,overflowY:"auto",display:"flex",flexDirection:"column",gap:5}}>
        {pool.slice(0,8).map(x=>(
          <div key={x.id} onClick={()=>{onLink(x.id);setOpen(false);setQ("");}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:`1px solid ${C.border}`,cursor:"pointer",background:C.surf}}>
            <TypeBadge type={x.type} small/><span style={{fontSize:13,flex:1}}>{x.title}</span>
          </div>
        ))}
      </div>
      <button onClick={()=>setOpen(false)} style={{...S.ghost,marginTop:8,fontSize:12,padding:"5px 14px"}}>إغلاق</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DAILY VIEW
══════════════════════════════════════════════════ */
function DailyView({day,setDay,allItems,dateStr,onDateChange}){
  const[tab,setTab]=useState("prayers");
  const prayersDone=PRAYERS.filter(p=>day.prayers[p.key]?.trim()).length;
  const fruitsDone=FRUITS.filter(f=>day.fruits[f.key]).length;
  const updatePrayer=(key,val)=>setDay(d=>({...d,prayers:{...d.prayers,[key]:val}}));
  const updateFruit=(key,val)=>setDay(d=>({...d,fruits:{...d.fruits,[key]:val}}));
  const linkToFruit=(fruitKey,itemId)=>setDay(d=>({...d,linkedFruits:{...d.linkedFruits,[fruitKey]:[...((d.linkedFruits||{})[fruitKey]||[]).filter(x=>x!==itemId),itemId]}}));
  const unlinkFruit=(fruitKey,itemId)=>setDay(d=>({...d,linkedFruits:{...d.linkedFruits,[fruitKey]:((d.linkedFruits||{})[fruitKey]||[]).filter(x=>x!==itemId)}}));

  const TABS=[{id:"prayers",icon:"🕌",label:"أوقات الصلاة"},{id:"fruits",icon:"🌾",label:"ثمرات اليوم"},{id:"notes",icon:"📝",label:"خواطر اليوم"}];

  return(
    <div style={{maxWidth:820,margin:"0 auto",padding:"24px 20px 80px"}} className="fade">
      {/* Date nav */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,background:C.surf,borderRadius:16,padding:"14px 18px",border:`1px solid ${C.border}`,boxShadow:"0 2px 10px rgba(0,0,0,.04)"}}>
        <button onClick={()=>{const d=new Date(dateStr);d.setDate(d.getDate()-1);onDateChange(d.toISOString().slice(0,10));}} style={{...S.ghost,padding:"6px 14px"}}>◀</button>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:17,fontWeight:900,color:C.dark}}>{new Date(dateStr+"T12:00:00").toLocaleDateString("ar-SA",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
          {dateStr===todayStr()&&<span style={{fontSize:11,background:C.g,color:"#fff",borderRadius:20,padding:"2px 10px"}}>اليوم</span>}
        </div>
        <button onClick={()=>{const d=new Date(dateStr);d.setDate(d.getDate()+1);onDateChange(d.toISOString().slice(0,10));}} style={{...S.ghost,padding:"6px 14px"}}>▶</button>
      </div>

      {/* Mini stats */}
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        {[{icon:"🕌",val:`${prayersDone}/8`,label:"الصلوات مملوءة"},{icon:"🌾",val:`${fruitsDone}/7`,label:"الثمرات"},{icon:"📖",val:day.notes?.trim()?"✓":"—",label:"الخواطر"}].map((s,i)=>(
          <div key={i} style={{flex:1,background:C.surf,borderRadius:14,padding:"12px 10px",textAlign:"center",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:22}}>{s.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:C.g}}>{s.val}</div>
            <div style={{fontSize:11,color:C.muted}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:4,background:"#EDE6DA",borderRadius:14,padding:5,marginBottom:18}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 4px",borderRadius:10,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"Cairo",background:tab===t.id?C.surf:"transparent",color:tab===t.id?C.g:C.muted,boxShadow:tab===t.id?"0 2px 8px rgba(0,0,0,.08)":"none",transition:"all .2s"}}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Prayers */}
      {tab==="prayers"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}} className="fade">
          <p style={{fontSize:13,color:C.muted,marginBottom:4}}>سجّل ما فعلته في كل وقت — أو خطط لما ستفعله</p>
          {PRAYERS.map(p=><PrayerSlot key={p.key} prayer={p} value={day.prayers[p.key]||""} onChange={v=>updatePrayer(p.key,v)}/>)}
        </div>
      )}

      {/* Fruits */}
      {tab==="fruits"&&(
        <div className="fade">
          <p style={{fontSize:13,color:C.muted,marginBottom:14}}>ضع علامة ✓ على ما أنجزته — واربط المحتوى المرتبط به من مكتبتك</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {FRUITS.map(f=>{
              const linked=(day.linkedFruits||{})[f.key]||[];
              const linkedObjs=allItems.filter(x=>linked.includes(x.id));
              return(
                <div key={f.key}>
                  <FruitCheck fruit={f} checked={!!day.fruits[f.key]} onChange={v=>updateFruit(f.key,v)}/>
                  <FruitLinker fruit={f} linkedItems={linkedObjs} allItems={allItems} onLink={id=>linkToFruit(f.key,id)} onUnlink={id=>unlinkFruit(f.key,id)}/>
                </div>
              );
            })}
          </div>
          {/* Completion bar */}
          <div style={{marginTop:20,background:C.surf,borderRadius:14,padding:"14px 18px",border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:700,color:C.dark}}>إنجاز اليوم</span>
              <span style={{fontSize:13,fontWeight:800,color:C.g}}>{fruitsDone}/7</span>
            </div>
            <div style={{height:10,background:"#EDE6DA",borderRadius:20,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(fruitsDone/7)*100}%`,background:`linear-gradient(90deg,${C.g},${C.gXL})`,borderRadius:20,transition:"width .4s ease"}}/>
            </div>
            <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
              {FRUITS.map(f=><span key={f.key} style={{fontSize:18,opacity:day.fruits[f.key]?1:.25,transition:"opacity .2s"}} title={f.label}>{f.icon}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {tab==="notes"&&(
        <div className="fade">
          <p style={{fontSize:13,color:C.muted,marginBottom:12}}>خواطرك وثمرات يومك — ما استفدته فكرياً أو سلوكياً</p>
          <textarea dir="rtl" value={day.notes||""} onChange={e=>setDay(d=>({...d,notes:e.target.value}))} rows={12}
            placeholder="اكتب ثمرات يومك وخواطرك هنا..." style={{...S.textarea,fontSize:14,lineHeight:2}}/>
          <div style={{marginTop:12,fontSize:12,color:C.muted,textAlign:"left"}}>{(day.notes||"").length} حرف</div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MONTHLY GOALS VIEW
══════════════════════════════════════════════════ */
function MonthlyView({goals,setGoals,monthKey,onMonthChange,allDays}){
  const prevMonth=()=>{const[y,m]=monthKey.split("-").map(Number);const d=new Date(y,m-2,1);onMonthChange(d.toISOString().slice(0,7));};
  const nextMonth=()=>{const[y,m]=monthKey.split("-").map(Number);const d=new Date(y,m,1);onMonthChange(d.toISOString().slice(0,7));};

  // Stats for this month
  const monthDays=Object.values(allDays).filter(d=>d.date?.startsWith(monthKey));
  const totalFruits=monthDays.reduce((a,d)=>a+FRUITS.filter(f=>d.fruits[f.key]).length,0);
  const daysWithEntry=monthDays.filter(d=>d.notes?.trim()||FRUITS.some(f=>d.fruits[f.key])).length;

  const GOALS=[
    {key:"allah",label:"الله",icon:"🕌",color:C.g,hint:"علاقتي مع الله — عبادة، توبة، خلوة..."},
    {key:"ana",label:"أنا",icon:"🌱",color:C.gold,hint:"نفسي — صحتي، علمي، تطويري..."},
    {key:"akhar",label:"الآخر",icon:"👥",color:C.blue,hint:"علاقاتي — أسرتي، أصدقائي، مجتمعي..."},
  ];

  return(
    <div style={{maxWidth:820,margin:"0 auto",padding:"24px 20px 80px"}} className="fade">
      {/* Month nav */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,background:C.surf,borderRadius:16,padding:"14px 18px",border:`1px solid ${C.border}`}}>
        <button onClick={prevMonth} style={{...S.ghost,padding:"6px 14px"}}>◀</button>
        <div style={{flex:1,textAlign:"center",fontSize:17,fontWeight:900,color:C.dark}}>{fmtMonthAr(monthKey)}</div>
        <button onClick={nextMonth} style={{...S.ghost,padding:"6px 14px"}}>▶</button>
      </div>

      {/* Month stats */}
      <div style={{display:"flex",gap:10,marginBottom:22}}>
        {[{icon:"📅",val:daysWithEntry,label:"أيام مسجّلة"},{icon:"🌾",val:totalFruits,label:"مجموع الثمرات"},{icon:"💡",val:monthDays.reduce((a,d)=>a+(d.notes?.trim()?1:0),0),label:"خواطر مكتوبة"}].map((s,i)=>(
          <div key={i} style={{flex:1,background:C.surf,borderRadius:14,padding:"12px 10px",textAlign:"center",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:22}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:800,color:C.g}}>{s.val}</div>
            <div style={{fontSize:11,color:C.muted}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Goals */}
      <h3 style={{fontSize:16,fontWeight:900,color:C.dark,marginBottom:4}}>مقاصد الشهر</h3>
      <p style={{fontSize:13,color:C.muted,marginBottom:16}}>حدّد مقصدك مع الله، ومع نفسك، ومع الآخرين هذا الشهر</p>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {GOALS.map(g=>(
          <div key={g.key} style={{background:C.surf,borderRadius:18,border:`2px solid ${g.color}22`,overflow:"hidden"}}>
            <div style={{background:`linear-gradient(135deg,${g.color}15,${g.color}08)`,padding:"14px 18px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:26}}>{g.icon}</span>
              <div>
                <div style={{fontSize:16,fontWeight:900,color:g.color}}>{g.label}</div>
                <div style={{fontSize:12,color:C.muted}}>{g.hint}</div>
              </div>
            </div>
            <div style={{padding:"14px 18px"}}>
              <textarea dir="rtl" value={goals[g.key]||""} onChange={e=>setGoals(gls=>({...gls,[g.key]:e.target.value}))} rows={4}
                placeholder={`مقصدي مع ${g.label} هذا الشهر...`} style={{...S.textarea,minHeight:90,fontSize:14}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Fruits heat strip */}
      {monthDays.length>0&&(
        <div style={{marginTop:24,background:C.surf,borderRadius:18,padding:"18px 20px",border:`1px solid ${C.border}`}}>
          <h4 style={{fontSize:14,fontWeight:800,color:C.dark,marginBottom:14}}>🌾 الثمرات اليومية — {fmtMonthAr(monthKey)}</h4>
          <div style={{overflowX:"auto"}}>
            <table style={{borderCollapse:"collapse",width:"100%",fontSize:11}}>
              <thead>
                <tr>
                  <td style={{padding:"4px 8px",color:C.muted,fontWeight:700,minWidth:60}}>اليوم</td>
                  {FRUITS.map(f=><td key={f.key} style={{padding:"4px 6px",textAlign:"center",color:C.muted}} title={f.label}>{f.icon}</td>)}
                </tr>
              </thead>
              <tbody>
                {monthDays.sort((a,b)=>a.date.localeCompare(b.date)).map(d=>(
                  <tr key={d.date}>
                    <td style={{padding:"3px 8px",color:C.mid,fontWeight:600}}>{new Date(d.date+"T12:00:00").getDate()}</td>
                    {FRUITS.map(f=>(
                      <td key={f.key} style={{padding:"3px 6px",textAlign:"center"}}>
                        <span style={{display:"inline-block",width:18,height:18,borderRadius:"50%",background:d.fruits[f.key]?f.color:"#EDE6DA",transition:"background .2s"}}/>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PROGRESS VIEW — streaks & overview
══════════════════════════════════════════════════ */
function ProgressView({allDays}){
  const days=Object.values(allDays).sort((a,b)=>b.date.localeCompare(a.date));
  if(days.length===0)return(
    <div style={{textAlign:"center",padding:"80px 20px"}} className="fade">
      <div style={{fontSize:60}}>📊</div>
      <p style={{color:C.muted,fontSize:15,marginTop:16}}>سجّل أيامك لترى تقدمك هنا</p>
    </div>
  );

  // Per-fruit total
  const fruitTotals=FRUITS.map(f=>({...f,total:days.filter(d=>d.fruits[f.key]).length,pct:Math.round(days.filter(d=>d.fruits[f.key]).length/days.length*100)}));

  // Streak calculator
  const streak=(()=>{
    let s=0,d=new Date();
    while(true){
      const k=d.toISOString().slice(0,10);
      const entry=allDays[k];
      if(!entry||!FRUITS.some(f=>entry.fruits[f.key]))break;
      s++;d.setDate(d.getDate()-1);
    }
    return s;
  })();

  return(
    <div style={{maxWidth:820,margin:"0 auto",padding:"24px 20px 80px"}} className="fade">
      {/* Headline stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginBottom:24}}>
        {[{icon:"🔥",val:streak,label:"أيام متتالية"},{icon:"📅",val:days.length,label:"أيام مسجّلة"},{icon:"🌾",val:days.reduce((a,d)=>a+FRUITS.filter(f=>d.fruits[f.key]).length,0),label:"ثمرات مجموع"},{icon:"📝",val:days.filter(d=>d.notes?.trim()).length,label:"خواطر مكتوبة"}].map((s,i)=>(
          <div key={i} style={{background:C.surf,borderRadius:16,padding:"14px 12px",textAlign:"center",border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:28}}>{s.icon}</div>
            <div style={{fontSize:24,fontWeight:900,color:C.g}}>{s.val}</div>
            <div style={{fontSize:12,color:C.muted}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-fruit progress bars */}
      <div style={{background:C.surf,borderRadius:18,padding:"18px 20px",border:`1px solid ${C.border}`,marginBottom:20}}>
        <h4 style={{fontSize:14,fontWeight:800,color:C.dark,marginBottom:16}}>الثمرات — نسبة الإنجاز</h4>
        {fruitTotals.map(f=>(
          <div key={f.key} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:13,fontWeight:700,color:C.mid}}>{f.icon} {f.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:f.color}}>{f.total} يوم ({f.pct}%)</span>
            </div>
            <div style={{height:8,background:"#EDE6DA",borderRadius:20,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${f.pct}%`,background:f.color,borderRadius:20,transition:"width .5s ease"}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Recent days */}
      <div style={{background:C.surf,borderRadius:18,padding:"18px 20px",border:`1px solid ${C.border}`}}>
        <h4 style={{fontSize:14,fontWeight:800,color:C.dark,marginBottom:14}}>آخر الأيام المسجّلة</h4>
        {days.slice(0,10).map(d=>{
          const done=FRUITS.filter(f=>d.fruits[f.key]).length;
          return(
            <div key={d.date} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontSize:13,fontWeight:700,color:C.mid,minWidth:80}}>{new Date(d.date+"T12:00:00").toLocaleDateString("ar-SA",{month:"short",day:"numeric"})}</div>
              <div style={{flex:1,display:"flex",gap:5}}>
                {FRUITS.map(f=><span key={f.key} title={f.label} style={{fontSize:16,opacity:d.fruits[f.key]?1:.2}}>{f.icon}</span>)}
              </div>
              <div style={{fontSize:12,fontWeight:700,color:done>=5?C.g:done>=3?C.gold:C.muted,background:done>=5?"#E8F5EE":done>=3?C.goldBg:"#F5F0EB",borderRadius:20,padding:"2px 10px"}}>{done}/7</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   LIBRARY ITEM CARD
══════════════════════════════════════════════════ */
function ItemCard({item,onClick,onToggleDone,allItems}){
  const T=TYPES[item.type]||TYPES.page;
  const vid=item.type==="video"?ytId(item.url):null;
  const thumb=vid?`https://img.youtube.com/vi/${vid}/mqdefault.jpg`:null;
  const related=allItems.filter(x=>x.id!==item.id&&sharedTags(x,item)>0).length;
  return(
    <div onClick={onClick} className="card-h" style={{background:C.surf,borderRadius:18,overflow:"hidden",border:`1px solid ${C.border}`,cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
      <div style={{height:140,background:`linear-gradient(135deg,${T.color}22,${T.color}44)`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        {thumb?<><img src={thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.45),transparent 60%)"}}/></>:<span style={{fontSize:44,opacity:.3}}>{T.icon}</span>}
        <div style={{position:"absolute",top:10,right:10}}><TypeBadge type={item.type} small/></div>
        <button onClick={e=>{e.stopPropagation();onToggleDone();}} style={{position:"absolute",bottom:10,left:10,background:item.done?C.gold:"rgba(0,0,0,.4)",color:"#fff",borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700,border:"none",cursor:"pointer",backdropFilter:"blur(4px)"}}>{item.done?"✓ تمّ":"قيد التعلم"}</button>
      </div>
      <div style={{padding:"14px 16px"}}>
        <h3 style={{fontSize:14,fontWeight:700,color:C.dark,lineHeight:1.7,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.title}</h3>
        {item.summary&&<p style={{fontSize:12,color:C.muted,lineHeight:1.8,marginBottom:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{item.summary}</p>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>{item.tags?.slice(0,3).map(t=><Tag key={t} label={t}/>)}{item.tags?.length>3&&<span style={{fontSize:11,color:C.muted}}>+{item.tags.length-3}</span>}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${C.border}`,paddingTop:8}}>
          <span style={{fontSize:11,color:C.muted}}>{fmtDate(item.dateAdded)}</span>
          <div style={{display:"flex",gap:8,fontSize:12,color:C.muted}}>
            {item.lessons?.length>0&&<span>💡{item.lessons.length}</span>}
            {related>0&&<span>🔗{related}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DETAIL VIEW
══════════════════════════════════════════════════ */
function DetailView({item,allItems,onBack,onUpdate,onDelete,onEdit}){
  const[tab,setTab]=useState("notes");
  const[notes,setNotes]=useState(item.notes||"");
  const[lessons,setLessons]=useState(item.lessons||[]);
  const[actions,setActions]=useState(item.actions||[]);
  const[newL,setNewL]=useState("");const[newA,setNewA]=useState("");
  const[saved,setSaved]=useState(false);
  const vid=item.type==="video"?ytId(item.url):null;
  const thumb=vid?`https://img.youtube.com/vi/${vid}/mqdefault.jpg`:null;
  const T=TYPES[item.type]||TYPES.page;
  const related=allItems.filter(x=>x.id!==item.id&&sharedTags(x,item)>=1).sort((a,b)=>sharedTags(b,item)-sharedTags(a,item)).slice(0,5);
  const persist=(o={})=>onUpdate({...item,notes,lessons,actions,...o});
  const saveNotes=()=>{persist();setSaved(true);setTimeout(()=>setSaved(false),1500);};
  const addL=()=>{if(!newL.trim())return;const u=[...lessons,newL.trim()];setLessons(u);setNewL("");persist({lessons:u});};
  const addA=()=>{if(!newA.trim())return;const u=[...actions,newA.trim()];setActions(u);setNewA("");persist({actions:u});};
  const TABS=[{id:"notes",icon:"📝",label:"ملاحظاتي"},{id:"lessons",icon:"💡",label:"الدروس"},{id:"actions",icon:"✅",label:"التطبيق"},{id:"connect",icon:"🔗",label:"الاتصالات"}];
  return(
    <div style={{maxWidth:840,margin:"0 auto",padding:"24px 20px 80px"}} className="fade">
      <button onClick={onBack} style={S.ghost}>→ العودة</button>
      <div style={{background:C.surf,borderRadius:22,overflow:"hidden",border:`1px solid ${C.border}`,margin:"18px 0 22px",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
        {thumb&&<div style={{height:220,position:"relative"}}><img src={thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.5),transparent 60%)"}}/>{item.url&&<a href={item.url} target="_blank" rel="noopener noreferrer" style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(0,0,0,.6)",color:"#fff",width:56,height:56,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,textDecoration:"none",border:"2px solid rgba(255,255,255,.3)"}}>▶</a>}</div>}
        {!thumb&&item.url&&<div style={{background:`linear-gradient(135deg,${T.color}18,${T.color}28)`,height:65,display:"flex",alignItems:"center",justifyContent:"center"}}><a href={item.url} target="_blank" rel="noopener noreferrer" style={{...S.primary,textDecoration:"none"}}>{T.icon} فتح الرابط</a></div>}
        <div style={{padding:"18px 22px"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <div style={{flex:1}}><div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}><TypeBadge type={item.type}/><span style={{background:C.g+"22",color:C.g,borderRadius:20,padding:"4px 14px",fontSize:12,fontWeight:700}}>{item.category}</span></div><h2 style={{fontSize:18,fontWeight:900,color:C.dark,lineHeight:1.6}}>{item.title}</h2></div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>onUpdate({...item,done:!item.done})} style={{...S.btn,background:item.done?C.gold:"#F0E8D8",color:item.done?"#fff":C.mid}}>{item.done?"✓ تمّ":"قيد التعلم"}</button>
              <button onClick={onEdit} style={{...S.btn,background:"#F0E8D8",color:C.mid}}>✏️</button>
              <button onClick={()=>{if(window.confirm("حذف؟"))onDelete(item.id);}} style={{...S.btn,background:C.redBg,color:C.red}}>🗑️</button>
            </div>
          </div>
          {item.summary&&<p style={{marginTop:10,color:C.mid,fontSize:14,lineHeight:1.9}}>{item.summary}</p>}
          {item.content&&<div style={{marginTop:10,color:C.mid,fontSize:14,lineHeight:1.9,background:"#FAFAF5",borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>{item.content}</div>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>{item.tags?.map(t=><Tag key={t} label={t}/>)}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:4,background:"#EDE6DA",borderRadius:14,padding:5,marginBottom:18}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 4px",borderRadius:10,fontSize:12,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"Cairo",background:tab===t.id?C.surf:"transparent",color:tab===t.id?C.g:C.muted,boxShadow:tab===t.id?"0 2px 8px rgba(0,0,0,.08)":"none",transition:"all .2s"}}>{t.icon} {t.label}</button>)}
      </div>
      <div style={{background:C.surf,borderRadius:20,padding:"22px 24px",border:`1px solid ${C.border}`}}>
        {tab==="notes"&&<div><p style={{fontSize:13,color:C.muted,marginBottom:10}}>أفكارك وتساؤلاتك</p><textarea dir="rtl" value={notes} onChange={e=>setNotes(e.target.value)} rows={10} placeholder="ملاحظاتك..." style={S.textarea}/><button onClick={saveNotes} style={{...S.primary,marginTop:12}}>{saved?"✓ تم":"حفظ"}</button></div>}
        {tab==="lessons"&&<div><p style={{fontSize:13,color:C.muted,marginBottom:10}}>ما الذي تعلمته؟</p><div style={{display:"flex",gap:8,marginBottom:12}}><input dir="rtl" value={newL} onChange={e=>setNewL(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addL()} placeholder="درس مستفاد..." style={{...S.input,flex:1}}/><button onClick={addL} style={S.primary}>+</button></div>{lessons.length===0?<div style={S.empty}>لا دروس بعد 💡</div>:lessons.map((l,i)=><div key={i} style={{...S.row,borderRight:`4px solid ${C.gold}`}}><span style={{color:C.gold}}>💡</span><span style={{flex:1,fontSize:13,lineHeight:1.8}}>{l}</span><button onClick={()=>{const u=lessons.filter((_,x)=>x!==i);setLessons(u);persist({lessons:u});}} style={S.del}>×</button></div>)}</div>}
        {tab==="actions"&&<div><p style={{fontSize:13,color:C.muted,marginBottom:10}}>الخطوات العملية</p><div style={{display:"flex",gap:8,marginBottom:12}}><input dir="rtl" value={newA} onChange={e=>setNewA(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addA()} placeholder="خطوة تطبيقية..." style={{...S.input,flex:1}}/><button onClick={addA} style={S.primary}>+</button></div>{actions.length===0?<div style={S.empty}>لا خطوات بعد ✅</div>:actions.map((a,i)=><div key={i} style={{...S.row,borderRight:`4px solid ${C.g}`}}><span style={{color:C.g}}>✅</span><span style={{flex:1,fontSize:13,lineHeight:1.8}}>{a}</span><button onClick={()=>{const u=actions.filter((_,x)=>x!==i);setActions(u);persist({actions:u});}} style={S.del}>×</button></div>)}</div>}
        {tab==="connect"&&<div><h4 style={{fontSize:14,fontWeight:800,color:C.dark,marginBottom:10}}>✨ مرتبطة بوسوم مشتركة</h4>{related.length===0?<div style={S.empty}>لا عناصر مرتبطة — أضف وسوماً مشتركة</div>:related.map(x=><div key={x.id} style={{...S.row,cursor:"pointer"}} onClick={()=>onBack(x)}><TypeBadge type={x.type} small/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{x.title}</div><div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>{x.tags?.filter(t=>item.tags?.includes(t)).map(t=><Tag key={t} label={t} active small/>)}</div></div><span style={{fontSize:11,color:C.muted,background:C.goldBg,borderRadius:20,padding:"2px 8px"}}>{sharedTags(x,item)} مشترك</span></div>)}</div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   TAG MAP
══════════════════════════════════════════════════ */
function TagMap({items,onSelectItem}){
  const[hover,setHover]=useState(null);
  const W=700,H=460;
  const tg=useMemo(()=>{const m={};items.forEach(x=>(x.tags||[]).forEach(t=>{if(!m[t])m[t]=[];m[t].push(x);}));return Object.entries(m);},[items]);
  const nodes=tg.map(([tag,ti],i)=>{const a=(i/tg.length)*2*Math.PI-Math.PI/2;const r=Math.min(W,H)*.31;return{tag,items:ti,x:W/2+r*Math.cos(a),y:H/2+r*Math.sin(a),size:18+ti.length*5};});
  if(!items.length)return<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{fontSize:60}}>🗺️</div><p style={{color:C.muted,fontSize:15,marginTop:16}}>أضف محتوى لترى الخريطة</p></div>;
  if(!tg.length)return<div style={{textAlign:"center",padding:"80px 20px"}}><div style={{fontSize:60}}>🏷️</div><p style={{color:C.muted,fontSize:15,marginTop:16}}>أضف وسوماً لعناصرك</p></div>;
  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"24px 20px 80px"}} className="fade">
      <div style={{background:C.surf,borderRadius:22,padding:"16px 20px",border:`1px solid ${C.border}`,marginBottom:18}}>
        <h3 style={{fontSize:16,fontWeight:800,color:C.dark}}>🗺️ خريطة المعرفة</h3>
        <p style={{fontSize:12,color:C.muted}}>مرّر على وسم لترى محتواه</p>
      </div>
      <div style={{background:C.surf,borderRadius:22,border:`1px solid ${C.border}`,overflow:"hidden"}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block"}}>
          {nodes.map((a,i)=>nodes.slice(i+1).map(b=>{const s=a.items.filter(x=>b.items.find(y=>y.id===x.id)).length;if(!s)return null;return<line key={`${a.tag}-${b.tag}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.g} strokeWidth={Math.min(s*1.5,4)} strokeOpacity={.12}/>;}))}
          <circle cx={W/2} cy={H/2} r={38} fill={C.g} opacity={.07}/><circle cx={W/2} cy={H/2} r={22} fill={C.g} opacity={.13}/>
          <text x={W/2} y={H/2+5} textAnchor="middle" fill={C.g} fontSize={18} fontFamily="Cairo">🌿</text>
          {nodes.map(n=>{const h=hover===n.tag;return(
            <g key={n.tag} onMouseEnter={()=>setHover(n.tag)} onMouseLeave={()=>setHover(null)} style={{cursor:"pointer"}}>
              <line x1={W/2} y1={H/2} x2={n.x} y2={n.y} stroke={C.g} strokeWidth={.8} strokeOpacity={.18}/>
              <circle cx={n.x} cy={n.y} r={n.size+(h?6:0)} fill={h?C.g:C.goldBg} stroke={h?C.gL:C.gold} strokeWidth={h?2:1.5} style={{transition:"all .2s",filter:h?"drop-shadow(0 4px 12px rgba(26,82,53,.3))":"none"}}/>
              <text x={n.x} y={n.y-2} textAnchor="middle" fill={h?"#fff":C.mid} fontSize={Math.min(n.size*.65,13)} fontFamily="Cairo" fontWeight="700">#{n.tag}</text>
              <text x={n.x} y={n.y+12} textAnchor="middle" fill={h?"rgba(255,255,255,.8)":C.muted} fontSize={10} fontFamily="Cairo">{n.items.length}</text>
            </g>
          );})}
        </svg>
        {hover&&(()=>{const n=nodes.find(x=>x.tag===hover);if(!n)return null;return(
          <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 20px",background:C.bg}}>
            <h4 style={{fontSize:13,fontWeight:800,color:C.dark,marginBottom:10}}>#{hover}</h4>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{n.items.map(x=><div key={x.id} onClick={()=>onSelectItem(x)} style={{display:"flex",alignItems:"center",gap:6,background:C.surf,borderRadius:10,padding:"5px 12px",border:`1px solid ${C.border}`,fontSize:12,cursor:"pointer"}}><TypeBadge type={x.type} small/><span>{x.title}</span></div>)}</div>
          </div>
        );})()}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ITEM FORM
══════════════════════════════════════════════════ */
function ItemForm({initial,onSave,onClose}){
  const[form,setForm]=useState({type:initial?.type||"video",title:initial?.title||"",url:initial?.url||"",category:initial?.category||CATS[0],tags:initial?.tags?.join("، ")||"",summary:initial?.summary||"",content:initial?.content||""});
  const up=(k,v)=>setForm(f=>({...f,[k]:v}));
  const T=TYPES[form.type];const vid=ytId(form.url);
  const submit=()=>{if(!form.title.trim()){alert("أدخل عنواناً");return;}onSave({...form,tags:form.tags?form.tags.split(/[،,\s]+/).map(t=>t.trim()).filter(Boolean):[]});};
  return(
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={S.modal}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h2 style={{fontSize:17,fontWeight:900,color:C.dark}}>{initial?"✏️ تعديل":"➕ إضافة محتوى"}</h2><button onClick={onClose} style={{...S.ghost,fontSize:22}}>×</button></div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {Object.entries(TYPES).map(([k,t])=><button key={k} onClick={()=>up("type",k)} style={{flex:1,padding:"8px 4px",borderRadius:10,fontSize:11,fontWeight:700,fontFamily:"Cairo",cursor:"pointer",border:`2px solid ${form.type===k?t.color:C.border}`,background:form.type===k?t.bg:C.surf,color:form.type===k?t.color:C.muted,transition:"all .15s"}}>{t.icon}<br/>{t.label}</button>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div><label style={S.label}>العنوان *</label><input dir="rtl" value={form.title} onChange={e=>up("title",e.target.value)} placeholder={`عنوان ${T.label}...`} style={S.input}/></div>
          {(form.type==="video"||form.type==="link"||form.type==="pdf")&&<div><label style={S.label}>{form.type==="video"?"رابط يوتيوب":"الرابط"}</label><input dir="ltr" value={form.url} onChange={e=>up("url",e.target.value)} placeholder="https://..." style={{...S.input,textAlign:"left"}}/>{vid&&<img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt="" style={{width:"100%",borderRadius:8,marginTop:6,maxHeight:90,objectFit:"cover"}}/>}</div>}
          {form.type==="page"&&<div><label style={S.label}>المحتوى</label><textarea dir="rtl" value={form.content} onChange={e=>up("content",e.target.value)} rows={4} placeholder="اكتب صفحتك هنا..." style={S.textarea}/></div>}
          <div><label style={S.label}>التصنيف</label><select dir="rtl" value={form.category} onChange={e=>up("category",e.target.value)} style={S.input}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div><label style={S.label}>الوسوم (بفاصلة)</label><input dir="rtl" value={form.tags} onChange={e=>up("tags",e.target.value)} placeholder="النفس، التطوير، الأسرة..." style={S.input}/>{form.tags&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:6}}>{form.tags.split(/[،,\s]+/).filter(Boolean).map(t=><Tag key={t} label={t}/>)}</div>}</div>
          <div><label style={S.label}>ملخص</label><textarea dir="rtl" value={form.summary} onChange={e=>up("summary",e.target.value)} rows={2} placeholder="عمَّ يتحدث؟" style={{...S.textarea,minHeight:60}}/></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={S.ghost}>إلغاء</button>
          <button onClick={submit} style={S.primary}>{initial?"حفظ التعديلات":"إضافة"}</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   AI ASSISTANT — CLAUDE
══════════════════════════════════════════════════ */
const AI_SYSTEM = `أنت مساعد شخصي ذكي متخصص في مساعدة المستخدم على الاستفادة من محتوى قناة مكاني (فقه النفس) بقيادة د. عبدالرحمن زاكر الهاشمي.

دورك:
1. مساعدة المستخدم في استخلاص الدروس والفوائد من المحتوى الذي يتعلمه
2. تعمق خواطره اليومية بأسئلة تأملية
3. ربط المحتوى ببعضه وإيجاد الخيط المشترك
4. اقتراح خطوات تطبيقية عملية من مبدأ "أقل القليل"
5. التشجيع على الاستمرار وتزكية النفس

أسلوبك: دافئ، إسلامي، عميق، عملي. تستخدم أمثلة من القرآن والسنة عند الحاجة. ردودك موجزة وواضحة. تتحدث بالعربية الفصحى المُيسَّرة.

قيم مكاني الأساسية: فقه النفس، تزكية النفس، الاستخلاف، العلاقات السوية، الإنتاجية من منظور إسلامي.`;

const AI_MODES = [
  {id:"free",    icon:"💬", label:"محادثة حرة",     prompt:""},
  {id:"reflect", icon:"🌙", label:"تأمل في يومي",   prompt:"ساعدني أتأمل في يومي وأستخلص منه فوائد. اسألني أسئلة موجهة لتعميق خواطري — سؤالاً واحداً في كل مرة."},
  {id:"lessons", icon:"💡", label:"استخلص دروساً",  prompt:"سأعطيك عنوان محتوى أو موضوع، ساعدني أستخلص منه دروساً عملية لحياتي اليومية."},
  {id:"connect", icon:"🔗", label:"اربط المعرفة",   prompt:"سأعطيك عناوين محتوى من مكتبتي، ساعدني أرى الخيط المشترك بينها وكيف تكمل بعضها."},
  {id:"plan",    icon:"📋", label:"خطط بـ أقل القليل", prompt:"ساعدني أحول ما تعلمته إلى خطوة واحدة صغيرة أطبقها اليوم — من مبدأ أقل القليل مما لا يسعني جهله."},
];

function AIAssistant({context}){
  const[open,setOpen]=useState(false);
  const[mode,setMode]=useState(null);
  const[msgs,setMsgs]=useState([]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState(null);
  const endRef=useRef(null);
  const inputRef=useRef(null);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);
  useEffect(()=>{if(open&&mode)inputRef.current?.focus();},[open,mode]);

  const startMode=m=>{
    setMode(m);
    setMsgs([]);
    setError(null);
    if(m.prompt){
      const sys={role:"assistant",content:`بسم الله 🌿\n\n${m.id==="reflect"?"أهلاً. سأساعدك تتأمل في يومك. دعنا نبدأ:\n\nما أبرز شيء حدث معك اليوم — صغيراً كان أم كبيراً؟":m.id==="lessons"?"أهلاً. أعطني عنوان الفيديو أو الموضوع الذي تريد استخلاص دروسه:":m.id==="connect"?"أهلاً. أعطني عناوين المحتوى الذي تريد ربطه (يمكنك وضعها في سطور):":"أهلاً. أخبرني: ما الذي تعلمته مؤخراً وتريد تطبيقه؟"}`};
      setMsgs([sys]);
    }else{
      setMsgs([{role:"assistant",content:"بسم الله 🌿\nكيف يمكنني مساعدتك اليوم؟"}]);
    }
  };

  const send=useCallback(async()=>{
    const txt=input.trim();if(!txt||loading)return;
    const newMsgs=[...msgs,{role:"user",content:txt}];
    setMsgs(newMsgs);setInput("");setLoading(true);setError(null);
    try{
      // Build context string
      const ctxNote=context?`\n\n[سياق المستخدم الحالي: ${context}]`:"";
      const sysWithCtx=AI_SYSTEM+ctxNote+(mode?.prompt?`\n\nمهمتك الحالية: ${mode.prompt}`:"");

      const resp=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:sysWithCtx,
          messages:newMsgs.filter(m=>m.role==="user"||m.role==="assistant").map(m=>({role:m.role,content:m.content}))
        })
      });
      if(!resp.ok)throw new Error(`خطأ ${resp.status}`);
      const data=await resp.json();
      const reply=data.content?.find(b=>b.type==="text")?.text||"لم أتلقَّ رداً.";
      setMsgs(m=>[...m,{role:"assistant",content:reply}]);
    }catch(e){setError("تعذّر الاتصال — تأكد من الاتصال بالإنترنت");console.error(e);}
    setLoading(false);
  },[input,msgs,loading,context,mode]);

  const handleKey=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};

  const reset=()=>{setMode(null);setMsgs([]);setInput("");setError(null);};

  if(!open)return(
    <button onClick={()=>setOpen(true)} style={{position:"fixed",bottom:24,left:24,width:58,height:58,borderRadius:"50%",background:`linear-gradient(135deg,${C.g},${C.gXL})`,border:"3px solid rgba(255,255,255,.3)",boxShadow:"0 6px 24px rgba(26,82,53,.4)",cursor:"pointer",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",zIndex:900,transition:"transform .2s"}} title="مساعد مكاني">🤖</button>
  );

  return(
    <div style={{position:"fixed",bottom:0,left:0,top:0,width:Math.min(400,window.innerWidth),background:C.surf,boxShadow:"-4px 0 32px rgba(0,0,0,.15)",zIndex:900,display:"flex",flexDirection:"column",borderRight:`1px solid ${C.border}`}} className="ai-panel">
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,#0F2518,${C.g})`,padding:"16px 18px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
        <div style={{flex:1}}>
          <div style={{color:"#fff",fontWeight:800,fontSize:14}}>مساعد مكاني</div>
          <div style={{color:"rgba(255,255,255,.6)",fontSize:11}}>مدعوم بـ Claude</div>
        </div>
        {mode&&<button onClick={reset} style={{background:"rgba(255,255,255,.12)",color:"rgba(255,255,255,.7)",border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,cursor:"pointer",fontFamily:"Cairo"}}>تغيير</button>}
        <button onClick={()=>setOpen(false)} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",fontSize:16,cursor:"pointer",lineHeight:1}}>×</button>
      </div>

      {/* Mode picker */}
      {!mode&&(
        <div style={{flex:1,padding:"20px 16px",overflowY:"auto"}}>
          <p style={{fontSize:13,color:C.muted,marginBottom:16,textAlign:"center",lineHeight:1.9}}>اختر كيف تريد أساعدك اليوم</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {AI_MODES.map(m=>(
              <button key={m.id} onClick={()=>startMode(m)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,border:`1.5px solid ${C.border}`,background:"#FAFAF5",cursor:"pointer",textAlign:"right",fontFamily:"Cairo",transition:"all .15s"}}>
                <span style={{fontSize:26,flexShrink:0}}>{m.icon}</span>
                <div><div style={{fontSize:14,fontWeight:700,color:C.dark}}>{m.label}</div></div>
                <span style={{marginRight:"auto",color:C.muted,fontSize:16}}>←</span>
              </button>
            ))}
          </div>
          {context&&<div style={{marginTop:16,background:C.goldBg,borderRadius:12,padding:"10px 14px",border:`1px solid ${C.border}`}}><p style={{fontSize:11,color:C.mid}}>📍 سياق: {context}</p></div>}
        </div>
      )}

      {/* Chat */}
      {mode&&(
        <>
          <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
            {/* Mode badge */}
            <div style={{textAlign:"center"}}><span style={{background:C.goldBg,color:C.gold,borderRadius:20,padding:"4px 14px",fontSize:11,fontWeight:700,border:`1px solid ${C.border}`}}>{mode.icon} {mode.label}</span></div>

            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-start":"flex-end",gap:2}}>
                <div style={{maxWidth:"88%",background:m.role==="user"?C.g:"#F4EFE8",color:m.role==="user"?"#fff":C.dark,borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap",wordBreak:"break-word",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading&&(
              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <div style={{background:"#F4EFE8",borderRadius:"18px 18px 18px 4px",padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}} className="typing">
                  <span/><span/><span/>
                </div>
              </div>
            )}
            {error&&<div style={{background:C.redBg,color:C.red,borderRadius:10,padding:"8px 12px",fontSize:12,textAlign:"center"}}>{error}</div>}
            <div ref={endRef}/>
          </div>

          {/* Input */}
          <div style={{padding:"12px 14px",borderTop:`1px solid ${C.border}`,background:"#FAFAF5",flexShrink:0}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <textarea dir="rtl" ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} rows={2} placeholder="اكتب رسالتك... (Enter للإرسال)" disabled={loading} style={{flex:1,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${C.border}`,background:C.surf,fontFamily:"Cairo",fontSize:13,resize:"none",lineHeight:1.7,maxHeight:100,outline:"none"}}/>
              <button onClick={send} disabled={loading||!input.trim()} style={{width:40,height:40,borderRadius:12,background:loading||!input.trim()?"#EDE6DA":C.g,color:"#fff",border:"none",cursor:loading||!input.trim()?"default":"pointer",fontSize:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s"}}>↑</button>
            </div>
            <p style={{fontSize:10,color:C.muted,marginTop:6,textAlign:"center"}}>Shift+Enter لسطر جديد</p>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════ */
export default function MakanyHub(){
  // Library state
  const[items,setItems]=useState([]);
  // Planner state: allDays = {date: DayEntry}, allMonths = {month: MonthGoals}
  const[allDays,setAllDays]=useState({});
  const[allMonths,setAllMonths]=useState({});
  const[loading,setLoading]=useState(true);

  // Nav
  const[mainView,setMainView]=useState("library"); // library | planner | map
  const[plannerTab,setPlannerTab]=useState("daily"); // daily | monthly | progress
  const[libView,setLibView]=useState("grid"); // grid | detail

  // Library
  const[selected,setSelected]=useState(null);
  const[showForm,setShowForm]=useState(false);
  const[editTarget,setEditTarget]=useState(null);
  const[search,setSearch]=useState("");
  const[typeFilter,setTypeFilter]=useState("all");
  const[tagFilter,setTagFilter]=useState(null);
  const[doneFilter,setDoneFilter]=useState("all");

  // Planner
  const[currentDate,setCurrentDate]=useState(todayStr());
  const[currentMonth,setCurrentMonth]=useState(monthStr());

  /* ── Persistence ── */
  useEffect(()=>{
    (async()=>{
      try{
        const[r1,r2,r3]=await Promise.allSettled([
          storage.get("mkn_items_v2"),
          storage.get("mkn_days_v1"),
          storage.get("mkn_months_v1"),
        ]);
        if(r1.status==="fulfilled"&&r1.value?.value)setItems(JSON.parse(r1.value.value));
        if(r2.status==="fulfilled"&&r2.value?.value)setAllDays(JSON.parse(r2.value.value));
        if(r3.status==="fulfilled"&&r3.value?.value)setAllMonths(JSON.parse(r3.value.value));
      }catch(e){}
      setLoading(false);
    })();
  },[]);

  const saveItems=v=>{setItems(v);try{storage.set("mkn_items_v2",JSON.stringify(v));}catch{}};
  const saveDays=v=>{setAllDays(v);try{storage.set("mkn_days_v1",JSON.stringify(v));}catch{}};
  const saveMonths=v=>{setAllMonths(v);try{storage.set("mkn_months_v1",JSON.stringify(v));}catch{}};

  // Library ops
  const addItem=d=>saveItems([{...d,id:genId(),dateAdded:new Date().toISOString(),done:false,notes:"",lessons:[],actions:[],continueWith:[]},...items]);
  const updateItem=u=>{const nv=items.map(x=>x.id===u.id?u:x);saveItems(nv);if(selected?.id===u.id)setSelected(u);};
  const deleteItem=id=>{saveItems(items.filter(x=>x.id!==id));setLibView("grid");setSelected(null);};

  // Planner ops
  const getDay=date=>allDays[date]||emptyDay(date);
  const setDay=(date,updFn)=>{
    const cur=getDay(date);
    const updated=typeof updFn==="function"?updFn(cur):updFn;
    const nv={...allDays,[date]:updated};
    saveDays(nv);
  };
  const getMonth=m=>allMonths[m]||emptyMonth(m);
  const setMonth=(m,updFn)=>{
    const cur=getMonth(m);
    const updated=typeof updFn==="function"?updFn(cur):updFn;
    const nv={...allMonths,[m]:updated};
    saveMonths(nv);
  };

  /* ── Derived ── */
  const allTags=useMemo(()=>{const s=new Set();items.forEach(x=>x.tags?.forEach(t=>s.add(t)));return[...s].sort();},[items]);
  const filtered=useMemo(()=>{
    const q=search.toLowerCase();
    return items.filter(x=>{
      const ms=!search||x.title.includes(q)||x.summary?.includes(q)||x.tags?.some(t=>t.includes(q));
      const mt=typeFilter==="all"||x.type===typeFilter;
      const mg=!tagFilter||x.tags?.includes(tagFilter);
      const md=doneFilter==="all"||(doneFilter==="done"?x.done:!x.done);
      return ms&&mt&&mg&&md;
    });
  },[items,search,typeFilter,tagFilter,doneFilter]);

  const todayDay=getDay(todayStr());
  const fruitsDoneToday=FRUITS.filter(f=>todayDay.fruits[f.key]).length;
  const stats={total:items.length,done:items.filter(x=>x.done).length,lessons:items.reduce((a,x)=>a+(x.lessons?.length||0),0),fruits:fruitsDoneToday};

  const NAV=[
    {id:"library",icon:"📚",label:"المكتبة"},
    {id:"planner",icon:"📓",label:"مذكرتي"},
    {id:"map",icon:"🗺️",label:"الخريطة"},
  ];
  const PLANNER_TABS=[
    {id:"daily",icon:"📅",label:"اليوم"},
    {id:"monthly",icon:"🌙",label:"الشهر"},
    {id:"progress",icon:"📊",label:"التقدم"},
  ];

  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,flexDirection:"column",gap:12,fontFamily:"Cairo"}}>
      <style>{CSS}</style>
      <div style={{fontSize:44}}>🌿</div>
      <div style={{color:C.g,fontSize:16,fontWeight:700}}>جارٍ التحميل...</div>
    </div>
  );

  return(
    <div dir="rtl" style={{fontFamily:"Cairo,sans-serif",background:C.bg,minHeight:"100vh"}}>
      <style>{CSS}</style>

      {/* ══ HEADER ══ */}
      <header style={{background:`linear-gradient(140deg,#0F2518 0%,${C.g} 55%,${C.gL} 100%)`,padding:"20px 20px 0",position:"relative",overflow:"hidden"}}>
        <GeoPat/>
        <div style={{maxWidth:900,margin:"0 auto",position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,paddingBottom:16}}>
            <div>
              <h1 style={{fontSize:26,fontWeight:900,color:"#fff"}}>مكاني 🌿</h1>
              <p style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:2}}>قاعدة معرفتي الشخصية — فقه النفس</p>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Stat icon="📚" val={stats.total} label="محتوى"/>
              <Stat icon="✅" val={stats.done} label="مكتمل"/>
              <Stat icon="💡" val={stats.lessons} label="دروس"/>
              <Stat icon="🌾" val={`${stats.fruits}/7`} label="ثمرات اليوم"/>
            </div>
          </div>

          {/* Main Nav */}
          <div style={{display:"flex",gap:2,borderTop:"1px solid rgba(255,255,255,.12)",paddingTop:12}}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>{setMainView(n.id);if(n.id==="library")setLibView("grid");}} style={{padding:"8px 20px",borderRadius:"12px 12px 0 0",fontSize:13,fontWeight:700,fontFamily:"Cairo",cursor:"pointer",border:"none",transition:"all .2s",background:mainView===n.id?"rgba(255,255,255,.15)":"transparent",color:mainView===n.id?"#fff":"rgba(255,255,255,.55)",backdropFilter:mainView===n.id?"blur(8px)":"none",borderBottom:mainView===n.id?"2px solid rgba(255,255,255,.4)":"2px solid transparent"}}>{n.icon} {n.label}</button>
            ))}
            {mainView==="library"&&(
              <button onClick={()=>{setEditTarget(null);setShowForm(true);}} style={{marginRight:"auto",padding:"8px 20px",borderRadius:"12px 12px 0 0",fontSize:13,fontWeight:700,fontFamily:"Cairo",cursor:"pointer",border:"none",background:C.gold,color:"#fff"}}>+ إضافة</button>
            )}
          </div>

          {/* Planner sub-nav */}
          {mainView==="planner"&&(
            <div style={{display:"flex",gap:2,paddingTop:4,paddingBottom:0}}>
              {PLANNER_TABS.map(t=>(
                <button key={t.id} onClick={()=>setPlannerTab(t.id)} style={{padding:"6px 18px",borderRadius:"10px 10px 0 0",fontSize:12,fontWeight:700,fontFamily:"Cairo",cursor:"pointer",border:"none",transition:"all .2s",background:plannerTab===t.id?"rgba(255,255,255,.12)":"transparent",color:plannerTab===t.id?"rgba(255,255,255,.95)":"rgba(255,255,255,.5)",borderBottom:plannerTab===t.id?"2px solid rgba(255,255,255,.3)":"2px solid transparent"}}>{t.icon} {t.label}</button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ══ LIBRARY ══ */}
      {mainView==="library"&&libView==="grid"&&(
        <main style={{maxWidth:900,margin:"0 auto",padding:"22px 20px 80px"}}>
          <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
            <input dir="rtl" placeholder="🔍 ابحث في مكتبتك..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,flex:1,minWidth:180}}/>
            <select dir="rtl" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{...S.input,width:"auto"}}>
              <option value="all">كل الأنواع</option>
              {Object.entries(TYPES).map(([k,t])=><option key={k} value={k}>{t.icon} {t.label}</option>)}
            </select>
            <select dir="rtl" value={doneFilter} onChange={e=>setDoneFilter(e.target.value)} style={{...S.input,width:"auto"}}>
              <option value="all">الكل</option><option value="done">مكتمل</option><option value="pending">قيد التعلم</option>
            </select>
          </div>
          {allTags.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}><Tag label="الكل" active={!tagFilter} onClick={()=>setTagFilter(null)}/>{allTags.map(t=><Tag key={t} label={t} active={tagFilter===t} onClick={()=>setTagFilter(tagFilter===t?null:t)}/>)}</div>}
          {filtered.length===0?(
            <div style={{textAlign:"center",padding:"80px 20px"}}>
              <div style={{fontSize:60}}>📚</div>
              <p style={{color:C.muted,fontSize:15,marginTop:16,lineHeight:2}}>{items.length===0?"أضف أول محتوى لمكتبتك 🌿":"لا نتائج"}</p>
              {items.length===0&&<button onClick={()=>{setEditTarget(null);setShowForm(true);}} style={{...S.primary,marginTop:18,padding:"12px 28px",fontSize:15}}>+ أضف الآن</button>}
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:18}}>
              {filtered.map(x=><ItemCard key={x.id} item={x} allItems={items} onClick={()=>{setSelected(x);setLibView("detail");}} onToggleDone={()=>updateItem({...x,done:!x.done})}/>)}
            </div>
          )}
        </main>
      )}

      {/* ══ LIBRARY DETAIL ══ */}
      {mainView==="library"&&libView==="detail"&&selected&&(
        <DetailView item={selected} allItems={items}
          onBack={alt=>{if(alt?.id)setSelected(alt);else setLibView("grid");}}
          onUpdate={updateItem} onDelete={deleteItem}
          onEdit={()=>{setEditTarget(selected);setShowForm(true);}}
        />
      )}

      {/* ══ PLANNER ══ */}
      {mainView==="planner"&&plannerTab==="daily"&&(
        <DailyView
          day={getDay(currentDate)}
          setDay={updFn=>setDay(currentDate,updFn)}
          allItems={items}
          dateStr={currentDate}
          onDateChange={setCurrentDate}
        />
      )}
      {mainView==="planner"&&plannerTab==="monthly"&&(
        <MonthlyView
          goals={getMonth(currentMonth)}
          setGoals={updFn=>setMonth(currentMonth,updFn)}
          monthKey={currentMonth}
          onMonthChange={setCurrentMonth}
          allDays={allDays}
        />
      )}
      {mainView==="planner"&&plannerTab==="progress"&&(
        <ProgressView allDays={allDays}/>
      )}

      {/* ══ MAP ══ */}
      {mainView==="map"&&<TagMap items={items} onSelectItem={x=>{setSelected(x);setMainView("library");setLibView("detail");}}/>}

      {/* ══ AI ASSISTANT ══ */}
      <AIAssistant context={
        mainView==="planner"&&plannerTab==="daily"
          ? `المذكرة اليومية — ${new Date(currentDate+"T12:00:00").toLocaleDateString("ar-SA",{weekday:"long",day:"numeric",month:"long"})}`
          : mainView==="planner"&&plannerTab==="monthly"
          ? `مقاصد شهر ${fmtMonthAr(currentMonth)}`
          : mainView==="library"&&libView==="detail"&&selected
          ? `مشاهدة: ${selected.title} (${TYPES[selected.type]?.label})`
          : mainView==="library"
          ? `المكتبة — ${items.length} عنصر`
          : null
      }/>

      {/* ══ FORM ══ */}
      {showForm&&(
        <ItemForm initial={editTarget}
          onSave={d=>{if(editTarget)updateItem({...editTarget,...d});else addItem(d);setShowForm(false);setEditTarget(null);}}
          onClose={()=>{setShowForm(false);setEditTarget(null);}}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SHARED STYLES
══════════════════════════════════════════════════ */
const S={
  primary:{background:C.g,color:"#fff",borderRadius:10,padding:"10px 22px",fontSize:14,fontWeight:700,fontFamily:"Cairo",border:"none",cursor:"pointer"},
  ghost:{background:"transparent",color:C.mid,borderRadius:10,padding:"8px 16px",fontSize:14,fontWeight:600,fontFamily:"Cairo",border:`1px solid ${C.border}`,cursor:"pointer"},
  btn:{borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,fontFamily:"Cairo",border:"none",cursor:"pointer"},
  input:{width:"100%",padding:"11px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:"#FAFAF5",fontFamily:"Cairo",fontSize:14,color:C.dark,outline:"none"},
  textarea:{width:"100%",padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:"#FAFAF5",fontFamily:"Cairo",fontSize:14,color:C.dark,resize:"vertical",lineHeight:1.9},
  label:{display:"block",fontSize:13,fontWeight:700,color:C.mid,marginBottom:6},
  overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16,backdropFilter:"blur(6px)"},
  modal:{background:C.surf,borderRadius:22,padding:"24px 26px",width:"100%",maxWidth:530,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.25)",animation:"slideUp .3s ease"},
  row:{display:"flex",gap:10,alignItems:"center",background:"#FAFAF5",borderRadius:12,padding:"10px 14px",border:`1px solid ${C.border}`,marginBottom:8},
  del:{color:C.muted,background:"none",border:"none",fontSize:20,cursor:"pointer",lineHeight:1,flexShrink:0},
  empty:{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:14},
};
