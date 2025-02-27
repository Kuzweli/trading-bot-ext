module.exports = {
    server: {
        region: 'eu-frankfurt-1',  // Europe (plus rapide pour Deriv)
        shape: 'VM.Standard.A1.Flex',  // Instance ARM gratuite
        cpu: 2,
        memory: 12,  // 12GB RAM gratuit
        persistentStorage: true  // Garde les données même si redémarrage
    },
    monitoring: {
        alerts: true,  // Alerte si problème
        autoRestart: true  // Redémarre automatiquement si crash
    }
};
