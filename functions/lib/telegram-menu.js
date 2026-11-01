// functions/lib/telegram-menu.js
// PR Agency OS - Central Telegram Command Center Menu Builder

/**
 * Builds standard Telegram sendMessage payloads with Inline Keyboards
 * @param {string|number} chatId
 * @param {string} menuId
 * @param {object} context (optional dynamic data from DB)
 * @returns {object} Telegram sendMessage payload
 */
export function buildMenu(chatId, menuId, context = {}) {
  switch (menuId) {
    case 'menu:main':
    default:
      return {
        chat_id: chatId,
        text: `🏛️ <b>مركز القيادة المركزي | PR Agency OS 2026</b>\n\nأهلاً بك في لوحة التحكم الإدارية المتكاملة عبر تليجرام. يمكنك إدارة كافة عمليات الوكالة، المهام، العملاء، الفواتير، وتقارير الذكاء الاصطناعي من هنا مباشرة:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 نظرة عامة', callback_data: 'menu:overview' },
              { text: '📋 المهام', callback_data: 'menu:tasks' }
            ],
            [
              { text: '👥 العملاء', callback_data: 'menu:clients' },
              { text: '💼 الليدز', callback_data: 'menu:leads' }
            ],
            [
              { text: '🧾 الفواتير', callback_data: 'menu:invoices' },
              { text: '👤 الفريق', callback_data: 'menu:team' }
            ],
            [
              { text: '📂 المشاريع', callback_data: 'menu:projects' },
              { text: '🤖 أدوات AI', callback_data: 'menu:ai' }
            ],
            [
              { text: '⚙️ الأتمتة', callback_data: 'menu:automation' },
              { text: '📈 التقارير', callback_data: 'menu:reports' }
            ],
            [
              { text: '⚙️ الإعدادات', callback_data: 'menu:settings' }
            ]
          ]
        }
      };

    case 'menu:overview': {
      const {
        totalClients = 0,
        activeTasks = 0,
        paidInvoicesThisMonth = 0,
        paidAmountThisMonth = 0,
        newLeadsThisWeek = 0,
        currency = 'EGP'
      } = context;

      return {
        chat_id: chatId,
        text: `📊 <b>نظرة عامة على أداء الوكالة | Live Executive Pulse</b>\n` +
              `────────────────────\n` +
              `👥 <b>إجمالي العملاء النشطين:</b> ${totalClients} عميل\n` +
              `📋 <b>المهام الجارية الآن:</b> ${activeTasks} مهمة\n` +
              `💼 <b>الليدز الجديدة (هذا الأسبوع):</b> ${newLeadsThisWeek} ليد\n` +
              `🧾 <b>الفواتير المحصلة (هذا الشهر):</b> ${paidInvoicesThisMonth} فاتورة\n` +
              `💰 <b>إجمالي الإيرادات المحصلة:</b> ${Number(paidAmountThisMonth).toLocaleString('en-US')} ${currency}\n` +
              `────────────────────\n` +
              `⚡ <i>تم التحديث اللحظي من قواعد بيانات Cloudflare D1</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 تحديث', callback_data: 'menu:overview' },
              { text: '📋 المهام', callback_data: 'menu:tasks' }
            ],
            [
              { text: '💼 الليدز', callback_data: 'menu:leads' },
              { text: '🧾 الفواتير', callback_data: 'menu:invoices' }
            ],
            [
              { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
            ]
          ]
        }
      };
    }

    // ── PHASE 2: TASKS MENUS ──
    case 'menu:tasks': {
      return {
        chat_id: chatId,
        text: `📋 <b>إدارة المهام والعمليات اليومية | Tasks OS</b>\n\nاختر الإجراء المطلوب لمتابعة مهام الفريق أو إضافة مهام جديدة:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '➕ إضافة مهمة جديدة', callback_data: 'menu:tasks:add' }
            ],
            [
              { text: '📋 مهام اليوم', callback_data: 'menu:tasks:today' },
              { text: '⏰ المتأخرة', callback_data: 'menu:tasks:overdue' }
            ],
            [
              { text: '✅ المنجزة', callback_data: 'menu:tasks:done' },
              { text: '📊 إحصائيات المهام', callback_data: 'menu:tasks:stats' }
            ],
            [
              { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
            ]
          ]
        }
      };
    }

    case 'menu:tasks:list': {
      const {
        title = 'قائمة المهام',
        tasks = [],
        listType = 'today'
      } = context;

      let msgText = `📋 <b>${title}</b>\n────────────────────\n`;
      const keyboard = [];

      if (!tasks || tasks.length === 0) {
        msgText += `<i>لا توجد مهام مسجلة في هذا القسم حالياً 🎉</i>\n`;
      } else {
        tasks.slice(0, 6).forEach((task, idx) => {
          const statusIcon = task.status === 'done' ? '✅' : (task.status === 'in-progress' ? '⚡' : '📌');
          const priorityIcon = task.priority === 'urgent' ? '🔴' : (task.priority === 'high' ? '🟠' : '🟢');
          
          msgText += `\n<b>${idx + 1}. ${task.title}</b>\n` +
                     `   • الحالة: ${statusIcon} ${task.status}\n` +
                     `   • الأولوية: ${priorityIcon} ${task.priority || 'medium'}\n` +
                     `   • المسؤول: 👤 ${task.assigned_to || 'Super Admin'}\n` +
                     `   • التاريخ: 📅 ${task.planned_date || 'اليوم'}\n`;

          keyboard.push([
            { text: `✅ إتمام`, callback_data: `action:task:done:${task.id}` },
            { text: `⏸️ تايمر`, callback_data: `action:task:timer:${task.id}` },
            { text: `✏️ تعديل`, callback_data: `action:task:edit:${task.id}` },
            { text: `🗑️ حذف`, callback_data: `action:task:delete:${task.id}` }
          ]);
        });
      }

      msgText += `────────────────────\n⚡ <i>استخدم الأزرار أدناه للتحكم المباشر في كل مهمة:</i>`;

      keyboard.push([
        { text: '➕ إضافة مهمة جديدة', callback_data: 'menu:tasks:add' },
        { text: '🔄 تحديث', callback_data: `menu:tasks:${listType}` }
      ]);
      keyboard.push([
        { text: '⬅️ رجوع لقسم المهام', callback_data: 'menu:tasks' }
      ]);

      return {
        chat_id: chatId,
        text: msgText,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      };
    }

    case 'menu:tasks:stats': {
      const {
        planned = 0,
        inProgress = 0,
        done = 0,
        overdue = 0,
        weekHours = 0
      } = context;

      return {
        chat_id: chatId,
        text: `📊 <b>إحصائيات ومؤشرات إنجاز المهام</b>\n` +
              `────────────────────\n` +
              `📌 <b>المهام المخططة:</b> ${planned} مهمة\n` +
              `⚡ <b>قيد التنفيذ الآن:</b> ${inProgress} مهمة\n` +
              `✅ <b>المهام المنجزة:</b> ${done} مهمة\n` +
              `⏰ <b>المهام المتأخرة:</b> ${overdue} مهمة\n` +
              `⏱️ <b>ساعات العمل المسجلة (هذا الأسبوع):</b> ${Number(weekHours).toFixed(1)} ساعة\n` +
              `────────────────────\n` +
              `⚡ <i>تم الاحتساب من جدول المهام وسجلات الوقت الحية</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 مهام اليوم', callback_data: 'menu:tasks:today' },
              { text: '⏰ المهام المتأخرة', callback_data: 'menu:tasks:overdue' }
            ],
            [
              { text: '➕ إضافة مهمة جديدة', callback_data: 'menu:tasks:add' },
              { text: '🔄 تحديث الإحصائيات', callback_data: 'menu:tasks:stats' }
            ],
            [
              { text: '⬅️ رجوع لقسم المهام', callback_data: 'menu:tasks' }
            ]
          ]
        }
      };
    }

    // ── PHASE 3: CLIENTS & LEADS MENUS ──
    case 'menu:clients': {
      const { clients = [] } = context;
      let text = `👥 <b>قائمة عملاء الوكالة (Portal Clients)</b>\n────────────────────\n`;
      const keyboard = [];

      if (!clients || clients.length === 0) {
        text += `<i>لا يوجد عملاء مسجلين حالياً.</i>\n`;
      } else {
        clients.slice(0, 6).forEach((client, idx) => {
          text += `\n<b>${idx + 1}. ${client.company_name}</b>\n` +
                  `   • المسؤول: 👤 ${client.contact_name || 'غير محدد'}\n` +
                  `   • البريد: ✉️ ${client.email}\n` +
                  `   • الاشتراك الشهري: 💰 ${Number(client.retainer_amount || 0).toLocaleString('en-US')} ج.م\n`;

          keyboard.push([
            { text: `📄 تفاصيل`, callback_data: `action:client:view:${client.id}` },
            { text: `🔗 رابط البوابة`, url: `https://pragency.pages.dev/portal-dashboard-2026` },
            { text: `🗑️ حذف`, callback_data: `action:client:delete:${client.id}` }
          ]);
        });
      }

      text += `────────────────────\n⚡ <i>إجمالي العملاء: ${clients.length} عميل</i>`;

      keyboard.push([
        { text: '🔄 تحديث', callback_data: 'menu:clients' },
        { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
      ]);

      return {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      };
    }

    case 'menu:client:detail': {
      const {
        client = {},
        activeDeliverables = 0,
        unpaidInvoices = 0
      } = context;

      return {
        chat_id: chatId,
        text: `📄 <b>ملف العميل: ${client.company_name}</b>\n` +
              `────────────────────\n` +
              `👤 <b>المسؤول:</b> ${client.contact_name || 'غير محدد'}\n` +
              `✉️ <b>البريد:</b> ${client.email}\n` +
              `📱 <b>الهاتف / واتساب:</b> ${client.phone || client.whatsapp_number || 'غير متوفر'}\n` +
              `💰 <b>قيمة العقد الشهري (Retainer):</b> ${Number(client.retainer_amount || 0).toLocaleString('en-US')} ج.م\n` +
              `📅 <b>يوم إصدار الفاتورة:</b> يوم ${client.billing_day || 1} من كل شهر\n` +
              `📂 <b>التسليمات / المشاريع النشطة:</b> ${activeDeliverables} تسليمة\n` +
              `🧾 <b>الفواتير غير المسددة:</b> ${unpaidInvoices} فاتورة\n` +
              `────────────────────`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔗 فتح بوابة العميل', url: `https://pragency.pages.dev/portal-dashboard-2026` },
              { text: '🗑️ حذف العميل', callback_data: `action:client:delete:${client.id}` }
            ],
            [
              { text: '⬅️ رجوع لقائمة العملاء', callback_data: 'menu:clients' }
            ]
          ]
        }
      };
    }

    case 'menu:leads': {
      const { leads = [] } = context;
      let text = `💼 <b>قائمة الصفقات والليدز (Sales Pipeline)</b>\n────────────────────\n`;
      const keyboard = [];

      const stageLabels = {
        new: '🆕 جديد',
        contacted: '📞 تم التواصل',
        proposal: '📑 عرض سعر',
        won: '🏆 تعاقد بنجاح',
        lost: '❌ خسارة'
      };

      if (!leads || leads.length === 0) {
        text += `<i>لا توجد ليدز أو صفقات جديدة حالياً.</i>\n`;
      } else {
        leads.slice(0, 6).forEach((lead, idx) => {
          const stageBadge = stageLabels[lead.pipeline_stage] || lead.pipeline_stage || '🆕 جديد';
          text += `\n<b>${idx + 1}. ${lead.name}</b> (${lead.project_name || 'مشروع جديد'})\n` +
                  `   • المرحلة: ${stageBadge}\n` +
                  `   • الميزانية: 💰 ${lead.budget_tier || 'غير محدد'}\n` +
                  `   • الهاتف: 📱 <code>${lead.phone}</code>\n`;

          keyboard.push([
            { text: `🔄 تغيير المرحلة`, callback_data: `action:lead:stage:${lead.id}` },
            { text: `💬 إرسال رسالة`, callback_data: `action:lead:msg:${lead.id}` },
            { text: `🗑️`, callback_data: `action:lead:delete:${lead.id}` }
          ]);
        });
      }

      text += `────────────────────\n⚡ <i>استخدم الأزرار لإدارة مراحل الصفقات والمتابعات الفورية:</i>`;

      keyboard.push([
        { text: '🔄 تحديث الصفقات', callback_data: 'menu:leads' },
        { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
      ]);

      return {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      };
    }

    case 'menu:lead:stages': {
      const { lead = {} } = context;
      return {
        chat_id: chatId,
        text: `🔄 <b>تغيير مرحلة الصفقة:</b>\n\n👤 <b>العميل:</b> ${lead.name}\n🏢 <b>المشروع:</b> ${lead.project_name || 'صفقة جديدة'}\n\nاختر المرحلة الجديدة لنقل الصفقة إليها:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🆕 جديد (New)', callback_data: `action:lead:setstage:${lead.id}:new` },
              { text: '📞 تم التواصل (Contacted)', callback_data: `action:lead:setstage:${lead.id}:contacted` }
            ],
            [
              { text: '📑 عرض سعر (Proposal)', callback_data: `action:lead:setstage:${lead.id}:proposal` },
              { text: '🏆 تعاقد بنجاح (Won)', callback_data: `action:lead:setstage:${lead.id}:won` }
            ],
            [
              { text: '❌ تم الاستبعاد / خسارة (Lost)', callback_data: `action:lead:setstage:${lead.id}:lost` }
            ],
            [
              { text: '⬅️ إلغاء والرجوع لليدز', callback_data: 'menu:leads' }
            ]
          ]
        }
      };
    }

    // ── PHASE 4: INVOICES & PROJECTS MENUS ──
    case 'menu:invoices': {
      const {
        paidCount = 0,
        paidTotal = 0,
        pendingCount = 0,
        pendingTotal = 0,
        overdueCount = 0,
        overdueTotal = 0,
        pendingInvoices = [],
        currency = 'EGP'
      } = context;

      let text = `🧾 <b>إدارة الفواتير والتحصيل المالي | Invoices Hub</b>\n` +
                 `────────────────────\n` +
                 `💰 <b>إجمالي المحصل:</b> ${Number(paidTotal).toLocaleString('en-US')} ${currency} (${paidCount} فاتورة)\n` +
                 `⏳ <b>فواتير معلقة (قيد السداد):</b> ${Number(pendingTotal).toLocaleString('en-US')} ${currency} (${pendingCount} فاتورة)\n` +
                 `⏰ <b>فواتير متأخرة:</b> ${Number(overdueTotal).toLocaleString('en-US')} ${currency} (${overdueCount} فاتورة)\n` +
                 `────────────────────\n`;

      const keyboard = [];

      if (!pendingInvoices || pendingInvoices.length === 0) {
        text += `<i>لا توجد فواتير معلقة بانتظار الاعتماد حالياً 🎉</i>\n`;
      } else {
        text += `<b>الفواتير المستحقة للمتابعة والاعتماد:</b>\n`;
        pendingInvoices.slice(0, 5).forEach((inv, idx) => {
          text += `\n<b>${idx + 1}. #${inv.invoice_number}</b> - ${inv.client_name || 'عميل'}\n` +
                  `   • المبلغ: 💰 ${Number(inv.amount || 0).toLocaleString('en-US')} ${inv.currency || currency}\n` +
                  `   • الاستحقاق: 📅 ${inv.due_date}\n` +
                  `   • الحالة: ⏳ ${inv.status}\n`;

          keyboard.push([
            { text: `✅ اعتماد سداد #${inv.invoice_number}`, callback_data: `action:invoice:pay:${inv.id}` },
            { text: `📄 عرض`, callback_data: `action:invoice:view:${inv.id}` }
          ]);
        });
      }

      keyboard.push([
        { text: '➕ إصدار فاتورة جديدة', callback_data: 'action:invoice:new' },
        { text: '🔄 تحديث', callback_data: 'menu:invoices' }
      ]);
      keyboard.push([
        { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
      ]);

      return {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      };
    }

    case 'menu:invoice:detail': {
      const { invoice = {} } = context;
      return {
        chat_id: chatId,
        text: `🧾 <b>تفاصيل الفاتورة #${invoice.invoice_number}</b>\n` +
              `────────────────────\n` +
              `🏢 <b>العميل:</b> ${invoice.client_name || invoice.client_id || 'غير محدد'}\n` +
              `💰 <b>المبلغ:</b> ${Number(invoice.amount || 0).toLocaleString('en-US')} ${invoice.currency || 'EGP'}\n` +
              `📅 <b>تاريخ الاستحقاق:</b> ${invoice.due_date}\n` +
              `📌 <b>الحالة:</b> ${invoice.status === 'paid' ? '✅ مدفوعة' : '⏳ غير مدفوعة'}\n` +
              `📝 <b>ملاحظات:</b> ${invoice.notes || 'لا توجد ملاحظات إضافية'}\n` +
              `────────────────────`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            invoice.status !== 'paid' ? [
              { text: '✅ اعتماد سداد الفاتورة الآن', callback_data: `action:invoice:pay:${invoice.id}` }
            ] : [],
            [
              { text: '⬅️ رجوع لقائمة الفواتير', callback_data: 'menu:invoices' }
            ]
          ].filter(row => row.length > 0)
        }
      };
    }

    case 'menu:projects': {
      const { projects = [] } = context;
      let text = `📂 <b>المشاريع النشطة والربحية | Projects & Profitability</b>\n────────────────────\n`;
      const keyboard = [];

      if (!projects || projects.length === 0) {
        text += `<i>لا توجد مشاريع مسجلة حالياً.</i>\n`;
      } else {
        projects.slice(0, 5).forEach((proj, idx) => {
          const retainer = Number(proj.retainer_amount || 0);
          const loggedHours = Number(proj.logged_hours || 0);
          const cost = loggedHours * 150; // estimated internal hourly cost
          const margin = retainer > 0 ? (((retainer - cost) / retainer) * 100).toFixed(0) : 0;
          const marginEmoji = margin >= 50 ? '🟢' : (margin >= 25 ? '🟡' : '🔴');

          text += `\n<b>${idx + 1}. ${proj.name}</b> [<code>${proj.key}</code>]\n` +
                  `   • العميل: 🏢 ${proj.client_name || 'داخلي'}\n` +
                  `   • العقد: 💰 ${retainer.toLocaleString('en-US')} ج.م\n` +
                  `   • الساعات المسجلة: ⏱️ ${loggedHours.toFixed(1)} س\n` +
                  `   • هامش الربح التقديري: ${marginEmoji} <b>${margin}%</b>\n`;

          keyboard.push([
            { text: `📊 تفاصيل`, callback_data: `action:project:view:${proj.id}` },
            { text: `👥 الفريق`, callback_data: `action:project:team:${proj.id}` },
            { text: `📋 المهام`, callback_data: `action:project:tasks:${proj.id}` }
          ]);
        });
      }

      text += `────────────────────\n⚡ <i>بيانات الربحية محسوبة لحظياً من سجلات الوقت والمهام</i>`;

      keyboard.push([
        { text: '🔄 تحديث المشاريع', callback_data: 'menu:projects' },
        { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
      ]);

      return {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      };
    }

    // ── PHASE 5: TEAM & SETTINGS MENUS ──
    case 'menu:team': {
      const { members = [] } = context;
      let text = `👤 <b>فريق عمل الوكالة والصلاحيات | Team Hub</b>\n────────────────────\n`;
      const keyboard = [];

      if (!members || members.length === 0) {
        text += `<i>لا يوجد أعضاء مسجلين حالياً.</i>\n`;
      } else {
        members.slice(0, 6).forEach((m, idx) => {
          const statusIcon = m.active ? '🟢 نشط' : '🔴 معطل';
          text += `\n<b>${idx + 1}. ${m.name}</b> (${statusIcon})\n` +
                  `   • المسمى: 💼 ${m.role || m.roles || 'عضو فريق'}\n` +
                  `   • القسم: 🏢 ${m.department || 'العمليات'}\n` +
                  `   • البريد: ✉️ ${m.email}\n`;

          keyboard.push([
            { text: `👤 تفاصيل`, callback_data: `action:team:view:${m.id}` },
            { text: `📋 مهامه`, callback_data: `action:team:tasks:${m.id}` },
            { text: m.active ? `⏸️ تعطيل` : `▶️ تفعيل`, callback_data: `action:team:toggle:${m.id}` },
            { text: `🗑️`, callback_data: `action:team:delete:${m.id}` }
          ]);
        });
      }

      text += `────────────────────\n⚡ <i>استخدم الأزرار لإدارة حسابات الفريق ومهامهم:</i>`;

      keyboard.push([
        { text: '➕ إضافة عضو جديد', callback_data: 'action:team:add' },
        { text: '🔄 تحديث', callback_data: 'menu:team' }
      ]);
      keyboard.push([
        { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
      ]);

      return {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      };
    }

    case 'menu:team:detail': {
      const { member = {}, assignedTasksCount = 0 } = context;
      return {
        chat_id: chatId,
        text: `👤 <b>ملف عضو الفريق: ${member.name}</b>\n` +
              `────────────────────\n` +
              `💼 <b>الدور الوظيفي:</b> ${member.role || member.roles || 'فريق العمل'}\n` +
              `🏢 <b>القسم:</b> ${member.department || 'العمليات'}\n` +
              `✉️ <b>البريد:</b> ${member.email}\n` +
              `📱 <b>الهاتف:</b> ${member.phone || 'غير مسجل'}\n` +
              `📌 <b>حالة الحساب:</b> ${member.active ? '🟢 نشط ومفعل' : '🔴 معطل'}\n` +
              `📋 <b>المهام الموكلة إليه حالياً:</b> ${assignedTasksCount} مهمة\n` +
              `────────────────────`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 عرض مهام العضو', callback_data: `action:team:tasks:${member.id}` },
              { text: member.active ? '⏸️ تعطيل الحساب' : '▶️ تفعيل الحساب', callback_data: `action:team:toggle:${member.id}` }
            ],
            [
              { text: '⬅️ رجوع لقائمة الفريق', callback_data: 'menu:team' }
            ]
          ]
        }
      };
    }

    case 'menu:settings': {
      const {
        instapayIpa = 'pragency@instapay',
        instapayName = 'PR Agency Egypt Official',
        applePayMerchantId = 'merchant.com.pragency.portal',
        telegramChatId = '5715939844',
        notifyCountries = 'EG,SA,AE'
      } = context;

      return {
        chat_id: chatId,
        text: `⚙️ <b>إعدادات منظومة الوكالة وبوابات الدفع | Agency Settings</b>\n` +
              `────────────────────\n` +
              `💳 <b>إنستاباي IPA:</b> <code>${instapayIpa}</code>\n` +
              `🏢 <b>اسم حساب إنستاباي:</b> ${instapayName}\n` +
              `🍏 <b>Apple Pay Merchant ID:</b> <code>${applePayMerchantId}</code>\n` +
              `🤖 <b>Telegram Chat ID المعتمد:</b> <code>${telegramChatId}</code>\n` +
              `🌍 <b>دول الإشعارات المستهدفة:</b> ${notifyCountries}\n` +
              `────────────────────\n` +
              `⚡ <i>اختر البند المراد تعديله أو اختبر إشعارات النظام:</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✏️ تعديل إنستاباي IPA', callback_data: 'action:settings:edit:instapay_ipa' }
            ],
            [
              { text: '✏️ تعديل اسم إنستاباي', callback_data: 'action:settings:edit:instapay_name' }
            ],
            [
              { text: '✏️ تعديل Apple Pay ID', callback_data: 'action:settings:edit:apple_pay_merchant_id' }
            ],
            [
              { text: '🔔 اختبار الإشعارات الفورية', callback_data: 'action:settings:test_notification' }
            ],
            [
              { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
            ]
          ]
        }
      };
    }

    // ── PHASE 6: AI TOOLS & AUTOMATION MENUS ──
    case 'menu:ai': {
      return {
        chat_id: chatId,
        text: `🤖 <b>مركز أدوات الذكاء الاصطناعي التوليدي | AI Tools Studio</b>\n────────────────────\nاختر أداة الذكاء الاصطناعي لبدء توليد المحتوى، الاستراتيجيات، أو العروض التقديمية فورياً:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✍️ كتابة بوست سوشيال ميديا', callback_data: 'action:ai:post' }
            ],
            [
              { text: '📊 توليد استراتيجية تسويق كاملة', callback_data: 'action:ai:strategy' }
            ],
            [
              { text: '📑 توليد عرض تقديمي (Pitch Deck)', callback_data: 'action:ai:pitch' }
            ],
            [
              { text: '🔍 بحث وتنقيب عن شركة (Prospecting)', callback_data: 'action:ai:prospect' }
            ],
            [
              { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
            ]
          ]
        }
      };
    }

    case 'menu:automation': {
      const { workflows = [] } = context;
      let text = `⚙️ <b>محرك الأتمتة وسير العمل | Workflows & Automations</b>\n────────────────────\n`;
      const keyboard = [];

      if (!workflows || workflows.length === 0) {
        text += `<i>لا توجد مسارات أتمتة مسجلة حالياً.</i>\n`;
      } else {
        workflows.slice(0, 6).forEach((wf, idx) => {
          const statusIcon = wf.is_active ? '🟢 نشط' : '🔴 معطل';
          text += `\n<b>${idx + 1}. ${wf.name}</b> (${statusIcon})\n` +
                  `   • المحفز: ⚡ ${wf.trigger_event || 'مجدول'}\n` +
                  `   • الإجراء: 🎯 ${wf.action_type || 'تنبيه'}\n`;

          keyboard.push([
            { text: wf.is_active ? `🔴 تعطيل` : `🟢 تفعيل`, callback_data: `action:workflow:toggle:${wf.id}` },
            { text: `▶️ تشغيل يدوي`, callback_data: `action:workflow:run:${wf.id}` }
          ]);
        });
      }

      text += `────────────────────\n⚡ <i>يمكنك التحكم في تشغيل وإيقاف أي أتمتة بضغطة زر</i>`;

      keyboard.push([
        { text: '🔄 تحديث', callback_data: 'menu:automation' },
        { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
      ]);

      return {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      };
    }

    // ── PHASE 7: REPORTS MENUS ──
    case 'menu:reports': {
      return {
        chat_id: chatId,
        text: `📈 <b>مركز التقارير التنفيذية والتحليلات | Executive Reports</b>\n────────────────────\nاختر التقرير المراد توليده لحظياً من بيانات الوكالة أو تصديرها كملف:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 تقرير الإيرادات والتحصيل', callback_data: 'action:report:revenue' }
            ],
            [
              { text: '📊 تقرير أداء الفريق والمشاريع', callback_data: 'action:report:performance' }
            ],
            [
              { text: '📈 تقرير الليدز والتحويلات', callback_data: 'action:report:leads' }
            ],
            [
              { text: '🤖 تقرير وكلاء الذكاء الاصطناعي', callback_data: 'action:report:agents' }
            ],
            [
              { text: '📥 تصدير ملف البيانات (CSV)', callback_data: 'action:report:csv' }
            ],
            [
              { text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'menu:main' }
            ]
          ]
        }
      };
    }
  }
}
