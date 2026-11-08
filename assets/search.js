'use strict';
(() => {
 const form=document.getElementById('search-form'); if(!form)return;
 const query=document.getElementById('query'),book=document.getElementById('book'),historical=document.getElementById('historical');
 const status=document.getElementById('search-status'),results=document.getElementById('results'),more=document.getElementById('more');
 const cache=new Map();let booksPromise,found=[],shown=0,version=0;
 const plain=s=>s.normalize('NFC').toLowerCase().replace(/([\p{L}])[-‐‑]\s*\n\s*(?=[\p{L}])/gu,'$1').replace(/\s+/g,' ').trim();
 const fold=s=>plain(s).replace(/[ѣіѳѵё]/g,c=>({'ѣ':'е','і':'и','ѳ':'ф','ѵ':'и','ё':'е'}[c])).replace(/ъ(?=[^\p{L}]|$)/gu,'');
 async function json(url){const r=await fetch(url);if(!r.ok)throw Error('HTTP '+r.status);return r.json();}
 function render(){const end=Math.min(shown+40,found.length);const fragment=document.createDocumentFragment();for(let i=shown;i<end;i++){const f=found[i],li=document.createElement('li'),a=document.createElement('a'),p=document.createElement('p');a.href=f.row.url;a.textContent=f.title+' · лист '+f.row.page;const offset=Math.max(0,f.offset-95),text=f.row.text.replace(/\s+/g,' ');p.textContent=(offset?'…':'')+text.slice(offset,offset+310)+(offset+310<text.length?'…':'');li.append(a,p);fragment.append(li);}results.append(fragment);shown=end;more.hidden=shown>=found.length;}
 more.addEventListener('click',render);
 form.addEventListener('submit',async event=>{event.preventDefault();const run=++version;const raw=query.value.trim();const normalize=historical.checked?fold:plain;const terms=normalize(raw).split(' ').filter(Boolean);if(!terms.length){status.textContent='Введите слово для поиска.';return;}status.textContent='Загружаем тексты и ищем…';results.replaceChildren();more.hidden=true;found=[];shown=0;const submit=form.querySelector('button');submit.disabled=true;const params=new URLSearchParams({q:raw,book:book.value});if(!historical.checked)params.set('exact','1');history.replaceState(null,'','?'+params.toString()+'#search-title');
 try{booksPromise??=json('search/books.json');const books=await booksPromise;const selected=books.filter(b=>book.value==='all'||b.slug===book.value);const data=await Promise.all(selected.map(async b=>{if(!cache.has(b.slug))cache.set(b.slug,json(b.file).then(rows=>rows.map(row=>({...row,plain:plain(row.text),fold:fold(row.text)}))));return {book:b,rows:await cache.get(b.slug)};}));if(run!==version)return;for(const d of data)for(const row of d.rows){const text=historical.checked?row.fold:row.plain;if(terms.every(t=>text.includes(t)))found.push({row,title:d.book.title,offset:text.indexOf(terms[0])});}status.textContent=found.length?'Найдено листов: '+found.length+'.':'Совпадений не найдено. Попробуйте другое написание или часть слова.';render();}
 catch(error){booksPromise=null;cache.clear();status.textContent='Не удалось загрузить тексты. Проверьте соединение и повторите поиск.';}
 finally{if(run===version)submit.disabled=false;}
 });
 const params=new URLSearchParams(location.search);if(params.has('q')){query.value=params.get('q');if([...book.options].some(o=>o.value===params.get('book')))book.value=params.get('book');historical.checked=params.get('exact')!=='1';form.requestSubmit();}
})();
