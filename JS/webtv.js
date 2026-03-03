'use strict';

// ================================
//   CONFIG — URL Google Sheet WEBTV
//   Remplace le GID par celui de ton onglet WEBTV
// ================================
const WEBTV_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTo3ZcOfNDj6pkOXbSD-vqxqI3chVLiM7SNa61Qvq_zl849Gy1VZEUcRqHJ07D1sCSHQ08hTOEFQI44/pub?output=csv';
// ⚠️ Remplace XXXXXX par le GID de ton onglet WEBTV (visible dans l'URL quand tu es sur cet onglet)

// ================================
//   FETCH CONFIG WEBTV
// ================================
async function fetchWebtvConfig() {
  try {
    const res = await fetch(WEBTV_SHEET_URL + '&t=' + Date.now()); // cache busting
    const csv = await res.text();
    return parseWebtvCSV(csv);
  } catch (err) {
    console.error('Erreur fetch WEBTV config :', err);
    return null;
  }
}

function parseWebtvCSV(csv) {
  const lines = csv.trim().split('\n');
  const config = {};

  lines.forEach(line => {
    // Format : clé,valeur
    const commaIdx = line.indexOf(',');
    if (commaIdx === -1) return;
    const key   = line.substring(0, commaIdx).trim().replace(/"/g, '');
    const value = line.substring(commaIdx + 1).trim().replace(/^"|"$/g, '');
    config[key] = value;
  });

  return config;
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
async function initWebtv() {
  showState('loading');

  const config = await fetchWebtvConfig();

  if (!config) {
    showState('offline');
    return;
  }

  const isLive = config['live_actif']?.toUpperCase() === 'TRUE';

  if (isLive && config['video_id']) {
    // Remplir titre / sous-titre
    document.getElementById('webtv-live-title').textContent =
      config['titre_event'] || 'Événement AS LFP';
    document.getElementById('webtv-live-subtitle').textContent =
      config['sous_titre'] || '';

    // Injecter le player YouTube
    const videoId = config['video_id'].trim();
    document.getElementById('youtube-player').src =
      `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

    // Injecter le chat YouTube
    document.getElementById('youtube-chat').src =
      `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${location.hostname}`;

    // Prochains événements sous le player
    buildNextEvents(config, 'next-events-list-live');

    showState('live');

  } else {
    // Prochains événements page offline
    buildNextEvents(config, 'next-events-list');
    showState('offline');
  }
}

// ================================
//   BANNIÈRE sur index.html
//   (ce code ne s'exécute que si
//    l'élément #live-banner existe)
// ================================
async function initLiveBanner() {
  const banner = document.getElementById('live-banner');
  if (!banner) return; // On n'est pas sur index.html

  try {
    const res    = await fetch(WEBTV_SHEET_URL + '&t=' + Date.now());
    const csv    = await res.text();
    const config = parseWebtvCSV(csv);

    if (config['live_actif']?.toUpperCase() === 'TRUE') {
      const titre = config['titre_event'] || '🔴 Live en cours';
      banner.querySelector('.live-banner-text').textContent = `🔴 LIVE — ${titre}`;
      banner.style.display = 'flex';
    }
  } catch (e) {
    // Pas de bannière si erreur réseau, ça reste caché
  }
}

// ================================
//   DÉMARRAGE
// ================================
document.addEventListener('DOMContentLoaded', () => {
  // Page webtv.html
  if (document.getElementById('webtv-loading')) {
    initWebtv();
  }

  // Bannière index.html
  initLiveBanner();
});
