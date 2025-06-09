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
            tiktok: '#'
        },
        contact: {
            phone: '+55 (XX) XXXXX-XXXX',
            email: 'contato@nandodenon.com.br',
            address: 'São Paulo, SP - Brasil'
        }
    },
    // Adicionando estrutura financeira
    transactions: [],
    bandMembers: [],
    expenses: [],
    shows: [],
    finance: {
        currentIncome: 0,
        currentExpenses: 0,
        netProfit: 0,
        incomeTrend: 0,
        expensesTrend: 0,
        profitTrend: 0,
        showIncome: 0,
        showIncomeTrend: 0
    },
    lastSync: new Date().toISOString()
};

// Variáveis de estado
let isInitialized = false;
let siteData = { ...defaultData };
let isLoggedIn = false;

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

// Função de compatibilidade (removida, agora incorporada no método saveData)
async function saveDataToAPI(data) {
    console.warn('Função saveDataToAPI está obsoleta, use SiteManager.saveData() diretamente');
    // Salvar localmente para compatibilidade
    localStorage.setItem('siteDataCache', JSON.stringify(data));
    return SiteManager.saveData();
}

// Função para inicializar os dados
async function initializeData() {
    if (isInitialized) return true;

    try {
        // Verificar login
        const token = localStorage.getItem('authToken');
        const storedLoginState = localStorage.getItem('isLoggedIn') === 'true';
        isLoggedIn = storedLoginState && !!token;

        // Tentar carregar dados do localStorage
        const localData = localStorage.getItem('siteData');
        if (localData) {
            try {
                siteData = JSON.parse(localData);
                console.log('Dados carregados do localStorage');
            } catch (e) {
                console.error('Erro ao carregar dados do localStorage:', e);
                siteData = { ...defaultData };
            }
        } else {
            siteData = { ...defaultData };
        }

        isInitialized = true;
        return true;
    } catch (error) {
        console.error('Erro ao inicializar dados:', error);
        isInitialized = true; // Mesmo com erro, marcamos como inicializado para evitar loops
        return false;
    }
}

/**
 * API de gerenciamento de dados do site
 */
