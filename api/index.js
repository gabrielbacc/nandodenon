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
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Helper to write to the data file
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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
    
    // Simple authentication for demo
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
    const message = req.body;
    const data = readData();
    
    // Add the new message
    message.id = Date.now().toString();
    message.date = new Date().toISOString();
    message.read = false;
    
    data.messages.push(message);
    
    // Update stats
    data.stats.messages = data.messages.filter(msg => !msg.read).length;
    data.lastSync = new Date().toISOString();
    
    writeData(data);
    
    res.json({ 
        success: true, 
        message: 'Message sent successfully' 
    });
});

// Get public data (events, gallery, contact info)
app.get('/api/public', (req, res) => {
    const data = readData();
    
    // Only send public data
    const publicData = {
        events: data.events,
        gallery: data.gallery,
        settings: {
            socialLinks: data.settings.socialLinks,
            contact: data.settings.contact
        },
        eventCategories: data.eventCategories
    };
    
    res.json(publicData);
});

// Export for Vercel serverless functions
module.exports = app;

// Start server if running directly
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
} 