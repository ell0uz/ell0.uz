(() => {
  try {
    const savedTheme = window.localStorage.getItem('site-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.dataset.theme = savedTheme;
    }
  } catch (error) {
    console.warn('Could not read the saved theme preference.', error);
  }
})();
