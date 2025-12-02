// Mobile App JavaScript for La Trattoria Roma

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Online/Offline Status
function updateOnlineStatus() {
    const statusElement = document.getElementById('online-status');
    if (navigator.onLine) {
        statusElement.textContent = 'En ligne';
        statusElement.className = 'status online';
        syncReservations(); // Sync when coming back online
    } else {
        statusElement.textContent = 'Hors ligne';
        statusElement.className = 'status offline';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    updateOnlineStatus();
    loadReservations();
    loadMenu();
    setupNavigation();
    setupReservationForm();
});

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });

            // Show selected section
            const sectionId = button.getAttribute('data-section') + '-section';
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// Reservation Form Handling
function setupReservationForm() {
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(reservationForm);
            const reservationData = Object.fromEntries(formData);

            // Add timestamp and ID
            reservationData.id = Date.now();
            reservationData.status = 'pending';
            reservationData.timestamp = new Date().toISOString();
            reservationData.synced = navigator.onLine;

            try {
                if (navigator.onLine && window.db) {
                    // Save to Firebase if online
                    const docRef = await window.addDoc(window.collection(window.db, 'reservations'), {
                        ...reservationData,
                        timestamp: window.serverTimestamp(),
                        synced: true
                    });
                    reservationData.firebaseId = docRef.id;
                    console.log('Reservation saved to Firebase with ID:', docRef.id);
                } else {
                    // Store offline if no connection or Firebase not loaded
                    const offlineReservations = JSON.parse(localStorage.getItem('offlineReservations') || '[]');
                    offlineReservations.push(reservationData);
                    localStorage.setItem('offlineReservations', JSON.stringify(offlineReservations));
                }

                // Always store locally for display
                const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
                reservations.push(reservationData);
                localStorage.setItem('reservations', JSON.stringify(reservations));

                // Show success message
                alert(navigator.onLine ?
                    'Votre réservation a été enregistrée et synchronisée !' :
                    'Votre réservation a été enregistrée hors ligne. Elle sera synchronisée quand vous serez en ligne.');

                // Reset form
                reservationForm.reset();

                // Reload reservations list
                loadReservations();

            } catch (error) {
                console.error('Error saving reservation:', error);
                alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
            }
        });
    }
}

// Load Reservations
function loadReservations() {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const container = document.getElementById('reservations-container');

    if (reservations.length === 0) {
        container.innerHTML = '<p>Aucune réservation trouvée.</p>';
        return;
    }

    // Sort reservations by date (most recent first)
    reservations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    container.innerHTML = '';

    reservations.forEach(reservation => {
        const reservationDiv = document.createElement('div');
        reservationDiv.className = 'reservation-item';

        const statusClass = reservation.status === 'confirmed' ? 'confirmed' :
                           reservation.status === 'cancelled' ? 'cancelled' : 'pending';

        reservationDiv.innerHTML = `
            <h4>${reservation.firstName} ${reservation.lastName}</h4>
            <p><strong>Date:</strong> ${formatDate(reservation.date)}</p>
            <p><strong>Heure:</strong> ${reservation.time}</p>
            <p><strong>Personnes:</strong> ${reservation.guests}</p>
            <p><strong>Email:</strong> ${reservation.email}</p>
            <p><strong>Téléphone:</strong> ${reservation.phone}</p>
            ${reservation.specialRequests ? `<p><strong>Demandes:</strong> ${reservation.specialRequests}</p>` : ''}
            <span class="status-badge ${statusClass}">${translateStatus(reservation.status)}</span>
            ${!reservation.synced ? '<span class="status-badge pending">Non synchronisé</span>' : ''}
        `;

        container.appendChild(reservationDiv);
    });
}

// Load Menu (cached version)
function loadMenu() {
    const menuContainer = document.getElementById('menu-container');

    // Try to load from localStorage first (cached menu)
    const cachedMenu = localStorage.getItem('menuItems');
    if (cachedMenu) {
        displayMenu(JSON.parse(cachedMenu));
        return;
    }

    // If no cached menu, show placeholder
    menuContainer.innerHTML = '<p>Menu non disponible hors ligne. Connectez-vous pour charger le menu.</p>';
}

function displayMenu(menuData) {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = '';

    // Display antipasti
    if (menuData.antipasti && menuData.antipasti.length > 0) {
        menuContainer.innerHTML += '<h3>Antipasti</h3>';
        menuData.antipasti.forEach(item => {
            menuContainer.innerHTML += `
                <div class="menu-item">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <span class="price">${item.price}</span>
                </div>
            `;
        });
    }

    // Display pates
    if (menuData.pates && menuData.pates.length > 0) {
        menuContainer.innerHTML += '<h3>Pâtes</h3>';
        menuData.pates.forEach(item => {
            menuContainer.innerHTML += `
                <div class="menu-item">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <span class="price">${item.price}</span>
                </div>
            `;
        });
    }

    // Display pizzas
    if (menuData.pizzas && menuData.pizzas.length > 0) {
        menuContainer.innerHTML += '<h3>Pizzas</h3>';
        menuData.pizzas.forEach(item => {
            menuContainer.innerHTML += `
                <div class="menu-item">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <span class="price">${item.price}</span>
                </div>
            `;
        });
    }
}

// Sync Reservations when online
async function syncReservations() {
    if (!navigator.onLine || !window.db) return;

    const offlineReservations = JSON.parse(localStorage.getItem('offlineReservations') || '[]');

    if (offlineReservations.length === 0) return;

    console.log(`Synchronisation de ${offlineReservations.length} réservations...`);

    let syncedCount = 0;

    for (const reservation of offlineReservations) {
        try {
            // Save to Firebase
            const docRef = await window.addDoc(window.collection(window.db, 'reservations'), {
                ...reservation,
                timestamp: window.serverTimestamp(),
                synced: true
            });

            // Update local storage with Firebase ID
            reservation.firebaseId = docRef.id;
            reservation.synced = true;

            // Move to main reservations list
            const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
            reservations.push(reservation);
            localStorage.setItem('reservations', JSON.stringify(reservations));

            // Remove from offline storage
            const index = offlineReservations.indexOf(reservation);
            offlineReservations.splice(index, 1);

            syncedCount++;
            console.log('Réservation synchronisée:', docRef.id);

        } catch (error) {
            console.error('Erreur lors de la synchronisation:', error);
        }
    }

    // Save remaining offline reservations
    localStorage.setItem('offlineReservations', JSON.stringify(offlineReservations));

    if (syncedCount > 0) {
        loadReservations();
        alert(`${syncedCount} réservation(s) synchronisée(s) avec succès !`);
    }

    console.log(`${syncedCount} réservations synchronisées`);
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function translateStatus(status) {
    switch (status) {
        case 'confirmed': return 'Confirmée';
        case 'pending': return 'En attente';
        case 'cancelled': return 'Annulée';
        default: return status;
    }
}

// Date validation for reservation
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
}
