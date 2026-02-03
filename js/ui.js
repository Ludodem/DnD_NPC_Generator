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
    setupModal();

    // Show generator screen by default
    showScreen('generator');
  }

  /**
   * Cache frequently used DOM elements
   */
  function cacheElements() {
    // Navigation
    elements.navBtns = document.querySelectorAll('.nav-btn');

    // Screens
    elements.screens = {
      generator: document.getElementById('screen-generator'),
      result: document.getElementById('screen-result'),
      library: document.getElementById('screen-library'),
      libraryDetail: document.getElementById('screen-library-detail')
    };

    // Generator
    elements.selectors = document.getElementById('selectors');
    elements.btnGenerate = document.getElementById('btn-generate');

    // Result
    elements.resultName = document.getElementById('result-name');
    elements.resultSummary = document.getElementById('result-summary');
    elements.resultStatline = document.getElementById('result-statline');
    elements.resultSaves = document.getElementById('result-saves');
    elements.resultPhysical = document.querySelector('#result-physical p');
    elements.resultPsych = document.querySelector('#result-psych p');
    elements.resultNotes = document.getElementById('notes-input');
    elements.resultAbilityMods = mapAbilityElements(document.querySelectorAll('#screen-result .ability-mod'));
    elements.btnBack = document.getElementById('btn-back');
    elements.btnRegenerate = document.getElementById('btn-regenerate');
    elements.btnCopy = document.getElementById('btn-copy');
    elements.btnSave = document.getElementById('btn-save');

    // Library
    elements.libraryList = document.getElementById('library-list');
    elements.libraryEmpty = document.getElementById('library-empty');
    elements.btnGenerateFirst = document.getElementById('btn-generate-first');

    // Library Detail
    elements.detailName = document.getElementById('detail-name');
    elements.detailSummary = document.getElementById('detail-summary');
    elements.detailStatline = document.getElementById('detail-statline');
    elements.detailSaves = document.getElementById('detail-saves');
    elements.detailPhysical = document.querySelector('#detail-physical p');
    elements.detailPsych = document.querySelector('#detail-psych p');
    elements.detailNotes = document.getElementById('detail-notes-input');
    elements.detailAbilityMods = mapAbilityElements(document.querySelectorAll('#screen-library-detail .ability-mod'));
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
  }

  /**
   * Set up bottom navigation
   */
  function setupNavigation() {
    elements.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        if (screen === 'library') {
          showScreen('library');
          renderLibrary();
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
      'libraryDetail': 'library'
    };

    const navTarget = navMap[activeScreen] || activeScreen;

    elements.navBtns.forEach(btn => {
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

    elements.btnGenerate.addEventListener('click', handleGenerate);
  }

  /**
   * Render selector groups
   */
  async function renderSelectors() {
    const races = await DataLoader.getAllRaces();
    const archetypes = await DataLoader.getArchetypes();
    const sexOptions = Generator.getSexOptions();
    const alignmentOptions = Generator.getAlignmentOptions();
    const tierOptions = Generator.getTierOptions();

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
      renderResult(currentNpc);
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
  function renderResult(npc) {
    elements.resultName.textContent = npc.name;
    elements.resultSummary.innerHTML = renderChips(npc);
    renderStats(elements.resultAbilityMods, elements.resultStatline, elements.resultSaves, npc);
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
      renderLibrary();
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
            renderLibrary();
          }
        );
      }
    });

    const saveDetailNotes = debounce(() => {
      if (!viewingNpcId) return;
      const npc = Storage.getById(viewingNpcId);
      if (!npc) return;
      npc.notes = elements.detailNotes.value || '';
      Storage.save(npc);
    }, 300);

    elements.detailNotes.addEventListener('input', saveDetailNotes);
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

    elements.libraryList.innerHTML = npcs.map(npc => `
      <div class="npc-card" data-npc-id="${npc.id}">
        <div class="npc-card-content">
          <div class="npc-card-name">${npc.name}</div>
          <div class="npc-card-meta">${npc.race} · ${npc.alignment}</div>
        </div>
        <span class="npc-card-arrow">›</span>
      </div>
    `).join('');

    // Add click handlers
    elements.libraryList.querySelectorAll('.npc-card').forEach(card => {
      card.addEventListener('click', () => {
        const npcId = card.dataset.npcId;
        viewNpcDetail(npcId);
      });
    });
  }

  /**
   * View NPC detail from library
   */
  function viewNpcDetail(npcId) {
    const npc = Storage.getById(npcId);
    if (!npc) {
      showToast('NPC not found');
      return;
    }

    viewingNpcId = npcId;

    elements.detailName.textContent = npc.name;
    elements.detailSummary.innerHTML = renderChips(npc);
    renderStats(elements.detailAbilityMods, elements.detailStatline, elements.detailSaves, npc);
    elements.detailPhysical.textContent = npc.physicalDescription;
    elements.detailPsych.textContent = npc.psychDescription;
    elements.detailNotes.value = npc.notes || '';

    showScreen('libraryDetail');
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
  function renderStats(abilityMap, statlineEl, savesEl, npc) {
    const mods = getAbilityMods(npc);
    Object.keys(abilityMap).forEach(key => {
      abilityMap[key].textContent = formatSigned(mods[key]);
    });

    const tier = npc.tier || 'Novice';
    const tierInfo = Generator.getTierInfo(tier);
    const cr = npc.cr || tierInfo.cr;
    const pb = npc.proficiencyBonus || tierInfo.pb;
    const archetypeLabel = npc.archetypeLabel || formatLabel(npc.archetype) || 'Generalist';

    statlineEl.textContent = `Archetype: ${archetypeLabel} · Tier: ${tier} · CR ${cr} · PB ${formatSigned(pb)}`;

    const saveProfs = npc.savingThrowProficiencies || ['STR', 'CON'];
    const savingThrows = npc.savingThrows || computeSavingThrows(mods, saveProfs, pb);
    const saveText = saveProfs.map(key => `${key} ${formatSigned(savingThrows[key])}`).join(', ');
    savesEl.textContent = `Saving Throws: ${saveText}`;
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

  function computeSavingThrows(mods, saveProfs, pb) {
    const saves = {};
    Object.keys(mods).forEach(key => {
      const isProficient = saveProfs.includes(key);
      saves[key] = mods[key] + (isProficient ? pb : 0);
    });
    return saves;
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
