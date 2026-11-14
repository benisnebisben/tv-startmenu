/*
 * Startmenuens felter. Ret kun her.
 *
 * type:
 *   "module"  TizenBrew-modul. Åbnes over TizenBrews interne kanal.
 *             `module` er modulets navn i TizenBrew (fx npm/@foxreis/tizentube
 *             eller gh/shayanline/OpenIPTV). Launcheren matcher fleksibelt,
 *             så repo-delen er nok hvis det fulde navn ændrer sig.
 *   "app"     Rigtig TV-app. Startes via service'et. `match` er ord, der skal
 *             findes i appens navn eller id (store/små bogstaver er lige gyldige);
 *             `id` kan sættes direkte, når vi har aflæst det fra TV'et.
 *
 * icon: på TV'et bruges appens ÆGTE ikon, når det findes (DR's eget ikon).
 *       `glyph` er en neutral reserve, der tegnes, når der ikke er et ægte ikon
 *       (fx for moduler, der ikke har et system-ikon). Ingen varemærker tegnes.
 */
window.STARTMENU_CONFIG = {
  // Vejr-widget (Open-Meteo). Sæt til null for at skjule den.
  weather: { name: 'Skødstrup', lat: 56.2639, lon: 10.2808 },

  tiles: [
    {
      key: 'youtube',
      type: 'module',
      module: 'npm/@foxreis/tizentube',
      name: 'YouTube',
      glow: '#ff2b45',
      bg: ['#2a0d0d', '#0f0f0f'],
      glyph: '<svg width="118" height="118" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="5" fill="#ff2b45"/><path d="M10 8.5l6 3.5-6 3.5z" fill="#fff"/></svg>'
    },
    {
      key: 'dr',
      type: 'app',
      match: ['dr '],
      id: null,
      name: 'DR',
      glow: '#2f6bff',
      bg: ['#0a1830', '#0a0f1a'],
      glyph: '<svg width="110" height="110" viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="3.5" fill="none" stroke="#5b8dff" stroke-width="1.6"/><circle cx="12" cy="12" r="3.3" fill="none" stroke="#5b8dff" stroke-width="1.6"/><path d="M12 2.5v3M12 18.5v3" stroke="#5b8dff" stroke-width="1.6" stroke-linecap="round"/></svg>'
    },
    {
      key: 'iptv',
      type: 'app',
      match: ['openiptv', 'open iptv', 'shayan'],
      id: null,
      name: 'OpenIPTV',
      glow: '#2fd39a',
      bg: ['#102a22', '#0a1713'],
      glyph: '<svg width="112" height="112" viewBox="0 0 24 24"><rect x="2.5" y="4.5" width="19" height="12.5" rx="2.5" fill="none" stroke="#2fd39a" stroke-width="1.6"/><path d="M8.5 20.5h7M12 17v3.5" stroke="#2fd39a" stroke-width="1.6" stroke-linecap="round"/><path d="M10.5 8.5l4 2.3-4 2.3z" fill="#2fd39a"/></svg>'
    },
    {
      key: 'kilder',
      type: 'app',
      match: ['source', 'kilde', 'hdmi', 'extsource'],
      id: null,
      name: 'Kilder',
      glow: '#c7ccd6',
      bg: ['#20232a', '#121418'],
      glyph: '<svg width="112" height="112" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2.5" fill="none" stroke="#c7ccd6" stroke-width="1.7"/><path d="M8 11h2v2H8zM14 11h2v2h-2z" fill="#c7ccd6"/></svg>'
    }
  ]
};
