document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação antes de qualquer coisa
    if (!SiteManager.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Inicializar o SiteManager
        await SiteManager.init();
        
        // Configurar logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                SiteManager.logout();
                window.location.href = 'login.html';
            });
        }

        // Atualizar nome do usuário na dashboard
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = SiteManager.getUsername();
        }

        // Carregar dados da dashboard
        await loadDashboardData();

    } catch (error) {
        console.error('Erro ao inicializar dashboard:', error);
        alert('Erro ao carregar dashboard. Por favor, faça login novamente.');
        SiteManager.logout();
        window.location.href = 'login.html';
    }
});

async function loadDashboardData() {
    try {
        // Aqui você pode adicionar a lógica para carregar os dados específicos da dashboard
        const stats = await SiteManager.getStats();
        updateDashboardStats(stats);
    } catch (error) {
        console.error('Erro ao carregar dados da dashboard:', error);
    }
}

function updateDashboardStats(stats) {
    // Atualizar estatísticas na interface
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