const SiteManager = {
    // Inicialização
    init: async function() {
        return await initializeData();
    },

    // Autenticação
    login: function(username, password) {
        if (username === 'admin' && password === 'admin') {
            localStorage.setItem('authToken', 'dummy-token');
            localStorage.setItem('isLoggedIn', 'true');
            isLoggedIn = true;
            return true;
        }
        return false;
    },

    logout: function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('isLoggedIn');
        isLoggedIn = false;
    },

    isLoggedIn: function() {
        // Verificar tanto a variável de estado quanto o localStorage
        const storedLoginState = localStorage.getItem('isLoggedIn') === 'true';
        const hasToken = !!localStorage.getItem('authToken');
        isLoggedIn = storedLoginState && hasToken;
        return isLoggedIn;
    },

    // Gerenciamento de dados
    getData: function() {
        try {
            return siteData;
        } catch (error) {
            console.error('Erro ao obter dados:', error);
            return { events: [], gallery: [], messages: [], lastSync: null };
        }
    },

    saveData: async function() {
        try {
            localStorage.setItem('siteData', JSON.stringify(siteData));
            
            // Atualizar cache para dados públicos
            try {
                const currentCache = JSON.parse(localStorage.getItem('siteDataCache')) || {};
                currentCache.events = siteData.events || [];
                currentCache.finance = siteData.finance || {};
                currentCache.leads = siteData.leads || [];
                currentCache.lastSync = new Date().toISOString();
                localStorage.setItem('siteDataCache', JSON.stringify(currentCache));
            } catch (err) {
                console.error('Erro ao atualizar cache:', err);
            }
            
            // Disparar evento de atualização
            const event = new CustomEvent('site-data-updated');
            document.dispatchEvent(event);
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            throw new Error('Não foi possível salvar os dados: ' + error.message);
        }
    },

    // Gerenciamento de eventos
    getEvents: function() {
        try {
            return siteData.events || [];
        } catch (error) {
            console.error('Erro ao obter eventos:', error);
            return [];
        }
    },

    addEvent: function(event) {
        try {
            if (!event.id) {
                event.id = Date.now().toString();
            }
            
            // Validar evento antes de adicionar
            if (!event.title || !event.date || !event.time || !event.location) {
                throw new Error('Dados do evento incompletos');
            }
            
            // Verificar se já existe um evento com mesmo ID
            const existingEvent = siteData.events.find(e => e.id === event.id);
            if (existingEvent) {
                throw new Error('Já existe um evento com este ID');
            }
            
            siteData.events.push(event);
            this.updateStats();
            this.saveData();
            return event;
        } catch (error) {
            console.error('Erro ao adicionar evento:', error);
            throw error;
        }
    },

    updateEvent: function(eventId, updatedEvent) {
        try {
            const index = siteData.events.findIndex(event => event.id === eventId);
            if (index === -1) {
                throw new Error('Evento não encontrado');
            }
            
            // Validar evento antes de atualizar
            if (!updatedEvent.title || !updatedEvent.date || !updatedEvent.time || !updatedEvent.location) {
                throw new Error('Dados do evento incompletos');
            }
            
            siteData.events[index] = { ...siteData.events[index], ...updatedEvent };
            this.updateStats();
            this.saveData();
            return siteData.events[index];
        } catch (error) {
            console.error('Erro ao atualizar evento:', error);
            throw error;
        }
    },

    removeEvent: function(eventId) {
        try {
            const originalLength = siteData.events.length;
            siteData.events = siteData.events.filter(event => event.id !== eventId);
            
            if (siteData.events.length === originalLength) {
                throw new Error('Evento não encontrado');
            }
            
            this.updateStats();
            this.saveData();
            return true;
        } catch (error) {
            console.error('Erro ao remover evento:', error);
            throw error;
        }
    },

    getEventById: function(eventId) {
        try {
            return siteData.events.find(event => event.id === eventId) || null;
        } catch (error) {
            console.error('Erro ao buscar evento por ID:', error);
            return null;
        }
    },

    // Gerenciamento de categorias de eventos
    getEventCategories: function() {
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
        
        // Não remover se houver eventos usando esta categoria
        const hasEvents = siteData.events.some(event => event.type === categoryId);
        if (hasEvents) {
            return false;
        }
        siteData.eventCategories = siteData.eventCategories.filter(cat => cat.id !== categoryId);
        await this.saveData();
        return true;
    },

    // Atualização de estatísticas
    updateStats: function() {
        const now = new Date();
        
        // Eventos futuros
        siteData.stats.upcomingEvents = siteData.events.filter(
            event => new Date(event.date) >= now
        ).length;
        
        // Atualizar outras estatísticas conforme necessário
        this.saveData().catch(console.error);
    },

    // Configurações
    getSettings: function() {
        return siteData.settings || defaultData.settings;
    },

    updateSettings: async function(newSettings) {
        await initializeData();
        siteData.settings = { ...siteData.settings, ...newSettings };
        await this.saveData();
        return siteData.settings;
    },

    // Dados iniciais para teste
    initializeTestData: function() {
        const testData = {
            transactions: [
                {
                    id: '1',
                    date: '2024-03-15',
                    description: 'Show Aniversário Enrico',
                    type: 'receita',
                    category: 'show',
                    amount: 3500,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    date: '2024-03-14',
                    description: 'Pagamento Banda - Show Enrico',
                    type: 'despesa',
                    category: 'pagamento-banda',
                    amount: 1500,
                    createdAt: new Date().toISOString()
                }
            ],
            bandMembers: [
                {
                    id: '1',
                    name: 'João Silva',
                    instrument: 'Guitarra',
                    showRate: 500,
                    phone: '11999999999',
                    email: 'joao@email.com'
                }
            ],
            finance: {
                currentIncome: 3500,
                currentExpenses: 1500,
                netProfit: 2000,
                incomeTrend: 15,
                expensesTrend: 5,
                profitTrend: 25,
                showIncome: 3500,
                showIncomeTrend: 20
            }
        };

        siteData = {
            ...siteData,
            ...testData
        };

        localStorage.setItem('siteDataCache', JSON.stringify(siteData));
        return siteData;
    },
    
    // Métodos gerais
    getData: async function() {
        if (!this.isLoggedIn()) {
            throw new Error('AUTH_REQUIRED');
        }
        
        if (!isInitialized) {
            await this.init();
        }
        
        // Se não houver dados no cache, inicializar dados de teste
        const cachedData = localStorage.getItem('siteDataCache');
        if (!cachedData) {
            return this.initializeTestData();
        }
        
        return siteData;
    },
    
    updateLastSync: function() {
        try {
            siteData.lastSync = new Date().toISOString();
        } catch (error) {
            console.error('Erro ao atualizar lastSync:', error);
        }
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
        
        return siteData.messages || [];
    },
    
    addMessage: async function(message) {
        // Preparar a mensagem no formato correto
        const formattedMessage = {
            ...message,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            read: false
        };
        
        // Inicializar o array de mensagens se não existir
        if (!siteData.messages) {
            siteData.messages = [];
        }
        
        // Salvar localmente primeiro (estratégia offline-first)
        siteData.messages.push(formattedMessage);
        this.updateStats();
        await this.saveData();
        console.log('Mensagem salva localmente antes da tentativa online:', formattedMessage);
        
        // Para mensagens públicas, tentar enviar para o servidor
        try {
            console.log('Enviando mensagem para a API:', message);
            
            // Tentativa de envio para o servidor
            const response = await fetch(`${API_BASE_URL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Mensagem enviada com sucesso para a API:', result);
                
                // Se estamos logados, recarregar os dados
                if (this.isLoggedIn()) {
                    console.log('Usuário logado, recarregando dados após envio da mensagem');
                    isInitialized = false;
                    await initializeData();
                }
                
                // Mostrar alerta de confirmação
                try {
                    alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
                } catch (e) {
                    // Alguns navegadores podem bloquear alertas
                    console.log('Não foi possível mostrar o alerta de confirmação');
                }
                
                return true;
            } else {
                console.error('Erro ao enviar mensagem para API:', response.status);
                let errorMessage = 'Mensagem foi salva localmente. Tentaremos enviar posteriormente.';
                
                try {
                    const errorData = await response.json();
                    console.error('Detalhes do erro:', errorData);
                    if (errorData && errorData.message) {
                        errorMessage += ' Erro: ' + errorData.message;
                    }
                } catch (e) {
                    console.error('Não foi possível processar a resposta de erro:', e);
                }
                
                // Mostrar mensagem de erro/informação
                try {
                    alert(errorMessage);
                } catch (e) {
                    // Alguns navegadores podem bloquear alertas
                    console.log('Não foi possível mostrar o alerta de erro/informação');
                }
                
                // Retornar true já que salvamos localmente
                return true;
            }
        } catch (error) {
            console.error('Exceção ao enviar mensagem para API:', error);
            
            // Alertar o usuário que a mensagem foi salva localmente
            try {
                alert('Mensagem armazenada localmente. Será sincronizada automaticamente quando houver conexão.');
            } catch (e) {
                // Alguns navegadores podem bloquear alertas
                console.log('Não foi possível mostrar o alerta de fallback');
            }
            
            // Retornar true já que salvamos localmente
            return true;
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
    
    // Métodos de Estatísticas
    getStats: async function() {
        await initializeData();
        
        return siteData.stats;
    },

    // Leads Management
    async getLeads() {
        const data = await this.getData();
        return data.leads || [];
    },

    async getLeadById(leadId) {
        const leads = await this.getLeads();
        return leads.find(lead => lead.id === leadId);
    },

    async addLead(lead) {
        const data = await this.getData();
        if (!data.leads) data.leads = [];
        data.leads.push(lead);
        await this.saveData();
        return lead;
    },

    async updateLead(leadId, updatedLead) {
        const data = await this.getData();
        if (!data.leads) data.leads = [];
        const index = data.leads.findIndex(lead => lead.id === leadId);
        if (index !== -1) {
            data.leads[index] = { ...data.leads[index], ...updatedLead };
            await this.saveData();
            return data.leads[index];
        }
        return null;
    },

    async removeLead(leadId) {
        const data = await this.getData();
        if (!data.leads) return false;
        const index = data.leads.findIndex(lead => lead.id === leadId);
        if (index !== -1) {
            data.leads.splice(index, 1);
            await this.saveData();
            return true;
        }
        return false;
    },

    // Event Types Management
    getEventTypes() {
        const data = this.getData();
        return data.eventTypes || [
            { id: 'casamento', name: 'Casamento', icon: 'fa-ring' },
            { id: 'aniversario', name: 'Aniversário', icon: 'fa-cake-candles' },
            { id: 'corporativo', name: 'Corporativo', icon: 'fa-building' },
            { id: 'bar', name: 'Bar/Restaurante', icon: 'fa-martini-glass' },
            { id: 'outro', name: 'Outro', icon: 'fa-star' }
        ];
    },

    async addEventType(eventType) {
        const data = await this.getData();
        if (!data.eventTypes) {
            data.eventTypes = this.getEventTypes();
        }
        eventType.id = eventType.name.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
        data.eventTypes.push(eventType);
        await this.saveData(data);
        return eventType;
    },

    async updateEventType(typeId, updatedType) {
        const data = await this.getData();
        if (!data.eventTypes) {
            data.eventTypes = this.getEventTypes();
        }
        const index = data.eventTypes.findIndex(type => type.id === typeId);
        if (index !== -1) {
            data.eventTypes[index] = { ...data.eventTypes[index], ...updatedType };
            await this.saveData(data);
            return data.eventTypes[index];
        }
        return null;
    },

    async removeEventType(typeId) {
        const data = await this.getData();
        if (!data.eventTypes) return false;
        
        // Verificar se existem leads usando este tipo
        if (data.leads && data.leads.some(lead => lead.type === typeId)) {
            return false; // Não permite remover se houver leads usando
        }
        
        const index = data.eventTypes.findIndex(type => type.id === typeId);
        if (index !== -1) {
            data.eventTypes.splice(index, 1);
            await this.saveData(data);
            return true;
        }
        return false;
    },

    // Import/Export Functions
    exportData() {
        try {
            // Criar objeto com todos os dados do sistema
            const exportData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                data: {
                    // Dados do sistema principal
                    events: siteData.events || [],
                    gallery: siteData.gallery || [],
                    messages: siteData.messages || [],
                    eventCategories: siteData.eventCategories || [],
                    stats: siteData.stats || {},
                    settings: siteData.settings || {},
                    
                    // Dados financeiros
                    finance: siteData.finance || {
                        transactions: [],
                        bandMembers: [],
                        expenses: [],
                        shows: [],
                        currentIncome: 0,
                        currentExpenses: 0,
                        netProfit: 0,
                        incomeTrend: 0,
                        expensesTrend: 0,
                        profitTrend: 0,
                        showIncome: 0,
                        showIncomeTrend: 0
                    },
                    
                    // Dados de leads
                    leads: siteData.leads || [],
                    eventTypes: siteData.eventTypes || [],
                    
                    // Metadados
                    lastSync: new Date().toISOString(),
                    exportedBy: localStorage.getItem('adminName') || 'Admin'
                }
            };

            // Converter para string e codificar em base64
            const jsonStr = JSON.stringify(exportData);
            const base64Data = btoa(jsonStr);

            return base64Data;
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            throw new Error('Não foi possível exportar os dados: ' + error.message);
        }
    },

    async importData(base64Data) {
        try {
            // Criar backup antes de importar
            const backupKey = this._createBackup();
            if (!backupKey) {
                throw new Error('Não foi possível criar backup antes de importar');
            }

            // Decodificar e parsear os dados
            const jsonStr = atob(base64Data);
            const importData = JSON.parse(jsonStr);

            // Validar versão e estrutura
            if (!importData.version || !importData.data) {
                throw new Error('Formato de dados inválido');
            }

            try {
                // Validar dados que serão importados
                if (!this._validateData(importData.data)) {
                    throw new Error('Os dados a serem importados são inválidos');
                }

                // Carregar dados atuais
                const currentData = await this.getData();

                // Função auxiliar para mesclar arrays removendo duplicatas por ID
                const mergeArraysById = (current = [], imported = []) => {
                    const merged = [...current];
                    imported.forEach(item => {
                        if (!item.id) {
                            item.id = Date.now() + Math.random().toString(36).substr(2, 9);
                        }
                        const existingIndex = merged.findIndex(x => x.id === item.id);
                        if (existingIndex === -1) {
                            merged.push(item);
                        }
                    });
                    return merged;
                };

                // Mesclar dados
                siteData = {
                    ...currentData,
                    events: mergeArraysById(currentData.events, importData.data.events),
                    gallery: mergeArraysById(currentData.gallery, importData.data.gallery),
                    messages: mergeArraysById(currentData.messages, importData.data.messages),
                    eventCategories: mergeArraysById(currentData.eventCategories, importData.data.eventCategories),
                    eventTypes: mergeArraysById(currentData.eventTypes, importData.data.eventTypes),
                    leads: mergeArraysById(currentData.leads, importData.data.leads),
                    stats: { ...currentData.stats, ...importData.data.stats },
                    settings: { ...currentData.settings, ...importData.data.settings },
                    finance: {
                        transactions: mergeArraysById(
                            currentData.finance?.transactions,
                            importData.data.finance?.transactions
                        ),
                        bandMembers: mergeArraysById(
                            currentData.finance?.bandMembers,
                            importData.data.finance?.bandMembers
                        ),
                        expenses: mergeArraysById(
                            currentData.finance?.expenses,
                            importData.data.finance?.expenses
                        ),
                        shows: mergeArraysById(
                            currentData.finance?.shows,
                            importData.data.finance?.shows
                        ),
                        currentIncome: (currentData.finance?.currentIncome || 0) + (importData.data.finance?.currentIncome || 0),
                        currentExpenses: (currentData.finance?.currentExpenses || 0) + (importData.data.finance?.currentExpenses || 0),
                        netProfit: (currentData.finance?.netProfit || 0) + (importData.data.finance?.netProfit || 0),
                        incomeTrend: Math.max(currentData.finance?.incomeTrend || 0, importData.data.finance?.incomeTrend || 0),
                        expensesTrend: Math.max(currentData.finance?.expensesTrend || 0, importData.data.finance?.expensesTrend || 0),
                        profitTrend: Math.max(currentData.finance?.profitTrend || 0, importData.data.finance?.profitTrend || 0),
                        showIncome: (currentData.finance?.showIncome || 0) + (importData.data.finance?.showIncome || 0),
                        showIncomeTrend: Math.max(currentData.finance?.showIncomeTrend || 0, importData.data.finance?.showIncomeTrend || 0)
                    },
                    lastSync: new Date().toISOString()
                };

                // Salvar os dados mesclados
                await this.saveData();

                // Disparar evento de atualização
                const event = new CustomEvent('site-data-updated');
                document.dispatchEvent(event);

                return true;
            } catch (error) {
                // Se algo der errado, restaurar do backup
                await this._restoreFromBackup(backupKey);
                throw error;
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            throw new Error(`Não foi possível importar os dados: ${error.message}`);
        }
    },

    _validateData(data) {
        try {
            // Verificar se os dados são um objeto válido
            if (!data || typeof data !== 'object') return false;

            // Verificar estruturas essenciais
            const requiredStructures = [
                'events',
                'gallery',
                'messages',
                'eventCategories',
                'stats',
                'settings',
                'transactions',
                'bandMembers',
                'expenses',
                'shows',
                'finance',
                'leads',
                'eventTypes'
            ];

            // Verificar se todas as estruturas existem
            for (const structure of requiredStructures) {
                if (data[structure] === undefined) {
                    data[structure] = defaultData[structure];
                }

                // Garantir que arrays sejam arrays
                if (Array.isArray(defaultData[structure])) {
                    if (!Array.isArray(data[structure])) {
                        data[structure] = [];
                    }
                }
                // Garantir que objetos sejam objetos
                else if (typeof defaultData[structure] === 'object') {
                    if (typeof data[structure] !== 'object' || data[structure] === null) {
                        data[structure] = { ...defaultData[structure] };
                    }
                }
            }

            return true;
        } catch (error) {
            console.error('Erro na validação de dados:', error);
            return false;
        }
    },

    // Função para criar backup
    _createBackup() {
        try {
            const timestamp = new Date().toISOString();
            const backupKey = `siteBackup_${timestamp}`;
            
            // Criar objeto de backup
            const backup = {
                timestamp: timestamp,
                data: { ...siteData }
            };
            
            // Salvar backup
            localStorage.setItem(backupKey, JSON.stringify(backup));
            
            // Manter apenas os 5 backups mais recentes
            const backupKeys = Object.keys(localStorage)
                .filter(key => key.startsWith('siteBackup_'))
                .sort()
                .reverse();
                
            // Remover backups extras
            if (backupKeys.length > 5) {
                backupKeys.slice(5).forEach(key => localStorage.removeItem(key));
            }
            
            return backupKey;
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            return null;
        }
    },

    // Função para restaurar backup
    async _restoreFromBackup(specificKey = null) {
        try {
            // Encontrar o backup mais recente ou usar o especificado
            const backupKeys = Object.keys(localStorage)
                .filter(key => key.startsWith('siteBackup_'))
                .sort()
                .reverse();
                
            if (backupKeys.length === 0) {
                throw new Error('Nenhum backup encontrado');
            }
            
            const backupKey = specificKey || backupKeys[0];
            const backup = JSON.parse(localStorage.getItem(backupKey));
            
            if (!backup || !backup.data) {
                throw new Error('Backup corrompido');
            }
            
            // Restaurar dados
            siteData = { ...backup.data };
            localStorage.setItem('siteData', JSON.stringify(siteData));
            localStorage.setItem('siteDataCache', JSON.stringify({
                events: siteData.events,
                lastSync: new Date().toISOString()
            }));
            
            return true;
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            return false;
        }
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