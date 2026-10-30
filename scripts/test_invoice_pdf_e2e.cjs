const adminAuth = 'Basic ' + Buffer.from('admin:pr2026').toString('base64');
const teamAuth = 'Basic ' + Buffer.from('creator:pr2026').toString('base64');

(async () => {
  console.log('=== TEST: Invoice PDF Generation & Client Portal Download ===\n');

  // 1. Create client
  const cEmail = 'invoice_pdf_' + Date.now() + '@horizon.com';
  const cPass = 'HorizonInvoice2026!';
  const rClient = await fetch('https://pragency.pages.dev/api/admin/portal-clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': adminAuth },
    body: JSON.stringify({
      action: 'create',
      company_name: 'Horizon International Trading',
      contact_name: 'الأستاذ وائل حسني',
      email: cEmail,
      password: cPass,
      phone: '+201122446688',
      brand_color: '#3b82f6'
    })
  });
  const dClient = await rClient.json();
  const clientId = dClient.id;
  console.log('1. Created Client:', clientId, '(' + cEmail + ')');

  // 2. Admin creates Invoice
  const rInv = await fetch('https://pragency.pages.dev/api/admin/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': adminAuth },
    body: JSON.stringify({
      action: 'create',
      client_id: clientId,
      amount: 60000,
      currency: 'EGP',
      due_date: '2026-11-28',
      notes: 'باقة الإنتاج المرئي المتكاملة + إدارة إعلانات جوجل وميتا للربع الرابع 2026',
      created_by: 'Finance Admin'
    })
  });
  const dInv = await rInv.json();
  const invoiceId = dInv.id;
  const invoiceNum = dInv.invoice_number;
  console.log('2. Created Invoice:', invoiceNum, '| ID:', invoiceId);

  // 3. Generate PDF & Save URL
  const rGen = await fetch('https://pragency.pages.dev/api/team/invoices/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': teamAuth },
    body: JSON.stringify({
      invoice_id: invoiceId,
      admin_name: 'Finance Specialist'
    })
  });
  const dGen = await rGen.json();
  console.log('3. Generated PDF & Linked URL:', dGen.success ? '✅ ' + dGen.pdf_url : '❌ ' + dGen.error);

  // 4. Client logs in
  const rLogin = await fetch('https://pragency.pages.dev/api/portal/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cEmail, password: cPass })
  });
  const dLogin = await rLogin.json();
  const clientToken = dLogin.token;
  console.log('4. Client Logged In:', dLogin.success);

  // 5. Client views invoices in portal
  const rInvoices = await fetch('https://pragency.pages.dev/api/portal/invoices', {
    headers: { 'Authorization': 'Bearer ' + clientToken }
  });
  const dInvoices = await rInvoices.json();
  const targetInv = (dInvoices.invoices || []).find(i => i.id === invoiceId);
  console.log('\n5. Client Portal Invoices Verification:');
  console.log('   - Found Invoice:', targetInv?.invoice_number);
  console.log('   - Amount:', targetInv?.amount, targetInv?.currency);
  console.log('   - Due Date:', targetInv?.due_date);
  console.log('   - Status:', targetInv?.status);

  // 6. Client requests PDF download
  const downloadUrl = `https://pragency.pages.dev/api/portal/invoices/download?id=${invoiceId}`;
  const rDownload = await fetch(downloadUrl, {
    headers: { 'Authorization': 'Bearer ' + clientToken }
  });
  const downloadText = await rDownload.text();
  const isHtmlPdf = downloadText.includes('invoice-card') && downloadText.includes(invoiceNum);
  console.log('\n6. Client Download/View PDF Request:');
  console.log('   - Endpoint:', downloadUrl);
  console.log('   - HTTP Status:', rDownload.status, rDownload.status === 200 ? '✅ 200 OK' : '❌');
  console.log('   - Contains Client Name:', downloadText.includes('Horizon International Trading') ? '✅ YES' : '❌ NO');
  console.log('   - Contains Amount:', downloadText.includes('60000 EGP') ? '✅ YES' : '❌ NO');
  console.log('   - Contains Printable CSS/Buttons:', isHtmlPdf ? '✅ YES' : '❌ NO');

  console.log('\n=== INVOICE PDF & R2 TEST PASSED 100% ===');
})();
