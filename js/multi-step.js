(function () {
  'use strict';

  var STORAGE_KEY = 'pr_form_draft_v1';

  function initMultiStep() {
    var form = document.getElementById('registerForm');
    if (!form || form.__multiStepInit) return;
    form.__multiStepInit = true;

    var nextBtn = document.getElementById('formNextBtn');
    var prevBtn = document.getElementById('formPrevBtn');
    var progressBar = form.querySelector('.form-progress-bar');
    var steps = form.querySelectorAll('.form-step');
    var progressSteps = form.querySelectorAll('.form-progress-step');

    var nameInput = document.getElementById('reg-name');
    var phoneInput = document.getElementById('reg-phone');
    var businessInput = document.getElementById('reg-business');
    var budgetInput = document.getElementById('reg-budget');
    var notesInput = document.getElementById('reg-notes');

    // ── Form Auto-Save via localStorage ──
    function restoreDraft() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var data = JSON.parse(raw);
        if (data.name && nameInput && !nameInput.value) nameInput.value = data.name;
        if (data.phone && phoneInput && !phoneInput.value) phoneInput.value = data.phone;
        if (data.business && businessInput && !businessInput.value) businessInput.value = data.business;
        if (data.budget && budgetInput && !budgetInput.value) budgetInput.value = data.budget;
        if (data.notes && notesInput && !notesInput.value) notesInput.value = data.notes;
      } catch (e) {}
    }

    function saveDraft() {
      try {
        var draft = {
          name: nameInput ? nameInput.value : '',
          phone: phoneInput ? phoneInput.value : '',
          business: businessInput ? businessInput.value : '',
          budget: budgetInput ? budgetInput.value : '',
          notes: notesInput ? notesInput.value : ''
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch (e) {}
    }

    form.addEventListener('input', saveDraft);
    form.addEventListener('change', saveDraft);

    form.addEventListener('submit', function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    });

    restoreDraft();

    function goToStep(stepNum) {
      steps.forEach(function(s) { s.classList.toggle('active', s.dataset.step == stepNum); });
      progressSteps.forEach(function(s) { s.classList.toggle('active', s.dataset.step <= stepNum); });
      if (progressBar) progressBar.setAttribute('data-step', stepNum);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var name = nameInput;
        var phone = phoneInput;
        var business = businessInput;
        if (!name.value.trim() || name.value.trim().length < 2) { name.focus(); name.classList.add('error'); setTimeout(function() { name.classList.remove('error'); }, 1500); return; }
        if (!phone.value.trim() || phone.value.trim().length < 8) { phone.focus(); phone.classList.add('error'); setTimeout(function() { phone.classList.remove('error'); }, 1500); return; }
        if (!business.value) { business.focus(); business.classList.add('error'); setTimeout(function() { business.classList.remove('error'); }, 1500); return; }
        goToStep(2);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        goToStep(1);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMultiStep);
  } else {
    initMultiStep();
  }
  setTimeout(initMultiStep, 500);
})();
