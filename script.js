const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const experienceCards = document.querySelectorAll('.timeline article');
experienceCards.forEach((card) => {
  card.addEventListener('click', () => {
    card.classList.toggle('active');
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      card.classList.toggle('active');
    }
  });
});
styles.css
