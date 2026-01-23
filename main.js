/* Cancer Imaging Lab - interactions */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const header = $('#header');
  const nav = $('#site-nav');
  const toggle = $('.nav-toggle');
  const navLinks = $$('.nav-link');
  const sections = ['home','about','research','team','contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  // -------------------------
  // Mobile menu
  // -------------------------
  function closeMenu(){
    if (!nav) return;
    nav.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  }
  function openMenu(){
    if (!nav) return;
    nav.classList.add('is-open');
    toggle?.setAttribute('aria-expanded', 'true');
  }
  toggle?.addEventListener('click', () => {
    const isOpen = nav.classList.contains('is-open');
    (isOpen ? closeMenu : openMenu)();
  });
  document.addEventListener('click', (e) => {
    if (!nav?.classList.contains('is-open')) return;
    const within = nav.contains(e.target) || toggle.contains(e.target);
    if (!within) closeMenu();
  }, { passive:true });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // -------------------------
  // Smooth scroll with header offset
  // -------------------------
  function headerOffset(){
    return header ? header.getBoundingClientRect().height : 0;
  }
  function scrollToId(id){
    const el = document.getElementById(id);
    if (!el) return;
    const y = window.scrollY + el.getBoundingClientRect().top - headerOffset() + 1;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      const id = href.slice(1);
      e.preventDefault();
      closeMenu();
      // update active immediately to prevent flicker
      setActive(id);
      scrollToId(id);
    });
  });

  // -------------------------
  // Scrollspy (no flicker)
  // -------------------------
  let ticking = false;
  let lastActive = 'home';

  function setActive(sectionId){
    lastActive = sectionId;
    navLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      const is = href === `#${sectionId}`;
      a.classList.toggle('is-active', is);
      if (is) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  // Stable scrollspy: choose the last section whose top is above the header line.
  // This avoids "fluctuating" between two items around boundaries.
  function computeActiveSection(){
    const y = window.scrollY + headerOffset() + 20;
    if (window.scrollY < 10) return 'home';

    let current = 'home';
    for (const s of sections){
      if (s.offsetTop <= y) current = s.id;
      else break;
    }
    return current;
  }

  function onScroll(){
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      const next = computeActiveSection();
      if (next && next !== lastActive) setActive(next);
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll, { passive:true });
  setActive('home');
  onScroll();

  // -------------------------
  // Tabs
  // -------------------------
  const tabs = $$('[data-tabs]');
  tabs.forEach(tabset => {
    const triggers = $$('[data-tab]', tabset);
    const panels = $$('[data-panel]', tabset);
    const activate = (name) => {
      triggers.forEach(t => {
        const on = t.dataset.tab === name;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      panels.forEach(p => {
        const show = p.dataset.panel === name;
        p.classList.toggle('is-active', show);
        p.hidden = !show;
        p.setAttribute('aria-hidden', show ? 'false' : 'true');
      });
    };
    triggers.forEach(t => t.addEventListener('click', () => activate(t.dataset.tab)));
    activate(triggers[0]?.dataset.tab || 'tech');
  });
// -------------------------
// Accordions (smooth height) — supports nested accordions
// -------------------------
function openPanel(btn, panel){
  btn.setAttribute('aria-expanded', 'true');
  panel.hidden = false;

  // from 0 -> scrollHeight
  panel.style.height = '0px';
  void panel.offsetHeight;
  panel.style.height = panel.scrollHeight + 'px';

  panel.addEventListener('transitionend', () => {
    if (btn.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
  }, { once:true });
}

function closePanel(btn, panel){
  btn.setAttribute('aria-expanded', 'false');

  // auto -> fixed height -> 0
  panel.style.height = panel.scrollHeight + 'px';
  void panel.offsetHeight;
  panel.style.height = '0px';

  panel.addEventListener('transitionend', () => {
    panel.hidden = true;
    panel.style.height = '';
  }, { once:true });
}

// Initialize all accordion panels as collapsed (without breaking nested)
$$('.accordion-trigger').forEach(btn => {
  const id = btn.getAttribute('aria-controls');
  const panel = id ? document.getElementById(id) : null;
  if (!panel) return;

  // Only set defaults if not explicitly opened in HTML
  if (btn.getAttribute('aria-expanded') !== 'true'){
    btn.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    panel.style.height = '';
  }
});

// Event delegation: works for nested accordions
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.accordion-trigger');
  if (!btn) return;

  const id = btn.getAttribute('aria-controls');
  const panel = id ? document.getElementById(id) : null;
  if (!panel) return;

  // Find the accordion group that owns this trigger
  const acc = btn.closest('.accordion');
  if (!acc) return;

  const isOpen = btn.getAttribute('aria-expanded') === 'true';

  // Close other panels ONLY inside the same accordion group (not parent/child groups)
  $$('.accordion-trigger', acc).forEach(otherBtn => {
    if (otherBtn === btn) return;
    const otherId = otherBtn.getAttribute('aria-controls');
    const otherPanel = otherId ? document.getElementById(otherId) : null;
    if (!otherPanel) return;

    // Do NOT close triggers that belong to a nested accordion inside this accordion
    // (i.e., only close siblings under same accordion level)
    const otherAcc = otherBtn.closest('.accordion');
    if (otherAcc !== acc) return;

    if (otherBtn.getAttribute('aria-expanded') === 'true'){
      closePanel(otherBtn, otherPanel);
    }
  });

  // Toggle clicked one
  isOpen ? closePanel(btn, panel) : openPanel(btn, panel);
}, { passive:true });

  // -------------------------
  // Reveal on scroll
  // -------------------------
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // -------------------------
  // Contact form: mailto convenience
  // -------------------------
  const form = $('.contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const email = (fd.get('email') || '').toString().trim();
    const message = (fd.get('message') || '').toString().trim();

    const subject = encodeURIComponent(`Cancer Imaging Lab enquiry${name ? ' — ' + name : ''}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`
    );

    // Use the provided lab email
    window.location.href = `mailto:sneha.singh@iitmandi.ac.in?subject=${subject}&body=${body}`;
  });
})();
