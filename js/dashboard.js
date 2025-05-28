document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!SiteManager.isLoggedIn()) {
        location.href = 'login.html';
        return;
    }

    // Configurar logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            SiteManager.logout();
            location.href = 'login.html';
        });
    }

    // Atualizar nome do usuário
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = SiteManager.getUsername();
    }

    // Carregar dados
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const stats = await SiteManager.getStats();
        updateDashboardStats(stats);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function updateDashboardStats(stats) {
    const elements = {
        'totalShows': stats.shows,
        'upcomingEvents': stats.upcomingEvents,
        'totalMessages': stats.messages,
        'totalViews': stats.views
    };

    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
} 