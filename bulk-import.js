(async () => {
  'use strict';
  const CONFIG_KEY='ainsStudioConfigV1';
  const config=(await chrome.storage.local.get(CONFIG_KEY))[CONFIG_KEY]||{};
  if(config.enabled===false||config.features?.excelImporter===false)return;
  const JOB_KEY = 'ainsStudioBulkJobV1';
  const ADMIN_KEY = 'ainsStudioBulkAdminPasswordV1';
  const ADMIN_SESSION_KEY = 'ainsStudioBulkAdminUnlockedV1';
  const ADMIN_FAIL_KEY = 'ainsStudioBulkAdminFailuresV1';
  const ADMIN_HASH_ITERATIONS = 210000;
  const ADMIN_CREDENTIAL_VERSION = 2;
  const ADMIN_SALT = 'Ovm3ZP1hyUsn9HEvVTilqQ==';
  const ADMIN_HASH = 'hJbdlMwaMfF6Aa0uAFPYakXjoW+WCKyYAAU0TkPS0Hs=';
  const WAIT_MS = 180000;
  const APPROVAL_SECONDS = 3;
  const AINS_RETRY_WAIT_MS = 180000;
  const FIELD_DEFS = [
    ['category','Category / Kategori',['category','kategori','fiction type','jenis kategori']],
    ['language','Language / Bahasa',['language','bahasa','lang']],
    ['title','Title / Tajuk',['title','tajuk','book title','judul']],
    ['year','Year / Tahun',['year','tahun','publication year','tahun terbitan']],
    ['author','Author / Penulis',['author','penulis','writer']],
    ['pages','Pages / Muka surat',['pages','page count','mukasurat','bilangan mukasurat','bilangan muka surat']],
    ['publisher','Publisher / Penerbit',['publisher','penerbit']],
    ['summary','Summary / Rumusan',['summary','rumusan','sinopsis']],
    ['lesson','What I learned / Pengajaran',['what i learned','lesson','pengajaran','what did you learn']],
    ['isbn','ISBN',['isbn']],
    ['link','Link / Pautan',['link','url','pautan','website','laman web']]
  ];
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,' ').trim();
  const readJob = () => { try { return JSON.parse(sessionStorage.getItem(JOB_KEY) || 'null'); } catch (_) { return null; } };
  const saveJob = () => {
    try { if (job) sessionStorage.setItem(JOB_KEY,JSON.stringify(job)); else sessionStorage.removeItem(JOB_KEY); } catch (_) {}
    try {
      if (chrome?.storage?.local) {
        if (job) chrome.storage.local.set({ainsStudioImportState:{phase:job.phase,index:job.index||0,total:job.rows?.length||0,row:job.rows?.[job.index]?.row||null,due:job.due||null,lastSubmittedRow:job.lastSubmittedRow||null,lastSubmittedTitle:job.lastSubmittedTitle||'',nextRow:job.rows?.[job.index+(job.phase==='waiting'?1:0)]?.row||null,nextTitle:job.rows?.[job.index+(job.phase==='waiting'?1:0)]?rowData(job.rows[job.index+(job.phase==='waiting'?1:0)]).title:'',updatedAt:Date.now(),error:job.error||''}});
        else chrome.storage.local.remove('ainsStudioImportState');
      }
    } catch (_) {}
  };
  let job = readJob(), parsed = null, stopRequested = false, activeRun = false, ui = null, clock = 0;
  let adminUnlocked = sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  if(job?.phase==='waiting'){
    if(job.waitDurationMs!==WAIT_MS){job.due=Date.now()+WAIT_MS;job.waitDurationMs=WAIT_MS;job.didReloadAfterWait=false;}
    if(!job.lastSubmittedRow&&job.rows?.[job.index]){job.lastSubmittedRow=job.rows[job.index].row;job.lastSubmittedTitle=rowData(job.rows[job.index]).title;}
    saveJob();
  }

  async function unzip(file) {
    const buffer = await file.arrayBuffer(), bytes = new Uint8Array(buffer), view = new DataView(buffer);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0,bytes.length - 65558); i--) if (view.getUint32(i,true) === 0x06054b50) { eocd=i; break; }
    if (eocd < 0) throw new Error('This does not look like an .xlsx workbook. Save the Excel file as .xlsx or .csv.');
    const count = view.getUint16(eocd+10,true), centralOffset=view.getUint32(eocd+16,true), decoder=new TextDecoder();
    const entries = new Map(); let cursor=centralOffset;
    for(let n=0;n<count;n++) {
      if(view.getUint32(cursor,true)!==0x02014b50) break;
      const method=view.getUint16(cursor+10,true), size=view.getUint32(cursor+20,true), nameLen=view.getUint16(cursor+28,true), extraLen=view.getUint16(cursor+30,true), commentLen=view.getUint16(cursor+32,true), localOffset=view.getUint32(cursor+42,true);
      const name=decoder.decode(bytes.slice(cursor+46,cursor+46+nameLen)); entries.set(name,{method,size,localOffset}); cursor+=46+nameLen+extraLen+commentLen;
    }
    const get = async name => {
      const entry=entries.get(name); if(!entry) return null;
      const p=entry.localOffset, nameLen=view.getUint16(p+26,true), extraLen=view.getUint16(p+28,true), start=p+30+nameLen+extraLen;
      const packed=bytes.slice(start,start+entry.size);
      if(entry.method===0) return decoder.decode(packed);
      if(entry.method!==8 || typeof DecompressionStream==='undefined') throw new Error('This browser cannot unpack this Excel file. Try saving it as CSV.');
      const stream=new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return decoder.decode(await new Response(stream).arrayBuffer());
    };
    const workbookText=await get('xl/workbook.xml'); if(!workbookText) throw new Error('Could not find a worksheet in this workbook.');
    const parser=new DOMParser(), workbook=parser.parseFromString(workbookText,'application/xml'), sheet=workbook.getElementsByTagName('sheet')[0];
    if(!sheet) throw new Error('The workbook has no worksheets.');
    const relationId=sheet.getAttribute('r:id'), relsText=await get('xl/_rels/workbook.xml.rels');
    let sheetPath='xl/worksheets/sheet1.xml';
    if(relsText && relationId) {
      const rels=parser.parseFromString(relsText,'application/xml');
      const rel=[...rels.getElementsByTagName('Relationship')].find(el=>el.getAttribute('Id')===relationId);
      if(rel) { const target=rel.getAttribute('Target')||''; sheetPath=target.startsWith('/')?target.slice(1):target.startsWith('xl/')?target:`xl/${target}`; }
    }
    const sheetText=await get(sheetPath); if(!sheetText) throw new Error('Could not read the first worksheet.');
    const stringsText=await get('xl/sharedStrings.xml'), shared=[];
    if(stringsText) for(const si of parser.parseFromString(stringsText,'application/xml').getElementsByTagName('si')) shared.push(si.textContent||'');
    const xml=parser.parseFromString(sheetText,'application/xml');
    const colIndex=ref=>{let col=0; for(const c of (ref.match(/^[A-Z]+/i)||[''])[0].toUpperCase()) col=col*26+c.charCodeAt(0)-64; return col-1;};
    const rows=[];
    for(const row of xml.getElementsByTagName('row')) {
      const values=[];
      for(const cell of row.getElementsByTagName('c')) {
        const col=colIndex(cell.getAttribute('r')||'A'), type=cell.getAttribute('t'), v=cell.getElementsByTagName('v')[0]; let value=v?.textContent||'';
        if(type==='s') value=shared[Number(value)]||'';
        else if(type==='inlineStr') value=cell.getElementsByTagName('is')[0]?.textContent||'';
        else if(type==='b') value=value==='1'?'TRUE':'FALSE';
        values[col]=value;
      }
      if(values.some(v=>String(v??'').trim())) rows.push({row:Number(row.getAttribute('r'))||rows.length+1,values});
    }
    return rows;
  }
  function parseCsv(text) {
    const rows=[]; let row=[],value='',quoted=false;
    for(let i=0;i<text.length;i++) { const c=text[i];
      if(quoted) { if(c==='"'&&text[i+1]==='"'){value+='"';i++;} else if(c==='"') quoted=false; else value+=c; }
      else if(c==='"') quoted=true; else if(c===','){row.push(value);value='';} else if(c==='\n'||c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(value); if(row.some(x=>String(x).trim())) rows.push({row:rows.length+1,values:row}); row=[];value=''; } else value+=c;
    }
    row.push(value); if(row.some(x=>String(x).trim())) rows.push({row:rows.length+1,values:row}); return rows;
  }
  function inferredMapping(headers) {
    return Object.fromEntries(FIELD_DEFS.map(([key,,aliases])=>[key,headers.findIndex(h=>{const n=normalize(h); return aliases.some(a=>n===normalize(a)||n.includes(normalize(a)));})]));
  }
  function addUI() {
    if(!document.body || document.getElementById('ains-bulk-launch')) return;
    const launch=document.createElement('button'); launch.id='ains-bulk-launch'; launch.type='button'; launch.textContent='🔒 Admin only · Excel Import'; launch.title='Admin-only Excel importer — password required';
    const shade=document.createElement('div'); shade.id='ains-bulk-shade'; shade.hidden=true;
    shade.innerHTML='<section id="ains-bulk-auth" role="dialog" aria-modal="true" aria-labelledby="ains-bulk-auth-title"><div class="ains-bulk-auth-mark" aria-hidden="true">🔐</div><p class="ains-bulk-auth-kicker">ADMIN ONLY</p><h2 id="ains-bulk-auth-title">Password required</h2><p id="ains-bulk-auth-copy">Enter the admin code to unlock the Excel importer.</p><form id="ains-bulk-auth-form"><label for="ains-bulk-password">Admin code</label><div class="ains-bulk-password-field"><input id="ains-bulk-password" type="password" autocomplete="current-password" required><button type="button" id="ains-bulk-toggle-password" aria-pressed="false">Show</button></div><p id="ains-bulk-auth-status" role="status"></p><div class="ains-bulk-auth-actions"><button type="button" id="ains-bulk-auth-cancel">Cancel</button><button type="submit" id="ains-bulk-auth-submit">Unlock importer</button></div></form><small class="ains-bulk-auth-footnote">The code is verified locally using a salted PBKDF2 hash. This lock does not authenticate an AINS server administrator account.</small></section><section id="ains-bulk-panel" role="dialog" aria-modal="true" aria-labelledby="ains-bulk-title" hidden><header><div><strong id="ains-bulk-title">🔒 Admin-only Excel reading-record helper</strong><small>Fill and submit your book records in AINS</small></div><button type="button" id="ains-bulk-close" aria-label="Close">×</button></header><div class="ains-bulk-body"><label class="ains-bulk-file">Choose .xlsx or .csv file<input id="ains-bulk-file" type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></label><div id="ains-bulk-map" hidden></div><div id="ains-bulk-status" role="status">Choose a workbook to preview its columns.</div><div class="ains-bulk-progress"><span id="ains-bulk-progress-fill"></span></div><div id="ains-bulk-actions"><button type="button" id="ains-bulk-start" disabled>Prepare records</button><button type="button" id="ains-bulk-stop" hidden>Stop batch</button></div><p class="ains-bulk-note">Material type is fixed to Physical book and the 5-star rating is selected. You can review or edit details. The approval prompt counts down for 3 seconds; choose Cancel &amp; edit to stop it. After each successful submission, the importer waits 3 minutes before the next row. AINS rate-limit retries also wait 3 minutes.</p></div></section>';
    document.body.append(launch,shade);
    ui={launch,shade,auth:shade.querySelector('#ains-bulk-auth'),authForm:shade.querySelector('#ains-bulk-auth-form'),authStatus:shade.querySelector('#ains-bulk-auth-status'),authPassword:shade.querySelector('#ains-bulk-password'),passwordToggle:shade.querySelector('#ains-bulk-toggle-password'),authSubmit:shade.querySelector('#ains-bulk-auth-submit'),panel:shade.querySelector('#ains-bulk-panel'),status:shade.querySelector('#ains-bulk-status'),map:shade.querySelector('#ains-bulk-map'),start:shade.querySelector('#ains-bulk-start'),stop:shade.querySelector('#ains-bulk-stop'),file:shade.querySelector('#ains-bulk-file'),progress:shade.querySelector('#ains-bulk-progress-fill')};
    launch.addEventListener('click',()=>openImporter());
    ui.authForm.addEventListener('submit',authenticateAdmin);
    ui.passwordToggle.addEventListener('click',()=>{const reveal=ui.authPassword.type==='password';ui.authPassword.type=reveal?'text':'password';ui.passwordToggle.textContent=reveal?'Hide':'Show';ui.passwordToggle.setAttribute('aria-pressed',String(reveal));});
    shade.querySelector('#ains-bulk-auth-cancel').addEventListener('click',()=>{shade.hidden=true;ui.authForm.reset();ui.authStatus.textContent='';});
    shade.querySelector('#ains-bulk-close').addEventListener('click',()=>{shade.hidden=true;});
    shade.addEventListener('click',e=>{if(e.target===shade)shade.hidden=true;});
    ui.file.addEventListener('change',onFile);
    ui.start.addEventListener('click',startFromUI);
    ui.stop.addEventListener('click',()=>{stopRequested=true; if(job){job.stopAfterCurrent=true;saveJob();} update('Stopping the batch. No next record will be prepared.');});
    if(job) {
      const handsOff=job.phase==='awaiting-approval'||job.phase==='awaiting-manual-submit'||job.phase==='waiting'||job.phase==='cooldown-retry';
      ui.stop.hidden=false; ui.start.hidden=true;
      if(!handsOff) update('A saved batch is paused. Unlock the admin-only importer to resume it.');
    }
    if(!/new-record-book/i.test(location.pathname)) launch.hidden=true;
  }
  function base64(bytes) { let binary=''; for(const byte of bytes) binary+=String.fromCharCode(byte); return btoa(binary); }
  async function derivePasswordHash(password,salt) {
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
    const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:ADMIN_HASH_ITERATIONS,hash:'SHA-256'},material,256);
    return base64(new Uint8Array(bits));
  }
  async function storedAdminCredential() {
    const value=await chrome.storage.local.get(ADMIN_KEY),credential=value[ADMIN_KEY];
    if(credential?.version===ADMIN_CREDENTIAL_VERSION&&credential.salt===ADMIN_SALT&&credential.hash===ADMIN_HASH)return credential;
    const seeded={version:ADMIN_CREDENTIAL_VERSION,salt:ADMIN_SALT,hash:ADMIN_HASH,iterations:ADMIN_HASH_ITERATIONS,updatedAt:Date.now()};
    await chrome.storage.local.set({[ADMIN_KEY]:seeded});
    adminUnlocked=false;sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return seeded;
  }
  async function openImporter() {
    if(!ui)return;
    ui.shade.hidden=false;
    const credential=await storedAdminCredential();
    if(adminUnlocked&&credential) { showImporter(); if(job&&job.phase!=='paused')resumeJob(); return; }
    adminUnlocked=false;sessionStorage.removeItem(ADMIN_SESSION_KEY);ui.panel.hidden=true;ui.auth.hidden=false;
    ui.auth.querySelector('#ains-bulk-auth-title').textContent='Password required';
    ui.auth.querySelector('#ains-bulk-auth-copy').textContent='Enter the admin code to unlock the Excel importer.';
    ui.authSubmit.textContent='Unlock importer';ui.authStatus.textContent='';ui.authForm.reset();ui.authPassword.type='password';ui.passwordToggle.textContent='Show';ui.passwordToggle.setAttribute('aria-pressed','false');ui.authPassword.focus();
  }
  async function authenticateAdmin(event) {
    event.preventDefault();
    const password=ui.authPassword.value;
    ui.authSubmit.disabled=true;ui.authStatus.textContent='Verifying code…';
    try {
      const failureState=(await chrome.storage.local.get(ADMIN_FAIL_KEY))[ADMIN_FAIL_KEY]||{count:0,until:0};
      if(failureState.until>Date.now()){ui.authStatus.textContent=`Too many attempts. Try again in ${Math.ceil((failureState.until-Date.now())/1000)} seconds.`;return;}
      const credential=await storedAdminCredential(),salt=Uint8Array.from(atob(credential.salt),char=>char.charCodeAt(0)),hash=await derivePasswordHash(password,salt);
      if(hash!==credential.hash){const count=(failureState.count||0)+1,until=count>=5?Date.now()+30000:0;await chrome.storage.local.set({[ADMIN_FAIL_KEY]:{count:until?0:count,until}});ui.authStatus.textContent=until?'Too many attempts. Try again in 30 seconds.':`Incorrect code. ${5-count} attempts left.`;ui.authPassword.select();return;}
      await chrome.storage.local.remove(ADMIN_FAIL_KEY);
      adminUnlocked=true;sessionStorage.setItem(ADMIN_SESSION_KEY,'1');ui.authForm.reset();showImporter();
      if(job){update(job.phase==='waiting'?'Restoring the 3-minute wait…':job.phase==='cooldown-retry'?'Restoring AINS 3-minute retry wait…':job.phase==='awaiting-approval'?'Restoring the 3-second approval prompt…':job.phase==='awaiting-manual-submit'?'Your record is ready for you to edit or submit.':job.phase==='paused'?job.error||'Import paused. Check AINS, then prepare the selected row again.':'Restoring the import…');if(job.phase!=='paused')resumeJob();}
    } catch(error) { ui.authStatus.textContent='Could not verify the password in this browser. Please reload AINS and try again.'; }
    finally {ui.authSubmit.disabled=false;}
  }
  function showImporter() { ui.auth.hidden=true;ui.panel.hidden=false; }
  function update(message) {
    if(!ui) return; ui.status.textContent=message;
    if(job?.rows?.length) ui.progress.style.width=`${Math.min(100,Math.round(job.index/job.rows.length*100))}%`;
  }
  function buildMapping(headers, mapping, firstDataRow) {
    ui.map.hidden=false; ui.map.replaceChildren();
    const start=document.createElement('label'); start.className='ains-bulk-start-row'; start.textContent='Start at Excel row';
    const startInput=document.createElement('input'); startInput.type='number'; startInput.id='ains-bulk-row'; startInput.min=String(firstDataRow); startInput.max=String(parsed.rows.at(-1)?.row||firstDataRow); startInput.value=String(firstDataRow); start.append(startInput); ui.map.append(start);
    const grid=document.createElement('div'); grid.className='ains-bulk-map-grid';
    for(const [key,label] of FIELD_DEFS) {
      const field=document.createElement('label'); field.textContent=label;
      const select=document.createElement('select'); select.dataset.field=key;
      const none=document.createElement('option'); none.value='-1'; none.textContent='— Not in file —'; select.append(none);
      headers.forEach((h,i)=>{const op=document.createElement('option');op.value=String(i);op.textContent=`${String.fromCharCode(65+i)} · ${h||`Column ${i+1}`}`;select.append(op);});
      select.value=String(mapping[key]??-1); field.append(select); grid.append(field);
    }
    ui.map.append(grid);
  }
  async function onFile() {
    const file=ui.file.files?.[0]; if(!file)return;
    try {
      update('Reading workbook…'); ui.start.disabled=true;
      let rows;
      if(/\.csv$/i.test(file.name)) rows=parseCsv(await file.text()); else if(/\.xlsx$/i.test(file.name)) rows=await unzip(file); else throw new Error('Please choose an .xlsx or .csv file. Older .xls files need to be saved as .xlsx first.');
      const headerIndex=rows.findIndex(r=>r.values.some(v=>String(v??'').trim())); if(headerIndex<0) throw new Error('The worksheet is empty.');
      const headers=rows[headerIndex].values.map((x,i)=>String(x??'').trim()||`Column ${i+1}`);
      const dataRows=rows.slice(headerIndex+1).filter(r=>r.values.some(v=>String(v??'').trim()));
      if(!dataRows.length) throw new Error('No data rows were found under the header row.');
      parsed={headers,rows:dataRows,fileName:file.name,headerRow:rows[headerIndex].row};
      buildMapping(headers,inferredMapping(headers),dataRows[0].row);
      ui.start.hidden=false; ui.start.disabled=false; ui.stop.hidden=true;
      update(`${dataRows.length} data rows found in “${file.name}”. Choose mappings and the starting row, then start.`);
    } catch(error) { parsed=null; ui.map.hidden=true; update(error.message||'Could not read this workbook.'); }
  }
  function startFromUI() {
    if(!parsed)return;
    const startRow=Number(ui.map.querySelector('#ains-bulk-row').value), mapping=Object.fromEntries([...ui.map.querySelectorAll('select[data-field]')].map(s=>[s.dataset.field,Number(s.value)]));
    const rowIndex=parsed.rows.findIndex(r=>r.row>=startRow); if(rowIndex<0){update('The start row is past the last data row.');return;}
    if(mapping.title<0||mapping.category<0||mapping.language<0||mapping.summary<0||mapping.lesson<0){update('Map at least Category, Language, Title, Summary, and What I learned before starting.');return;}
    job={rows:parsed.rows.map(r=>({row:r.row,values:r.values})),headers:parsed.headers,mapping,fileName:parsed.fileName,index:rowIndex,phase:'ready',stopAfterCurrent:false,didReloadAfterWait:false};
    stopRequested=false;saveJob(); ui.start.hidden=true; ui.stop.hidden=false; update('Import ready.'); ui.shade.hidden=true; resumeJob();
  }
  const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
  async function until(check,timeout=20000) { const end=Date.now()+timeout; while(Date.now()<end){ if(check())return true; await wait(250); } return false; }
  function rowData(record) { return Object.fromEntries(FIELD_DEFS.map(([key])=>[key,job.mapping[key]>=0?String(record.values[job.mapping[key]]??'').trim():''])); }
  async function storeConfirmedRecord(record) {
    try {
      const data=rowData(record),day=new Date(),date=`${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
      const entry={key:`${date}|${data.title.toLocaleLowerCase()}`,date,title:data.title,type:'Book / e-Book',pending:true};
      const stored=await chrome.storage.local.get(['ainsStudioSeenRecordsV1','ainsStudioFullScan']),items=Array.isArray(stored.ainsStudioSeenRecordsV1)?stored.ainsStudioSeenRecordsV1:[],merged=new Map(items.map(item=>[item.key,item]));
      const same=[...merged.values()].find(item=>item.date===date&&item.title?.toLocaleLowerCase()===data.title.toLocaleLowerCase());
      if(same)merged.set(same.key,{...same,pending:true});else merged.set(entry.key,entry);
      const patch={ainsStudioSeenRecordsV1:[...merged.values()].slice(-5000),ainsStudioRecordsUpdatedAt:Date.now()};
      const full=stored.ainsStudioFullScan;if(full?.complete){const all=new Map((full.records||[]).map(item=>[item.key,item]));const existing=[...all.values()].find(item=>item.date===date&&item.title?.toLocaleLowerCase()===data.title.toLocaleLowerCase());if(existing)all.set(existing.key,{...existing,pending:true});else all.set(entry.key,entry);const records=[...all.values()];patch.ainsStudioFullScan={...full,records,countYear:records.filter(item=>item.date.startsWith(`${day.getFullYear()}-`)).length,updatedAt:Date.now()}}
      await chrome.storage.local.set(patch);
    } catch (_) {}
  }
  function setValue(el,value) {
    if(!el) return;
    const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
    const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set; setter?setter.call(el,String(value??'')):el.value=String(value??'');
    el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  async function setSlowValue(el,value) {
    if(!el)return;
    setValue(el,''); el.focus();
    for(const character of String(value??'')) {
      if(stopRequested) throw new Error('Batch stopped while filling the current record.');
      const current=el.value;
      const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
      const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
      setter?setter.call(el,current+character):el.value=current+character;
      el.dispatchEvent(new Event('input',{bubbles:true}));
      await wait(22);
    }
    el.dispatchEvent(new Event('change',{bubbles:true})); el.blur();
  }
  function setSelect(name,raw,fallback) {
    const el=document.querySelector(`#wizForm [name="${name}"]`); if(!el)return false;
    const value=normalize(raw), options=[...el.options];
    let option=options.find(o=>normalize(o.value)===value||normalize(o.textContent)===value);
    if(!option && fallback) option=options.find(o=>o.value===fallback);
    if(!option && raw) option=options.find(o=>{const candidate=normalize(o.textContent+' '+o.value);return candidate&&value&&candidate.includes(value);});
    setValue(el,option?.value||''); return Boolean(option?.value);
  }
  function requiredCheck(record) {
    const data=rowData(record), missing=[];
    for(const key of ['category','language','title','year','author','pages','publisher','summary','lesson']) if(!data[key]) missing.push(FIELD_DEFS.find(x=>x[0]===key)[1]);
    for(const key of ['summary','lesson']) if(data[key]&&data[key].length<100) missing.push(`${FIELD_DEFS.find(x=>x[0]===key)[1]} must be at least 100 characters`);
    if(missing.length) throw new Error(`Excel row ${record.row} needs: ${missing.join(', ')}.`);
    return data;
  }
  async function enterRecord(record) {
    if(!await until(()=>document.querySelector('#wizForm'))) throw new Error('The AINS reading-record form did not load. Open the new-record-book page and resume.');
    const data=requiredCheck(record), form=document.querySelector('#wizForm');
    if(!setSelect('kategori',data.category)) throw new Error(`Excel row ${record.row}: category must match Fiction or Non-fiction.`);
    if(!setSelect('bahasa',data.language)) throw new Error(`Excel row ${record.row}: language must match an AINS language option.`);
    if(!setSelect('jenis','physical','physical')) throw new Error('Could not select Physical book as the material type.');
    await advanceStep(0);
    for(const [key,name] of [['title','tajuk'],['year','tahun'],['author','penulis'],['pages','mukasurat'],['publisher','penerbit'],['isbn','isbn'],['link','pautan']]) {
      const el=form.querySelector(`[name="${name}"]`); if(el) await setSlowValue(el,data[key]);
    }
    await advanceStep(1);
    const fifthStar=form.querySelector('#wizRating [data-star="5"]');
    if(!fifthStar) throw new Error('Could not find the fifth rating star in AINS.');
    fifthStar.click();
    await setSlowValue(form.querySelector('[name="rumusan"]'),data.summary);
    await setSlowValue(form.querySelector('[name="pengajaran"]'),data.lesson);
    await advanceStep(2);
    const confirm=document.querySelector('#wizConfirm');
    if(!confirm) throw new Error('Could not find AINS confirmation checkbox.');
    if(!confirm.checked){confirm.click();confirm.dispatchEvent(new Event('change',{bubbles:true}));}
    job.phase='awaiting-approval';saveJob();
    update(`Excel row ${record.row} is filled and rated 5 stars. Review or edit it before the 3-second approval prompt.`);
    ui.launch.textContent=`AINS Import · row ${record.row} review`;
    ui.shade.hidden=true;
  }
  async function approvalDialog(record) {
    return new Promise(resolve=>{
      const dialog=document.createElement('div'); dialog.id='ains-auto-submit-shade';
      dialog.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="ains-auto-submit-title"><div class="ains-auto-icon">✓</div><h2 id="ains-auto-submit-title">Please approve this record</h2><p><strong>${escapeHtml(rowData(record).title)}</strong> is ready with a 5-star rating. It will be submitted automatically in <b id="ains-auto-count">${APPROVAL_SECONDS}</b> seconds.</p><p class="ains-auto-help">Choose “Cancel &amp; edit” to change any details or handle Hantar yourself.</p><div><button type="button" data-action="cancel">Cancel &amp; edit</button><button type="button" data-action="submit">Approve &amp; submit now</button></div></section>`;
      document.body.append(dialog);
      const counter=dialog.querySelector('#ains-auto-count'), cancel=dialog.querySelector('[data-action="cancel"]'), approve=dialog.querySelector('[data-action="submit"]');
      let seconds=APPROVAL_SECONDS, settled=false;
      const finish=value=>{if(settled)return;settled=true;clearInterval(timer);dialog.remove();resolve(value);};
      cancel.addEventListener('click',()=>finish(false));
      approve.addEventListener('click',()=>finish(true));
      const timer=setInterval(()=>{seconds--;counter.textContent=String(Math.max(0,seconds));if(seconds<=0)finish(true);},1000);
    });
  }
  function escapeHtml(value) { const el=document.createElement('span'); el.textContent=String(value??''); return el.innerHTML; }
  function clickAinsSubmit() {
    const send=document.querySelector('#wizSubmit');
    if(!send) throw new Error('Could not find the AINS Hantar Rekod button.');
    job.phase='submitting';saveJob();send.click();
  }
  async function waitForManualResult(record) {
    update(`Waiting for AINS to confirm Excel row ${record.row}…`);
    ui.shade.hidden=true;
    while(!stopRequested) {
      await wait(500);
      const heading=(document.querySelector('#workArea .empty-state h3')?.innerText||'').trim();
      if(/terima kasih|thank you|谢谢/i.test(heading)) return true;
      if(/rekod anda gagal|rekod gagal dihantar|could not be submitted|record failed|record submission failed|gagal dihantar|未能提交|记录提交失败/i.test(heading)) {
        if(/3\s*min|three minutes|tiga minit/i.test(document.querySelector('#workArea .empty-state')?.innerText||'')) {
          job.phase='cooldown-retry'; job.due=Date.now()+AINS_RETRY_WAIT_MS; job.didReloadAfterWait=false; saveJob(); return false;
        }
        throw new Error('AINS reported a submission failure. The importer paused; check the record list before retrying this row.');
      }
    }
    return false;
  }
  async function advanceStep(step) {
    const next=document.querySelector('#wizNext'); if(!next) throw new Error('Could not find the next-step button.');
    next.click(); await wait(450);
    const active=Number(document.querySelector('.wiz-step.is-active')?.dataset.step);
    if(active!==step+1) {
      const problem=document.querySelector('.wiz-step.is-active .is-invalid');
      throw new Error(problem?'AINS rejected a required value. Check the Excel column mapping and row data.':'The AINS wizard did not advance to the next step.');
    }
  }
  async function countdown() {
    const due=job.due||Date.now()+WAIT_MS;
    while(Date.now()<due&&!stopRequested) {
      const left=Math.ceil((due-Date.now())/1000),m=Math.floor(left/60),s=String(left%60).padStart(2,'0');
      update(job.phase==='cooldown-retry'?`AINS asked you to wait. Row ${job.rows[job.index]?.row} will be prepared again in ${m}:${s}.`:`Record sent. Next record in ${m}:${s}.`);
      ui.launch.textContent=job.phase==='cooldown-retry'?`Excel retry · ${m}:${s}`:`Excel next · ${m}:${s}`;
      await wait(Math.min(1000,due-Date.now()));
    }
    if(!stopRequested && !job.didReloadAfterWait) {
      job.didReloadAfterWait=true;saveJob();ui.shade.hidden=true;
      if(/new-record-book/i.test(location.pathname)) location.reload();
      else location.assign('/web/new-record-book');
      return false;
    }
    if(!stopRequested) ui.shade.hidden=true;
    return !stopRequested;
  }
  async function openNewRecord() {
    if(document.querySelector('#wizForm')) return;
    const link=[...document.querySelectorAll('#workArea a[href]')].find(a=>/new-record-book/i.test(a.getAttribute('href')||''));
    if(link){link.click(); await wait(500);}
    if(!await until(()=>document.querySelector('#wizForm'),30000)) throw new Error('Could not reopen the new-record form. Use the “Tambah Rekod Lagi” link and resume.');
  }
  async function resumeJob() {
    if(activeRun||!job||job.stopAfterCurrent)return;
    activeRun=true; stopRequested=false;
    try {
      if(job.phase==='submitting') throw new Error('The page reloaded during submission. Check the AINS record list before restarting this row.');
      while(job&&job.index<job.rows.length&&!stopRequested) {
        if(job.phase==='waiting'||job.phase==='cooldown-retry') {
          const retry=job.phase==='cooldown-retry';
          if(!await countdown()) break;
          if(!retry) job.index++;
          job.due=null;job.phase='ready';job.didReloadAfterWait=false;saveJob();
          if(job.index>=job.rows.length) break;
          await openNewRecord();
        }
        const record=job.rows[job.index];
        if(job.phase==='ready') {
          update(`Slowly filling Excel row ${record.row} of ${job.rows.at(-1).row}…`);
          await enterRecord(record);
        }
        if(job.phase==='awaiting-approval'||job.phase==='awaiting-manual-submit'||job.phase==='submitting') {
          const formReady=await until(()=>document.querySelector('#wizForm'),10000);
          if(!formReady) throw new Error('The form is no longer open. Check the AINS record list before restarting the import.');
          const titleField=document.querySelector('#wizForm [name="tajuk"]');
          if(!titleField?.value) { job.phase='ready';saveJob();continue; }
          if(job.phase==='awaiting-approval') {
            if(await approvalDialog(record)) clickAinsSubmit();
            else { job.phase='awaiting-manual-submit';saveJob();update('Approval cancelled. Edit the details and submit this record yourself when ready.'); }
          }
          if(job.phase==='awaiting-manual-submit'||job.phase==='submitting') {
            const submitted=await waitForManualResult(record);
            if(submitted) {
            job.lastSubmittedRow=record.row;job.lastSubmittedTitle=rowData(record).title;
            await storeConfirmedRecord(record);
            ui.shade.hidden=true;
            if(job.index>=job.rows.length-1) {
              job=null;saveJob();update('All selected Excel rows were submitted. Importer closed.');
              ui.launch.textContent='Excel Import';ui.stop.hidden=true;ui.start.hidden=false;ui.start.disabled=true;return;
            }
            job.phase='waiting';job.due=Date.now()+WAIT_MS;job.waitDurationMs=WAIT_MS;job.didReloadAfterWait=false;saveJob();
            }
          }
        }
      }
      if(stopRequested){if(job){job=null;saveJob();} update('Import stopped. No further rows will be prepared.');ui.shade.hidden=true;ui.launch.textContent='Excel Import';ui.stop.hidden=true;ui.start.hidden=false;}
    } catch(error) {
      if(job){job.phase='paused';job.error=error.message;saveJob();}
      update(error.message||'The import paused because of an error.'); ui.shade.hidden=false;ui.stop.hidden=true;ui.start.hidden=false;ui.start.disabled=false;
    } finally { activeRun=false; }
  }
  function boot() {
    if(!document.body)return;
    addUI();
    if(job&&job.phase==='paused') { ui.start.hidden=false;ui.stop.hidden=true;update(job.error||'Import paused. Unlock the admin-only importer, check AINS, then restart from the selected row.'); }
    if(job&&job.phase!=='paused'&&adminUnlocked) storedAdminCredential().then(credential=>{if(credential&&adminUnlocked)resumeJob();}).catch(()=>{});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  const bootObserver=new MutationObserver(()=>{if(!document.getElementById('ains-bulk-launch')) boot();});
  bootObserver.observe(document.documentElement,{childList:true,subtree:true});
})();
