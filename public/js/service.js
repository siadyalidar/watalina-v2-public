// ══ SERVICE DATA ════════════════════════════════════════
// localStorage cache kaldırıldı — veri doğrudan API'den gelir
function getSvcData(){ return { customers: [], records: [] }; }
function saveSvcData(d){ /* no-op: veri backend'de saklanır */ }
// Full refresh from API → re-renders
var _svcCache = { customers: [], records: [] };
function refreshSvcData(callback) {
  Api.getSvcData()
    .then(d => {
      _svcCache = d;
      if (callback) callback(d);
    })
    .catch(err => {
      console.warn('refreshSvcData error:', err);
      if (callback) callback(_svcCache);
    });
}
function daysUntil(ds){if(!ds)return null;return Math.ceil((new Date(ds)-new Date())/86400000);}
function urgencyOf(ds){var d=daysUntil(ds);if(d===null)return'ok';if(d<=0||d<=14)return'urgent';if(d<=30)return'soon';return'ok';}
function urgencyLabel(ds){
  var d=daysUntil(ds);
  if(d===null)return'-';
  if(d<0)return Math.abs(d)+' gun gecti';
  if(d===0)return'Bugun!';
  if(d===1)return'Yarin';
  return d+' gun kaldi';
}
function typeLabel(t){return{maintenance:'Periyodik Bakım',filter:'Filtre Değişimi',install:'Kurulum / Montaj','sok-tak':'Sök-Tak',repair:'Arıza / Tamir',visit:'Kontrol Ziyareti',musluk:'Musluk Değişimi'}[t]||t;}
// Periyodik bakım ve sök-tak islemleri de genelde filtre yenilemeyi kapsar,
// bu yuzden "filtre degisimi ne zaman yapildi" hesabinda bunlar da sayilir.
function isFilterRelatedType(t){return t==='filter'||t==='maintenance'||t==='sok-tak';}
function typeBadgeClass(t){return{maintenance:'badge-maintenance',filter:'badge-filter',install:'badge-install',repair:'badge-repair',visit:'badge-maintenance'}[t]||'badge-maintenance';}

// ══ CUSTOMER LIST ═══════════════════════════════════════
function renderSvcCustomerList(filter, data){
  if(!data) data=_svcCache;
  var custs=data.customers||[];
  if(filter)custs=custs.filter(function(c){return(c.name+' '+(c.city||'')).toLowerCase().includes(filter);});
  var list=document.getElementById('svcCustomerList');
  if(!list)return;
  if(!custs.length){list.innerHTML='<div style="padding:16px;font-size:.74rem;color:var(--c-ink3);text-align:center">Musteri yok.<br>Eklemek icin + butonunu kullanin.</div>';return;}
  list.innerHTML=custs.map(function(cust){
    var recs=(data.records||[]).filter(function(r){return r.custId===cust.id;}).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    var last=recs[0];
    var nextDate=last?last.nextDate:null;
    var urg=urgencyOf(nextDate);
    var isActive=activeSvcCustomer===cust.id;
    return'<div class="svc-cust-item '+(isActive?'active':'')+'" data-action="openSvcCustomer" data-custid="'+cust.id+'">'
      +'<div class="sci-name">'+cust.name+'</div>'
      +'<div class="sci-device">'+(cust.device||'Cihaz belirtilmemis')+' - '+(cust.city||'')+'</div>'
      +(nextDate?'<span class="sci-next '+urg+'">'+urgencyLabel(nextDate)+'</span>':'<span class="sci-next ok">Guncel</span>')
      +'</div>';
  }).join('');
}
function filterSvcCustomers(v){renderSvcCustomerList(v.toLowerCase(), _svcCache);}

