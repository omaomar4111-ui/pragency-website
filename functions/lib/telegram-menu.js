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

          // Inline action controls per task
          keyboard.push([
            { text: `✅ إتمام`, callback_data: `action:task:done:${task.id}` },
            { text: `⏸️ تايمر`, callback_data: `action:task:timer:${task.id}` },
            { text: `✏️ تعديل`, callback_data: `action:task:edit:${task.id}` },
            { text: `🗑️ حذف`, callback_data: `action:task:delete:${task.id}` }
          ]);
        });
      }

      msgText += `────────────────────\n⚡ <i>استخدم الأزرار أدناه للتحكم المباشر في كل مهمة:</i>`;

      // Global Navigation buttons
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
        reply_markup: {
          inline_keyboard: keyboard
        }
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
  }
}
