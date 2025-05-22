/**
 * Sistema centralizado de dados do site Nando Denon
 * Gerencia todas as interações de dados entre o dashboard e o site principal
 * Versão online com API
 */

// Configuração da API
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Estrutura de dados padrão (usado como fallback)
const defaultData = {
    events: [],
    gallery: [],
    messages: [],
    eventCategories: [
        { id: 'casamento', name: 'Casamento', icon: 'fa-ring' },
        { id: 'aniversario', name: 'Aniversário', icon: 'fa-cake-candles' },
        { id: 'corporativo', name: 'Corporativo', icon: 'fa-building' },
        { id: 'outro', name: 'Outro', icon: 'fa-calendar' }
    ],
    stats: {
        shows: 48,
        upcomingEvents: 0,
        messages: 0,
        views: 1200
    },
    settings: {
        socialLinks: {
            instagram: '#',
            youtube: '#',
            spotify: '#',
            tiktok: '#',
            whatsapp: '#'
        },
        contact: {
            phone: '+55 (XX) XXXXX-XXXX',
            email: 'contato@nandodenon.com.br',
            address: 'São Paulo, SP - Brasil'
        },
        lastUpdate: new Date().toISOString()
    },
    lastSync: new Date().toISOString()
};

// Dados atuais
let siteData = { ...defaultData };
let isInitialized = false;

// Funções de API
async function fetchData() {
    try {
        console.log('Tentando buscar dados...');
        // Verificar se estamos logados e devemos obter dados completos
        if (SiteManager.isLoggedIn()) {
            console.log('Usuário está logado, buscando dados completos...');
            const response = await fetch(`${API_BASE_URL}/data`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Dados completos recebidos com sucesso');
                return data;
            } else {
                console.warn('Falha ao buscar dados completos, código:', response.status);
            }
        } 
        
        // Se não estamos logados ou a requisição falhou, buscar dados públicos
        console.log('Buscando dados públicos...');
        const publicResponse = await fetch(`${API_BASE_URL}/public`);
        if (publicResponse.ok) {
            const publicData = await publicResponse.json();
            console.log('Dados públicos recebidos com sucesso', publicData);
            return { 
                ...defaultData, 
                ...publicData 
            };
        } else {
            console.warn('Falha ao buscar dados públicos, código:', publicResponse.status);
        }
        
        // Se todos falharem, retornar dados padrão ou cache
        console.log('Usando dados do cache ou padrão');
        const cachedData = JSON.parse(localStorage.getItem('siteDataCache')) || null;
        return cachedData || defaultData;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        // Em caso de erro, usar cache local
        return JSON.parse(localStorage.getItem('siteDataCache')) || defaultData;
    }
}

