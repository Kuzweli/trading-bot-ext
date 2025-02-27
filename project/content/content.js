class BotController {
  constructor() {
    this.buttonSelectors = [
      'button#db-animation__run-button',
      'button.animation__run-button',
      'button.dc-btn--primary',
      'button[type="submit"]',
      'button:contains("Run")',
      'button.dc-btn'
    ];
    this.init();
  }

  init() {
    // Informer que le script de contenu est chargé
    console.log('Content script initialized');
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Received message:', message.type);
      
      if (message.type === 'PING') {
        sendResponse({ status: 'ready' });
        return true;
      }
      
      if (message.type === 'EXECUTE_BOT') {
        this.executeBotAction();
        sendResponse({ status: 'executing' });
        return true;
      }
    });
  }

  async waitForElement(selector, timeout = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Element ${selector} not found after ${timeout}ms`);
  }

  async waitForPageLoad(timeout = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (document.readyState === 'complete') {
        // Ajouter un délai de 5 secondes après le chargement complet
        console.log('Page loaded, waiting 5 seconds before proceeding...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Page did not load within the timeout period');
  }

  findRunButton() {
    console.log('🔍 Scanning for Run button using multiple methods...');
    
    // Méthode 1: Utiliser tous les sélecteurs définis
    for (const selector of this.buttonSelectors) {
      console.log(`Trying selector: ${selector}`);
      const button = document.querySelector(selector);
      if (button && this.validateRunButton(button)) {
        return button;
      }
    }

    // Méthode 2: Rechercher par le contenu du texte
    console.log('Searching by text content...');
    const allButtons = Array.from(document.getElementsByTagName('button'));
    const runButton = allButtons.find(button => {
      const hasRunText = button.textContent.trim().toLowerCase() === 'run';
      const isVisible = button.offsetParent !== null;
      const isClickable = window.getComputedStyle(button).pointerEvents !== 'none';
      
      console.log('Button found:', {
        text: button.textContent.trim(),
        isVisible,
        isClickable,
        classes: button.className,
        id: button.id
      });
      
      return hasRunText && isVisible && isClickable;
    });

    if (runButton) return runButton;

    // Méthode 3: Rechercher par attributs et classes
    console.log('Searching by attributes and classes...');
    const potentialButtons = document.querySelectorAll('button.dc-btn, button.dc-btn__effect');
    for (const button of potentialButtons) {
      if (this.validateRunButton(button)) {
        return button;
      }
    }

    // Méthode 4: Rechercher dans les iframes si présents
    console.log('Searching in iframes...');
    const iframes = document.getElementsByTagName('iframe');
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const iframeButton = iframeDoc.querySelector('button:contains("Run")');
        if (iframeButton && this.validateRunButton(iframeButton)) {
          return iframeButton;
        }
      } catch (e) {
        console.log('Cannot access iframe content:', e);
      }
    }

    throw new Error('Run button not found using any method');
  }

  validateRunButton(button) {
    if (!button) return false;

    const isVisible = button.offsetParent !== null;
    const hasRunText = button.textContent.trim().toLowerCase() === 'run';
    const isClickable = window.getComputedStyle(button).pointerEvents !== 'none';
    const isEnabled = !button.disabled;

    console.log('Validating button:', {
      element: button,
      isVisible,
      hasRunText,
      isClickable,
      isEnabled,
      classes: button.className,
      id: button.id
    });

    return isVisible && hasRunText && isClickable && isEnabled;
  }

  async executeBotAction() {
    try {
      console.log('🚀 Starting bot execution...');
      
      // Attendre que la page soit complètement chargée
      console.log('⏳ Waiting for page to load...');
      await this.waitForPageLoad();
      console.log('✅ Page loaded completely');

      // Attendre que le DOM soit stable
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('DOM stabilization wait complete');

      // Rechercher le bouton Run
      let runButton = null;
      let attempts = 0;
      const maxSearchAttempts = 5;

      while (!runButton && attempts < maxSearchAttempts) {
        attempts++;
        console.log(`Attempt ${attempts}/${maxSearchAttempts} to find Run button`);
        try {
          runButton = this.findRunButton();
        } catch (error) {
          console.log(`Attempt ${attempts} failed:`, error.message);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!runButton) {
        throw new Error('Failed to find Run button after multiple attempts');
      }

      // Tenter de cliquer sur le bouton
      console.log('🖱️ Attempting to click the Run button');
      for (let i = 0; i < 3; i++) {
        runButton.focus();
        runButton.click();
        console.log(`Click attempt ${i + 1} completed`);
        
        // Simuler un clic naturel si nécessaire
        runButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (runButton.disabled) {
          console.log('✅ Button click successful!');
          chrome.runtime.sendMessage({ type: 'BOT_STARTED' });
          return;
        }
      }

      throw new Error('Failed to trigger button click action');
    } catch (error) {
      console.error('❌ Error:', error.message);
      chrome.runtime.sendMessage({ 
        type: 'ERROR',
        error: error.message
      });
    }
  }
}

// Informer que le script de contenu est chargé
console.log('Content script loaded');
// Initialize the controller
new BotController();