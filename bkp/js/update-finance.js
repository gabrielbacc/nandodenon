// Variáveis globais
let financeManager = null;
let financeChart = null;

// Import/Export Functionality
const importExportModal = document.getElementById('importExportModal');
const importFileInput = document.getElementById('importFileInput');
const importDataText = document.getElementById('importDataText');
const backupsList = document.getElementById('backupsList');

// Função para atualizar o dashboard financeiro
async function updateFinanceDashboard() {
    try {
        console.log('Iniciando atualização do dashboard financeiro...');
        
        // Verificar se o SiteManager está disponível
        if (typeof SiteManager === 'undefined') {
            throw new Error('SiteManager não está disponível');
        }
        
        // Verificar se o Chart está disponível
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js não está disponível');
        }
        
        // Inicializar o FinanceManager
        financeManager = await FinanceManager.init();
        if (!financeManager) {
            throw new Error('Não foi possível inicializar o FinanceManager');
        }
        
        console.log('FinanceManager inicializado com sucesso');
        
        // Verificar se o elemento do gráfico existe
        const chartElement = document.getElementById('financeChart');
        if (!chartElement) {
            throw new Error('Elemento do gráfico não encontrado');
        }
        
        // Inicializar o gráfico
        if (!financeChart) {
            await initializeChart();
        }
        
        // Atualizar cards do dashboard
        await updateDashboardCards(financeManager);
        
        // Atualizar gráfico com visualização mensal
        await updateChart();
        
        // Atualizar tabela de transações
        await updateTransactionsTable();
        
        console.log('Dashboard financeiro atualizado com sucesso');
    } catch (error) {
        console.error('Erro ao atualizar dashboard financeiro:', error);
        // Mostrar mensagem de erro específica para o usuário
        let errorMessage = 'Erro ao carregar o sistema financeiro. ';
        
        if (error.message.includes('SiteManager')) {
            errorMessage += 'Problema com o gerenciador do site.';
        } else if (error.message.includes('Chart')) {
            errorMessage += 'Problema ao carregar o gráfico.';
        } else if (error.message.includes('FinanceManager')) {
            errorMessage += 'Problema ao inicializar o gerenciador financeiro.';
        } else if (error.message.includes('gráfico')) {
            errorMessage += 'Problema ao encontrar o elemento do gráfico.';
        }
        
        errorMessage += ' Por favor, recarregue a página.';
        alert(errorMessage);
        throw error;
    }
}

// Função para atualizar os cards do dashboard
async function updateDashboardCards(financeManager) {
    try {
        console.log('Atualizando cards do dashboard...');
        
        if (!financeManager) {
            throw new Error('FinanceManager não inicializado');
        }
        
        // Atualizar dados financeiros
        await financeManager.updateFinancialData();
        
        // Obter resumo financeiro atualizado
        const summary = financeManager.getFinancialSummary();
        
        // Atualizar valores dos cards
        const elements = {
            totalIncome: document.getElementById('totalIncome'),
            showIncome: document.getElementById('showIncome'),
            totalExpenses: document.getElementById('totalExpenses'),
            netProfit: document.getElementById('netProfit'),
            incomeTrend: document.getElementById('incomeTrend'),
            showIncomeTrend: document.getElementById('showIncomeTrend'),
            expensesTrend: document.getElementById('expensesTrend'),
            profitTrend: document.getElementById('profitTrend')
        };
        
        // Verificar se todos os elementos existem
        Object.entries(elements).forEach(([key, element]) => {
            if (!element) {
                console.error(`Elemento ${key} não encontrado`);
            }
        });
        
        // Atualizar valores
        if (elements.totalIncome) elements.totalIncome.textContent = formatCurrency(summary.currentIncome);
        if (elements.showIncome) elements.showIncome.textContent = formatCurrency(summary.showIncome);
        if (elements.totalExpenses) elements.totalExpenses.textContent = formatCurrency(summary.currentExpenses);
        if (elements.netProfit) elements.netProfit.textContent = formatCurrency(summary.netProfit);
        
        // Atualizar tendências
        if (elements.incomeTrend) updateTrendIndicator('incomeTrend', summary.incomeTrend);
        if (elements.showIncomeTrend) updateTrendIndicator('showIncomeTrend', summary.showIncomeTrend);
        if (elements.expensesTrend) updateTrendIndicator('expensesTrend', summary.expensesTrend);
        if (elements.profitTrend) updateTrendIndicator('profitTrend', summary.profitTrend);
        
        console.log('Cards do dashboard atualizados com sucesso');
    } catch (error) {
        console.error('Erro ao atualizar cards:', error);
        throw error;
    }
}

