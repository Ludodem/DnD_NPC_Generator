/**
 * Storage Module
 * Handles saving, loading, and deleting NPCs from localStorage
 */

const Storage = (function() {
  const STORAGE_KEY = 'dnd_npc_library';
  const FOLDERS_KEY = 'dnd_npc_folders';
  const MAX_NPCS = 100;

  /**
   * Get all saved NPCs
   */
  function getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading from storage:', error);
      return [];
    }
  }

  /**
   * Save all NPCs (internal use)
   */
  function saveAll(npcs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(npcs));
      return true;
    } catch (error) {
      console.error('Error writing to storage:', error);
      return false;
    }
  }

  /**
   * Get a single NPC by ID
   */
  function getById(id) {
    const npcs = getAll();
    return npcs.find(npc => npc.id === id) || null;
  }

  /**
   * Save a new NPC
   * Returns: { success: boolean, error?: string }
   */
  function save(npc) {
    const npcs = getAll();

    // Check capacity limit
    if (npcs.length >= MAX_NPCS) {
      return {
        success: false,
        error: `Library is full. Maximum ${MAX_NPCS} NPCs allowed. Please delete some NPCs to save new ones.`
      };
    }

    // Check if NPC already exists (by ID)
    const existingIndex = npcs.findIndex(n => n.id === npc.id);
    if (existingIndex !== -1) {
      // Update existing NPC
      npcs[existingIndex] = npc;
    } else {
      // Add new NPC at the beginning (most recent first)
      npcs.unshift(npc);
    }

    const success = saveAll(npcs);
    return {
      success,
      error: success ? undefined : 'Failed to save NPC to storage.'
    };
  }

  /**
   * Delete an NPC by ID
   * Returns: boolean
   */
  function remove(id) {
    const npcs = getAll();
    const filteredNpcs = npcs.filter(npc => npc.id !== id);

    if (filteredNpcs.length === npcs.length) {
      // NPC not found
      return false;
    }

    return saveAll(filteredNpcs);
  }

  /**
   * Check if an NPC exists by ID
   */
  function exists(id) {
    return getById(id) !== null;
  }

  /**
   * Get the current count of saved NPCs
   */
  function count() {
    return getAll().length;
  }

  /**
   * Check if library is at capacity
   */
  function isFull() {
    return count() >= MAX_NPCS;
  }

  /**
   * Get the maximum capacity
   */
  function getMaxCapacity() {
    return MAX_NPCS;
  }

  /**
   * Clear all saved NPCs (use with caution)
   */
  function clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // ---- Folders ----

  function generateFolderId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'folder-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Get all NPC folders
   */
  function getFolders() {
    try {
      const data = localStorage.getItem(FOLDERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading folders from storage:', error);
      return [];
    }
  }

  function saveFolders(folders) {
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
      return true;
    } catch (error) {
      console.error('Error writing folders to storage:', error);
      return false;
    }
  }

  /**
   * Create a new folder
   * Returns the created folder object
   */
  function createFolder(name) {
    const folders = getFolders();
    const folder = {
      id: generateFolderId(),
      name: (name || 'New Folder').trim() || 'New Folder',
      createdAt: new Date().toISOString(),
      collapsed: false
    };
    folders.push(folder);
    saveFolders(folders);
    return folder;
  }

  /**
   * Rename a folder
   */
  function renameFolder(id, name) {
    const folders = getFolders();
    const folder = folders.find(f => f.id === id);
    if (!folder) return false;
    const trimmed = (name || '').trim();
    if (!trimmed) return false;
    folder.name = trimmed;
    return saveFolders(folders);
  }

  /**
   * Delete a folder. NPCs inside it are moved back to "unfiled" (folderId = null),
   * never deleted.
   */
  function deleteFolder(id) {
    const folders = getFolders().filter(f => f.id !== id);
    saveFolders(folders);

    const npcs = getAll();
    let changed = false;
    npcs.forEach(npc => {
      if (npc.folderId === id) {
        npc.folderId = null;
        changed = true;
      }
    });
    if (changed) saveAll(npcs);
    return true;
  }

  /**
   * Toggle/set a folder's collapsed (folded) state
   */
  function setFolderCollapsed(id, collapsed) {
    const folders = getFolders();
    const folder = folders.find(f => f.id === id);
    if (!folder) return false;
    folder.collapsed = !!collapsed;
    return saveFolders(folders);
  }

  /**
   * Move an NPC into a folder (or back to unfiled with folderId = null)
   */
  function setNpcFolder(npcId, folderId) {
    const npcs = getAll();
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) return false;
    npc.folderId = folderId || null;
    return saveAll(npcs);
  }

  // Public API
  return {
    getAll,
    getById,
    save,
    remove,
    exists,
    count,
    isFull,
    getMaxCapacity,
    clearAll,
    getFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    setFolderCollapsed,
    setNpcFolder
  };
})();
