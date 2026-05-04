require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY;
const ZENROWS_URL = 'https://api.zenrows.com/v1/';

app.post('/api/automate', async (req, res) => {
    try {
        // 1. Ouvrir boomlify.com et cliquer sur "Crée"
        const boomlifyResponse = await axios.post(ZENROWS_URL, {
            url: 'https://boomlify.com/',
            js_render: true,
            actions: [
                { action: 'click', selector: 'span:contains("Crée")' },
                { action: 'wait_for_selector', selector: 'svg[lucide-copy]' },
                { action: 'click', selector: 'svg[lucide-copy]' },
                { action: 'wait_for_selector', selector: 'svg[lucide-mail]' },
                { action: 'click', selector: 'svg[lucide-mail]' },
                { action: 'extract', selector: 'body', type: 'text' }
            ]
        }, {
            headers: {
                'apikey': ZENROWS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        // Extraire l'email depuis la réponse (à adapter selon le format de retour de ZenRows)
        const email = extractEmailFromResponse(boomlifyResponse.data);
        if (!email) throw new Error("Email non trouvé sur Boomlify");

        // 2. Aller sur serper.dev, remplir le formulaire
        const firstName = generateRandomString(5);
        const lastName = generateRandomString(5);
        const password = generateRandomPassword(5);

        const serperResponse = await axios.post(ZENROWS_URL, {
            url: 'https://serper.dev/',
            js_render: true,
            actions: [
                { action: 'click', selector: 'button:contains("Sign up")' },
                { action: 'wait_for_selector', selector: 'input[name="firstName"]' },
                { action: 'fill', selector: 'input[name="firstName"]', value: firstName },
                { action: 'fill', selector: 'input[name="lastName"]', value: lastName },
                { action: 'fill', selector: 'input[name="email"]', value: email },
                { action: 'fill', selector: 'input[name="password"]', value: password },
                { action: 'click', selector: 'button:contains("Create account")' },
                { action: 'wait_for_navigation' }
            ]
        }, {
            headers: {
                'apikey': ZENROWS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        res.json({
            success: true,
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: password,
            serperResponse: serperResponse.data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

function extractEmailFromResponse(data) {
    // À adapter selon le format de retour de ZenRows
    // Exemple : chercher une chaîne qui ressemble à un email
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/;
    const match = JSON.stringify(data).match(emailRegex);
    return match ? match[0] : null;
}

function generateRandomString(length) {
    return Math.random().toString(36).substring(2, 2 + length);
}

function generateRandomPassword(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // S'assurer qu'il y a au moins une majuscule et un chiffre
    if (!/[A-Z]/.test(password)) {
        password = password.substring(0, length - 1) + 'A';
    }
    if (!/[0-9]/.test(password)) {
        password = password.substring(0, length - 1) + '1';
    }
    return password;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