// Função para atualizar o gráfico
async function updateChart(period = 'month') {
    try {
        if (!financeManager || !financeChart) {
            console.error('FinanceManager ou Chart não inicializados');
            return;
        }

        const now = new Date();
        const labels = [];
        const incomes = [];
        const expenses = [];

        switch (period) {
            case 'month':
                // Últimos 12 meses
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    labels.push(date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
                    
                    const monthTransactions = financeManager.transactions.filter(t => {
                        const tDate = new Date(t.date);
                        return tDate.getMonth() === date.getMonth() &&
                               tDate.getFullYear() === date.getFullYear();
                    });
                    
                    const monthIncome = monthTransactions
                        .filter(t => t.type === 'receita')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                    
                    const monthExpense = monthTransactions
                        .filter(t => t.type === 'despesa')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                    
                    incomes.push(monthIncome);
                    expenses.push(monthExpense);
                }
                break;

            case 'trimestre':
                // Últimos 4 trimestres
                for (let i = 3; i >= 0; i--) {
                    const startDate = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
                    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
                    
                    labels.push(`${startDate.toLocaleDateString('pt-BR', { month: 'short' })}-${endDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`);
                    
                    const quarterTransactions = financeManager.transactions.filter(t => {
                        const tDate = new Date(t.date);
                        return tDate >= startDate && tDate <= endDate;
                    });
                    
                    const quarterIncome = quarterTransactions
                        .filter(t => t.type === 'receita')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                    
                    const quarterExpense = quarterTransactions
                        .filter(t => t.type === 'despesa')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                    
                    incomes.push(quarterIncome);
                    expenses.push(quarterExpense);
                }
                break;

            case 'semestre':
                // Últimos 2 semestres
                for (let i = 1; i >= 0; i--) {
                    const startDate = new Date(now.getFullYear(), now.getMonth() - (i * 6), 1);
                    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 6, 0);
                    
                    labels.push(`${startDate.toLocaleDateString('pt-BR', { month: 'short' })}-${endDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`);
                    
                    const semesterTransactions = financeManager.transactions.filter(t => {
                        const tDate = new Date(t.date);
                        return tDate >= startDate && tDate <= endDate;
                    });
                    
                    const semesterIncome = semesterTransactions
                        .filter(t => t.type === 'receita')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                    
                    const semesterExpense = semesterTransactions
                        .filter(t => t.type === 'despesa')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                    
                    incomes.push(semesterIncome);
                    expenses.push(semesterExpense);
                }
                break;

            case 'ano':
                // Últimos 5 anos
                for (let i = 4; i >= 0; i--) {
                    const startDate = new Date(now.getFullYear() - i, 0, 1);
                    const endDate = new Date(startDate.getFullYear(), 11, 31);
                    
                    labels.push(startDate.getFullYear().toString());
                    
                    const yearTransactions = financeManager.transactions.filter(t => {
                        const tDate = new Date(t.date);
                        return tDate >= startDate && tDate <= endDate;
                    });
                    
                    const yearIncome = yearTransactions
                        .filter(t => t.type === 'receita')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                    
                    const yearExpense = yearTransactions
                        .filter(t => t.type === 'despesa')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                    
                    incomes.push(yearIncome);
                    expenses.push(yearExpense);
                }
                break;
        }

        // Atualizar dados do gráfico
        financeChart.data.labels = labels;
        financeChart.data.datasets[0].data = incomes;
        financeChart.data.datasets[1].data = expenses;
        financeChart.update();

        // Atualizar classe active dos botões
        document.querySelectorAll('.chart-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeButton = document.querySelector(`.chart-filter[onclick*="${period}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        console.log('Gráfico atualizado com sucesso para o período:', period);
    } catch (error) {
        console.error('Erro ao atualizar gráfico:', error);
    }
}

