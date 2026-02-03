/**
 * App Module
 * Main application initialization
 */

const App = (function() {
  /**
   * Initialize the application
   */
  async function init() {
    try {
      // Preload all data files
      await DataLoader.preloadAll();

      // Initialize UI
      UI.init();

      // Register service worker for PWA
      registerServiceWorker();

      console.log('D&D NPC Generator initialized');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      showErrorState();
    }
  }

  /**
   * Register service worker
   */
  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('service-worker.js');
        console.log('Service Worker registered:', registration.scope);
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Show error state if initialization fails
   */
  function showErrorState() {
    document.getElementById('app').innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1 style="color: #a94442;">Failed to Load</h1>
        <p>Please refresh the page to try again.</p>
        <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px;">
          Refresh
        </button>
      </div>
    `;
  }

  // Public API
  return {
    init
  };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
