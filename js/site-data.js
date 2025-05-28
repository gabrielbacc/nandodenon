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
    getData: async function() {
        await initializeData();
        return siteData;
    },

    saveData: async function() {
        try {
            localStorage.setItem('siteData', JSON.stringify(siteData));
            
            // Atualizar cache para usuários anônimos
            const publicData = {
                events: siteData.events,
                eventCategories: siteData.eventCategories,
                settings: siteData.settings,
                lastSync: new Date().toISOString()
            };
            localStorage.setItem('siteDataCache', JSON.stringify(publicData));
            
            // Disparar evento de atualização
            document.dispatchEvent(new Event('site-data-updated'));
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            return false;
        }
    },

    // Gerenciamento de eventos
    getEvents: function() {
        return siteData.events || [];
    },

    addEvent: async function(event) {
        await initializeData();
        
        if (!event.id) {
            event.id = Date.now().toString();
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
    
    saveData: async function() {
        this.updateLastSync();
        
        // Sempre salvar localmente primeiro
        localStorage.setItem('siteDataCache', JSON.stringify(siteData));
        console.log('Dados salvos em localStorage');
        
        try {
            // Só salvar dados no servidor se estiver logado
            if (SiteManager.isLoggedIn()) {
                console.log('Enviando dados para a API...');
                const response = await fetch(`${API_BASE_URL}/data`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(siteData)
                });
                
                if (response.ok) {
                    console.log('Dados salvos com sucesso na API');
                    
                    // Disparar evento de atualização para quem estiver escutando
                    const event = new CustomEvent('site-data-updated');
                    document.dispatchEvent(event);
                    
                    return true;
                }
                console.warn('Falha ao salvar dados na API, mas salvos localmente');
                
                // Disparar evento mesmo quando a API falha
                const event = new CustomEvent('site-data-updated');
                document.dispatchEvent(event);
                
                return false;
            }
            
            console.log('Dados salvos apenas localmente (usuário não logado)');
            
            // Disparar evento mesmo sem salvar na API
            const event = new CustomEvent('site-data-updated');
            document.dispatchEvent(event);
            
            return false;
        } catch (error) {
            console.error('Erro ao salvar dados na API:', error);
            
            // Disparar evento mesmo quando ocorre erro
            const event = new CustomEvent('site-data-updated');
            document.dispatchEvent(event);
            
            return false;
        }
    },
    
    updateLastSync: function() {
        siteData.lastSync = new Date().toISOString();
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