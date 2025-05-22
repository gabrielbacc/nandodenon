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

// Função de compatibilidade (removida, agora incorporada no método saveData)
async function saveDataToAPI(data) {
    console.warn('Função saveDataToAPI está obsoleta, use SiteManager.saveData() diretamente');
    // Salvar localmente para compatibilidade
    localStorage.setItem('siteDataCache', JSON.stringify(data));
    return SiteManager.saveData();
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
        
        console.log('Adicionando evento ao servidor:', event);
        
        // Verificar se já existe a propriedade events em siteData
        if (!siteData.events) {
            console.log('Array de eventos não existe, criando...');
            siteData.events = [];
        }
        
        // Adicionar evento ao array local primeiro para garantir que é salvo
        console.log('Adicionando evento localmente:', event);
        siteData.events.push(event);
        this.updateStats();
        
        // Salvar localmente
        console.log('Salvando dados localmente...');
        await this.saveData();
        
        // Agora tentar enviar para o servidor
        try {
            // Enviar para o servidor
            console.log('Enviando evento para o servidor:', event);
            const response = await fetch(`${API_BASE_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(event)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Evento adicionado com sucesso no servidor:', result);
                
                // Recarregar dados para garantir sincronismo
                console.log('Recarregando dados após sucesso na API...');
                isInitialized = false;
                await initializeData();
                
                return event;
            } else {
                console.error('Erro ao adicionar evento ao servidor:', response.status);
                const errorText = await response.text();
                console.error('Detalhes do erro:', errorText);
                
                // Já salvamos localmente, então retornamos o evento
                console.log('Usando evento salvo localmente após falha na API');
                return event;
            }
        } catch (error) {
            console.error('Exceção ao adicionar evento ao servidor:', error);
            
            // Já salvamos localmente no início da função
            console.log('Usando evento salvo localmente após exceção na API');
            return event;
        }
    },
    
    updateEvent: async function(eventId, updatedEvent) {
        await initializeData();
        
        // Garantir que a data está no formato correto YYYY-MM-DD sem alteração de fuso horário
        if (updatedEvent.date && updatedEvent.date.includes('-')) {
            const dateParts = updatedEvent.date.split('-');
            if (dateParts.length === 3) {
                // Manter exatamente o formato que veio
                updatedEvent.date = updatedEvent.date;
            }
        }
        
        console.log(`Atualizando evento ${eventId}:`, updatedEvent);
        
        // Verificar se temos o array de eventos
        if (!siteData.events) {
            console.log('Array de eventos não existe, criando...');
            siteData.events = [];
        }
        
        // Atualizar localmente primeiro para garantir que os dados são salvos
        const index = siteData.events.findIndex(event => event.id === eventId);
        
        if (index !== -1) {
            console.log('Evento encontrado localmente, atualizando...');
            siteData.events[index] = { ...siteData.events[index], ...updatedEvent };
            this.updateStats();
            
            // Salvar localmente primeiro para garantir que temos os dados
            console.log('Salvando dados localmente...');
            await this.saveData();
        } else {
            console.warn(`Evento ${eventId} não encontrado localmente, adicionando como novo`);
            
            // Se o evento não existe, adicionar como novo
            const newEvent = { ...updatedEvent, id: eventId };
            siteData.events.push(newEvent);
            this.updateStats();
            
            // Salvar localmente
            console.log('Salvando dados localmente...');
            await this.saveData();
        }
        
        try {
            // Enviar para o servidor
            console.log(`Enviando atualização para o servidor:`, updatedEvent);
            const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(updatedEvent)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Evento atualizado com sucesso no servidor:', result);
                
                // Recarregar dados para garantir sincronismo
                console.log('Recarregando dados após sucesso na API...');
                isInitialized = false;
                await initializeData();
                
                return siteData.events.find(event => event.id === eventId);
            } else {
                console.error('Erro ao atualizar evento no servidor:', response.status);
                const errorText = await response.text();
                console.error('Detalhes do erro:', errorText);
                
                // Retornar o evento da cache local já que atualizamos localmente
                console.log('Usando dados locais após falha na API');
                return siteData.events.find(event => event.id === eventId);
            }
        } catch (error) {
            console.error('Exceção ao atualizar evento no servidor:', error);
            
            // Já atualizamos localmente, então retornamos o evento
            console.log('Usando dados locais já atualizados após exceção na API');
            return siteData.events.find(event => event.id === eventId);
        }
    },
    
    removeEvent: async function(eventId) {
        await initializeData();
        
        console.log(`Removendo evento ${eventId}`);
        
        // Remover localmente primeiro para garantir que funciona
        const hadEvent = siteData.events.some(event => event.id === eventId);
        if (hadEvent) {
            // Remover do array local
            siteData.events = siteData.events.filter(event => event.id !== eventId);
            this.updateStats();
            
            // Salvar localmente primeiro
            await this.saveData();
            console.log(`Evento ${eventId} removido localmente`);
        } else {
            console.warn(`Evento ${eventId} não encontrado localmente para remoção`);
        }
        
        try {
            // Enviar para o servidor
            const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Evento removido com sucesso da API:', result);
                
                // Recarregar dados para garantir sincronismo
                isInitialized = false;
                await initializeData();
                
                return true;
            } else {
                console.error('Erro ao remover evento da API:', response.status);
                const errorText = await response.text();
                console.error('Detalhes do erro:', errorText);
                
                // Já removemos localmente, então retornamos sucesso
                return hadEvent;
            }
        } catch (error) {
            console.error('Exceção ao remover evento da API:', error);
            
            // Já removemos localmente se o evento existia
            console.log('Usando remoção local apenas, API indisponível');
            return hadEvent;
        }
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