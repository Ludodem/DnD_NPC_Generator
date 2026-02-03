/**
 * Generator Module
 * Handles NPC generation logic
 */

const Generator = (function() {
  // Available options
  const SEX_OPTIONS = ['Male', 'Female'];
  const ALIGNMENT_OPTIONS = ['Good', 'Neutral', 'Evil'];
  const TIER_OPTIONS = ['Novice', 'Trained', 'Veteran', 'Elite', 'Legendary'];
  const ABILITY_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

  const TIER_CONFIG = {
    Novice: { cr: 1, pb: 2, primaryBoost: 0, secondaryBoost: 0, novice: true },
    Trained: { cr: 3, pb: 2, primaryBoost: 1, secondaryBoost: 0 },
    Veteran: { cr: 6, pb: 3, primaryBoost: 2, secondaryBoost: 1 },
    Elite: { cr: 9, pb: 4, primaryBoost: 3, secondaryBoost: 1 },
    Legendary: { cr: 13, pb: 5, primaryBoost: 4, secondaryBoost: 2 }
  };

  const TIER_AC_BASE = {
    Novice: 12,
    Trained: 13,
    Veteran: 14,
    Elite: 16,
    Legendary: 18
  };

  const ARCHETYPE_AC_ADJUST = {
    martial: 2,
    brute: 2,
    rogue: 1,
    cleric: 1,
    caster: -1
  };

  const TIER_HP_BASE = {
    Novice: 9,
    Trained: 18,
    Veteran: 30,
    Elite: 45,
    Legendary: 70
  };

  const TIER_HP_CON_MULT = {
    Novice: 2,
    Trained: 4,
    Veteran: 6,
    Elite: 8,
    Legendary: 10
  };

  const TIER_ACTION_COUNTS = {
    Novice: { traits: 1, actions: 1, reactions: 0 },
    Trained: { traits: 1, actions: 2, reactions: 0 },
    Veteran: { traits: 2, actions: 2, reactions: 1 },
    Elite: { traits: 2, actions: 3, reactions: 1 },
    Legendary: { traits: 3, actions: 3, reactions: 1 }
  };

  const ARCHETYPE_BONUS_DICE = {
    martial: {
      Trained: '1d4',
      Veteran: '1d6',
      Elite: '1d8',
      Legendary: '2d6'
    },
    brute: {
      Trained: '1d6',
      Veteran: '1d8',
      Elite: '2d6',
      Legendary: '2d8'
    },
    rogue: {
      Trained: '1d4',
      Veteran: '2d4',
      Elite: '3d4',
      Legendary: '4d4'
    },
    cleric: {
      Trained: '1d4',
      Veteran: '1d6',
      Elite: '2d6',
      Legendary: '2d8'
    },
    caster: {
      Trained: '1d4',
      Veteran: '1d6',
      Elite: '2d6',
      Legendary: '2d8'
    }
  };

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
   * Resolve an archetype selection
   */
  async function resolveArchetype(value) {
    const archetypes = await DataLoader.getArchetypes();

    if (!value || value === 'random') {
      return randomPick(archetypes);
    }

    if (typeof value === 'object') {
      return value;
    }

    return archetypes.find(a => a.id === value) || randomPick(archetypes);
  }

  /**
   * Resolve tier selection
   */
  function resolveTier(value) {
    if (!value || value === 'random') {
      return randomPick(TIER_OPTIONS);
    }
    return value;
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
   * Get tier configuration info
   */
  function getTierInfo(tier) {
    return TIER_CONFIG[tier] || TIER_CONFIG.Novice;
  }

  function computeArmorClass(tier, archetypeId) {
    const base = TIER_AC_BASE[tier] || TIER_AC_BASE.Novice;
    const adjust = ARCHETYPE_AC_ADJUST[archetypeId] || 0;
    const ac = base + adjust;
    return Math.max(10, Math.min(20, ac));
  }

  function computeHitPoints(tier, conMod) {
    const base = TIER_HP_BASE[tier] || TIER_HP_BASE.Novice;
    const mult = TIER_HP_CON_MULT[tier] || TIER_HP_CON_MULT.Novice;
    const hp = base + (conMod * mult);
    return Math.max(1, hp);
  }

  function computeSpeed(raceLabel) {
    if (raceLabel === 'Dwarf' || raceLabel === 'Halfling') {
      return '25 ft.';
    }
    return '30 ft.';
  }

  function computeInitiative(dexMod) {
    return dexMod;
  }

  /**
   * Compute stats for a given archetype and tier
   */
  async function computeStatsFor(archetypeId, tier, raceLabel) {
    const archetypes = await DataLoader.getArchetypes();
    const archetype = archetypes.find(a => a.id === archetypeId) || archetypes[0];
    const resolvedTier = TIER_CONFIG[tier] ? tier : 'Novice';
    const tierInfo = getTierInfo(resolvedTier);
    const abilityScores = generateAbilityScores(archetype, tierInfo);
    const abilityMods = computeAbilityMods(abilityScores);
    const saveProfs = (archetype && archetype.saveProfs && archetype.saveProfs.length >= 2)
      ? archetype.saveProfs.slice(0, 2)
      : pickTopTwo(abilityMods);
    const savingThrows = computeSavingThrows(abilityMods, saveProfs, tierInfo.pb);
    const ac = computeArmorClass(resolvedTier, archetype.id);
    const hp = computeHitPoints(resolvedTier, abilityMods.CON || 0);
    const speed = computeSpeed(raceLabel);
    const initiative = computeInitiative(abilityMods.DEX || 0);
    const actionData = await buildBehavior(archetype.id, resolvedTier, abilityMods, tierInfo.pb);

    return {
      archetype,
      tier: resolvedTier,
      tierInfo,
      abilityScores,
      abilityMods,
      saveProfs,
      savingThrows,
      ac,
      hp,
      speed,
      initiative,
      traits: actionData.traits,
      actions: actionData.actions,
      reactions: actionData.reactions
    };
  }

  /**
   * Generate ability scores based on archetype and tier
   */
  function generateAbilityScores(archetype, tierInfo) {
    const scores = {};
    ABILITY_KEYS.forEach(key => {
      scores[key] = 10;
    });

    if (tierInfo.novice && archetype && Array.isArray(archetype.primary) && archetype.primary.length > 0) {
      const primaryList = archetype.primary.slice();
      const primaryMain = randomPick(primaryList);
      scores[primaryMain] = 14;

      const secondaryPrimary = primaryList.find(key => key !== primaryMain);
      if (secondaryPrimary) {
        scores[secondaryPrimary] = 12;
      } else if (archetype.secondary && archetype.secondary.length > 0) {
        scores[archetype.secondary[0]] = 12;
      }

      ABILITY_KEYS.forEach(key => {
        scores[key] = Math.max(8, Math.min(14, scores[key]));
      });

      return scores;
    }

    if (archetype && archetype.primary) {
      archetype.primary.forEach(key => {
        if (scores[key] !== undefined) {
          scores[key] += 4;
        }
      });
    }

    if (archetype && archetype.secondary) {
      archetype.secondary.forEach(key => {
        if (scores[key] !== undefined) {
          scores[key] += 2;
        }
      });
    }

    if (archetype && archetype.primary) {
      archetype.primary.forEach(key => {
        if (scores[key] !== undefined) {
          scores[key] += tierInfo.primaryBoost;
        }
      });
    }

    if (archetype && archetype.secondary) {
      archetype.secondary.forEach(key => {
        if (scores[key] !== undefined) {
          scores[key] += tierInfo.secondaryBoost;
        }
      });
    }

    ABILITY_KEYS.forEach(key => {
      scores[key] = Math.max(8, Math.min(20, scores[key]));
    });

    return scores;
  }

  /**
   * Compute ability modifiers from scores
   */
  function computeAbilityMods(scores) {
    const mods = {};
    ABILITY_KEYS.forEach(key => {
      const score = scores[key] || 10;
      mods[key] = Math.floor((score - 10) / 2);
    });
    return mods;
  }

  /**
   * Pick top two abilities for saving throws
   */
  function pickTopTwo(mods) {
    return ABILITY_KEYS
      .slice()
      .sort((a, b) => mods[b] - mods[a])
      .slice(0, 2);
  }

  /**
   * Compute saving throws values
   */
  function computeSavingThrows(mods, saveProfs, proficiencyBonus) {
    const saves = {};
    ABILITY_KEYS.forEach(key => {
      const isProficient = saveProfs.includes(key);
      saves[key] = mods[key] + (isProficient ? proficiencyBonus : 0);
    });
    return saves;
  }

  /**
   * Generate a complete NPC
   * @param {Object} criteria - Generation criteria
   * @param {string} criteria.sex - 'Male', 'Female', or 'random'
   * @param {Object|string} criteria.race - { id, label } or 'random'
   * @param {string} criteria.alignment - 'Good', 'Neutral', 'Evil', or 'random'
   * @param {Object|string} criteria.archetype - archetype object, id, or 'random'
   * @param {string} criteria.tier - tier label or 'random'
   */
  async function generate(criteria = {}) {
    // Resolve random selections
    const sex = await resolveSelection(criteria.sex, SEX_OPTIONS);
    const race = await resolveSelection(criteria.race, null, true);
    const alignment = await resolveSelection(criteria.alignment, ALIGNMENT_OPTIONS);
    const archetype = await resolveArchetype(criteria.archetype);
    const tier = resolveTier(criteria.tier);

    // Generate name based on resolved race and sex
    const name = await generateName(race.id, sex);

    // Generate descriptions
    const physicalDescription = await generatePhysicalDescription(race.label);
    const psychDescription = await generatePsychDescription(alignment);

    // Stats block basics
    const tierInfo = getTierInfo(tier);
    const abilityScores = generateAbilityScores(archetype, tierInfo);
    const abilityMods = computeAbilityMods(abilityScores);
    const saveProfs = (archetype && archetype.saveProfs && archetype.saveProfs.length >= 2)
      ? archetype.saveProfs.slice(0, 2)
      : pickTopTwo(abilityMods);
    const savingThrows = computeSavingThrows(abilityMods, saveProfs, tierInfo.pb);
    const ac = computeArmorClass(tier, archetype ? archetype.id : null);
    const hp = computeHitPoints(tier, abilityMods.CON || 0);
    const speed = computeSpeed(race.label);
    const initiative = computeInitiative(abilityMods.DEX || 0);
    const actionData = await buildBehavior(archetype ? archetype.id : null, tier, abilityMods, tierInfo.pb);

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
      archetype: archetype ? archetype.id : null,
      archetypeLabel: archetype ? archetype.label : null,
      tier: tier,
      cr: tierInfo.cr,
      proficiencyBonus: tierInfo.pb,
      armorClass: ac,
      hitPoints: hp,
      speed: speed,
      initiative: initiative,
      abilityScores: abilityScores,
      abilityMods: abilityMods,
      savingThrowProficiencies: saveProfs,
      savingThrows: savingThrows,
      traits: actionData.traits,
      actions: actionData.actions,
      reactions: actionData.reactions,
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

  /**
   * Get available tier options
   */
  function getTierOptions() {
    return [...TIER_OPTIONS];
  }

  /**
   * Get ability modifier map from scores (exported for UI fallback)
   */
  function getAbilityModsFromScores(scores) {
    return computeAbilityMods(scores);
  }

  async function buildBehavior(archetypeId, tier, abilityMods, pb) {
    const actions = await DataLoader.getActions();
    const traits = await DataLoader.getTraits();
    const reactions = await DataLoader.getReactions();
    const counts = TIER_ACTION_COUNTS[tier] || TIER_ACTION_COUNTS.Novice;

    const selectedTraits = pickEntries(traits, archetypeId, counts.traits);
    const selectedActions = pickEntries(actions, archetypeId, Math.max(1, counts.actions));
    const selectedReactions = pickEntries(reactions, archetypeId, counts.reactions);

    const multiattack = buildMultiattack(archetypeId, tier, actions, selectedActions);
    let finalActions = selectedActions.slice(0, counts.actions);
    if (multiattack && counts.actions > 0) {
      finalActions = [multiattack, ...selectedActions.slice(0, counts.actions - 1)];
    }

    return {
      traits: selectedTraits.map(entry => resolveEntry(entry, tier, abilityMods, pb, archetypeId)),
      actions: finalActions.map(entry => entry.isMultiattack ? entry : resolveEntry(entry, tier, abilityMods, pb, archetypeId)),
      reactions: selectedReactions.map(entry => resolveEntry(entry, tier, abilityMods, pb, archetypeId))
    };
  }

  function pickEntries(entries, archetypeId, count) {
    if (count <= 0) {
      return [];
    }
    const tagged = entries.filter(entry => (entry.tags || []).includes(archetypeId));
    const any = entries.filter(entry => (entry.tags || []).includes('any'));
    const pool = tagged.length > 0 ? tagged : any;
    const result = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
      let pick = randomPick(pool);
      let guard = 0;
      while (pick && used.has(pick.name) && guard < 5) {
        pick = randomPick(pool);
        guard++;
      }
      if (!pick && any.length > 0) {
        pick = randomPick(any);
      }
      if (pick) {
        used.add(pick.name);
        result.push(pick);
      }
    }

    return result;
  }

  function resolveEntry(entry, tier, abilityMods, pb, archetypeId) {
    const attackAbility = entry.attackAbility;
    const saveAbility = entry.saveAbility;
    const mod = attackAbility ? (abilityMods[attackAbility] || 0) : (saveAbility ? (abilityMods[saveAbility] || 0) : 0);
    const toHit = formatSigned(mod + pb);
    const dc = 8 + pb + mod;
    const dice = entry.damageByTier ? entry.damageByTier[tier] : entry.damage;
    const bonusDice = getBonusDice(archetypeId, tier);
    const damage = formatDamage(dice, mod, bonusDice);

    let text = entry.text || '';
    text = text.replaceAll('{toHit}', toHit);
    text = text.replaceAll('{dc}', dc.toString());
    text = text.replaceAll('{damage}', damage);
    text = text.replaceAll('{pb}', pb.toString());
    text = text.replaceAll('{mod}', formatSigned(mod));

    return {
      name: entry.name,
      text
    };
  }

  function formatSigned(value) {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  function formatDamage(dice, mod, bonusDice) {
    const parts = [];
    if (dice) parts.push(dice);
    if (bonusDice) parts.push(bonusDice);

    if (parts.length === 0) {
      return formatSigned(mod);
    }

    let base = parts.join(' + ');
    if (mod === 0) {
      return base;
    }
    const sign = mod > 0 ? '+' : '-';
    return `${base} ${sign} ${Math.abs(mod)}`;
  }

  function getBonusDice(archetypeId, tier) {
    if (!archetypeId) return null;
    const tierMap = ARCHETYPE_BONUS_DICE[archetypeId];
    if (!tierMap) return null;
    return tierMap[tier] || null;
  }

  function buildMultiattack(archetypeId, tier, allActions, selectedActions) {
    if (!archetypeId) return null;
    if (archetypeId === 'caster') return null;

    const counts = {
      Trained: 2,
      Veteran: 2,
      Elite: 3,
      Legendary: 3
    };
    const count = counts[tier] || 0;
    if (count <= 0) return null;

    const pool = getTaggedPool(allActions, archetypeId).filter(entry => entry.attackAbility);
    const selectedPool = selectedActions.filter(entry => entry.attackAbility);
    const attackPool = selectedPool.length > 0 ? selectedPool : pool;
    if (attackPool.length === 0) return null;

    const names = [];
    for (let i = 0; i < count; i++) {
      const pick = randomPick(attackPool);
      if (pick) {
        names.push(pick.name);
      }
    }

    if (names.length === 0) return null;
    while (names.length < count) {
      names.push(names[0]);
    }

    const nameList = formatNameList(names);
    const countLabel = count === 2 ? 'two' : 'three';

    return {
      name: 'Multiattack',
      text: `The NPC makes ${countLabel} attacks: ${nameList}.`,
      isMultiattack: true
    };
  }

  function getTaggedPool(entries, archetypeId) {
    const tagged = entries.filter(entry => (entry.tags || []).includes(archetypeId));
    const any = entries.filter(entry => (entry.tags || []).includes('any'));
    return tagged.length > 0 ? tagged : any;
  }

  function formatNameList(names) {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]}, ${names[1]}, and ${names[2]}`;
  }

  // Public API
  return {
    generate,
    formatForClipboard,
    getSexOptions,
    getAlignmentOptions,
    getTierOptions,
    getTierInfo,
    getAbilityModsFromScores,
    computeStatsFor
  };
})();
