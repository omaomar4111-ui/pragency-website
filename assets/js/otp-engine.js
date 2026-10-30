// OTP Verification V2 Engine
function initOtpVerification(containerId, onComplete) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const inputs = Array.from(container.querySelectorAll('.otp-box'));

  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val ? val[0] : '';

      if (e.target.value) {
        input.classList.add('filled');
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      } else {
        input.classList.remove('filled');
      }

      // Check if all filled
      const fullCode = inputs.map(i => i.value).join('');
      if (fullCode.length === inputs.length && typeof onComplete === 'function') {
        onComplete(fullCode);
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        inputs[index - 1].focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
      if (pasteData) {
        for (let i = 0; i < inputs.length; i++) {
          if (i < pasteData.length) {
            inputs[i].value = pasteData[i];
            inputs[i].classList.add('filled');
          }
        }
        const fullCode = inputs.map(i => i.value).join('');
        if (fullCode.length === inputs.length && typeof onComplete === 'function') {
          onComplete(fullCode);
        }
        const nextIdx = Math.min(pasteData.length, inputs.length - 1);
        inputs[nextIdx].focus();
      }
    });
  });
}
