// Admin Panel JavaScript for La Trattoria Roma

// Admin credentials
const ADMIN_USERNAME = 'zach';
const ADMIN_PASSWORD = '123soleil';

// DOM elements
const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const reservationsTableBody = document.getElementById('reservationsTableBody');

// Check if user is logged in
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showDashboard();
    } else {
        showLogin();
    }
}

// Show login form
function showLogin() {
    adminLogin.style.display = 'flex';
    adminDashboard.style.display = 'none';
}

// Show admin dashboard
function showDashboard() {
    adminLogin.style.display = 'none';
    adminDashboard.style.display = 'block';
    loadReservations();
}

// Handle login form submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
    } else {
        alert('Identifiants incorrects. Veuillez réessayer.');
    }
});

// Handle logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    showLogin();
});

// Load reservations from localStorage
function loadReservations() {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');

    // Sort reservations by date and time
    reservations.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
    });

    reservationsTableBody.innerHTML = '';

    if (reservations.length === 0) {
        reservationsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Aucune réservation trouvée.</td></tr>';
        return;
    }

    reservations.forEach(reservation => {
        const row = document.createElement('tr');

        const statusClass = reservation.status === 'confirmed' ? 'confirmed' :
                           reservation.status === 'cancelled' ? 'cancelled' : 'pending';

        row.innerHTML = `
            <td>${formatDate(reservation.date)}</td>
            <td>${reservation.time}</td>
            <td>${reservation.firstName} ${reservation.lastName}</td>
            <td>${reservation.guests}</td>
            <td>${reservation.email}<br>${reservation.phone}</td>
            <td><span class="status ${statusClass}">${translateStatus(reservation.status)}</span></td>
            <td>
                ${reservation.status !== 'confirmed' ? `<button class="action-btn" onclick="updateReservationStatus(${reservation.id}, 'confirmed')">Confirmer</button>` : ''}
                ${reservation.status !== 'cancelled' ? `<button class="action-btn cancel" onclick="updateReservationStatus(${reservation.id}, 'cancelled')">Annuler</button>` : ''}
            </td>
        `;

        reservationsTableBody.appendChild(row);
    });
}

// Format date in French
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// Translate status to French
function translateStatus(status) {
    switch (status) {
        case 'confirmed': return 'Confirmée';
        case 'pending': return 'En attente';
        case 'cancelled': return 'Annulée';
        default: return status;
    }
}

// Update reservation status
function updateReservationStatus(reservationId, newStatus) {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const reservationIndex = reservations.findIndex(r => r.id === reservationId);

    if (reservationIndex !== -1) {
        reservations[reservationIndex].status = newStatus;
        localStorage.setItem('reservations', JSON.stringify(reservations));
        loadReservations();
    }
}

// Sidebar navigation
document.querySelectorAll('.admin-sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links
        document.querySelectorAll('.admin-sidebar a').forEach(l => l.classList.remove('active'));

        // Add active class to clicked link
        link.classList.add('active');

        // Hide all sections
        document.getElementById('reservationsSection').style.display = 'none';
        document.getElementById('calendarSection').style.display = 'none';
        document.getElementById('menuSection').style.display = 'none';
        document.getElementById('specialtiesSection').style.display = 'none';
        document.getElementById('contactSection').style.display = 'none';
        document.getElementById('settingsSection').style.display = 'none';

        // Show selected section
        const sectionId = link.getAttribute('data-section') + 'Section';
        document.getElementById(sectionId).style.display = 'block';

        // Load content for specific sections
        if (link.getAttribute('data-section') === 'menu') {
            loadMenuItems('antipasti');
        } else if (link.getAttribute('data-section') === 'specialties') {
            loadSpecialties();
        } else if (link.getAttribute('data-section') === 'contact') {
            loadContactInfo();
        }
    });
});

// Generate calendar (basic implementation)
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Clear existing calendar
    calendar.innerHTML = '';

    // Add day headers
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day';
        dayHeader.style.fontWeight = 'bold';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });

    // Get first day of month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Get last day of month
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendar.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        // Highlight today
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayElement.classList.add('today');
        }

        // Check if day has reservations (simplified - in real app, check against reservations data)
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        const hasReservation = reservations.some(r => {
            const reservationDate = new Date(r.date);
            return reservationDate.getDate() === day &&
                   reservationDate.getMonth() === currentMonth &&
                   reservationDate.getFullYear() === currentYear;
        });

        if (hasReservation) {
            dayElement.classList.add('booked');
        }

        calendar.appendChild(dayElement);
    }
}

