const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'VOTRE_TOKEN_SECURITE';

async function testEndpoints() {
    try {
        // Test sans auth
        console.log('\nTest de /test:');
        const testResponse = await axios.get(`${API_BASE_URL}/test`);
        console.log('Réponse:', testResponse.data);

        // Test avec auth
        console.log('\nTest de /api/status:');
        const statusResponse = await axios.get(`${API_BASE_URL}/api/status`, {
            headers: {
                'x-auth-token': AUTH_TOKEN
            }
        });
        console.log('Réponse:', statusResponse.data);

    } catch (error) {
        console.error('Erreur:', error.response?.data || error.message);
    }
}

testEndpoints();
