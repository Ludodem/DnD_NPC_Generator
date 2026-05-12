/**
 * Session Stats Module
 * Storage and helpers for live session stat tracking
 */

const SessionStats = (function() {
  const STORAGE_KEY = 'dnd_session_stats';
  const MAX_SESSIONS = 200;

  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function nowIso() { return new Date().toISOString(); }
  function today() { return new Date().toISOString().slice(0, 10); }

  function getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  function saveAll(sessions) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      return true;
    } catch { return false; }
  }

  function getById(id) {
    return getAll().find(s => s.id === id) || null;
  }

  function save(session) {
    const all = getAll();
    session.updatedAt = nowIso();
    const idx = all.findIndex(s => s.id === session.id);
    if (idx !== -1) {
      all[idx] = session;
    } else {
      if (all.length >= MAX_SESSIONS) return { success: false, error: `Max ${MAX_SESSIONS} sessions reached.` };
      if (!session.createdAt) session.createdAt = nowIso();
      all.unshift(session);
    }
    return { success: saveAll(all) };
  }

  function remove(id) {
    const all = getAll();
    const filtered = all.filter(s => s.id !== id);
    if (filtered.length === all.length) return false;
    return saveAll(filtered);
  }

  function count() { return getAll().length; }

  function createSession() {
    return {
      id: generateId(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      label: '',
      date: today(),
      scenarioId: null,
      scenarioTitle: null,
      currentRound: 1,
      pcs: []
    };
  }

  function createPc(name) {
    return {
      id: generateId(),
      name: name || '',
      dmgDealt: 0,
      dmgTaken: 0,
      healed: 0,
      kills: 0,
      ko: 0,
      dmgLog: [],
      dmgInLog: [],
      healLog: [],
      killLog: []
    };
  }

  function createKill(name, cr) {
    return { id: generateId(), name: name || '', cr: cr || '' };
  }

  return { getAll, getById, save, remove, count, createSession, createPc, createKill, MAX_SESSIONS };
})();
