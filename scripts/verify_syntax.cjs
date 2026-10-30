const fs = require('fs');

const files = [
  "functions/lib/audit.js",
  "functions/api/team/_middleware.js",
  "functions/api/team/assets.js",
  "functions/api/team/assets/approve.js",
  "functions/api/admin/audit.js",
  "functions/api/admin/strategies.js",
  "functions/api/admin/sales/leads.js",
  "functions/api/admin/sales/followup.js",
  "functions/api/portal/workflow.js"
];

let hasError = false;

files.forEach(f => {
  if (!fs.existsSync(f)) {
    console.error("MISSING FILE:", f);
    hasError = true;
    return;
  }
  const content = fs.readFileSync(f, "utf8");
  // Verify imports point to existing relative files
  const importMatches = [...content.matchAll(/from\s+['"](.*?)['"]/g)];
  importMatches.forEach(m => {
    const impPath = m[1];
    if (impPath.startsWith('.')) {
      const dir = f.slice(0, f.lastIndexOf('/'));
      const resolved = dir + '/' + impPath;
      if (!fs.existsSync(resolved)) {
        console.error(`BROKEN IMPORT in ${f}: ${impPath} (looked for ${resolved})`);
        hasError = true;
      }
    }
  });

  // Verify async function syntax by wrapping in an async wrapper
  try {
    const cleaned = content
      .replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, "")
      .replace(/export\s+/g, "");
    new Function(`return (async () => { ${cleaned} });`)();
    console.log("PASS:", f);
  } catch (e) {
    console.error("SYNTAX ERROR in:", f, e.message);
    hasError = true;
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log("\nALL FILES VERIFIED 100% OK! ZERO ERRORS.");
}
