/**
 * UI Module
 * Handles screen navigation, rendering, and user interactions
 */

const UI = (function() {
  // Current state
  let currentScreen = 'generator';
  let currentNpc = null;
  let generatorCriteria = {
    sex: 'random',
    race: 'random',
    alignment: 'random',
    archetype: 'random',
    tier: 'Novice'
  };
  let viewingNpcId = null;
  let viewingMonster = null;
  let viewingDetailType = 'npc';
  let cachedArchetypes = [];
  let cachedTiers = [];
  let cachedMonsters = null;
  let cachedSpells = null;
  let spellIndex = null;
  let conditionIndex = null;
  let referenceRegex = null;
  let spellNames = [];
  let conditionNames = [];
  let libraryTab = 'npcs';

  // DOM element cache
  const elements = {};

  /**
   * Initialize UI - cache DOM elements and set up event listeners
   */
  function init() {
    cacheElements();
    setupNavigation();
    setupGeneratorScreen();
    setupResultScreen();
    setupLibraryScreen();
    setupScenariosScreen();
    setupModal();
    setupViewTabs();

    // Show generator screen by default
    showScreen('generator');
  }

  /**
   * Cache frequently used DOM elements
   */
  function cacheElements() {
    // Navigation
    elements.navBtns = document.querySelectorAll('.nav-btn');
    elements.settingsBtn = document.querySelector('.nav-btn[data-action="settings"]');

    // Screens
    elements.screens = {
      generator: document.getElementById('screen-generator'),
      result: document.getElementById('screen-result'),
      library: document.getElementById('screen-library'),
      libraryDetail: document.getElementById('screen-library-detail'),
      scenarios: document.getElementById('screen-scenarios'),
      scenarioDetail: document.getElementById('screen-scenario-detail')
    };

    // Generator
    elements.selectors = document.getElementById('selectors');
    elements.btnGenerate = document.getElementById('btn-generate');
    elements.generatorFaceLeft = document.getElementById('generator-face-left');
    elements.generatorFaceRight = document.getElementById('generator-face-right');

    // Result
    elements.resultName = document.getElementById('result-name');
    elements.resultSummary = document.getElementById('result-summary');
    elements.resultAc = document.getElementById('result-ac');
    elements.resultStatline = document.getElementById('result-statline');
    elements.resultSaves = document.getElementById('result-saves');
    elements.resultPhysical = document.querySelector('#result-physical p');
    elements.resultPsych = document.querySelector('#result-psych p');
    elements.resultNotes = document.getElementById('notes-input');
    elements.resultAbilityMods = mapAbilityElements(document.querySelectorAll('#screen-result .ability-mod'));
    elements.resultArchetypeSelect = document.getElementById('result-archetype-select');
    elements.resultTierSelect = document.getElementById('result-tier-select');
    elements.resultAbilityRolls = document.querySelectorAll('#screen-result .ability-roll');
    elements.resultTabs = document.querySelectorAll('#screen-result .view-tab');
    elements.resultTabContents = document.querySelectorAll('#screen-result .view-tab-content');
    elements.resultStatblock = {
      key: 'result',
      ac: document.getElementById('result-statblock-ac'),
      hp: document.getElementById('result-statblock-hp'),
      speed: document.getElementById('result-statblock-speed'),
      init: document.getElementById('result-statblock-init'),
      meta: document.getElementById('result-statblock-meta'),
      abilities: document.getElementById('result-statblock-abilities'),
      traits: document.getElementById('result-statblock-traits'),
      actions: document.getElementById('result-statblock-actions'),
      spellsSection: document.getElementById('result-statblock-spells-section'),
      spellsToggle: document.getElementById('result-statblock-spells-toggle'),
      spells: document.getElementById('result-statblock-spells'),
      reactions: document.getElementById('result-statblock-reactions')
    };
    elements.btnBack = document.getElementById('btn-back');
    elements.btnRegenerate = document.getElementById('btn-regenerate');
    elements.btnCopy = document.getElementById('btn-copy');
    elements.btnSave = document.getElementById('btn-save');

    // Library
    elements.libraryList = document.getElementById('library-list');
    elements.libraryEmpty = document.getElementById('library-empty');
    elements.btnGenerateFirst = document.getElementById('btn-generate-first');
    elements.libraryTabs = document.querySelectorAll('.library-tab');
    elements.librarySections = {
      npcs: document.getElementById('library-section-npcs'),
      monsters: document.getElementById('library-section-monsters'),
      spells: document.getElementById('library-section-spells')
    };
    elements.monsterList = document.getElementById('monster-list');
    elements.monsterEmpty = document.getElementById('monster-empty');
    elements.monsterSearch = document.getElementById('monster-search');
    elements.monsterTypeFilter = document.getElementById('monster-type-filter');
    elements.monsterCrMin = document.getElementById('monster-cr-min');
    elements.monsterCrMax = document.getElementById('monster-cr-max');
    elements.spellList = document.getElementById('spell-list');
    elements.spellEmpty = document.getElementById('spell-empty');
    elements.spellSearch = document.getElementById('spell-search');
    elements.spellLevelFilter = document.getElementById('spell-level-filter');
    elements.spellClassFilter = document.getElementById('spell-class-filter');

    // Library Detail
    elements.detailName = document.getElementById('detail-name');
    elements.detailSummary = document.getElementById('detail-summary');
    elements.detailAc = document.getElementById('detail-ac');
    elements.detailStatline = document.getElementById('detail-statline');
    elements.detailSaves = document.getElementById('detail-saves');
    elements.detailPhysical = document.querySelector('#detail-physical p');
    elements.detailPsych = document.querySelector('#detail-psych p');
    elements.detailNotes = document.getElementById('detail-notes-input');
    elements.detailAbilityMods = mapAbilityElements(document.querySelectorAll('#screen-library-detail .ability-mod'));
    elements.detailArchetypeSelect = document.getElementById('detail-archetype-select');
    elements.detailTierSelect = document.getElementById('detail-tier-select');
    elements.detailAbilityRolls = document.querySelectorAll('#screen-library-detail .ability-roll');
    elements.detailTabs = document.querySelectorAll('#screen-library-detail .view-tab');
    elements.detailTabContents = document.querySelectorAll('#screen-library-detail .view-tab-content');
    elements.detailTabsContainer = document.querySelector('#screen-library-detail .view-tabs');
    elements.detailControls = document.querySelector('#screen-library-detail .stat-controls');
    elements.detailOverviewContent = document.querySelector('#screen-library-detail .view-tab-content[data-tab="overview"]');
    elements.detailStatblockContent = document.querySelector('#screen-library-detail .view-tab-content[data-tab="statblock"]');
    elements.detailStatblock = {
      key: 'detail',
      ac: document.getElementById('detail-statblock-ac'),
      hp: document.getElementById('detail-statblock-hp'),
      speed: document.getElementById('detail-statblock-speed'),
      init: document.getElementById('detail-statblock-init'),
      meta: document.getElementById('detail-statblock-meta'),
      abilities: document.getElementById('detail-statblock-abilities'),
      traits: document.getElementById('detail-statblock-traits'),
      actions: document.getElementById('detail-statblock-actions'),
      spellsSection: document.getElementById('detail-statblock-spells-section'),
      spellsToggle: document.getElementById('detail-statblock-spells-toggle'),
      spells: document.getElementById('detail-statblock-spells'),
      reactions: document.getElementById('detail-statblock-reactions')
    };
    elements.btnBackLibrary = document.getElementById('btn-back-library');
    elements.btnCopyDetail = document.getElementById('btn-copy-detail');
    elements.btnDelete = document.getElementById('btn-delete');

    // Modal
    elements.modal = document.getElementById('modal');
    elements.modalTitle = document.getElementById('modal-title');
    elements.modalMessage = document.getElementById('modal-message');
    elements.modalCancel = document.getElementById('modal-cancel');
    elements.modalConfirm = document.getElementById('modal-confirm');

    // Toast
    elements.toast = document.getElementById('toast');

    // Roll modal
    elements.rollModal = document.getElementById('roll-modal');
    elements.rollTitle = document.getElementById('roll-title');
    elements.rollResult = document.getElementById('roll-result');
    elements.rollDetail = document.getElementById('roll-detail');
    elements.rollDivider = document.getElementById('roll-divider');
    elements.rollSectionDamage = document.getElementById('roll-section-damage');
    elements.rollTitle2 = document.getElementById('roll-title-2');
    elements.rollResult2 = document.getElementById('roll-result-2');
    elements.rollDetail2 = document.getElementById('roll-detail-2');

    // Settings modal
    elements.settingsModal = document.getElementById('settings-modal');
    elements.btnClearReload = document.getElementById('btn-clear-reload');

    // Spell modal
    elements.spellModal = document.getElementById('spell-modal');
    elements.spellTitle = document.getElementById('spell-title');
    elements.spellMeta = document.getElementById('spell-meta');
    elements.spellDetails = document.getElementById('spell-details');

    // Condition modal
    elements.conditionModal = document.getElementById('condition-modal');
    elements.conditionTitle = document.getElementById('condition-title');
    elements.conditionDescription = document.getElementById('condition-description');

    // Scenarios
    elements.scenarioList = document.getElementById('scenario-list');
    elements.scenarioEmpty = document.getElementById('scenario-empty');
    elements.btnNewScenario = document.getElementById('btn-new-scenario');
    elements.btnNewScenarioEmpty = document.getElementById('btn-new-scenario-empty');
    elements.btnBackScenario = document.getElementById('btn-back-scenario');
    elements.scenarioDetailHeading = document.getElementById('scenario-detail-heading');
    elements.scenarioView = document.getElementById('scenario-view');
    elements.itemEditorModal = document.getElementById('item-editor-modal');
    elements.itemEditorTitle = document.getElementById('item-editor-title');
    elements.itemEditorBody = document.getElementById('item-editor-body');
    elements.btnItemEditorClose = document.getElementById('item-editor-close');
    elements.btnItemEditorCancel = document.getElementById('item-editor-cancel');
    elements.btnItemEditorSave = document.getElementById('item-editor-save');
    elements.btnItemEditorDelete = document.getElementById('item-editor-delete');
    elements.enemyPickerModal = document.getElementById('enemy-picker-modal');
    elements.enemyPickerTabs = document.querySelectorAll('.enemy-picker-tab');
    elements.enemyPickerSearch = document.getElementById('enemy-picker-search');
    elements.enemyPickerList = document.getElementById('enemy-picker-list');
    elements.btnEnemyPickerClose = document.getElementById('enemy-picker-close');
  }

  /**
   * Set up bottom navigation
   */
  function setupNavigation() {
    elements.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.action === 'settings') {
          showSettingsModal();
          return;
        }
        const screen = btn.dataset.screen;
        if (screen === 'library') {
          showScreen('library');
          renderActiveLibrarySection();
        } else if (screen === 'scenarios') {
          showScreen('scenarios');
          renderScenarioList();
        } else {
          showScreen(screen);
        }
        updateNavigation(screen);
      });
    });
  }

  /**
   * Update navigation active state
   */
  function updateNavigation(activeScreen) {
    // Map detail screens to their parent nav item
    const navMap = {
      'generator': 'generator',
      'result': 'generator',
      'library': 'library',
      'libraryDetail': 'library',
      'scenarios': 'scenarios',
      'scenarioDetail': 'scenarios'
    };

    const navTarget = navMap[activeScreen] || activeScreen;

    elements.navBtns.forEach(btn => {
      if (btn.dataset.action === 'settings') {
        btn.classList.remove('active');
        return;
      }
      btn.classList.toggle('active', btn.dataset.screen === navTarget);
    });
  }

  /**
   * Show a specific screen
   */
  function showScreen(screenName) {
    currentScreen = screenName;

    // Hide all screens
    Object.values(elements.screens).forEach(screen => {
      screen.classList.remove('active');
    });

    // Show target screen
    if (elements.screens[screenName]) {
      elements.screens[screenName].classList.add('active');
    }

    updateNavigation(screenName);
  }

  /**
   * Set up generator screen
   */
  async function setupGeneratorScreen() {
    await renderSelectors();
    await setRandomGeneratorFaces();

    elements.btnGenerate.addEventListener('click', handleGenerate);
  }

  /**
   * Render selector groups
   */
  async function renderSelectors() {
    const races = await DataLoader.getAllRaces();
    const archetypes = await getArchetypes();
    const sexOptions = Generator.getSexOptions();
    const alignmentOptions = Generator.getAlignmentOptions();
    const tierOptions = getTierOptions();

    const html = `
      ${renderSelectorGroup('Sex', 'sex', sexOptions, 'random')}
      ${renderSelectorGroup('Race', 'race', races.map(r => ({ value: r.id, label: r.label })), 'random')}
      ${renderSelectorGroup('Alignment', 'alignment', alignmentOptions, 'random')}
      ${renderSelectorGroup('Archetype', 'archetype', archetypes.map(a => ({ value: a.id, label: a.label })), 'random')}
      ${renderSelectorGroup('Tier', 'tier', tierOptions, 'Novice')}
      ${renderDisabledSelector('Class', 'Coming in V2')}
    `;

    elements.selectors.innerHTML = html;

    // Add click handlers to selector options
    elements.selectors.querySelectorAll('.selector-option:not(.disabled)').forEach(option => {
      option.addEventListener('click', handleSelectorClick);
    });
  }

  async function setRandomGeneratorFaces() {
    if (!elements.generatorFaceLeft || !elements.generatorFaceRight) {
      return;
    }

    const faces = await DataLoader.getFaces();
    if (!faces || faces.length === 0) {
      return;
    }

    const left = faces[Math.floor(Math.random() * faces.length)];
    let right = faces[Math.floor(Math.random() * faces.length)];
    if (faces.length > 1) {
      let guard = 0;
      while (right === left && guard < 5) {
        right = faces[Math.floor(Math.random() * faces.length)];
        guard++;
      }
    }

    elements.generatorFaceLeft.src = `data/${left}`;
    elements.generatorFaceRight.src = `data/${right}`;
  }

  /**
   * Render a single selector group
   */
  function renderSelectorGroup(label, name, options, defaultValue = 'random') {
    const optionsHtml = options.map(opt => {
      const value = typeof opt === 'object' ? opt.value : opt;
      const displayLabel = typeof opt === 'object' ? opt.label : opt;
      const selectedClass = value === defaultValue ? ' selected' : '';
      return `<button class="selector-option${selectedClass}" data-selector="${name}" data-value="${value}">${displayLabel}</button>`;
    }).join('');

    const randomSelected = defaultValue === 'random' ? ' selected' : '';

    return `
      <div class="selector-group">
        <span class="selector-label">${label}</span>
        <div class="selector-options">
          <button class="selector-option${randomSelected}" data-selector="${name}" data-value="random">Random</button>
          ${optionsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Render a disabled selector (for V2 features)
   */
  function renderDisabledSelector(label, message) {
    return `
      <div class="selector-group">
        <span class="selector-label">${label}</span>
        <div class="selector-options">
          <button class="selector-option disabled" disabled>${message}</button>
        </div>
      </div>
    `;
  }

  /**
   * Handle selector option click
   */
  function handleSelectorClick(e) {
    const option = e.target;
    const selector = option.dataset.selector;
    const value = option.dataset.value;

    // Update visual state
    const group = option.closest('.selector-group');
    group.querySelectorAll('.selector-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    option.classList.add('selected');

    // Update criteria
    if (value === 'random') {
      generatorCriteria[selector] = 'random';
    } else if (selector === 'race') {
      // Store race as object with id and label
      const label = option.textContent;
      generatorCriteria[selector] = { id: value, label: label };
    } else {
      generatorCriteria[selector] = value;
    }
  }

  /**
   * Handle generate button click
   */
  async function handleGenerate() {
    elements.btnGenerate.disabled = true;
    elements.btnGenerate.textContent = 'Generating...';

    try {
      const keepNotes = currentScreen === 'result';
      const notesSnapshot = keepNotes && elements.resultNotes ? elements.resultNotes.value : '';

      currentNpc = await Generator.generate(generatorCriteria);
      currentNpc.notes = keepNotes ? notesSnapshot : '';
      await renderResult(currentNpc);
      showScreen('result');
    } catch (error) {
      console.error('Generation error:', error);
      showToast('Failed to generate NPC. Please try again.');
    } finally {
      elements.btnGenerate.disabled = false;
      elements.btnGenerate.textContent = 'Generate';
    }
  }

  /**
   * Set up result screen
   */
  function setupResultScreen() {
    elements.btnBack.addEventListener('click', () => {
      showScreen('generator');
    });

    elements.btnRegenerate.addEventListener('click', handleGenerate);

    elements.btnCopy.addEventListener('click', () => {
      copyToClipboard(currentNpc);
    });

    elements.btnSave.addEventListener('click', () => {
      saveCurrentNpc();
    });

    elements.resultAbilityRolls.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!currentNpc) return;
        const ability = button.dataset.ability;
        if (!ability) return;
        rollSavingThrow(currentNpc, ability);
      });
    });

    bindStatSelectors(
      elements.resultArchetypeSelect,
      elements.resultTierSelect,
      null,
      null,
      () => currentNpc,
      (archetype, tier) => {
        generatorCriteria.archetype = archetype;
        generatorCriteria.tier = tier;
      }
    );

    const saveResultNotes = debounce(() => {
      if (!currentNpc) return;
      currentNpc.notes = elements.resultNotes.value || '';
      if (Storage.exists(currentNpc.id)) {
        Storage.save(currentNpc);
      }
    }, 300);

    elements.resultNotes.addEventListener('input', saveResultNotes);
  }

  /**
   * Render NPC result
   */
  async function renderResult(npc) {
    await ensureNpcStats(npc, true);
    await renderStatControls(
      elements.resultArchetypeSelect,
      elements.resultTierSelect,
      npc
    );
    setActiveTab(elements.resultTabs, elements.resultTabContents, 'overview');
    elements.resultName.textContent = npc.name;
    elements.resultSummary.innerHTML = renderChips(npc);
    renderStats(elements.resultAbilityMods, elements.resultStatline, elements.resultSaves, npc, elements.resultAc);
    renderStatBlock(elements.resultStatblock, npc);
    elements.resultPhysical.textContent = npc.physicalDescription;
    elements.resultPsych.textContent = npc.psychDescription;
    elements.resultNotes.value = npc.notes || '';

    // Update save button state
    updateSaveButton(npc.id);
  }

  /**
   * Render summary chips
   */
  function renderChips(npc) {
    return `
      <span class="chip">${npc.sex}</span>
      <span class="chip">${npc.race}</span>
      <span class="chip">${npc.alignment}</span>
    `;
  }

  /**
   * Update save button state
   */
  function updateSaveButton(npcId) {
    const isSaved = Storage.exists(npcId);

    if (isSaved) {
      elements.btnSave.textContent = 'Saved';
      elements.btnSave.classList.add('btn-saved');
      elements.btnSave.classList.remove('btn-primary');
    } else {
      elements.btnSave.textContent = 'Save';
      elements.btnSave.classList.remove('btn-saved');
      elements.btnSave.classList.add('btn-primary');
    }
  }

  /**
   * Save current NPC
   */
  function saveCurrentNpc() {
    if (!currentNpc) return;

    currentNpc.notes = elements.resultNotes.value || '';

    // Check if already saved
    if (Storage.exists(currentNpc.id)) {
      showToast('NPC already saved');
      return;
    }

    // Check capacity
    if (Storage.isFull()) {
      showModal(
        'Library Full',
        `You've reached the maximum of ${Storage.getMaxCapacity()} NPCs. Please delete some NPCs to save new ones.`,
        null // No confirm action, just informational
      );
      return;
    }

    const result = Storage.save(currentNpc);

    if (result.success) {
      showToast('NPC saved to library');
      updateSaveButton(currentNpc.id);
    } else {
      showToast(result.error || 'Failed to save NPC');
    }
  }

  // Scenario state
  let editingScenario = null;
  let pickerSource = 'srd'; // 'srd' | 'npc'
  let cachedScenarioMonsters = null;
  let autosaveActive = false;
  let autosaveTimer = null;

  const RARITIES = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];
  const AUTOSAVE_DELAY_MS = 500;

  function setupScenariosScreen() {
    const openNew = () => openScenarioDetail(null);
    if (elements.btnNewScenario) elements.btnNewScenario.addEventListener('click', openNew);
    if (elements.btnNewScenarioEmpty) elements.btnNewScenarioEmpty.addEventListener('click', openNew);
    if (elements.btnBackScenario) {
      elements.btnBackScenario.addEventListener('click', () => {
        showScreen('scenarios');
        renderScenarioList();
      });
    }

    // Click and change delegation on the single scenario view
    if (elements.scenarioView) {
      elements.scenarioView.addEventListener('click', handleScenarioViewClick);
      elements.scenarioView.addEventListener('change', handleScenarioViewChange);
    }

    setupItemEditor();
    setupEnemyPicker();
  }

  function renderScenarioList() {
    const scenarios = Scenarios.getAll();

    if (scenarios.length === 0) {
      elements.scenarioList.classList.add('hidden');
      elements.scenarioEmpty.classList.remove('hidden');
      return;
    }

    elements.scenarioList.classList.remove('hidden');
    elements.scenarioEmpty.classList.add('hidden');

    elements.scenarioList.innerHTML = scenarios.map(s => {
      const meta = [
        s.players && `${escapeHtml(s.players)} players`,
        s.level && `Level ${escapeHtml(s.level)}`,
        s.duration && escapeHtml(s.duration),
        s.campaign && escapeHtml(s.campaign)
      ].filter(Boolean).join(' &middot; ');
      const title = s.title ? escapeHtml(s.title) : '<em>Untitled scenario</em>';
      return `
        <div class="npc-card scenario-card" data-scenario-id="${s.id}">
          <div class="npc-card-content">
            <div class="npc-card-name">${title}</div>
            ${meta ? `<div class="npc-card-meta">${meta}</div>` : ''}
          </div>
          <button class="npc-card-delete" data-scenario-id="${s.id}" aria-label="Delete scenario">Delete</button>
          <span class="npc-card-arrow">&rsaquo;</span>
        </div>
      `;
    }).join('');

    elements.scenarioList.querySelectorAll('.scenario-card').forEach(card => {
      card.addEventListener('click', () => openScenarioDetail(card.dataset.scenarioId));
    });

    elements.scenarioList.querySelectorAll('.npc-card-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.dataset.scenarioId;
        const sc = Scenarios.getById(sid);
        if (!sc) return;
        showModal(
          'Delete scenario',
          `Delete "${sc.title || 'this scenario'}"? This cannot be undone.`,
          () => {
            Scenarios.remove(sid);
            showToast('Scenario deleted');
            renderScenarioList();
          }
        );
      });
    });
  }

  async function openScenarioDetail(scenarioId) {
    if (scenarioId) {
      const existing = Scenarios.getById(scenarioId);
      if (!existing) {
        showToast('Scenario not found');
        return;
      }
      editingScenario = existing;
      autosaveActive = true;
    } else {
      editingScenario = Scenarios.createEmptyScenario();
      autosaveActive = false;
    }
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
    if (!cachedScenarioMonsters) {
      cachedScenarioMonsters = await getMonsters();
    }
    elements.scenarioDetailHeading.textContent = editingScenario.title || 'New Scenario';
    showScreen('scenarioDetail');
    updateNavigation('scenarioDetail');
    void renderScenarioView();
    setAutosaveIndicator(autosaveActive ? 'saved' : 'idle');
  }

  function lookupEnemyInfo(enemy) {
    if (!enemy) return null;
    if (enemy.sourceType === 'srd') {
      const monster = (cachedScenarioMonsters || []).find(m => m.name === enemy.sourceId);
      if (!monster) return null;
      return {
        name: monster.name,
        kindLabel: 'SRD',
        cr: monster.challenge_rating !== undefined ? String(monster.challenge_rating) : '',
        profile: buildMonsterProfile(monster)
      };
    }
    if (enemy.sourceType === 'npc') {
      const npc = Storage.getById(enemy.sourceId);
      if (!npc) return null;
      return {
        name: npc.name,
        kindLabel: 'NPC',
        cr: npc.cr !== undefined ? String(npc.cr) : '',
        profile: npc
      };
    }
    return null;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeAttr(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---- Enemy picker ----

  function setupEnemyPicker() {
    if (!elements.enemyPickerModal) return;

    elements.enemyPickerTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        pickerSource = tab.dataset.source;
        elements.enemyPickerTabs.forEach(t => t.classList.toggle('active', t === tab));
        renderEnemyPickerList();
      });
    });

    elements.enemyPickerSearch.addEventListener('input', renderEnemyPickerList);
    elements.btnEnemyPickerClose.addEventListener('click', hideEnemyPicker);

    const backdrop = elements.enemyPickerModal.querySelector('.modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', hideEnemyPicker);

    elements.enemyPickerList.addEventListener('click', (e) => {
      const item = e.target.closest('[data-pick-id]');
      if (!item) return;
      addEnemyToDraft(item.dataset.pickType, item.dataset.pickId);
    });
  }

  async function openEnemyPicker() {
    if (!editingItem || editingItem.type !== 'combat') return;
    pickerSource = 'srd';
    if (!cachedScenarioMonsters) cachedScenarioMonsters = await getMonsters();
    elements.enemyPickerSearch.value = '';
    elements.enemyPickerTabs.forEach(t => t.classList.toggle('active', t.dataset.source === 'srd'));
    renderEnemyPickerList();
    elements.enemyPickerModal.classList.remove('hidden');
  }

  function hideEnemyPicker() {
    elements.enemyPickerModal.classList.add('hidden');
  }

  function renderEnemyPickerList() {
    const query = (elements.enemyPickerSearch.value || '').trim().toLowerCase();
    let items;
    if (pickerSource === 'srd') {
      items = (cachedScenarioMonsters || [])
        .filter(m => !query || m.name.toLowerCase().includes(query))
        .slice(0, 100)
        .map(m => ({
          type: 'srd',
          id: m.name,
          name: m.name,
          sub: `${formatMonsterTypeLine(m)} · CR ${m.challenge_rating !== undefined ? m.challenge_rating : '0'}`
        }));
    } else {
      items = Storage.getAll()
        .filter(n => !query || (n.name || '').toLowerCase().includes(query))
        .map(n => ({
          type: 'npc',
          id: n.id,
          name: n.name || 'Unnamed NPC',
          sub: [n.race, n.tier, n.archetypeLabel].filter(Boolean).join(' · ') || 'NPC'
        }));
    }

    if (items.length === 0) {
      elements.enemyPickerList.innerHTML = '<div class="picker-empty">No matches</div>';
      return;
    }

    elements.enemyPickerList.innerHTML = items.map(it => `
      <div class="enemy-picker-item" data-pick-type="${it.type}" data-pick-id="${escapeAttr(it.id)}">
        <div class="enemy-picker-item-name">${escapeHtml(it.name)}</div>
        <div class="enemy-picker-item-sub">${escapeHtml(it.sub)}</div>
      </div>
    `).join('');
  }

  function addEnemyToDraft(sourceType, sourceId) {
    if (!editingItem || editingItem.type !== 'combat') return;
    editingItem.draft.enemies.push({
      id: 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      sourceType,
      sourceId,
      count: 1
    });
    hideEnemyPicker();
    renderItemEditorBody();
    showToast('Enemy added');
  }

  // ---- Single scenario view (renders into #scenario-view) ----

  let editingItem = null; // { type, mode, refs, draft }

  async function renderScenarioView() {
    if (!editingScenario) return;
    if (!cachedScenarioMonsters) cachedScenarioMonsters = await getMonsters();

    const s = editingScenario;
    const metaItems = [
      s.players && `${escapeHtml(s.players)} players`,
      s.level && `Level ${escapeHtml(s.level)}`,
      s.duration && escapeHtml(s.duration),
      s.campaign && escapeHtml(s.campaign)
    ].filter(Boolean);

    const tocItems = (s.acts || []).map((act, i) => ({
      id: `act-${act.id}`,
      label: `Act ${i + 1}${act.title ? ` — ${act.title}` : ''}`
    }));

    elements.scenarioView.innerHTML = `
      <article class="scenario-reader">
        <header class="reader-header">
          <button class="affordance-edit affordance-corner" data-action="edit-header" aria-label="Edit info" title="Edit scenario info">&#9998;</button>
          <h1 class="reader-title">${escapeHtml(s.title || 'Untitled scenario')}</h1>
          ${s.subtitle ? `<p class="reader-subtitle">${escapeHtml(s.subtitle)}</p>` : ''}
          ${metaItems.length ? `<div class="reader-meta">${metaItems.join(' &middot; ')}</div>` : ''}
          ${tocItems.length > 1 ? `
            <nav class="reader-toc" aria-label="Acts">
              ${tocItems.map(t => `<a href="#${t.id}" class="reader-toc-item">${escapeHtml(t.label)}</a>`).join('')}
            </nav>
          ` : ''}
        </header>

        ${renderViewTextSection('Narrative Context', 'narrative', s.context)}
        ${renderViewTextSection('Scenario Structure', 'structure', s.structure)}
        ${renderViewMagicItems(s.magicItems)}
        ${renderViewActs(s.acts)}

        <div class="add-section-wrap">
          <button class="affordance-add affordance-add-large" data-action="add-act">+ Add Act</button>
        </div>
      </article>
    `;

    elements.scenarioView.querySelectorAll('.reader-statblock-mount').forEach(mount => {
      renderReaderStatblockInto(mount);
    });

    elements.scenarioView.querySelectorAll('.reader-toc-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
        const target = document.getElementById(targetId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function renderViewTextSection(heading, type, text) {
    const hasText = text && text.trim();
    return `
      <section class="reader-section">
        <header class="reader-section-header">
          <h2 class="reader-section-heading">${heading}</h2>
          <button class="affordance-edit" data-action="edit-${type}" aria-label="Edit ${heading.toLowerCase()}" title="Edit">&#9998;</button>
        </header>
        ${hasText
          ? `<div class="reader-prose">${formatMultilineText(text)}</div>`
          : `<button class="affordance-add" data-action="edit-${type}">+ Add ${heading.toLowerCase()}</button>`
        }
      </section>
    `;
  }

  function renderViewMagicItems(items) {
    const hasItems = items && items.length > 0;
    return `
      <section class="reader-section">
        <header class="reader-section-header">
          <h2 class="reader-section-heading">Magic Items</h2>
          <button class="affordance-add" data-action="add-magic-item">+ Add</button>
        </header>
        ${hasItems
          ? `<ul class="reader-items">${items.map(item => `
              <li class="reader-item" data-item-id="${item.id}">
                <div class="reader-item-header">
                  <span class="reader-item-name">${escapeHtml(item.name || 'Unnamed item')}</span>
                  ${item.rarity ? `<span class="rarity-badge rarity-${item.rarity.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(item.rarity)}</span>` : ''}
                  <span class="affordance-inline">
                    <button class="affordance-edit" data-action="edit-magic-item" aria-label="Edit" title="Edit">&#9998;</button>
                    <button class="affordance-delete" data-action="delete-magic-item" aria-label="Delete" title="Delete">&times;</button>
                  </span>
                </div>
                ${item.description ? `<div class="reader-item-description">${formatMultilineText(item.description)}</div>` : ''}
              </li>
            `).join('')}</ul>`
          : `<div class="reader-empty-hint">No magic items yet.</div>`
        }
      </section>
    `;
  }

  function renderViewActs(acts) {
    if (!acts || acts.length === 0) return '';
    return acts.map((act, i) => `
      <section class="reader-act" id="act-${act.id}" data-act-id="${act.id}">
        <header class="reader-act-header">
          <h2 class="reader-act-heading">Act ${i + 1}${act.title ? ` — ${escapeHtml(act.title)}` : ''}</h2>
          <span class="affordance-inline">
            <button class="affordance-edit" data-action="edit-act" aria-label="Edit act" title="Edit">&#9998;</button>
            <button class="affordance-delete" data-action="delete-act" aria-label="Delete act" title="Delete">&times;</button>
          </span>
        </header>
        ${act.description ? `<div class="reader-prose reader-act-description">${formatMultilineText(act.description)}</div>` : ''}
        ${act.scenes.map((scene, j) => renderViewScene(scene, j + 1)).join('')}
        <div class="add-section-wrap nested">
          <button class="affordance-add" data-action="add-scene">+ Add Scene</button>
        </div>
      </section>
    `).join('');
  }

  function renderViewScene(scene, idx) {
    return `
      <section class="reader-scene" data-scene-id="${scene.id}">
        <header class="reader-scene-header">
          <h3 class="reader-scene-heading"><span class="reader-scene-marker">▸</span> Scene ${idx}${scene.title ? ` — ${escapeHtml(scene.title)}` : ''}</h3>
          <span class="affordance-inline">
            <button class="affordance-edit" data-action="edit-scene" aria-label="Edit scene" title="Edit">&#9998;</button>
            <button class="affordance-delete" data-action="delete-scene" aria-label="Delete scene" title="Delete">&times;</button>
          </span>
        </header>
        ${scene.content ? `<div class="reader-prose">${formatMultilineText(scene.content)}</div>` : ''}
        ${scene.combats.map((combat, k) => renderViewCombat(combat, k + 1)).join('')}
        <div class="add-section-wrap nested">
          <button class="affordance-add" data-action="add-combat">+ Add Combat</button>
        </div>
      </section>
    `;
  }

  function renderViewCombat(combat, idx) {
    const enemiesHtml = combat.enemies.length === 0
      ? '<div class="reader-empty">No enemies defined.</div>'
      : combat.enemies.map(enemy => renderReaderEnemyBlock(enemy)).join('');
    return `
      <section class="reader-combat" data-combat-id="${combat.id}">
        <header class="reader-combat-header">
          <h4 class="reader-combat-heading"><span class="reader-combat-marker">&#9876;</span> Combat${combat.name ? ` — ${escapeHtml(combat.name)}` : ''}</h4>
          <span class="affordance-inline">
            <button class="affordance-edit" data-action="edit-combat" aria-label="Edit combat" title="Edit">&#9998;</button>
            <button class="affordance-delete" data-action="delete-combat" aria-label="Delete combat" title="Delete">&times;</button>
          </span>
        </header>
        ${combat.description ? `<div class="reader-prose reader-combat-description">${formatMultilineText(combat.description)}</div>` : ''}
        ${enemiesHtml}
      </section>
    `;
  }

  function renderReaderEnemyBlock(enemy) {
    const info = lookupEnemyInfo(enemy);
    const fallbackLabel = info ? escapeAttr(info.name) : escapeAttr(enemy.sourceId || 'Unknown');
    const maxHp = info && info.profile ? (info.profile.hitPoints || 0) : 0;
    const showTrackers = info && maxHp > 0 && enemy.count > 0;
    if (showTrackers) ensureHpInitialized(enemy, maxHp);
    return `
      <div class="reader-enemy" data-enemy-id="${enemy.id}" data-source-type="${enemy.sourceType}" data-source-id="${escapeAttr(enemy.sourceId)}" data-enemy-count="${enemy.count || 1}" data-enemy-label="${fallbackLabel}">
        ${showTrackers ? renderHpTrackers(enemy, maxHp) : ''}
        <div class="reader-statblock-mount"></div>
      </div>
    `;
  }

  function ensureHpInitialized(enemy, maxHp) {
    if (!Array.isArray(enemy.currentHp)) enemy.currentHp = [];
    while (enemy.currentHp.length < enemy.count) {
      enemy.currentHp.push(maxHp);
    }
    if (enemy.currentHp.length > enemy.count) {
      enemy.currentHp.length = enemy.count;
    }
  }

  function renderHpTrackers(enemy, maxHp) {
    const showInstanceLabels = enemy.count > 1;
    const rows = [];
    for (let i = 0; i < enemy.count; i++) {
      const hp = Math.max(0, Math.min(maxHp, enemy.currentHp[i] != null ? enemy.currentHp[i] : maxHp));
      enemy.currentHp[i] = hp;
      const pct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
      const dead = hp <= 0;
      const fillClass = pct < 33 ? 'danger' : pct < 66 ? 'warning' : '';
      rows.push(`
        <div class="hp-tracker${dead ? ' dead' : ''}" data-instance="${i}">
          ${showInstanceLabels ? `<span class="hp-instance-label">#${i + 1}</span>` : ''}
          <div class="hp-bar"><div class="hp-bar-fill ${fillClass}" style="width: ${pct}%;"></div></div>
          <span class="hp-value">
            <input type="number" min="0" max="${maxHp}" class="hp-input" data-action="hp-set" value="${hp}" aria-label="Current HP">
            <span class="hp-max">/ ${maxHp}</span>
          </span>
          ${dead
            ? `<button class="hp-revive-btn" data-action="hp-revive">Revive</button>`
            : `<span class="hp-buttons">
                <button class="hp-btn hp-btn-damage" data-action="hp-adjust" data-delta="-5">-5</button>
                <button class="hp-btn hp-btn-damage" data-action="hp-adjust" data-delta="-1">-1</button>
                <button class="hp-btn hp-btn-heal" data-action="hp-adjust" data-delta="+1">+1</button>
                <button class="hp-btn hp-btn-heal" data-action="hp-adjust" data-delta="+5">+5</button>
              </span>`
          }
        </div>
      `);
    }
    return `<div class="hp-trackers">${rows.join('')}</div>`;
  }

  function findEnemyFromEl(enemyEl) {
    if (!enemyEl) return null;
    const combatEl = enemyEl.closest('[data-combat-id]');
    const sceneEl = enemyEl.closest('[data-scene-id]');
    const actEl = enemyEl.closest('[data-act-id]');
    if (!combatEl || !sceneEl || !actEl) return null;
    const act = editingScenario.acts.find(a => a.id === actEl.dataset.actId);
    const scene = act && act.scenes.find(s => s.id === sceneEl.dataset.sceneId);
    const combat = scene && scene.combats.find(c => c.id === combatEl.dataset.combatId);
    return combat && combat.enemies.find(en => en.id === enemyEl.dataset.enemyId);
  }

  // ---- Click handler for the view (event delegation) ----

  function handleScenarioViewClick(e) {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const actEl = button.closest('[data-act-id]');
    const sceneEl = button.closest('[data-scene-id]');
    const combatEl = button.closest('[data-combat-id]');
    const itemEl = button.closest('[data-item-id]');
    const refs = {};
    if (actEl) refs.actId = actEl.dataset.actId;
    if (sceneEl) refs.sceneId = sceneEl.dataset.sceneId;
    if (combatEl) refs.combatId = combatEl.dataset.combatId;
    if (itemEl) refs.itemId = itemEl.dataset.itemId;

    switch (action) {
      case 'edit-header':       openItemEditor('header', {}, 'edit'); break;
      case 'edit-narrative':    openItemEditor('narrative', {}, 'edit'); break;
      case 'edit-structure':    openItemEditor('structure', {}, 'edit'); break;
      case 'add-magic-item':    openItemEditor('magic-item', {}, 'create'); break;
      case 'edit-magic-item':   openItemEditor('magic-item', refs, 'edit'); break;
      case 'delete-magic-item': confirmDeleteItem('magic-item', refs); break;
      case 'add-act':           openItemEditor('act', {}, 'create'); break;
      case 'edit-act':          openItemEditor('act', refs, 'edit'); break;
      case 'delete-act':        confirmDeleteItem('act', refs); break;
      case 'add-scene':         openItemEditor('scene', refs, 'create'); break;
      case 'edit-scene':        openItemEditor('scene', refs, 'edit'); break;
      case 'delete-scene':      confirmDeleteItem('scene', refs); break;
      case 'add-combat':        openItemEditor('combat', refs, 'create'); break;
      case 'edit-combat':       openItemEditor('combat', refs, 'edit'); break;
      case 'delete-combat':     confirmDeleteItem('combat', refs); break;
      case 'hp-adjust':         handleHpAdjust(button); break;
      case 'hp-revive':         handleHpRevive(button); break;
      case 'hp-reset':          handleHpReset(button); break;
    }
  }

  function handleHpAdjust(button) {
    const enemyEl = button.closest('[data-enemy-id]');
    const trackerEl = button.closest('[data-instance]');
    if (!enemyEl || !trackerEl) return;
    const enemy = findEnemyFromEl(enemyEl);
    if (!enemy) return;
    const info = lookupEnemyInfo(enemy);
    const maxHp = info && info.profile ? (info.profile.hitPoints || 0) : 0;
    if (!maxHp) return;
    const idx = parseInt(trackerEl.dataset.instance, 10);
    const delta = parseInt(button.dataset.delta, 10) || 0;
    ensureHpInitialized(enemy, maxHp);
    enemy.currentHp[idx] = Math.max(0, Math.min(maxHp, (enemy.currentHp[idx] || 0) + delta));
    editingScenario.updatedAt = new Date().toISOString();
    scheduleAutosave();
    void renderScenarioView();
  }

  function handleHpRevive(button) {
    const enemyEl = button.closest('[data-enemy-id]');
    const trackerEl = button.closest('[data-instance]');
    if (!enemyEl || !trackerEl) return;
    const enemy = findEnemyFromEl(enemyEl);
    if (!enemy) return;
    const info = lookupEnemyInfo(enemy);
    const maxHp = info && info.profile ? (info.profile.hitPoints || 0) : 0;
    if (!maxHp) return;
    const idx = parseInt(trackerEl.dataset.instance, 10);
    ensureHpInitialized(enemy, maxHp);
    enemy.currentHp[idx] = maxHp;
    editingScenario.updatedAt = new Date().toISOString();
    scheduleAutosave();
    void renderScenarioView();
  }

  function handleHpReset(button) {
    const enemyEl = button.closest('[data-enemy-id]');
    if (!enemyEl) return;
    const enemy = findEnemyFromEl(enemyEl);
    if (!enemy) return;
    const info = lookupEnemyInfo(enemy);
    const maxHp = info && info.profile ? (info.profile.hitPoints || 0) : 0;
    if (!maxHp) return;
    enemy.currentHp = Array(enemy.count).fill(maxHp);
    editingScenario.updatedAt = new Date().toISOString();
    scheduleAutosave();
    void renderScenarioView();
  }

  function handleScenarioViewChange(e) {
    const target = e.target;
    if (target.dataset.action !== 'hp-set') return;
    const enemyEl = target.closest('[data-enemy-id]');
    const trackerEl = target.closest('[data-instance]');
    if (!enemyEl || !trackerEl) return;
    const enemy = findEnemyFromEl(enemyEl);
    if (!enemy) return;
    const info = lookupEnemyInfo(enemy);
    const maxHp = info && info.profile ? (info.profile.hitPoints || 0) : 0;
    if (!maxHp) return;
    const idx = parseInt(trackerEl.dataset.instance, 10);
    const value = parseInt(target.value, 10);
    if (isNaN(value)) return;
    ensureHpInitialized(enemy, maxHp);
    enemy.currentHp[idx] = Math.max(0, Math.min(maxHp, value));
    editingScenario.updatedAt = new Date().toISOString();
    scheduleAutosave();
    void renderScenarioView();
  }

  function findItem(type, refs) {
    switch (type) {
      case 'header': return editingScenario;
      case 'narrative': return { value: editingScenario.context || '' };
      case 'structure': return { value: editingScenario.structure || '' };
      case 'magic-item': return editingScenario.magicItems.find(i => i.id === refs.itemId);
      case 'act': return editingScenario.acts.find(a => a.id === refs.actId);
      case 'scene': {
        const act = editingScenario.acts.find(a => a.id === refs.actId);
        return act && act.scenes.find(s => s.id === refs.sceneId);
      }
      case 'combat': {
        const act = editingScenario.acts.find(a => a.id === refs.actId);
        const scene = act && act.scenes.find(s => s.id === refs.sceneId);
        return scene && scene.combats.find(c => c.id === refs.combatId);
      }
    }
    return null;
  }

  function confirmDeleteItem(type, refs) {
    const item = findItem(type, refs);
    if (!item) return;
    const label = item.title || item.name || `this ${type}`;
    showModal(
      `Delete ${type.replace('-', ' ')}`,
      `Delete "${label}"? This cannot be undone.`,
      () => {
        deleteItemFromModel(type, refs);
        editingScenario.updatedAt = new Date().toISOString();
        scheduleAutosave();
        void renderScenarioView();
      }
    );
  }

  function deleteItemFromModel(type, refs) {
    switch (type) {
      case 'magic-item':
        editingScenario.magicItems = editingScenario.magicItems.filter(i => i.id !== refs.itemId);
        break;
      case 'act':
        editingScenario.acts = editingScenario.acts.filter(a => a.id !== refs.actId);
        break;
      case 'scene': {
        const act = editingScenario.acts.find(a => a.id === refs.actId);
        if (act) act.scenes = act.scenes.filter(s => s.id !== refs.sceneId);
        break;
      }
      case 'combat': {
        const act = editingScenario.acts.find(a => a.id === refs.actId);
        const scene = act && act.scenes.find(s => s.id === refs.sceneId);
        if (scene) scene.combats = scene.combats.filter(c => c.id !== refs.combatId);
        break;
      }
    }
  }

  // ---- Item editor modal ----

  function setupItemEditor() {
    if (!elements.itemEditorModal) return;

    elements.btnItemEditorCancel.addEventListener('click', closeItemEditor);
    elements.btnItemEditorClose.addEventListener('click', closeItemEditor);
    const backdrop = elements.itemEditorModal.querySelector('.modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeItemEditor);

    elements.btnItemEditorSave.addEventListener('click', handleItemEditorSave);
    elements.btnItemEditorDelete.addEventListener('click', handleItemEditorDelete);

    elements.itemEditorBody.addEventListener('input', handleItemEditorInput);
    elements.itemEditorBody.addEventListener('change', handleItemEditorInput);
    elements.itemEditorBody.addEventListener('click', handleItemEditorBodyClick);
  }

  function openItemEditor(type, refs, mode) {
    let draft;
    if (mode === 'edit') {
      const original = findItem(type, refs);
      if (!original) {
        showToast('Item not found');
        return;
      }
      draft = JSON.parse(JSON.stringify(original));
    } else {
      if (type === 'magic-item') draft = Scenarios.createMagicItem();
      else if (type === 'act') draft = Scenarios.createAct();
      else if (type === 'scene') draft = Scenarios.createScene();
      else if (type === 'combat') draft = Scenarios.createCombat();
      else return;
    }
    editingItem = { type, mode, refs: refs || {}, draft };
    renderItemEditorBody();
    elements.itemEditorModal.classList.remove('hidden');
  }

  function closeItemEditor() {
    elements.itemEditorModal.classList.add('hidden');
    editingItem = null;
  }

  function renderItemEditorBody() {
    if (!editingItem) return;
    const { type, mode, draft } = editingItem;
    let title, body;
    switch (type) {
      case 'header':
        title = 'Edit Scenario Info';
        body = renderHeaderForm(draft);
        break;
      case 'narrative':
        title = 'Edit Narrative Context';
        body = renderTextOnlyForm(draft.value, 'value', 'Set the scene, describe the world state...', 14);
        break;
      case 'structure':
        title = 'Edit Scenario Structure';
        body = renderTextOnlyForm(draft.value, 'value', 'Overview of acts, pacing notes...', 14);
        break;
      case 'magic-item':
        title = mode === 'create' ? 'Add Magic Item' : 'Edit Magic Item';
        body = renderMagicItemForm(draft);
        break;
      case 'act':
        title = mode === 'create' ? 'Add Act' : 'Edit Act';
        body = renderActForm(draft);
        break;
      case 'scene':
        title = mode === 'create' ? 'Add Scene' : 'Edit Scene';
        body = renderSceneForm(draft);
        break;
      case 'combat':
        title = mode === 'create' ? 'Add Combat' : 'Edit Combat';
        body = renderCombatForm(draft);
        break;
    }
    elements.itemEditorTitle.textContent = title;
    elements.itemEditorBody.innerHTML = body;
    const canDelete = mode === 'edit' && ['magic-item', 'act', 'scene', 'combat'].includes(type);
    elements.btnItemEditorDelete.hidden = !canDelete;
  }

  function handleItemEditorInput(e) {
    if (!editingItem) return;
    const target = e.target;
    const field = target.dataset.field;
    if (!field) return;

    // Enemy count input within a combat form
    if (field === 'count') {
      const enemyEl = target.closest('[data-enemy-id]');
      if (!enemyEl || !editingItem.draft.enemies) return;
      const enemy = editingItem.draft.enemies.find(en => en.id === enemyEl.dataset.enemyId);
      if (enemy) {
        const n = parseInt(target.value, 10);
        enemy.count = isNaN(n) || n < 1 ? 1 : Math.min(99, n);
      }
      return;
    }

    editingItem.draft[field] = target.value;
  }

  function handleItemEditorBodyClick(e) {
    if (!editingItem) return;
    const button = e.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;

    if (action === 'remove-enemy') {
      const enemyEl = button.closest('[data-enemy-id]');
      if (!enemyEl || !editingItem.draft.enemies) return;
      editingItem.draft.enemies = editingItem.draft.enemies.filter(en => en.id !== enemyEl.dataset.enemyId);
      renderItemEditorBody();
    } else if (action === 'add-enemy') {
      void openEnemyPicker();
    }
  }

  function handleItemEditorSave() {
    if (!editingItem) return;
    const { type, mode, refs, draft } = editingItem;

    if (type === 'header' && !(draft.title || '').trim()) {
      showToast('Title cannot be empty');
      return;
    }

    switch (type) {
      case 'header':
        ['title', 'subtitle', 'players', 'level', 'duration', 'campaign'].forEach(f => {
          editingScenario[f] = draft[f] || '';
        });
        elements.scenarioDetailHeading.textContent = editingScenario.title || 'New Scenario';
        break;
      case 'narrative':
        editingScenario.context = draft.value || '';
        break;
      case 'structure':
        editingScenario.structure = draft.value || '';
        break;
      case 'magic-item':
        if (mode === 'create') editingScenario.magicItems.push(draft);
        else {
          const idx = editingScenario.magicItems.findIndex(i => i.id === refs.itemId);
          if (idx !== -1) editingScenario.magicItems[idx] = draft;
        }
        break;
      case 'act':
        if (mode === 'create') editingScenario.acts.push(draft);
        else {
          const idx = editingScenario.acts.findIndex(a => a.id === refs.actId);
          if (idx !== -1) editingScenario.acts[idx] = draft;
        }
        break;
      case 'scene': {
        const act = editingScenario.acts.find(a => a.id === refs.actId);
        if (!act) break;
        if (mode === 'create') act.scenes.push(draft);
        else {
          const idx = act.scenes.findIndex(s => s.id === refs.sceneId);
          if (idx !== -1) act.scenes[idx] = draft;
        }
        break;
      }
      case 'combat': {
        const act = editingScenario.acts.find(a => a.id === refs.actId);
        const scene = act && act.scenes.find(s => s.id === refs.sceneId);
        if (!scene) break;
        if (mode === 'create') scene.combats.push(draft);
        else {
          const idx = scene.combats.findIndex(c => c.id === refs.combatId);
          if (idx !== -1) scene.combats[idx] = draft;
        }
        break;
      }
    }

    editingScenario.updatedAt = new Date().toISOString();

    // First save activates autosave; subsequent saves are debounced
    if (!autosaveActive) {
      const result = Scenarios.save(editingScenario);
      if (result.success) {
        autosaveActive = true;
        setAutosaveIndicator('saved');
      } else {
        setAutosaveIndicator('error', result.error);
        showModal('Save failed', result.error || 'Unknown error', null);
        return;
      }
    } else {
      scheduleAutosave();
    }

    closeItemEditor();
    void renderScenarioView();
  }

  function handleItemEditorDelete() {
    if (!editingItem || editingItem.mode !== 'edit') return;
    const { type, refs } = editingItem;
    closeItemEditor();
    confirmDeleteItem(type, refs);
  }

  // ---- Form renderers ----

  function renderHeaderForm(draft) {
    return `
      <label class="field-row">
        <span class="field-label">Title</span>
        <input type="text" data-field="title" value="${escapeAttr(draft.title)}" placeholder="Scenario title" class="field-input" autofocus>
      </label>
      <label class="field-row">
        <span class="field-label">Subtitle</span>
        <input type="text" data-field="subtitle" value="${escapeAttr(draft.subtitle)}" placeholder="Optional subtitle" class="field-input">
      </label>
      <div class="field-grid">
        <label class="field-row"><span class="field-label">Players</span>
          <input type="text" data-field="players" value="${escapeAttr(draft.players)}" placeholder="e.g. 4-5" class="field-input"></label>
        <label class="field-row"><span class="field-label">Level</span>
          <input type="text" data-field="level" value="${escapeAttr(draft.level)}" placeholder="e.g. 5" class="field-input"></label>
        <label class="field-row"><span class="field-label">Duration</span>
          <input type="text" data-field="duration" value="${escapeAttr(draft.duration)}" placeholder="e.g. 3-4h" class="field-input"></label>
        <label class="field-row"><span class="field-label">Campaign</span>
          <input type="text" data-field="campaign" value="${escapeAttr(draft.campaign)}" placeholder="Campaign name" class="field-input"></label>
      </div>
    `;
  }

  function renderTextOnlyForm(value, field, placeholder, rows) {
    return `
      <textarea data-field="${field}" rows="${rows}" placeholder="${escapeAttr(placeholder)}" class="field-textarea full-height" autofocus>${escapeHtml(value || '')}</textarea>
    `;
  }

  function renderMagicItemForm(draft) {
    const options = ['<option value=""' + (draft.rarity ? '' : ' selected') + '>— Rarity —</option>']
      .concat(RARITIES.map(r => `<option value="${r}"${draft.rarity === r ? ' selected' : ''}>${r}</option>`))
      .join('');
    return `
      <label class="field-row"><span class="field-label">Name</span>
        <input type="text" data-field="name" value="${escapeAttr(draft.name)}" placeholder="Item name" class="field-input" autofocus></label>
      <label class="field-row"><span class="field-label">Rarity</span>
        <select data-field="rarity" class="field-input field-select">${options}</select></label>
      <label class="field-row"><span class="field-label">Description</span>
        <textarea data-field="description" rows="6" placeholder="Description / properties" class="field-textarea">${escapeHtml(draft.description)}</textarea></label>
    `;
  }

  function renderActForm(draft) {
    return `
      <label class="field-row"><span class="field-label">Title</span>
        <input type="text" data-field="title" value="${escapeAttr(draft.title)}" placeholder="Act title" class="field-input" autofocus></label>
      <label class="field-row"><span class="field-label">Description</span>
        <textarea data-field="description" rows="6" placeholder="Act overview / themes" class="field-textarea">${escapeHtml(draft.description)}</textarea></label>
    `;
  }

  function renderSceneForm(draft) {
    return `
      <label class="field-row"><span class="field-label">Title</span>
        <input type="text" data-field="title" value="${escapeAttr(draft.title)}" placeholder="Scene title" class="field-input" autofocus></label>
      <label class="field-row"><span class="field-label">Content</span>
        <textarea data-field="content" rows="12" placeholder="Scene content, beats, NPC notes..." class="field-textarea">${escapeHtml(draft.content)}</textarea></label>
    `;
  }

  function renderCombatForm(draft) {
    const enemiesHtml = draft.enemies.map(enemy => {
      const info = lookupEnemyInfo(enemy);
      const label = info ? escapeHtml(info.name) : '<em>(missing)</em>';
      const sub = info
        ? `${info.kindLabel}${info.cr ? ` &middot; CR ${escapeHtml(info.cr)}` : ''}`
        : 'Reference broken';
      return `
        <div class="enemy-chip" data-enemy-id="${enemy.id}">
          <div class="enemy-chip-info">
            <div class="enemy-chip-name">${label}</div>
            <div class="enemy-chip-sub">${sub}</div>
          </div>
          <label class="enemy-chip-count">
            <span>×</span>
            <input type="number" min="1" max="99" data-field="count" value="${enemy.count || 1}">
          </label>
          <button type="button" class="btn-remove" data-action="remove-enemy" aria-label="Remove enemy">&times;</button>
        </div>
      `;
    }).join('');
    return `
      <label class="field-row"><span class="field-label">Name</span>
        <input type="text" data-field="name" value="${escapeAttr(draft.name)}" placeholder="Combat name" class="field-input" autofocus></label>
      <label class="field-row"><span class="field-label">Description</span>
        <textarea data-field="description" rows="4" placeholder="Terrain, hooks, tactics..." class="field-textarea">${escapeHtml(draft.description)}</textarea></label>
      <div class="field-row">
        <span class="field-label">Enemies</span>
        <div class="enemy-list">${enemiesHtml}</div>
        <button type="button" class="btn btn-tertiary btn-add" data-action="add-enemy">+ Add Enemy</button>
      </div>
    `;
  }

  function renderReaderStatblockInto(mountEl) {
    const enemyEl = mountEl.closest('[data-source-id]');
    if (!enemyEl) return;
    const sourceType = enemyEl.dataset.sourceType;
    const sourceId = enemyEl.dataset.sourceId;
    const info = lookupEnemyInfo({ sourceType, sourceId });

    const count = parseInt(enemyEl.dataset.enemyCount, 10) || 1;
    const fallbackName = enemyEl.dataset.enemyLabel || 'Unknown';
    const nameLabel = info ? escapeHtml(info.name) : escapeHtml(fallbackName);
    const countLabel = count > 1 ? ` &times; ${count}` : '';
    const crLabel = info && info.cr ? `CR ${escapeHtml(String(info.cr))}` : '';
    const maxHp = info && info.profile ? (info.profile.hitPoints || 0) : 0;
    const showReset = info && maxHp > 0 && count > 0;

    if (!info) {
      mountEl.innerHTML = `
        <div class="reader-sb reader-sb-missing">
          <div class="reader-sb-header">
            <span class="reader-sb-name">${nameLabel}${countLabel}</span>
            <span class="reader-sb-header-right">
              <span class="reader-sb-cr reader-sb-cr-missing">Source removed</span>
            </span>
          </div>
        </div>
      `;
      return;
    }

    const uid = 'sb_' + Math.random().toString(36).slice(2, 10);
    mountEl.innerHTML = `
      <div class="reader-sb">
        <div class="reader-sb-header">
          <span class="reader-sb-name">${nameLabel}${countLabel}</span>
          <span class="reader-sb-header-right">
            ${crLabel ? `<span class="reader-sb-cr">${crLabel}</span>` : ''}
            ${showReset ? `<button class="hp-reset-btn reader-sb-reset" data-action="hp-reset" title="Reset all HP">&#x21BB;</button>` : ''}
          </span>
        </div>
        <div class="reader-sb-strip">
          <div class="reader-sb-stat"><span class="sb-label">AC</span><span id="${uid}-ac" class="sb-val">—</span></div>
          <div class="reader-sb-stat"><span class="sb-label">HP</span><span id="${uid}-hp" class="sb-val">—</span></div>
          <div class="reader-sb-stat"><span class="sb-label">Speed</span><span id="${uid}-speed" class="sb-val">—</span></div>
          <div class="reader-sb-stat"><span class="sb-label">Init</span><span id="${uid}-init" class="sb-val">—</span></div>
        </div>
        <div id="${uid}-abilities" class="reader-sb-abilities"></div>
        <div id="${uid}-meta" class="reader-sb-meta"></div>
        <div class="reader-sb-sections">
          <div class="reader-sb-section"><h2>Traits</h2><div id="${uid}-traits" class="statblock-list"></div></div>
          <div class="reader-sb-section"><h2>Actions</h2><div id="${uid}-actions" class="statblock-list"></div></div>
          <div class="reader-sb-section hidden" id="${uid}-spells-section">
            <div class="reader-sb-section-header"><h2>Spells</h2><button id="${uid}-spells-toggle" class="statblock-toggle" type="button"></button></div>
            <div id="${uid}-spells" class="statblock-list"></div>
          </div>
          <div class="reader-sb-section"><h2>Reactions</h2><div id="${uid}-reactions" class="statblock-list"></div></div>
        </div>
      </div>
    `;

    const target = {
      key: uid,
      ac: document.getElementById(uid + '-ac'),
      hp: document.getElementById(uid + '-hp'),
      speed: document.getElementById(uid + '-speed'),
      init: document.getElementById(uid + '-init'),
      abilities: null,
      meta: document.getElementById(uid + '-meta'),
      traits: document.getElementById(uid + '-traits'),
      actions: document.getElementById(uid + '-actions'),
      spellsSection: document.getElementById(uid + '-spells-section'),
      spellsToggle: document.getElementById(uid + '-spells-toggle'),
      spells: document.getElementById(uid + '-spells'),
      reactions: document.getElementById(uid + '-reactions')
    };

    renderStatBlock(target, info.profile);
    renderCompactAbilityGrid(document.getElementById(uid + '-abilities'), info.profile);
  }

  function renderCompactAbilityGrid(container, npc) {
    if (!container || !npc) return;
    const tier = npc.tier || 'Novice';
    const tierInfo = Generator.getTierInfo(tier);
    const pb = npc.proficiencyBonus || tierInfo.pb;
    const mods = getAbilityMods(npc);
    const scores = npc.abilityScores || {};
    const saves = npc.savingThrows || computeSavingThrows(mods, npc.savingThrowProficiencies || [], pb);
    const saveProfs = new Set(npc.savingThrowProficiencies || []);

    const cols = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(key => {
      const score = scores[key] !== undefined ? scores[key] : 10;
      const mod = mods[key] !== undefined ? mods[key] : 0;
      const save = saves[key] !== undefined ? saves[key] : mod;
      const profClass = saveProfs.has(key) ? ' proficient' : '';
      return `
        <div class="reader-sb-ability${profClass}">
          <span class="sb-ab-label">${key}</span>
          <span class="sb-ab-score">${score} <span class="sb-ab-mod">${formatSigned(mod)}</span></span>
          <button class="sb-ab-save${profClass}" type="button" data-ability="${key}" aria-label="${key} saving throw">${formatSigned(save)}</button>
        </div>
      `;
    }).join('');

    container.innerHTML = cols;

    container.querySelectorAll('.sb-ab-save').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        rollSavingThrow(npc, btn.dataset.ability);
      });
    });
  }

  function formatMultilineText(text) {
    if (!text) return '';
    return escapeHtml(text)
      .split(/\n{2,}/)
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  // ---- Autosave ----

  function scheduleAutosave() {
    if (!autosaveActive) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    setAutosaveIndicator('pending');
    autosaveTimer = setTimeout(performAutosave, AUTOSAVE_DELAY_MS);
  }

  function performAutosave() {
    if (!editingScenario) return;
    setAutosaveIndicator('saving');
    const result = Scenarios.save(editingScenario);
    if (result.success) {
      setAutosaveIndicator('saved');
    } else {
      setAutosaveIndicator('error', result.error);
    }
  }

  function setAutosaveIndicator(state, message) {
    const el = document.getElementById('autosave-indicator');
    if (!el) return;
    el.classList.remove('autosave-pending', 'autosave-saving', 'autosave-saved', 'autosave-error', 'autosave-hidden');
    switch (state) {
      case 'pending':
        el.classList.add('autosave-pending');
        el.textContent = '• Unsaved';
        break;
      case 'saving':
        el.classList.add('autosave-saving');
        el.textContent = 'Saving…';
        break;
      case 'saved':
        el.classList.add('autosave-saved');
        el.textContent = '✓ Saved';
        break;
      case 'error':
        el.classList.add('autosave-error');
        el.textContent = message || 'Save failed';
        break;
      default:
        el.classList.add('autosave-hidden');
        el.textContent = '';
    }
  }

  /**
   * Set up library screen
   */
  function setupLibraryScreen() {
    elements.btnGenerateFirst.addEventListener('click', () => {
      showScreen('generator');
      updateNavigation('generator');
    });

    elements.btnBackLibrary.addEventListener('click', () => {
      showScreen('library');
      renderActiveLibrarySection();
    });

    elements.btnCopyDetail.addEventListener('click', () => {
      const npc = Storage.getById(viewingNpcId);
      if (npc) {
        copyToClipboard(npc);
      }
    });

    elements.btnDelete.addEventListener('click', () => {
      const npc = Storage.getById(viewingNpcId);
      if (npc) {
        showModal(
          'Delete NPC',
          `Are you sure you want to delete "${npc.name}"? This cannot be undone.`,
          () => {
            Storage.remove(viewingNpcId);
            showToast('NPC deleted');
            showScreen('library');
            renderActiveLibrarySection();
          }
        );
      }
    });

    setupLibraryTabs();
    setupMonsterFilters();
    setupSpellFilters();
    void prepareSpellIndex();
    void prepareConditionIndex();

    const saveDetailNotes = debounce(() => {
      if (!viewingNpcId) return;
      const npc = Storage.getById(viewingNpcId);
      if (!npc) return;
      npc.notes = elements.detailNotes.value || '';
      Storage.save(npc);
    }, 300);

    elements.detailNotes.addEventListener('input', saveDetailNotes);

    bindStatSelectors(
      elements.detailArchetypeSelect,
      elements.detailTierSelect,
      null,
      null,
      () => (viewingNpcId ? Storage.getById(viewingNpcId) : null),
      null
    );

    elements.detailAbilityRolls.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!viewingNpcId) return;
        const npc = Storage.getById(viewingNpcId);
        if (!npc) return;
        const ability = button.dataset.ability;
        if (!ability) return;
        rollSavingThrow(npc, ability);
      });
    });

    document.addEventListener('click', handleReferenceLinkClick);
  }

  /**
   * Render library list
   */
  function renderLibrary() {
    const npcs = Storage.getAll();

    if (npcs.length === 0) {
      elements.libraryList.classList.add('hidden');
      elements.libraryEmpty.classList.remove('hidden');
      return;
    }

    elements.libraryList.classList.remove('hidden');
    elements.libraryEmpty.classList.add('hidden');

    elements.libraryList.innerHTML = npcs.map(npc => {
      const tierLabel = npc.tier || 'Novice';
      const archetypeLabel = npc.archetypeLabel || formatLabel(npc.archetype) || 'Generalist';
      return `
      <div class="npc-card" data-npc-id="${npc.id}">
        <div class="npc-card-content">
          <div class="npc-card-name">${npc.name}</div>
          <div class="npc-card-meta">${npc.race} &middot; ${npc.alignment} &middot; ${tierLabel} ${archetypeLabel}</div>
        </div>
        <button class="npc-card-delete" data-npc-id="${npc.id}" aria-label="Delete NPC">Delete</button>
        <span class="npc-card-arrow">&rsaquo;</span>
      </div>
    `;
    }).join('');

    // Add click handlers
    elements.libraryList.querySelectorAll('.npc-card').forEach(card => {
      card.addEventListener('click', () => {
        const npcId = card.dataset.npcId;
        void viewNpcDetail(npcId);
      });
    });

    elements.libraryList.querySelectorAll('.npc-card-delete').forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const npcId = button.dataset.npcId;
        const npc = Storage.getById(npcId);
        if (!npc) return;
        showModal(
          'Delete NPC',
          `Are you sure you want to delete "${npc.name}"? This cannot be undone.`,
          () => {
            Storage.remove(npcId);
            showToast('NPC deleted');
            renderLibrary();
          }
        );
      });
    });
  }

  function renderActiveLibrarySection() {
    if (libraryTab === 'monsters') {
      void renderMonsters();
      return;
    }
    if (libraryTab === 'spells') {
      void renderSpells();
      return;
    }
    renderLibrary();
  }

  function setupLibraryTabs() {
    if (!elements.libraryTabs || elements.libraryTabs.length === 0) return;
    elements.libraryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.library;
        setLibraryTab(target);
      });
    });
    setLibraryTab(libraryTab, false);
  }

  function setLibraryTab(target, shouldRender = true) {
    if (!elements.librarySections[target]) return;
    libraryTab = target;
    elements.libraryTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.library === target);
    });
    Object.keys(elements.librarySections).forEach(key => {
      elements.librarySections[key].classList.toggle('active', key === target);
    });
    if (shouldRender) {
      renderActiveLibrarySection();
    }
  }

  function setupMonsterFilters() {
    if (elements.monsterSearch) {
      const trigger = debounce(() => {
        void renderMonsters();
      }, 200);
      elements.monsterSearch.addEventListener('input', trigger);
      elements.monsterSearch.addEventListener('keyup', trigger);
    }
    if (elements.monsterTypeFilter) {
      elements.monsterTypeFilter.addEventListener('change', () => {
        void renderMonsters();
      });
      elements.monsterTypeFilter.addEventListener('input', () => {
        void renderMonsters();
      });
    }
    if (elements.monsterCrMin) {
      elements.monsterCrMin.addEventListener('change', () => {
        void renderMonsters();
      });
    }
    if (elements.monsterCrMax) {
      elements.monsterCrMax.addEventListener('change', () => {
        void renderMonsters();
      });
    }
  }

  function setupSpellFilters() {
    if (elements.spellSearch) {
      elements.spellSearch.addEventListener('input', debounce(() => {
        void renderSpells();
      }, 200));
    }
    if (elements.spellLevelFilter) {
      elements.spellLevelFilter.addEventListener('change', () => {
        void renderSpells();
      });
    }
    if (elements.spellClassFilter) {
      elements.spellClassFilter.addEventListener('change', () => {
        void renderSpells();
      });
    }
  }

  async function renderMonsters() {
    if (!elements.monsterList) return;
    const monsters = await getMonsters();
    ensureMonsterFilters(monsters);

    const search = (elements.monsterSearch ? elements.monsterSearch.value : '').trim().toLowerCase();
    const typeFilter = (elements.monsterTypeFilter ? elements.monsterTypeFilter.value : '').trim().toLowerCase();
    const minValue = elements.monsterCrMin ? parseFloat(elements.monsterCrMin.value) : NaN;
    const maxValue = elements.monsterCrMax ? parseFloat(elements.monsterCrMax.value) : NaN;
    const hasMin = !Number.isNaN(minValue);
    const hasMax = !Number.isNaN(maxValue);

    const filtered = monsters
      .map((monster, index) => ({
        monster,
        index,
        crValue: parseChallengeRating(monster.challenge_rating)
      }))
      .filter(entry => {
        const monster = entry.monster;
        const monsterName = String(monster.name || '').toLowerCase();
        const monsterType = String(monster.type || '').trim().toLowerCase();
        if (search && !monsterName.includes(search)) {
          return false;
        }
        if (typeFilter && monsterType !== typeFilter) {
          return false;
        }
        if (hasMin && entry.crValue < minValue) {
          return false;
        }
        if (hasMax && entry.crValue > maxValue) {
          return false;
        }
        return true;
      });

    if (filtered.length === 0) {
      elements.monsterList.innerHTML = '';
      elements.monsterEmpty.classList.remove('hidden');
      return;
    }

    elements.monsterEmpty.classList.add('hidden');
    elements.monsterList.innerHTML = filtered.map(entry => {
      const monster = entry.monster;
      const meta = `CR ${monster.challenge_rating} &middot; ${formatMonsterTypeLine(monster)}`;
      return `
        <div class="npc-card monster-card" data-monster-index="${entry.index}">
          <div class="npc-card-content">
            <div class="npc-card-name">${monster.name}</div>
            <div class="npc-card-meta">${meta}</div>
          </div>
          <span class="npc-card-arrow">&rsaquo;</span>
        </div>
      `;
    }).join('');

    elements.monsterList.querySelectorAll('.monster-card').forEach(card => {
      card.addEventListener('click', () => {
        const index = Number(card.dataset.monsterIndex);
        const monster = monsters[index];
        if (monster) {
          void viewMonsterDetail(monster);
        }
      });
    });
  }

  async function renderSpells() {
    if (!elements.spellList) return;
    const spells = await getSpells();
    ensureSpellFilters(spells);

    const search = (elements.spellSearch ? elements.spellSearch.value : '').trim().toLowerCase();
    const levelFilter = elements.spellLevelFilter ? elements.spellLevelFilter.value : '';
    const classFilter = elements.spellClassFilter ? elements.spellClassFilter.value : '';

    const filtered = spells.filter(spell => {
      if (search && !spell.name.toLowerCase().includes(search)) {
        return false;
      }
      if (levelFilter && String(spell.level) !== levelFilter) {
        return false;
      }
      if (classFilter) {
        const classes = Array.isArray(spell.classes) ? spell.classes : [];
        if (!classes.map(cls => toTitleCase(cls)).includes(classFilter)) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      elements.spellList.innerHTML = '';
      elements.spellEmpty.classList.remove('hidden');
      return;
    }

    elements.spellEmpty.classList.add('hidden');
    elements.spellList.innerHTML = filtered.map(spell => {
      const classLabel = (spell.classes && spell.classes.length > 0)
        ? ` &middot; <span class="spell-classes">${spell.classes.map(toTitleCase).join(', ')}</span>`
        : '';
      const meta = `${formatSpellLevel(spell.level)} &middot; ${toTitleCase(spell.school)} &middot; ${toTitleCase(spell.actionType)}${classLabel}`;
      return `
        <div class="npc-card spell-card">
          <div class="npc-card-content">
            <div class="npc-card-name">${spell.name}</div>
            <div class="npc-card-meta">${meta}</div>
          </div>
        </div>
      `;
    }).join('');

    elements.spellList.querySelectorAll('.spell-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        const spell = filtered[index];
        if (spell) {
          showSpellModal(spell);
        }
      });
    });
  }

  /**
   * View NPC detail from library
   */
  async function viewNpcDetail(npcId) {
    const npc = Storage.getById(npcId);
    if (!npc) {
      showToast('NPC not found');
      return;
    }

    viewingNpcId = npcId;
    viewingDetailType = 'npc';
    viewingMonster = null;
    setDetailMode('npc');

    await ensureNpcStats(npc, true);
    await renderStatControls(
      elements.detailArchetypeSelect,
      elements.detailTierSelect,
      npc
    );
    setActiveTab(elements.detailTabs, elements.detailTabContents, 'overview');
    elements.detailName.textContent = npc.name;
    elements.detailSummary.innerHTML = renderChips(npc);
    renderStats(elements.detailAbilityMods, elements.detailStatline, elements.detailSaves, npc, elements.detailAc);
    renderStatBlock(elements.detailStatblock, npc);
    elements.detailPhysical.textContent = npc.physicalDescription;
    elements.detailPsych.textContent = npc.psychDescription;
    elements.detailNotes.value = npc.notes || '';

    showScreen('libraryDetail');
  }

  async function viewMonsterDetail(monster) {
    if (!monster) {
      showToast('Monster not found');
      return;
    }

    viewingNpcId = null;
    viewingMonster = buildMonsterProfile(monster);
    viewingDetailType = 'monster';
    setDetailMode('monster');

    elements.detailName.textContent = monster.name;
    if (elements.detailSummary) elements.detailSummary.innerHTML = '';
    if (elements.detailStatline) elements.detailStatline.textContent = '';
    if (elements.detailSaves) elements.detailSaves.textContent = '';
    if (elements.detailPhysical) elements.detailPhysical.textContent = '';
    if (elements.detailPsych) elements.detailPsych.textContent = '';
    if (elements.detailNotes) elements.detailNotes.value = '';

    renderStatBlock(elements.detailStatblock, viewingMonster);
    showScreen('libraryDetail');
  }

  function setDetailMode(mode) {
    const isNpc = mode === 'npc';
    if (elements.detailControls) {
      elements.detailControls.classList.toggle('hidden', !isNpc);
    }
    if (elements.detailTabsContainer) {
      elements.detailTabsContainer.classList.toggle('hidden', !isNpc);
    }
    if (elements.detailOverviewContent) {
      elements.detailOverviewContent.classList.toggle('hidden', !isNpc);
    }
    if (elements.btnDelete) {
      elements.btnDelete.classList.toggle('hidden', !isNpc);
    }
    if (elements.btnCopyDetail) {
      elements.btnCopyDetail.classList.toggle('hidden', !isNpc);
    }
    if (isNpc) {
      setActiveTab(elements.detailTabs, elements.detailTabContents, 'overview');
    } else {
      setActiveTab(elements.detailTabs, elements.detailTabContents, 'statblock');
    }
  }

  /**
   * Set up modal
   */
  let modalConfirmCallback = null;

  function setupModal() {
    elements.modalCancel.addEventListener('click', hideModal);
    elements.modal.querySelector('.modal-backdrop').addEventListener('click', hideModal);

    elements.modalConfirm.addEventListener('click', () => {
      if (modalConfirmCallback) {
        modalConfirmCallback();
      }
      hideModal();
    });

    if (elements.settingsModal) {
      elements.settingsModal.querySelector('.modal-backdrop').addEventListener('click', hideSettingsModal);
    }
    if (elements.btnClearReload) {
      elements.btnClearReload.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearAppDataAndReload();
      });
    }
  }

  function setupViewTabs() {
    initTabs(elements.resultTabs, elements.resultTabContents);
    initTabs(elements.detailTabs, elements.detailTabContents);
  }

  /**
   * Show modal dialog
   */
  function showModal(title, message, onConfirm) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    modalConfirmCallback = onConfirm;

    // Hide confirm button if no callback (informational modal)
    if (onConfirm) {
      elements.modalConfirm.classList.remove('hidden');
      elements.modalCancel.textContent = 'Cancel';
    } else {
      elements.modalConfirm.classList.add('hidden');
      elements.modalCancel.textContent = 'OK';
    }

    elements.modal.classList.remove('hidden');
  }

  /**
   * Hide modal dialog
   */
  function hideModal() {
    elements.modal.classList.add('hidden');
    modalConfirmCallback = null;
  }

  /**
   * Copy NPC to clipboard
   */
  async function copyToClipboard(npc) {
    const text = Generator.formatForClipboard(npc);

    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        showToast('Copied to clipboard');
      } catch (err) {
        showToast('Failed to copy');
      }

      document.body.removeChild(textarea);
    }
  }

  /**
   * Show toast notification
   */
  let toastTimeout = null;

  function showToast(message) {
    // Clear any existing timeout
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    elements.toast.textContent = message;
    elements.toast.classList.remove('hidden');

    // Trigger reflow for animation
    void elements.toast.offsetWidth;
    elements.toast.classList.add('visible');

    toastTimeout = setTimeout(() => {
      elements.toast.classList.remove('visible');
      setTimeout(() => {
        elements.toast.classList.add('hidden');
      }, 300);
    }, 2500);
  }

  let settingsModalOpen = false;

  function showSettingsModal() {
    if (!elements.settingsModal) return;
    elements.settingsModal.classList.remove('hidden');
    settingsModalOpen = true;
    setTimeout(() => {
      document.addEventListener('click', handleSettingsOutsideClick, { once: true });
    }, 0);
  }

  function hideSettingsModal() {
    if (!elements.settingsModal) return;
    elements.settingsModal.classList.add('hidden');
    settingsModalOpen = false;
  }

  function handleSettingsOutsideClick(event) {
    if (!settingsModalOpen) return;
    const content = elements.settingsModal.querySelector('.modal-content');
    if (content && content.contains(event.target)) {
      document.addEventListener('click', handleSettingsOutsideClick, { once: true });
      return;
    }
    hideSettingsModal();
  }

  async function clearAppDataAndReload() {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
    } catch (error) {
      console.warn('Failed to clear app cache:', error);
    } finally {
      window.location.reload();
    }
  }

  function bindStatSelectors(primaryArchetype, primaryTier, secondaryArchetype, secondaryTier, getNpc, onChange) {
    const handleChange = () => {
      const npc = getNpc ? getNpc() : null;
      if (!npc) return;
      const archetype = primaryArchetype ? primaryArchetype.value : (secondaryArchetype ? secondaryArchetype.value : 'random');
      const tier = primaryTier ? primaryTier.value : (secondaryTier ? secondaryTier.value : 'Novice');

      if (secondaryArchetype && secondaryArchetype.value !== archetype) {
        secondaryArchetype.value = archetype;
      }
      if (secondaryTier && secondaryTier.value !== tier) {
        secondaryTier.value = tier;
      }
      if (primaryArchetype && primaryArchetype.value !== archetype) {
        primaryArchetype.value = archetype;
      }
      if (primaryTier && primaryTier.value !== tier) {
        primaryTier.value = tier;
      }

      void applyStatChanges(npc, archetype, tier, true);
      if (onChange) {
        onChange(archetype, tier);
      }
    };

    if (primaryArchetype) primaryArchetype.addEventListener('change', handleChange);
    if (primaryTier) primaryTier.addEventListener('change', handleChange);
    if (secondaryArchetype) secondaryArchetype.addEventListener('change', handleChange);
    if (secondaryTier) secondaryTier.addEventListener('change', handleChange);
  }

  function initTabs(tabs, contents) {
    if (!tabs || !contents) {
      return;
    }
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        setActiveTab(tabs, contents, target);
      });
    });
  }

  function setActiveTab(tabs, contents, target) {
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === target);
    });
    contents.forEach(content => {
      content.classList.toggle('active', content.dataset.tab === target);
    });
  }

  /**
   * Map ability elements by data-ability attribute
   */
  function mapAbilityElements(nodeList) {
    const map = {};
    nodeList.forEach(el => {
      const key = el.dataset.ability;
      if (key) {
        map[key] = el;
      }
    });
    return map;
  }

  /**
   * Render ability mods and stats lines
   */
  function renderStats(abilityMap, statlineEl, savesEl, npc, acEl) {
    const mods = getAbilityMods(npc);
    Object.keys(abilityMap).forEach(key => {
      abilityMap[key].textContent = formatSigned(mods[key]);
    });

    const tier = npc.tier || 'Novice';
    const tierInfo = Generator.getTierInfo(tier);
    const cr = npc.cr || tierInfo.cr;
    const pb = npc.proficiencyBonus || tierInfo.pb;
    const archetypeLabel = npc.archetypeLabel || formatLabel(npc.archetype) || 'Generalist';

    statlineEl.textContent = `Archetype: ${archetypeLabel} \u00b7 Tier: ${tier} \u00b7 CR ${cr} \u00b7 PB ${formatSigned(pb)}`;

    const saveProfs = npc.savingThrowProficiencies || ['STR', 'CON'];
    const savingThrows = npc.savingThrows || computeSavingThrows(mods, saveProfs, pb);
    const saveText = saveProfs.map(key => `${key} ${formatSigned(savingThrows[key])}`).join(', ');
    savesEl.textContent = `Saving Throws: ${saveText}`;

    if (acEl) {
      const acValue = npc.armorClass || computeArmorClassFallback(npc, tier);
      acEl.textContent = acValue;
    }
  }

  async function prepareSpellIndex() {
    if (spellIndex) {
      return;
    }
    try {
      const spells = await getSpells();
      buildSpellIndex(spells);
      refreshReferenceLinks();
    } catch (error) {
      console.warn('Unable to load spells:', error);
    }
  }

  function buildSpellIndex(spells) {
    spellIndex = new Map();
    const names = [];
    spells.forEach(spell => {
      if (!spell || !spell.name) return;
      const key = normalizeSpellKey(spell.name);
      spellIndex.set(key, spell);
      names.push(spell.name);
    });

    spellNames = names.slice();
    updateReferenceRegex();
  }

  async function prepareConditionIndex() {
    if (conditionIndex) {
      return;
    }
    try {
      const conditions = await DataLoader.getConditions();
      buildConditionIndex(conditions);
      refreshReferenceLinks();
    } catch (error) {
      console.warn('Unable to load conditions:', error);
    }
  }

  function buildConditionIndex(conditions) {
    conditionIndex = new Map();
    const names = [];
    conditions.forEach(condition => {
      if (!condition || !condition.name) return;
      const key = normalizeSpellKey(condition.name);
      conditionIndex.set(key, condition);
      names.push(condition.name);
    });
    conditionNames = names.slice();
    updateReferenceRegex();
  }

  function updateReferenceRegex() {
    const combined = [];
    if (spellNames && spellNames.length > 0) {
      combined.push(...spellNames);
    }
    if (conditionNames && conditionNames.length > 0) {
      combined.push(...conditionNames);
    }
    if (combined.length === 0) {
      referenceRegex = null;
      return;
    }
    const escaped = combined
      .sort((a, b) => b.length - a.length)
      .map(name => escapeRegExp(name));
    const pattern = `\\b(${escaped.join('|')})\\b`;
    referenceRegex = new RegExp(pattern, 'gi');
  }

  function refreshReferenceLinks() {
    if (currentNpc) {
      renderStatBlock(elements.resultStatblock, currentNpc);
    }
    if (viewingNpcId) {
      const npc = Storage.getById(viewingNpcId);
      if (npc) {
        renderStatBlock(elements.detailStatblock, npc);
      }
    } else if (viewingMonster) {
      renderStatBlock(elements.detailStatblock, viewingMonster);
    }
  }

  function linkifyText(text) {
    if (!text || !referenceRegex) {
      return text || '';
    }

    return String(text).replace(referenceRegex, match => {
      const key = normalizeSpellKey(match);
      if (spellIndex && spellIndex.has(key)) {
        const safe = escapeAttribute(match);
        return `<button class="spell-link" type="button" data-spell="${safe}">${match}</button>`;
      }
      if (conditionIndex && conditionIndex.has(key)) {
        const safe = escapeAttribute(match);
        return `<button class="condition-link" type="button" data-condition="${safe}">${match}</button>`;
      }
      return match;
    });
  }

  function handleReferenceLinkClick(event) {
    const spellButton = event.target.closest('.spell-link');
    if (spellButton) {
      event.preventDefault();
      event.stopPropagation();
      const spellName = spellButton.dataset.spell;
      if (spellName) {
        void openSpellModalByName(spellName);
      }
      return;
    }

    const conditionButton = event.target.closest('.condition-link');
    if (conditionButton) {
      event.preventDefault();
      event.stopPropagation();
      const conditionName = conditionButton.dataset.condition;
      if (conditionName) {
        void openConditionModalByName(conditionName);
      }
    }
  }

  async function openSpellModalByName(name) {
    if (!spellIndex) {
      await prepareSpellIndex();
    }
    if (!spellIndex) {
      showToast('Spells not loaded yet');
      return;
    }
    const key = normalizeSpellKey(name);
    const spell = spellIndex.get(key);
    if (!spell) {
      showToast('Spell not found');
      return;
    }
    showSpellModal(spell);
  }

  let spellModalOpen = false;

  function showSpellModal(spell) {
    if (!elements.spellModal || !spell) return;
    elements.spellTitle.textContent = spell.name;
    elements.spellMeta.textContent = `${formatSpellLevel(spell.level)} \u00b7 ${toTitleCase(spell.school)}`;

    const details = [];
    details.push(renderSpellDetail('Casting', toTitleCase(spell.actionType)));
    details.push(renderSpellDetail('Range', spell.range || ''));
    details.push(renderSpellDetail('Components', formatComponents(spell.components)));
    details.push(renderSpellDetail('Duration', spell.duration || ''));
    details.push(renderSpellDetail('Concentration', spell.concentration ? 'Yes' : 'No'));
    details.push(renderSpellDetail('Ritual', spell.ritual ? 'Yes' : 'No'));

    if (spell.classes && spell.classes.length > 0) {
      details.push(renderSpellDetail('Classes', spell.classes.map(toTitleCase).join(', ')));
    }

    details.push(`<div class="spell-description">${spell.description || ''}</div>`);

    if (spell.cantripUpgrade) {
      details.push(`<div class="spell-description"><strong>At Higher Levels.</strong> ${spell.cantripUpgrade}</div>`);
    }

    elements.spellDetails.innerHTML = details.join('');

    elements.spellModal.classList.remove('hidden');
    spellModalOpen = true;
    setTimeout(() => {
      document.addEventListener('click', handleSpellOutsideClick, { once: true });
    }, 0);
  }

  function renderSpellDetail(label, value) {
    return `
      <div class="spell-detail">
        <span class="detail-label">${label}</span>
        <span class="detail-value">${value || '-'}</span>
      </div>
    `;
  }

  function handleSpellOutsideClick(event) {
    if (!spellModalOpen) return;
    const content = elements.spellModal.querySelector('.modal-content');
    if (content && content.contains(event.target)) {
      document.addEventListener('click', handleSpellOutsideClick, { once: true });
      return;
    }
    hideSpellModal();
  }

  function hideSpellModal() {
    if (!elements.spellModal) return;
    elements.spellModal.classList.add('hidden');
    spellModalOpen = false;
  }

  let conditionModalOpen = false;

  async function openConditionModalByName(name) {
    if (!conditionIndex) {
      await prepareConditionIndex();
    }
    if (!conditionIndex) {
      showToast('Conditions not loaded yet');
      return;
    }
    const key = normalizeSpellKey(name);
    const condition = conditionIndex.get(key);
    if (!condition) {
      showToast('Condition not found');
      return;
    }
    showConditionModal(condition);
  }

  function showConditionModal(condition) {
    if (!elements.conditionModal || !condition) return;
    elements.conditionTitle.textContent = condition.name;
    elements.conditionDescription.textContent = condition.description || '';

    elements.conditionModal.classList.remove('hidden');
    conditionModalOpen = true;
    setTimeout(() => {
      document.addEventListener('click', handleConditionOutsideClick, { once: true });
    }, 0);
  }

  function handleConditionOutsideClick(event) {
    if (!conditionModalOpen) return;
    const content = elements.conditionModal.querySelector('.modal-content');
    if (content && content.contains(event.target)) {
      document.addEventListener('click', handleConditionOutsideClick, { once: true });
      return;
    }
    hideConditionModal();
  }

  function hideConditionModal() {
    if (!elements.conditionModal) return;
    elements.conditionModal.classList.add('hidden');
    conditionModalOpen = false;
  }

  function formatComponents(components) {
    if (!components || components.length === 0) return '-';
    return components.map(component => component.toUpperCase()).join(', ');
  }

  function normalizeSpellKey(name) {
    return String(name || '').trim().toLowerCase();
  }

  function deriveSpellActions(npc) {
    if (!spellIndex || !referenceRegex) {
      return [];
    }
    const texts = [];
    (npc.traits || []).forEach(item => {
      if (item && item.text) texts.push(item.text);
    });
    (npc.actions || []).forEach(item => {
      if (item && item.text) texts.push(item.text);
    });
    (npc.reactions || []).forEach(item => {
      if (item && item.text) texts.push(item.text);
    });

    const found = new Map();
    texts.forEach(text => {
      if (!text) return;
      const regex = new RegExp(referenceRegex.source, 'gi');
      let match = null;
      while ((match = regex.exec(text)) !== null) {
        const key = normalizeSpellKey(match[0]);
        if (spellIndex.has(key)) {
          const spell = spellIndex.get(key);
          found.set(key, spell);
        }
      }
    });

    const spells = Array.from(found.values());
    return spells.map(spell => buildSpellAction(spell, npc));
  }

  function getSpellcastingMeta(npc) {
    const values = computeSpellAttackValues(npc);
    return `Spell DC ${values.saveDc} \u00b7 Spell Attack ${formatSigned(values.attackBonus)}`;
  }

  function buildMetaLines(lines) {
    const items = Array.isArray(lines) ? lines.filter(Boolean) : [lines].filter(Boolean);
    return items.map(line => {
      const spellClass = String(line).startsWith('Spell DC') ? ' statblock-meta-spell' : '';
      return `<div class="statblock-meta-line${spellClass}">${line}</div>`;
    }).join('');
  }

  function getXpLine(crValue) {
    const xp = getXpForCr(crValue);
    if (!xp) return null;
    return `XP ${formatNumber(xp)}`;
  }

  function getXpForCr(crValue) {
    const table = [
      { cr: 0, label: '0', xp: 10 },
      { cr: 0.125, label: '1/8', xp: 25 },
      { cr: 0.25, label: '1/4', xp: 50 },
      { cr: 0.5, label: '1/2', xp: 100 },
      { cr: 1, label: '1', xp: 200 },
      { cr: 2, label: '2', xp: 450 },
      { cr: 3, label: '3', xp: 700 },
      { cr: 4, label: '4', xp: 1100 },
      { cr: 5, label: '5', xp: 1800 },
      { cr: 6, label: '6', xp: 2300 },
      { cr: 7, label: '7', xp: 2900 },
      { cr: 8, label: '8', xp: 3900 },
      { cr: 9, label: '9', xp: 5000 },
      { cr: 10, label: '10', xp: 5900 },
      { cr: 11, label: '11', xp: 7200 },
      { cr: 12, label: '12', xp: 8400 },
      { cr: 13, label: '13', xp: 10000 },
      { cr: 14, label: '14', xp: 11500 },
      { cr: 15, label: '15', xp: 13000 },
      { cr: 16, label: '16', xp: 15000 },
      { cr: 17, label: '17', xp: 18000 },
      { cr: 18, label: '18', xp: 20000 },
      { cr: 19, label: '19', xp: 22000 },
      { cr: 20, label: '20', xp: 25000 },
      { cr: 21, label: '21', xp: 33000 },
      { cr: 22, label: '22', xp: 41000 },
      { cr: 23, label: '23', xp: 50000 },
      { cr: 24, label: '24', xp: 62000 },
      { cr: 25, label: '25', xp: 75000 },
      { cr: 26, label: '26', xp: 90000 },
      { cr: 27, label: '27', xp: 105000 },
      { cr: 28, label: '28', xp: 120000 },
      { cr: 29, label: '29', xp: 135000 },
      { cr: 30, label: '30', xp: 155000 }
    ];

    if (crValue === undefined || crValue === null) {
      return null;
    }

    const label = String(crValue);
    const byLabel = table.find(entry => entry.label === label);
    if (byLabel) {
      return byLabel.xp;
    }

    const numeric = parseChallengeRating(label);
    const match = table.find(entry => Math.abs(entry.cr - numeric) < 0.001);
    return match ? match.xp : null;
  }

  function formatNumber(value) {
    return Number(value).toLocaleString('en-US');
  }

  function buildSpellAction(spell, npc) {
    const summary = getFirstSentence(spell.description || '');
    const metaParts = [
      formatSpellLevel(spell.level),
      toTitleCase(spell.school),
      toTitleCase(spell.actionType)
    ];
    const rollInfo = buildSpellRollInfo(spell, npc);
    if (rollInfo.meta) {
      metaParts.push(rollInfo.meta);
    }

    return {
      name: spell.name,
      text: summary,
      meta: metaParts.filter(Boolean).join(' \u00b7 '),
      roll: rollInfo.roll
    };
  }

  function buildSpellRollInfo(spell, npc) {
    if (!spell || !spell.description) {
      return { roll: null, meta: null };
    }
    const description = spell.description;
    const lower = description.toLowerCase();
    const hasSpellAttack = lower.includes('spell attack');
    const hasSave = lower.includes('saving throw');

    const { attackBonus, saveDc } = computeSpellAttackValues(npc);
    const metaParts = [];
    if (hasSpellAttack) {
      metaParts.push(`Attack ${formatSigned(attackBonus)}`);
    } else if (hasSave) {
      metaParts.push(`Save DC ${saveDc}`);
    }

    const damageDice = extractDamageDice(description);
    if (hasSpellAttack && damageDice) {
      return {
        roll: {
          attackBonus: attackBonus,
          damageDice: damageDice,
          bonusDice: null,
          damageMod: 0
        },
        meta: metaParts.join(' \u00b7 ')
      };
    }

    return {
      roll: null,
      meta: metaParts.join(' \u00b7 ')
    };
  }

  function extractDamageDice(text) {
    if (!text) return null;
    const regex = /\b\d+d\d+(?:\s*\+\s*\d+)?\b/gi;
    const parts = [];
    let match = null;
    while ((match = regex.exec(text)) !== null) {
      parts.push(match[0]);
    }
    if (parts.length === 0) {
      return null;
    }
    return parts.join(' + ');
  }

  function computeSpellAttackValues(npc) {
    const mods = getAbilityMods(npc);
    const pb = npc.proficiencyBonus || 0;
    const ability = getSpellcastingAbility(npc, mods);
    const mod = mods[ability] || 0;
    return {
      attackBonus: mod + pb,
      saveDc: 8 + mod + pb
    };
  }

  function getSpellcastingAbility(npc, mods) {
    if (npc && npc.spellcastingAbility) {
      return npc.spellcastingAbility;
    }
    if (npc && npc.archetype === 'cleric') {
      return 'WIS';
    }
    if (npc && npc.archetype === 'caster') {
      return 'INT';
    }
    if (npc && npc.archetype === 'rogue') {
      return 'INT';
    }
    const mental = ['INT', 'WIS', 'CHA'];
    let best = 'INT';
    let bestValue = -999;
    mental.forEach(key => {
      const value = mods[key] !== undefined ? mods[key] : 0;
      if (value > bestValue) {
        bestValue = value;
        best = key;
      }
    });
    return best;
  }

  function getFirstSentence(text) {
    if (!text) return '';
    const match = String(text).match(/(.+?[.!?])(\s|$)/);
    if (match) {
      return match[1];
    }
    return text;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeAttribute(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');
  }

  function renderStatBlock(target, npc) {
    if (!target) return;

    const tier = npc.tier || 'Novice';
    const tierInfo = Generator.getTierInfo(tier);
    const pb = npc.proficiencyBonus || tierInfo.pb;
    const cr = npc.cr || tierInfo.cr;

    if (target.ac) target.ac.textContent = npc.armorClass || computeArmorClassFallback(npc, tier);
    if (target.hp) target.hp.textContent = npc.hitPoints || 0;
    if (target.speed) target.speed.textContent = npc.speed || '30 ft.';
    if (target.init) target.init.textContent = formatSigned(npc.initiative || 0);

    if (target.abilities) {
      const mods = getAbilityMods(npc);
      const scores = npc.abilityScores || {};
      const saves = npc.savingThrows || computeSavingThrows(mods, npc.savingThrowProficiencies || [], pb);
      const saveProfs = new Set(npc.savingThrowProficiencies || []);
      const rows = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(key => {
        const score = scores[key] !== undefined ? scores[key] : 10;
        const mod = mods[key] !== undefined ? mods[key] : 0;
        const save = saves[key] !== undefined ? saves[key] : mod;
        const proficientClass = saveProfs.has(key) ? ' proficient' : '';
        return `
          <div class="statblock-ability-row${proficientClass}">
            <span class="ability-name">${key}</span>
            <span class="ability-score">${score} (${formatSigned(mod)})</span>
            <button class="statblock-save" type="button" data-ability="${key}" aria-label="Roll ${key} saving throw">
              Save ${formatSigned(save)}
            </button>
          </div>
        `;
      }).join('');
      target.abilities.innerHTML = rows;

      target.abilities.querySelectorAll('.statblock-save').forEach(button => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const abilityKey = button.dataset.ability;
          if (!abilityKey) return;
          rollSavingThrow(npc, abilityKey);
        });
      });
    }

    renderEntryList(target.traits, npc.traits);
    renderActionList(target.actions, npc.actions);
    const spellActions = deriveSpellActions(npc);
    renderSpellActions(target, npc, spellActions);
    renderEntryList(target.reactions, npc.reactions);

    if (target.meta) {
      const metaLine = npc.metaLine || `PB ${formatSigned(pb)} \u00b7 CR ${cr}`;
      const xpLine = getXpLine(cr);
      const spellMeta = spellActions.length > 0 ? getSpellcastingMeta(npc) : null;
      target.meta.innerHTML = buildMetaLines([metaLine, xpLine, spellMeta]);
    }
  }

  function renderEntryList(container, items) {
    if (!container) return;
    if (!items || items.length === 0) {
      container.innerHTML = '<div class="statblock-entry">None</div>';
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="statblock-entry">
        <span class="entry-name">${item.name}.</span> ${linkifyText(item.text)}
      </div>
    `).join('');
  }

  function renderActionList(container, items) {
    if (!container) return;
    if (!items || items.length === 0) {
      container.innerHTML = '<div class="statblock-entry">None</div>';
      return;
    }

    container.innerHTML = items.map(item => {
      const rollButton = item.roll ? `<button class="action-roll" type="button">Roll</button>` : '';
      return `
        <div class="statblock-entry statblock-action" data-roll='${item.roll ? JSON.stringify(item.roll) : ''}'>
          <div class="statblock-action-text">
            <span class="entry-name">${item.name}.</span> ${linkifyText(item.text)}
          </div>
          ${rollButton}
        </div>
      `;
    }).join('');

    bindActionRolls(container);
  }

  const spellSectionExpanded = {
    result: false,
    detail: false
  };

  function renderSpellActions(target, npc, spellActions = null) {
    if (!target || !target.spellsSection || !target.spells) return;

    const spells = spellActions || deriveSpellActions(npc);
    if (!spells || spells.length === 0) {
      target.spellsSection.classList.add('hidden');
      return;
    }

    target.spellsSection.classList.remove('hidden');
    target.currentNpcRef = npc;
    const key = target.key || 'result';
    const expanded = spellSectionExpanded[key] === true;
    const visibleCount = expanded ? spells.length : Math.min(3, spells.length);
    const visible = spells.slice(0, visibleCount);

    target.spells.innerHTML = visible.map(spell => {
      const rollButton = spell.roll ? `<button class="action-roll" type="button">Roll</button>` : '';
      const meta = spell.meta ? `<div class="spell-entry-meta">${spell.meta}</div>` : '';
      const safeName = escapeAttribute(spell.name);
      return `
        <div class="statblock-entry statblock-action" data-roll='${spell.roll ? JSON.stringify(spell.roll) : ''}'>
          <div class="statblock-action-text">
            <span class="entry-name">
              <button class="spell-link spell-entry-link" type="button" data-spell="${safeName}">${spell.name}</button>.
            </span>
            ${meta}
            <div class="spell-entry-text">${linkifyText(spell.text)}</div>
          </div>
          ${rollButton}
        </div>
      `;
    }).join('');

    bindActionRolls(target.spells);

    if (target.spellsToggle) {
      if (!target.spellsToggle.dataset.bound) {
        target.spellsToggle.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const targetKey = target.key || 'result';
          spellSectionExpanded[targetKey] = !spellSectionExpanded[targetKey];
          renderSpellActions(target, target.currentNpcRef);
        });
        target.spellsToggle.dataset.bound = 'true';
      }

      if (spells.length <= 3) {
        target.spellsToggle.classList.add('hidden');
      } else {
        target.spellsToggle.classList.remove('hidden');
        target.spellsToggle.textContent = expanded ? 'Show less' : `Show all (${spells.length})`;
      }
    }
  }

  function bindActionRolls(container) {
    container.querySelectorAll('.action-roll').forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const entry = button.closest('.statblock-action');
        if (!entry) return;
        const raw = entry.dataset.roll;
        if (!raw) return;
        let rollData = null;
        try {
          rollData = JSON.parse(raw);
        } catch (e) {
          return;
        }
        rollAttackAndDamage(rollData);
      });
    });
  }

  function rollAttackAndDamage(rollData) {
    if (!rollData) return;
    const attackBonus = rollData.attackBonus || 0;
    const attackRoll = rollD20();
    const attackTotal = attackRoll + attackBonus;

    const damageParts = [];
    let damageTotal = 0;

    if (rollData.damageDice) {
      const dmg = rollDiceExpression(rollData.damageDice);
      if (dmg.detail) {
        damageParts.push(dmg.detail);
      }
      damageTotal += dmg.total;
    }

    if (rollData.bonusDice) {
      const bonus = rollDiceExpression(rollData.bonusDice);
      if (bonus.detail) {
        damageParts.push(bonus.detail);
      }
      damageTotal += bonus.total;
    }

    const mod = rollData.damageMod || 0;
    damageTotal += mod;

    let damageDetail = damageParts.join(' + ').trim();
    if (mod !== 0) {
      const modLabel = `${mod > 0 ? '+' : '-'} ${Math.abs(mod)}`;
      damageDetail = damageDetail ? `${damageDetail} ${modLabel}` : modLabel;
    }
    if (!damageDetail) {
      damageDetail = `${damageTotal}`;
    }

    showRollModalWith(
      {
        title: 'Attack Roll',
        result: `${attackTotal}`,
        detail: `d20 (${attackRoll}) ${formatSigned(attackBonus)} = ${attackTotal}`
      },
      {
        title: 'Damage Roll',
        result: `${damageTotal}`,
        detail: `${damageDetail} = ${damageTotal}`
      }
    );
  }

  function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
  }

  function rollDice(dice) {
    const match = /^(\d+)d(\d+)$/i.exec(dice);
    if (!match) {
      return { total: 0 };
    }
    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return { total };
  }

  function rollDiceExpression(expression) {
    if (!expression) {
      return { total: 0, detail: '' };
    }
    const parts = String(expression)
      .split('+')
      .map(part => part.trim())
      .filter(Boolean);

    let total = 0;
    const detailParts = [];

    parts.forEach(part => {
      if (/^\d+d\d+$/i.test(part)) {
        const result = rollDice(part);
        total += result.total;
        detailParts.push(`${part} (${result.total})`);
      } else if (/^\d+$/i.test(part)) {
        const value = parseInt(part, 10);
        total += value;
        detailParts.push(`${value}`);
      }
    });

    return {
      total,
      detail: detailParts.join(' + ')
    };
  }

  function rollSavingThrow(npc, abilityKey) {
    const mods = getAbilityMods(npc);
    const pb = npc.proficiencyBonus || 0;
    const saveProfs = npc.savingThrowProficiencies || [];
    const isProficient = saveProfs.includes(abilityKey);
    const modifier = (mods[abilityKey] || 0) + (isProficient ? pb : 0);
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + modifier;

    const modifierLabel = `${formatSigned(modifier)}${isProficient ? ' (proficient)' : ''}`;

    showRollModalWith(
      {
        title: `${abilityKey} Saving Throw`,
        result: `${total}`,
        detail: `Roll: ${roll} + Modifier: ${modifierLabel}`
      }
    );
  }

  function showRollModal() {
    if (!elements.rollModal) return;
    elements.rollModal.classList.remove('hidden');

    setTimeout(() => {
      document.addEventListener('click', hideRollModal, { once: true });
    }, 0);
  }

  function hideRollModal() {
    if (!elements.rollModal) return;
    elements.rollModal.classList.add('hidden');
  }

  function showRollModalWith(primary, secondary = null) {
    elements.rollTitle.textContent = primary.title;
    elements.rollResult.textContent = primary.result;
    elements.rollDetail.textContent = primary.detail;

    if (secondary) {
      elements.rollDivider.classList.remove('hidden');
      elements.rollSectionDamage.classList.remove('hidden');
      elements.rollTitle2.textContent = secondary.title;
      elements.rollResult2.textContent = secondary.result;
      elements.rollDetail2.textContent = secondary.detail;
    } else {
      elements.rollDivider.classList.add('hidden');
      elements.rollSectionDamage.classList.add('hidden');
      elements.rollTitle2.textContent = '';
      elements.rollResult2.textContent = '';
      elements.rollDetail2.textContent = '';
    }

    showRollModal();
  }

  async function ensureNpcStats(npc, persistIfSaved) {
    if (
      npc.abilityMods &&
      npc.savingThrows &&
      npc.proficiencyBonus &&
      npc.cr &&
      npc.archetype &&
      npc.tier &&
      npc.armorClass &&
      npc.hitPoints &&
      npc.speed &&
      npc.initiative !== undefined &&
      npc.traits &&
      npc.actions &&
      npc.reactions
    ) {
      return;
    }

    const archetypes = await getArchetypes();
    const defaultArchetype = archetypes[0];
    const archetypeId = npc.archetype || (defaultArchetype ? defaultArchetype.id : null);
    const tier = npc.tier || 'Novice';

    await applyStatChanges(npc, archetypeId, tier, persistIfSaved);
  }

  async function applyStatChanges(npc, archetypeId, tier, persistIfSaved) {
    const stats = await Generator.computeStatsFor(archetypeId, tier, npc.race);

    npc.archetype = stats.archetype.id;
    npc.archetypeLabel = stats.archetype.label;
    npc.tier = stats.tier;
    npc.cr = stats.tierInfo.cr;
    npc.proficiencyBonus = stats.tierInfo.pb;
    npc.armorClass = stats.ac;
    npc.hitPoints = stats.hp;
    npc.speed = stats.speed;
    npc.initiative = stats.initiative;
    npc.abilityScores = stats.abilityScores;
    npc.abilityMods = stats.abilityMods;
    npc.savingThrowProficiencies = stats.saveProfs;
    npc.savingThrows = stats.savingThrows;
    npc.traits = stats.traits;
    npc.actions = stats.actions;
    npc.reactions = stats.reactions;

    if (persistIfSaved && Storage.exists(npc.id)) {
      Storage.save(npc);
    }

    if (npc === currentNpc) {
      renderStats(elements.resultAbilityMods, elements.resultStatline, elements.resultSaves, npc, elements.resultAc);
      renderStatBlock(elements.resultStatblock, npc);
    } else if (viewingNpcId && npc.id === viewingNpcId) {
      renderStats(elements.detailAbilityMods, elements.detailStatline, elements.detailSaves, npc, elements.detailAc);
      renderStatBlock(elements.detailStatblock, npc);
    }
  }

  async function renderStatControls(archetypeSelect, tierSelect, npc) {
    const archetypes = await getArchetypes();
    const tiers = getTierOptions();

    const archetypeOptions = archetypes.map(a => `<option value="${a.id}">${a.label}</option>`).join('');
    const tierOptions = tiers.map(t => `<option value="${t}">${t}</option>`).join('');

    if (archetypeSelect) archetypeSelect.innerHTML = archetypeOptions;
    if (tierSelect) tierSelect.innerHTML = tierOptions;

    const archetypeValue = npc.archetype || archetypes[0].id;
    const tierValue = npc.tier || 'Novice';

    if (archetypeSelect) archetypeSelect.value = archetypeValue;
    if (tierSelect) tierSelect.value = tierValue;
  }

  async function getArchetypes() {
    if (cachedArchetypes.length > 0) {
      return cachedArchetypes;
    }
    const archetypes = await DataLoader.getArchetypes();
    cachedArchetypes = archetypes;
    return archetypes;
  }

  function getTierOptions() {
    if (cachedTiers.length > 0) {
      return cachedTiers;
    }
    cachedTiers = Generator.getTierOptions();
    return cachedTiers;
  }

  async function getMonsters() {
    if (cachedMonsters) {
      return cachedMonsters;
    }
    cachedMonsters = await DataLoader.getMonsters();
    return cachedMonsters;
  }

  async function getSpells() {
    if (cachedSpells) {
      return cachedSpells;
    }
    cachedSpells = await DataLoader.getSpells();
    return cachedSpells;
  }

  async function getConditions() {
    if (conditionIndex) {
      return Array.from(conditionIndex.values());
    }
    return await DataLoader.getConditions();
  }

  function getAbilityMods(npc) {
    if (npc.abilityMods) {
      return npc.abilityMods;
    }
    if (npc.abilityScores) {
      return Generator.getAbilityModsFromScores(npc.abilityScores);
    }
    const mods = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
    return mods;
  }

  let monsterFiltersReady = false;
  let spellFiltersReady = false;

  function ensureMonsterFilters(monsters) {
    if (monsterFiltersReady || !elements.monsterTypeFilter || !elements.monsterCrMin || !elements.monsterCrMax) {
      return;
    }

    const typeSet = new Set();
    const crMap = new Map();
    monsters.forEach(monster => {
      if (monster.type) {
        typeSet.add(monster.type);
      }
      if (monster.challenge_rating !== undefined && monster.challenge_rating !== null) {
        const label = String(monster.challenge_rating);
        const value = parseChallengeRating(label);
        if (!crMap.has(label)) {
          crMap.set(label, value);
        }
      }
    });

    const types = Array.from(typeSet).sort((a, b) => a.localeCompare(b));
    elements.monsterTypeFilter.innerHTML = `<option value="">All Types</option>${types.map(type => `<option value="${type}">${toTitleCase(type)}</option>`).join('')}`;

    const crList = Array.from(crMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.value - b.value);

    const crMinOptions = ['<option value="">CR Min</option>']
      .concat(crList.map(cr => `<option value="${cr.value}">${cr.label}</option>`))
      .join('');
    const crMaxOptions = ['<option value="">CR Max</option>']
      .concat(crList.map(cr => `<option value="${cr.value}">${cr.label}</option>`))
      .join('');

    elements.monsterCrMin.innerHTML = crMinOptions;
    elements.monsterCrMax.innerHTML = crMaxOptions;
    monsterFiltersReady = true;
  }

  function ensureSpellFilters(spells) {
    if (spellFiltersReady || !elements.spellLevelFilter || !elements.spellClassFilter) {
      return;
    }

    const levels = Array.from(new Set(spells.map(spell => spell.level)))
      .filter(level => level !== undefined && level !== null)
      .sort((a, b) => a - b);

    const options = ['<option value="">All Levels</option>']
      .concat(levels.map(level => `<option value="${level}">${formatSpellLevel(level)}</option>`))
      .join('');

    elements.spellLevelFilter.innerHTML = options;
    const classSet = new Set();
    spells.forEach(spell => {
      if (Array.isArray(spell.classes)) {
        spell.classes.forEach(cls => classSet.add(toTitleCase(cls)));
      }
    });
    const classes = Array.from(classSet).sort((a, b) => a.localeCompare(b));
    elements.spellClassFilter.innerHTML = ['<option value="">All Classes</option>']
      .concat(classes.map(cls => `<option value="${cls}">${cls}</option>`))
      .join('');
    spellFiltersReady = true;
  }

  function parseChallengeRating(cr) {
    if (typeof cr === 'number') return cr;
    if (!cr) return 0;
    const value = String(cr).trim();
    if (value.includes('/')) {
      const [num, denom] = value.split('/').map(part => parseFloat(part));
      if (!Number.isNaN(num) && !Number.isNaN(denom) && denom !== 0) {
        return num / denom;
      }
    }
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function getProficiencyBonusForCr(crValue) {
    if (crValue >= 29) return 9;
    if (crValue >= 25) return 8;
    if (crValue >= 21) return 7;
    if (crValue >= 17) return 6;
    if (crValue >= 13) return 5;
    if (crValue >= 9) return 4;
    if (crValue >= 5) return 3;
    return 2;
  }

  function formatMonsterTypeLine(monster) {
    if (!monster) return '';
    const size = monster.size ? String(monster.size) : '';
    const type = monster.type ? toTitleCase(monster.type) : '';
    const subtype = monster.subtype ? ` (${monster.subtype})` : '';
    const alignment = monster.alignment ? String(monster.alignment) : '';
    const base = `${size} ${type}${subtype}`.trim();
    if (alignment) {
      return `${base}, ${alignment}`;
    }
    return base;
  }

  function formatSpellLevel(level) {
    if (Number(level) === 0) {
      return 'Cantrip';
    }
    return `Level ${level}`;
  }

  function toTitleCase(value) {
    if (!value) return '';
    return String(value)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function buildMonsterProfile(monster) {
    const abilityScores = {
      STR: monster.strength,
      DEX: monster.dexterity,
      CON: monster.constitution,
      INT: monster.intelligence,
      WIS: monster.wisdom,
      CHA: monster.charisma
    };

    const abilityMods = Generator.getAbilityModsFromScores(abilityScores);
    const saveProfs = [];
    const savingThrows = {};
    const saveMap = {
      STR: 'strength_save',
      DEX: 'dexterity_save',
      CON: 'constitution_save',
      INT: 'intelligence_save',
      WIS: 'wisdom_save',
      CHA: 'charisma_save'
    };

    Object.keys(saveMap).forEach(key => {
      const field = saveMap[key];
      const value = monster[field];
      if (Number.isFinite(value)) {
        savingThrows[key] = value;
        saveProfs.push(key);
      } else {
        savingThrows[key] = abilityMods[key] || 0;
      }
    });

    const crLabel = monster.challenge_rating !== undefined ? String(monster.challenge_rating) : '0';
    const crValue = parseChallengeRating(crLabel);
    const pb = getProficiencyBonusForCr(crValue);
    const metaLine = `${formatMonsterTypeLine(monster)} \u00b7 PB ${formatSigned(pb)} \u00b7 CR ${crLabel}`;

    return {
      name: monster.name,
      armorClass: monster.armor_class,
      hitPoints: monster.hit_points,
      speed: monster.speed,
      initiative: abilityMods.DEX || 0,
      proficiencyBonus: pb,
      cr: crLabel,
      metaLine,
      abilityScores,
      abilityMods,
      savingThrowProficiencies: saveProfs,
      savingThrows,
      traits: mapMonsterEntries(monster.special_abilities),
      actions: mapMonsterEntries(monster.actions, true),
      reactions: mapMonsterEntries(monster.reactions, true)
    };
  }

  function mapMonsterEntries(entries, includeRoll = false) {
    if (!Array.isArray(entries)) return [];
    return entries.map(entry => {
      const item = {
        name: entry.name || 'Feature',
        text: entry.desc || ''
      };

      if (includeRoll && entry.damage_dice) {
        item.roll = {
          attackBonus: entry.attack_bonus || 0,
          damageDice: entry.damage_dice,
          bonusDice: null,
          damageMod: entry.damage_bonus || 0
        };
      }

      return item;
    });
  }

  function computeSavingThrows(mods, saveProfs, pb) {
    const saves = {};
    Object.keys(mods).forEach(key => {
      const isProficient = saveProfs.includes(key);
      saves[key] = mods[key] + (isProficient ? pb : 0);
    });
    return saves;
  }

  function computeArmorClassFallback(npc, tier) {
    const tierBase = {
      Novice: 12,
      Trained: 13,
      Veteran: 14,
      Elite: 16,
      Legendary: 18
    };
    const archetypeAdjust = {
      martial: 2,
      brute: 2,
      rogue: 1,
      cleric: 1,
      caster: -1
    };

    const base = tierBase[tier] || 12;
    const adjust = archetypeAdjust[npc.archetype] || 0;
    const ac = base + adjust;
    return Math.max(10, Math.min(20, ac));
  }

  function formatSigned(value) {
    if (value >= 0) {
      return `+${value}`;
    }
    return `${value}`;
  }

  function formatLabel(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  /**
   * Debounce helper
   */
  function debounce(fn, delay) {
    let timer = null;
    return function(...args) {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }

  // Public API
  return {
    init,
    showScreen,
    showToast,
    renderLibrary
  };
})();




