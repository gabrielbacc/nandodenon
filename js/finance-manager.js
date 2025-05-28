class FinanceManager {
    constructor() {
        this.transactions = [];
        this.bandMembers = [];
        this.expenses = [];
        this.shows = [];
        this.finance = {
            currentIncome: 0,
            currentExpenses: 0,
            netProfit: 0,
            incomeTrend: 0,
            expensesTrend: 0,
            profitTrend: 0,
            showIncome: 0,
            showIncomeTrend: 0
        };
    }

    static async init() {
        try {
            // Garantir que o SiteManager está inicializado
            await SiteManager.init();
            
            const instance = new FinanceManager();
            await instance.loadData();
            return instance;
        } catch (error) {
            console.error('Erro na inicialização do FinanceManager:', error);
            // Em caso de erro, retornar uma nova instância com dados padrão
            const instance = new FinanceManager();
            instance.initializeDefaultData();
            return instance;
        }
    }

    initializeDefaultData() {
        console.log('Inicializando dados padrão...');
        // Dados de exemplo para desenvolvimento
        const currentDate = new Date();
        const lastMonth = new Date(currentDate);
        lastMonth.setMonth(currentDate.getMonth() - 1);
        
        this.transactions = [
            {
                id: '1',
                date: currentDate.toISOString().split('T')[0],
                description: 'Show Aniversário Enrico',
                type: 'receita',
                category: 'show',
                amount: 3500,
                createdAt: currentDate.toISOString()
            },
            {
                id: '2',
                date: currentDate.toISOString().split('T')[0],
                description: 'Pagamento Banda - Show Enrico',
                type: 'despesa',
                category: 'pagamento-banda',
                amount: 1500,
                createdAt: currentDate.toISOString()
            },
            {
                id: '3',
                date: lastMonth.toISOString().split('T')[0],
                description: 'Show Corporativo',
                type: 'receita',
                category: 'show',
                amount: 5000,
                createdAt: lastMonth.toISOString()
            },
            {
                id: '4',
                date: lastMonth.toISOString().split('T')[0],
                description: 'Equipamentos de Som',
                type: 'despesa',
                category: 'equipamentos',
                amount: 2000,
                createdAt: lastMonth.toISOString()
            }
        ];

        this.bandMembers = [
            {
                id: '1',
                name: 'João Silva',
                instrument: 'Guitarra',
                showRate: 500,
                phone: '11999999999',
                email: 'joao@email.com'
            },
            {
                id: '2',
                name: 'Maria Santos',
                instrument: 'Baixo',
                showRate: 500,
                phone: '11988888888',
                email: 'maria@email.com'
            }
        ];

        console.log('Dados padrão criados:', {
            transactions: this.transactions,
            bandMembers: this.bandMembers
        });

        // Atualizar dados financeiros e salvar
        this.updateFinancialData()
            .then(() => this.saveData())
            .then(() => console.log('Dados padrão salvos com sucesso'))
            .catch(error => console.error('Erro ao salvar dados padrão:', error));

        return true;
    }

    async loadData() {
        try {
            console.log('Carregando dados financeiros...');
            const data = await SiteManager.getData();
            console.log('Dados carregados:', data);
            
            if (!data) {
                console.log('Nenhum dado encontrado, inicializando dados padrão...');
                return this.initializeDefaultData();
            }
            
            // Garantir que temos um objeto de dados financeiros
            if (!data.finance) {
                data.finance = {};
            }
            
            // Carregar transações
            this.transactions = data.finance.transactions || [];
            console.log('Transações carregadas:', this.transactions);
            
            // Carregar outros dados financeiros
            this.bandMembers = data.finance.bandMembers || [];
            this.expenses = data.finance.expenses || [];
            this.shows = data.finance.shows || [];
            
            await this.updateFinancialData();
            console.log('Dados financeiros atualizados');
            return true;
        } catch (error) {
            console.error('Erro ao carregar dados financeiros:', error);
            return this.initializeDefaultData();
        }
    }

    async saveData() {
        try {
            console.log('Salvando dados financeiros...');
            const data = await SiteManager.getData();
            
            // Garantir que temos um objeto de dados financeiros
            if (!data.finance) {
                data.finance = {};
            }
            
            // Salvar todos os dados financeiros em uma única propriedade
            data.finance = {
                ...data.finance,
                transactions: this.transactions,
                bandMembers: this.bandMembers,
                expenses: this.expenses,
                shows: this.shows,
                summary: this.finance
            };
            
            console.log('Dados a serem salvos:', data.finance);
            await SiteManager.saveData(data);
            console.log('Dados financeiros salvos com sucesso');
        } catch (error) {
            console.error('Erro ao salvar dados financeiros:', error);
            throw error;
        }
    }

    // Gestão de Transações
    async addTransaction(transaction) {
        transaction.id = Date.now().toString();
        transaction.createdAt = new Date().toISOString();
        this.transactions.push(transaction);
        await this.updateFinancialData();
        await this.saveData();
        return transaction;
    }

    async updateTransaction(id, updatedTransaction) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index === -1) throw new Error('Transação não encontrada');
        this.transactions[index] = { ...this.transactions[index], ...updatedTransaction };
        await this.updateFinancialData();
        await this.saveData();
        return this.transactions[index];
    }

    async deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        await this.updateFinancialData();
        await this.saveData();
    }

    // Gestão de Banda
    async addBandMember(member) {
        member.id = Date.now().toString();
        this.bandMembers.push(member);
        await this.saveData();
        return member;
    }

    async updateBandMember(id, updatedMember) {
        const index = this.bandMembers.findIndex(m => m.id === id);
        if (index === -1) throw new Error('Membro não encontrado');
        this.bandMembers[index] = { ...this.bandMembers[index], ...updatedMember };
        await this.saveData();
        return this.bandMembers[index];
    }

    async deleteBandMember(id) {
        this.bandMembers = this.bandMembers.filter(m => m.id !== id);
        await this.saveData();
    }

    // Gestão de Shows
    async addShow(show) {
        show.id = Date.now().toString();
        show.createdAt = new Date().toISOString();
        this.shows.push(show);
        await this.saveData();
        return show;
    }

    async updateShow(id, updatedShow) {
        const index = this.shows.findIndex(s => s.id === id);
        if (index === -1) throw new Error('Show não encontrado');
        this.shows[index] = { ...this.shows[index], ...updatedShow };
        await this.saveData();
        return this.shows[index];
    }

    async deleteShow(id) {
        this.shows = this.shows.filter(s => s.id !== id);
        await this.saveData();
    }

    // Relatórios
    getMonthlyIncome(month = new Date().getMonth(), year = new Date().getFullYear()) {
        console.log('Calculando receita mensal para:', { month, year });
        const income = this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === month && 
                       date.getFullYear() === year && 
                       t.type === 'receita';
            })
            .reduce((total, t) => total + Number(t.amount), 0);
        console.log('Receita calculada:', income);
        return income;
    }

    getMonthlyExpenses(month = new Date().getMonth(), year = new Date().getFullYear()) {
        console.log('Calculando despesas mensais para:', { month, year });
        const expenses = this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === month && 
                       date.getFullYear() === year && 
                       t.type === 'despesa';
            })
            .reduce((total, t) => total + Number(t.amount), 0);
        console.log('Despesas calculadas:', expenses);
        return expenses;
    }

    getShowProfit(showId) {
        const show = this.shows.find(s => s.id === showId);
        if (!show) return 0;

        const income = this.transactions
            .filter(t => t.showId === showId && t.type === 'receita')
            .reduce((total, t) => total + t.amount, 0);

        const expenses = this.transactions
            .filter(t => t.showId === showId && t.type === 'despesa')
            .reduce((total, t) => total + t.amount, 0);

        return income - expenses;
    }

    getBandMemberPayments(memberId, month, year) {
        return this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.memberId === memberId && 
                       date.getMonth() === month && 
                       date.getFullYear() === year && 
                       t.category === 'pagamento-banda';
            })
            .reduce((total, t) => total + t.amount, 0);
    }

    // Análises
    async updateFinancialData() {
        try {
            console.log('Atualizando dados financeiros...');
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

            console.log('Período atual:', { currentMonth, currentYear });
            console.log('Período anterior:', { lastMonth, lastMonthYear });

            // Calcular receitas e despesas do mês atual
            const currentIncome = this.getMonthlyIncome(currentMonth, currentYear);
            const lastMonthIncome = this.getMonthlyIncome(lastMonth, lastMonthYear);
            const currentExpenses = this.getMonthlyExpenses(currentMonth, currentYear);
            const lastMonthExpenses = this.getMonthlyExpenses(lastMonth, lastMonthYear);

            console.log('Valores calculados:', {
                currentIncome,
                lastMonthIncome,
                currentExpenses,
                lastMonthExpenses
            });

            // Calcular receita de shows
            const currentShowIncome = this.transactions
                .filter(t => {
                    const date = new Date(t.date);
                    return date.getMonth() === currentMonth &&
                           date.getFullYear() === currentYear &&
                           t.type === 'receita' &&
                           t.category === 'show';
                })
                .reduce((total, t) => total + Number(t.amount), 0);

            const lastMonthShowIncome = this.transactions
                .filter(t => {
                    const date = new Date(t.date);
                    return date.getMonth() === lastMonth &&
                           date.getFullYear() === lastMonthYear &&
                           t.type === 'receita' &&
                           t.category === 'show';
                })
                .reduce((total, t) => total + Number(t.amount), 0);

            console.log('Receita de shows:', {
                currentShowIncome,
                lastMonthShowIncome
            });

            // Calcular tendências
            const incomeTrend = lastMonthIncome === 0 ? 100 : ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100;
            const expensesTrend = lastMonthExpenses === 0 ? 0 : ((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
            const showIncomeTrend = lastMonthShowIncome === 0 ? 100 : ((currentShowIncome - lastMonthShowIncome) / lastMonthShowIncome) * 100;

            console.log('Tendências calculadas:', {
                incomeTrend,
                expensesTrend,
                showIncomeTrend
            });

            // Atualizar objeto finance
            this.finance = {
                currentIncome,
                currentExpenses,
                netProfit: currentIncome - currentExpenses,
                incomeTrend,
                expensesTrend,
                profitTrend: lastMonthIncome === lastMonthExpenses ? 0 : 
                    (((currentIncome - currentExpenses) - (lastMonthIncome - lastMonthExpenses)) / 
                    Math.abs(lastMonthIncome - lastMonthExpenses)) * 100,
                showIncome: currentShowIncome,
                showIncomeTrend
            };

            console.log('Dados financeiros atualizados:', this.finance);
            return true;
        } catch (error) {
            console.error('Erro ao atualizar dados financeiros:', error);
            throw error;
        }
    }

    getFinancialSummary() {
        return this.finance;
    }

    getShowsAnalytics() {
        return this.shows.map(show => ({
            ...show,
            profit: this.getShowProfit(show.id),
            expenses: this.transactions
                .filter(t => t.showId === show.id && t.type === 'despesa')
                .reduce((total, t) => total + t.amount, 0),
            income: this.transactions
                .filter(t => t.showId === show.id && t.type === 'receita')
                .reduce((total, t) => total + t.amount, 0)
        }));
    }

    getBandAnalytics() {
        const now = new Date();
        return this.bandMembers.map(member => ({
            ...member,
            totalPayments: this.getBandMemberPayments(member.id, now.getMonth(), now.getFullYear()),
            showsParticipated: this.shows.filter(show => 
                show.bandMembers && show.bandMembers.includes(member.id)
            ).length
        }));
    }
} 