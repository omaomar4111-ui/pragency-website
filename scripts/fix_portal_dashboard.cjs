const fs = require('fs');
let content = fs.readFileSync('portal-dashboard-2026.html', 'utf8');

const targetStr = `      } catch (err) {
        statusEl.textContent = 'تعذر الاتصال بالخادم';
        statusEl.style.color = '#ef4444';
      }
    }

    }

    async function loadClientStrategy() {`;

const targetCRLF = targetStr.replace(/\r?\n/g, '\r\n');
const targetLF = targetStr.replace(/\r?\n/g, '\n');

const replacementCRLF = targetCRLF.replace('\r\n\r\n    }', '');
const replacementLF = targetLF.replace('\n\n    }', '');

if (content.includes(targetCRLF)) {
  content = content.replace(targetCRLF, replacementCRLF);
  fs.writeFileSync('portal-dashboard-2026.html', content);
  console.log('Fixed portal dashboard with CRLF match!');
} else if (content.includes(targetLF)) {
  content = content.replace(targetLF, replacementLF);
  fs.writeFileSync('portal-dashboard-2026.html', content);
  console.log('Fixed portal dashboard with LF match!');
} else {
  console.log('Could not match target directly');
}
