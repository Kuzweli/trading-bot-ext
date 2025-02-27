const axios = require('axios');

async function testSchedule() {
    try {
        // Test de programmation
        const scheduleResponse = await axios.post('http://localhost:3000/update-schedule', {
            time: '10:00',
            days: [1, 2, 3] // Lundi, Mardi, Mercredi
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': 'VOTRE_TOKEN_SECURITE'
            }
        });
        console.log('Réponse de programmation:', scheduleResponse.data);

        // Vérification du statut
        const statusResponse = await axios.get('http://localhost:3000/api/status', {
            headers: {
                'x-auth-token': 'VOTRE_TOKEN_SECURITE'
            }
        });
        console.log('Statut actuel:', statusResponse.data);

    } catch (error) {
        console.error('Erreur de test:', error.response?.data || error.message);
    }
}

testSchedule();
