// Events data structure
let events = JSON.parse(localStorage.getItem('events')) || [];

// Event management functions
const EventManager = {
    addEvent: function(event) {
        events.push(event);
        this.saveEvents();
        return event;
    },

    removeEvent: function(eventId) {
        events = events.filter(event => event.id !== eventId);
        this.saveEvents();
    },

    getEvents: function() {
        return events;
    },

    saveEvents: function() {
        localStorage.setItem('events', JSON.stringify(events));
    },

    getEventById: function(eventId) {
        return events.find(event => event.id === eventId);
    },

    updateEvent: function(eventId, updatedEvent) {
        const index = events.findIndex(event => event.id === eventId);
        if (index !== -1) {
            events[index] = { ...events[index], ...updatedEvent };
            this.saveEvents();
            return events[index];
        }
        return null;
    }
}; 