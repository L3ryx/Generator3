require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Récupère la clé API ZenRows depuis les variables d'environnement
const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY;
const ZENROWS_URL = 'https://api.zenrows.com/v1/';

// Fonction pour générer une chaîne aléatoire
function generateRandomString(length) {
    return Math.random().toString(36).substring(2, 2 + length);
}

// Fonction pour générer un mot de passe aléatoire (avec majuscule et chiffre)
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

// Fonction pour extraire un email d'un texte
function extractEmailFromText(text) {
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/;
    const match = text.match(emailRegex);
    return match ? match[0] : null;
}

// Route pour lancer l'automatisation
app.post('/api/automate', async (req, res) => {
    try {
        console.log('Début de l\'automatisation...');

        // --- Étape 1 : Ouvrir Boomlify et récupérer l'email ---
        console.log('1. Accès à Boomlify...');
        const boomlifyResponse = await axios.post(ZENROWS_URL, {
            url: 'https://boomlify.com/',
            js_render: true,
            actions: [
                { action: 'wait_for_selector', selector: 'span:contains("Crée")', timeout: 10000 },
                { action: 'click', selector: 'span:contains("Crée")' },
                { action: 'wait_for_selector', selector: 'svg[lucide-copy]', timeout: 10000 },
                { action: 'click', selector: 'svg[lucide-copy]' },
                { action: 'wait_for_selector', selector: 'svg[lucide-mail]', timeout: 10000 },
                { action: 'click', selector: 'svg[lucide-mail]' },
                { action: 'wait', time: 2000 }, // Attendre 2 secondes pour que l'email s'affiche
                { action: 'extract', selector: 'body', type: 'text' }
            ]
        }, {
            headers: {
                'apikey': ZENROWS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('Réponse Boomlify :', boomlifyResponse.data);
        const email = extractEmailFromText(boomlifyResponse.data?.result?.body || '');
        if (!email) {
            throw new Error("Impossible de trouver l'email sur Boomlify. Vérifiez les sélecteurs ou le contenu de la page.");
        }
        console.log('Email trouvé :', email);

        // --- Étape 2 : Inscription sur Serper.dev ---
        console.log('2. Inscription sur Serper.dev...');
        const firstName = generateRandomString(5);
        const lastName = generateRandomString(5);
        const password = generateRandomPassword(8); // 8 caractères pour plus de sécurité

        const serperResponse = await axios.post(ZENROWS_URL, {
            url: 'https://serper.dev/',
            js_render: true,
            actions: [
                { action: 'wait_for_selector', selector: 'button:contains("Sign up")', timeout: 10000 },
                { action: 'click', selector: 'button:contains("Sign up")' },
                { action: 'wait_for_selector', selector: 'input[name="firstName"]', timeout: 10000 },
                { action: 'fill', selector: 'input[name="firstName"]', value: firstName },
                { action: 'fill', selector: 'input[name="lastName"]', value: lastName },
                { action: 'fill', selector: 'input[name="email"]', value: email },
                { action: 'fill', selector: 'input[name="password"]', value: password },
                { action: 'click', selector: 'button:contains("Create account")' },
                { action: 'wait', time: 3000 } // Attendre 3 secondes pour la confirmation
            ]
        }, {
            headers: {
                'apikey': ZENROWS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('Réponse Serper :', serperResponse.data);

        // --- Réponse finale ---
        res.json({
            success: true,
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: password,
            boomlifyData: boomlifyResponse.data,
            serperData: serperResponse.data
        });

    } catch (error) {
        console.error('Erreur complète :', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.detail || error.message,
            fullError: error.response?.data || error.stack
        });
    }
});

// Route pour servir le frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