// ══ DASHBOARD ═══════════════════════════════════════════
function renderSvcDashboard(data){
  if(!data) data=_svcCache;
  var custs=data.customers||[];
  var recs=data.records||[];
  var now=new Date();
  var urgentCount=0,soonCount=0,thisMonth=0;
  custs.forEach(function(c){
    var cr=recs.filter(function(r){return r.custId===c.id;}).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    var last=cr[0];if(!last)return;
    var urg=urgencyOf(last.nextDate);
    if(urg==='urgent')urgentCount++;else if(urg==='soon')soonCount++;
  });
  recs.forEach(function(r){
    var d=new Date(r.date);
    if(d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear())thisMonth++;
  });
  var kpi=document.getElementById('svcKpiRow');
  if(kpi)kpi.innerHTML=
    '<div class="kpi-card urgent"><div class="kpi-label">Acil / Geciken</div><div class="kpi-val">'+urgentCount+'</div><div class="kpi-sub">bakim gerekiyor</div></div>'+
    '<div class="kpi-card warn"><div class="kpi-label">Yaklasan (30 gun)</div><div class="kpi-val">'+soonCount+'</div><div class="kpi-sub">bu ay planla</div></div>'+
    '<div class="kpi-card ok"><div class="kpi-label">Toplam Musteri</div><div class="kpi-val">'+custs.length+'</div><div class="kpi-sub">kayitli cihaz</div></div>'+
    '<div class="kpi-card info"><div class="kpi-label">Bu Ay Is</div><div class="kpi-val">'+thisMonth+'</div><div class="kpi-sub">tamamlanan</div></div>';
  var badge=document.getElementById('svcUrgentCount');
  if(badge) badge.textContent = urgentCount + soonCount;
  // Mirror into AppState for other parts of the UI
  AppState._urgentCount = urgentCount + soonCount;
  renderAiSuggestions(data);
  renderDailyRoute(data);
  renderUpcoming(data);
}

function renderAiSuggestions(data){
  var custs=data.customers||[];
  var recs=data.records||[];
  var now=new Date();
  var suggestions=[];
  custs.forEach(function(c){
    var cr=recs.filter(function(r){return r.custId===c.id;}).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    var last=cr[0];
    if(!last){
      if(c.installDate){var months=(now-new Date(c.installDate))/(1000*60*60*24*30);if(months>=6)suggestions.push({dot:'red',text:'<strong>'+c.name+'</strong> - Kurulumdan bu yana '+Math.floor(months)+' ay gecti, ilk bakim yapilmadi.'});}
      return;
    }
    var d=daysUntil(last.nextDate);
    if(d!==null&&d<0)suggestions.push({dot:'red',text:'<strong>'+c.name+'</strong> - Bakim <strong>'+Math.abs(d)+' gun geride</strong>. Acil randevu planlanmali.'});
    else if(d!==null&&d<=7)suggestions.push({dot:'yellow',text:'<strong>'+c.name+'</strong> - Bakim <strong>'+(d===0?'bugun':d+' gun icinde')+'</strong>. Rotaya ekleyin.'});
    var fr=cr.filter(function(r){return isFilterRelatedType(r.type);});
    if(fr.length>0){var months2=(now-new Date(fr[0].date))/(1000*60*60*24*30);if(months2>=5.5)suggestions.push({dot:'yellow',text:'<strong>'+c.name+'</strong> - Son filtre degisiminin uzerinden '+Math.floor(months2)+' ay gecti.'});}
    else if(c.installDate){var months2b=(now-new Date(c.installDate))/(1000*60*60*24*30);if(months2b>=6)suggestions.push({dot:'yellow',text:'<strong>'+c.name+'</strong> - Kurulumdan bu yana filtre degisimi yapilmamis. '+Math.floor(months2b)+' ay gecti.'});}
  });
  if(!suggestions.length)suggestions.push({dot:'green',text:'Tum musteriler guncel. Yakin kritik bakim bulunmuyor.'});
  var el=document.getElementById('aiSuggestions');
  if(el)el.innerHTML='<div class="ai-title">Sistem Onerileri</div>'+suggestions.slice(0,5).map(function(s){return'<div class="ai-item"><div class="ai-dot '+s.dot+'"></div><div class="ai-text">'+s.text+'</div></div>';}).join('');
}

