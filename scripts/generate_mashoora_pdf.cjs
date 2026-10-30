const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlFile = path.resolve('mashoora_presentation.html');
const pdfFile = path.resolve('Mashoora_Legal_Strategy_Pitch_2026.pdf');

console.log('Compiling HTML to PDF using Chrome Headless...');
console.log('HTML File:', htmlFile);
console.log('Output PDF:', pdfFile);

const cmd = `& '${chromePath}' --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf='${pdfFile}' --no-pdf-header-footer 'file:///${htmlFile.replace(/\\/g, '/')}'`;

try {
  execSync(`powershell -Command "${cmd}"`, { stdio: 'inherit' });
  if (fs.existsSync(pdfFile)) {
    const stats = fs.statSync(pdfFile);
    console.log('SUCCESS! PDF generated successfully.');
    console.log('PDF Size:', (stats.size / 1024).toFixed(1), 'KB');

    // Also copy to artifacts directory for user preview & download
    const artifactDir = 'C:\\Users\\DELL\\.gemini\antigravity\\brain\\fd959096-0c91-4379-a8f3-1452ce8eec36';
    if (fs.existsSync(artifactDir)) {
      const artifactPdf = path.join(artifactDir, 'Mashoora_Legal_Strategy_Pitch_2026.pdf');
      fs.copyFileSync(pdfFile, artifactPdf);
      console.log('Copied to artifact dir:', artifactPdf);
    }
  } else {
    console.error('PDF file was not created.');
  }
} catch (e) {
  console.error('Error generating PDF:', e.message);
}
