const axios = require('axios');
const config = require('./config');

async function testTrigger() {
    try {
        // Obtenir l'heure actuelle + 1 minute
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        const triggerTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        console.log(`Configuration du déclenchement pour ${triggerTime}...`);
        
        const response = await axios.post(
            'http://localhost:3000/update-schedule',
            {
                time: triggerTime,
                days: [now.getDay()] // Jour actuel
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': config.security.authToken
                }
            }
        );

        console.log('Programme configuré:', response.data);
        console.log('\nAttendez une minute pour voir le déclenchement...');
    } catch (error) {
        console.error('Erreur:', error.response?.data || error.message);
    }
}

testTrigger();
