import { sendEmail } from '../lib/email.js';

export async function onRequest(context) {
  const { env, request } = context;
  const db = env.ANALYTICS_DB || env.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not bound' }), { status: 500 });
  }

  const nowIso = new Date().toISOString();

  try {
    // 1. Fetch pending emails whose send_at is <= now
    const { results: pendingEmails } = await db.prepare(`
      SELECT id, lead_id, email, template, send_at
      FROM email_queue
      WHERE status = 'pending' AND send_at <= ?
      LIMIT 20
    `).bind(nowIso).all();

    const dispatched = [];

    for (const item of (pendingEmails || [])) {
      let subject = 'PR Agency';
      let html = '<p>مرحباً بك في PR Agency</p>';

      if (item.template === 'welcome') {
        subject = 'أهلاً بك في PR Agency 👋';
        html = `
          <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
            <h2>أهلاً بك في PR Agency 👋</h2>
            <p>شكراً لتواصلك معنا. استلمنا طلبك وفريقنا الاستراتيجي يراجع تفاصيل مشروعك حالياً.</p>
            <p>سنتواصل معك خلال 24 ساعة بمقترح وخطة نمو مخصصة لنشاطك التجاري.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
            <p style="color:#666;font-size:12px;">PR Agency — شريكك الإبداعي للنمو ومضاعفة المبيعات</p>
          </div>
        `;
      } else if (item.template === 'case_study') {
        subject = 'قصة نجاح: كيف ضاعفنا مبيعات أحد شركائنا 🚀';
        html = `
          <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
            <h2>دراسة حالة حقيقية من PR Agency</h2>
            <p>شاركنا مؤخراً دراسة حالة مفصلة عن حملات نمو رقمية حققت عائداً قياسياً على الاستثمار (ROAS 4.8x).</p>
            <p><a href="https://pragency.pages.dev/case-studies" style="color:#7c3aed;font-weight:bold;">اضغط هنا للاطلاع على دراسات الحالة ونماذج الأعمال</a></p>
          </div>
        `;
      } else if (item.template === 'offer') {
        subject = 'عرض خاص ومحدد لاستشارتك التسويقية 🎁';
        html = `
          <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
            <h2>جلسة تدقيق تسويقي مجانية (Audit Session)</h2>
            <p>يسعدنا تقديم تحليل مجاني لحساباتك وإعلاناتك الحالية لتحديد نقاط الهدر وفرص النمو السريعة.</p>
            <p><a href="https://wa.me/201144826641" style="background:#7c3aed;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;display:inline-block;">تواصل معنا فوراً على واتساب</a></p>
          </div>
        `;
      }

      const sendResult = await sendEmail(env, {
        to: item.email,
        subject,
        html
      });

      const updatedStatus = sendResult.success ? 'sent' : (sendResult.skipped ? 'skipped' : 'failed');

      await db.prepare(`
        UPDATE email_queue
        SET status = ?, sent_at = ?
        WHERE id = ?
      `).bind(updatedStatus, nowIso, item.id).run();

      dispatched.push({ id: item.id, email: item.email, status: updatedStatus });
    }

    return new Response(JSON.stringify({
      success: true,
      processed: dispatched.length,
      dispatched
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
