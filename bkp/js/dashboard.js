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

// Função para formatar data
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Backup System
const backupModal = document.getElementById('backupModal');
const importAllFileInput = document.getElementById('importAllFileInput');
const importAllDataText = document.getElementById('importAllDataText');
const backupsList = document.getElementById('backupsList');

// Função para fechar o modal
function closeBackupModal() {
    backupModal.style.display = 'none';
    importAllDataText.value = '';
}

// Event listeners para fechar o modal
document.getElementById('closeBackupModal').addEventListener('click', closeBackupModal);

// Fechar modal com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && backupModal.style.display === 'flex') {
        closeBackupModal();
    }
});

// Fechar modal clicando fora
backupModal.addEventListener('click', function(e) {
    if (e.target === backupModal) {
        closeBackupModal();
    }
});

// Event listener para abrir o modal de backup
document.getElementById('openBackupModal').addEventListener('click', () => {
    const backupModal = document.getElementById('backupModal');
    backupModal.style.display = 'flex';
    loadBackupsList();
});

// Event listener para fechar o modal de backup
document.getElementById('closeBackupModal').addEventListener('click', () => {
    const backupModal = document.getElementById('backupModal');
    backupModal.style.display = 'none';
});

// Função para carregar a lista de backups
async function loadBackupsList() {
    const backupsList = document.getElementById('backupsList');
    backupsList.innerHTML = '<div class="backup-item">Carregando backups...</div>';

    try {
        // Buscar todos os backups
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('siteBackup_'))
            .sort()
            .reverse();

        if (backupKeys.length === 0) {
            backupsList.innerHTML = '<div class="backup-item">Nenhum backup encontrado</div>';
            return;
        }

        backupsList.innerHTML = backupKeys.map(key => {
            const backup = JSON.parse(localStorage.getItem(key));
            const date = new Date(backup.timestamp);
            const formattedDate = formatDate(date);

            return `
                <div class="backup-item">
                    <div class="backup-info">
                        <div>${formattedDate}</div>
                    </div>
                    <div class="backup-actions">
                        <button onclick="restoreBackup('${key}')" title="Restaurar este backup">
                            <i class="fas fa-history"></i>
                        </button>
                        <button onclick="downloadBackup('${key}')" title="Baixar este backup">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="deleteBackup('${key}')" title="Excluir este backup">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar backups:', error);
        backupsList.innerHTML = '<div class="backup-item">Erro ao carregar backups</div>';
    }
}

// Função para restaurar um backup específico
async function restoreBackup(backupKey) {
    if (confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.')) {
        try {
            const success = await SiteManager._restoreFromBackup(backupKey);
            if (success) {
                alert('Backup restaurado com sucesso! A página será recarregada.');
                window.location.reload();
            } else {
                throw new Error('Não foi possível restaurar o backup');
            }
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            alert('Erro ao restaurar backup: ' + error.message);
        }
    }
}

// Função para baixar um backup específico
function downloadBackup(backupKey) {
    try {
        const backup = localStorage.getItem(backupKey);
        if (!backup) throw new Error('Backup não encontrado');

        const blob = new Blob([backup], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nando-denon-backup-${backupKey.split('_')[1]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Erro ao baixar backup:', error);
        alert('Erro ao baixar backup: ' + error.message);
    }
}

// Função para excluir um backup específico
function deleteBackup(backupKey) {
    if (confirm('Tem certeza que deseja excluir este backup?')) {
        try {
            localStorage.removeItem(backupKey);
            loadBackupsList();
            alert('Backup excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir backup:', error);
            alert('Erro ao excluir backup: ' + error.message);
        }
    }
}

// Tornar funções disponíveis globalmente
window.restoreBackup = restoreBackup;
window.downloadBackup = downloadBackup;
window.deleteBackup = deleteBackup;

// Event listeners para os botões do modal de backup
document.getElementById('exportAllDataBtn').addEventListener('click', async () => {
    try {
        // Mostrar indicador de carregamento
        const btn = document.getElementById('exportAllDataBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
        btn.disabled = true;

        const exportData = SiteManager.exportData();
        
        // Criar elemento temporário para download
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nando-denon-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('Dados exportados com sucesso!');

        // Restaurar botão
        btn.innerHTML = originalText;
        btn.disabled = false;
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        alert('Erro ao exportar dados: ' + error.message);
        
        // Restaurar botão em caso de erro
        const btn = document.getElementById('exportAllDataBtn');
        btn.innerHTML = '<i class="fas fa-download"></i> Exportar Todos os Dados';
        btn.disabled = false;
    }
});

document.getElementById('importAllFileBtn').addEventListener('click', () => {
    document.getElementById('importAllFileInput').click();
});

document.getElementById('importAllFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Tentar decodificar o conteúdo para verificar se é base64 válido
            const content = e.target.result;
            atob(content); // Isso vai falhar se não for base64 válido
            document.getElementById('importAllDataText').value = content;
        } catch (error) {
            // Se não for base64, assumir que é JSON direto
            document.getElementById('importAllDataText').value = btoa(e.target.result);
        }
    };
    reader.readAsText(file);
});

document.getElementById('importAllDataBtn').addEventListener('click', async () => {
    const importData = document.getElementById('importAllDataText').value.trim();
    if (!importData) {
        alert('Por favor, selecione um arquivo ou cole os dados de importação.');
        return;
    }
    
    if (confirm('Tem certeza que deseja importar estes dados? Isso substituirá todos os dados atuais do sistema.')) {
        try {
            // Mostrar indicador de carregamento
            const btn = document.getElementById('importAllDataBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';
            btn.disabled = true;

            const success = await SiteManager.importData(importData);
            if (success) {
                alert('Dados importados com sucesso! A página será recarregada.');
                window.location.reload();
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            alert('Erro ao importar dados: ' + error.message);
            
            // Restaurar botão em caso de erro
            const btn = document.getElementById('importAllDataBtn');
            btn.innerHTML = '<i class="fas fa-upload"></i> Importar Dados';
            btn.disabled = false;
        }
    }
}); 