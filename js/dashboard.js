document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação
    if (!SiteManager.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Configurar logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                SiteManager.logout();
            });
        }

        // Atualizar nome do usuário na dashboard
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = 'Admin';
        }

        // Carregar dados da dashboard
        await loadDashboardData();

    } catch (error) {
        console.error('Erro ao inicializar dashboard:', error);
        SiteManager.logout();
    }
});

async function loadDashboardData() {
    try {
        const stats = await SiteManager.getStats();
        updateDashboardStats(stats);
    } catch (error) {
        console.error('Erro ao carregar dados da dashboard:', error);
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