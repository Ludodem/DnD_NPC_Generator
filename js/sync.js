/**
 * GistSync — manual cloud sync via GitHub Gist
 */
const GistSync = (function() {
  const TOKEN_KEY     = 'dnd_gist_token';
  const GIST_ID_KEY   = 'dnd_gist_id';
  const LAST_PUSH_KEY = 'dnd_gist_last_push';
  const LAST_PULL_KEY = 'dnd_gist_last_pull';
  const BACKUP_PREFIX = 'dnd_backup_';
  const MAX_BACKUPS   = 5;
  const FILENAME      = 'dnd-npc-generator.json';
  const API           = 'https://api.github.com';
  const DATA_KEYS     = ['dnd_scenario_library', 'dnd_session_stats'];

  function getToken()    { return localStorage.getItem(TOKEN_KEY) || ''; }
  function getGistId()   { return localStorage.getItem(GIST_ID_KEY) || ''; }
  function getLastPush() { return localStorage.getItem(LAST_PUSH_KEY) || ''; }
  function getLastPull() { return localStorage.getItem(LAST_PULL_KEY) || ''; }
  function isTokenSet()  { return !!getToken(); }
  function isGistSet()   { return !!getGistId(); }

  function hdrs(token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  function collectData() {
    const out = { version: 1, savedAt: new Date().toISOString() };
    DATA_KEYS.forEach(k => {
      try { out[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch { out[k] = null; }
    });
    return out;
  }

  function applyData(data) {
    DATA_KEYS.forEach(k => {
      if (data[k] != null) localStorage.setItem(k, JSON.stringify(data[k]));
    });
  }

  async function findGist(token) {
    for (let page = 1; page <= 5; page++) {
      const r = await fetch(`${API}/gists?per_page=100&page=${page}`, { headers: hdrs(token) });
      if (!r.ok) return null;
      const list = await r.json();
      if (list.length === 0) break;
      const found = list.find(g => g.files && g.files[FILENAME]);
      if (found) return found.id;
    }
    return null;
  }

  async function connect(token) {
    const rUser = await fetch(`${API}/user`, { headers: hdrs(token) });
    if (!rUser.ok) throw new Error('Token invalide');
    const user = await rUser.json();
    const gistId = await findGist(token);
    localStorage.setItem(TOKEN_KEY, token.trim());
    if (gistId) localStorage.setItem(GIST_ID_KEY, gistId);
    return { username: user.login, gistId };
  }

  async function push() {
    const token = getToken();
    if (!token) throw new Error('Aucun token configuré');
    const content = JSON.stringify(collectData(), null, 2);
    let gistId = getGistId();
    if (!gistId) {
      const r = await fetch(`${API}/gists`, {
        method: 'POST',
        headers: hdrs(token),
        body: JSON.stringify({
          description: 'DnD NPC Generator — sync',
          public: false,
          files: { [FILENAME]: { content } }
        })
      });
      if (!r.ok) throw new Error('Échec de création du Gist');
      gistId = (await r.json()).id;
      localStorage.setItem(GIST_ID_KEY, gistId);
    } else {
      const r = await fetch(`${API}/gists/${gistId}`, {
        method: 'PATCH',
        headers: hdrs(token),
        body: JSON.stringify({ files: { [FILENAME]: { content } } })
      });
      if (!r.ok) throw new Error('Échec de mise à jour du Gist');
    }
    localStorage.setItem(LAST_PUSH_KEY, new Date().toISOString());
  }

  async function pull() {
    const token = getToken();
    if (!token) throw new Error('Aucun token configuré');
    const gistId = getGistId();
    if (!gistId) throw new Error("Aucun Gist lié — effectuez d'abord un push");
    const r = await fetch(`${API}/gists/${gistId}`, { headers: hdrs(token) });
    if (!r.ok) throw new Error('Échec de récupération du Gist');
    const gist = await r.json();
    const content = gist.files[FILENAME]?.content;
    if (!content) throw new Error('Fichier introuvable dans le Gist');
    saveBackup();
    applyData(JSON.parse(content));
    localStorage.setItem(LAST_PULL_KEY, new Date().toISOString());
  }

  function saveBackup() {
    const key = BACKUP_PREFIX + new Date().toISOString().replace(/[:.]/g, '-');
    localStorage.setItem(key, JSON.stringify(collectData()));
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith(BACKUP_PREFIX))
      .sort().reverse();
    keys.slice(MAX_BACKUPS).forEach(k => localStorage.removeItem(k));
  }

  function listBackups() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(BACKUP_PREFIX))
      .sort().reverse()
      .map(k => {
        let data = {};
        try { data = JSON.parse(localStorage.getItem(k) || '{}'); } catch {}
        return {
          key: k,
          savedAt: data.savedAt || '',
          scenarios: (data['dnd_scenario_library'] || []).length,
          sessions:  (data['dnd_session_stats']    || []).length
        };
      });
  }

  function restoreBackup(key) {
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error('Backup introuvable');
    saveBackup();
    applyData(JSON.parse(raw));
  }

  function disconnect() {
    [TOKEN_KEY, GIST_ID_KEY, LAST_PUSH_KEY, LAST_PULL_KEY].forEach(k => localStorage.removeItem(k));
  }

  return {
    connect, push, pull, disconnect,
    saveBackup, listBackups, restoreBackup,
    getToken, getLastPush, getLastPull, isTokenSet, isGistSet
  };
})();
