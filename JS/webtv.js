'use strict';

// ================================
//   CONFIG — URL Apps Script WEBTV
// ================================
const WEBTV_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzCDFxBjAtSdyDlWHGpJ-5JyPjoBkl89gNx8Og3cBZvjx25QgZJTX3SUn6K6aPq8l2Q/exec';

// ================================
//   FETCH CONFIG WEBTV
// ================================
async function fetchWebtvConfig() {
  try {
    const res = await fetch(WEBTV_SHEET_URL);
    const config = await res.json();
    return config;
  } catch (err) {
    console.error('Erreur fetch WEBTV config :', err);
    return null;
  }
}

// ================================
//   CONSTRUIRE LES PROCHAINS EVENTS
// ================================
function buildNextEvents(config, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const events = [];
  for (let i = 1; i <= 5; i++) {
    const date  = config[`event${i}_date`];
    const titre = config[`event${i}_titre`];
    if (date && titre) {
      events.push({ date, titre });
    }
  }

  if (events.length === 0) {
    container.innerHTML = '<p class="no-events">Aucun événement programmé pour le moment.</p>';
    return;
  }

  container.innerHTML = events.map(ev => `
    <div class="next-event-card">
      <span class="next-event-date">📅 ${ev.date}</span>
      <span class="next-event-titre">${ev.titre}</span>
    </div>
  `).join('');
}

// ================================
//   AFFICHER L'ÉTAT CORRECT
// ================================
function showState(state) {
  document.getElementById('webtv-loading').style.display = 'none';
  document.getElementById('webtv-offline').style.display  = 'none';
  document.getElementById('webtv-live').style.display     = 'none';

  if (state === 'loading') {
    document.getElementById('webtv-loading').style.display = 'flex';
  } else if (state === 'offline') {
    document.getElementById('webtv-offline').style.display = 'flex';
  } else if (state === 'live') {
    document.getElementById('webtv-live').style.display = 'block';
  }
}

// ================================
//   INIT WEBTV
// ================================
let currentWebtvState = null;

async function initWebtv() {
  if (currentWebtvState === null) {
    showState('loading');
  }

  const config = await fetchWebtvConfig();

  if (!config) {
    currentWebtvState = 'offline';
    showState('offline');
    return;
  }

  const isLive = String(config['live_actif']).toUpperCase() === 'TRUE';
  const newState = (isLive && config['video_id']) ? 'live' : 'offline';

  if (newState === currentWebtvState) return;

  currentWebtvState = newState;

  if (newState === 'live') {
    document.getElementById('webtv-live-title').textContent =
      config['titre_event'] || 'Événement AS LFP';
    document.getElementById('webtv-live-subtitle').textContent =
      config['sous_titre'] || '';

    const videoId = String(config['video_id']).trim();
    document.getElementById('youtube-player').src =
      `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    document.getElementById('youtube-chat').src =
      `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${location.hostname}`;

    buildNextEvents(config, 'next-events-list-live');
    showState('live');

  } else {
    document.getElementById('youtube-player').src = '';
    document.getElementById('youtube-chat').src = '';
    buildNextEvents(config, 'next-events-list');
    showState('offline');
  }
}

// ================================
//   BANNIÈRE sur index.html
// ================================
async function initLiveBanner() {
  const banner = document.getElementById('live-banner');
  const liveNavItem = document.getElementById('live-nav-item');
  const liveNavItemMobile = document.getElementById('live-nav-item-mobile');

  try {
    const res    = await fetch(WEBTV_SHEET_URL);
    const config = await res.json();

    if (String(config['live_actif']).toUpperCase() === 'TRUE') {
      if (banner) {
        const titre = config['titre_event'] || '🔴 Live en cours';
        banner.querySelector('.live-banner-text').textContent = `🔴 LIVE — ${titre}`;
        banner.style.display = 'flex';
      }
      if (liveNavItem) liveNavItem.style.display = 'block';
      if (liveNavItemMobile) liveNavItemMobile.style.display = 'block';
    }
  } catch (e) {
    // Pas de live visible si erreur réseau
  }
}

// ================================
//   DÉMARRAGE
// ================================
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('webtv-loading')) {
    initWebtv();
    setInterval(initWebtv, 15000);
  }

  initLiveBanner();
});
