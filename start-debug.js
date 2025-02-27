const { spawn } = require('child_process');
const path = require('path');

console.log('Démarrage du serveur en mode debug...');

const server = spawn('node', ['scheduler-service.js'], {
    stdio: 'inherit',
    env: {
        ...process.env,
        DEBUG: 'true',
        PORT: '3000'
    }
});

server.on('error', (err) => {
    console.error('Erreur de démarrage:', err);
});

process.on('SIGINT', () => {
    console.log('Arrêt du serveur...');
    server.kill();
    process.exit();
});
