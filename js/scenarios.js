/**
 * Scenarios Module
 * Storage and helpers for DM scenario sheets
 */

const Scenarios = (function() {
  const STORAGE_KEY = 'dnd_scenario_library';
  const MAX_SCENARIOS = 50;
  const SCHEMA_VERSION = 1;

  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error reading scenarios from storage:', error);
      return [];
    }
  }

  function saveAll(scenarios) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
      return true;
    } catch (error) {
      console.error('Error writing scenarios to storage:', error);
      return false;
    }
  }

  function getById(id) {
    return getAll().find(s => s.id === id) || null;
  }

  function save(scenario) {
    const all = getAll();
    if (all.length >= MAX_SCENARIOS && !all.find(s => s.id === scenario.id)) {
      return {
        success: false,
        error: `Library is full. Maximum ${MAX_SCENARIOS} scenarios allowed.`
      };
    }
    scenario.updatedAt = nowIso();
    const idx = all.findIndex(s => s.id === scenario.id);
    if (idx !== -1) {
      all[idx] = scenario;
    } else {
      if (!scenario.createdAt) scenario.createdAt = nowIso();
      all.unshift(scenario);
    }
    const success = saveAll(all);
    return { success, error: success ? undefined : 'Failed to save scenario.' };
  }

  function remove(id) {
    const all = getAll();
    const filtered = all.filter(s => s.id !== id);
    if (filtered.length === all.length) return false;
    return saveAll(filtered);
  }

  function count() {
    return getAll().length;
  }

  // Factory helpers — keep schema in one place
  function createEmptyScenario() {
    return {
      id: generateId(),
      version: SCHEMA_VERSION,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      title: '',
      subtitle: '',
      players: '',
      level: '',
      duration: '',
      campaign: '',
      context: '',
      structure: '',
      magicItems: [],
      acts: []
    };
  }

  function createMagicItem() {
    return { id: generateId(), name: '', rarity: '', description: '' };
  }

  function createAct() {
    return { id: generateId(), title: '', description: '', scenes: [] };
  }

  function createScene() {
    return { id: generateId(), title: '', content: '', checks: [], callouts: [], combats: [] };
  }

  function createCombat() {
    return { id: generateId(), name: '', description: '', enemies: [] };
  }

  function createCheck() {
    return { id: generateId(), skill: '', dc: '', description: '' };
  }

  function createCallout() {
    return { id: generateId(), type: 'tip', text: '' };
  }

  return {
    getAll,
    getById,
    save,
    remove,
    count,
    createEmptyScenario,
    createMagicItem,
    createAct,
    createScene,
    createCombat,
    createCheck,
    createCallout,
    MAX_SCENARIOS
  };
})();
