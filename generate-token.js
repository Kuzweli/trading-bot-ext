const crypto = require('crypto');

const token = crypto.randomBytes(32).toString('hex');
console.log('Votre token de sécurité:', token);
