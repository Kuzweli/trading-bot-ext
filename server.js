const express = require('express');
const puppeteer = require('puppeteer');
const cron = require('node-cron');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('./config.json');

// Configuration du logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

class AutomatedTrader {
    constructor() {
        this.browser = null;
        this.page = null;
        this.isConnected = false;
        this.retryAttempts = 3;
        this.reconnectDelay = 60000; // 1 minute
    }

    async initialize() {
        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox']
            });
            this.page = await this.browser.newPage();
            await this.login();
            this.isConnected = true;
            this.setupHeartbeat();
        } catch (error) {
            logger.error('Initialization error:', error);
            await this.handleError(error);
        }
    }

    async login() {
        try {
            await this.page.goto('https://deriv.com/bot');
            // Ajoutez ici la logique de connexion
            // ...
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    setupHeartbeat() {
        setInterval(async () => {
            try {
                if (!this.isConnected) {
                    await this.reconnect();
                }
                await this.page.evaluate(() => document.title);
            } catch (error) {
                this.isConnected = false;
                logger.error('Connection lost:', error);
            }
        }, 30000);
    }

    async reconnect() {
        for (let i = 0; i < this.retryAttempts; i++) {
            try {
                await this.initialize();
                return;
            } catch (error) {
                logger.error(`Reconnection attempt ${i + 1} failed:`, error);
                await new Promise(r => setTimeout(r, this.reconnectDelay));
            }
        }
        throw new Error('Failed to reconnect after multiple attempts');
    }

    async clickRunButton() {
        try {
            await this.page.waitForSelector('#db-animation__run-button');
            await this.page.click('#db-animation__run-button');
            logger.info('Run button clicked successfully');
            return true;
        } catch (error) {
            logger.error('Click error:', error);
            return false;
        }
    }

    async handleError(error) {
        logger.error('System error:', error);
        try {
            if (this.browser) await this.browser.close();
        } catch (e) {
            logger.error('Error closing browser:', e);
        }
        
        // Tentative de redémarrage après erreur
        setTimeout(() => this.initialize(), this.reconnectDelay);
    }
}

// Configuration du serveur
const app = express();
const port = process.env.PORT || 3000;
const trader = new AutomatedTrader();

// Création du dossier logs s'il n'existe pas
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Initialisation au démarrage
trader.initialize().catch(logger.error);

app.use(cors());
app.use(express.json());

// Middleware pour les erreurs CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Middleware d'authentification
app.use((req, res, next) => {
    const token = req.headers['x-auth-token'];
    if (token !== config.security.authToken) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    next();
});

// Routes
app.post('/start-trading', async (req, res) => {
    try {
        logger.info('Démarrage du trading');
        // Votre logique de démarrage du robot
        res.json({ success: true });
    } catch (error) {
        logger.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route de test pour /health
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ajout des routes pour Yandex Cloud
app.get('/cloud-status', async (req, res) => {
    try {
        const { execSync } = require('child_process');
        const status = execSync('yc compute instance get trading-bot-instance --format json');
        res.json(JSON.parse(status.toString()));
    } catch (error) {
        logger.error('Erreur Yandex Cloud:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoints
app.post('/execute', async (req, res) => {
    try {
        if (!trader.isConnected) {
            await trader.reconnect();
        }
        const success = await trader.clickRunButton();
        res.json({ success });
    } catch (error) {
        logger.error('Execute error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
});

// Amélioration du logging du démarrage
const server = app.listen(config.server.port || 3000, config.server.host || '0.0.0.0', (err) => {
    if (err) {
        logger.error('Erreur au démarrage:', err);
        process.exit(1);
    }
    logger.info(`Serveur démarré sur http://localhost:${port}`);
    logger.info('Configuration chargée:', {
        port: port,
        env: process.env.NODE_ENV,
        cors: true
    });
});

// Gestion de la fermeture propre
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Serveur arrêté');
        process.exit(0);
    });
});
