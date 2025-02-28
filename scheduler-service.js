const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
const config = require('./config');
const HybridBot = require('./hybrid-bot');
const BotExecutor = require('./bot-executor');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 10000;

    // Ajout des variables manquantes
const scheduledExecutions = [];

// Configuration de base avec CORS unifié
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://trading-bot-ext.onrender.com',
        'https://bot.deriv.com',
        'chrome-extension://*'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token'],
    credentials: true
}));

// Rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requêtes par IP
});
app.use(limiter);

// Remplacement du fetch par axios pour le keep-alive
setInterval(async () => {
    try {
        await axios.get("https://trading-bot-ext.onrender.com/api/status");
    } catch (err) {
        console.log("Keep-alive échoué:", err.message);
    }
}, 5 * 60 * 1000);

// Amélioration de la gestion des horaires
const TRADING_SCHEDULE = {
    startTime: '09:00',
    endTime: '17:00',
    days: new Set(),  // Utilisation d'un Set pour une meilleure gestion des jours
    active: false
};

// Stockage des programmes
const scheduledPrograms = [];

// Configuration du serveur
const SERVER_CONFIG = {
    organizationId: 'einsofinfosgmailcom',
    cloudId: 'b1gl0lk5gh4j12elp243',
    host: 'VOTRE_IP_INSTANCE', // À remplir après avoir exécuté get-yandex-info.sh
    username: 'yc-user',
    robotEndpoint: config.robot.endpoint,
    authToken: config.security.authToken
};

// Ajout de la sécurité avec exception pour plusieurs routes
app.use((req, res, next) => {
    // Liste des routes publiques
    const publicRoutes = [
        '/test',
        '/api/status',
        '/schedules'
    ];
    
    // Skip authentication for public routes
    if (publicRoutes.includes(req.path)) {
        return next();
    }
    
    // Vérification du token uniquement pour les routes protégées
    const token = req.headers['x-auth-token'];
    if (token !== SERVER_CONFIG.authToken) {
        console.log('Accès sans token à:', req.path);
        // On continue quand même en mode développement
        if (process.env.NODE_ENV !== 'production') {
            return next();
        }
        return res.status(401).json({ error: 'Non autorisé' });
    }
    next();
});

// Amélioration du logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    if (req.body) console.log('Body:', req.body);
    next();
});

// Amélioration de l'endpoint schedules pour plus de détails
app.get('/schedules', (req, res) => {
    const schedulesWithDetails = scheduledPrograms.map(schedule => ({
        ...schedule,
        nextExecution: getNextExecutionTime(schedule),
        status: TRADING_SCHEDULE.active && 
                TRADING_SCHEDULE.startTime === schedule.time && 
                Array.from(TRADING_SCHEDULE.days).some(d => schedule.days.includes(d))
            ? 'active'
            : 'inactive'
    }));

    res.json({
        success: true,
        schedules: schedulesWithDetails,
        currentTime: new Date().toISOString()
    });
});

function getNextExecutionTime(schedule) {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':');
    const nextExecution = new Date();
    nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    if (nextExecution <= now) {
        nextExecution.setDate(nextExecution.getDate() + 1);
    }
    
    return nextExecution.toISOString();
}

