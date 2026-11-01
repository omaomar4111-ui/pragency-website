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
  }
}
