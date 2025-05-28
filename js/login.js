document.addEventListener('DOMContentLoaded', function() {
    // Verificar se já está logado
    if (SiteManager.isLoggedIn()) {
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'dashboard.html';
        }
        return;
    }

    // Configurar o formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            
            try {
                const success = await SiteManager.login(username, password);
                if (success) {
                    window.location.href = 'dashboard.html';
                } else {
                    if (errorMessage) {
                        errorMessage.textContent = 'Usuário ou senha inválidos';
                        errorMessage.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                if (errorMessage) {
                    errorMessage.textContent = 'Erro ao fazer login. Tente novamente.';
                    errorMessage.style.display = 'block';
                }
            }
        });
    }
}); 