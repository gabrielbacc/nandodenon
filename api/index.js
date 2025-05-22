const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const path = require('path');

// Initialize data file if it doesn't exist
const DATA_FILE = path.join(__dirname, 'data.json');
const DEFAULT_DATA = {
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

// Create data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
}

// Middleware
app.use(express.json());
app.use(cors());

// Helper to read the data file
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
        return DEFAULT_DATA;
    }
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
        console.error('Erro ao ler arquivo de dados:', error);
        return DEFAULT_DATA;
    }
}

// Helper to write to the data file
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Erro ao escrever arquivo de dados:', error);
        return false;
    }
}

// API Routes
app.get('/api/data', (req, res) => {
    const data = readData();
    res.json(data);
});

app.post('/api/data', (req, res) => {
    const newData = req.body;
    writeData(newData);
    res.json({ success: true, message: 'Data updated successfully' });
});

// Authentication routes (simple API key auth for demo purposes)
const API_KEY = process.env.API_KEY || 'nandodenon2024';

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simple authentication for demo - usando credenciais fixas para facilitar o acesso
    if (username === 'admin' && password === 'admin') {
        res.json({ 
            success: true, 
            token: API_KEY,
            username: username
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
});

// Message submission endpoint (public)
app.post('/api/messages', (req, res) => {
    try {
        console.log('Recebendo nova mensagem:', req.body);
        const message = req.body;
        const data = readData();
        
        // Validar campos mínimos
        if (!message.nome || !message.email) {
            console.error('Mensagem com campos obrigatórios faltando');
            return res.status(400).json({ 
                success: false, 
                message: 'Nome e email são obrigatórios' 
            });
        }
        
        // Add the new message
        message.id = Date.now().toString();
        message.date = new Date().toISOString();
        message.read = false;
        
        // Adicionar a mensagem
        if (!data.messages) {
            data.messages = [];
        }
        data.messages.push(message);
        
        // Update stats
        if (!data.stats) {
            data.stats = DEFAULT_DATA.stats;
        }
        data.stats.messages = data.messages.filter(msg => !msg.read).length;
        data.lastSync = new Date().toISOString();
        
        // Salvar no arquivo
        const saveSuccess = writeData(data);
        console.log('Mensagem salva com sucesso:', message.id, saveSuccess);
        
        if (saveSuccess) {
            res.json({ 
                success: true, 
                message: 'Mensagem enviada com sucesso',
                messageId: message.id
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao salvar mensagem'
            });
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao processar mensagem'
        });
    }
});

// Get public data (events, gallery, contact info)
app.get('/api/public', (req, res) => {
    const data = readData();
    
    // Only send public data
    const publicData = {
        events: data.events || [],
        gallery: data.gallery || [],
        eventCategories: data.eventCategories || [],
        stats: {
            shows: data.stats ? data.stats.shows : 0,
            upcomingEvents: data.stats ? data.stats.upcomingEvents : 0,
        },
        settings: {
            socialLinks: data.settings ? data.settings.socialLinks : {},
            contact: data.settings ? data.settings.contact : {}
        }
    };
    
    res.json(publicData);
});

// Endpoint para adicionar evento
app.post('/api/events', (req, res) => {
    try {
        console.log('Adicionando novo evento:', req.body);
        const event = req.body;
        const data = readData();
        
        // Validar campos mínimos
        if (!event.title || !event.date) {
            console.error('Evento com campos obrigatórios faltando');
            return res.status(400).json({ 
                success: false, 
                message: 'Título e data são obrigatórios' 
            });
        }
        
        // Adicionar ID se não existir
        if (!event.id) {
            event.id = Date.now().toString();
        }
        
        // Garantir que a lista de eventos existe
        if (!data.events) {
            data.events = [];
        }
        
        // Adicionar o evento
        data.events.push(event);
        
        // Atualizar estatísticas
        if (!data.stats) {
            data.stats = DEFAULT_DATA.stats;
        }
        
        // Calcular eventos futuros
        const now = new Date();
        data.stats.upcomingEvents = data.events.filter(
            e => new Date(e.date) >= now
        ).length;
        
        data.lastSync = new Date().toISOString();
        
        // Salvar no arquivo
        const saveSuccess = writeData(data);
        console.log('Evento salvo com sucesso:', event.id, saveSuccess);
        
        if (saveSuccess) {
            res.json({ 
                success: true, 
                message: 'Evento adicionado com sucesso',
                eventId: event.id
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao salvar evento'
            });
        }
    } catch (error) {
        console.error('Erro ao processar evento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao processar evento'
        });
    }
});

// Endpoint para atualizar evento
app.put('/api/events/:id', (req, res) => {
    try {
        const eventId = req.params.id;
        const updatedEvent = req.body;
        console.log(`Atualizando evento ${eventId}:`, updatedEvent);
        
        const data = readData();
        
        // Verificar se a lista de eventos existe
        if (!data.events) {
            data.events = [];
        }
        
        // Encontrar o evento
        const index = data.events.findIndex(e => e.id === eventId);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Evento não encontrado'
            });
        }
        
        // Atualizar o evento
        data.events[index] = { ...data.events[index], ...updatedEvent };
        
        // Atualizar estatísticas
        if (!data.stats) {
            data.stats = DEFAULT_DATA.stats;
        }
        
        // Calcular eventos futuros
        const now = new Date();
        data.stats.upcomingEvents = data.events.filter(
            e => new Date(e.date) >= now
        ).length;
        
        data.lastSync = new Date().toISOString();
        
        // Salvar no arquivo
        const saveSuccess = writeData(data);
        console.log('Evento atualizado com sucesso:', eventId, saveSuccess);
        
        if (saveSuccess) {
            res.json({ 
                success: true, 
                message: 'Evento atualizado com sucesso',
                event: data.events[index]
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar evento'
            });
        }
    } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao atualizar evento'
        });
    }
});

// Endpoint para remover evento
app.delete('/api/events/:id', (req, res) => {
    try {
        const eventId = req.params.id;
        console.log(`Removendo evento ${eventId}`);
        
        const data = readData();
        
        // Verificar se a lista de eventos existe
        if (!data.events) {
            data.events = [];
        }
        
        // Verificar se o evento existe
        const eventExists = data.events.some(e => e.id === eventId);
        
        if (!eventExists) {
            return res.status(404).json({
                success: false,
                message: 'Evento não encontrado'
            });
        }
        
        // Remover o evento
        data.events = data.events.filter(e => e.id !== eventId);
        
        // Atualizar estatísticas
        if (!data.stats) {
            data.stats = DEFAULT_DATA.stats;
        }
        
        // Calcular eventos futuros
        const now = new Date();
        data.stats.upcomingEvents = data.events.filter(
            e => new Date(e.date) >= now
        ).length;
        
        data.lastSync = new Date().toISOString();
        
        // Salvar no arquivo
        const saveSuccess = writeData(data);
        console.log('Evento removido com sucesso:', eventId, saveSuccess);
        
        if (saveSuccess) {
            res.json({ 
                success: true, 
                message: 'Evento removido com sucesso'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao remover evento'
            });
        }
    } catch (error) {
        console.error('Erro ao remover evento:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno ao remover evento'
        });
    }
});

// Servidor status e monitoramento
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Servir arquivos estáticos na API
app.use('/api', express.static(path.join(__dirname)));

// Export for Vercel serverless functions
module.exports = app;

// Start server if running directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
} 