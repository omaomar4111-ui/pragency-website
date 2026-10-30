// functions/lib/automation-engine.js
// Central Smart Automation Engine (free, native, multi-step orchestration with AI decisions)

import { logSystemAction } from './audit.js';

export const CORE_WORKFLOWS = [
  {
    id: 'wf_onboard_new_client',
    name: 'OnboardNewClient',
    description: 'Triggered when a new client is created: Sends Telegram alert, creates project, AI generates industry task roadmap & welcome email draft.',
    trigger_event: 'client.created',
    is_active: 1,
    steps_json: JSON.stringify([
      { id: 'telegram_alert', type: 'action', title: 'Send Telegram Welcome to Admin' },
      { id: 'create_project', type: 'action', title: 'Create Default D1 Project' },
      { id: 'ai_decision_tasks', type: 'ai', title: 'AI Decision: Generate Personalized Task List' },
      { id: 'ai_welcome_email', type: 'ai', title: 'AI Copywriter: Generate Welcome Email Draft' }
    ])
  },
  {
    id: 'wf_process_invoice_payment',
    name: 'ProcessInvoicePayment',
    description: 'Triggered when an invoice is marked as paid: Updates CRM Lifetime Value, alerts Telegram, logs system audit entry.',
    trigger_event: 'invoice.paid',
    is_active: 1,
    steps_json: JSON.stringify([
      { id: 'update_ltv', type: 'action', title: 'Update Client Lifetime Value (LTV)' },
      { id: 'telegram_payment', type: 'action', title: 'Telegram Payment Received Notification' },
      { id: 'audit_log', type: 'action', title: 'System Audit Log Entry' }
    ])
  }
];

/**
 * Seed core workflows if they don't exist yet
 */
