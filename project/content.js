class BotRunner {
    constructor() {
        this.runButtonId = 'db-animation__run-button';
        this.runButtonClass = 'animation__run-button';
        this.retryAttempts = 5;
        this.retryDelay = 1000;
    }

    async findRunButton() {
        const methods = [
            // Méthode 1: Par ID (la plus précise)
            () => document.getElementById(this.runButtonId),
            
            // Méthode 2: Par classe
            () => document.querySelector(`.${this.runButtonClass}`),
            
            // Méthode 3: Par attributs spécifiques
            () => document.querySelector('button[type="submit"] .dc-text.dc-btn__text'),
            
            // Méthode 4: Par contenu de texte
            () => Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.trim().toLowerCase() === 'run'),
            
            // Méthode 5: Par structure SVG spécifique
            () => document.querySelector('button svg[width="15"][height="30"]')?.closest('button'),
            
            // Méthode 6: Scan complet des boutons avec vérification multiple
            () => this.scanAllButtons()
        ];

        for (const method of methods) {
            const button = method();
            if (button) return button;
        }
        
        throw new Error('Run button not found');
    }

    scanAllButtons() {
        return Array.from(document.querySelectorAll('button')).find(button => {
            const hasCorrectId = button.id === this.runButtonId;
            const hasCorrectClass = button.classList.contains(this.runButtonClass);
            const hasCorrectText = button.textContent.trim().toLowerCase() === 'run';
            const hasCorrectStructure = button.querySelector('svg[width="15"][height="30"]');
            
            return hasCorrectId || hasCorrectClass || hasCorrectText || hasCorrectStructure;
        });
    }

    async verifyButtonClickable(button) {
        return button && 
               !button.disabled && 
               !button.classList.contains('disabled') &&
               window.getComputedStyle(button).display !== 'none' &&
               window.getComputedStyle(button).visibility !== 'hidden' &&
               window.getComputedStyle(button).opacity !== '0';
    }

    simulateNaturalClick(button) {
        // Créer des événements naturels
        const events = [
            new MouseEvent('mouseover', { bubbles: true }),
            new MouseEvent('mouseenter', { bubbles: true }),
            new MouseEvent('mousedown', { bubbles: true }),
            new MouseEvent('mouseup', { bubbles: true }),
            new MouseEvent('click', { bubbles: true })
        ];

        // Appliquer les événements avec des délais naturels
        events.forEach((event, index) => {
            setTimeout(() => {
                button.dispatchEvent(event);
            }, index * 50); // Délais progressifs
        });
    }

    async clickRunButton() {
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`Tentative ${attempt}/${this.retryAttempts} de clic sur le bouton Run`);
                
                const button = await this.findRunButton();
                if (!button) {
                    throw new Error('Bouton non trouvé');
                }

                const isClickable = await this.verifyButtonClickable(button);
                if (!isClickable) {
                    throw new Error('Bouton non cliquable');
                }

                console.log('Bouton Run trouvé, simulation du clic...');
                this.simulateNaturalClick(button);

                // Vérification du clic
                await this.verifyClickSuccess();
                
                console.log('✅ Clic sur le bouton Run réussi');
                return true;

            } catch (error) {
                console.error(`❌ Erreur tentative ${attempt}:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    console.log(`Attente de ${this.retryDelay}ms avant nouvelle tentative...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                } else {
                    throw new Error(`Échec après ${this.retryAttempts} tentatives`);
                }
            }
        }
    }

    async verifyClickSuccess() {
        // Attendre et vérifier les changements d'état après le clic
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout en attendant la confirmation du clic'));
            }, 5000);

            const observer = new MutationObserver((mutations) => {
                // Vérifier les changements qui indiquent un clic réussi
                const success = mutations.some(mutation => {
                    // Adaptez ces conditions selon votre interface
                    return mutation.target.classList?.contains('running') ||
                           mutation.target.dataset?.state === 'running';
                });

                if (success) {
                    clearTimeout(timeout);
                    observer.disconnect();
                    resolve(true);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'data-state']
            });
        });
    }
}

// Écouter les messages de l'extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_BOT') {
        const botRunner = new BotRunner();
        botRunner.clickRunButton()
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Indique que la réponse sera asynchrone
    }
    
    if (message.type === 'PING') {
        sendResponse({ success: true });
        return true;
    }
});

console.log('Bot Runner content script chargé et prêt');
