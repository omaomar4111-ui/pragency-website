
let allLeads = [];
let currentStageFilter = 'all';
let voiceRecognition = null;
let isVoiceRecording = false;
let activeMicStream = null;
let voiceTranscriptText = '';
let mediaRecorder = null;
let audioChunks = [];

// ── SCRIPT LOGIC PRESERVED & STRENGTHENED ──────────────────────────────────────
function showPage(id, btn) {
  if (typeof toggleMobileSidebar === "function") toggleMobileSidebar(false);
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  const p = document.getElementById('page-' + id);
  if (p) p.classList.add('active');
  if (btn) btn.classList.add('active');

  if (id === 'dashboard') refreshDashboard();
  if (id === 'kanban') renderKanban(allLeads);
  if (id === 'leads') renderLeadsTable(allLeads);
  if (id === 'voice') populateLeadSelect();
  if (id === 'overdue') loadOverdue();
  if (id === 'reports') loadReports();
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

let currentLeadsPage = 1;
let totalLeadsPages = 1;

async function changeLeadsPage(delta) {
  const newPage = currentLeadsPage + delta;
  if (newPage >= 1 && newPage <= totalLeadsPages) {
    currentLeadsPage = newPage;
    await refreshLeadsTableOnly();
  }
}
window.changeLeadsPage = changeLeadsPage;

async function fetchLeads(stage = '', page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (stage && stage !== 'all') params.set('stage', stage);
  params.set('page', page);
  params.set('limit', limit);
  
  const r = await fetch('/api/admin/sales/leads?' + params.toString());
  const d = await r.json();

  if (d.pagination) {
    totalLeadsPages = d.pagination.totalPages || 1;
    currentLeadsPage = d.pagination.page || 1;
    const pageSpan = document.getElementById('leadsCurrentPage');
    const totalSpan = document.getElementById('leadsTotalPages');
    const countSpan = document.getElementById('leadsTotalRecords');
    const prevBtn = document.getElementById('leadsPrevBtn');
    const nextBtn = document.getElementById('leadsNextBtn');

    if (pageSpan) pageSpan.textContent = currentLeadsPage;
    if (totalSpan) totalSpan.textContent = totalLeadsPages;
    if (countSpan) countSpan.textContent = d.pagination.total;
    if (prevBtn) prevBtn.disabled = currentLeadsPage <= 1;
    if (nextBtn) nextBtn.disabled = currentLeadsPage >= totalLeadsPages;
  }

  return d.leads || d.data || [];
}

async function refreshLeadsTableOnly() {
  const leads = await fetchLeads(currentStageFilter, currentLeadsPage, 20);
  renderLeadsTable(leads);
}

async function refreshAll() {
  allLeads = await fetchLeads();
  refreshDashboard();
  if (document.getElementById('page-kanban').classList.contains('active')) renderKanban(allLeads);
  if (document.getElementById('page-leads').classList.contains('active')) renderLeadsTable(allLeads);
}

async function refreshDashboard() {
  if (!allLeads.length) allLeads = await fetchLeads();

  const total = allLeads.length;
  const newLeads = allLeads.filter(l => l.pipeline_stage === 'new').length;
  const won = allLeads.filter(l => l.pipeline_stage === 'won').length;
  const today = new Date().toISOString().split('T')[0];
  const overdue = allLeads.filter(l =>
    l.next_followup_due && l.next_followup_due < today &&
    !['won','lost'].includes(l.pipeline_stage)
  ).length;

  document.getElementById('st-total').textContent = total;
  document.getElementById('st-new').textContent = newLeads;
  document.getElementById('st-won').textContent = won;
  document.getElementById('st-overdue').textContent = overdue;

  const sources = {};
  allLeads.forEach(l => { sources[l.source_type] = (sources[l.source_type] || 0) + 1; });
  const sourceNames = {
    instagram_ads: 'إعلانات انستاجرام', facebook_ads: 'إعلانات فيسبوك',
    google_ads: 'إعلانات جوجل', referral: 'توصية عميل',
    cold_call: 'اتصال بارد', website: 'الموقع', other: 'أخرى'
  };

  const chartEl = document.getElementById('sourceChart');
  if (Object.keys(sources).length === 0) {
    chartEl.innerHTML = '<div style="color:var(--text-muted);text-align:center;">لا توجد بيانات مصادر بعد</div>';
  } else {
    chartEl.innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${Object.entries(sources).map(([src, count]) => `
          <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:8px 14px;display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:var(--text-muted)">${sourceNames[src] || src}</span>
            <span style="font-weight:800;color:#fff;font-size:13px">${count}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  const recent = allLeads.slice(0, 5);
  const tb = document.getElementById('recentLeadsBody');
  if (!recent.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px">لا توجد Leads حالياً</td></tr>';
  } else {
    tb.innerHTML = recent.map(l => `
      <tr>
        <td><strong>${l.name}</strong></td>
        <td>${l.project_name || '—'}</td>
        <td>${sourceNames[l.source_type] || l.source_type || '—'}</td>
        <td>${l.assigned_sales_name || '—'}</td>
        <td><span class="badge badge-${l.pipeline_stage}">${l.pipeline_stage}</span></td>
        <td style="color:var(--text-muted)">${(l.created_at||'').slice(0,10)}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="openLeadDetail('${l.id}')">تفاصيل</button></td>
      </tr>
    `).join('');
  }
}

function renderKanban(leads) {
  const stages = [
    { key: 'new', label: '🆕 جديد' },
    { key: 'contacted', label: '📞 تم التواصل' },
    { key: 'meeting_scheduled', label: '📅 ميتينج مجدول' },
    { key: 'proposal_sent', label: '📄 تم إرسال عرض' },
    { key: 'won', label: '✅ Won' },
    { key: 'lost', label: '❌ Lost' },
  ];

  const board = document.getElementById('kanbanBoard');
  board.innerHTML = stages.map(s => {
    const colLeads = leads.filter(l => l.pipeline_stage === s.key);
    return `
      <div class="kanban-col">
        <div class="kanban-col-head">
          <span>${s.label}</span>
          <span class="kanban-count">${colLeads.length}</span>
        </div>
        <div>
          ${colLeads.map(l => `
            <div class="kanban-card" onclick="openLeadDetail('${l.id}')">
              <div class="kanban-card-name">${l.name}</div>
              <div class="kanban-card-meta">
                <span>📁 ${l.project_name || 'مشروع بدون اسم'}</span>
                <span>🏷️ ${l.service_interested || 'خدمات عامة'}</span>
              </div>
              <div class="kanban-card-footer">
                <span style="font-size:11px;color:var(--text-dim)">${(l.created_at||'').slice(0,10)}</span>
                <span class="badge badge-${l.pipeline_stage}" style="font-size:10px">${l.pipeline_stage}</span>
              </div>
            </div>
          `).join('') || '<div style="color:var(--text-dim);font-size:12px;text-align:center;padding:16px;">لا توجد عناصر</div>'}
        </div>
      </div>
    `;
  }).join('');
}

function filterLeads(stage, btn) {
  currentStageFilter = stage;
  document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderLeadsTable(allLeads);
}

function renderLeadsTable(leads) {
  const filtered = currentStageFilter === 'all' ? leads : leads.filter(l => l.pipeline_stage === currentStageFilter);
  const tbody = document.getElementById('leadsTableBody');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px">لا توجد نتائج مطابقة</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(l => `
    <tr>
      <td><strong>${l.name}</strong></td>
      <td dir="ltr" style="text-align:right"><a href="https://wa.me/${(l.phone||'').replace(/\D/g,'')}" target="_blank" style="color:var(--success)">📱 ${l.phone||'—'}</a></td>
      <td>${l.project_name || '—'}</td>
      <td>${l.source_type || '—'}</td>
      <td>${l.assigned_sales_name || '—'}</td>
      <td><span class="badge badge-${l.pipeline_stage}">${l.pipeline_stage}</span></td>
      <td style="color:var(--text-muted)">${l.next_followup_due || '—'}</td>
      <td><button class="btn btn-sm btn-secondary" onclick="openLeadDetail('${l.id}')">عرض</button></td>
    </tr>
  `).join('');
}

function populateLeadSelect() {
  const sel = document.getElementById('voiceLeadSelect');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- اختر Lead للمتابعة --</option>' +
    allLeads.map(l => `<option value="${l.id}">${l.name} (${l.project_name || 'مشروع'})</option>`).join('');
}

function checkSpeechSupport() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = document.getElementById('voiceBtn');
  const notice = document.getElementById('voiceFallbackNotice');
  const status = document.getElementById('voiceStatus');
  if (!SpeechRecognition) {
    if (btn) btn.style.display = 'none';
    if (notice) notice.style.display = 'block';
    if (status) status.textContent = 'متصفحك لا يدعم التسجيل الصوتي، يرجى كتابة الملاحظات يدوياً.';
  }
}

async function checkMicPermissionStatus() {
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const p = await navigator.permissions.query({ name: 'microphone' });
      return p.state; // 'granted', 'prompt', or 'denied'
    } catch(e) {
      console.warn('[Permissions API] query error:', e);
    }
  }
  return 'prompt';
}

function showMicBlockedUI(statusEl) {
  if (!statusEl) return;
  statusEl.innerHTML = '<div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:12px;padding:16px;margin-top:14px;color:#fca5a5;text-align:right;">' +
    '<div style="font-size:14px;font-weight:800;color:#f87171;margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
      '<span>🔒 المتصفح قام بحظر الميكروفون</span>' +
    '</div>' +
    '<div style="font-size:13px;color:#e2e8f0;line-height:1.7;margin-bottom:10px;">' +
      'المتصفح قام بحظر الميكروفون. يرجى فتح الإعدادات وتغيير الإذن إلى "سماح" ثم تحديث الصفحة.<br>' +
      'أو اضغط على أيقونة <b>القفل / أذونات الموقع</b> 🔒 بجوار الرابط أعلى الصفحة واختر <b>Allow (سماح)</b> للميكروفون.' +
    '</div>' +
    '<div style="margin-bottom:12px;font-size:12px;color:#94a3b8;">' +
      '💡 رابط إعدادات كروم: <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;color:#fbcfe8;user-select:all;">chrome://settings/content/microphone</code>' +
    '</div>' +
    '<div style="display:flex;gap:12px;justify-content:flex-end;align-items:center;flex-wrap:wrap;">' +
      '<button type="button" onclick="resetMicPermissions()" style="background:none;border:none;color:#94a3b8;font-size:12px;cursor:pointer;text-decoration:underline;padding:4px 8px;">' +
        'إعادة تعيين أذونات الموقع' +
      '</button>' +
      '<button type="button" class="btn btn-primary" onclick="retryMicrophoneAccess()" style="background:#ef4444;border-color:#dc2626;padding:8px 18px;font-size:13px;">' +
        '🔄 إعادة المحاولة' +
      '</button>' +
    '</div>' +
  '</div>';
}

async function resetMicPermissions() {
  if (navigator.permissions && navigator.permissions.revoke) {
    try {
      await navigator.permissions.revoke({ name: 'microphone' });
      alert('تمت محاولة إعادة ضبط الإذن. اضغط الآن على "إعادة المحاولة" أو أعد تحميل الصفحة.');
      retryMicrophoneAccess();
      return;
    } catch (e) {
      console.warn('revoke error:', e);
    }
  }
  alert('لإعادة تعيين الإذن يدويًا:\n1. اضغط على أيقونة القفل أو الضبط 🔒 بجوار رابط الموقع أعلى المتصفح\n2. اختر Reset permissions أو غيّر Microphone إلى Allow\n3. أعد تحميل الصفحة.');
}

function retryMicrophoneAccess() {
  const status = document.getElementById('voiceStatus');
  if (status) {
    status.textContent = 'جاري طلب إذن الميكروفون مجدداً...';
    status.style.color = '#38bdf8';
  }
  toggleVoice();
}

async function requestMicPermissionInteractive() {
  retryMicrophoneAccess();
}

// ── STRICT USER GESTURE DRIVEN VOICE CONTROLLER ──
async function toggleVoice() {
  const btn = document.getElementById('voiceBtn');
  const transcript = document.getElementById('voiceTranscript');
  const notesTextarea = document.getElementById('voiceNotes');
  const status = document.getElementById('voiceStatus');
  const notice = document.getElementById('voiceFallbackNotice');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // 1. If currently recording -> Stop cleanly
  if (isVoiceRecording) {
    if (voiceRecognition) {
      try { voiceRecognition.stop(); } catch(err) {}
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try { mediaRecorder.stop(); } catch(err) {}
    }
    if (activeMicStream) {
      try {
        activeMicStream.getTracks().forEach(track => track.stop());
      } catch(err) {}
      activeMicStream = null;
    }
    isVoiceRecording = false;
    btn.classList.remove('recording');
    btn.innerHTML = '🎙️';
    btn.style.background = '';
    status.textContent = 'تم إيقاف التسجيل بنجاح';
    status.style.color = 'var(--text-muted)';
    return;
  }

  // 2. Permissions API Check (Rule 1)
  const permState = await checkMicPermissionStatus();
  console.log('[Permissions API] Microphone permission state:', permState);

  if (permState === 'denied') {
    showMicBlockedUI(status);
    btn.classList.remove('recording');
    btn.innerHTML = '🎙️';
    return;
  }

  // 3. User Gesture Direct Hardware Acquisition (Rule 2)
  if (!activeMicStream) {
    status.textContent = 'جاري الاتصال بالميكروفون...';
    status.style.color = '#a78bfa';

    try {
      activeMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Voice] Stream acquired via user gesture:', activeMicStream.id);
    } catch (mediaErr) {
      console.warn('[Voice] getUserMedia rejected:', mediaErr);
      btn.classList.remove('recording');
      btn.innerHTML = '🎙️';
      showMicBlockedUI(status);
      return;
    }
  }

  // 4. Speech Recognition with Instant MediaRecorder Fallback (Rule 3)
  let speechRecognitionStarted = false;
  if (SpeechRecognition) {
    try {
      voiceRecognition = new SpeechRecognition();
      voiceRecognition.lang = 'ar-EG';
      voiceRecognition.continuous = true;
      voiceRecognition.interimResults = true;

      voiceRecognition.onstart = () => {
        isVoiceRecording = true;
        btn.classList.add('recording');
        btn.innerHTML = '⏹️';
        btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        status.textContent = '🎙️ جاري الاستماع الفوري... تحدث الآن';
        status.style.color = '#34d399';
        if (!voiceTranscriptText) {
          transcript.textContent = '';
        }
      };

      voiceRecognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const finalText = event.results[i][0].transcript.trim() + ' ';
            voiceTranscriptText += finalText;
            if (notesTextarea) {
              notesTextarea.value = (notesTextarea.value + ' ' + finalText).trim();
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        transcript.textContent = (voiceTranscriptText + interim).trim() || 'جاري التقاط الصوت...';
      };

      voiceRecognition.onerror = (event) => {
        console.warn('SpeechRecognition failed with event:', event.error);

        // Fallback immediately to MediaRecorder if not allowed or network fails
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'network') {
          if (activeMicStream && window.MediaRecorder) {
            console.log('Triggering instant fallback to MediaRecorder...');
            startMediaRecorderFallback(btn, status, transcript, notesTextarea);
            return;
          }
        }

        if (event.error === 'no-speech') {
          status.textContent = 'تحدث بوضوح في الميكروفون...';
          return;
        }

        btn.classList.remove('recording');
        btn.innerHTML = '🎙️';
        btn.style.background = '';
        isVoiceRecording = false;
        showMicBlockedUI(status);
      };

      voiceRecognition.onend = () => {
        if (isVoiceRecording) {
          try { voiceRecognition.start(); return; } catch(e) {}
        }
        btn.classList.remove('recording');
        btn.innerHTML = '🎙️';
        btn.style.background = '';
        isVoiceRecording = false;
        if (activeMicStream) {
          try { activeMicStream.getTracks().forEach(t => t.stop()); } catch(e) {}
          activeMicStream = null;
        }
        status.textContent = 'اكتمل التفريغ الصوتي بنجاح';
        status.style.color = 'var(--text-muted)';
      };

      voiceRecognition.start();
      speechRecognitionStarted = true;
      return;
    } catch(err) {
      console.warn('SpeechRecognition instantiation failed, defaulting to MediaRecorder:', err);
    }
  }

  // 5. Direct MediaRecorder if SpeechRecognition was blocked or unavailable
  if (!speechRecognitionStarted && activeMicStream && window.MediaRecorder) {
    startMediaRecorderFallback(btn, status, transcript, notesTextarea);
  }
}

function startMediaRecorderFallback(btn, status, transcript, notesTextarea) {
  try {
    audioChunks = [];
    mediaRecorder = new MediaRecorder(activeMicStream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };
    mediaRecorder.onstart = () => {
      isVoiceRecording = true;
      btn.classList.add('recording');
      btn.innerHTML = '⏹️';
      btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      status.textContent = '🎙️ جاري تسجيل الملاحظة الصوتية مباشرة...';
      status.style.color = '#34d399';
    };
    mediaRecorder.onstop = () => {
      isVoiceRecording = false;
      btn.classList.remove('recording');
      btn.innerHTML = '🎙️';
      btn.style.background = '';
      status.textContent = '✅ تم تسجيل الملاحظة الصوتية وجاهزة للحفظ';
      status.style.color = '#34d399';
      if (notesTextarea && !notesTextarea.value.includes('تسجيل صوتي')) {
        notesTextarea.value = (notesTextarea.value + ' [تم إرفاق تسجيل صوتي للمتابعة ' + new Date().toLocaleTimeString('ar-EG') + ']').trim();
      }
    };
    mediaRecorder.start(250);
  } catch(e) {
    status.textContent = 'تعذر تشغيل مسجل الصوت: ' + e.message;
    status.style.color = '#ef4444';
  }
}

async function formatVoiceNoteWithAI() {
  const notesTextarea = document.getElementById('voiceNotes');
  const transcriptEl = document.getElementById('voiceTranscript');
  const btn = document.getElementById('aiFormatVoiceBtn');
  const leadSelect = document.getElementById('voiceLeadSelect');
  const status = document.getElementById('voiceStatus');

  const rawText = (notesTextarea?.value || transcriptEl?.textContent || '').trim();

  if (!rawText || rawText.includes('سيظهر النص المفرغ') || rawText.length < 5) {
    alert('يرجى التحدث في الميكروفون أولاً أو كتابة ملاحظات لتلخيصها وتنسيقها.');
    return;
  }

  const origBtnHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm" style="display:inline-block;width:14px;height:14px;border:2px solid #c084fc;border-right-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;vertical-align:middle;margin-left:6px;"></span> جاري التحليل والتنسيق...';
  if (status) {
    status.textContent = '🤖 جاري استخراج البيانات واستبعاد الحشو بالذكاء الاصطناعي...';
    status.style.color = '#c084fc';
  }

  const leadId = leadSelect?.value || '';
  const selectedLead = allLeads.find(l => String(l.id) === String(leadId));

  try {
    const res = await fetch('/api/admin/sales/ai-skill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('admin_jwt') || '')
      },
      body: JSON.stringify({
        action: 'format_voice_note',
        raw_text: rawText,
        lead_id: leadId || undefined,
        lead_name: selectedLead?.name || '',
        company: selectedLead?.project_name || '',
        stage: selectedLead?.stage || ''
      })
    });

    const data = await res.json();

    if (data.success && data.formatted_text) {
      notesTextarea.value = data.formatted_text;
      if (status) {
        status.textContent = '✨ تم تنظيف وتنسيق الملاحظة باحترافية وتوثيقها!';
        status.style.color = '#34d399';
      }
    } else {
      throw new Error(data.error || 'تعذر تنسيق الملاحظة');
    }
  } catch (err) {
    console.error('[AI Voice Note Formatter Error]:', err);
    alert('تنبيه: تعذر إكمال التلخيص بالذكاء الاصطناعي (' + err.message + '). تم الاحتفاظ بالنص الأصلي.');
    if (status) {
      status.textContent = '⚠️ حدث خطأ في معالجة الذكاء الاصطناعي، تم الحفاظ على النص الأصلي';
      status.style.color = '#f87171';
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = origBtnHtml;
  }
}

async function saveVoiceFollowup() {
  const lead_id = document.getElementById('voiceLeadSelect').value;
  const outcome = document.getElementById('voiceOutcome').value;
  const new_stage = document.getElementById('voiceNewStage').value;
  const next_followup_due = document.getElementById('voiceNextDate').value;
  const transcript = document.getElementById('voiceTranscript').textContent;
  const notes = document.getElementById('voiceNotes').value;

  if (!lead_id) {
    alert('يرجى اختيار Lead للمتابعة');
    return;
  }

  const summary = [transcript, notes].filter(Boolean).join(' | ');

  try {
    const res = await fetch('/api/admin/sales/followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id,
        outcome,
        new_stage: new_stage || undefined,
        next_followup_due: next_followup_due || undefined,
        notes: summary
      })
    });
    const d = await res.json();
    if (d.success) {
      alert('✅ تم حفظ المتابعة بنجاح وتحديث بيانات العميل!');
      document.getElementById('voiceTranscript').textContent = 'سيظهر النص المفرغ هنا تلقائياً...';
      document.getElementById('voiceNotes').value = '';
      refreshAll();
    } else {
      alert('خطأ: ' + d.error);
    }
  } catch (err) {
    alert('تعذر حفظ المتابعة');
  }
}

async function openLeadDetail(leadId) {
  const lead = allLeads.find(l => l.id == leadId);
  if (!lead) return;

  openModal('leadDetailModal'); setTimeout(() => triggerAutoOutreach(lead), 100);
  const content = document.getElementById('leadDetailContent');
  content.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);">جاري استرجاع التفاصيل...</div>';

  let followups = [];
  try {
    const r = await fetch('/api/admin/sales/leads?id=' + leadId);
    const d = await r.json();
    followups = d.followups || [];
  } catch(e) {}

  const initials = lead.name ? lead.name.slice(0, 2).toUpperCase() : 'LD';

  content.innerHTML = `
    <div class="lead-detail-header">
      <div class="lead-avatar">${initials}</div>
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:18px;font-weight:850;color:#fff;">${lead.name}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${lead.project_name || 'مشروع'} · المصدر: ${lead.source_type || '—'}</div>
          </div>
          <span class="badge badge-${lead.pipeline_stage}">${lead.pipeline_stage}</span>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <a href="https://wa.me/${(lead.phone||'').replace(/\D/g,'')}" target="_blank" class="btn btn-sm btn-secondary">📱 واتساب</a>
          <a href="tel:${lead.phone||''}" class="btn btn-sm btn-secondary">📞 اتصال هاتف</a>
          <button class="btn btn-sm btn-primary" onclick="convertLeadToClientUI('${lead.id}')" style="background:#10b981;border-color:#059669;color:#fff;font-weight:700;">🚀 تحويل إلى عميل بورتال (Convert)</button>
          <button class="btn btn-sm btn-secondary" onclick="triggerDailyBrief()" style="margin-right:auto;border-color:rgba(139,92,246,0.4);color:#c4b5fd;">☀️ بريف اليوم (تليجرام)</button>
        </div>
      </div>
    </div>

    <!-- 🤖 SMART SALES CO-PILOT (POWERED BY 65+ MARKETING SKILLS & ARENA) -->
    <div style="background:linear-gradient(135deg, rgba(139,92,246,0.12), rgba(6,182,212,0.08));border:1px solid rgba(139,92,246,0.35);border-radius:var(--radius-sm);padding:14px;margin-bottom:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:800;color:#c4b5fd;display:flex;align-items:center;gap:6px;">
          <span>🤖 مساعد المبيعات الذكي (Sales Co-Pilot - Skills Active)</span>
        </div>
        <span id="aiSkillBadge" style="font-size:11px;color:var(--text-muted);">توجيه ذكي مدعوم بـ 77 مهارة</span>
      </div>

      <!-- Suggested Action Box (Auto-Outreach) -->
      <div id="smartOutreachBox" style="background:#0d0e12;border:1px dashed rgba(139,92,246,0.4);border-radius:8px;padding:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="font-size:12px;color:#38bdf8;">⚡ الرسالة المقترحة تلقائياً (Cold Email & WhatsApp):</strong>
          <button type="button" class="btn btn-sm" onclick="copySmartOutreach()" style="padding:2px 8px;font-size:11px;background:rgba(255,255,255,0.08);color:#fff;">📋 نسخ النص</button>
        </div>
        <div id="smartOutreachText" style="font-size:12.5px;color:#e2e8f0;line-height:1.6;white-space:pre-wrap;">⏳ جاري إعداد الرسالة المقترحة المخصصة لهذا العميل تلقائياً...</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;">
        <button type="button" class="btn btn-sm btn-secondary" onclick="callAiSkill('research', '${lead.id}')" style="justify-content:center;background:rgba(255,255,255,0.04);">
          🔍 ابحث عن الشركة (Arena)
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="handleObjectionClick('${lead.id}')" style="justify-content:center;background:rgba(239,68,68,0.1);color:#fca5a5;border-color:rgba(239,68,68,0.3);">
          🛡️ معالجة اعتراض
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="generateLeadProposal('${lead.id}')" style="justify-content:center;background:rgba(16,185,129,0.1);color:#6ee7b7;border-color:rgba(16,185,129,0.3);">
          📄 توليد عرض سعر (Offers)
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="callAiSkill('competitor', '${lead.id}')" style="justify-content:center;background:rgba(255,255,255,0.04);">
          ⚔️ تحليل المنافسين
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="callAiSkill('presentation', '${lead.id}')" style="justify-content:center;background:rgba(255,255,255,0.04);">
          📊 Pitch Deck
        </button>
      </div>

      <div id="aiSkillResultBox" style="display:none;margin-top:12px;background:#0d0e12;border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:12px;font-size:13px;line-height:1.6;color:#e2e8f0;white-space:pre-wrap;max-height:280px;overflow-y:auto;"></div>
    </div>
    <div style="background:linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.06));border:1px solid rgba(139,92,246,0.3);border-radius:var(--radius-sm);padding:14px;margin-bottom:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:12px;font-weight:800;color:#c4b5fd;display:flex;align-items:center;gap:6px;">
          <span>⚡ مهارات الذكاء الاصطناعي للمبيعات (Sales AI Suite)</span>
        </div>
        <span id="aiSkillBadge" style="font-size:11px;color:var(--text-muted);">اضغط لتوليد استخبارات فورية</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;">
        <button type="button" class="btn btn-sm btn-secondary" onclick="callAiSkill('research', '${lead.id}')" style="justify-content:center;background:rgba(255,255,255,0.04);">
          🔍 ابحث عن الشركة
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="callAiSkill('competitor', '${lead.id}')" style="justify-content:center;background:rgba(255,255,255,0.04);">
          ⚔️ تحليل المنافسين
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="callAiSkill('presentation', '${lead.id}')" style="justify-content:center;background:rgba(255,255,255,0.04);">
          📊 توليد عرض تقديمي
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="callAiSkill('outreach', '${lead.id}')" style="justify-content:center;background:rgba(255,255,255,0.04);">
          ✉️ كتابة رسالة أوتريتش
        </button>
      </div>

      <!-- AI Output Box -->
      <div id="aiSkillResultBox" style="display:none;margin-top:12px;background:#090a0f;border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:12px;font-size:12px;line-height:1.6;color:#e2e8f0;white-space:pre-wrap;max-height:220px;overflow-y:auto;">
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;font-size:12px;background:var(--bg-surface);padding:14px;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
      <div><span style="color:var(--text-dim)">المصدر: </span><strong>${lead.source_type||'—'}</strong></div>
      <div><span style="color:var(--text-dim)">الخدمة: </span><strong>${lead.service_interested||'—'}</strong></div>
      <div><span style="color:var(--text-dim)">الميزانية: </span><strong>${lead.budget_tier||'—'}</strong></div>
      <div><span style="color:var(--text-dim)">المسؤول: </span><strong>${lead.assigned_sales_name||'—'}</strong></div>
      <div><span style="color:var(--text-dim)">المتابعة القادمة: </span><strong>${lead.next_followup_due||'—'}</strong></div>
      <div><span style="color:var(--text-dim)">الهاتف: </span><strong dir="ltr">${lead.phone||'—'}</strong></div>
    </div>

    <div style="margin-top:16px;">
      <div style="font-size:13px;font-weight:700;color:var(--text-main);margin-bottom:8px;">سجل المتابعات (Followup History)</div>
      ${followups.length ? followups.map(f => `
        <div class="followup-item">
          <div class="followup-meta">${f.created_at || ''} · ${f.outcome || ''}</div>
          <div style="font-size:12px;color:var(--text-main);white-space:pre-wrap;">${f.notes || ''}</div>
        </div>
      `).join('') : '<div style="font-size:12px;color:var(--text-dim);text-align:center;padding:12px;">لا توجد متابعات مسجلة بعد لهذا العميل</div>'}
    </div>
  `;
}

async function callAiSkill(skill, leadId) {
  const lead = allLeads.find(l => l.id == leadId);
  const badge = document.getElementById('aiSkillBadge');
  const box = document.getElementById('aiSkillResultBox');
  if (badge) {
    badge.textContent = '⏳ جاري المعالجة بالذكاء الاصطناعي...';
    badge.style.color = '#38bdf8';
  }
  if (box) {
    box.style.display = 'block';
    box.textContent = 'جاري التوليد والتحليل الذكي...';
  }

  try {
    const res = await fetch('/api/admin/sales/ai-skill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('admin_jwt') || '')
      },
      body: JSON.stringify({
        skill,
        lead_id: leadId,
        lead_name: lead?.name,
        company: lead?.project_name,
        project_name: lead?.project_name,
        stage: lead?.pipeline_stage,
        estimated_value: lead?.estimated_value
      })
    });
    const d = await res.json();
    if (d.success) {
      if (badge) {
        badge.textContent = '✅ ' + (d.actionTitle || 'تم بنجاح وحفظ في الملاحظات');
        badge.style.color = '#34d399';
      }
      if (box) {
        box.textContent = d.result;
      }
    } else {
      if (box) box.textContent = 'خطأ: ' + d.error;
    }
  } catch (err) {
    if (box) box.textContent = 'تعذر الاتصال بخدمة الذكاء الاصطناعي';
  }
}

async function triggerDailyBrief() {
  if (!confirm('هل تريد إرسال البريف اليومي لصفقات ومبيعات اليوم على تليجرام الإدارة الآن؟')) return;
  try {
    const res = await fetch('/api/admin/sales/daily-brief', {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('admin_jwt') || '') }
    });
    const d = await res.json();
    if (d.success) {
      alert('☀️ تم إرسال البريف اليومي بنجاح على تليجرام!');
    } else {
      alert('خطأ: ' + d.error);
    }
  } catch(e) {
    alert('تعذر إرسال البريف اليومي');
  }
}

async function submitNewLead(e) {
  e.preventDefault();
  const name = document.getElementById('al-name').value;
  const project_name = document.getElementById('al-project').value;
  const phone = document.getElementById('al-phone').value;
  const email = document.getElementById('al-email').value;
  const source_type = document.getElementById('al-source').value;
  const service_interested = document.getElementById('al-service').value;
  const budget_tier = document.getElementById('al-budget').value;
  const referral_client_name = document.getElementById('al-refclient').value;
  const challenge_notes = document.getElementById('al-notes').value;

  try {
    const res = await fetch('/api/admin/sales/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, project_name, phone, email, source_type,
        service_interested, budget_tier, referral_client_name, challenge_notes
      })
    });
    const d = await res.json();
    if (d.success) {
      closeModal('addLeadModal');
      document.getElementById('addLeadForm').reset();
      refreshAll();
      alert('🎉 تم إضافة الـ Lead بنجاح!');
    } else {
      alert('خطأ: ' + d.error);
    }
  } catch(err) {
    alert('تعذر إضافة الـ Lead');
  }
}

async function loadOverdue() {
  const today = new Date().toISOString().split('T')[0];
  const overdue = allLeads.filter(l =>
    l.next_followup_due && l.next_followup_due < today &&
    !['won','lost'].includes(l.pipeline_stage)
  );

  const tbody = document.getElementById('overdueBody');
  if (!overdue.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">🎉 لا توجد متابعات متأخرة!</td></tr>';
    return;
  }
  tbody.innerHTML = overdue.map(l => `
    <tr>
      <td><strong>${l.name}</strong></td>
      <td dir="ltr" style="text-align:right"><a href="https://wa.me/${(l.phone||'').replace(/\D/g,'')}" target="_blank" style="color:var(--success)">📱 ${l.phone||'—'}</a></td>
      <td>${l.assigned_sales_name||'—'}</td>
      <td><span class="badge badge-overdue">⚠️ ${l.next_followup_due}</span></td>
      <td><span class="badge badge-${l.pipeline_stage}">${l.pipeline_stage}</span></td>
      <td><button class="btn btn-sm btn-primary" onclick="openLeadDetail('${l.id}')">متابعة الآن</button></td>
    </tr>
  `).join('');
}

function loadReports() {
  const total = allLeads.length;
  const won = allLeads.filter(l => l.pipeline_stage === 'won').length;
  const lost = allLeads.filter(l => l.pipeline_stage === 'lost').length;
  const rate = total > 0 ? Math.round(won / total * 100) : 0;

  document.getElementById('rp-total').textContent = total;
  document.getElementById('rp-won').textContent = won;
  document.getElementById('rp-lost').textContent = lost;
  document.getElementById('rp-rate').textContent = rate + '%';

  const sources = {};
  allLeads.forEach(l => {
    if (!sources[l.source_type]) sources[l.source_type] = { total:0, won:0 };
    sources[l.source_type].total++;
    if (l.pipeline_stage === 'won') sources[l.source_type].won++;
  });

  const sourceNames = { instagram_ads:'انستاجرام', facebook_ads:'فيسبوك', google_ads:'جوجل', referral:'توصية', cold_call:'اتصال بارد', website:'الموقع', other:'أخرى' };

  document.getElementById('reportBody').innerHTML = `
    <table>
      <thead><tr><th>المصدر</th><th>إجمالي Leads</th><th>Won</th><th>نسبة التحويل</th></tr></thead>
      <tbody>
        ${Object.entries(sources).sort((a,b)=>b[1].total-a[1].total).map(([src, data]) => `
          <tr>
            <td><strong>${sourceNames[src]||src}</strong></td>
            <td>${data.total}</td>
            <td style="color:var(--success);font-weight:700;">${data.won}</td>
            <td><strong style="color:var(--warning)">${Math.round(data.won/data.total*100)}%</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

window.onload = async () => {
  await refreshAll();
  checkSpeechSupport();
};

// ── 📱 MOBILE SIDEBAR & DOCK HANDLERS ─────────────────────────────────
function toggleMobileSidebar(forceState) {
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('mobileSidebarBackdrop');
  if (!sidebar) return;

  const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function updateDockActive(btn) {
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// Auto-close mobile sidebar when selecting any page
const originalShowPage = window.showPage;

