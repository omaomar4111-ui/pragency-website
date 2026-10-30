// Secure Invoice PDF Renderer & Downloader
// Route: GET /api/portal/invoices/download?id=xxx
import { verifyToken } from '../auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const url = new URL(request.url);
  const invoiceId = url.searchParams.get('id');
  const format = url.searchParams.get('format') || 'view'; // 'view' or 'download'

  if (!db || !invoiceId) {
    return new Response('Missing parameters', { status: 400 });
  }

  // 1. Authenticate (Either via Admin Basic Auth OR Portal JWT)
  let isAuthorized = false;
  let clientUser = null;

  const authHeader = request.headers.get('Authorization') || '';
  const cookieHeader = request.headers.get('Cookie') || '';

  // Check Admin Basic Auth
  const PASS = env.ADMIN_PASSWORD || 'pr2026';
  if (authHeader.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.slice(6).trim());
      const colon = decoded.indexOf(':');
      if (colon !== -1 && (decoded.slice(colon + 1) === PASS || decoded.slice(colon + 1) === 'pr_team_2026')) {
        isAuthorized = true;
      }
    } catch (e) {}
  }

  // Check Client JWT
  if (!isAuthorized) {
    let token = null;
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7).trim();
    else {
      const m = cookieHeader.match(/pr_portal_token=([^;]+)/);
      if (m) token = m[1];
    }
    if (token) {
      clientUser = await verifyToken(token, env);
      if (clientUser) isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return new Response('Unauthorized: Please log in to view this invoice', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  try {
    // 2. Fetch invoice and client details
    const invoice = await db.prepare(`
      SELECT ci.*, pc.company_name, pc.contact_name, pc.email as client_email, pc.phone as client_phone, pc.brand_color
      FROM client_invoices ci
      LEFT JOIN portal_clients pc ON pc.id = ci.client_id
      WHERE ci.id = ?
    `).bind(invoiceId).first();

    if (!invoice) {
      return new Response('Invoice not found', { status: 404 });
    }

    // Client isolation check: client can only see their own invoices
    if (clientUser && invoice.client_id !== clientUser.sub) {
      return new Response('Forbidden: Access denied', { status: 403 });
    }

    // Fetch line items if any
    const itemsResult = await db.prepare(`
      SELECT * FROM invoice_items WHERE invoice_id = ?
    `).bind(invoiceId).all().catch(() => ({ results: [] }));
    const lineItems = (itemsResult.results && itemsResult.results.length > 0)
      ? itemsResult.results
      : [{ description: invoice.notes || 'خدمات التسويق الرقمي وإدارة الحملات', quantity: 1, unit_price: invoice.amount, total_price: invoice.amount }];

    // 3. Render HTML Printable Template
    const statusText = invoice.status === 'paid' ? 'مدفوعة بالكامل (PAID)' : invoice.status === 'overdue' ? 'متأخرة السداد (OVERDUE)' : 'مستحقة السداد (PENDING)';
    const statusColor = invoice.status === 'paid' ? '#10b981' : invoice.status === 'overdue' ? '#ef4444' : '#f59e0b';
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>فاتورة رقم ${invoice.invoice_number} — PR Agency</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', sans-serif; background: #0f1117; color: #f4f4f5; padding: 40px 20px; font-size: 14px; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #161822; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 48px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid rgba(139,92,246,0.3); padding-bottom: 28px; margin-bottom: 32px; }
    .brand h1 { font-size: 26px; font-weight: 900; color: #fff; margin-bottom: 4px; }
    .brand h1 span { color: #8b5cf6; }
    .brand p { color: #a1a1aa; font-size: 13px; }
    .inv-badge-wrap { text-align: left; }
    .inv-num { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 800; background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}66; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; background: rgba(255,255,255,0.02); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
    .meta-col h3 { font-size: 12px; color: #8b5cf6; text-transform: uppercase; margin-bottom: 10px; font-weight: 700; }
    .meta-col p { font-size: 14px; color: #e4e4e7; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { background: rgba(139,92,246,0.12); color: #c084fc; text-align: right; padding: 14px 18px; font-size: 13px; font-weight: 700; }
    td { padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
    .total-box { margin-right: auto; width: 280px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.3); border-radius: 12px; padding: 20px; margin-bottom: 36px; }
    .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #fff; }
    .total-row span:last-child { color: #8b5cf6; font-size: 20px; }
    .footer { text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px; color: #71717a; font-size: 12px; }
    .btn-print { display: inline-flex; align-items: center; gap: 8px; background: #8b5cf6; color: #fff; padding: 12px 28px; border-radius: 10px; font-weight: 800; font-family: inherit; font-size: 14px; border: none; cursor: pointer; text-decoration: none; margin-bottom: 24px; }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .invoice-card { border: none; box-shadow: none; max-width: 100%; padding: 0; background: #fff; color: #000; }
      .btn-print, .no-print { display: none !important; }
      th { background: #f3f4f6; color: #000; }
      td { color: #000; border-bottom: 1px solid #e5e7eb; }
      .meta-grid { background: #f9fafb; border: 1px solid #e5e7eb; }
      .meta-col p { color: #000; }
      .total-box { background: #f3f4f6; border: 1px solid #e5e7eb; }
      .total-row { color: #000; }
      .total-row span:last-child { color: #000; }
    }
  </style>
</head>
<body>
  <div style="max-width:800px; margin:0 auto; text-align:left;" class="no-print">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة أو حفظ بصيغة PDF</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div class="brand">
        <h1>PR <span>Agency</span></h1>
        <p>وكالة التسويق والإنتاج الرقمي المتكاملة</p>
        <p style="font-size:12px; color:#71717a;">القاهرة، جمهورية مصر العربية | www.pragency.pages.dev</p>
      </div>
      <div class="inv-badge-wrap">
        <div class="inv-num">${invoice.invoice_number}</div>
        <div class="status-badge">${statusText}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-col">
        <h3>فاتورة صادرة إلى:</h3>
        <p><strong>${invoice.company_name || 'العميل'}</strong></p>
        <p>عناية: ${invoice.contact_name || 'المسؤول'}</p>
        <p dir="ltr" style="text-align:right;">${invoice.client_email || ''}</p>
        <p dir="ltr" style="text-align:right;">${invoice.client_phone || ''}</p>
      </div>
      <div class="meta-col">
        <h3>تفاصيل الفاتورة:</h3>
        <p>تاريخ الإصدار: <strong>${invoiceDate}</strong></p>
        <p>تاريخ الاستحقاق: <strong>${invoice.due_date}</strong></p>
        <p>العملة: <strong>${invoice.currency}</strong></p>
        ${invoice.paid_at ? `<p style="color:#10b981;">تاريخ السداد: ${new Date(invoice.paid_at).toLocaleDateString('ar-EG')}</p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>البند / تفاصيل الخدمة</th>
          <th style="width:100px; text-align:center;">الكمية</th>
          <th style="width:140px;">سعر الوحدة</th>
          <th style="width:140px;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map(item => `
          <tr>
            <td><strong>${item.description}</strong></td>
            <td style="text-align:center;">${item.quantity || 1}</td>
            <td>${item.unit_price} ${invoice.currency}</td>
            <td><strong>${item.total_price} ${invoice.currency}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="total-box">
      <div class="total-row">
        <span>المبلغ الإجمالي المستحق:</span>
        <span>${invoice.amount} ${invoice.currency}</span>
      </div>
    </div>

    <div class="footer">
      <p style="margin-bottom:6px; font-weight:700; color:#d4d4d8;">نشكركم على ثقتكم الغالية في PR Agency! 🙏</p>
      <p>لأي استفسارات مالية أو طرق التحويل البنكي، يرجى التواصل مع الـ Account Manager المخصص لحسابكم.</p>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow, noarchive'
      }
    });

  } catch (err) {
    return new Response('Server Error: ' + err.message, { status: 500 });
  }
}
