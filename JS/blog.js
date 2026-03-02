/* ================================================
   blog.js — ASLFP
   Fichier : JS/blog.js
   ================================================ */

'use strict';

/* ──────────────────────────────────────────
   1. UTILITAIRES
   ────────────────────────────────────────── */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/* ──────────────────────────────────────────
   2. NAVBAR — SCROLL EFFECT
   ────────────────────────────────────────── */
const initNavbarScroll = () => {
  const header = document.querySelector('.header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('header-scrolled', window.scrollY > 50);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
};

/* ──────────────────────────────────────────
   3. FILTRES DES ARTICLES (page articles.html)
   ────────────────────────────────────────── */
const initFilters = () => {
  const filterBtns = $$('.filter-btn');
  const cards      = $$('.article-card');

  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {

      filterBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const category = card.dataset.category;

        if (filter === 'all' || category === filter) {
          card.classList.remove('is-hidden');
          card.style.animation = 'none';
          card.offsetHeight;
          card.style.animation = '';
        } else {
          card.classList.add('is-hidden');
        }
      });

      const visibleCards = cards.filter(c => !c.classList.contains('is-hidden'));
      const noResult     = $('#noResult');
      if (noResult) {
        noResult.hidden = visibleCards.length > 0;
      }
    });
  });
};

/* ──────────────────────────────────────────
   4. RECHERCHE EN TEMPS RÉEL
   ────────────────────────────────────────── */
const initSearch = () => {
  const searchInput = $('#searchInput');
  const cards       = $$('.article-card');

  if (!searchInput || !cards.length) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();

    cards.forEach(card => {
      const title    = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
      const excerpt  = card.querySelector('.card-excerpt')?.textContent.toLowerCase() || '';
      const category = card.dataset.category?.toLowerCase() || '';

      const match = title.includes(query) || excerpt.includes(query) || category.includes(query);
      card.classList.toggle('is-hidden', !match);
    });

    const visibleCards = cards.filter(c => !c.classList.contains('is-hidden'));
    const noResult     = $('#noResult');
    if (noResult) {
      noResult.hidden = visibleCards.length > 0;
    }
  });
};

/* ──────────────────────────────────────────
   5. BARRE DE PROGRESSION DE LECTURE
   ────────────────────────────────────────── */
const initReadingProgress = () => {
  const bar = $('#readingProgress');
  if (!bar) return;

  const onScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${Math.min(progress, 100)}%`;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
};

/* ──────────────────────────────────────────
   6. SOMMAIRE ACTIF AU SCROLL (TOC)
   ────────────────────────────────────────── */
const initToc = () => {
  const tocLinks = $$('.toc-list a');
  if (!tocLinks.length) return;

  const sections = tocLinks
    .map(link => {
      const id = link.getAttribute('href')?.replace('#', '');
      return id ? document.getElementById(id) : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          tocLinks.forEach(l => l.classList.remove('toc-active'));
          const activeLink = tocLinks.find(
            l => l.getAttribute('href') === `#${entry.target.id}`
          );
          if (activeLink) activeLink.classList.add('toc-active');
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  );

  sections.forEach(section => observer.observe(section));
};

/* ──────────────────────────────────────────
   7. SCROLL SMOOTH POUR LES ANCRES INTERNES
   ────────────────────────────────────────── */
const initSmoothScroll = () => {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navbarHeight = document.querySelector('.header')?.offsetHeight || 80;
      const offsetTop    = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;

      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    });
  });
};

/* ──────────────────────────────────────────
   8. BOUTON RETOUR EN HAUT
   ────────────────────────────────────────── */
const initScrollTopBtn = () => {
  const btn = $('#scrollTopBtn');
  if (!btn) return;

  const onScroll = () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

/* ──────────────────────────────────────────
   9. PARTAGE SOCIAL
   ────────────────────────────────────────── */
const initShare = () => {
  const pageUrl   = encodeURIComponent(window.location.href);
  const pageTitle = encodeURIComponent(document.title);

  const fbBtn = $('#shareFacebook');
  if (fbBtn) {
    fbBtn.href   = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
    fbBtn.target = '_blank';
    fbBtn.rel    = 'noopener noreferrer';
  }

  const twBtn = $('#shareTwitter');
  if (twBtn) {
    twBtn.href   = `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`;
    twBtn.target = '_blank';
    twBtn.rel    = 'noopener noreferrer';
  }

  const waBtn = $('#shareWhatsapp');
  if (waBtn) {
    waBtn.href   = `https://wa.me/?text=${pageTitle}%20${pageUrl}`;
    waBtn.target = '_blank';
    waBtn.rel    = 'noopener noreferrer';
  }

  const copyBtn = $('#shareCopy');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copié !';
        copyBtn.style.background = '#22c55e';

        setTimeout(() => {
          copyBtn.innerHTML = original;
          copyBtn.style.background = '';
        }, 2000);
      } catch {
        const input = document.createElement('input');
        input.value = window.location.href;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
    });
  }
};

/* ──────────────────────────────────────────
   10. ANIMATIONS AU SCROLL
   ────────────────────────────────────────── */
const initScrollAnimations = () => {
  const elements = $$('[data-animate]');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  elements.forEach(el => observer.observe(el));
};

/* ──────────────────────────────────────────
   11. NEWSLETTER — VALIDATION SIMPLE
   ────────────────────────────────────────── */
const initNewsletter = () => {
  const forms = $$('.newsletter-form');

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('.btn-newsletter');

      if (!input || !input.value.trim()) {
        input?.focus();
        return;
      }

      const originalText = btn.textContent;
      btn.textContent    = 'Inscription en cours...';
      btn.disabled       = true;

      setTimeout(() => {
        btn.textContent      = '✓ Inscrit avec succès !';
        btn.style.background = '#22c55e';
        input.value          = '';

        setTimeout(() => {
          btn.textContent      = originalText;
          btn.style.background = '';
          btn.disabled         = false;
        }, 3000);
      }, 1200);
    });
  });
};

/* ──────────────────────────────────────────
   12. TEMPS DE LECTURE ESTIMÉ
   ────────────────────────────────────────── */
const initReadingTime = () => {
  const articleBody   = $('.article-body');
  const readingTimeEl = $('#readingTime');

  if (!articleBody || !readingTimeEl) return;

  const text      = articleBody.textContent || '';
  const wordCount = text.trim().split(/\s+/).length;
  const minutes   = Math.ceil(wordCount / 200);

  readingTimeEl.textContent = `${minutes} min de lecture`;
};

/* ──────────────────────────────────────────
   13. INITIALISATION GLOBALE
   ────────────────────────────────────────── */
const init = () => {
  initNavbarScroll();
  initFilters();
  initSearch();
  initReadingProgress();
  initToc();
  initSmoothScroll();
  initScrollTopBtn();
  initShare();
  initScrollAnimations();
  initNewsletter();
  initReadingTime();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
