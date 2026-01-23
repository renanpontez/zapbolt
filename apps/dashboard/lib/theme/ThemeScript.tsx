export function ThemeScript() {
  const script = `
    (function() {
      const STORAGE_KEY = 'zapbolt-theme';
      const stored = localStorage.getItem(STORAGE_KEY);
      let theme = 'system';
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        theme = stored;
      }
      const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      document.documentElement.classList.add(resolved);
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
