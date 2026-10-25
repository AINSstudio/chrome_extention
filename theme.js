 (async () => {
  const CONFIG_KEY='ainsStudioConfigV1';
  const config=(await chrome.storage.local.get(CONFIG_KEY))[CONFIG_KEY]||{};
  if(config.enabled===false)return;
  const features=config.features||{};
  const ANNOUNCEMENT_DISMISS_KEY='ainsStudioDismissAnnouncementV1';
  // Preserve browser-native clipboard events when the AINS page cancels them.
  if(features.clipboard!==false)for(const type of ['copy','cut','paste','contextmenu'])document.addEventListener(type,event=>event.stopImmediatePropagation(),{capture:true});

  const scanAnnouncements=async node=>{
    const candidates=[];
    if(node instanceof Element){const ancestor=node.closest('.modal,[role="dialog"],[aria-modal="true"]');if(ancestor)candidates.push(ancestor);if(node.matches('[role="dialog"],[aria-modal="true"],.modal'))candidates.push(node)}
    node.querySelectorAll?.('[role="dialog"],[aria-modal="true"],.modal').forEach(el=>candidates.push(el));
    for(const candidate of candidates){
      const modal=candidate.closest('.modal')||candidate;
      if(modal.dataset.ainsAnnouncementHandled)continue;
      const heading=modal.querySelector('.modal-title,h1,h2,h3,h4,h5,[role="heading"],[data-title]');
      if(!/pengumuman|announcement/i.test(heading?.textContent||''))continue;
      modal.dataset.ainsAnnouncementHandled='true';
      const saved=(await chrome.storage.local.get(ANNOUNCEMENT_DISMISS_KEY))[ANNOUNCEMENT_DISMISS_KEY]===true;
      if(saved){
        const close=modal.querySelector('[data-bs-dismiss="modal"],[data-dismiss="modal"],.btn-close,button.close,[aria-label*="close" i],[aria-label*="tutup" i]');
        if(close)close.click();else{modal.hidden=true;modal.setAttribute('aria-hidden','true');modal.classList.remove('show','in');document.querySelectorAll('.modal-backdrop').forEach(backdrop=>backdrop.remove());document.body.classList.remove('modal-open');}
        continue;
      }
      const label=document.documentElement.lang?.toLowerCase()||'ms';
      const text=label.startsWith('zh')?`不再显示`:label.startsWith('en')?'Don’t show again':'Jangan tunjukkan lagi';
      const choice=document.createElement('label');choice.className='ains-announcement-choice';
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.setAttribute('aria-label',text);
      const caption=document.createElement('span');caption.textContent=text;choice.append(checkbox,caption);
      checkbox.addEventListener('change',()=>chrome.storage.local.set({[ANNOUNCEMENT_DISMISS_KEY]:checkbox.checked}));
      const target=modal.querySelector('.modal-footer,.modal-body')||modal;target.append(choice);
    }
  };
  const watchAnnouncements=()=>{scanAnnouncements(document);const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===Node.ELEMENT_NODE)scanAnnouncements(node)})));observer.observe(document.documentElement,{subtree:true,childList:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchAnnouncements,{once:true});else watchAnnouncements();

(() => {
  const THEME_KEY = 'ains-glass-theme';
  const LANG_KEY = 'ains-studio-language';
  const root = document.documentElement;
  const originals = new WeakMap();
  const originalAttrs = new WeakMap();
  const languageNames = { ms: 'Bahasa Melayu', en: 'English', zh: '中文' };
  const words = {
    en: {
      'Makluman':'Notice','Rekod bacaan hanya boleh ditambah semula selepas tempoh 3 minit.':'Reading records can only be added again after 3 minutes.','Sila cuba lagi selepas 3 minit.':'Please try again after 3 minutes.','Tambah Rekod Bacaan':'Add Reading Record','e-Buku':'e-Book','Jenis Bahan (e-Buku)':'Material Type (e-Book)',
      'Penampilan':'Appearance','Sistem':'System','Cerah':'Light','Gelap':'Dark','Bahasa':'Language',
      'Menu Utama':'Main Menu','Papan Pemuka':'Dashboard','Tambah Rekod Bacaan Baru':'Add New Reading Record','Senarai Rekod Bacaan':'Reading Records','Carta Pendahulu':'Leaderboard','Bahan Bacaan':'Reading Materials','Ciptaan Saya':'My Creations','Pusat Bacaan':'Reading Centre',
      'Buku / e-Buku':'Book / e-Book','Sumber Digital':'Digital Resource','Artikel / Jurnal / Lain-Lain':'Article / Journal / Others','Tambah Rekod Bacaan — Buku / e-Buku':'Add Reading Record — Book / e-Book','Tambah Rekod Bacaan — Sumber Digital':'Add Reading Record — Digital Resource','Tambah Rekod Bacaan — Artikel / Jurnal / Lain-Lain':'Add Reading Record — Article / Journal / Others',
      'Langkah':'Step','Kategori dan Jenis':'Category and Type','Maklumat Bacaan':'Reading Details','Penilaian dan Rumusan':'Rating and Summary','Semakan':'Review','Sila semak maklumat di bawah sebelum menghantar.':'Review the information below before submitting.','Mula dengan memberitahu kami jenis bahan yang anda baca.':'First, tell us what type of material you read.','Isi maklumat bahan bacaan.':'Enter the reading material details.',
      'Kategori':'Category','Jenis Bahan':'Material Type','Jenis Sumber':'Resource Type','Jenis Penerbitan':'Publication Type','- Sila pilih -':'- Please select -','Fiksyen':'Fiction','Bukan Fiksyen':'Non-fiction','Fizikal':'Physical','Lain-lain':'Other','English':'English','Tajuk':'Title','Tahun Terbitan':'Publication Year','Penulis':'Author','ISBN':'ISBN','Bilangan Mukasurat':'Number of Pages','Penerbit':'Publisher','Pautan / Laman Web':'Link / Website','Kulit Buku / Imej':'Book Cover / Image','Format JPG atau PNG, maksimum 2 MB.':'JPG or PNG format, maximum 2 MB.',
      'Penilaian anda':'Your Rating','Belum dinilai':'Not rated yet','Kurang menarik':'Not interesting','Sederhana':'Average','Baik':'Good','Sangat baik':'Very good','Terbaik!':'Excellent!','Rumusan':'Summary','Pengajaran':'What I Learned','Tekan butang mikrofon untuk mula bercakap, atau taip di sini…':'Press the microphone button to speak, or type here…','Apakah yang anda pelajari daripada bacaan ini?':'What did you learn from this reading?','Sedia':'Ready','Kosongkan':'Clear','Aksara':'characters','Bahasa Melayu':'Malay','Pelayar tidak menyokong rakaman suara — sila taip':'Speech recording is not supported by this browser — please type',
      'Sebelumnya':'Previous','Seterusnya':'Next','Hantar Rekod':'Submit Record','Anda pasti?':'Are you sure?','Rekod ini akan dihantar kepada guru anda untuk pengesahan. Anda masih boleh mengemaskini sebelum ia disahkan.':'This record will be sent to your teacher for approval. You can still edit it before it is approved.','Ya, saya sahkan maklumat di atas adalah betul.':'Yes, I confirm the information above is correct.','Sila tandakan pengesahan sebelum menghantar.':'Please confirm before submitting.','Rekod Dihantar':'Record Submitted','Rekod anda sedang dihantar':'Your record is being submitted','Sila tunggu sebentar.':'Please wait.','Terima kasih! Rekod anda telah dihantar.':'Thank you! Your record has been submitted.','kini menunggu pengesahan guru. Anda boleh menyemak status di Senarai Rekod Bacaan.':'is now waiting for teacher approval. You can check its status in Reading Records.','Lihat Senarai Rekod':'View Reading Records','Tambah Rekod Lagi':'Add Another Record','Rekod Gagal Dihantar':'Record Submission Failed','Rekod anda gagal dihantar.':'Your record could not be submitted.','Sila cuba sekali lagi':'Please try again','Ralat rangkaian — sila cuba sekali lagi.':'Network error — please try again.','Ruangan ini wajib diisi.':'This field is required.','Sila masukkan pautan yang sah (http:// atau https://).':'Enter a valid link (http:// or https://).','Hanya fail JPG atau PNG dibenarkan.':'Only JPG or PNG files are allowed.','Saiz fail melebihi 2 MB.':'The file is larger than 2 MB.','Rumusan mestilah lebih dari 100 aksara':'The summary must be at least 100 characters.','Pengajaran mestilah lebih dari 100 aksara':'The learning reflection must be at least 100 characters.',
      'Aktiviti Terkini':'Recent Activity','Lihat Semua':'View All','Jumlah Rekod Bacaan Tahun Semasa':'Reading Records This Year','Jumlah Rekod Bacaan Keseluruhan':'Total Reading Records','Jumlah Rekod Buku / e-Buku':'Book / e-Book Records','Jumlah Rekod Sumber Digital':'Digital Resource Records','Jumlah Rekod Artikel / Jurnal / Lain-Lain':'Article / Journal / Other Records','Menunggu Pengesahan':'Awaiting Approval','Kemaskini':'Edit','Lihat Profil':'View Profile','Mata':'points','Log Keluar':'Log Out','Profil':'Profile','Emel kepada':'Email','untuk sokongan':'for support','Sistem KPM':'MOE Systems','Maklumat Sistem':'System Information','Penafian':'Disclaimer','Dasar Privasi':'Privacy Policy','Dasar keselamatan':'Security Policy','Cari tajuk, penulis atau rumusan...':'Search title, author, or summary...','Cari tajuk, penulis atau rumusan…':'Search title, author, or summary…','Tarikh Direkod':'Date Recorded','Tambah Rekod':'Add Record','Rekod Bacaan':'Reading Records','rekod':'records','Rekod':'Record','Semua':'All','Status':'Status','Jenis':'Type','Tarikh':'Date','Carian':'Search','Susun mengikut':'Sort by','Tiada rekod':'No records','Rekod dipaparkan':'Records shown','SUMMARY':'SUMMARY','WHAT I LEARNED':'WHAT I LEARNED'
    },
    zh: {
      'Makluman':'提示','Rekod bacaan hanya boleh ditambah semula selepas tempoh 3 minit.':'阅读记录需间隔 3 分钟后才能再次添加。','Sila cuba lagi selepas 3 minit.':'请在 3 分钟后重试。','Tambah Rekod Bacaan':'添加阅读记录','e-Buku':'电子书','Jenis Bahan (e-Buku)':'材料类型（电子书）',
      'Penampilan':'外观','Sistem':'跟随系统','Cerah':'浅色','Gelap':'深色','Bahasa':'语言',
      'Menu Utama':'主菜单','Papan Pemuka':'仪表板','Tambah Rekod Bacaan Baru':'新增阅读记录','Senarai Rekod Bacaan':'阅读记录','Carta Pendahulu':'排行榜','Bahan Bacaan':'阅读材料','Ciptaan Saya':'我的创作','Pusat Bacaan':'阅读中心',
      'Buku / e-Buku':'书籍 / 电子书','Sumber Digital':'数字资源','Artikel / Jurnal / Lain-Lain':'文章 / 期刊 / 其他','Tambah Rekod Bacaan — Buku / e-Buku':'新增阅读记录 — 书籍 / 电子书','Tambah Rekod Bacaan — Sumber Digital':'新增阅读记录 — 数字资源','Tambah Rekod Bacaan — Artikel / Jurnal / Lain-Lain':'新增阅读记录 — 文章 / 期刊 / 其他',
      'Langkah':'步骤','Kategori dan Jenis':'类别与类型','Maklumat Bacaan':'阅读资料','Penilaian dan Rumusan':'评分与总结','Semakan':'检查','Sila semak maklumat di bawah sebelum menghantar.':'提交前请检查以下资料。','Mula dengan memberitahu kami jenis bahan yang anda baca.':'请先选择您阅读的材料类型。','Isi maklumat bahan bacaan.':'填写阅读材料资料。',
      'Kategori':'类别','Jenis Bahan':'材料类型','Jenis Sumber':'资源类型','Jenis Penerbitan':'出版类型','- Sila pilih -':'- 请选择 -','Fiksyen':'小说','Bukan Fiksyen':'非小说','Fizikal':'实体书','Lain-lain':'其他','English':'英语','Tajuk':'标题','Tahun Terbitan':'出版年份','Penulis':'作者','ISBN':'ISBN','Bilangan Mukasurat':'页数','Penerbit':'出版社','Pautan / Laman Web':'链接 / 网站','Kulit Buku / Imej':'封面 / 图片','Format JPG atau PNG, maksimum 2 MB.':'JPG 或 PNG 格式，最大 2 MB。',
      'Penilaian anda':'您的评分','Belum dinilai':'尚未评分','Kurang menarik':'不太有趣','Sederhana':'一般','Baik':'好','Sangat baik':'很好','Terbaik!':'非常棒！','Rumusan':'内容摘要','Pengajaran':'阅读心得','Tekan butang mikrofon untuk mula bercakap, atau taip di sini…':'按麦克风按钮开始说话，或在此输入…','Apakah yang anda pelajari daripada bacaan ini?':'您从这篇阅读中学到了什么？','Sedia':'就绪','Kosongkan':'清除','Aksara':'字','Bahasa Melayu':'马来语','Pelayar tidak menyokong rakaman suara — sila taip':'此浏览器不支持语音录制，请输入文字',
      'Sebelumnya':'上一步','Seterusnya':'下一步','Hantar Rekod':'提交记录','Anda pasti?':'请确认','Rekod ini akan dihantar kepada guru anda untuk pengesahan. Anda masih boleh mengemaskini sebelum ia disahkan.':'此记录将发送给老师审核。审核前您仍可修改。','Ya, saya sahkan maklumat di atas adalah betul.':'我确认以上资料正确。','Sila tandakan pengesahan sebelum menghantar.':'提交前请勾选确认。','Rekod Dihantar':'记录已提交','Rekod anda sedang dihantar':'正在提交记录','Sila tunggu sebentar.':'请稍候。','Terima kasih! Rekod anda telah dihantar.':'谢谢！您的记录已提交。','kini menunggu pengesahan guru. Anda boleh menyemak status di Senarai Rekod Bacaan.':'正在等待老师审核。您可以在阅读记录中查看状态。','Lihat Senarai Rekod':'查看阅读记录','Tambah Rekod Lagi':'再添加一条记录','Rekod Gagal Dihantar':'记录提交失败','Rekod anda gagal dihantar.':'您的记录未能提交。','Sila cuba sekali lagi':'请重试','Ralat rangkaian — sila cuba sekali lagi.':'网络错误 — 请重试。','Ruangan ini wajib diisi.':'此栏为必填项。','Sila masukkan pautan yang sah (http:// atau https://).':'请输入有效链接（http:// 或 https://）。','Hanya fail JPG atau PNG dibenarkan.':'仅允许 JPG 或 PNG 文件。','Saiz fail melebihi 2 MB.':'文件超过 2 MB。','Rumusan mestilah lebih dari 100 aksara':'摘要至少需要 100 个字符。','Pengajaran mestilah lebih dari 100 aksara':'阅读心得至少需要 100 个字符。',
      'Aktiviti Terkini':'最新活动','Lihat Semua':'查看全部','Jumlah Rekod Bacaan Tahun Semasa':'本年度阅读记录','Jumlah Rekod Bacaan Keseluruhan':'阅读记录总数','Jumlah Rekod Buku / e-Buku':'书籍 / 电子书记录','Jumlah Rekod Sumber Digital':'数字资源记录','Jumlah Rekod Artikel / Jurnal / Lain-Lain':'文章 / 期刊 / 其他记录','Menunggu Pengesahan':'等待审核','Kemaskini':'编辑','Lihat Profil':'查看个人资料','Mata':'分','Log Keluar':'退出登录','Profil':'个人资料','Emel kepada':'发送电邮至','untuk sokongan':'以获取帮助','Sistem KPM':'教育部系统','Maklumat Sistem':'系统信息','Penafian':'免责声明','Dasar Privasi':'隐私政策','Dasar keselamatan':'安全政策','Reading Records':'阅读记录','Cari tajuk, penulis atau rumusan...':'搜索标题、作者或摘要…','Cari tajuk, penulis atau rumusan…':'搜索标题、作者或摘要…','Tarikh Direkod':'记录日期','Tambah Rekod':'添加记录','Rekod Bacaan':'阅读记录','rekod':'记录','Rekod':'记录','Semua':'全部','Status':'状态','Jenis':'类型','Tarikh':'日期','Carian':'搜索','Susun mengikut':'排序方式','Tiada rekod':'没有记录','Rekod dipaparkan':'显示记录','SUMMARY':'内容摘要','WHAT I LEARNED':'阅读心得','Book / e-Book':'书籍 / 电子书','Awaiting Approval':'等待审核','Edit':'编辑','View All':'查看全部',
      'YOUR READING, AT A GLANCE':'阅读概览','Reading overview':'阅读概览','Scan every page of your AINS record list for complete totals. Your scan stays on this device.':'扫描 AINS 记录列表的所有页面以获取完整统计。扫描数据仅保存在此设备。','Scan all record pages':'扫描所有记录页面','Counts are based on the last complete scan.':'统计数据来自最近一次完整扫描。','This year':'今年','records dated in':'记录日期属于','Today':'今天','records dated today':'今天的记录','Collected here':'本机收集','unique records seen on this device':'此设备上收集到的唯一记录','AINS-reported total':'AINS 报告总数','YOUR LOG':'记录','Records by date':'按日期查看记录','Choose a date':'选择日期','RECENT PACE':'近期进度','Last 7 days':'最近 7 天','Records seen by date':'按日期统计的记录','EXCEL ASSIST':'Excel 助手','Auto-entry status':'自动录入状态','Idle':'空闲','No Excel batch running':'没有正在运行的 Excel 批次','When an import is active, its current row and 3-minute wait will appear here.':'导入运行时，这里会显示当前行和 3 分钟等待时间。','No active row':'没有活动行','Private to this browser':'仅此浏览器可见','This page is supplied by the extension. Record dates and titles are stored in Chrome extension storage on this device and are not uploaded.':'此页面由扩展提供。记录日期和标题保存在此设备的 Chrome 扩展存储中，不会上传。','AINS Studio · client-only dashboard':'AINS Studio · 本地仪表板','Not scanned yet — counts may be partial.':'尚未扫描，统计可能不完整。','Rescan all pages':'重新扫描所有页面','Retry full scan':'重试完整扫描','Opening your AINS record list…':'正在打开 AINS 记录列表…','Scan incomplete:':'扫描未完成：','No local records for this date yet':'此日期尚无本地记录','Visit your AINS Reading Records page to collect visible entries.':'打开 AINS 阅读记录页面以收集当前显示的记录。','Recorded':'已记录','Preparing':'准备中','Entering row':'正在录入','Approval countdown':'确认倒计时','Ready for review':'等待检查','Submitting':'正在提交','3-minute cooldown':'3 分钟冷却等待','Retry cooldown':'重试等待','Paused':'已暂停','Waiting before the next attempt':'等待下一次尝试','Next row:':'下一行：','Just submitted:':'刚提交：','Retry next:':'即将重试：','No row submitted yet':'尚未提交任何行','Back to AINS':'返回 AINS','Refresh now':'立即刷新','Live on this device':'此设备实时更新','Choose a date to see matching records.':'选择日期以查看相符记录。','Waiting before the next attempt':'等待下一次尝试','The 9-second review prompt is displayed on the record tab.':'记录页面会显示 9 秒确认提示。','The record approval timer is active.':'记录确认倒计时正在运行。','Progress is refreshed from the active importer tab.':'进度会从正在运行的导入标签页更新。','Next row will start after the required 3-minute interval.':'下一个记录将在规定的 3 分钟间隔后开始。'
    },
    ms: {
      'YOUR READING, AT A GLANCE':'RINGKASAN BACAAN ANDA','Reading overview':'Ringkasan bacaan','Scan every page of your AINS record list for complete totals. Your scan stays on this device.':'Imbas semua halaman rekod AINS untuk jumlah lengkap. Imbasan disimpan pada peranti ini.','Scan all record pages':'Imbas semua halaman rekod','Counts are based on the last complete scan.':'Kiraan berdasarkan imbasan lengkap terakhir.','This year':'Tahun ini','records dated in':'rekod bertarikh pada','Today':'Hari ini','records dated today':'rekod bertarikh hari ini','Collected here':'Dikumpulkan di sini','unique records seen on this device':'rekod unik yang ditemui pada peranti ini','AINS-reported total':'Jumlah yang dilaporkan AINS','YOUR LOG':'LOG ANDA','Records by date':'Rekod mengikut tarikh','Choose a date':'Pilih tarikh','RECENT PACE':'AKTIVITI TERKINI','Last 7 days':'7 hari lalu','Records seen by date':'Rekod mengikut tarikh','EXCEL ASSIST':'BANTUAN EXCEL','Auto-entry status':'Status isian automatik','Idle':'Tidak aktif','No Excel batch running':'Tiada kelompok Excel sedang berjalan','When an import is active, its current row and 3-minute wait will appear here.':'Semasa import berjalan, baris semasa dan tempoh menunggu 3 minit akan dipaparkan di sini.','No active row':'Tiada baris aktif','Private to this browser':'Peribadi pada pelayar ini','This page is supplied by the extension. Record dates and titles are stored in Chrome extension storage on this device and are not uploaded.':'Halaman ini disediakan oleh sambungan. Tarikh dan tajuk rekod disimpan dalam storan sambungan Chrome pada peranti ini dan tidak dimuat naik.','AINS Studio · client-only dashboard':'AINS Studio · papan pemuka pada peranti ini','Not scanned yet — counts may be partial.':'Belum diimbas — kiraan mungkin belum lengkap.','Rescan all pages':'Imbas semula semua halaman','Retry full scan':'Cuba semula imbasan penuh','Opening your AINS record list…':'Membuka senarai rekod AINS…','Scan incomplete:':'Imbasan tidak lengkap:','No local records for this date yet':'Belum ada rekod setempat untuk tarikh ini','Visit your AINS Reading Records page to collect visible entries.':'Buka halaman Rekod Bacaan AINS untuk mengumpulkan rekod yang dipaparkan.','Recorded':'Direkodkan','Awaiting approval':'Menunggu pengesahan','Preparing':'Menyediakan','Entering row':'Mengisi baris','Approval countdown':'Kiraan detik pengesahan','Ready for review':'Sedia untuk disemak','Submitting':'Menghantar','3-minute cooldown':'Tempoh menunggu 3 minit','Retry cooldown':'Tempoh menunggu sebelum cuba semula','Paused':'Dijeda','Waiting before the next attempt':'Menunggu sebelum percubaan seterusnya','Next row:':'Baris seterusnya:','Just submitted:':'Baru dihantar:','Retry next:':'Cuba semula baris:','No row submitted yet':'Belum ada baris dihantar','Back to AINS':'Kembali ke AINS','Refresh now':'Muat semula sekarang','Live on this device':'Dikemas kini pada peranti ini','Choose a date to see matching records.':'Pilih tarikh untuk melihat rekod yang sepadan.','The 9-second review prompt is displayed on the record tab.':'Dialog pengesahan 9 saat dipaparkan pada tab rekod.','Progress is refreshed from the active importer tab.':'Kemajuan dikemas kini daripada tab import yang aktif.','Next row will start after the required 3-minute interval.':'Baris seterusnya akan bermula selepas tempoh 3 minit yang ditetapkan.'
    }
  };

  Object.assign(words.ms,{'3-second countdown':'Kiraan detik 3 saat','3-minute wait':'Tempoh menunggu 3 minit','3-second approval':'Pengesahan 3 saat','AINS retry wait':'Masa menunggu percubaan AINS','AINS asked for a longer wait':'AINS meminta tempoh menunggu lebih lama','Next row starts after this 3-second countdown.':'Baris seterusnya bermula selepas tempoh menunggu 3 minit.','AINS rate limit detected; this retry waits 3 minutes.':'Had kadar AINS dikesan; percubaan semula menunggu 3 minit.'});
  Object.assign(words.zh,{'3-second countdown':'等待 3 分钟','3-minute wait':'等待 3 分钟','3-second approval':'3 秒确认','AINS retry wait':'AINS 重试等待','AINS asked for a longer wait':'AINS 要求延长等待时间','Next row starts after this 3-second countdown.':'等待 3 分钟后开始下一行。','AINS rate limit detected; this retry waits 3 minutes.':'检测到 AINS 频率限制；重试将等待 3 分钟。'});

  Object.assign(words.ms,{'3-second countdown':'Kiraan detik 3 saat','AINS retry wait':'Masa menunggu percubaan AINS','AINS asked for a longer wait':'AINS meminta tempoh menunggu lebih lama','Next row starts after this 3-second countdown. AINS rate-limit retries still wait 3 minutes.':'Baris seterusnya bermula selepas kiraan detik 3 saat. Jika had kadar AINS dicapai, percubaan semula menunggu 3 minit.','AINS rate limit detected; this retry waits 3 minutes.':'Had kadar AINS dikesan; percubaan semula menunggu 3 minit.','Your visible reading activity':'Aktiviti bacaan yang dipaparkan','Records are collected from AINS activity and records pages as you visit them. This device keeps the local snapshot up to date.':'Rekod dikumpulkan daripada halaman aktiviti dan rekod AINS yang anda lawati. Peranti ini mengemas kini salinan setempat.','Digital resource':'Sumber Digital','Article / journal':'Artikel / Jurnal'});
  Object.assign(words.zh,{'3-second countdown':'3 秒倒计时','AINS retry wait':'AINS 重试等待','AINS asked for a longer wait':'AINS 要求延长等待时间','Next row starts after this 3-second countdown. AINS rate-limit retries still wait 3 minutes.':'3 秒倒计时后开始下一行；如果触发 AINS 频率限制，重试仍需等待 3 分钟。','AINS rate limit detected; this retry waits 3 minutes.':'检测到 AINS 频率限制；重试将等待 3 分钟。','Your visible reading activity':'当前阅读活动','Records are collected from AINS activity and records pages as you visit them. This device keeps the local snapshot up to date.':'访问 AINS 活动和记录页面时，扩展会收集记录。本设备会更新本地快照。','Digital resource':'数字资源','Article / journal':'文章 / 期刊'});
  Object.assign(words.ms,{'The 9-second review prompt is displayed on the record tab.':'Dialog pengesahan 3 saat dipaparkan pada tab rekod.','The 3-second approval prompt is displayed on the record tab.':'Dialog pengesahan 3 saat dipaparkan pada tab rekod.','Next row starts after this 3-minute wait.':'Baris seterusnya bermula selepas tempoh menunggu 3 minit.','3-second approval':'Pengesahan 3 saat','3-minute wait':'Tempoh menunggu 3 minit','Approval prompts count down for 3 seconds. After each submission, the importer waits 3 minutes; AINS rate-limit retries also wait 3 minutes.':'Dialog pengesahan mempunyai kiraan detik 3 saat. Selepas setiap penghantaran, import menunggu 3 minit; percubaan semula akibat had kadar AINS juga menunggu 3 minit.'});
  Object.assign(words.zh,{'The 9-second review prompt is displayed on the record tab.':'记录页面会显示 3 秒确认提示。','The 3-second approval prompt is displayed on the record tab.':'记录页面会显示 3 秒确认提示。','Next row starts after this 3-minute wait.':'等待 3 分钟后开始下一条记录。','3-second approval':'3 秒确认','3-minute wait':'等待 3 分钟','Approval prompts count down for 3 seconds. After each submission, the importer waits 3 minutes; AINS rate-limit retries also wait 3 minutes.':'确认提示倒计时为 3 秒。每次提交后，导入器会等待 3 分钟；AINS 限流重试也会等待 3 分钟。'});

  const applyTheme = theme => {
    if(features.appearance===false){delete root.dataset.ainsTheme;return;}
    root.dataset.ainsTheme = theme;
    document.querySelectorAll('#ains-glass-menu [data-theme]').forEach(el => el.setAttribute('aria-checked', String(el.dataset.theme === theme)));
  };
  const liquidSurfaceSelector='#ains-glass-toggle,#ains-glass-menu,#ains-update-toast,#ains-studio-page .as-card,#ains-studio-page .as-metric,#ains-studio-page .as-extension-status,#ains-studio-page .as-extension-module,#ains-studio-page .as-date-chip,#ains-studio-page .as-back,#ains-studio-page .as-icon-button,#ains-studio-page button,body :is(.panel,.card,.wiz-body,.wiz-foot,.confirm-box,.review-card,.ains-record-row)';
  const markOneLiquidSurface=el=>{el.classList.add('ains-liquid-surface');if(getComputedStyle(el).position==='static')el.style.position='relative'};
  const markLiquidSurfaces=(node=document)=>{
    if(features.appearance===false)return;
    if(node instanceof Element&&node.matches(liquidSurfaceSelector))markOneLiquidSurface(node);
    node.querySelectorAll?.(liquidSurfaceSelector).forEach(markOneLiquidSurface);
  };
  const liquidButtonSelector='body button,body a.btn,body .btn,#ains-studio-page .as-back,#ains-glass-menu .ag-shortcut';
  const markLiquidButtons=(node=document)=>{
    if(features.appearance===false)return;
    if(node instanceof Element&&node.matches(liquidButtonSelector))node.classList.add('ains-liquid-button');
    node.querySelectorAll?.(liquidButtonSelector).forEach(el=>el.classList.add('ains-liquid-button'));
  };
  document.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse')return;
    const surface=event.target.closest?.('.ains-liquid-surface');if(!surface)return;
    const box=surface.getBoundingClientRect();if(!box.width||!box.height)return;
    surface.style.setProperty('--ains-glass-x',`${Math.round((event.clientX-box.left)/box.width*100)}%`);
    surface.style.setProperty('--ains-glass-y',`${Math.round((event.clientY-box.top)/box.height*100)}%`);
  },{passive:true});
  const tr = (text, lang) => {
    const translated = (words[lang] && words[lang][text]) || text;
    if (translated !== text || !lang) return translated;
    let match=text.match(/^(\d+) today · ([\d,]+) so far this year$/);
    if(match)return lang==='zh'?`今天 ${match[1]} 条 · 今年至今 ${match[2]} 条`:lang==='ms'?`${match[1]} hari ini · ${match[2]} setakat tahun ini`:text;
    match=text.match(/^Scanning page (\d+) · (\d+) records found(?: of ([\d,]+))?…$/);
    if(match)return lang==='zh'?`正在扫描第 ${match[1]} 页 · 已找到 ${match[2]} 条记录${match[3]?`，共 ${match[3]} 条`:''}…`:lang==='ms'?`Mengimbas halaman ${match[1]} · ${match[2]} rekod ditemui${match[3]?` daripada ${match[3]}`:''}…`:text;
    match=text.match(/^Complete · (\d+) pages scanned · (\d+) records counted\.$/);
    if(match)return lang==='zh'?`完成 · 已扫描 ${match[1]} 页 · 共 ${match[2]} 条记录`:lang==='ms'?`Selesai · ${match[1]} halaman diimbas · ${match[2]} rekod dikira`:text;
    match=text.match(/^Complete · (\d+) pages · (\d+) records · (.+)$/);
    if(match)return lang==='zh'?`完整 · ${match[1]} 页 · ${match[2]} 条记录 · ${match[3]}`:lang==='ms'?`Lengkap · ${match[1]} halaman · ${match[2]} rekod · ${match[3]}`:text;
    match=text.match(/^Scanned (\d+) pages? · found (\d+) records(?: · AINS total ([\d,]+))?$/);
    if(match)return lang==='zh'?`已扫描 ${match[1]} 页 · 找到 ${match[2]} 条记录${match[3]?` · AINS 总数 ${match[3]}`:''}`:lang==='ms'?`Diimbas ${match[1]} halaman · ditemui ${match[2]} rekod${match[3]?` · jumlah AINS ${match[3]}`:''}`:text;
    match=text.match(/^Scan incomplete: (.+)$/);
    if(match)return lang==='zh'?`扫描未完成：${match[1]}`:lang==='ms'?`Imbasan tidak lengkap: ${match[1]}`:text;
    match=text.match(/^Count mismatch: AINS reports ([\d,]+); the old scan found ([\d,]+)\. Rescan to refresh the date breakdown\.$/);
    if(match)return lang==='zh'?`数量不一致：AINS 报告 ${match[1]} 条；旧扫描找到 ${match[2]} 条。请重新扫描以更新日期统计。`:lang==='ms'?`Kiraan tidak sepadan: AINS melaporkan ${match[1]}; imbasan lama menemui ${match[2]}. Imbas semula untuk mengemas kini pecahan tarikh.`:text;
    match=text.match(/^Last scan incomplete: (.+)$/);
    if(match)return lang==='zh'?`上次扫描未完成：${match[1]}`:lang==='ms'?`Imbasan terakhir tidak lengkap: ${match[1]}`:text;
    match=text.match(/^AINS-reported total · scan found ([\d,]+)$/);
    if(match)return lang==='zh'?`AINS 报告总数 · 扫描找到 ${match[1]}`:lang==='ms'?`Jumlah AINS · imbasan menemui ${match[1]}`:text;
    match=text.match(/^Excel row (\d+)(?: · (.+))?$/);
    if(match)return lang==='zh'?`Excel 第 ${match[1]} 行${match[2]?` · ${match[2]}`:''}`:lang==='ms'?`Baris Excel ${match[1]}${match[2]?` · ${match[2]}`:''}`:text;
    match=text.match(/^(Book \/ e-Book|Digital resource|Article \/ journal) · (.+)$/);
    if(match){const type=lang==='zh'?({'Book / e-Book':'书籍 / 电子书','Digital resource':'数字资源','Article / journal':'文章 / 期刊'}[match[1]]):({'Book / e-Book':'Buku / e-Buku','Digital resource':'Sumber Digital','Article / journal':'Artikel / Jurnal'}[match[1]]);return `${type} · ${match[2]}`}
    match=text.match(/^No collected records for (.+)$/);
    if(match)return lang==='zh'?`${match[1]} 没有已收集的记录`:lang==='ms'?`Tiada rekod yang dikumpulkan pada ${match[1]}`:text;
    match=text.match(/^(\d+) records? on (.+)$/);
    if(match)return lang==='zh'?`${match[2]} 有 ${match[1]} 条记录`:lang==='ms'?`${match[1]} rekod pada ${match[2]}`:text;
    if (lang === 'ms') return translated;
    const recordCount = text.match(/^(\d+)\s+rekod$/i);
    if (recordCount) return lang === 'zh' ? `${recordCount[1]} 条记录` : `${recordCount[1]} records`;
    const pointCount = text.match(/^(\d+)\s+mata$/i);
    if (pointCount) return lang === 'zh' ? `${pointCount[1]} 分` : `${pointCount[1]} points`;
    return translated;
  };
  let activeTranslation = 0;
  let progressTimer = 0;
  const showTranslationProgress = () => {
    let box = document.getElementById('ains-translation-progress');
    if (!box) {
      box = document.createElement('div');
      box.id = 'ains-translation-progress';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      box.innerHTML = '<span></span><i><b></b></i>';
      document.body.appendChild(box);
    }
    box.querySelector('span').textContent=({ms:'Sedang menterjemah halaman…',en:'Translating the page…',zh:'正在翻译页面…'})[language]||'Translating the page…';
    box.hidden = false;
    clearTimeout(progressTimer);
  };
  const hideTranslationProgress = () => {
    progressTimer = setTimeout(() => {
      const box = document.getElementById('ains-translation-progress');
      if (box) box.hidden = true;
    }, 650);
  };
  const translateNode = (node, lang) => {
    if(features.translator===false)return;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (!parent || parent.closest('script,style,textarea,input,code,pre,#ains-glass-toggle,#ains-glass-menu,#ains-translation-progress,#ains-date-filter')) return;
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    const original = originals.get(node);
    const trimmed = original.trim();
    if (!trimmed) return;
    const leading = original.match(/^\s*/)?.[0] || '';
    const trailing = original.match(/\s*$/)?.[0] || '';
    const next = leading + tr(trimmed.replace(/\s+/g, ' '), lang) + trailing;
    if (node.nodeValue !== next) node.nodeValue = next;
  };
  const translateAttrs = (el, lang) => {
    if(features.translator===false)return;
    if (!(el instanceof Element) || el.closest('#ains-glass-toggle,#ains-glass-menu,#ains-date-filter')) return;
    for (const attr of ['placeholder','title','aria-label']) {
      if (!el.hasAttribute(attr)) continue;
      let saved = originalAttrs.get(el);
      if (!saved) { saved = {}; originalAttrs.set(el, saved); }
      if (!(attr in saved)) saved[attr] = el.getAttribute(attr);
      const raw = saved[attr];
      saved[attr] = raw;
      el.setAttribute(attr, tr(raw.trim(), lang));
    }
  };
  const translateTree = (container, lang, run = activeTranslation, showProgress = true) => {
    if(features.translator===false)return Promise.resolve();
    if (!container || run !== activeTranslation) return Promise.resolve();
    if (showProgress && lang !== 'ms') showTranslationProgress();
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let current = null;
    if (container.nodeType === Node.ELEMENT_NODE) translateAttrs(container, lang);
    return new Promise(resolve => {
      const batch = () => {
        if (run !== activeTranslation) return resolve();
        let count = 0;
        while (count < 140 && (current = walker.nextNode())) {
          if (current.nodeType === Node.TEXT_NODE) translateNode(current, lang);
          else if (current.matches && current.matches('[placeholder],[title],[aria-label]')) translateAttrs(current, lang);
          count++;
        }
        if (current) setTimeout(batch, 0);
        else resolve();
      };
      setTimeout(batch, 0);
    });
  };
  const translatePage = async lang => {
    if(features.translator===false)return;
    const run = ++activeTranslation;
    if (lang !== 'ms') showTranslationProgress();
    await translateTree(document.body, lang, run);
    if (run === activeTranslation) hideTranslationProgress();
  };

  let updateActivityDateUI = () => {};
  let updateRecordListDateUI = () => {};
  const parseAinsDate = value => {
    if (!value) return '';
    const iso = value.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
    if (iso) return `${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}`;
    const numeric = value.match(/\b(\d{1,2})[/. -](\d{1,2})[/. -](20\d{2})\b/);
    if (numeric) return `${numeric[3]}-${String(numeric[2]).padStart(2,'0')}-${String(numeric[1]).padStart(2,'0')}`;
    const named = value.match(/\b(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(20\d{2})\b/);
    if (!named) return '';
    const months = {jan:1,january:1,januari:1,feb:2,february:2,februari:2,mar:3,march:3,mac:3,apr:4,april:4,may:5,mei:5,jun:6,june:6,jun:6,jul:7,july:7,julai:7,aug:8,august:8,ogos:8,sep:9,sept:9,september:9,oct:10,okt:10,october:10,oktober:10,nov:11,november:11,dec:12,dis:12,december:12,disember:12};
    const monthName = named[2].toLocaleLowerCase();
    const month = months[monthName] || months[monthName.slice(0,3)];
    return month ? `${named[3]}-${String(month).padStart(2,'0')}-${String(named[1]).padStart(2,'0')}` : '';
  };
  const markDatedRecordRows = () => {
    if (!document.body) return;
    const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const marked = new Set();
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest('#ains-glass-toggle,#ains-glass-menu,#ains-date-filter,#ains-translation-progress,.panel-head,.card-header')) continue;
      if (!parseAinsDate(node.nodeValue || '')) continue;
      let row = parent, candidate = null;
      while (row && row !== document.body) {
        const text = row.innerText || row.textContent || '';
        const dates = text.match(/\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[/. -]\d{1,2}[/. -]20\d{2}|\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+20\d{2})\b/g) || [];
        if (dates.length > 1) break;
        if (dates.length === 1 && text.trim().length > 30) candidate = row;
        row = row.parentElement;
      }
      if (candidate && !candidate.closest('#ains-date-filter,.panel-head,.card-header')) marked.add(candidate);
    }
    marked.forEach(el => {
      el.classList.add('ains-record-row');
      el.querySelectorAll('*').forEach(child => {
        const statusText = (child.textContent || '').trim().replace(/\s+/g,' ');
        if (/^(menunggu pengesahan|awaiting approval|等待审核)$/i.test(statusText)) child.classList.add('ains-status-pill');
      });
    });
  };
  const activityHeading = text => /aktiviti terkini|recent activity|最新活动/i.test(text);
  const installActivityDateFilter = () => {
    const headings = [...document.querySelectorAll('.panel-head h1,.panel-head h2,.panel-head h3,.card-header h1,.card-header h2,.card-header h3')];
    const heading = headings.find(el => activityHeading(el.textContent || ''));
    if (!heading) return;
    const panel = heading.closest('.panel,.card,section');
    if (!panel || panel.querySelector('#ains-date-filter')) return;
    const header = heading.closest('.panel-head,.card-header') || heading.parentElement;
    const bar = document.createElement('div');
    bar.id = 'ains-date-filter';
    bar.innerHTML = '<label for="ains-date-choice"></label><input id="ains-date-choice" type="date"><button type="button" id="ains-date-clear"></button><output id="ains-date-count" aria-live="polite"></output>';
    const dateInput = bar.querySelector('#ains-date-choice');
    const clear = bar.querySelector('#ains-date-clear');
    const output = bar.querySelector('#ains-date-count');
    const locale = () => ({
      ms:{label:'Pilih tarikh',clear:'Semua tarikh',count:n=>`${n} rekod dipaparkan`},
      en:{label:'Choose date',clear:'All dates',count:n=>`${n} records shown`},
      zh:{label:'选择日期',clear:'所有日期',count:n=>`显示 ${n} 条记录`}
    })[language] || {label:'Pilih tarikh',clear:'Semua tarikh',count:n=>`${n} rekod dipaparkan`};
    const rows = () => {
      const found = new Map();
      const walker = document.createTreeWalker(panel, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.parentElement.closest('#ains-date-filter,.panel-head,.card-header')) continue;
        const date = parseAinsDate(node.nodeValue || '');
        if (!date) continue;
        let row = node.parentElement;
        let last = null;
        while (row && row !== panel) {
          const text = row.innerText || row.textContent || '';
          const dates = text.match(/\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[/. -]\d{1,2}[/. -]20\d{2}|\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+20\d{2})\b/g) || [];
          if (dates.length > 1) break;
          if (dates.length === 1 && text.trim().length > 35) last = row;
          row = row.parentElement;
        }
        if (last && !last.closest('.panel-head,.card-header,#ains-date-filter')) found.set(last,date);
      }
      return [...found.entries()];
    };
    const refresh = () => {
      const wordsNow = locale();
      bar.querySelector('label').textContent = wordsNow.label;
      clear.textContent = wordsNow.clear;
      const selected = dateInput.value;
      const entries = rows();
      let visible = 0;
      for (const [el,date] of entries) {
        const show = !selected || date === selected;
        el.hidden = !show;
        el.classList.toggle('ains-date-hidden',!show);
        if (show) visible++;
      }
      output.textContent = wordsNow.count(visible);
    };
    updateActivityDateUI = refresh;
    dateInput.addEventListener('change',refresh);
    clear.addEventListener('click',() => { dateInput.value=''; refresh(); });
    if (header) header.after(bar); else panel.prepend(bar);
    refresh();
    let refreshTimer = 0;
    const observer = new MutationObserver(records => {
      if (records.some(record => !bar.contains(record.target) && [...record.addedNodes].some(node => !(node.nodeType === Node.ELEMENT_NODE && node.closest && node.closest('#ains-date-filter'))))) {
        clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh,80);
      }
    });
    observer.observe(panel,{subtree:true,childList:true,characterData:true});
  };
  const installRecordListDateFilter = () => {
    if (!document.body || document.getElementById('ains-record-date-filter')) return;
    const search = [...document.querySelectorAll('input[type="search"],input[placeholder]')].find(el => /search|cari|tajuk|title/i.test(el.placeholder || ''));
    const listRoute = /student-record-list|reading-record|senarai-rekod/i.test(location.pathname);
    const listHeading = /reading records|senarai rekod bacaan/i.test(document.body.innerText || '');
    if (!listRoute && !(search && listHeading)) return;
    const bar = document.createElement('div');
    bar.id = 'ains-record-date-filter';
    bar.innerHTML = '<label for="ains-record-date-choice"></label><input id="ains-record-date-choice" type="date"><button type="button" id="ains-record-date-clear"></button><output id="ains-record-date-count" aria-live="polite"></output>';
    const dateInput = bar.querySelector('#ains-record-date-choice');
    const clear = bar.querySelector('#ains-record-date-clear');
    const output = bar.querySelector('#ains-record-date-count');
    const labels = () => ({
      ms:{label:'Pilih tarikh',clear:'Semua tarikh',count:(n,selected)=>selected?`${n} rekod pada tarikh ini`:`${n} rekod dipaparkan`},
      en:{label:'Choose date',clear:'Clear date',count:(n,selected)=>selected?`${n} records on this date`:`${n} records shown`},
      zh:{label:'选择日期',clear:'清除日期',count:(n,selected)=>selected?`这一天有 ${n} 条记录`:`显示 ${n} 条记录`}
    })[language] || {label:'Pilih tarikh',clear:'Semua tarikh',count:n=>`${n} rekod dipaparkan`};
    const refresh = () => {
      markDatedRecordRows();
      const selected = dateInput.value;
      const entries = [...document.querySelectorAll('.ains-record-row')].filter(el => !el.closest('#ains-record-date-filter,#ains-date-filter'));
      let visible = 0;
      for (const el of entries) {
        const match = (el.innerText || el.textContent || '').match(/\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[/. -]\d{1,2}[/. -]20\d{2}|\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+20\d{2})\b/);
        const recordDate = match ? parseAinsDate(match[0]) : '';
        const show = !selected || selected === recordDate;
        el.hidden = !show;
        el.classList.toggle('ains-date-hidden',!show);
        if (show) visible++;
      }
      const word = labels();
      bar.querySelector('label').textContent = word.label;
      clear.textContent = word.clear;
      output.textContent = word.count(visible,Boolean(selected));
    };
    updateRecordListDateUI = refresh;
    dateInput.addEventListener('change',refresh);
    clear.addEventListener('click',() => { dateInput.value=''; refresh(); });
    const firstRecord = document.querySelector('.ains-record-row');
    const anchor = search ? (search.closest('.row') || search.closest('form') || search.parentElement?.parentElement) : null;
    if (anchor?.parentElement) anchor.after(bar);
    else if (firstRecord?.parentElement) firstRecord.before(bar);
    else document.body.prepend(bar);
    refresh();
    let timer = 0;
    const observer = new MutationObserver(records => {
      if (records.some(record => !bar.contains(record.target))) { clearTimeout(timer); timer=setTimeout(refresh,100); }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  };

  let theme = 'system', language = 'ms';
  try { theme = localStorage.getItem(THEME_KEY) || 'system'; language = localStorage.getItem(LANG_KEY) || 'ms'; } catch (_) {}
  root.lang = language === 'zh' ? 'zh-CN' : language === 'en' ? 'en' : 'ms';
  applyTheme(theme);

  const addControl = () => {
    if (!document.body || document.getElementById('ains-glass-toggle')) return;
    const toggle = document.createElement('button');
    toggle.id = 'ains-glass-toggle'; toggle.type = 'button'; toggle.setAttribute('aria-haspopup','true'); toggle.setAttribute('aria-expanded','false');
    const menu = document.createElement('div'); menu.id = 'ains-glass-menu'; menu.hidden = true;
    menu.innerHTML = '<header class="ag-panel-head"><span class="ag-brand-mark">A</span><span class="ag-brand-copy"><b>AINS Studio</b><small data-i18n="tagline">Your page, your way</small></span><span class="ag-version">v4.29.0</span></header><section class="ag-panel-section"><div class="ag-section-title" data-i18n="appearance">Appearance</div><div class="ag-theme-options"><button type="button" data-theme="system">◐ <span>System</span></button><button type="button" data-theme="light">☀ <span>Light</span></button><button type="button" data-theme="dark">☾ <span>Dark</span></button></div></section><section class="ag-panel-section ag-language-section"><label class="ag-language-label" for="ains-language"><span data-i18n="language">Language</span><small data-i18n="languageHint">Translate supported AINS labels</small></label><select id="ains-language" aria-label="Language"><option value="ms">Bahasa Melayu</option><option value="en">English</option><option value="zh">中文</option></select></section><div class="ag-panel-divider"></div><div class="ag-section-title ag-tools-title" data-i18n="quickActions">Quick actions</div><a class="ag-shortcut ag-dashboard" href="/web/dashboard"><span>▦</span><span><b data-i18n="dashboard">Dashboard</b><small data-i18n="dashboardHint">See your reading activity</small></span><i>↗</i></a><a class="ag-shortcut ag-overview" href="/web/dashboard?ains-studio=1"><span>◷</span><span><b data-i18n="overview">Reading overview</b><small data-i18n="overviewHint">Your year, today, and import status</small></span><i>↗</i></a><a class="ag-shortcut ag-extensions" href="/web/dashboard?ains-studio=extensions"><span>⌘</span><span><b data-i18n="extensions">Extensions</b><small data-i18n="extensionsHint">AINS Studio status and modules</small></span><i>↗</i></a><a class="ag-shortcut ag-new-record" href="/web/new-record-book"><span>＋</span><span><b data-i18n="addRecord">Add a reading record</b><small data-i18n="addRecordHint">Open the new record form</small></span><i>↗</i></a><div class="ag-feature-note"><span>✧</span><div><b data-i18n="studioTools">Studio tools</b><small data-i18n="studioToolsHint">Date totals · Excel import · copy and paste</small></div></div>';
    const langSelect = menu.querySelector('#ains-language'); langSelect.value = language;
    const updateControlText = () => {
      const labels = {ms:'Penampilan',en:'Appearance',zh:'外观'};
      const text = {
        ms:{tagline:'Penampilan dan alat bacaan anda',appearance:'Penampilan',language:'Bahasa',languageHint:'Terjemah label AINS yang disokong',quickActions:'Tindakan pantas',dashboard:'Papan pemuka AINS',dashboardHint:'Lihat aktiviti bacaan anda',overview:'Ringkasan bacaan',overviewHint:'Tahun ini, hari ini dan status import',addRecord:'Tambah rekod bacaan',addRecordHint:'Buka borang rekod baharu',studioTools:'Alat Studio',studioToolsHint:'Kiraan tarikh · Import Excel · salin dan tampal',extensions:'Sambungan',extensionsHint:'Status dan modul AINS Studio',themes:['Sistem','Cerah','Gelap'],toggle:'Studio'},
        en:{tagline:'Your reading space, your way',appearance:'Appearance',language:'Language',languageHint:'Translate supported AINS labels',quickActions:'Quick actions',dashboard:'AINS dashboard',dashboardHint:'See your reading activity',overview:'Reading overview',overviewHint:'Year, today, and import status',addRecord:'Add a reading record',addRecordHint:'Open the new record form',studioTools:'Studio tools',studioToolsHint:'Date totals · Excel import · copy and paste',extensions:'Extensions',extensionsHint:'AINS Studio status and modules',themes:['System','Light','Dark'],toggle:'Studio'},
        zh:{tagline:'打造专属阅读空间',appearance:'外观',language:'语言',languageHint:'翻译支持的 AINS 界面文字',quickActions:'快捷操作',dashboard:'AINS 仪表板',dashboardHint:'查看阅读活动',overview:'阅读概览',overviewHint:'年度、今日和导入状态',addRecord:'添加阅读记录',addRecordHint:'打开新记录表单',studioTools:'Studio 工具',studioToolsHint:'日期统计 · Excel 导入 · 复制和粘贴',extensions:'扩展',extensionsHint:'AINS Studio 状态与模块',themes:['跟随系统','浅色','深色'],toggle:'Studio'}
      }[language];
      toggle.innerHTML = '<span class="ag-launch-label">AINS Studio</span><span class="ag-orb" aria-hidden="true"><span>✦</span></span><span class="ag-launch-chevron" aria-hidden="true">⌄</span>';
      menu.querySelectorAll('[data-i18n]').forEach(el => { const key=el.dataset.i18n;if(text[key])el.textContent=text[key]; });
      const langLabel = menu.querySelector('.ag-language-label [data-i18n="language"]'); if(langLabel)langLabel.textContent=text.language;
      menu.querySelectorAll('[data-theme]').forEach((el,i) => { el.querySelector('span').textContent=text.themes[i]; el.setAttribute('aria-checked',String(el.dataset.theme===theme)); });
      toggle.setAttribute('aria-label',text.toggle);menu.querySelector('#ains-language').setAttribute('aria-label',text.language);
    };
    const showUpdateToast = () => {
      const version = chrome.runtime.getManifest().version;
      const key = 'ains-studio-last-seen-version';
      chrome.storage.local.get(key, result => {
        if (chrome.runtime.lastError || result[key] === version) return;
        chrome.storage.local.set({[key]:version});
        const copy = {
          en:{title:`AINS Studio successfully updated to v${version}`,heading:'This update includes',detail:'A full settings center, feature controls, custom 404 page, and a “Don’t show again” option for AINS announcements.',close:'Dismiss'},
          ms:{title:`AINS Studio berjaya dikemas kini ke v${version}`,heading:'Kemas kini ini merangkumi',detail:'Pusat tetapan penuh, kawalan ciri, halaman 404 tersuai dan pilihan “Jangan tunjukkan lagi” untuk pengumuman AINS.',close:'Tutup'},
          zh:{title:`AINS Studio 已成功更新至 v${version}`,heading:'此更新包含',detail:'全新的设置中心、功能开关、自定义 404 页面，以及 AINS 公告的“不再显示”选项。',close:'关闭'}
        }[language] || {title:`AINS Studio successfully updated to v${version}`,heading:'This update includes',detail:'A full settings center, feature controls, custom 404 page, and a “Don’t show again” option for AINS announcements.',close:'Dismiss'};
        const toast=document.createElement('aside');toast.id='ains-update-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
        toast.innerHTML=`<span class="ains-update-mark" aria-hidden="true">A</span><div class="ains-update-copy"><b>${copy.title}</b><strong>${copy.heading}</strong><p>${copy.detail}</p></div><button type="button" aria-label="${copy.close}">×</button>`;
        const close=()=>{toast.classList.add('ains-update-leaving');setTimeout(()=>toast.remove(),220);};
        toast.querySelector('button').addEventListener('click',close);document.body.append(toast);setTimeout(close,10000);
      });
    };
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message?.type === 'ains-studio-get-settings') {
        sendResponse({theme,language}); return;
      }
      if (!message || message.type !== 'ains-studio-settings') return;
      if (['system','light','dark'].includes(message.theme)) {
        theme = message.theme; applyTheme(theme);
        try { localStorage.setItem(THEME_KEY,theme); } catch (_) {}
      }
      if (['ms','en','zh'].includes(message.language)) {
        language = message.language;
        root.lang = language === 'zh' ? 'zh-CN' : language === 'en' ? 'en' : 'ms';
        langSelect.value = language;
        try { localStorage.setItem(LANG_KEY,language); } catch (_) {}
        updateActivityDateUI(); updateRecordListDateUI(); translatePage(language);document.dispatchEvent(new CustomEvent('ains-studio-language-changed',{detail:{language}}));
      }
      updateControlText();
    });
    updateControlText(); applyTheme(theme);
    const positionKey='ains-studio-toggle-position-v1';let dragged=false,dragStart=null;
    const placeControl=(left,top,snap=false)=>{const rect=toggle.getBoundingClientRect(),w=rect.width||150,h=rect.height||42,maxX=Math.max(8,innerWidth-w-8),maxY=Math.max(8,innerHeight-h-8);left=Math.max(8,Math.min(maxX,left));top=Math.max(8,Math.min(maxY,top));if(snap)left=left+ w/2 < innerWidth/2 ? 8 : maxX;toggle.style.left=`${left}px`;toggle.style.top=`${top}px`;toggle.style.right='auto';toggle.style.bottom='auto';menu.dataset.side=left<innerWidth/2?'left':'right';menu.style.left=`${menu.dataset.side==='left'?left:Math.max(8,left+(w-menu.offsetWidth))}px`;menu.style.right='auto';menu.style.top=`${Math.max(8,Math.min(innerHeight-menu.offsetHeight-8,top+(top+menu.offsetHeight+8>innerHeight?-(menu.offsetHeight+8):h+8)))}px`;menu.style.bottom='auto';return {left,top};};
    try{const saved=JSON.parse(localStorage.getItem(positionKey)||'null');if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))requestAnimationFrame(()=>placeControl(saved.x*innerWidth,saved.y*innerHeight))}catch(_){}
    toggle.addEventListener('pointerdown',event=>{if(event.button!==0||!event.target.closest('.ag-orb'))return;dragStart={x:event.clientX,y:event.clientY,left:toggle.getBoundingClientRect().left,top:toggle.getBoundingClientRect().top,pointerId:event.pointerId};dragged=false;toggle.setPointerCapture?.(event.pointerId)});
    toggle.addEventListener('pointermove',event=>{if(!dragStart||dragStart.pointerId!==event.pointerId)return;const dx=event.clientX-dragStart.x,dy=event.clientY-dragStart.y;if(!dragged&&Math.hypot(dx,dy)<5)return;dragged=true;toggle.classList.add('is-dragging');placeControl(dragStart.left+dx,dragStart.top+dy)});
    const stopDrag=event=>{if(!dragStart)return;if(dragged){const p=placeControl(toggle.getBoundingClientRect().left,toggle.getBoundingClientRect().top,true);try{localStorage.setItem(positionKey,JSON.stringify({x:p.left/innerWidth,y:p.top/innerHeight}))}catch(_){}setTimeout(()=>{dragged=false},250)}dragStart=null;toggle.classList.remove('is-dragging')};
    toggle.addEventListener('pointerup',stopDrag);toggle.addEventListener('pointercancel',stopDrag);
    toggle.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopImmediatePropagation();return}menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)placeControl(toggle.getBoundingClientRect().left,toggle.getBoundingClientRect().top)});
    menu.addEventListener('click', event => {
      const item = event.target.closest('[data-theme]'); if (!item) return;
      theme = item.dataset.theme; applyTheme(theme); updateControlText();
      try { localStorage.setItem(THEME_KEY,theme); } catch (_) {}
    });
    langSelect.addEventListener('change', () => {
      language = langSelect.value; root.lang = language === 'zh' ? 'zh-CN' : language === 'en' ? 'en' : 'ms';
      try { localStorage.setItem(LANG_KEY,language); } catch (_) {}
      updateControlText(); updateActivityDateUI(); updateRecordListDateUI(); translatePage(language);document.dispatchEvent(new CustomEvent('ains-studio-language-changed',{detail:{language}}));
    });
    document.addEventListener('click', event => { if (!menu.contains(event.target) && !toggle.contains(event.target)) { menu.hidden = true; toggle.setAttribute('aria-expanded','false'); } });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { menu.hidden = true; toggle.setAttribute('aria-expanded','false'); toggle.focus(); } });
    // The full settings page replaces the old floating popout controls.
    toggle.remove();menu.remove();markLiquidSurfaces(document.body);markLiquidButtons(document.body);
    showUpdateToast();
    installActivityDateFilter();
    markDatedRecordRows();
    installRecordListDateFilter();
    translatePage(language);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') translateNode(record.target,language);
        for (const added of record.addedNodes || []) {
          if(added.nodeType===Node.ELEMENT_NODE){markLiquidSurfaces(added);markLiquidButtons(added)}
          if (added.nodeType === Node.TEXT_NODE) translateNode(added,language);
          else if (added.nodeType === Node.ELEMENT_NODE && !added.matches('#ains-glass-toggle,#ains-glass-menu,#ains-translation-progress') && (language !== 'ms' || added.matches('#ains-studio-page') || added.closest('#ains-studio-page'))) translateTree(added,language,activeTranslation,false);
        }
        if (record.addedNodes && record.addedNodes.length) setTimeout(installActivityDateFilter,0);
        if (record.addedNodes && record.addedNodes.length) setTimeout(markDatedRecordRows,0);
        if (record.addedNodes && record.addedNodes.length) setTimeout(installRecordListDateFilter,0);
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',addControl,{once:true}); else addControl();
})();
})();
