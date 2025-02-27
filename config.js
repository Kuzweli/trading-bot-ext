module.exports = {
    server: {
        port: 3000,
        host: 'localhost'
    },
    security: {
        authToken: 'local-token-123'
    },
    robot: {
        endpoint: 'http://localhost:3000/start-robot',
        timeout: 5000,
        retryAttempts: 3,
        retryDelay: 1000
    }
};
