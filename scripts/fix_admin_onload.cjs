const fs = require('fs');
let code = fs.readFileSync('js/admin.js', 'utf8');

const target = `    window.onload = () => {
      loadAvailableProjects();
      loadDailyTasksWorkspace();
      loadGlobalExecutiveKPIs();
    };`;

const replacement = `    window.onload = () => {
      const token = localStorage.getItem('agency_admin_token') || localStorage.getItem('admin_jwt');
      if (token) {
        loadAvailableProjects();
        loadDailyTasksWorkspace();
        loadGlobalExecutiveKPIs();
      }
    };`;

const isCRLF = code.includes('\r\n');
const targetNorm = isCRLF ? target.replace(/\n/g, '\r\n') : target.replace(/\r\n/g, '\n');
const repNorm = isCRLF ? replacement.replace(/\n/g, '\r\n') : replacement.replace(/\r\n/g, '\n');

if (code.includes(targetNorm)) {
  code = code.replace(targetNorm, repNorm);
  fs.writeFileSync('js/admin.js', code, 'utf8');
  console.log('Successfully updated window.onload in js/admin.js!');
} else {
  console.log('Target not found in js/admin.js');
}
