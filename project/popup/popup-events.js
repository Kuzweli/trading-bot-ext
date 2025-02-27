import { EventBus } from '../eventBus.js';

class PopupController {
    constructor() {
        this.initializeEventListeners();
        this.updateStatus();
        this.updateSchedulesList();
        // Actualiser la liste toutes les 30 secondes
        setInterval(() => this.updateSchedulesList(), 30000);
    }

    initializeEventListeners() {
        document.getElementById('testBot')?.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'TEST_BOT' });
        });

        document.getElementById('addSchedule')?.addEventListener('click', () => {
            this.handleScheduleAdd();
        });

        // Ajout de la validation des horaires
        document.getElementById('scheduleTime')?.addEventListener('change', (e) => {
            this.validateTimeInput(e.target);
        });

        // Mise à jour du statut en temps réel
        setInterval(() => this.updateStatus(), 30000);

        document.getElementById('activeSchedules')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-schedule')) {
                const scheduleItem = e.target.closest('.schedule-item');
                if (scheduleItem) {
                    const scheduleId = scheduleItem.dataset.id;
                    this.deleteSchedule(scheduleId);
                }
            }
        });
    }

    validateTimeInput(input) {
        const time = input.value;
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        
        if (!timeRegex.test(time)) {
            input.setCustomValidity('Format invalide. Utilisez HH:MM');
            return false;
        }
        
        input.setCustomValidity('');
        return true;
    }

    async updateStatus() {
        const statusElement = document.getElementById('status');
        if (!statusElement) return;

        try {
            // Utiliser chrome.runtime.sendMessage au lieu de fetch
            const response = await chrome.runtime.sendMessage({
                type: 'GET_STATUS'
            });
            
            if (response.error) throw new Error(response.error);
            
            statusElement.textContent = response.status;
            statusElement.className = `status-display ${response.status.toLowerCase()}`;
        } catch (error) {
            console.error('Status update error:', error);
            statusElement.textContent = 'Déconnecté';
            statusElement.className = 'status-display error';
        }
    }

    async handleScheduleAdd() {
        const timeInput = document.getElementById('scheduleTime');
        const scheduleStatus = document.getElementById('scheduleStatus');
        
        if (!timeInput || !scheduleStatus) {
            console.error('Required elements not found');
            alert('Erreur: Éléments de l\'interface non trouvés');
            return;
        }

        const time = timeInput.value;
        const selectedDays = Array.from(document.querySelectorAll('.day-checkbox:checked'))
            .map(checkbox => parseInt(checkbox.value, 10));

        // Validation côté client améliorée
        if (!this.validateTimeInput(timeInput)) {
            alert('Veuillez entrer une heure valide (format HH:MM)');
            return;
        }

        if (selectedDays.length === 0) {
            alert('Veuillez sélectionner au moins un jour');
            return;
        }

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'SCHEDULE_BOT',
                schedule: { time, days: selectedDays }
            });

            if (response.success) {
                scheduleStatus.textContent = 
                    `Programmé pour ${time} les jours : ${selectedDays.join(', ')}`;
            } else {
                throw new Error(response.error || 'Erreur inconnue');
            }
        } catch (error) {
            console.error('Erreur de planification:', error);
            scheduleStatus.textContent = 'Erreur: ' + error.message;
            alert('Erreur lors de la programmation: ' + error.message);
        }
    }

    async updateSchedulesList() {
        const schedulesContainer = document.getElementById('activeSchedules');
        if (!schedulesContainer) return;

        try {
            console.log('Récupération des programmes...');
            const response = await chrome.runtime.sendMessage({ type: 'GET_SCHEDULES' });
            console.log('Réponse reçue:', response);
            
            if (response.error) throw new Error(response.error);
            
            if (!response.schedules || !Array.isArray(response.schedules)) {
                throw new Error('Format de réponse invalide');
            }
            
            const html = response.schedules
                .map(schedule => this.createScheduleElement(schedule))
                .join('');
                
            console.log('HTML généré:', html);
            schedulesContainer.innerHTML = html;
        } catch (error) {
            console.error('Erreur lors de la récupération des programmes:', error);
            schedulesContainer.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
        }
    }

    createScheduleElement(schedule) {
        const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const daysText = schedule.days.map(d => jours[d]).join(', ');
        const nextExecution = new Date(schedule.nextExecution);
        
        return `
            <div class="schedule-item" data-id="${schedule.id}">
                <div class="schedule-info">
                    <div class="schedule-time">${schedule.time}</div>
                    <div class="schedule-days">${daysText}</div>
                    <div class="schedule-next">Prochaine exécution: ${nextExecution.toLocaleString()}</div>
                </div>
                <div class="schedule-controls">
                    <span class="schedule-status ${schedule.active ? 'active' : ''}">${schedule.active ? 'Actif' : 'Inactif'}</span>
                    <button class="delete-schedule" title="Supprimer ce programme">×</button>
                </div>
            </div>
        `;
    }

    async deleteSchedule(id) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'DELETE_SCHEDULE',
                scheduleId: id
            });

            if (response.success) {
                this.updateSchedulesList();
            } else {
                throw new Error(response.error || 'Erreur de suppression');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du programme');
        }
    }
}

// Initialize the popup controller
new PopupController();