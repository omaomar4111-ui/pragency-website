(function () {
  'use strict';
  function initMultiStep() {
    var form = document.getElementById('registerForm');
    if (!form || form.__multiStepInit) return;
    form.__multiStepInit = true;
    var nextBtn = document.getElementById('formNextBtn');
    var prevBtn = document.getElementById('formPrevBtn');
    var progressBar = form.querySelector('.form-progress-bar');
    var steps = form.querySelectorAll('.form-step');
    var progressSteps = form.querySelectorAll('.form-progress-step');
    function goToStep(stepNum) {
      steps.forEach(function(s) { s.classList.toggle('active', s.dataset.step == stepNum); });
      progressSteps.forEach(function(s) { s.classList.toggle('active', s.dataset.step <= stepNum); });
      if (progressBar) progressBar.setAttribute('data-step', stepNum);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var name = document.getElementById('reg-name');
        var phone = document.getElementById('reg-phone');
        var business = document.getElementById('reg-business');
        if (!name.value.trim() || name.value.trim().length < 2) { name.focus(); name.classList.add('error'); setTimeout(function() { name.classList.remove('error'); }, 1500); return; }
        if (!phone.value.trim() || phone.value.trim().length < 8) { phone.focus(); phone.classList.add('error'); setTimeout(function() { phone.classList.remove('error'); }, 1500); return; }
        if (!business.value) { business.focus(); business.classList.add('error'); setTimeout(function() { business.classList.remove('error'); }, 1500); return; }
        goToStep(2);
      });
    }
    if (prevBtn) { prevBtn.addEventListener('click', function(e) { e.preventDefault(); goToStep(1); }); }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initMultiStep); } else { initMultiStep(); }
  setTimeout(initMultiStep, 500);
})();