function renderDailyRoute(data){
  var custs=data.customers||[];
  var recs=data.records||[];
  var now=new Date();
  var rd=document.getElementById('routeDate');
  if(rd)rd.textContent=now.toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'});
  var routeItems=[];
  custs.forEach(function(c){
    var cr=recs.filter(function(r){return r.custId===c.id;}).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    var last=cr[0];if(!last)return;
    var d=daysUntil(last.nextDate);
    if(d!==null&&d<=3)routeItems.push({cust:c,type:last.type,urg:d<0?'urgent':'normal',note:urgencyLabel(last.nextDate)});
  });
  var el=document.getElementById('dailyRoute');if(!el)return;
  if(!routeItems.length){el.innerHTML='<div style="padding:18px;text-align:center;color:var(--c-ink3);font-size:.78rem">Bugun icin planlanmis acil is bulunmuyor.</div>';return;}
  el.innerHTML='<div class="route-hdr"><span class="route-hdr-title">Bugun '+routeItems.length+' Durak</span><span style="color:rgba(255,255,255,.5);font-size:.63rem">'+now.toLocaleDateString('tr-TR')+'</span></div>'
    +routeItems.slice(0,8).map(function(item,i){
      return'<div class="route-item"><div class="route-num">'+(i+1)+'</div><div class="route-info"><div class="route-name">'+item.cust.name+'</div><div class="route-addr">'+(item.cust.address||item.cust.city||'Adres girilmemis')+' - '+typeLabel(item.type)+'</div></div><span class="route-badge '+(item.urg==='urgent'?'rb-urgent':'rb-normal')+'">'+item.note+'</span></div>';
    }).join('');
}

function renderUpcoming(data){
  var custs=data.customers||[];
  var recs=data.records||[];
  var items=custs.map(function(c){
    var cr=recs.filter(function(r){return r.custId===c.id;}).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    var last=cr[0];
    return{cust:c,nextDate:last?last.nextDate:null,urg:urgencyOf(last?last.nextDate:null),type:last?last.type:'maintenance'};
  });
  items.sort(function(a,b){var o={urgent:0,soon:1,ok:2};if(o[a.urg]!==o[b.urg])return o[a.urg]-o[b.urg];if(!a.nextDate)return 1;if(!b.nextDate)return -1;return new Date(a.nextDate)-new Date(b.nextDate);});
  var el=document.getElementById('upcomingList');if(!el)return;
  if(!items.length){el.innerHTML='<div style="padding:18px;text-align:center;color:var(--c-ink3);font-size:.78rem">Musteri kaydi bulunmuyor.</div>';return;}
  var icons={maintenance:'[B]',filter:'[F]',install:'[K]',repair:'[A]',visit:'[Z]'};
  el.innerHTML=items.slice(0,10).map(function(item){
    return'<div class="upcoming-card '+item.urg+'" data-action="openSvcCustomer" data-custid="'+item.cust.id+'">'
      +'<div class="uc-icon '+item.urg+'">'+(icons[item.type]||'?')+'</div>'
      +'<div class="uc-info"><div class="uc-name">'+item.cust.name+'</div><div class="uc-detail">'+(item.cust.device||'Cihaz')+' - '+(item.cust.city||'')+'</div>'
      +'<span class="uc-type-badge '+typeBadgeClass(item.type)+'">'+typeLabel(item.type)+'</span></div>'
      +'<div class="uc-date '+item.urg+'"><div>'+(item.nextDate?new Date(item.nextDate).toLocaleDateString('tr-TR',{day:'numeric',month:'short'}):'-')+'</div>'
      +'<div style="font-size:.6rem;font-weight:500;margin-top:2px">'+urgencyLabel(item.nextDate)+'</div></div>'
      +'</div>';
  }).join('');
}

