const axios = require('axios');
const config = require('./config');

const API_BASE_URL = `http://${config.server.host}:${config.server.port}`;
const AUTH_TOKEN = config.security.authToken;

async function testScheduleUpdate() {
    try {
        // Test de connexion de base
        console.log('Test de connexion au serveur...');
        const testResponse = await axios.get(`${API_BASE_URL}/test`);
        console.log('Connexion au serveur OK:', testResponse.data);

        console.log('\nTest de programmation trading:');
        console.log('Envoi des données:', {
            time: '10:30',
            days: [1, 2, 3, 4, 5]
        });

        const scheduleResponse = await axios.post(
            `${API_BASE_URL}/update-schedule`,
            {
                time: '10:30',
                days: [1, 2, 3, 4, 5]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': AUTH_TOKEN
                },
                timeout: 5000
            }
        );
        console.log('Réponse programmation:', scheduleResponse.data);

    } catch (error) {
        console.error('Erreur détaillée:');
        if (error.response) {
            // La requête a été faite et le serveur a répondu avec un code d'erreur
            console.error('Status:', error.response.status);
            console.error('Données:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            // La requête a été faite mais aucune réponse n'a été reçue
            console.error('Pas de réponse du serveur');
            console.error('Requête:', error.request);
        } else {
            // Une erreur s'est produite lors de la configuration de la requête
            console.error('Erreur:', error.message);
        }
    }
}

// Vérifie d'abord si le serveur est en cours d'exécution
axios.get(`${API_BASE_URL}/test`)
    .then(() => {
        console.log('Serveur accessible, démarrage des tests...\n');
        testScheduleUpdate();
    })
    .catch(error => {
        console.error('ERREUR: Le serveur n\'est pas accessible.');
        console.error('Assurez-vous que le serveur est démarré sur le port 3000');
        console.error('Détails:', error.message);
    });
