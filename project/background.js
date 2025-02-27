import { EventBus } from './eventBus.js';
import { ModuleManager } from './modules/moduleManager.js';

// Ajouter l'import de la configuration
const config = {
    server: {
        port: 3000,
        host: 'localhost'
    },
    security: {
        authToken: 'test-token-123'
    }
};

const API_BASE_URL = 'http://localhost:3000'; // Modification pour utiliser directement l'URL
const AUTH_TOKEN = 'test-token-123'; // Token correspondant à celui du serveur

const eventBus = new EventBus();
const moduleManager = new ModuleManager();

let scheduledExecutions = [];
let schedules = [];

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('botExecution_')) {
    executeBot();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.type) {
      case 'SCHEDULE_BOT':
        scheduleBot(message.schedule);
        sendResponse({ success: true });
        break;
      case 'TEST_BOT':
        executeBot();
        sendResponse({ success: true });
        break;
      case 'GET_NEXT_EXECUTION':
        getNextExecution(sendResponse);
        return true;
      case 'GET_STATUS':
        getStatus().then(sendResponse);
        return true;
      case 'GET_SCHEDULES':
        getSchedules().then(sendResponse);
        return true;
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
  return true; // Keep the message channel open for async responses
});

// Gestion des états de connexion
let contentScriptReady = false;

// Amélioration de executeBot()
async function executeBot() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found');

    // Vérifier si l'API scripting est disponible
    if (!chrome.scripting) {
      // Fallback pour Manifest V2
      await chrome.tabs.executeScript(tab.id, { file: 'content.js' });
    } else {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    }

    // Injection et vérification du content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // Attente progressive avec vérification
      for (let i = 0; i < 3; i++) {
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
          contentScriptReady = true;
          break;
        } catch (e) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!contentScriptReady) {
        throw new Error('Content script not responding');
      }

      await chrome.tabs.sendMessage(tab.id, { type: 'EXECUTE_BOT' });
      showNotification('Bot Status', 'Bot execution started successfully');
      
    } catch (error) {
      showNotification('Bot Error', 'Failed to initialize bot. Please refresh the page.');
      console.error('Content script error:', error);
    }
    
  } catch (error) {
    console.error('Execute bot error:', error);
    showNotification('Bot Error', error.message || 'Failed to execute bot');
  }
}

// Amélioration des notifications
function showNotification(title, message) {
  const notificationOptions = {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('assets/icon-128.png'),
    title,
    message,
    silent: true,
    priority: 1,
    requireInteraction: false
  };

  try {
    chrome.notifications.create(
      `bot_notification_${Date.now()}`,
      notificationOptions,
      (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error('Notification error:', chrome.runtime.lastError);
        }
      }
    );
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

// Amélioration de la gestion des alarmes
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('botExecution_')) {
    try {
      await executeBot();
      // Mise à jour du statut d'exécution
      const alarmIndex = parseInt(alarm.name.split('_')[1]);
      if (scheduledExecutions[alarmIndex]) {
        scheduledExecutions[alarmIndex].status = 'executed';
      }
    } catch (error) {
      console.error('Alarm execution failed:', error);
    }
  }
});

async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'x-auth-token': AUTH_TOKEN,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Server error');
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Tentative ${i + 1}/${retries} échouée:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function getStatus() {
    try {
        return await fetchWithRetry(`${API_BASE_URL}/api/status`, {
            method: 'GET'
        });
    } catch (error) {
        console.error('Status fetch error:', error);
        return { status: 'ERROR', error: error.message };
    }
}

async function getSchedules() {
    try {
        const data = await fetchWithRetry(`${API_BASE_URL}/schedules`, {
            method: 'GET'
        });
        if (data.schedules) {
            schedules = data.schedules;
        }
        return data;
    } catch (error) {
        console.error('Schedules fetch error:', error);
        return { schedules: schedules || [] };
    }
}

async function scheduleBot(schedule) {
    try {
        const result = await fetchWithRetry(`${API_BASE_URL}/update-schedule`, {
            method: 'POST',
            body: JSON.stringify(schedule)
        });
        
        if (result.allSchedules) {
            schedules = result.allSchedules;
        }
        return result;
    } catch (error) {
        console.error('Schedule error:', error);
        throw error;
    }
}

function getNextExecution(sendResponse) {
  chrome.alarms.getAll((alarms) => {
    const executions = alarms
      .filter(alarm => alarm.name.startsWith('botExecution_'))
      .map(alarm => alarm.scheduledTime)
      .sort((a, b) => a - b);
    
    sendResponse(executions);
  });
}