// Settings form handling
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const openingHours = document.getElementById('openingHours').value;
        const maxGuests = document.getElementById('maxGuests').value;
        const reservationAdvance = document.getElementById('reservationAdvance').value;

        // Save settings to localStorage (in a real app, this would be saved to a database)
        const settings = {
            openingHours,
            maxGuests: parseInt(maxGuests),
            reservationAdvance: parseInt(reservationAdvance)
        };

        localStorage.setItem('restaurantSettings', JSON.stringify(settings));
        alert('Paramètres sauvegardés avec succès !');
    });
}

// Content Management Functions

// Validation functions
function validateMenuItem(name, description, price) {
    const errors = [];

    if (!name || name.trim().length < 2) {
        errors.push('Le nom du plat doit contenir au moins 2 caractères.');
    }

    if (!description || description.trim().length < 10) {
        errors.push('La description doit contenir au moins 10 caractères.');
    }

    if (!price || !price.match(/^\d+€?$/)) {
        errors.push('Le prix doit être un nombre suivi de € (ex: 15€).');
    }

    return errors;
}

function validateSpecialty(name, description) {
    const errors = [];

    if (!name || name.trim().length < 2) {
        errors.push('Le nom de la spécialité doit contenir au moins 2 caractères.');
    }

    if (!description || description.trim().length < 10) {
        errors.push('La description doit contenir au moins 10 caractères.');
    }

    return errors;
}

function validateContactInfo(address, phone, email, hours) {
    const errors = [];

    if (!address || address.trim().length < 10) {
        errors.push('L\'adresse doit contenir au moins 10 caractères.');
    }

    if (!phone || !phone.match(/^[\d\s\-\+\(\)]+$/)) {
        errors.push('Le numéro de téléphone n\'est pas valide.');
    }

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push('L\'adresse email n\'est pas valide.');
    }

    if (!hours || hours.trim().length < 10) {
        errors.push('Les horaires doivent contenir au moins 10 caractères.');
    }

    return errors;
}

function showValidationErrors(errors) {
    alert('Erreurs de validation:\n\n' + errors.join('\n'));
}

