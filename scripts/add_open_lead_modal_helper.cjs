const fs = require('fs');
let code = fs.readFileSync('sales-crm-2026.html', 'utf8');

const target = `    function closeModal(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('open', 'active');
      el.style.display = 'none';
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      document.body.style.overflow = '';
    }`;

const replacement = `    function closeModal(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('open', 'active');
      el.style.display = 'none';
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      document.body.style.overflow = '';
    }

    function openAddLeadModal() {
      openModal('addLeadModal');
    }`;

const isCRLF = code.includes('\r\n');
const targetNorm = isCRLF ? target.replace(/\n/g, '\r\n') : target.replace(/\r\n/g, '\n');
const repNorm = isCRLF ? replacement.replace(/\n/g, '\r\n') : replacement.replace(/\r\n/g, '\n');

if (code.includes(targetNorm)) {
  code = code.replace(targetNorm, repNorm);
  fs.writeFileSync('sales-crm-2026.html', code, 'utf8');
  console.log('Successfully added openAddLeadModal to sales-crm-2026.html!');
} else {
  console.log('Target not found in sales-crm-2026.html');
}
