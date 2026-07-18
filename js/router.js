function initRouter() {
  const links = document.querySelectorAll('a[data-nav]');
  links.forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        e.preventDefault();
        navigateTo(href);
      }
    });
  });
}

function navigateTo(path) {
  window.location.href = path;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
