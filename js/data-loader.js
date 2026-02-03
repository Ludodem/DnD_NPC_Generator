/**
 * Data Loader Module
 * Handles fetching and caching of JSON configuration files
 */

const DataLoader = (function() {
  // Cache for loaded data
  const cache = {
    races: null,
    names: {},
    physical: null,
    archetypes: null,
    faces: null,
    psych: {
      good: null,
      neutral: null,
      evil: null
    }
  };

  // Base path for data files
  const DATA_PATH = 'data/';

  /**
   * Fetch JSON file with error handling
   */
  async function fetchJSON(filename) {
    try {
      const response = await fetch(DATA_PATH + filename);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Load races configuration
   */
  async function loadRaces() {
    if (cache.races) {
      return cache.races;
    }
    cache.races = await fetchJSON('races.json');
    return cache.races;
  }

  /**
   * Load names for a specific race
   */
  async function loadNames(raceId) {
    if (cache.names[raceId]) {
      return cache.names[raceId];
    }

    const races = await loadRaces();
    const race = races.races.find(r => r.id === raceId);

    if (!race) {
      throw new Error(`Unknown race: ${raceId}`);
    }

    cache.names[raceId] = await fetchJSON(race.nameFile);
    return cache.names[raceId];
  }

  /**
   * Load physical descriptions
   */
  async function loadPhysical() {
    if (cache.physical) {
      return cache.physical;
    }
    cache.physical = await fetchJSON('physical_sentences.json');
    return cache.physical;
  }

  /**
   * Load archetypes configuration
   */
  async function loadArchetypes() {
    if (cache.archetypes) {
      return cache.archetypes;
    }
    cache.archetypes = await fetchJSON('archetypes.json');
    return cache.archetypes;
  }

  /**
   * Load faces list
   */
  async function loadFaces() {
    if (cache.faces) {
      return cache.faces;
    }
    cache.faces = await fetchJSON('faces.json');
    return cache.faces;
  }

  /**
   * Load psychological descriptions for an alignment
   */
  async function loadPsych(alignment) {
    const key = alignment.toLowerCase();

    if (cache.psych[key]) {
      return cache.psych[key];
    }

    const filename = `psych_${key}.json`;
    cache.psych[key] = await fetchJSON(filename);
    return cache.psych[key];
  }

  /**
   * Preload all data files (useful for offline caching)
   */
  async function preloadAll() {
    const races = await loadRaces();

    // Load all name files
    const namePromises = races.races.map(race => loadNames(race.id));

    // Load physical descriptions
    const physicalPromise = loadPhysical();

    // Load archetypes
    const archetypesPromise = loadArchetypes();

    // Load faces list
    const facesPromise = loadFaces();

    // Load all psych files
    const psychPromises = ['good', 'neutral', 'evil'].map(alignment => loadPsych(alignment));

    await Promise.all([
      ...namePromises,
      physicalPromise,
      archetypesPromise,
      facesPromise,
      ...psychPromises
    ]);

    console.log('All data files preloaded');
    return true;
  }

  /**
   * Get race configuration by ID
   */
  async function getRace(raceId) {
    const races = await loadRaces();
    return races.races.find(r => r.id === raceId);
  }

  /**
   * Get all races
   */
  async function getAllRaces() {
    const races = await loadRaces();
    return races.races;
  }

  /**
   * Get archetypes list
   */
  async function getArchetypes() {
    const archetypes = await loadArchetypes();
    return archetypes.archetypes;
  }

  /**
   * Get face list
   */
  async function getFaces() {
    const faces = await loadFaces();
    return faces.faces;
  }

  // Public API
  return {
    loadRaces,
    loadNames,
    loadPhysical,
    loadPsych,
    loadArchetypes,
    loadFaces,
    preloadAll,
    getRace,
    getAllRaces,
    getArchetypes,
    getFaces
  };
})();
