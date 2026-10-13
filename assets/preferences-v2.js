// Set the selected reading appearance before first paint.
try {
  const allowed=['glass','gilded','river','editorial','mono'];
  const query=new URLSearchParams(location.search);
  const fromLink=query.get('design');
  const saved=localStorage.getItem('interview-design-v2');
  const design=allowed.includes(fromLink)?fromLink:allowed.includes(saved)?saved:'glass';
  const linkedMode=query.get('mode');
  const savedMode=localStorage.getItem('interview-mode-'+design);
  const mode=['light','dark'].includes(linkedMode)?linkedMode:['light','dark'].includes(savedMode)?savedMode:['gilded','river'].includes(design)?'dark':'light';
  document.documentElement.dataset.design=design;
  document.documentElement.dataset.theme=mode;
  localStorage.setItem('interview-design-v2',design);
  localStorage.setItem('interview-mode-'+design,mode);
} catch {}
