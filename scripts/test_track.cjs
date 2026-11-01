const test = async () => {
  const payload = {
    session_id: 'sess_' + Date.now(),
    visitor_id: 'vis_' + Date.now(),
    event_type: 'page_view',
    event_data: { title: 'Test Title', referrer: '' },
    page_url: '/index.html'
  };

  try {
    const res = await fetch('https://pragency.pages.dev/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Track Status:', res.status);
    const body = await res.text();
    console.log('Track Response Body:', body);
  } catch (e) {
    console.error('Fetch error:', e);
  }
};

test();
