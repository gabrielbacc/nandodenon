/**
 * Sistema centralizado de dados do site Nando Denon
 * Gerencia todas as interações de dados entre o dashboard e o site principal
 */

// Estrutura inicial de dados
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
        messages: 25,
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

// Carregar dados do localStorage ou usar os padrões
let siteData = JSON.parse(localStorage.getItem('siteData')) || defaultData;

// Garantir que as categorias padrão existam
if (!siteData.eventCategories) {
    siteData.eventCategories = defaultData.eventCategories;
    localStorage.setItem('siteData', JSON.stringify(siteData));
}

/**
 * API de gerenciamento de dados do site
 */
const SiteManager = {
    // Métodos gerais
    getData: function() {
        return siteData;
    },
    
    saveData: function() {
        localStorage.setItem('siteData', JSON.stringify(siteData));
        this.updateLastSync();
        
        // Disparar evento de atualização para quem estiver escutando
        const event = new CustomEvent('site-data-updated');
        document.dispatchEvent(event);
    },
    
    updateLastSync: function() {
        siteData.lastSync = new Date().toISOString();
    },
    
    // Métodos de Eventos (Agenda)
    getEvents: function() {
        return siteData.events;
    },
    
    addEvent: function(event) {
        if (!event.id) {
            event.id = Date.now().toString();
        }
        
        // Garantir que a data está no formato correto YYYY-MM-DD sem alteração de fuso horário
        // Usar uma abordagem mais direta para evitar qualquer manipulação de fuso horário
        if (event.date && event.date.includes('-')) {
            const dateParts = event.date.split('-');
            if (dateParts.length === 3) {
                // Manter exatamente o formato que veio
                event.date = event.date;
            }
        }
        
        siteData.events.push(event);
        this.updateStats();
        this.saveData();
        return event;
    },
    
    updateEvent: function(eventId, updatedEvent) {
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
            this.saveData();
            return siteData.events[index];
        }
        return null;
    },
    
    removeEvent: function(eventId) {
        siteData.events = siteData.events.filter(event => event.id !== eventId);
        this.updateStats();
        this.saveData();
    },
    
    getEventById: function(eventId) {
        return siteData.events.find(event => event.id === eventId);
    },
    
    // Métodos de Galeria
    getGallery: function() {
        return siteData.gallery;
    },
    
    addGalleryItem: function(item) {
        if (!item.id) {
            item.id = Date.now().toString();
        }
        siteData.gallery.push(item);
        this.saveData();
        return item;
    },
    
    removeGalleryItem: function(itemId) {
        siteData.gallery = siteData.gallery.filter(item => item.id !== itemId);
        this.saveData();
    },
    
    // Métodos de Mensagens (Contato)
    getMessages: function() {
        return siteData.messages;
    },
    
    addMessage: function(message) {
        message.id = Date.now().toString();
        message.date = new Date().toISOString();
        message.read = false;
        siteData.messages.push(message);
        this.updateStats();
        this.saveData();
        return message;
    },
    
    markMessageAsRead: function(messageId) {
        const index = siteData.messages.findIndex(msg => msg.id === messageId);
        if (index !== -1) {
            siteData.messages[index].read = true;
            this.updateStats();
            this.saveData();
        }
    },
    
    removeMessage: function(messageId) {
        siteData.messages = siteData.messages.filter(msg => msg.id !== messageId);
        this.updateStats();
        this.saveData();
    },
    
    // Métodos de Configurações
    getSettings: function() {
        return siteData.settings;
    },
    
    updateSettings: function(newSettings) {
        siteData.settings = { ...siteData.settings, ...newSettings };
        siteData.settings.lastUpdate = new Date().toISOString();
        this.saveData();
        return siteData.settings;
    },
    
    updateSocialLinks: function(links) {
        siteData.settings.socialLinks = { ...siteData.settings.socialLinks, ...links };
        siteData.settings.lastUpdate = new Date().toISOString();
        this.saveData();
        return siteData.settings.socialLinks;
    },
    
    updateContactInfo: function(contact) {
        siteData.settings.contact = { ...siteData.settings.contact, ...contact };
        siteData.settings.lastUpdate = new Date().toISOString();
        this.saveData();
        return siteData.settings.contact;
    },
    
    // Métodos de Estatísticas
    getStats: function() {
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
        
        this.saveData();
        return siteData.stats;
    },
    
    // Autenticação e sessão
    isLoggedIn: function() {
        return localStorage.getItem('isLoggedIn') === 'true';
    },
    
    login: function(username, password) {
        // Simulação simples de autenticação - em produção seria com backend
        if (username === 'admin' && password === 'admin') {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('loginTime', Date.now().toString());
            return true;
        }
        return false;
    },
    
    logout: function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('loginTime');
    },
    
    getUsername: function() {
        return localStorage.getItem('username') || 'Admin';
    },
    
    // Métodos de Categorias de Eventos
    getEventCategories: function() {
        return siteData.eventCategories;
    },
    
    addEventCategory: function(category) {
        if (!category.id) {
            category.id = category.name.toLowerCase().replace(/\s+/g, '-');
        }
        if (!category.icon) {
            category.icon = 'fa-calendar';
        }
        siteData.eventCategories.push(category);
        this.saveData();
        return category;
    },
    
    updateEventCategory: function(categoryId, updatedCategory) {
        const index = siteData.eventCategories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
            siteData.eventCategories[index] = { ...siteData.eventCategories[index], ...updatedCategory };
            this.saveData();
            return siteData.eventCategories[index];
        }
        return null;
    },
    
    removeEventCategory: function(categoryId) {
        // Don't remove if there are events using this category
        const hasEvents = siteData.events.some(event => event.type === categoryId);
        if (hasEvents) {
            return false;
        }
        siteData.eventCategories = siteData.eventCategories.filter(cat => cat.id !== categoryId);
        this.saveData();
        return true;
    },
};

// Para compatibilidade com o código existente, criamos um alias do EventManager
const EventManager = {
    getEvents: SiteManager.getEvents.bind(SiteManager),
    addEvent: SiteManager.addEvent.bind(SiteManager),
    updateEvent: SiteManager.updateEvent.bind(SiteManager),
    removeEvent: SiteManager.removeEvent.bind(SiteManager),
    getEventById: SiteManager.getEventById.bind(SiteManager),
    saveEvents: SiteManager.saveData.bind(SiteManager)
};

// Inicialização - garantir que as estatísticas estejam atualizadas
SiteManager.updateStats(); 