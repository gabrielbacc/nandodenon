document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    // Se já estiver logado, redirecionar para dashboard
    if (SiteManager.isLoggedIn()) {
        location.href = 'dashboard.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (SiteManager.login(username, password)) {
                location.href = 'dashboard.html';
            } else {
                errorMessage.textContent = 'Usuário ou senha inválidos';
                errorMessage.style.display = 'block';
            }
        });
    }
}); 