// ══ CUSTOMER DETAIL ═════════════════════════════════════
function showCustomerDetail(custId){
  activeSvcCustomer=custId;
  var data=_svcCache;
  var cust=data.customers.find(function(c){return c.id===custId;});
  if(!cust)return;
  document.querySelectorAll('.svc-cust-item').forEach(function(el){el.classList.remove('active');});
  var db=document.getElementById('svcDashboardBtn');if(db)db.classList.remove('active');
  var dv=document.getElementById('svcDashView');if(dv)dv.style.display='none';
  var cv=document.getElementById('svcCustView');if(cv)cv.style.display='block';
  var initials=cust.name.split(' ').map(function(w){return w[0];}).join('').toUpperCase().slice(0,2);
  var recs=(data.records||[]).filter(function(r){return r.custId===custId;}).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  var last=recs[0];
  var nextDate=last?last.nextDate:null;
  var urg=urgencyOf(nextDate);
  var hdr=document.getElementById('custDetailHeader');
  if(hdr)hdr.innerHTML=
    '<div class="cdh-avatar">'+initials+'</div>'
    +'<div style="flex:1"><div class="cdh-name">'+cust.name+'</div>'
    +'<div class="cdh-meta">'+(cust.device?cust.device+' - ':'')+(cust.phone||'')+(cust.city?' - '+cust.city:'')+(cust.address?'<br>'+cust.address:'')+'</div>'
    +(nextDate?'<div style="margin-top:6px"><span class="sci-next '+urg+'">Sonraki: '+new Date(nextDate).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})+' - '+urgencyLabel(nextDate)+'</span></div>':'')
    +'</div>'
    +'<div class="cdh-actions">'
    +'<button class="cdh-btn primary" data-action="openAddServiceModalActive">+ Servis Ekle</button>'
    +'<button class="cdh-btn" onclick="openEditCustomerModal(\''+custId+'\')" style="color:var(--c-accent)">Düzenle</button>'
    +'<button class="cdh-btn" data-action="deleteActiveSvcCustomer" style="color:var(--c-red)">Sil</button>'
    +'</div>';
  var tl=document.getElementById('svcTimeline');
  if(!tl)return;
  if(!recs.length){tl.innerHTML='<div style="color:var(--c-ink3);font-size:.76rem;padding:12px 0">Henuz servis kaydi yok.</div>';}
  else{
    tl.innerHTML=recs.map(function(r){
      return'<div class="svc-tl-item '+r.type+'">'
        +'<div class="stl-date">'+new Date(r.date).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})+'</div>'
        +'<div class="stl-title">'+typeLabel(r.type)+'</div>'
        +(r.note?'<div class="stl-note">'+r.note+'</div>':'')
        +'<div class="stl-tech">'+(r.tech?r.tech+' ':'')+''+(r.fee?'- '+fmtUSD(r.fee)+' ':'')+''+(r.nextDate?'- Sonraki: '+new Date(r.nextDate).toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'}):'')+'</div>'
        +'</div>';
    }).join('');
  }
  var suggestions=[];
  if(!recs.length){suggestions.push({dot:'yellow',text:'Henuz servis kaydi yok. Ilk bakimi ekleyin.'});}
  else{
    var d2=daysUntil(recs[0].nextDate);
    if(d2!==null&&d2<0)suggestions.push({dot:'red',text:'Sonraki bakim <strong>'+Math.abs(d2)+' gun geride</strong>. Acil randevu.'});
    var fr2=recs.filter(function(r){return isFilterRelatedType(r.type);}).sort(function(a,b){return new Date(b.date)-new Date(a.date);});
    if(fr2.length){
      var months3=(new Date()-new Date(fr2[0].date))/(1000*60*60*24*30);
      if(months3>=6)suggestions.push({dot:'yellow',text:'Son <strong>filtre degisiminin</strong> uzerinden '+Math.floor(months3)+' ay gecti.'});
    }else if(cust.installDate){
      var months3b=(new Date()-new Date(cust.installDate))/(1000*60*60*24*30);
      if(months3b>=6)suggestions.push({dot:'yellow',text:'Kurulumdan bu yana <strong>filtre degisimi yapilmamis</strong>. '+Math.floor(months3b)+' ay gecti.'});
    }
    var total=recs.reduce(function(s,r){return s+(r.fee||0);},0);
    if(total>0)suggestions.push({dot:'green',text:'Toplam servis geliri: <strong>'+fmtUSD(total)+'</strong> ('+recs.length+' kayit).'});
  }
  if(!suggestions.length)suggestions.push({dot:'green',text:'Musteri guncel durumda.'});
  var cas=document.getElementById('custAiSuggestions');
  if(cas)cas.innerHTML='<div class="ai-title">Musteri Onerileri</div>'+suggestions.map(function(s){return'<div class="ai-item"><div class="ai-dot '+s.dot+'"></div><div class="ai-text">'+s.text+'</div></div>';}).join('');
  renderSvcCustomerList(null, _svcCache);
}

function showSvcDashboard(){
  activeSvcCustomer=null;
  document.querySelectorAll('.svc-cust-item').forEach(function(el){el.classList.remove('active');});
  var db=document.getElementById('svcDashboardBtn');if(db)db.classList.add('active');
  var dv=document.getElementById('svcDashView');if(dv)dv.style.display='block';
  var cv=document.getElementById('svcCustView');if(cv)cv.style.display='none';
  renderSvcDashboard(_svcCache);
}

