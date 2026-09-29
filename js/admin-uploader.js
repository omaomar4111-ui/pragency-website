(function () {
  'use strict';

  window.ImageUploader = {
    create: function (options) {
      var opts = options || {};
      var wrapper = document.createElement('div');
      wrapper.className = 'img-uploader';
      wrapper.innerHTML = 
        '<div class="img-uploader-drop" tabindex="0">' +
          '<div class="img-uploader-icon">📷</div>' +
          '<div class="img-uploader-text">اسحب صورة هنا أو اضغط للاختيار</div>' +
          '<div class="img-uploader-hint">JPG / PNG / WebP — بحد أقصى 2MB</div>' +
          '<input type="file" accept="image/*" hidden>' +
        '</div>' +
        '<div class="img-uploader-preview" style="display:none"></div>' +
        '<div class="img-uploader-status"></div>';

      var drop = wrapper.querySelector('.img-uploader-drop');
      var input = wrapper.querySelector('input[type="file"]');
      var preview = wrapper.querySelector('.img-uploader-preview');
      var status = wrapper.querySelector('.img-uploader-status');

      var currentUrl = opts.value || '';

      function showPreview(url) {
        currentUrl = url;
        if (opts.onChange) opts.onChange(url);
        if (!url) {
          drop.style.display = '';
          preview.style.display = 'none';
          preview.innerHTML = '';
          return;
        }
        drop.style.display = 'none';
        preview.style.display = '';
        preview.innerHTML = 
          '<img src="' + url + '" alt="preview"/>' +
          '<button type="button" class="img-uploader-remove" title="إزالة">✕</button>';
        preview.querySelector('.img-uploader-remove').onclick = function () {
          showPreview('');
        };
      }

      function setStatus(msg, type) {
        status.textContent = msg || '';
        status.className = 'img-uploader-status' + (type ? ' ' + type : '');
      }

      async function uploadFile(file) {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
          setStatus('الصورة أكبر من 2MB', 'error');
          return;
        }
        setStatus('جاري الرفع...', 'loading');

        // Local preview
        var localUrl = URL.createObjectURL(file);
        preview.style.display = '';
        preview.innerHTML = '<img src="' + localUrl + '" alt="preview"/>';
        drop.style.display = 'none';

        try {
          var fd = new FormData();
          fd.append('file', file);
          fd.append('folder', opts.folder || 'general');

          var res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: (typeof cmsAuth === 'function') ? cmsAuth() : { 'Authorization': 'Basic ' + btoa(':pr2026') },
            body: fd
          });
          var data = await res.json();
          if (!data.success) throw new Error(data.error || 'Upload failed');

          showPreview(data.url);
          setStatus('✓ تم الرفع بنجاح', 'success');
        } catch (err) {
          setStatus('فشل الرفع: ' + err.message, 'error');
          drop.style.display = '';
          preview.style.display = 'none';
        }
      }

      drop.addEventListener('click', function () { input.click(); });
      drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag'); });
      drop.addEventListener('dragleave', function () { drop.classList.remove('drag'); });
      drop.addEventListener('drop', function (e) {
        e.preventDefault();
        drop.classList.remove('drag');
        if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
      });
      input.addEventListener('change', function () {
        if (input.files.length) uploadFile(input.files[0]);
      });

      if (currentUrl) showPreview(currentUrl);

      wrapper.getValue = function () { return currentUrl; };
      wrapper.setValue = function (url) { showPreview(url); };

      return wrapper;
    }
  };
})();
