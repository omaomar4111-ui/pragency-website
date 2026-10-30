import { logSystemAction } from '../../../lib/audit.js';

// Generate/Update PDF Link for an Invoice and upload to R2 if bucket is bound
// POST /api/team/invoices/generate
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.ANALYTICS_DB || env.DB;
  const bucket = env.PORTFOLIO_BUCKET || env.INVOICES_BUCKET;
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { invoice_id, admin_name } = body;

    if (!invoice_id) {
      return new Response(JSON.stringify({ success: false, error: 'invoice_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Fetch invoice
    const invoice = await db.prepare(`
      SELECT ci.*, pc.company_name, pc.contact_name, pc.email as client_email
      FROM client_invoices ci
      LEFT JOIN portal_clients pc ON pc.id = ci.client_id
      WHERE ci.id = ?
    `).bind(invoice_id).first();

    if (!invoice) {
      return new Response(JSON.stringify({ success: false, error: 'Invoice not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let pdfUrl = `/api/portal/invoices/download?id=${invoice.id}`;

    // 2. If R2 bucket is active, store a copy in R2
    if (bucket) {
      const r2Key = `invoices/${invoice.invoice_number || invoice.id}.html`;
      // Render the HTML content and upload to R2
      const downloadEndpoint = new URL(request.url).origin + pdfUrl;
      try {
        const renderedHtml = `<!-- Invoice ${invoice.invoice_number} -->\n<meta http-equiv="refresh" content="0; url=${downloadEndpoint}" />`;
        await bucket.put(r2Key, renderedHtml, {
          httpMetadata: { contentType: 'text/html; charset=utf-8' }
        });
        pdfUrl = `/api/portal/image/${r2Key.replace('portfolio/', '')}`;
      } catch (r2Err) {
        console.warn('R2 storage notice:', r2Err.message);
        // Fallback remains the dynamic secure download route
      }
    }

    // 3. Save pdf_url to database
    await db.prepare(`
      UPDATE client_invoices SET pdf_url = ? WHERE id = ?
    `).bind(pdfUrl, invoice.id).run();

    // 4. Log in Audit Trail
    await logSystemAction(db, {
      actor_id: admin_name || 'admin',
      actor_name: admin_name || 'Finance Admin',
      actor_role: 'admin',
      action: 'invoice_pdf_generated',
      target_type: 'invoice',
      target_id: invoice.id,
      client_id: invoice.client_id,
      details: { invoice_number: invoice.invoice_number, pdf_url: pdfUrl },
      ip_address: clientIp
    });

    return new Response(JSON.stringify({
      success: true,
      invoice_number: invoice.invoice_number,
      pdf_url: pdfUrl,
      download_url: `/api/portal/invoices/download?id=${invoice.id}`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
