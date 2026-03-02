/* ========================================
   GALERIE PAGE — galerie.js
   Lit les photos depuis Google Sheets
   ======================================== */

// ====== CONFIGURATION ======
const GALERIE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTlYIy5JD_JKizLr5n8MBmD7eeXz8ABlUfbpVvkuiDtTwZMgN_3pHealXhmuvnSUzfGGyET4Owu-mu9/pub?output=csv';

// ====== VARIABLES GLOBALES ======
let photos = [];
let filteredPhotos = [];
let currentLightboxIndex = 0;
let activeFilter = 'all';

// ====== MÉLANGE ALÉATOIRE (Fisher-Yates) ======
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ====== PARSER CSV ======
function parseCSV(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let c = 0; c < lines[i].length; c++) {
      const char = lines[i][c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

// ====== CONVERTIR LIEN GOOGLE DRIVE → LIEN IMAGE DIRECT ======
function convertDriveLink(url) {
  if (!url) return '';

  // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return 'https://lh3.googleusercontent.com/d/' + match[1];
  }

  // Format: https://drive.google.com/open?id=FILE_ID
  match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) {
    return 'https://lh3.googleusercontent.com/d/' + match[1];
  }

  // Déjà un lien direct ou autre format → retourner tel quel
  return url;
}

// ====== CHARGER LES PHOTOS DEPUIS GOOGLE SHEETS ======
async function fetchPhotosFromSheet() {
  try {
    const response = await fetch(GALERIE_CSV_URL);
    if (!response.ok) throw new Error('Erreur réseau');
    const csv = await response.text();
    const rows = parseCSV(csv);

    console.log('📸 Données brutes du Sheet:', rows);

    return rows
      .filter(row => row.titre && row.lien_photo)
      .map(row => ({
        src: convertDriveLink(row.lien_photo),
        title: row.titre,
        date: row.date || '',
        category: (row.categorie || 'autre').toLowerCase().trim()
      }));
  } catch (err) {
    console.error('❌ Erreur chargement galerie:', err);
    return [];
  }
}

// ====== EXTRAIRE LES CATÉGORIES UNIQUES ======
function getCategories(photos) {
  const cats = new Set();
  photos.forEach(p => cats.add(p.category));
  return Array.from(cats).sort();
}

// ====== LABELS POUR LES CATÉGORIES ======
const CATEGORY_LABELS = {
  'echecs': '♟️ Échecs',
  'volleyball': '🏐 Volleyball',
  'badminton': '🏸 Badminton',
  'futsal': '⚽ Futsal',
  'tournoi-inter': '🏆 Tournoi Inter',
  'vie-asso': '🎉 Vie Asso',
  'basketball': '🏀 Basketball',
  'football': '⚽ Football',
  'sorties': '🚶 Sorties',
  'evenements': '🎊 Événements'
};

function getCategoryLabel(cat) {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
}

// ====== GÉNÉRER LES FILTRES ======
function renderFilters() {
  const container = document.getElementById('galerie-filters');
  if (!container) return;

  const categories = getCategories(photos);

  let html = `<button class="filter-btn active" data-filter="all">🎯 Toutes</button>`;
  categories.forEach(cat => {
    html += `<button class="filter-btn" data-filter="${cat}">${getCategoryLabel(cat)}</button>`;
  });

  container.innerHTML = html;

  // Event listeners sur les filtres
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderGallery();
    });
  });
}

// ====== AFFICHER LA GALERIE ======
function renderGallery() {
  const grid = document.getElementById('galerie-grid');
  if (!grid) return;

  // Filtrer — mélange aléatoire uniquement sur "Toutes"
  filteredPhotos = activeFilter === 'all'
    ? shuffleArray([...photos])
    : photos.filter(p => p.category === activeFilter);

  if (filteredPhotos.length === 0) {
    grid.innerHTML = `
      <div class="galerie-empty">
        <p>📷 Aucune photo pour le moment dans cette catégorie.</p>
      </div>`;
    return;
  }

  let html = '';
  filteredPhotos.forEach((photo, index) => {
    html += `
      <div class="galerie-item" data-index="${index}">
        <img src="${photo.src}" alt="${photo.title}" loading="lazy" onerror="this.parentElement.style.display='none'">
        <div class="galerie-item-overlay">
          <span class="galerie-item-date">${photo.date}</span>
          <span class="galerie-item-zoom">🔍 Agrandir</span>
        </div>
      </div>`;
  });

  grid.innerHTML = html;

  // Clic → lightbox
  grid.querySelectorAll('.galerie-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      openLightbox(index);
    });
  });
}

// ====== LIGHTBOX ======
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');

function openLightbox(index) {
  if (!lightbox) return;
  currentLightboxIndex = index;
  updateLightbox();
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function updateLightbox() {
  if (!filteredPhotos[currentLightboxIndex]) return;
  const photo = filteredPhotos[currentLightboxIndex];
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.title;
  lightboxCaption.textContent = `${photo.title} — ${photo.date}`;
}

function nextPhoto() {
  currentLightboxIndex = (currentLightboxIndex + 1) % filteredPhotos.length;
  updateLightbox();
}

function prevPhoto() {
  currentLightboxIndex = (currentLightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
  updateLightbox();
}

// Event listeners lightbox
if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightboxNext) lightboxNext.addEventListener('click', nextPhoto);
if (lightboxPrev) lightboxPrev.addEventListener('click', prevPhoto);

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

document.addEventListener('keydown', (e) => {
  if (!lightbox || !lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') nextPhoto();
  if (e.key === 'ArrowLeft') prevPhoto();
});

// ====== INITIALISATION ======
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Chargement de la galerie depuis Google Sheets...');

  photos = await fetchPhotosFromSheet();
  console.log(`📸 ${photos.length} photos chargées`);

  renderFilters();
  renderGallery();
});
