// Navigation Toggle for Mobile
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Chatbot Functionality
const chatbot = document.getElementById('chatbot');
const chatbotToggle = document.getElementById('chatbot-toggle');
const chatbotClose = document.getElementById('chatbot-close');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotInput = document.getElementById('chatbot-input');
const chatbotSend = document.getElementById('chatbot-send');

let isChatbotOpen = false;

chatbotToggle.addEventListener('click', () => {
    isChatbotOpen = !isChatbotOpen;
    chatbot.classList.toggle('active', isChatbotOpen);
});

chatbotClose.addEventListener('click', () => {
    isChatbotOpen = false;
    chatbot.classList.remove('active');
});

// Chatbot Responses
const chatbotResponses = {
    'horaires': 'Nos horaires sont : Déjeuner 12h-14h30, Dîner 19h-22h30 du lundi au vendredi. Le week-end : 12h-15h et 19h-23h.',
    'adresse': 'Nous sommes situés au 123 Rue de la République, 75001 Paris.',
    'telephone': 'Vous pouvez nous contacter au 01 23 45 67 89.',
    'menu': 'Découvrez notre menu italien authentique sur la page Menu. Nous proposons des pâtes fraîches, pizzas et spécialités régionales.',
    'reservation': 'Pour réserver une table, rendez-vous sur notre page Réservation ou appelez-nous directement.',
    'parking': 'Un parking est disponible à 50 mètres du restaurant (Q-Park République).',
    'allergies': 'Nous pouvons adapter nos plats selon vos allergies. Mentionnez-le lors de votre réservation.',
    'groupe': 'Pour les groupes de plus de 8 personnes, contactez-nous directement pour organiser votre événement.',
    'default': 'Bonjour ! Je suis l\'assistant virtuel de La Trattoria Roma. Comment puis-je vous aider ?'
};

function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${isUser ? 'user' : 'bot'}`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function getBotResponse(userMessage) {
    const message = userMessage.toLowerCase();

    if (message.includes('horaire') || message.includes('heure') || message.includes('ouvert')) {
        return chatbotResponses.horaires;
    } else if (message.includes('adresse') || message.includes('où') || message.includes('localisation')) {
        return chatbotResponses.adresse;
    } else if (message.includes('téléphone') || message.includes('appel') || message.includes('contact')) {
        return chatbotResponses.telephone;
    } else if (message.includes('menu') || message.includes('plat') || message.includes('nourriture')) {
        return chatbotResponses.menu;
    } else if (message.includes('réservation') || message.includes('réserver') || message.includes('table')) {
        return chatbotResponses.reservation;
    } else if (message.includes('parking') || message.includes('voiture')) {
        return chatbotResponses.parking;
    } else if (message.includes('allergie') || message.includes('intolérance')) {
        return chatbotResponses.allergies;
    } else if (message.includes('groupe') || message.includes('événement') || message.includes('fête')) {
        return chatbotResponses.groupe;
    } else {
        return chatbotResponses.default;
    }
}

chatbotSend.addEventListener('click', () => {
    const message = chatbotInput.value.trim();
    if (message) {
        addMessage(message, true);
        chatbotInput.value = '';

        setTimeout(() => {
            const response = getBotResponse(message);
            addMessage(response);
        }, 500);
    }
});

chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        chatbotSend.click();
    }
});

// Reservation Form Handling
const reservationForm = document.getElementById('reservationForm');
if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(reservationForm);
        const reservationData = Object.fromEntries(formData);

        // Store reservation in localStorage (in a real app, this would be sent to a server)
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        reservationData.id = Date.now();
        reservationData.status = 'pending';
        reservationData.timestamp = new Date().toISOString();
        reservationData.synced = navigator.onLine; // Track sync status
        reservations.push(reservationData);
        localStorage.setItem('reservations', JSON.stringify(reservations));

        // Show success message
        alert(navigator.onLine ?
            'Votre réservation a été enregistrée ! Vous recevrez un email de confirmation dans les 24 heures.' :
            'Votre réservation a été enregistrée hors ligne. Elle sera synchronisée quand vous serez en ligne.');

        // Reset form
        reservationForm.reset();
    });
}

// Contact Form Handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const contactData = Object.fromEntries(formData);

        // In a real app, this would be sent to a server
        console.log('Contact form submitted:', contactData);

        alert('Votre message a été envoyé ! Nous vous répondrons dans les plus brefs délais.');

        // Reset form
        contactForm.reset();
    });
}

// Date validation for reservation
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
}

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.specialty-card, .testimonial, .contact-item').forEach(el => {
    observer.observe(el);
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .chatbot-message {
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 18px;
        max-width: 80%;
        animation: slideIn 0.3s ease-out;
    }

    .chatbot-message.user {
        background: #8B4513;
        color: white;
        margin-left: auto;
        text-align: right;
    }

    .chatbot-message.bot {
        background: #f0f0f0;
        color: #333;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize chatbot with welcome message
setTimeout(() => {
    if (chatbotMessages.children.length === 0) {
        addMessage('Bonjour ! Je suis l\'assistant virtuel de La Trattoria Roma. Comment puis-je vous aider ?');
    }
}, 1000);
