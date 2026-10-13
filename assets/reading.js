const root=document.documentElement;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const save=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
const read=key=>{try{return localStorage.getItem(key)}catch{return null}};
const toast=message=>{const el=$('.toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),1800)};
const designSelect=$('#design-select'),themeButton=$('#theme-toggle');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
function syncAppearance(){
  const design=root.dataset.design, dark=root.dataset.theme==='dark';
  designSelect.value=design;
  themeButton.querySelector('span').textContent=dark?'亮色':'暗色';
  themeButton.setAttribute('aria-label',`切换为${dark?'亮色':'暗色'}模式`);
  const art=$('#site-backdrop'),img=$('#artwork-image');
  const landscape=['gilded','river'].includes(design);
  art.hidden=!landscape;
  if(landscape){const url=new URL(root.dataset.root+'assets/artwork/'+design+'.jpg',location.href).href;if(img.src!==url)img.src=url}
  save('interview-design-v2',design);save('interview-mode-'+design,root.dataset.theme);
}
function changeAppearance(change){
  const run=()=>{change();syncAppearance()};
  if(document.startViewTransition&&!motion.matches)document.startViewTransition(run);
  else run();
}
syncAppearance();
designSelect.addEventListener('change',()=>changeAppearance(()=>{const selected=designSelect.value;root.dataset.design=selected;root.dataset.theme=read('interview-mode-'+selected)||(['gilded','river'].includes(selected)?'dark':'light')}));
themeButton.addEventListener('click',()=>changeAppearance(()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark'}));

const menu=$('#sidebar'),menuButton=$('#menu-toggle'),backdrop=$('#menu-backdrop');
const narrow=matchMedia('(max-width: 900px)');
function syncMenu(){menu.inert=narrow.matches&&!document.body.classList.contains('menu-open')}
function toggleMenu(open){document.body.classList.toggle('menu-open',open);backdrop.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));syncMenu();if(open)$('#search-input').focus();else menuButton.focus({preventScroll:true})}
syncMenu();
narrow.addEventListener('change',()=>{if(!narrow.matches){document.body.classList.remove('menu-open');backdrop.hidden=true;menuButton.setAttribute('aria-expanded','false')}syncMenu()});
menuButton.addEventListener('click',()=>toggleMenu(!document.body.classList.contains('menu-open')));
$('#close-menu').addEventListener('click',()=>toggleMenu(false));
backdrop.addEventListener('click',()=>toggleMenu(false));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&document.body.classList.contains('menu-open'))toggleMenu(false);
  if(event.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)){event.preventDefault();if(narrow.matches)toggleMenu(true);$('#search-input').focus()}
  if(event.key==='Tab'&&document.body.classList.contains('menu-open')){const visible=[...menu.querySelectorAll('a,button,input,select,summary')].filter(el=>el.getClientRects().length);const first=visible[0],last=visible.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
});

function setMode(mode){root.dataset.mode=mode;$$('[data-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mode===mode)));const notes=$('#notes');if(notes)notes.open=mode==='study';const label=$('.mode-description');if(label)label.textContent=mode==='study'?'展开笔记，理解原理':'聚焦回答，练习表达';save('interview-reading-mode',mode)}
setMode(read('interview-reading-mode')==='recite'?'recite':'study');
$$('[data-mode]').forEach(el=>el.addEventListener('click',()=>setMode(el.dataset.mode)));
$$('.toc-sidebar a').forEach(a=>a.addEventListener('click',()=>{if(a.hash==='#notes'&&$('#notes'))$('#notes').open=true}));
$$('.copy-code').forEach(button=>button.addEventListener('click',async()=>{const code=button.closest('.code-block').querySelector('code').textContent;try{await navigator.clipboard.writeText(code);toast('已复制')}catch{toast('请选中文字复制')}}));

let index=[];
const search=$('#search-input');
function filter(){
  const terms=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches=new Set(index.filter(q=>terms.every(term=>q.text.includes(term))).map(q=>q.id));
  let visible=0;
  $$('[data-question-id]').forEach(el=>{const show=index.length?matches.has(el.dataset.questionId):terms.every(term=>el.textContent.toLowerCase().includes(term));el.hidden=!show;if(show&&el.classList.contains('question-card'))visible++});
  $$('.subtopic-group,.topic-group').forEach(group=>{group.hidden=!group.querySelector('.question-link:not([hidden])');if(terms.length)group.open=true});
  $$('.catalog-subtopic,.catalog-topic').forEach(group=>group.hidden=!group.querySelector('.question-card:not([hidden])'));
  const resultCount=index.length?matches.size:$$('.question-link:not([hidden])').length;
  $('.search-feedback').textContent=terms.length?`找到 ${resultCount} 道题目`:'';
  $('#no-results').hidden=resultCount>0;
  const count=$('#catalog-count');if(count)count.textContent=`${visible} 道题目`;
  const empty=$('.filter-empty');if(empty)empty.hidden=visible>0;
}
fetch(root.dataset.root+'assets/search-index.json').then(response=>{if(!response.ok)throw Error('search');return response.json()}).then(data=>{index=data;filter()}).catch(()=>{search.placeholder='搜索题目标题';$('.search-feedback').textContent='正文搜索暂时不可用，可搜索题名。'});
let searchTimer;
search.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(filter,70)});
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)$$('.toc-sidebar a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id))},{rootMargin:'-12% 0px -70% 0px'});$$('.article-section,.knowledge-section').forEach(el=>observer.observe(el))}
