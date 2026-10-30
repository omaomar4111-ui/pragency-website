const fs = require('fs');

let js = fs.readFileSync('js/contact-form.js', 'utf8');

// Update payload construction to capture project_name and challenge (message)
if (!js.includes('project_name:')) {
  js = js.replace(
    /name:\s*\(formData\.get\('name'\)\s*\|\|\s*''\)\.toString\(\)\.trim\(\),/,
    `name:         (formData.get('name')     || '').toString().trim(),
        project_name: (formData.get('project_name') || '').toString().trim(),`
  );
}

fs.writeFileSync('js/contact-form.js', js, 'utf8');
console.log('Updated js/contact-form.js');