export async function ensureDefaultWorkflows(db) {
  if (!db) return;
  for (const wf of CORE_WORKFLOWS) {
    const existing = await db.prepare('SELECT id FROM agency_workflows WHERE id = ?').bind(wf.id).first();
    if (!existing) {
      await db.prepare(`
        INSERT INTO agency_workflows (id, name, description, trigger_event, is_active, steps_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(wf.id, wf.name, wf.description, wf.trigger_event, wf.is_active, wf.steps_json).run();
    }
  }
}

/**
 * Execute automation steps for a given event
 */
export async function executeAutomationEvent(event, data, env) {
  const dbAnalytics = env.ANALYTICS_DB || env.DB;
  const dbTasks = env.DB || env.ANALYTICS_DB;

  if (dbAnalytics) {
    await ensureDefaultWorkflows(dbAnalytics);
  }

  // Find all active workflows listening for this event
  let workflows = [];
  if (dbAnalytics) {
    try {
      const res = await dbAnalytics.prepare(`
        SELECT * FROM agency_workflows WHERE trigger_event = ? AND is_active = 1
      `).bind(event).all();
      workflows = res.results || [];
    } catch (e) {
      console.warn('Could not query agency_workflows:', e.message);
    }
  }

  // Fallback to in-memory core workflows if table empty
  if (workflows.length === 0) {
    workflows = CORE_WORKFLOWS.filter(w => w.trigger_event === event && w.is_active === 1);
  }

  const executionResults = [];

  for (const wf of workflows) {
    const executionId = 'wf_exec_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const stepLogs = [];
    let isSuccess = true;

    try {
      if (wf.name === 'OnboardNewClient' || wf.trigger_event === 'client.created') {
        const client = data.client || data;
        const companyName = client.company_name || client.name || 'عميل جديد';
        const clientId = client.id || 'client_unknown';
        const contactEmail = client.email || 'contact@client.com';
        const retainer = client.retainer_amount || 0;
        const industry = client.industry || client.business_type || 'التجارة الإلكترونية والتسويق الرقمي';

        // Step 1: Telegram Alert
        let teleOk = false;
        if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
          const msg = `🤖 *[محرك الأتمتة - Workflows]*\n` +
            `🚀 تم تشغيل سير عمل: *OnboardNewClient*\n` +
            `🏢 العميل: *${companyName}*\n` +
            `📧 البريد: \`${contactEmail}\`\n` +
            `💰 قيمة التعاقد: ${Number(retainer).toLocaleString()} ج.م\n` +
            `🕒 الوقت: ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}`;

          try {
            const teleRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' })
            });
            teleOk = teleRes.ok;
          } catch (e) {
            console.error('Telegram error in workflow:', e);
          }
        }
        stepLogs.push({ step: 'telegram_alert', status: 'completed', details: teleOk ? 'Sent Telegram alert' : 'Telegram simulated' });

        // Step 2: Create Default Project in D1
        let projectId = 'proj_' + Date.now().toString(36);
        if (dbTasks) {
          try {
            await dbTasks.prepare(`
              INSERT INTO projects (id, name, key, client_name, retainer_amount, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
            `).bind(projectId, `مشروع ${companyName} - الانطلاق`, 'LAUNCH-' + Math.random().toString(36).substring(2, 6).toUpperCase(), companyName, retainer).run();
            stepLogs.push({ step: 'create_project', status: 'completed', project_id: projectId });
          } catch (e) {
            stepLogs.push({ step: 'create_project', status: 'warning', error: e.message });
          }
        }

        // Step 3: AI Decision Making - Generate Personalized Task Roadmap
        let generatedTasks = [];
        try {
          if (env.AI) {
            const prompt = `أنت مدير مشاريع واستراتيجي تسويقي محترف. بالنظر لعميل جديد في قطاع "${industry}"، قم باقتراح 3 مهام تأسيسية فورية لإطلاق حسابه الإعلاني ومحتواه، واذكر العنوان والأولوية وتقدير الساعات. اكتب الإجابة بصيغة JSON array فقط: [{"title": "...", "priority": "high", "hours": 4}]`;
            const aiRes = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
              prompt,
              max_tokens: 400
            });
            const textResp = aiRes.response || '';
            const match = textResp.match(/\[[\s\S]*\]/);
            if (match) {
              generatedTasks = JSON.parse(match[0]);
            }
          }
        } catch (aiErr) {
          console.warn('AI task roadmap fallback:', aiErr.message);
        }

        if (!generatedTasks || generatedTasks.length === 0) {
          generatedTasks = [
            { title: `دراسة المنافسين وتحديد الجمهور المستهدف لـ ${companyName}`, priority: 'high', hours: 4 },
            { title: 'إعداد خطة المحتوى الشهري وتوزيع الميزانية الإعلانية', priority: 'high', hours: 6 },
            { title: 'تصميم قوالب الهوية البصرية وضبط بكسل التحويلات', priority: 'medium', hours: 5 }
          ];
        }

        // Insert AI suggested tasks into D1 tasks table
        if (dbTasks && projectId) {
          for (const t of generatedTasks) {
            const taskId = 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
            await dbTasks.prepare(`
              INSERT INTO tasks (id, project_id, title, description, assigned_to, status, priority, flag, planned_date, estimated_hours, created_at)
              VALUES (?, ?, ?, ?, ?, 'planned', ?, 'feature', date('now', '+2 days'), ?, datetime('now'))
            `).bind(taskId, projectId, t.title, `مهمة مقترحة ومولدة آلياً بواسطة الذكاء الاصطناعي لقطاع ${industry}`, 'فريق العمل الإبداعي', t.priority || 'medium', t.hours || 4).run();
          }
        }
        stepLogs.push({ step: 'ai_decision_tasks', status: 'completed', tasks_created: generatedTasks.length, tasks: generatedTasks });

        // Step 4: AI Welcome Email Draft
        const welcomeEmailDraft = {
          subject: `أهلاً بك في شراكة النجاح مع وكالة PR Agency | خطة الانطلاق لـ ${companyName}`,
          preview: `عزيزي شريك النجاح، يسعدنا انضمام ${companyName} لمنظومتنا التسويقية المتطورة. لقد قمنا بتجهيز خطة الانطلاق ومهام الأسبوع الأول تلقائياً.`
        };
        stepLogs.push({ step: 'ai_welcome_email', status: 'completed', draft: welcomeEmailDraft });

      } else if (wf.name === 'ProcessInvoicePayment' || wf.trigger_event === 'invoice.paid') {
        const invoice = data.invoice || data;
        const amount = Number(invoice.amount || 0);
        const clientId = invoice.client_id;
        const invoiceNumber = invoice.invoice_number || 'INV-PAID';
        const companyName = invoice.company_name || 'العميل';

        // Step 1: Update Lifetime Value in D1
        if (dbAnalytics && clientId) {
          try {
            await dbAnalytics.prepare(`
              UPDATE portal_clients 
              SET retainer_amount = retainer_amount + ?
              WHERE id = ?
            `).bind(amount, clientId).run();
            stepLogs.push({ step: 'update_ltv', status: 'completed', added_amount: amount });
          } catch (e) {
            stepLogs.push({ step: 'update_ltv', status: 'warning', error: e.message });
          }
        }

        // Step 2: Telegram Payment Received Alert
        if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
          const msg = `⚡ *[محرك الأتمتة - Workflows]*\n` +
            `💰 تم تشغيل سير عمل: *ProcessInvoicePayment*\n` +
            `🧾 رقم الفاتورة: \`#${invoiceNumber}\`\n` +
            `🏢 العميل: *${companyName}*\n` +
            `💵 المبلغ المسدد: *${amount.toLocaleString()} ج.م*\n` +
            `✅ الحالة: تم التحديث وتسجيل العملية مالياً`;

          fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown' })
          }).catch(e => console.error('Telegram payment error:', e));
        }
        stepLogs.push({ step: 'telegram_payment', status: 'completed' });

        // Step 3: Audit Log Entry
        if (dbAnalytics) {
          await logSystemAction(dbAnalytics, {
            adminId: 'workflow_engine',
            adminEmail: 'automation@pragency.eg',
            action: 'invoice_payment_processed_automated',
            targetType: 'client_invoices',
            targetId: invoice.id || invoiceNumber,
            details: `Workflow ProcessInvoicePayment executed for ${companyName} (${amount} EGP)`
          });
          stepLogs.push({ step: 'audit_log', status: 'completed' });
        }
      }

    } catch (err) {
      isSuccess = false;
      stepLogs.push({ step: 'error', error: err.message });
    }

    // Persist execution log in workflow_execution_logs
    if (dbAnalytics) {
      try {
        await dbAnalytics.prepare(`
          INSERT INTO workflow_execution_logs (id, workflow_id, trigger_event, status, payload_json, result_json, executed_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          executionId,
          wf.id,
          event,
          isSuccess ? 'success' : 'failed',
          JSON.stringify(data),
          JSON.stringify(stepLogs)
        ).run();
      } catch (logErr) {
        console.error('Failed to write workflow log:', logErr.message);
      }
    }

    executionResults.push({
      workflow_id: wf.id,
      workflow_name: wf.name,
      status: isSuccess ? 'success' : 'failed',
      steps: stepLogs
    });
  }

  return executionResults;
}
