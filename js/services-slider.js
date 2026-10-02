(function () {
  'use strict';
  var slider = document.getElementById('servicesSlider');
  if (!slider) return;
  var prev = document.querySelector('.slider-prev');
  var next = document.querySelector('.slider-next');
  var dots = document.getElementById('sliderDots');
  var cards = slider.querySelectorAll('.slider-card');

  if (dots) {
    cards.forEach(function (_, i) {
      var dot = document.createElement('span');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', function () { scrollToCard(i); });
      dots.appendChild(dot);
    });
  }

  function scrollToCard(i) {
    var card = cards[i];
    if (card) {
      const containerRect = slider.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scrollPos = cardRect.left - containerRect.left + slider.scrollLeft;
      slider.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }

  if (prev) prev.addEventListener('click', function () { slider.scrollBy({ left: 340, behavior: 'smooth' }); });
  if (next) next.addEventListener('click', function () { slider.scrollBy({ left: -340, behavior: 'smooth' }); });

  slider.addEventListener('scroll', function () {
    var i = Math.round(Math.abs(slider.scrollLeft) / 340);
    document.querySelectorAll('.slider-dot').forEach(function (d, idx) {
      d.classList.toggle('active', idx === i);
    });
  });
})();
