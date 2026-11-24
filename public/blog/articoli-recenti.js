(() => {
  const grid = document.querySelector('#articoli-recenti');
  if (!grid) return;

  function publicationDate(value) {
    return /^\d{4}-\d{2}-\d{2}(?:T.+)?$/.test(value ?? '') ? Date.parse(value) : NaN;
  }

  async function readPage(path) {
    const response = await fetch(path, {redirect: 'error', cache: 'no-cache'});
    if (!response.ok || !response.headers.get('Content-Type')?.includes('text/html')) {
      throw new Error('Pagina del diario non disponibile');
    }
    // Keep fetched markup inert until a selected card is placed on the page.
    const template = document.createElement('template');
    template.innerHTML = await response.text();
    return template.content;
  }

  function articleDate(page) {
    for (const element of page.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const schema = JSON.parse(element.textContent);
        const entries = Array.isArray(schema) ? schema : schema['@graph'] ?? [schema];
        for (const entry of entries) {
          const date = publicationDate(entry.datePublished);
          if (Number.isFinite(date)) return date;
        }
      } catch {
        // A page may still have a visible publication date.
      }
    }
    return publicationDate(page.querySelector('main .byline time[datetime]')?.dateTime);
  }

  async function readCard(card) {
    const url = card.querySelector('.blogbody h3 a')?.getAttribute('href');
    if (!url || !/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(url)) return null;
    let date = publicationDate(card.dataset.published ?? card.querySelector('time[datetime]')?.dateTime);
    if (!Number.isFinite(date)) {
      try {
        date = articleDate(await readPage(url));
      } catch {
        return null;
      }
    }
    return Number.isFinite(date) ? {card,url,date,priority:Number(card.dataset.homePriority) || 0} : null;
  }

  async function update() {
    try {
      const blog = await readPage('/blog/');
      const candidates = await Promise.all([...blog.querySelectorAll('main .bloggrid > .blogcard')].map(readCard));
      const links = new Set();
      const latest = candidates.filter(Boolean)
        .sort((a,b) => b.date-a.date || b.priority-a.priority)
        .filter(({url}) => {
          if (links.has(url)) return false;
          links.add(url);
          return true;
        }).slice(0,3);
      const current = [...grid.querySelectorAll('.blogbody h3 a')].map(link => link.getAttribute('href'));
      if (latest.length === 3 && !latest.every(({url},i) => url === current[i])) {
        const renderCards = () => grid.replaceChildren(...latest.map(({card}) => document.importNode(card,true)));
        if (!grid.contains(document.activeElement)) {
          renderCards();
          return;
        }
        const afterFocusLeaves = event => {
          if (grid.contains(event.relatedTarget)) return;
          grid.removeEventListener('focusout',afterFocusLeaves);
          renderCards();
        };
        grid.addEventListener('focusout',afterFocusLeaves);
      }
    } catch {
      // Leave the three pre-rendered cards visible if the blog fails to load.
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      void update();
    }, {rootMargin:'400px 0px'});
    observer.observe(grid);
  } else {
    void update();
  }
})();