async function saveDataToAPI(data) {
    try {
        // Só salvar dados no servidor se estiver logado
        if (SiteManager.isLoggedIn()) {
            console.log('Salvando dados na API...');
            const response = await fetch(`${API_BASE_URL}/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                // Atualizar cache local
                localStorage.setItem('siteDataCache', JSON.stringify(data));
                console.log('Dados salvos com sucesso na API');
                return true;
            }
            console.warn('Falha ao salvar dados na API');
            return false;
        }
        
        // Mesmo sem login, atualizar cache local
        localStorage.setItem('siteDataCache', JSON.stringify(data));
        console.log('Dados salvos apenas localmente (sem login)');
        return false;
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        // Atualizar cache local mesmo em caso de erro
        localStorage.setItem('siteDataCache', JSON.stringify(data));
        return false;
    }
}

// Inicializar dados
async function initializeData() {
    if (!isInitialized) {
        console.log('Inicializando dados...');
        try {
            siteData = await fetchData();
            isInitialized = true;
            
            // Disparar evento de inicialização
            const event = new CustomEvent('site-data-initialized');
            document.dispatchEvent(event);
            console.log('Dados inicializados com sucesso');
        } catch (error) {
            console.error('Erro durante a inicialização dos dados:', error);
            siteData = { ...defaultData };
        }
    }
    return siteData;
}

/**
 * API de gerenciamento de dados do site
 */
const SiteManager = {
    // Inicialização
    init: async function() {
        await initializeData();
        return this;
    },
    
    // Métodos gerais
    getData: async function() {
        await initializeData();
        return siteData;
    },
    
    saveData: async function() {
        this.updateLastSync();
        const success = await saveDataToAPI(siteData);
        
        // Disparar evento de atualização para quem estiver escutando
        const event = new CustomEvent('site-data-updated');
        document.dispatchEvent(event);
        
        return success;
    },
    
    updateLastSync: function() {
        siteData.lastSync = new Date().toISOString();
    },
    
    // Métodos de Eventos (Agenda)
    getEvents: function() {
        // Retornar eventos sincronamente para compatibilidade com páginas que não utilizam async/await
        if (!isInitialized) {
            console.warn('Dados não inicializados ao requisitar eventos');
        }
        return siteData.events || [];
    },
    
    addEvent: async function(event) {
        await initializeData();
        
        if (!event.id) {
            event.id = Date.now().toString();
        }
        
        // Garantir que a data está no formato correto YYYY-MM-DD sem alteração de fuso horário
        if (event.date && event.date.includes('-')) {
            const dateParts = event.date.split('-');
            if (dateParts.length === 3) {
                // Manter exatamente o formato que veio
                event.date = event.date;
            }
        }
        
        siteData.events.push(event);
        this.updateStats();
        await this.saveData();
        return event;
    },
    
    updateEvent: async function(eventId, updatedEvent) {
        await initializeData();
        
        const index = siteData.events.findIndex(event => event.id === eventId);
        if (index !== -1) {
            // Garantir que a data está no formato correto YYYY-MM-DD sem alteração de fuso horário
            if (updatedEvent.date && updatedEvent.date.includes('-')) {
                const dateParts = updatedEvent.date.split('-');
                if (dateParts.length === 3) {
                    // Manter exatamente o formato que veio
                    updatedEvent.date = updatedEvent.date;
                }
            }
            
            siteData.events[index] = { ...siteData.events[index], ...updatedEvent };
            this.updateStats();
            await this.saveData();
            return siteData.events[index];
        }
        return null;
    },
    
    removeEvent: async function(eventId) {
        await initializeData();
        
        siteData.events = siteData.events.filter(event => event.id !== eventId);
        this.updateStats();
        await this.saveData();
    },
    
    getEventById: async function(eventId) {
        await initializeData();
        
        return siteData.events.find(event => event.id === eventId);
    },
    
    // Métodos de Galeria
    getGallery: async function() {
        await initializeData();
        
        return siteData.gallery;
    },
    
    addGalleryItem: async function(item) {
        await initializeData();
        
        if (!item.id) {
            item.id = Date.now().toString();
        }
        siteData.gallery.push(item);
        await this.saveData();
        return item;
    },
    
    removeGalleryItem: async function(itemId) {
        await initializeData();
        
        siteData.gallery = siteData.gallery.filter(item => item.id !== itemId);
        await this.saveData();
    },
    
    // Métodos de Mensagens (Contato)
    getMessages: async function() {
        await initializeData();
        
        return siteData.messages;
    },
    
    addMessage: async function(message) {
        // Para mensagens públicas, usar a API diretamente
        try {
            console.log('Enviando mensagem para a API:', message);
            const response = await fetch(`${API_BASE_URL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });
            
            if (response.ok) {
                console.log('Mensagem enviada com sucesso');
                // Se estamos logados, recarregar os dados
                if (this.isLoggedIn()) {
                    isInitialized = false;
                    await initializeData();
                }
                return true;
            }
            console.warn('Falha ao enviar mensagem');
            return false;
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return false;
        }
    },
    
    markMessageAsRead: async function(messageId) {
        await initializeData();
        
        const index = siteData.messages.findIndex(msg => msg.id === messageId);
        if (index !== -1) {
            siteData.messages[index].read = true;
            this.updateStats();
            await this.saveData();
        }
    },
    
    removeMessage: async function(messageId) {
        await initializeData();
        
        siteData.messages = siteData.messages.filter(msg => msg.id !== messageId);
        this.updateStats();
        await this.saveData();
    },
    
    // Métodos de Configurações
    getSettings: function() {
        // Retornar configurações sincronamente para compatibilidade com páginas que não utilizam async/await
        if (!isInitialized) {
            console.warn('Dados não inicializados ao requisitar configurações');
        }
        return siteData.settings || defaultData.settings;
    },
    
    updateSettings: async function(newSettings) {
        await initializeData();
        
        siteData.settings = { ...siteData.settings, ...newSettings };
        siteData.settings.lastUpdate = new Date().toISOString();
        await this.saveData();
        return siteData.settings;
    },
    
    updateSocialLinks: async function(links) {
        await initializeData();
        
        siteData.settings.socialLinks = { ...siteData.settings.socialLinks, ...links };
        siteData.settings.lastUpdate = new Date().toISOString();
        await this.saveData();
        return siteData.settings.socialLinks;
    },
    
    updateContactInfo: async function(contact) {
        await initializeData();
        
        siteData.settings.contact = { ...siteData.settings.contact, ...contact };
        siteData.settings.lastUpdate = new Date().toISOString();
        await this.saveData();
        return siteData.settings.contact;
    },
    
    // Métodos de Estatísticas
    getStats: async function() {
        await initializeData();
        
        return siteData.stats;
    },
    
    updateStats: function() {
        // Calcular estatísticas atualizadas
        const now = new Date();
        
        // Eventos futuros
        siteData.stats.upcomingEvents = siteData.events.filter(
            event => new Date(event.date) >= now
        ).length;
        
        // Mensagens não lidas
        siteData.stats.messages = siteData.messages.filter(
            msg => !msg.read
        ).length;
    },
    
    // Autenticação e sessão
    isLoggedIn: function() {
        return localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('authToken');
    },
    
    login: async function(username, password) {
        try {
            console.log('Tentando fazer login:', username);
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('Login realizado com sucesso');
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('loginTime', Date.now().toString());
                    
                    // Recarregar dados
                    isInitialized = false;
                    await initializeData();
                    
                    return true;
                }
            }
            console.warn('Falha no login');
            return false;
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return false;
        }
    },
    
    logout: function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('authToken');
        localStorage.removeItem('loginTime');
    },
    
    getUsername: function() {
        return localStorage.getItem('username') || 'Admin';
    },
    
    // Métodos de Categorias de Eventos
    getEventCategories: function() {
        // Retornar categorias sincronamente para compatibilidade com páginas que não utilizam async/await
        if (!isInitialized) {
            console.warn('Dados não inicializados ao requisitar categorias de eventos');
        }
        return siteData.eventCategories || defaultData.eventCategories;
    },
    
    addEventCategory: async function(category) {
        await initializeData();
        
        if (!category.id) {
            category.id = category.name.toLowerCase().replace(/\s+/g, '-');
        }
        if (!category.icon) {
            category.icon = 'fa-calendar';
        }
        siteData.eventCategories.push(category);
        await this.saveData();
        return category;
    },
    
    updateEventCategory: async function(categoryId, updatedCategory) {
        await initializeData();
        
        const index = siteData.eventCategories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
            siteData.eventCategories[index] = { ...siteData.eventCategories[index], ...updatedCategory };
            await this.saveData();
            return siteData.eventCategories[index];
        }
        return null;
    },
    
    removeEventCategory: async function(categoryId) {
        await initializeData();
        
        // Don't remove if there are events using this category
        const hasEvents = siteData.events.some(event => event.type === categoryId);
        if (hasEvents) {
            return false;
        }
        siteData.eventCategories = siteData.eventCategories.filter(cat => cat.id !== categoryId);
        await this.saveData();
        return true;
    },
};

// Inicializar dados
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar automaticamente os dados quando o DOM estiver pronto
    initializeData().catch(error => {
        console.error('Falha na inicialização automática:', error);
    });
});

// Para compatibilidade com o código existente, criamos um alias do EventManager
const EventManager = {
    getEvents: function() {
        return SiteManager.getEvents();
    },
    addEvent: async function(event) {
        return await SiteManager.addEvent(event);
    },
    updateEvent: async function(eventId, updatedEvent) {
        return await SiteManager.updateEvent(eventId, updatedEvent);
    },
    removeEvent: async function(eventId) {
        return await SiteManager.removeEvent(eventId);
    },
    getEventById: async function(eventId) {
        return await SiteManager.getEventById(eventId);
    },
    saveEvents: async function() {
        return await SiteManager.saveData();
    }
}; 