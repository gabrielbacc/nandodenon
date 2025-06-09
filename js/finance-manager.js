class FinanceManager {
    constructor() {
        this.initializeEmptyData();
        this.loadData().catch(error => {
            console.error('Erro ao carregar dados financeiros:', error);
            this.initializeEmptyData();
        });

        // Adicionar listener para atualização de dados
        document.addEventListener('site-data-updated', () => {
            console.log('Detectada atualização de dados, recarregando...');
            this.loadData().catch(error => {
                console.error('Erro ao recarregar dados financeiros:', error);
            });
        });
    }

    initializeEmptyData() {
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
            throw error;
        }
    }

    async loadData() {
        try {
            console.log('Carregando dados financeiros...');
            const data = await SiteManager.getData();
            
            if (!data || !data.finance) {
                console.log('Nenhum dado encontrado, inicializando dados vazios...');
                this.initializeEmptyData();
                return true;
            }
            
            // Carregar transações
            this.transactions = data.finance.transactions || [];
            
            // Carregar outros dados financeiros
            this.bandMembers = data.finance.bandMembers || [];
            this.expenses = data.finance.expenses || [];
            this.shows = data.finance.shows || [];
            
            // Carregar resumo financeiro
            this.finance = {
                currentIncome: data.finance.currentIncome || 0,
                currentExpenses: data.finance.currentExpenses || 0,
                netProfit: data.finance.netProfit || 0,
                incomeTrend: data.finance.incomeTrend || 0,
                expensesTrend: data.finance.expensesTrend || 0,
                profitTrend: data.finance.profitTrend || 0,
                showIncome: data.finance.showIncome || 0,
                showIncomeTrend: data.finance.showIncomeTrend || 0
            };
            
            await this.updateFinancialData();
            console.log('Dados financeiros carregados com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao carregar dados financeiros:', error);
            throw error;
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
            
            // Salvar todos os dados financeiros
            data.finance = {
                transactions: this.transactions,
                bandMembers: this.bandMembers,
                expenses: this.expenses,
                shows: this.shows,
                currentIncome: this.finance.currentIncome,
                currentExpenses: this.finance.currentExpenses,
                netProfit: this.finance.netProfit,
                incomeTrend: this.finance.incomeTrend,
                expensesTrend: this.finance.expensesTrend,
                profitTrend: this.finance.profitTrend,
                showIncome: this.finance.showIncome,
                showIncomeTrend: this.finance.showIncomeTrend
            };
            
            await SiteManager.saveData(data);
            
            // Atualizar o cache
            try {
                const currentCache = JSON.parse(localStorage.getItem('siteDataCache')) || {};
                currentCache.finance = data.finance;
                currentCache.lastSync = new Date().toISOString();
                localStorage.setItem('siteDataCache', JSON.stringify(currentCache));
                console.log('Cache financeiro atualizado');
            } catch (err) {
                console.error('Erro ao atualizar cache financeiro:', err);
            }
            
            console.log('Dados financeiros salvos com sucesso');
        } catch (error) {
            console.error('Erro ao salvar dados financeiros:', error);
            throw error;
        }
    }

    // Gestão de Transações
    async addTransaction(transaction) {
        try {
            transaction.id = Date.now().toString();
            transaction.createdAt = new Date().toISOString();
            this.transactions.push(transaction);
            await this.updateFinancialData();
            await this.saveData();
            return transaction;
        } catch (error) {
            console.error('Erro ao adicionar transação:', error);
            throw error;
        }
    }

    async updateTransaction(id, updatedTransaction) {
        try {
            const index = this.transactions.findIndex(t => t.id === id);
            if (index === -1) throw new Error('Transação não encontrada');
            
            this.transactions[index] = { 
                ...this.transactions[index], 
                ...updatedTransaction,
                updatedAt: new Date().toISOString()
            };
            
            await this.updateFinancialData();
            await this.saveData();
            return this.transactions[index];
        } catch (error) {
            console.error('Erro ao atualizar transação:', error);
            throw error;
        }
    }

    async deleteTransaction(id) {
        try {
            this.transactions = this.transactions.filter(t => t.id !== id);
            await this.updateFinancialData();
            await this.saveData();
            return true;
        } catch (error) {
            console.error('Erro ao excluir transação:', error);
            throw error;
        }
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
        return this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === month && 
                       date.getFullYear() === year && 
                       t.type === 'receita';
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);
    }

    getMonthlyExpenses(month = new Date().getMonth(), year = new Date().getFullYear()) {
        return this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === month && 
                       date.getFullYear() === year && 
                       t.type === 'despesa';
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);
    }

    getMonthlyShowIncome(month = new Date().getMonth(), year = new Date().getFullYear()) {
        return this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === month && 
                       date.getFullYear() === year && 
                       t.type === 'receita' &&
                       t.category === 'show';
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);
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
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            
            // Calcular mês atual
            const currentIncome = this.getMonthlyIncome(currentMonth, currentYear);
            const currentExpenses = this.getMonthlyExpenses(currentMonth, currentYear);
            const currentShowIncome = this.getMonthlyShowIncome(currentMonth, currentYear);
            
            // Calcular mês anterior
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            
            const lastMonthIncome = this.getMonthlyIncome(lastMonth, lastMonthYear);
            const lastMonthExpenses = this.getMonthlyExpenses(lastMonth, lastMonthYear);
            const lastMonthShowIncome = this.getMonthlyShowIncome(lastMonth, lastMonthYear);
            
            // Calcular tendências
            const incomeTrend = lastMonthIncome === 0 ? 100 : ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100;
            const expensesTrend = lastMonthExpenses === 0 ? 100 : ((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
            const showIncomeTrend = lastMonthShowIncome === 0 ? 100 : ((currentShowIncome - lastMonthShowIncome) / lastMonthShowIncome) * 100;
            
            // Atualizar dados financeiros
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
            
            return this.finance;
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