// ══ MODALS ══════════════════════════════════════════════
var _editingCustId=null;
function openAddCustomerModal(){
  _editingCustId=null;
  document.getElementById('newCustInstall').value=new Date().toISOString().split('T')[0];
  ['newCustName','newCustPhone','newCustCity','newCustAddr','newCustDevice','newCustNote'].forEach(function(id){document.getElementById(id).value='';});
  var btn=document.querySelector('#addCustomerModal .svc-submit-btn');if(btn)btn.textContent='Kaydet';
  document.querySelector('#addCustomerModal .svc-modal-hdr span').textContent='Yeni Müşteri';
  document.getElementById('addCustomerModal').classList.add('open');
  setTimeout(function(){document.getElementById('newCustName').focus();},100);
}
function openEditCustomerModal(custId){
  var data=_svcCache;
  var c=data.customers.find(function(x){return x.id===custId;});
  if(!c)return;
  _editingCustId=custId;
  document.getElementById('newCustName').value=c.name||'';
  document.getElementById('newCustPhone').value=c.phone||'';
  document.getElementById('newCustCity').value=c.city||'';
  document.getElementById('newCustAddr').value=c.address||'';
  document.getElementById('newCustDevice').value=c.device||'';
  document.getElementById('newCustInstall').value=c.installDate||'';
  document.getElementById('newCustNote').value=c.note||'';
  var btn=document.querySelector('#addCustomerModal .svc-submit-btn');if(btn)btn.textContent='Güncelle';
  document.querySelector('#addCustomerModal .svc-modal-hdr span').textContent='Müşteriyi Düzenle';
  document.getElementById('addCustomerModal').classList.add('open');
  setTimeout(function(){document.getElementById('newCustName').focus();},100);
}
function closeAddCustomerModal(){document.getElementById('addCustomerModal').classList.remove('open');_editingCustId=null;}
function saveNewCustomer(){
  var name=document.getElementById('newCustName').value.trim();
  if(!name){showToast('Musteri adi zorunlu!');return;}
  var payload={
    name:name,
    phone:document.getElementById('newCustPhone').value.trim(),
    city:document.getElementById('newCustCity').value.trim(),
    address:document.getElementById('newCustAddr').value.trim(),
    device:document.getElementById('newCustDevice').value.trim(),
    installDate:document.getElementById('newCustInstall').value,
    note:document.getElementById('newCustNote').value.trim()
  };
  var btn=document.querySelector('#addCustomerModal .svc-submit-btn');
  if(btn){btn.disabled=true;btn.textContent='Kaydediliyor...';}
  var req=_editingCustId
    ?Api.put('/api/service/customers/'+_editingCustId,payload)
    :Api.addCustomer(payload);
  req.then(function(){
    return Api.getSvcData();
  }).then(function(d){
    _svcCache = d;
    closeAddCustomerModal();
    renderSvcCustomerList(null, d);renderSvcDashboard(d);
    if(_editingCustId){showToast('Güncellendi: '+name);if(activeSvcCustomer)showCustomerDetail(activeSvcCustomer);}
    else{showToast('Eklendi: '+name);}
    _editingCustId=null;
    ['newCustName','newCustPhone','newCustCity','newCustAddr','newCustDevice','newCustNote'].forEach(function(id){document.getElementById(id).value='';});
  }).catch(function(e){
    showToast('Hata: '+(e.message||'Kaydedilemedi'));
  }).finally(function(){
    if(btn){btn.disabled=false;btn.textContent='Kaydet';}
  });
}
function openAddServiceModal(custId){
  var data=_svcCache;
  var sel=document.getElementById('svcCustSelect');
  sel.innerHTML=data.customers.map(function(c){return'<option value="'+c.id+'"'+(c.id===custId?' selected':'')+'>'+c.name+'</option>';}).join('');
  document.getElementById('svcDate').value=new Date().toISOString().split('T')[0];
  var next=new Date();next.setMonth(next.getMonth()+6);
  document.getElementById('svcNextDate').value=next.toISOString().split('T')[0];
  document.getElementById('svcFee').value='';
  document.getElementById('svcNote').value='';
  document.getElementById('svcTech').value='';
  document.getElementById('addServiceModal').classList.add('open');
}
function closeAddServiceModal(){document.getElementById('addServiceModal').classList.remove('open');}
function saveServiceRecord(){
  var custId=document.getElementById('svcCustSelect').value;
  if(!custId){showToast('Musteri secin!');return;}
  var payload={
    custId:custId,
    type:document.getElementById('svcType').value,
    date:document.getElementById('svcDate').value,
    nextDate:document.getElementById('svcNextDate').value||null,
    tech:document.getElementById('svcTech').value.trim(),
    fee:parseFloat(document.getElementById('svcFee').value)||0,
    note:document.getElementById('svcNote').value.trim()
  };
  var btn=document.querySelector('#addServiceModal .svc-submit-btn');
  if(btn){btn.disabled=true;btn.textContent='Kaydediliyor...';}
  Api.addRecord(payload).then(function(){
    return Api.getSvcData();
  }).then(function(d){
    _svcCache = d;
    closeAddServiceModal();
    renderSvcDashboard(_svcCache);renderSvcCustomerList(null, _svcCache);
    if(activeSvcCustomer)showCustomerDetail(activeSvcCustomer);
    showToast('Servis kaydi eklendi');
  }).catch(function(e){
    showToast('Hata: '+(e.message||'Kaydedilemedi'));
  }).finally(function(){
    if(btn){btn.disabled=false;btn.textContent='Kaydet';}
  });
}
function deleteSvcCustomer(custId){
  if(!confirm('Bu musteri ve tum servis kayitlari silinecek?'))return;
  Api.deleteCustomer(custId).then(function(){
    return Api.getSvcData();
  }).then(function(d){
    _svcCache = d;
    activeSvcCustomer=null;
    renderSvcCustomerList(null, _svcCache);showSvcDashboard();
    showToast('Musteri silindi');
  }).catch(function(e){
    showToast('Hata: '+(e.message||'Silinemedi'));
  });
}

