// Sistema de traducción compartido para todas las páginas
const STORAGE_KEY = 'huskytours-language';

function getStoredLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return (saved === 'es' || saved === 'en') ? saved : 'es';
}

function setPageLanguage(lang = null) {
  const targetLang = lang || getStoredLanguage();
  document.documentElement.lang = targetLang;
  localStorage.setItem(STORAGE_KEY, targetLang);
  
  // Traducir todos los elementos con data-es y data-en
  document.querySelectorAll('[data-es][data-en]').forEach(el => {
    el.textContent = el.dataset[targetLang];
  });
  
  // Actualizar botones de idioma
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === targetLang);
  });
}

// Setupear al cargar
document.addEventListener('DOMContentLoaded', () => {
  setPageLanguage();
  
  // Escuchar cambios de idioma
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setPageLanguage(btn.dataset.lang);
    });
  });
});