// Initialize default content in localStorage
function initializeDefaultContent() {
    if (!localStorage.getItem('menuItems')) {
        const defaultMenu = {
            antipasti: [
                { id: 1, name: 'Bruschetta Classique', description: 'Pain grillé à l\'ail avec tomates, basilic et huile d\'olive', price: '8€', image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=300' },
                { id: 2, name: 'Carpaccio de Bœuf', description: 'Fines tranches de bœuf cru avec roquette et parmesan', price: '12€', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300' },
                { id: 3, name: 'Antipasto Misto', description: 'Assortiment de charcuteries et fromages italiens', price: '15€', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300' }
            ],
            pates: [
                { id: 4, name: 'Spaghetti Carbonara', description: 'Spaghetti avec œufs, pancetta, pecorino et poivre noir', price: '14€', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300' },
                { id: 5, name: 'Penne all\'Arrabbiata', description: 'Penne avec sauce tomate épicée et basilic frais', price: '12€', image: 'https://images.unsplash.com/photo-1563379091339-03246963d4ae?w=300' },
                { id: 6, name: 'Ravioli aux Épinards', description: 'Ravioli farcis aux épinards et ricotta, sauce aux champignons', price: '16€', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300' }
            ],
            pizzas: [
                { id: 7, name: 'Margherita', description: 'Sauce tomate, mozzarella, basilic frais', price: '10€', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' },
                { id: 8, name: 'Prosciutto e Funghi', description: 'Sauce tomate, mozzarella, jambon, champignons', price: '13€', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300' },
                { id: 9, name: 'Quattro Stagioni', description: 'Sauce tomate, mozzarella, artichauts, olives, jambon, champignons', price: '15€', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=300' }
            ],
            desserts: [
                { id: 10, name: 'Tiramisu', description: 'Biscuits à la cuillère imbibés de café, mascarpone, cacao', price: '7€', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300' },
                { id: 11, name: 'Panna Cotta', description: 'Crème cuite vanillée avec coulis de fruits rouges', price: '6€', image: 'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=300' },
                { id: 12, name: 'Gelato Assortimento', description: 'Assortiment de 3 parfums de glace artisanale', price: '5€', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300' }
            ]
        };
        localStorage.setItem('menuItems', JSON.stringify(defaultMenu));
    }

    if (!localStorage.getItem('specialties')) {
        const defaultSpecialties = [
            { id: 1, name: 'Pâtes Fraîches', description: 'Fabriquées maison selon des recettes traditionnelles.', image: 'https://images.unsplash.com/photo-1563379091339-03246963d4ae?w=400' },
            { id: 2, name: 'Pizzas Artisanales', description: 'Cuisson au feu de bois pour un goût incomparable.', image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400' },
            { id: 3, name: 'Desserts Maison', description: 'Tiramisu, panna cotta et autres délices italiens.', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' }
        ];
        localStorage.setItem('specialties', JSON.stringify(defaultSpecialties));
    }

    if (!localStorage.getItem('contactInfo')) {
        const defaultContact = {
            address: '123 Rue de la République\n75001 Paris, France',
            phone: '01 23 45 67 89',
            email: 'info@trattoriaroma.fr',
            hours: 'Lundi - Vendredi: 12h - 14h30, 19h - 22h30\nSamedi - Dimanche: 12h - 15h, 19h - 23h'
        };
        localStorage.setItem('contactInfo', JSON.stringify(defaultContact));
    }
}

// Menu Management Functions
function loadMenuItems(category) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems') || '{}');
    const items = menuItems[category] || [];
    const menuItemsList = document.getElementById('menuItemsList');

    menuItemsList.innerHTML = '';

    if (items.length === 0) {
        menuItemsList.innerHTML = '<p style="text-align: center; padding: 2rem;">Aucun plat trouvé dans cette catégorie.</p>';
        return;
    }

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item-admin';
        itemDiv.innerHTML = `
            <div class="menu-item-content">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <span class="price">${item.price}</span>
            </div>
            <div class="menu-item-actions">
                <button class="action-btn" onclick="editMenuItem(${item.id}, '${category}')">Modifier</button>
                <button class="action-btn cancel" onclick="deleteMenuItem(${item.id}, '${category}')">Supprimer</button>
            </div>
        `;
        menuItemsList.appendChild(itemDiv);
    });
}

function addMenuItem() {
    const category = document.querySelector('.category-btn.active').getAttribute('data-category');
    const name = prompt('Nom du plat:');
    if (!name) return;

    const description = prompt('Description:');
    if (!description) return;

    const price = prompt('Prix:');
    if (!price) return;

    // Validate input
    const errors = validateMenuItem(name, description, price);
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }

    const image = prompt('URL de l\'image (optionnel):') || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300';

    const menuItems = JSON.parse(localStorage.getItem('menuItems') || '{}');
    if (!menuItems[category]) menuItems[category] = [];

    const newId = Math.max(...menuItems[category].map(item => item.id), 0) + 1;
    menuItems[category].push({
        id: newId,
        name,
        description,
        price,
        image
    });

    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    loadMenuItems(category);
}

function editMenuItem(id, category) {
    const menuItems = JSON.parse(localStorage.getItem('menuItems') || '{}');
    const item = menuItems[category].find(item => item.id === id);
    if (!item) return;

    const name = prompt('Nom du plat:', item.name);
    if (!name) return;

    const description = prompt('Description:', item.description);
    if (!description) return;

    const price = prompt('Prix:', item.price);
    if (!price) return;

    // Validate input
    const errors = validateMenuItem(name, description, price);
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }

    const image = prompt('URL de l\'image:', item.image) || item.image;

    item.name = name;
    item.description = description;
    item.price = price;
    item.image = image;

    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    loadMenuItems(category);
}

function deleteMenuItem(id, category) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) return;

    const menuItems = JSON.parse(localStorage.getItem('menuItems') || '{}');
    menuItems[category] = menuItems[category].filter(item => item.id !== id);

    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    loadMenuItems(category);
}

// Specialties Management Functions
function loadSpecialties() {
    const specialties = JSON.parse(localStorage.getItem('specialties') || '[]');
    const specialtiesList = document.getElementById('specialtiesList');

    specialtiesList.innerHTML = '';

    if (specialties.length === 0) {
        specialtiesList.innerHTML = '<p style="text-align: center; padding: 2rem;">Aucune spécialité trouvée.</p>';
        return;
    }

    specialties.forEach(specialty => {
        const specialtyDiv = document.createElement('div');
        specialtyDiv.className = 'specialty-item-admin';
        specialtyDiv.innerHTML = `
            <div class="specialty-item-content">
                <h4>${specialty.name}</h4>
                <p>${specialty.description}</p>
            </div>
            <div class="specialty-item-actions">
                <button class="action-btn" onclick="editSpecialty(${specialty.id})">Modifier</button>
                <button class="action-btn cancel" onclick="deleteSpecialty(${specialty.id})">Supprimer</button>
            </div>
        `;
        specialtiesList.appendChild(specialtyDiv);
    });
}

function addSpecialty() {
    const name = prompt('Nom de la spécialité:');
    if (!name) return;

    const description = prompt('Description:');
    if (!description) return;

    // Validate input
    const errors = validateSpecialty(name, description);
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }

    const image = prompt('URL de l\'image (optionnel):') || 'https://images.unsplash.com/photo-1563379091339-03246963d4ae?w=400';

    const specialties = JSON.parse(localStorage.getItem('specialties') || '[]');
    const newId = Math.max(...specialties.map(item => item.id), 0) + 1;

    specialties.push({
        id: newId,
        name,
        description,
        image
    });

    localStorage.setItem('specialties', JSON.stringify(specialties));
    loadSpecialties();
}

function editSpecialty(id) {
    const specialties = JSON.parse(localStorage.getItem('specialties') || '[]');
    const specialty = specialties.find(item => item.id === id);
    if (!specialty) return;

    const name = prompt('Nom de la spécialité:', specialty.name);
    if (!name) return;

    const description = prompt('Description:', specialty.description);
    if (!description) return;

    // Validate input
    const errors = validateSpecialty(name, description);
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }

    const image = prompt('URL de l\'image:', specialty.image) || specialty.image;

    specialty.name = name;
    specialty.description = description;
    specialty.image = image;

    localStorage.setItem('specialties', JSON.stringify(specialties));
    loadSpecialties();
}

function deleteSpecialty(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ?')) return;

    const specialties = JSON.parse(localStorage.getItem('specialties') || '[]');
    const filteredSpecialties = specialties.filter(item => item.id !== id);

    localStorage.setItem('specialties', JSON.stringify(filteredSpecialties));
    loadSpecialties();
}

// Contact Info Management Functions
function loadContactInfo() {
    const contactInfo = JSON.parse(localStorage.getItem('contactInfo') || '{}');

    document.getElementById('contactAddress').value = contactInfo.address || '';
    document.getElementById('contactPhone').value = contactInfo.phone || '';
    document.getElementById('contactEmail').value = contactInfo.email || '';
    document.getElementById('contactHours').value = contactInfo.hours || '';
}

// Event Listeners for Content Management
document.addEventListener('DOMContentLoaded', () => {
    // Menu category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.getAttribute('data-category');
            loadMenuItems(category);
        });
    });

    // Add menu item button
    const addMenuItemBtn = document.getElementById('addMenuItemBtn');
    if (addMenuItemBtn) {
        addMenuItemBtn.addEventListener('click', addMenuItem);
    }

    // Add specialty button
    const addSpecialtyBtn = document.getElementById('addSpecialtyBtn');
    if (addSpecialtyBtn) {
        addSpecialtyBtn.addEventListener('click', addSpecialty);
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const address = document.getElementById('contactAddress').value;
            const phone = document.getElementById('contactPhone').value;
            const email = document.getElementById('contactEmail').value;
            const hours = document.getElementById('contactHours').value;

            // Validate input
            const errors = validateContactInfo(address, phone, email, hours);
            if (errors.length > 0) {
                showValidationErrors(errors);
                return;
            }

            const contactInfo = {
                address,
                phone,
                email,
                hours
            };

            localStorage.setItem('contactInfo', JSON.stringify(contactInfo));
            alert('Informations de contact sauvegardées avec succès !');
        });
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    generateCalendar();
    initializeDefaultContent();
});
