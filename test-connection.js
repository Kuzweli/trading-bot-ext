const axios = require('axios');

const config = {
    yandexIP: process.env.YANDEX_IP || 'localhost',
    robotIP: process.env.ROBOT_IP || 'localhost',
    port: process.env.PORT || '3000',
    token: process.env.TOKEN || 'test-token'
};

async function testConnection() {
    try {
        const url = `http://${config.robotIP}:${config.port}/health`;
        console.log('Tentative de connexion à:', url);
        const response = await axios.get(url);
        console.log('Connexion au robot:', response.status === 200 ? 'OK' : 'Échec');
    } catch (error) {
        console.error('Erreur de connexion:', error.message);
        console.error('URL tentée:', `http://${config.robotIP}:${config.port}/health`);
    }
}

testConnection();