// Amélioration de l'endpoint de mise à jour
app.post('/update-schedule', express.json(), (req, res) => {
    try {
        console.log('Réception requête update-schedule:', req.body);
        const { time, days } = req.body;
        
        // Validation améliorée du format de l'heure
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!time || !timeRegex.test(time)) {
            return res.status(400).json({ error: 'Format d\'heure invalide' });
        }

        // Validation des jours (0-6 pour dimanche-samedi)
        if (!Array.isArray(days) || !days.every(day => day >= 0 && day <= 6)) {
            return res.status(400).json({ error: 'Format des jours invalide' });
        }

        const newSchedule = {
            id: Date.now(),
            time,
            days,
            active: true,
            createdAt: new Date().toISOString()
        };

        scheduledPrograms.push(newSchedule);
        TRADING_SCHEDULE.startTime = time;
        TRADING_SCHEDULE.days = new Set(days);
        TRADING_SCHEDULE.active = true;

        console.log('Planning mis à jour:', {
            time,
            days,
            active: true
        });

        // Redémarrage du planificateur
        setupScheduler();
        
        // Retour plus détaillé
        res.json({ 
            success: true, 
            schedule: newSchedule,
            allSchedules: scheduledPrograms
        });
    } catch (error) {
        console.error('Erreur de mise à jour:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ajout d'un endpoint de statut
app.get('/api/status', (req, res) => {
    res.json({
        status: TRADING_SCHEDULE.active ? 'ACTIVE' : 'INACTIVE',
        currentSchedule: {
            startTime: TRADING_SCHEDULE.startTime,
            days: Array.from(TRADING_SCHEDULE.days)
        }
    });
});

// Ajout d'un endpoint de test
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Ajout d'un endpoint pour démarrer le robot manuellement avec plus de détails
app.post('/start-robot', (req, res) => {
    console.log('\n=== Démarrage manuel du robot ===');
    console.log('Heure:', new Date().toLocaleString());
    console.log('Headers:', req.headers);
    
    // Ajout d'un état global pour le robot
    const robotState = {
        status: 'running',
        startTime: new Date().toISOString(),
        nextCheck: new Date(Date.now() + 60000).toISOString()
    };
    
    // Simuler une action du robot avec plus de feedback
    setTimeout(() => {
        console.log('Robot en cours d\'exécution...');
        console.log('État actuel:', robotState);
    }, 1000);
    
    res.json({ 
        success: true, 
        message: 'Robot démarré avec succès',
        timestamp: robotState.startTime,
        status: robotState.status,
        nextCheck: robotState.nextCheck
    });
});

// Ajout d'un endpoint pour vérifier l'état du robot
app.get('/robot-status', (req, res) => {
    const lastExecution = scheduledExecutions[scheduledExecutions.length - 1];
    res.json({
        status: 'running',
        lastExecution: lastExecution || null,
        nextScheduledTime: TRADING_SCHEDULE.active ? TRADING_SCHEDULE.startTime : null,
        scheduledDays: Array.from(TRADING_SCHEDULE.days)
    });
});

const bot = new BotExecutor();

// Initialiser le bot au démarrage
bot.init().catch(console.error);

// Ajouter ces nouveaux endpoints pour l'extension
app.get('/bot/status', async (req, res) => {
    const status = await bot.getStatus();
    res.json(status);
});

app.post('/bot/config', express.json(), async (req, res) => {
    const newConfig = await bot.updateConfig(req.body);
    res.json({ success: true, config: newConfig });
});

// Amélioration de la gestion des erreurs dans startRobot
async function startRobot() {
    try {
        const result = await bot.executeBot();
        scheduledExecutions.push({
            timestamp: new Date().toISOString(),
            success: true,
            result
        });
        return true;
    } catch (error) {
        console.error("Erreur d'exécution du robot:", error);
        scheduledExecutions.push({
            timestamp: new Date().toISOString(),
            success: false,
            error: error.message
        });
        return false;
    }
}

// Configuration améliorée du planificateur
function setupScheduler() {
    if (TRADING_SCHEDULE.active) {
        console.log('\n=== Configuration du planificateur ===');
        console.log('Heure actuelle:', new Date().toLocaleString());
        console.log('Heure de démarrage:', TRADING_SCHEDULE.startTime);
        console.log('Jours actifs:', Array.from(TRADING_SCHEDULE.days).map(day => {
            const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            return `${jours[day]} (${day})`;
        }).join(', '));
        console.log('===============================\n');
        
        // Vérification toutes les minutes avec logging détaillé
        cron.schedule('* * * * *', async () => {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const currentDay = now.getDay();

            console.log(`\n=== Vérification de planification ===`);
            console.log(`Heure: ${currentTime}`);
            console.log(`Date complète: ${now.toLocaleString()}`);
            console.log(`Jour actuel: ${currentDay}`);
            console.log(`Heure programmée: ${TRADING_SCHEDULE.startTime}`);
            console.log(`Jours programmés: [${Array.from(TRADING_SCHEDULE.days).join(', ')}]`);
            
            const timeMatch = currentTime === TRADING_SCHEDULE.startTime;
            const dayMatch = TRADING_SCHEDULE.days.has(currentDay);
            
            console.log('Conditions:');
            console.log(`- Heure correspond: ${timeMatch ? '✅' : '❌'}`);
            console.log(`- Jour correspond: ${dayMatch ? '✅' : '❌'}`);

            if (timeMatch && dayMatch) {
                console.log('\n🚀 Conditions remplies, démarrage du robot...');
                const success = await startRobot();
                if (success) {
                    console.log(`✅ Trading démarré avec succès à ${currentTime}`);
                } else {
                    console.error(`❌ Échec du démarrage du trading à ${currentTime}`);
                }
            } else {
                console.log('\n⏳ Conditions non remplies, attente...');
            }
            console.log('===============================\n');
        });
    } else {
        console.log('\n⚠️ Planificateur non actif - aucune tâche programmée');
    }
}

// Gestion des erreurs globale
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({
        error: 'Erreur serveur',
        message: err.message
    });
});

// Gestion SIGTERM améliorée
process.on('SIGTERM', async () => {
    console.log('Réception signal SIGTERM, fermeture gracieuse...');
    try {
        await bot.cleanup(); // S'assurer que le bot est correctement arrêté
        server.close(() => {
            console.log('Serveur arrêté proprement');
            process.exit(0);
        });
    } catch (error) {
        console.error('Erreur lors de la fermeture:', error);
        process.exit(1);
    }
});

// Ajout de la gestion de SIGINT pour le développement local
process.on('SIGINT', () => {
    console.log('Réception SIGINT (Ctrl+C)');
    process.emit('SIGTERM');
});

// Stockage du serveur pour gestion SIGTERM
const server = app.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] Service démarré sur le port ${PORT}`);
});

// Amélioration des logs au démarrage
console.log(`[${new Date().toISOString()}] Service de planification démarré sur le port ${PORT}`);
console.log('URLs disponibles:');
console.log(`- http://localhost:${PORT}/test`);
console.log(`- http://localhost:${PORT}/api/status`);
console.log(`- http://localhost:${PORT}/update-schedule`);
