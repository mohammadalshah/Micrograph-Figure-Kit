// =====================================================================
// Micrograph Figure Kit — 25. Interface language (EN / RU)
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Translates the page text in place; the English text is restored on switching back.
// =====================================================================
(function(){
const RU=I18N_RU;
const PAT=[
[/^Group (\d+) · (\d+)$/,m=>`Группа ${m[1]} · ${m[2]}`],
[/^(.+?): (.+?) is too large to open \(over 500 MB or 500 images when unpacked\)\.$/,m=>`${m[1]}: файл ${m[2]} слишком велик для открытия (более 500 МБ или 500 рисунков после распаковки).`],
[/^(.+?): (.+?) is not a Word \.docx file\.$/,m=>`${m[1]}: ${m[2]} не является файлом Word .docx.`],
[/^Could not open the session: (.+?)\.? Your current work was kept\.$/,m=>`Не удалось открыть сеанс: ${m[1]}. Текущая работа сохранена.`],
[/^Could not open the session: (.+)$/,m=>`Не удалось открыть сеанс: ${m[1]}`],
[/^ZIP: (.+)$/,m=>`ZIP: ${m[1]}`],
[/^(\d+) file\(s\) • ready: (\d+)(?: • errors: (\d+))?$/,(m)=>`${m[1]} файл(ов) • готово: ${m[2]}`+(m[3]?` • ошибок: ${m[3]}`:'')],
[/^(\d+) panel\(s\) • (.+) cm at (\d+) dpi$/,m=>`${m[1]} панел(ей) • ${m[2]} см, ${m[3]} dpi`],
[/^(\d+) map\(s\)( \+ electron image)? • (.+) cm at (\d+) dpi$/,m=>`${m[1]} карт(ы)${m[2]?' + электронный рисунок':''} • ${m[3]} см, ${m[4]} dpi`],
[/^Theme imported: (.+)\. Press Apply to use it\.$/,m=>`Тема импортирована: ${m[1]}. Нажмите «Применить».`],
[/^(\d+) PNG file\(s\) saved separately to (.+)\.$/,m=>`${m[1]} PNG сохранено в ${m[2]}.`],
[/^(\d+) separate PNG download\(s\) started\. If asked, allow multiple downloads\.$/,m=>`Начато скачивание ${m[1]} PNG. Если браузер спросит, разрешите несколько загрузок.`],
[/^Process new \((\d+)\)$/,m=>`Обработать новые (${m[1]})`],
[/^(.+) \/ system$/,m=>`${m[1]} / системный`],[/^(.+) \/ not confirmed$/,m=>`${m[1]} / не подтверждён`],[/^(.+) \/ imported$/,m=>`${m[1]} / импортирован`],
[/^Auto read failed \(OCR: “(.*)”\)\. Enter the source scale in Calibration below and click Apply calibration\.$/,m=>`Распознать не удалось (OCR: «${m[1]}»). Введите исходный масштаб в блоке «Калибровка» и нажмите «Применить калибровку».`],
[/^Auto read failed \(OCR: “(.*)”\)\. The bar was found \((\d+)px\); enter the source scale in Calibration below and click Apply calibration\.$/,m=>`Распознать не удалось (OCR: «${m[1]}»). Шкала найдена (${m[2]} пкс); введите исходный масштаб в блоке «Калибровка» и нажмите «Применить калибровку».`],
[/^(\d+) selected — aligned to the first one you picked \(thick outline\)\.$/,m=>`Выбрано: ${m[1]} — выравнивание по первой выбранной панели (толстая рамка).`],
[/^Dashed (.+)$/,m=>'Пунктир: '+(RU[m[1]]||m[1]).toLowerCase()],
[/^Reading labels (\d+)\/(\d+)$/,m=>`Чтение подписей ${m[1]}/${m[2]}`],
[/^Reading spectrum (\d+)\/(\d+), pass (\d+)$/,m=>`Чтение спектра ${m[1]}/${m[2]}, проход ${m[3]}`],
[/^Read (\d+) element\(s\)(?: in (at|wt)\.%)? from the spectrum\. Please check the values\.$/,m=>`Из спектра прочитано элементов: ${m[1]}${m[2]?(m[2]==='at'?', ат.%':', мас.%'):''}. Проверьте значения.`],
];
const PREFIX=[['Saved: ','Сохранено: '],['Save failed: ','Ошибка сохранения: '],['Theme applied: ','Тема применена: '],['Theme deleted: ','Тема удалена: '],['Theme updated: ','Тема обновлена: '],['Theme saved: ','Тема сохранена: '],['Output folder selected: ','Выбрана папка: '],['Folder selection failed: ','Не удалось выбрать папку: '],['Manual source scale applied: ','Применён исходный масштаб: '],['Processing finished: ','Обработка завершена: '],['Output folder: ','Папка сохранения: '],['Imported: ','Импортировано: '],['Copied to ','Скопировано на '],['Scale read from the map: ','Масштаб с карты: '],['Scale read from the electron image: ','Масштаб с электронного рисунка: '],['Reading failed: ','Ошибка чтения: '],['Skipped ','Пропущено '],['Font: ','Шрифт: '],['Example: ','Пример: '],['Read ','Прочитано ']];
const norm=s=>s.replace(/\s+/g,' ').trim();
function tr(s){
  const k=norm(s); if (!k) return null;
  if (RU[k]!=null) return RU[k];
  for (const [re,f] of PAT) { const m=k.match(re); if (m) return f(m); }
  for (const [a,b] of PREFIX) if (k.startsWith(a) && k.length>a.length) { const rest=k.slice(a.length); return b+(RU[rest]??rest); }
  return null;
}
const INL=new Set(['B','I','U','S','CODE','SUP','SUB','BR','STRONG','EM','A']);
const SKIP=new Set(['SCRIPT','STYLE','CANVAS','TEXTAREA','svg','SVG']);
const done=new Set(); let lang='en';
function inlineOnly(el){ if (!el.firstElementChild) return false; for (const c of el.children) { if (!INL.has(c.tagName) || c.id || c.querySelector('[id]')) return false; } return true; }
function doAttrs(el){
  for (const a of ['title','placeholder','aria-label']) { const v=el.getAttribute(a); if (!v) continue;
    const st=el.__i18a||(el.__i18a={}), rec=st[a];
    if (rec && v===rec.ru) continue;
    const r=tr(v); if (r!=null && r!==v) { st[a]={en:v,ru:r}; el.setAttribute(a,r); done.add(el); }
  }
}
function doText(n){
  const v=n.nodeValue; if (n.__i18 && v===n.__i18.ru) return;
  const r=tr(v); if (r==null || r===norm(v)) return;
  const lead=v.match(/^\s*/)[0], trail=v.match(/\s*$/)[0], ru=lead+r+trail;
  n.__i18={en:v,ru}; n.nodeValue=ru; done.add(n);
}
function walk(node){
  if (node.nodeType===3) { if (node.parentElement && !node.parentElement.isContentEditable) doText(node); return; }
  if (node.nodeType!==1 || SKIP.has(node.tagName) || node.isContentEditable || node.hasAttribute('data-noi18n')) return;
  doAttrs(node);
  if (inlineOnly(node)) {
    const h=node.innerHTML; if (node.__i18h && h===node.__i18h.ru) return;
    const r=RU[norm(h.replace(/\s+data-om-[\w-]+="[^"]*"/g,''))]; if (r!=null) { node.__i18h={en:h,ru:r}; node.innerHTML=r; done.add(node); return; }
  }
  for (let c=node.firstChild;c;c=c.nextSibling) walk(c);
}
function restore(){
  for (const n of done) {
    if (!n.isConnected) continue;
    if (n.nodeType===3) { if (n.__i18 && n.nodeValue===n.__i18.ru) n.nodeValue=n.__i18.en; n.__i18=null; continue; }
    if (n.__i18h) { if (n.innerHTML===n.__i18h.ru) n.innerHTML=n.__i18h.en; n.__i18h=null; }
    if (n.__i18a) { for (const a in n.__i18a) { const rec=n.__i18a[a]; if (n.getAttribute(a)===rec.ru) n.setAttribute(a,rec.en); } n.__i18a=null; }
  }
  done.clear();
}
const obs=new MutationObserver(list=>{
  if (lang!=='ru') return;
  for (const m of list) {
    if (m.type==='childList') m.addedNodes.forEach(walk);
    else if (m.type==='characterData') walk(m.target);
    else if (m.type==='attributes') doAttrs(m.target);
  }
  if (done.size>3000) for (const n of done) if (!n.isConnected) done.delete(n);
});
const btn=document.getElementById('uiLangBtn'), inp=document.getElementById('uiLang');
function paintBtn(){ if (!btn) return; btn.querySelectorAll('[data-l]').forEach(s=>{ const on=s.dataset.l===lang; s.style.opacity=on?'1':'.4'; s.style.textDecoration=on?'underline':'none'; }); }
function setLang(l){
  l=l==='ru'?'ru':'en'; if (l===lang) { paintBtn(); return; }
  lang=l; document.documentElement.lang=l;
  if (l==='ru') { walk(document.body); obs.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label']}); }
  else { obs.disconnect(); restore(); }
  if (inp) inp.value=l;
  lsSet('mfk.uiLang.v1',l);
  paintBtn();
}
window.semI18n={setLang, t:s=>lang==='ru'?(tr(s)??s):s};
if (btn) btn.onclick=()=>setLang(lang==='ru'?'en':'ru');
if (inp) inp.addEventListener('change',()=>setLang(inp.value));
let saved='en'; try { saved=localStorage.getItem('mfk.uiLang.v1')||'en'; } catch(_) {}
paintBtn(); setTimeout(()=>setLang(inp&&inp.value!=='en'?inp.value:saved),30);
})();