// Função para atualizar a tabela de transações
async function updateTransactionsTable() {
    try {
        const tableBody = document.querySelector('#transactionsTable tbody');
        if (!tableBody) {
            console.error('Elemento da tabela não encontrado');
            return;
        }

        // Ordenar transações por data (mais recentes primeiro)
        const transactions = financeManager.transactions.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        // Limitar a 10 transações mais recentes
        const recentTransactions = transactions.slice(0, 10);

        tableBody.innerHTML = recentTransactions.map(transaction => `
            <tr>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td class="${transaction.type === 'receita' ? 'positive' : 'negative'}">
                    ${formatCurrency(transaction.amount)}
                </td>
                <td>${formatCategory(transaction.category)}</td>
                <td>
                    <button onclick="editTransaction('${transaction.id}')" class="btn-icon">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTransaction('${transaction.id}')" class="btn-icon">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        console.log('Tabela de transações atualizada');
    } catch (error) {
        console.error('Erro ao atualizar tabela:', error);
    }
}

// Função para atualizar indicador de tendência
function updateTrendIndicator(elementId, trend) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Elemento ${elementId} não encontrado`);
        return;
    }
    
    let icon, text, className;
    
    if (trend > 0) {
        icon = 'fa-arrow-up';
        text = `+${trend.toFixed(1)}%`;
        className = 'positive';
    } else if (trend < 0) {
        icon = 'fa-arrow-down';
        text = `${trend.toFixed(1)}%`;
        className = 'negative';
    } else {
        icon = 'fa-minus';
        text = '0%';
        className = '';
    }
    
    element.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${text}</span>
    `;
    element.className = `trend ${className}`;
}

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
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

// Função para formatar categoria
function formatCategory(category) {
    // Implemente a lógica para formatar a categoria com base no tipo de transação
    return category;
}

// Função para mostrar seção
function showSection(sectionId, element) {
    // Atualizar navegação
    document.querySelectorAll('.finance-nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    // Atualizar dashboard e gráfico
    updateDashboard().then(() => {
        updateChart('month');
    });
}

// Funções para cada seção
async function updateExpensesTable() {
    if (!financeManager) return;
    const expenses = financeManager.transactions.filter(t => 
        t.type === 'despesa'
    );
    console.log('Despesas:', expenses);
}

async function updateReports() {
    if (!financeManager) return;
    const summary = financeManager.getFinancialSummary();
    console.log('Resumo financeiro para relatórios:', summary);
}

// Funções de edição
async function editTransaction(id) {
    try {
        const transaction = financeManager.transactions.find(t => t.id === id);
        if (!transaction) return;
        
        // Preencher o modal com os dados da transação
        document.getElementById('transactionId').value = transaction.id;
        document.getElementById('transactionDate').value = transaction.date;
        document.getElementById('transactionDescription').value = transaction.description;
        document.getElementById('transactionAmount').value = transaction.amount;
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('transactionCategory').value = transaction.category;
        
        // Abrir o modal
        document.getElementById('transactionModal').style.display = 'flex';
    } catch (error) {
        console.error('Erro ao editar transação:', error);
        alert('Erro ao editar transação. Tente novamente.');
    }
}

async function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        try {
            await financeManager.deleteTransaction(id);
            await updateFinanceDashboard();
        } catch (error) {
            console.error('Erro ao excluir transação:', error);
            alert('Erro ao excluir transação. Tente novamente.');
        }
    }
}

// Função para inicializar o gráfico
function initializeChart() {
    const ctx = document.getElementById('financeChart').getContext('2d');
    
    financeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Receitas',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Despesas',
                data: [],
                borderColor: '#f44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fff',
                        callback: value => formatCurrency(value)
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fff'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => {
                            const label = context.dataset.label;
                            const value = context.raw;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });

    // Carregar dados mensais imediatamente após criar o gráfico
    updateChart('mês');
}

// Funções de manipulação de eventos
async function handleTransactionSubmit(event) {
    event.preventDefault();
    try {
        const form = event.target;
        const transactionId = form.querySelector('#transactionId').value;
        
        const transaction = {
            date: form.querySelector('#transactionDate').value,
            type: form.querySelector('#transactionType').value,
            description: form.querySelector('#transactionDescription').value,
            amount: parseFloat(form.querySelector('#transactionAmount').value),
            category: form.querySelector('#transactionCategory').value
        };
        
        if (transactionId) {
            await financeManager.updateTransaction(transactionId, transaction);
        } else {
            await financeManager.addTransaction(transaction);
        }
        
        // Fechar modal
        const modal = document.getElementById('transactionModal');
        modal.style.display = 'none';
        
        // Atualizar dashboard
        await updateDashboard();
        
        // Limpar formulário
        form.reset();
        form.querySelector('#transactionId').value = '';
        
    } catch (error) {
        console.error('Erro ao salvar transação:', error);
        alert('Erro ao salvar transação. Por favor, tente novamente.');
    }
}

// Função para configurar event listeners
function setupEventListeners() {
    try {
        console.log('Configurando event listeners...');
        
        // Event listener para o formulário de transação
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            transactionForm.removeEventListener('submit', handleTransactionSubmit);
            transactionForm.addEventListener('submit', handleTransactionSubmit);
        }
        
        // Event listeners para botões de fechar modais
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Event listener para o botão de nova transação
        const newTransactionBtn = document.querySelector('.add-transaction-btn');
        if (newTransactionBtn) {
            newTransactionBtn.addEventListener('click', () => {
                const modal = document.getElementById('transactionModal');
                if (modal) {
                    // Limpar formulário
                    const form = modal.querySelector('form');
                    if (form) {
                        form.reset();
                        form.querySelector('#transactionId').value = '';
                    }
                    modal.style.display = 'flex';
                }
            });
        }
        
        // Event listeners para navegação
        const navItems = document.querySelectorAll('.finance-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.getAttribute('data-section');
                if (sectionId) {
                    showSection(sectionId, item);
                }
            });
        });
        
        console.log('Event listeners configurados com sucesso');
    } catch (error) {
        console.error('Erro ao configurar event listeners:', error);
        throw error;
    }
}

// Função para atualizar o dashboard
async function updateDashboard() {
    try {
        if (!financeManager) {
            throw new Error('FinanceManager não inicializado');
        }
        
        // Atualizar cards
        await updateDashboardCards(financeManager);
        
        // Atualizar gráfico
        await updateChart();
        
        // Atualizar tabela de transações
        await updateTransactionsTable();
        
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
        throw error;
    }
}

// Função para inicializar o sistema financeiro
async function initFinanceManager() {
    try {
        console.log('Iniciando FinanceManager...');
        
        // Verificar login
        if (!SiteManager.isLoggedIn()) {
            console.error('Usuário não está logado');
            window.location.href = 'login.html';
            return;
        }

        // Inicializar o FinanceManager
        financeManager = await FinanceManager.init();
        console.log('FinanceManager inicializado:', financeManager);
        console.log('Transações carregadas:', financeManager.transactions);

        // Inicializar o gráfico
        await initializeChart();
        console.log('Gráfico inicializado');

        // Configurar event listeners
        setupEventListeners();
        console.log('Event listeners configurados');
        
        // Mostrar seção inicial e atualizar interface
        const visaoGeralSection = document.getElementById('visao-geral-section');
        if (visaoGeralSection) {
            visaoGeralSection.style.display = 'block';
        }
        
        // Atualizar o dashboard e o gráfico imediatamente
        await updateDashboard();
        updateChart('mês');
        
        // Carregar dados iniciais na tabela
        await updateTransactionsTable(financeManager.transactions);
        console.log('Inicialização completa');
    } catch (error) {
        console.error('Erro ao inicializar gerenciador financeiro:', error);
        retryInitialization();
    }
}

// Inicializar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initFinanceManager();
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
});

// Função para fechar o modal
function closeImportExportModal() {
    importExportModal.style.display = 'none';
    importDataText.value = '';
}

// Event listeners para fechar o modal
document.getElementById('closeImportExportModal').addEventListener('click', closeImportExportModal);

// Fechar modal com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && importExportModal.style.display === 'flex') {
        closeImportExportModal();
    }
});

// Fechar modal clicando fora
importExportModal.addEventListener('click', function(e) {
    if (e.target === importExportModal) {
        closeImportExportModal();
    }
});

function loadBackupsList() {
    try {
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('siteBackup_'))
            .sort()
            .reverse();

        if (backupKeys.length === 0) {
            backupsList.innerHTML = `
                <div style="color: rgba(255,255,255,0.7); text-align: center; padding: 10px;">
                    Nenhum backup encontrado
                </div>
            `;
            return;
        }

        backupsList.innerHTML = backupKeys.map(key => {
            const backup = JSON.parse(localStorage.getItem(key));
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="color: white;">
                        <i class="fas fa-save" style="color: #ff6b00; margin-right: 8px;"></i>
                        Backup de ${formatDate(backup.timestamp)}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar lista de backups:', error);
        backupsList.innerHTML = `
            <div style="color: rgba(255,255,255,0.7); text-align: center; padding: 10px;">
                Erro ao carregar backups
            </div>
        `;
    }
}

document.getElementById('openImportExportModal').addEventListener('click', () => {
    importExportModal.style.display = 'flex';
    importDataText.value = '';
    loadBackupsList();
});

document.getElementById('restoreBackupBtn').addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja restaurar o backup mais recente? Isso substituirá os dados atuais.')) {
        try {
            const success = await SiteManager._restoreFromBackup();
            if (success) {
                alert('Backup restaurado com sucesso! A página será recarregada.');
                window.location.reload();
            } else {
                alert('Não foi possível restaurar o backup. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            alert('Erro ao restaurar backup: ' + error.message);
        }
    }
});

document.getElementById('exportDataBtn').addEventListener('click', async () => {
    try {
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
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        alert('Erro ao exportar dados: ' + error.message);
    }
});

document.getElementById('importFileBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
});

document.getElementById('importFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('importDataText').value = e.target.result;
    };
    reader.readAsText(file);
});

document.getElementById('importDataBtn').addEventListener('click', async () => {
    const importData = document.getElementById('importDataText').value.trim();
    if (!importData) {
        alert('Por favor, selecione um arquivo ou cole os dados de importação.');
        return;
    }
    
    if (confirm('Tem certeza que deseja importar estes dados? Isso substituirá todos os dados atuais do sistema.')) {
        try {
            const success = await SiteManager.importData(importData);
            if (success) {
                alert('Dados importados com sucesso! A página será recarregada.');
                window.location.reload();
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            alert('Erro ao importar dados: ' + error.message);
        }
    }
}); 