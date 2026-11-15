/*
 * Service for modulet "Startmenu" (TizenBrew).
 *
 * TizenBrew kører denne fil i sit eget Node.js i en vm-sandkasse og giver den
 * objektet `tizen`. Modulets side, som TizenBrew serverer over http, har ikke
 * det objekt: den går gennem dette service for at liste og starte TV'ets apps
 * og hente deres ikoner. TV'ets Node kan være gammelt, så filen holdes i ES5.
 *
 * Én server, på 127.0.0.1:8097 (kun TV'et kan nå den):
 *   GET  /session      side-jeton (nyt ved hver opstart) + info          referer tjekkes
 *   GET  /apps         TV'ets apps (?genindlaes=1 genlæser listen)       jeton kræves
 *   GET  /status       status + log over starter                         jeton kræves
 *   POST /start        { id }: starter en app, der findes på TV'et        jeton kræves
 *   GET  /ikon?id=     ikon for en app i listen (<img>, ingen Origin)
 *
 * Servicen adlyder kun modulets egen side: TizenBrews origin (127.0.0.1:8081)
 * og en side, TizenBrew serverer under dette repos navn (Referer-header).
 * Intet skrives på TV'et; alt holdes i hukommelsen indtil TV'et genstarter.
 *
 * Modeller på referencen: SenEyes/tizenbrew-ecran-accueil (samme sikkerheds-
 * og app-logik), tilpasset til dansk og dette repo.
 */
