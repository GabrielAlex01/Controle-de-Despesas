// NOVO ARQUIVO: reset.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-reset-password');
    const tokenInput = document.getElementById('reset-token');
    const novaSenhaInput = document.getElementById('nova-senha-reset');
    const confirmarSenhaInput = document.getElementById('confirmar-nova-senha-reset');

    // Pega o token da URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        alert('Token de redefinição não encontrado. Por favor, solicite um novo link.');
        form.innerHTML = '<p>Token inválido.</p>';
        return;
    }

    tokenInput.value = token;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const novaSenha = novaSenhaInput.value;
        const confirmarSenha = confirmarSenhaInput.value;

        if (novaSenha !== confirmarSenha) {
            alert('As senhas não são iguais.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, novaSenha: novaSenha }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Falha ao redefinir a senha.');
            }

            alert('Senha redefinida com sucesso! Você será redirecionado para a página de login.');
            window.location.href = 'index.html'; // Redireciona para o login

        } catch (error) {
            console.error('Erro ao redefinir senha:', error);
            alert(`Erro: ${error.message}`);
        }
    });
});