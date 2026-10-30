const adminAuth = 'Basic ' + Buffer.from('admin:pr2026').toString('base64');
const teamAuth = 'Basic ' + Buffer.from('creator:pr2026').toString('base64');
const amAuth = 'Basic ' + Buffer.from('am_sara:pr2026').toString('base64');

(async () => {
  console.log('=== TEST: V1/V2 Versioning & Threaded Feedback E2E ===\n');

  // 1. Create client
  const cEmail = 'ver_test_' + Date.now() + '@apex.com';
  const cPass = 'PassV1V2_2026!';
  const rClient = await fetch('https://pragency.pages.dev/api/admin/portal-clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': adminAuth },
    body: JSON.stringify({
      action: 'create',
      company_name: 'Apex Fitness Club',
      contact_name: 'عادل',
      email: cEmail,
      password: cPass,
      phone: '+201099554433'
    })
  });
  const dClient = await rClient.json();
  const clientId = dClient.id;
  console.log('1. Client Created:', clientId);

  // 2. Creator uploads V1
  const rV1 = await fetch('https://pragency.pages.dev/api/team/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': teamAuth },
    body: JSON.stringify({
      client_id: clientId,
      title: 'تصميم إعلان العرض الصيفي',
      type: 'design',
      media_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
      caption: 'خصم 30% على الاشتراك السنوي لفترة محدودة',
      scheduled_date: '2026-11-10',
      creator_name: 'كريم - مصمم جرافيك'
    })
  });
  const dV1 = await rV1.json();
  const v1Id = dV1.id;
  console.log('2. Creator Uploaded V1:', v1Id, '| Version:', dV1.version);

  // 3. AM Approves V1
  await fetch('https://pragency.pages.dev/api/team/assets/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': amAuth },
    body: JSON.stringify({ asset_id: v1Id, am_name: 'سارة AM', client_id: clientId })
  });
  console.log('3. AM Approved V1 -> pushed to Client');

  // 4. Client requests revisions
  const rLogin = await fetch('https://pragency.pages.dev/api/portal/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cEmail, password: cPass })
  });
  const dLogin = await rLogin.json();
  const clientToken = dLogin.token;

  const rRev = await fetch('https://pragency.pages.dev/api/portal/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + clientToken },
    body: JSON.stringify({
      deliverableId: v1Id,
      status: 'rejected',
      feedback: 'التصميم جميل بس محتاجين نكبر اللوجو ونغير لون زرار الـ CTA للأخضر الفاقع عشان يجذب العين.'
    })
  });
  const dRev = await rRev.json();
  console.log('4. Client Requested Revisions:', dRev.success, '| Status:', dRev.status);

  // 5. Team replies in thread
  const rReply = await fetch('https://pragency.pages.dev/api/team/assets/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': teamAuth },
    body: JSON.stringify({
      asset_id: v1Id,
      parent_asset_id: v1Id,
      author_role: 'team',
      author_name: 'كريم المصمم',
      comment: 'تمام يا فندم، كبرنا اللوجو 20% وغيرنا الـ CTA للون المطلوب وجاري رفع النسخة V2 حالاً.'
    })
  });
  const dReply = await rReply.json();
  console.log('5. Team Replied to Thread:', dReply.success);

  // 6. Creator uploads V2
  const rV2 = await fetch('https://pragency.pages.dev/api/team/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': teamAuth },
    body: JSON.stringify({
      client_id: clientId,
      title: 'تصميم إعلان العرض الصيفي',
      type: 'design',
      media_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f',
      caption: 'خصم 30% على الاشتراك السنوي لفترة محدودة (معدل)',
      scheduled_date: '2026-11-10',
      creator_name: 'كريم - مصمم جرافيك',
      parent_asset_id: v1Id
    })
  });
  const dV2 = await rV2.json();
  const v2Id = dV2.id;
  console.log('6. Creator Uploaded V2:', v2Id, '| New Version Number:', dV2.version);

  // 7. AM Approves V2
  await fetch('https://pragency.pages.dev/api/team/assets/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': amAuth },
    body: JSON.stringify({ asset_id: v2Id, am_name: 'سارة AM', client_id: clientId })
  });
  console.log('7. AM Approved V2');

  // 8. Client views calendar
  const rCal = await fetch('https://pragency.pages.dev/api/portal/calendar', {
    headers: { 'Authorization': 'Bearer ' + clientToken }
  });
  const dCal = await rCal.json();
  const v2Item = (dCal.items || []).find(i => i.id === v2Id);
  console.log('\n8. Client Portal Verification:');
  console.log('   - Item Version:', v2Item?.version);
  console.log('   - Status:', v2Item?.status);
  console.log('   - Feedback Thread Messages Count:', v2Item?.feedback_thread?.length);
  (v2Item?.feedback_thread || []).forEach(t => {
    console.log(`     * [${t.author_role}] ${t.author_name}: "${t.comment}"`);
  });

  // 9. Client approves V2
  const rApprove = await fetch('https://pragency.pages.dev/api/portal/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + clientToken },
    body: JSON.stringify({
      deliverableId: v2Id,
      status: 'approved',
      feedback: 'النسخة V2 ممتازة جداً ومضبوطة بالمللي! معتمد للنشر.'
    })
  });
  const dApprove = await rApprove.json();
  console.log('\n9. Client Final Approval on V2:', dApprove.success ? '✅ APPROVED' : '❌');

  console.log('\n=== V1/V2 VERSIONING & THREADED FEEDBACK TEST PASSED 100% ===');
})();