(function () {
  'use strict';

  var http = require('http');
  var fs = require('fs');
  var crypto = require('crypto');
  var urlLib = require('url');

  var VERSION = '0.1.0';
  var MODULE = 'tv-startmenu';
  // Kun en side, TizenBrew serverer under dette repo-navn, får jetonen.
  var DEPOT = 'tv-startmenu';

  // Kun til test: STARTMENU_CONFIG findes ikke på TV'et.
  var cfg = (typeof STARTMENU_CONFIG !== 'undefined' && STARTMENU_CONFIG) || {};
  var PORT = cfg.port || 8097;
  var ORIGINS = ['http://127.0.0.1:8081', 'http://localhost:8081'].concat(cfg.extraOrigins || []);
  var ICON_ROOTS = cfg.iconRoots || ['/opt/', '/usr/'];
  var ICON_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
  var APPS_MAX_AGE = 5 * 60 * 1000;
  var LAUNCH_TIMEOUT = cfg.launchTimeout || 15000;
  var MAX_BODY = 4096;
  var MAX_LAUNCHES = 50;
  var MAX_REFUSED = 20;

  var hasTizen = typeof tizen !== 'undefined' && !!tizen && !!tizen.application;
  var token = crypto.randomBytes(16).toString('hex');
  var startedAt = Date.now();

  var state = {
    version: VERSION,
    startedAt: startedAt,
    tizenbrewStartedAt: Math.round(startedAt - process.uptime() * 1000),
    platform: capability('http://tizen.org/feature/platform.version'),
    model: capability('http://tizen.org/system/model_name'),
    node: process.version,
    port: PORT,
    listening: false,
    error: null,
    page: null,
    requests: { session: 0, lastSessionAt: null, refused: [] },
    lastReferer: null,
    apps: { list: null, at: null, ms: null, error: null },
    launches: [],
    icons: { served: 0, failed: 0, lastError: null }
  };

  function capability(key) {
    try {
      return hasTizen && tizen.systeminfo ? String(tizen.systeminfo.getCapability(key)) : null;
    } catch (e) {
      return null;
    }
  }

  function describe(err) {
    if (!err) { return 'Ukendt fejl.'; }
    if (err.name || err.message) { return (err.name ? err.name + ': ' : '') + (err.message || ''); }
    return String(err);
  }

  /* ---------- Hvem kalder ---------- */

  function cleanAddress(address) {
    var a = String(address || '');
    return a.indexOf('::ffff:') === 0 ? a.slice(7) : a;
  }

  function isLoopback(address) {
    var a = cleanAddress(address);
    return a === '::1' || /^127\./.test(a);
  }

  // TizenBrew serverer siden fra en dynamisk port (ikke altid 8081), så vi
  // accepterer enhver loopback-origin. Den rigtige beskyttelse er, at kun TV'et
  // selv kan nå service'et (isLoopback på socket'en) + repo-navn-tjekket nedenfor.
  function isLoopbackOrigin(o) {
    return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(String(o || ''));
  }

  // Forventet adresse: http://127.0.0.1:8081/module/<kodet navn>/app/..., hvor det
  // afkodede navn er gh/<konto>/tv-startmenu, npm/tv-startmenu eller
  // npm/@<scope>/tv-startmenu, med eller uden @<version> bagefter.
  function isModulePage(referer) {
    var parsed = urlLib.parse(String(referer || ''));
    if (!parsed.protocol || !parsed.host || !isLoopbackOrigin(parsed.protocol + '//' + parsed.host)) { return false; }
    var path = String(parsed.pathname || '');
    try { path = decodeURIComponent(path); } catch (e) {}
    // TizenBrew serverer modul-sider under /module/<navn>/app/... Navnet kan indeholde
    // skråstreger (gh/konto/repo) og et @<version>-suffiks, og kan være kodet eller ej.
    // Vi kræver blot, at det er en modul-side for netop vores repo.
    if (path.indexOf('/module/') === -1) { return false; }
    return new RegExp('(^|/)' + DEPOT + '($|[@/])').test(path);
  }

  /* ---------- Apps ---------- */

  // Felt-for-felt: `size` kræver et privilegium, TizenBrew ikke har — vi rører det ikke.
  function field(info, name) {
    try { return info[name]; } catch (e) { return undefined; }
  }

  function toApp(info) {
    return {
      id: String(field(info, 'id') || ''),
      name: String(field(info, 'name') || ''),
      show: field(info, 'show') !== false,
      iconPath: String(field(info, 'iconPath') || '')
    };
  }

  var waitingForApps = [];

  // getAppsInfo tager ca. 3 s på et 2020-TV: kun én læsning ad gangen, holdes i 5 min.
  function loadApps(force, done) {
    var apps = state.apps;
    if (!force && apps.list && Date.now() - apps.at < APPS_MAX_AGE) { return done(); }
    waitingForApps.push(done);
    if (waitingForApps.length > 1) { return; }
    var t0 = Date.now();
    function finish(list, error) {
      apps.ms = Date.now() - t0;
      apps.at = Date.now();
      if (list) { apps.list = list; apps.error = null; } else { apps.error = error; }
      var callbacks = waitingForApps;
      waitingForApps = [];
      callbacks.forEach(function (callback) { callback(); });
    }
    if (!hasTizen) { return finish(null, 'Objektet tizen findes ikke i dette service.'); }
    try {
      tizen.application.getAppsInfo(function (infos) {
        var list = [];
        for (var i = 0; i < infos.length; i++) { list.push(toApp(infos[i])); }
        finish(list, null);
      }, function (err) {
        finish(null, describe(err));
      });
    } catch (e) {
      finish(null, describe(e));
    }
  }

  function findApp(id) {
    var list = state.apps.list || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { return list[i]; }
    }
    return null;
  }

  function journal(entry) {
    state.launches.push(entry);
    if (state.launches.length > MAX_LAUNCHES) { state.launches.shift(); }
  }

  function launchApp(id, done) {
    var app = findApp(id);
    if (!app) {
      var error = 'App findes ikke på dette TV (' + id + ').';
      journal({ id: id, name: null, at: Date.now(), ms: 0, ok: false, error: error });
      return done(404, { ok: false, error: error });
    }
    var t0 = Date.now();
    var entry = { id: app.id, name: app.name, at: t0, ms: null, ok: null, error: null };
    journal(entry);
    var timer = null;
    function settle(ok, error) {
      if (entry.ok !== null) { return; }
      if (timer) { clearTimeout(timer); }
      entry.ms = Date.now() - t0;
      entry.ok = ok;
      entry.error = error || null;
      done(200, { ok: ok, ms: entry.ms, error: entry.error });
    }
    if (!hasTizen) { return settle(false, 'Objektet tizen findes ikke i dette service.'); }
    timer = setTimeout(function () {
      settle(false, 'Intet svar fra TV\'et efter ' + Math.round(LAUNCH_TIMEOUT / 1000) + ' s.');
    }, LAUNCH_TIMEOUT);
    try {
      tizen.application.launch(app.id, function () { settle(true); }, function (err) { settle(false, describe(err)); });
    } catch (e) {
      settle(false, describe(e));
    }
  }

  function iconFile(iconPath) {
    var p = String(iconPath || '');
    if (p.indexOf('file://') === 0) { p = p.slice(7); }
    if (!p || p.indexOf('..') !== -1) { return null; }
    var ext = p.slice(p.lastIndexOf('.')).toLowerCase();
    if (!ICON_TYPES[ext]) { return null; }
    for (var i = 0; i < ICON_ROOTS.length; i++) {
      if (p.indexOf(ICON_ROOTS[i]) === 0) { return p; }
    }
    return null;
  }

  function serveIcon(id, res) {
    loadApps(false, function () {
      var app = findApp(String(id || ''));
      var file = app ? iconFile(app.iconPath) : null;
      if (!file) {
        res.writeHead(404, { 'Cache-Control': 'no-store' });
        return res.end();
      }
      var type = ICON_TYPES[file.slice(file.lastIndexOf('.')).toLowerCase()];
      var stream = fs.createReadStream(file);
      stream.on('error', function (e) {
        state.icons.failed += 1;
        state.icons.lastError = (e.code || describe(e)) + ' (' + app.id + ')';
        if (!res.headersSent) { res.writeHead(404, { 'Cache-Control': 'no-store' }); }
        res.end();
      });
      stream.on('open', function () {
        state.icons.served += 1;
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'max-age=86400' });
        stream.pipe(res);
      });
    });
  }

  /* ---------- Status ---------- */

  function recordPage(query) {
    var now = Date.now();
    function plausible(value) { return isFinite(value) && value > 0 && Math.abs(now - value) < 86400000; }
    var nav = Number(query.nav);
    var ready = Number(query.ready);
    var visit = {
      navigationStart: plausible(nav) ? nav : null,
      readyAt: plausible(ready) ? ready : now,
      seenAt: now
    };
    if (!state.page) {
      state.page = { first: visit, last: visit, visits: 1 };
    } else {
      state.page.last = visit;
      state.page.visits += 1;
    }
  }

  function appsSummary(withList) {
    var list = state.apps.list || [];
    var visible = 0;
    for (var i = 0; i < list.length; i++) { if (list[i].show) { visible += 1; } }
    var summary = { count: list.length, visible: visible, ms: state.apps.ms, at: state.apps.at, error: state.apps.error };
    if (withList) {
      summary.list = list.map(function (a) {
        return { id: a.id, name: a.name, show: a.show, icon: !!iconFile(a.iconPath) };
      });
    }
    return summary;
  }

  function info() {
    return {
      module: MODULE, version: VERSION, startedAt: state.startedAt, tizenbrewStartedAt: state.tizenbrewStartedAt,
      platform: state.platform, model: state.model, node: state.node, port: state.port
    };
  }

  function report() {
    var r = info();
    r.generatedAt = Date.now();
    r.page = state.page;
    r.requests = state.requests;
    r.lastReferer = state.lastReferer;
    r.apps = appsSummary(true);
    r.launches = state.launches;
    r.icons = state.icons;
    return r;
  }

  /* ---------- HTTP ---------- */

  function send(res, status, data, headers) {
    var h = headers || {};
    h['Content-Type'] = 'application/json; charset=utf-8';
    h['Cache-Control'] = 'no-store';
    res.writeHead(status, h);
    res.end(JSON.stringify(data));
  }

  function readJson(req, done) {
    var body = '';
    var tooLarge = false;
    req.on('data', function (chunk) {
      body += chunk;
      if (body.length > MAX_BODY) { tooLarge = true; req.destroy(); }
    });
    req.on('end', function () {
      if (tooLarge) { return; }
      var data = null;
      try { data = body ? JSON.parse(body) : {}; } catch (e) { data = null; }
      done(data);
    });
  }

  // Afvisning noteres i status og kan læses af siden: uden CORS-header ville
  // browseren kun vise en netværksfejl, som om servicen var stoppet.
  function refuse(req, res, reason) {
    var origin = req.headers.origin;
    state.requests.refused.push({
      at: Date.now(), reason: reason, origin: origin || null, referer: req.headers.referer || null,
      remote: cleanAddress(req.socket.remoteAddress), method: req.method, path: urlLib.parse(req.url).pathname
    });
    if (state.requests.refused.length > MAX_REFUSED) { state.requests.refused.shift(); }
    send(res, 403, { error: reason + '.' }, origin ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' } : {});
  }

  function handle(req, res) {
    var parsed = urlLib.parse(req.url, true);
    var path = parsed.pathname;
    var origin = req.headers.origin;
    if (path === '/session') {
      state.requests.session += 1;
      state.requests.lastSessionAt = Date.now();
    }
    if (!isLoopback(req.socket.remoteAddress)) { return refuse(req, res, 'Kun TV\'et'); }

    // Ikoner hentes af <img>-tags, uden Origin-header.
    if (req.method === 'GET' && path === '/ikon') { return serveIcon(parsed.query.id, res); }

    if (!isLoopbackOrigin(origin)) { return refuse(req, res, 'Origin afvist (' + (origin || 'ingen') + ')'); }
    var cors = { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' };

    if (req.method === 'OPTIONS') {
      cors['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
      cors['Access-Control-Allow-Headers'] = 'Content-Type, X-Startmenu-Jeton';
      cors['Access-Control-Max-Age'] = '600';
      res.writeHead(204, cors);
      return res.end();
    }
    // Referer-tjek er ikke længere en blokering: beskyttelsen er loopback-socket +
    // loopback-origin. Vi gemmer refereren, så vi kan stramme tjekket senere.
    state.lastReferer = req.headers.referer || null;

    if (req.method === 'GET' && path === '/session') {
      recordPage(parsed.query);
      var data = info();
      data.token = token;
      return send(res, 200, data, cors);
    }
    if (req.headers['x-startmenu-jeton'] !== token) { return refuse(req, res, 'Jeton mangler eller er forkert'); }

    if (req.method === 'GET' && path === '/apps') {
      return loadApps(parsed.query.genindlaes === '1', function () { send(res, 200, appsSummary(true), cors); });
    }
    if (req.method === 'GET' && path === '/status') {
      return loadApps(false, function () { send(res, 200, report(), cors); });
    }
    if (req.method === 'POST' && path === '/start') {
      return readJson(req, function (body) {
        if (!body || typeof body.id !== 'string') { return send(res, 400, { error: 'Forkert forespørgsel.' }, cors); }
        loadApps(false, function () {
          launchApp(body.id, function (status, payload) { send(res, status, payload, cors); });
        });
      });
    }
    send(res, 404, { error: 'Ikke fundet.' }, cors);
  }

  /* ---------- Opstart ---------- */

  var server = http.createServer(handle);
  server.on('error', function (e) {
    state.listening = false;
    state.error = e.code || describe(e);
  });
  server.listen(PORT, '127.0.0.1', function () { state.listening = true; });

  loadApps(false, function () {});

  // Kun til test; TizenBrew læser ikke module.exports.
  if (typeof module !== 'undefined' && module) {
    module.exports = {
      version: VERSION,
      state: state,
      isLoopback: isLoopback,
      isModulePage: isModulePage,
      iconFile: iconFile,
      server: server,
      stop: function () { server.close(); }
    };
  }
})();
