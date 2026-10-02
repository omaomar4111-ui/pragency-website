document.addEventListener('DOMContentLoaded', async () => {
  const faqContainer = document.getElementById('faqAccordion');
  if (!faqContainer) return;

  try {
    const res = await fetch('/api/faqs');
    const json = await res.json();
    
    if (json.success && json.data && json.data.length > 0) {
      const faqs = json.data;
      
      // Inject Schema.org
      const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      };
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);

      // Render HTML
      faqContainer.innerHTML = faqs.map((f, i) => `
        <div class="faq-item reveal" style="transition-delay: ${i * 0.1}s">
          <div class="faq-question">
            <h3>${window.i18n?.get() === "en" && f.question_en ? f.question_en : f.question}</h3>
            <div class="faq-icon"></div>
          </div>
          <div class="faq-answer">
            <p>${window.i18n?.get() === "en" && f.answer_en ? f.answer_en : f.answer}</p>
          </div>
        </div>
      `).join('');

      // Add accordion logic
      const items = faqContainer.querySelectorAll('.faq-item');
      items.forEach(item => {
        const q = item.querySelector('.faq-question');
        q.addEventListener('click', () => {
          const isActive = item.classList.contains('active');
          // Close all
          items.forEach(i => {
            i.classList.remove('active');
            i.querySelector('.faq-answer').style.maxHeight = null;
          });
          // Open clicked if it was not active
          if (!isActive) {
            item.classList.add('active');
            const ans = item.querySelector('.faq-answer');
            ans.style.maxHeight = ans.scrollHeight + "px";
          }
        });
      });
      
      // Open the first one by default
      if (items.length > 0) {
        items[0].classList.add('active');
        const ans = items[0].querySelector('.faq-answer');
        ans.style.maxHeight = ans.scrollHeight + "px";
      }

    } else {
      faqContainer.innerHTML = '';
      document.getElementById('faq').style.display = 'none';
    }
  } catch (err) {
    console.error('Error loading FAQs:', err);
    faqContainer.innerHTML = '';
    if (document.getElementById('faq')) document.getElementById('faq').style.display = 'none';
  }
});

// Re-render on language change
document.addEventListener('i18n:changed', () => {
  if (typeof window.renderFaqs === 'function') window.renderFaqs();
});