// ══ DEMO SEED ═══════════════════════════════════════════
function seedDemoData(){
  // Production: only run for non-authenticated or admin sessions (dev/demo only)
  if(Auth.isLoggedIn && Auth.role !== 'admin')return;
  var data=_svcCache;
  if(data.customers.length>0)return;
  var now=new Date();
  function ago(d){var dt=new Date(now);dt.setDate(dt.getDate()-d);return dt.toISOString().split('T')[0];}
  function from(d){var dt=new Date(now);dt.setDate(dt.getDate()+d);return dt.toISOString().split('T')[0];}
  saveSvcData({
    customers:[
      {id:'c1',name:'Ahmet Yilmaz',phone:'0532 111 22 33',city:'Izmir - Bornova',address:'Cumhuriyet Mah. Ataturk Cad. No:12',device:'Aliwa Pompali',installDate:ago(400)},
      {id:'c2',name:'Fatma Demir',phone:'0541 333 44 55',city:'Izmir - Konak',address:'Fevzipasa Blv. No:45',device:'Flora Pompasiz',installDate:ago(280)},
      {id:'c3',name:'Ozdemir Ltd.',phone:'0212 555 66 77',city:'Izmir - Karsiyaka',address:'Sehit Mustafa Cad. No:8',device:'10in Acik Kasa',installDate:ago(180)},
      {id:'c4',name:'Mert Kaya',phone:'0555 777 88 99',city:'Izmir - Cigli',address:'Barbaros Mah. No:34',device:'Lina Pompali',installDate:ago(90)},
    ],
    records:[
      {id:'r1',custId:'c1',type:'maintenance',date:ago(185),nextDate:ago(5),tech:'Emre Celik',fee:150,note:'Filtreler degistirildi, membran temizlendi. TDS: 12 ppm.'},
      {id:'r2',custId:'c1',type:'filter',date:ago(365),nextDate:ago(185),tech:'Emre Celik',fee:80,note:'3 filtre seti degistirildi.'},
      {id:'r3',custId:'c2',type:'install',date:ago(280),nextDate:from(10),tech:'Kemal Arslan',fee:0,note:'Kurulum tamamlandi.'},
      {id:'r4',custId:'c2',type:'maintenance',date:ago(100),nextDate:from(10),tech:'Emre Celik',fee:120,note:'Standart bakim, filtreler yenilendi.'},
      {id:'r5',custId:'c3',type:'install',date:ago(180),nextDate:from(25),tech:'Kemal Arslan',fee:0,note:'Montaj yapildi.'},
      {id:'r6',custId:'c3',type:'maintenance',date:ago(30),nextDate:from(25),tech:'Emre Celik',fee:200,note:'Membran ve filtreler yenilendi.'},
      {id:'r7',custId:'c4',type:'install',date:ago(90),nextDate:from(90),tech:'Kemal Arslan',fee:0,note:'Yeni kurulum.'},
    ]
  });
}



