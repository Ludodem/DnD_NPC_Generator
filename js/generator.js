/**
 * Generator Module
 * Handles NPC generation logic
 */

const Generator = (function() {
  // Available options
  const SEX_OPTIONS = ['Male', 'Female'];
  const ALIGNMENT_OPTIONS = ['Good', 'Neutral', 'Evil'];

  /**
   * Pick a random item from an array
   */
  function randomPick(array) {
    if (!array || array.length === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * array.length);
    return array[index];
  }

  /**
   * Generate a UUID
   */
  function generateId() {
    // Use crypto.randomUUID if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate a name based on race and sex
   */
  async function generateName(raceId, sex) {
    const race = await DataLoader.getRace(raceId);
    const names = await DataLoader.loadNames(raceId);

    // Select first name based on sex
    const firstNameList = sex === 'Male' ? names.maleFirst : names.femaleFirst;
    const firstName = randomPick(firstNameList);

    // Select last name
    const lastName = randomPick(names.last);

    // Format based on race naming rules
    if (race.nameFormat === 'first_nickname_last') {
      // Dwarf style: "Thorin 'Ironfoot' Stonehammer"
      const nickname = randomPick(names.nicknames);
      return `${firstName} "${nickname}" ${lastName}`;
    } else {
      // Standard: "First Last"
      return `${firstName} ${lastName}`;
    }
  }

  /**
   * Generate physical description
   */
  async function generatePhysicalDescription(raceLabel) {
    const physical = await DataLoader.loadPhysical();

    // Prefer race-specific sentences if available
    if (physical.byRace && physical.byRace[raceLabel] && physical.byRace[raceLabel].length > 0) {
      return randomPick(physical.byRace[raceLabel]);
    }

    // Fallback to generic
    return randomPick(physical.generic);
  }

  /**
   * Generate psychological description
   */
  async function generatePsychDescription(alignment) {
    const psych = await DataLoader.loadPsych(alignment);
    return randomPick(psych.sentences);
  }

  /**
   * Resolve a selection (return value if set, or random if "random")
   */
  async function resolveSelection(value, options, getRaceLabel = false) {
    if (!value || value === 'random') {
      if (getRaceLabel) {
        // For race, we need to pick from race objects and return both id and label
        const races = await DataLoader.getAllRaces();
        const race = randomPick(races);
        return { id: race.id, label: race.label };
      }
      return randomPick(options);
    }

    if (getRaceLabel) {
      // Value is already an object with id and label
      return value;
    }

    return value;
  }

  /**
   * Generate a complete NPC
   * @param {Object} criteria - Generation criteria
   * @param {string} criteria.sex - 'Male', 'Female', or 'random'
   * @param {Object|string} criteria.race - { id, label } or 'random'
   * @param {string} criteria.alignment - 'Good', 'Neutral', 'Evil', or 'random'
   */
  async function generate(criteria = {}) {
    // Resolve random selections
    const sex = await resolveSelection(criteria.sex, SEX_OPTIONS);
    const race = await resolveSelection(criteria.race, null, true);
    const alignment = await resolveSelection(criteria.alignment, ALIGNMENT_OPTIONS);

    // Generate name based on resolved race and sex
    const name = await generateName(race.id, sex);

    // Generate descriptions
    const physicalDescription = await generatePhysicalDescription(race.label);
    const psychDescription = await generatePsychDescription(alignment);

    // Create NPC object
    const npc = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      sex: sex,
      race: race.label,
      raceId: race.id,
      alignment: alignment,
      class: null,
      level: null,
      name: name,
      physicalDescription: physicalDescription,
      psychDescription: psychDescription,
      notes: '',
      version: 1
    };

    return npc;
  }

  /**
   * Format NPC for clipboard
   */
  function formatForClipboard(npc) {
    return `${npc.name}
Sex: ${npc.sex} | Race: ${npc.race} | Alignment: ${npc.alignment}
Physical: ${npc.physicalDescription}
Psych: ${npc.psychDescription}`;
  }

  /**
   * Get available sex options
   */
  function getSexOptions() {
    return [...SEX_OPTIONS];
  }

  /**
   * Get available alignment options
   */
  function getAlignmentOptions() {
    return [...ALIGNMENT_OPTIONS];
  }

  // Public API
  return {
    generate,
    formatForClipboard,
    getSexOptions,
    getAlignmentOptions
  };
})();
