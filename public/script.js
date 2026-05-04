document.getElementById('zenrowsButton').addEventListener('click', async () => {
    const button = document.getElementById('zenrowsButton');
    const resultDiv = document.getElementById('result');

    button.disabled = true;
    button.textContent = 'En cours...';

    try {
        const response = await fetch('/api/automate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.success) {
            resultDiv.innerHTML = `
                <p><strong>Succès !</strong></p>
                <p>Email généré : ${data.email}</p>
                <p>Prénom : ${data.firstName}</p>
                <p>Nom : ${data.lastName}</p>
                <p>Mot de passe : ${data.password}</p>
                <p>Réponse Serper : ${JSON.stringify(data.serperResponse, null, 2)}</p>
            `;
        } else {
            resultDiv.innerHTML = `<p style="color: red;">Erreur : ${data.error}</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Erreur : ${error.message}</p>`;
    } finally {
        button.disabled = false;
        button.textContent = 'Lancer la recherche ZenRows';
    }
});