// ══ ADMİN — SEKME YÖNETİMİ ═══════════════════════════
(function(){
  var ROLE_LABELS = { admin: '🔴 Admin', sales: '🔵 Satış', service: '🟢 Servis' };
  var editingUserId = null;

  // Sekme geçişi
  document.querySelectorAll('.adm-tab-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var tab = btn.dataset.admtab;
      document.querySelectorAll('.adm-tab-btn').forEach(function(b){
        b.style.borderBottomColor = 'transparent';
        b.style.color = 'var(--c-ink3)';
        b.classList.remove('active');
      });
      btn.style.borderBottomColor = '#e85d26';
      btn.style.color = 'var(--c-ink)';
      btn.classList.add('active');
      document.getElementById('admPanelProducts').style.display = tab === 'products' ? '' : 'none';
      var uPanel = document.getElementById('admPanelUsers');
      uPanel.style.display = tab === 'users' ? 'flex' : 'none';
      if(tab === 'users') loadAdmUsers();
    });
  });

  // Kullanıcıları yükle ve tabloya bas
  function loadAdmUsers(){
    Api.get('/api/users').then(function(d){
      renderAdmUsers(d.users || []);
    }).catch(function(e){ showToast('Kullanıcılar yüklenemedi'); });
  }

  function renderAdmUsers(users){
    var tbody = document.getElementById('admUsersBody');
    if(!tbody) return;
    tbody.innerHTML = users.map(function(u){
      return '<tr data-uid="'+u.id+'">'
        +'<td><code style="font-size:.7rem;background:#f1f5f9;padding:2px 6px;border-radius:3px">'+esc(u.username)+'</code></td>'
        +'<td>'+esc(u.display_name)+'</td>'
        +'<td>'+( ROLE_LABELS[u.role]||u.role )+'</td>'
        +'<td style="color:var(--c-ink3);font-size:.68rem">'+(u.created_at||'').slice(0,10)+'</td>'
        +'<td style="display:flex;gap:6px;flex-wrap:wrap">'
          +'<button class="adm-btn adm-btn-neutral" style="font-size:.65rem;padding:4px 9px" onclick="admEditUser('+u.id+',\''+esc(u.display_name)+'\',\''+u.role+'\')">Düzenle</button>'
          +'<button class="adm-btn adm-btn-neutral" style="font-size:.65rem;padding:4px 9px" onclick="admResetPw('+u.id+',\''+esc(u.display_name)+'\')">Şifre</button>'
          +'<button class="adm-btn adm-btn-danger" style="font-size:.65rem;padding:4px 9px" onclick="admDeleteUser('+u.id+',\''+esc(u.display_name)+'\')">Sil</button>'
        +'</td>'
      +'</tr>';
    }).join('');
  }

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function showUserForm(title, uname, dname, role, uid){
    editingUserId = uid || null;
    document.getElementById('uUsername').value = uname || '';
    document.getElementById('uUsername').disabled = !!uid;
    document.getElementById('uDisplayName').value = dname || '';
    document.getElementById('uPassword').value = '';
    document.getElementById('uRole').value = role || 'sales';
    document.getElementById('admUserFormErr').style.display = 'none';
    document.getElementById('admUserForm').style.display = '';
    document.getElementById('admSaveUserBtn').textContent = uid ? '✓ Güncelle' : '✓ Kaydet';
    setTimeout(function(){ document.getElementById(uid ? 'uDisplayName' : 'uUsername').focus(); }, 80);
  }

  function hideUserForm(){
    editingUserId = null;
    document.getElementById('admUserForm').style.display = 'none';
  }

  function userFormErr(msg){
    var el = document.getElementById('admUserFormErr');
    el.textContent = msg; el.style.display = msg ? '' : 'none';
  }

  // Yeni kullanıcı butonu
  document.getElementById('admAddUserBtn').addEventListener('click', function(){
    showUserForm('Yeni Kullanıcı');
  });
  document.getElementById('admCancelUserBtn').addEventListener('click', hideUserForm);

  // Kaydet / Güncelle
  document.getElementById('admSaveUserBtn').addEventListener('click', function(){
    var uname   = document.getElementById('uUsername').value.trim();
    var dname   = document.getElementById('uDisplayName').value.trim();
    var pw      = document.getElementById('uPassword').value;
    var role    = document.getElementById('uRole').value;
    var btn     = this;

    if(!editingUserId){
      // YENİ KULLANICI
      if(!uname) return userFormErr('Kullanıcı adı zorunlu');
      if(pw.length < 6) return userFormErr('Şifre en az 6 karakter olmalı');
      btn.disabled = true; btn.textContent = 'Kaydediliyor...';
      Api.post('/api/users',{ username:uname, display_name:dname||uname, password:pw, role:role })
        .then(function(){ hideUserForm(); loadAdmUsers(); showToast('Kullanıcı oluşturuldu: '+uname); })
        .catch(function(e){ userFormErr(e.message||'Hata oluştu'); })
        .finally(function(){ btn.disabled=false; btn.textContent='✓ Kaydet'; });
    } else {
      // GÜNCELLE (display_name + rol)
      if(!dname) return userFormErr('Görünen ad zorunlu');
      btn.disabled = true; btn.textContent = 'Güncelleniyor...';
      Api.put('/api/users/'+editingUserId,{ display_name:dname, role:role })
        .then(function(){ hideUserForm(); loadAdmUsers(); showToast('Güncellendi'); })
        .catch(function(e){ userFormErr(e.message||'Hata oluştu'); })
        .finally(function(){ btn.disabled=false; btn.textContent='✓ Güncelle'; });
    }
  });

  // Global fonksiyonlar (onclick handler'larından çağrılıyor)
  window.admEditUser = function(id, dname, role){
    showUserForm('Düzenle', '', dname, role, id);
  };

  window.admResetPw = function(id, dname){
    var pw = prompt(dname + ' kullanıcısı için yeni şifre girin (min. 6 karakter):');
    if(!pw) return;
    if(pw.length < 6){ showToast('Şifre en az 6 karakter olmalı'); return; }
    Api.put('/api/users/'+id+'/password',{ new_password:pw })
      .then(function(){ showToast('Şifre güncellendi: '+dname); })
      .catch(function(e){ showToast('Hata: '+(e.message||'Güncelleme başarısız')); });
  };

  window.admDeleteUser = function(id, dname){
    if(!confirm(dname+' adlı kullanıcıyı silmek istediğinize emin misiniz?')) return;
    Api.del('/api/users/'+id)
      .then(function(){ loadAdmUsers(); showToast('Silindi: '+dname); })
      .catch(function(e){ showToast('Hata: '+(e.message||'Silinemedi')); });
  };
})();

