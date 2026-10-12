// =====================================================================
// Micrograph Figure Kit — 27. About window
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Content follows the interface language (EN / RU).
// =====================================================================
const ABOUT_TXT={
  en:{title:'About',desc:'Software for preparing publication figures from microscope images.',
    feat:['Detects, reads, erases and redraws scale bars','Text, arrows, shapes, insets and distance measurement','Multi-panel figure layout with panel letters','EDS element maps with wt.% / at.% values','Export to TIFF, PNG, PDF and SVG at print size','All processing runs locally; images never leave the computer'],
    featH:'Features',authH:'Authors',licH:'License',lic:'MIT License. Free to use, modify and distribute with the copyright notice.',close:'Close'},
  ru:{title:'О программе',desc:'Программа для подготовки рисунков к публикациям по данным микроскопии.',
    feat:['Поиск, распознавание, удаление и перерисовка масштабных шкал','Текст, стрелки, фигуры, выноски и измерение расстояний','Компоновка многопанельных рисунков с буквенными обозначениями','Карты распределения элементов ЭДРС со значениями мас.% / ат.%','Сохранение в TIFF, PNG, PDF и SVG в печатном размере','Вся обработка выполняется локально; рисунки не покидают компьютер'],
    featH:'Возможности',authH:'Авторы',licH:'Лицензия',lic:'Лицензия MIT. Свободное использование, изменение и распространение с сохранением уведомления об авторских правах.',close:'Закрыть'},
};
const ABOUT_AUTHORS=[['Mohammad Alshah','Мохаммад Алшах','mohammadalshah96@gmail.com'],['Magzhan Kutzhanov','Магжан Кутжанов','makonyo95year@gmail.com']];
function aboutShow(show) {
  let ov=document.getElementById('aboutDlg');
  if (show===false) { ov?.remove(); return; }
  if (ov) return;
  const L=ABOUT_TXT[document.documentElement.lang==='ru'?'ru':'en'];
  const el=(tag,css,txt)=>{ const e=document.createElement(tag); if (css) e.style.cssText=css; if (txt!=null) e.textContent=txt; return e; };
  ov=el('div','position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:20px');
  ov.id='aboutDlg'; ov.setAttribute('data-noi18n',''); ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label',L.title);
  const box=el('div','background:var(--panel);color:var(--ink);border-radius:14px;max-width:480px;width:100%;max-height:85vh;overflow:auto;padding:18px 20px;box-shadow:0 20px 50px rgba(0,0,0,.25);font:13px/1.5 system-ui,sans-serif');
  const hd=el('div','display:flex;justify-content:space-between;align-items:flex-start;gap:12px');
  const ttl=el('div'); ttl.append(el('strong','font-size:16px;display:block','Micrograph Figure Kit'),el('span','opacity:.75',L.desc));
  const x=el('button','',  '×'); x.type='button'; x.className='btn ghost icon-btn'; x.setAttribute('aria-label',L.close); x.onclick=()=>aboutShow(false);
  hd.append(ttl,x);
  const H=t=>el('div','font-weight:700;margin:14px 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;opacity:.7',t);
  const ul=el('ul','margin:0;padding-left:18px'); L.feat.forEach(f=>ul.append(el('li','',f)));
  const au=el('div','display:grid;gap:2px');
  const ru=L===ABOUT_TXT.ru;
  for (const [ne,nr,m] of ABOUT_AUTHORS) { const n=ru?nr:ne; const r=el('div'); const a=el('a','color:var(--accent)',m); a.href='mailto:'+m; r.append(el('span','font-weight:600',n+' '),'(',a,')'); au.append(r); }
  const lic=el('div','',L.lic); lic.prepend(el('div','opacity:.75','Copyright © 2026 Mohammad Alshah, Magzhan Kutzhanov.'));
  box.append(hd,H(L.featH),ul,H(L.authH),au,H(L.licH),lic);
  ov.appendChild(box);
  ov.addEventListener('click',e=>{ if (e.target===ov) aboutShow(false); });
  ov.addEventListener('keydown',e=>{ if (e.key==='Escape') aboutShow(false); });
  document.body.appendChild(ov); x.focus();
}
document.getElementById('aboutBtn')?.addEventListener('click',()=>aboutShow(true));