// ══ MOBİL DRAWER ══════════════════════════════════════
(function() {
  var overlay = document.getElementById('mobOverlay');

  function closAll() {
    document.querySelectorAll('.left-rail,.svc-left,.right-sidebar').forEach(function(el) {
      el.classList.remove('mob-open');
    });
    overlay.classList.remove('open');
  }

  // Overlay tıklanınca kapat
  overlay.addEventListener('click', closAll);

  // Hamburger — aktif sayfaya göre hangi drawer açılacağını belirle
  document.getElementById('mobRailBtn').addEventListener('click', function() {
    var activePage = document.querySelector('.page-panel.active');
    var isService  = activePage && activePage.id === 'page-service';
    var target = isService
      ? document.querySelector('.svc-left')
      : document.querySelector('.left-rail');
    if (!target) return;
    var isOpen = target.classList.contains('mob-open');
    closAll();
    if (!isOpen) { target.classList.add('mob-open'); overlay.classList.add('open'); }
  });

  // Sepet butonu — sağ sidebar
  document.getElementById('mobCartBtn').addEventListener('click', function() {
    var sidebar = document.querySelector('.right-sidebar');
    if (!sidebar) return;
    var isOpen = sidebar.classList.contains('mob-open');
    closAll();
    if (!isOpen) { sidebar.classList.add('mob-open'); overlay.classList.add('open'); }
  });

  // Sayfa değiştiğinde drawer'ları kapat
  document.addEventListener('click', function(e) {
    var pill = e.target.closest('.nav-pill,[data-action="switchPage"]');
    if (pill) closAll();
  });
})();

