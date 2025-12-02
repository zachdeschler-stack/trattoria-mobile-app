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
    setupAdminTabs();
    setupAddDishForm();
    loadAdminReservations();
    loadCurrentMenu();
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

// Admin Tab Switching
function setupAdminTabs() {
    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');

    adminTabBtns.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            adminTabBtns.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Hide all admin tab contents
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Show selected admin tab content
            const tabId = button.getAttribute('data-admin-tab') + '-tab';
            document.getElementById('admin-' + tabId).classList.add('active');
        });
    });
}

// Load Admin Reservations
async function loadAdminReservations() {
    const container = document.getElementById('admin-reservations-container');

    if (!window.db) {
        container.innerHTML = '<p>Connexion Firebase requise pour gérer les réservations.</p>';
        return;
    }

    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, 'reservations'));
        const reservations = [];

        querySnapshot.forEach((doc) => {
            reservations.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by timestamp (most recent first)
        reservations.sort((a, b) => b.timestamp - a.timestamp);

        if (reservations.length === 0) {
            container.innerHTML = '<p>Aucune réservation trouvée.</p>';
            return;
        }

        container.innerHTML = '';

        reservations.forEach(reservation => {
            const reservationDiv = document.createElement('div');
            reservationDiv.className = 'admin-reservation-item';

            const statusClass = reservation.status === 'confirmed' ? 'confirmed' :
                               reservation.status === 'cancelled' ? 'cancelled' : 'pending';

            reservationDiv.innerHTML = `
                <div class="reservation-header">
                    <h4>${reservation.firstName} ${reservation.lastName}</h4>
                    <span class="status-badge ${statusClass}">${translateStatus(reservation.status)}</span>
                </div>
                <div class="reservation-details">
                    <p><strong>Date:</strong> ${formatDate(reservation.date)}</p>
                    <p><strong>Heure:</strong> ${reservation.time}</p>
                    <p><strong>Personnes:</strong> ${reservation.guests}</p>
                    <p><strong>Email:</strong> ${reservation.email}</p>
                    <p><strong>Téléphone:</strong> ${reservation.phone}</p>
                    ${reservation.specialRequests ? `<p><strong>Demandes:</strong> ${reservation.specialRequests}</p>` : ''}
                </div>
                <div class="reservation-actions">
                    ${reservation.status === 'pending' ? `
                        <button class="btn-accept" onclick="updateReservationStatus('${reservation.id}', 'confirmed')">Accepter</button>
                        <button class="btn-reject" onclick="updateReservationStatus('${reservation.id}', 'cancelled')">Refuser</button>
                    ` : ''}
                    <button class="btn-delete" onclick="deleteReservation('${reservation.id}')">Supprimer</button>
                </div>
            `;

            container.appendChild(reservationDiv);
        });

    } catch (error) {
        console.error('Error loading admin reservations:', error);
        container.innerHTML = '<p>Erreur lors du chargement des réservations.</p>';
    }
}

// Update Reservation Status
async function updateReservationStatus(reservationId, status) {
    if (!window.db) return;

    try {
        await window.updateDoc(window.doc(window.db, 'reservations', reservationId), {
            status: status,
            updatedAt: window.serverTimestamp()
        });

        alert(`Réservation ${status === 'confirmed' ? 'acceptée' : 'refusée'} avec succès !`);
        loadAdminReservations(); // Reload the list

    } catch (error) {
        console.error('Error updating reservation:', error);
        alert('Erreur lors de la mise à jour de la réservation.');
    }
}

// Delete Reservation
async function deleteReservation(reservationId) {
    if (!window.db) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) return;

    try {
        await window.deleteDoc(window.doc(window.db, 'reservations', reservationId));
        alert('Réservation supprimée avec succès !');
        loadAdminReservations(); // Reload the list

    } catch (error) {
        console.error('Error deleting reservation:', error);
        alert('Erreur lors de la suppression de la réservation.');
    }
}

// Setup Add Dish Form
function setupAddDishForm() {
    const addDishForm = document.getElementById('addDishForm');
    if (addDishForm) {
        addDishForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(addDishForm);
            const dishData = Object.fromEntries(formData);

            if (!window.db) {
                alert('Connexion Firebase requise pour ajouter des plats.');
                return;
            }

            try {
                await window.addDoc(window.collection(window.db, 'menu'), {
                    ...dishData,
                    price: parseFloat(dishData.price),
                    createdAt: window.serverTimestamp()
                });

                alert('✅ Plat ajouté avec succès !\n\n📱 Le plat apparaît maintenant dans votre app mobile\n🌐 Le plat sera visible sur votre site web après actualisation de la page\n\n💡 Conseil : Actualisez https://zachdeschler-stack.github.io/trattoria-mobile-app/menu.html pour voir le changement');
                addDishForm.reset();
                loadCurrentMenu(); // Reload menu

            } catch (error) {
                console.error('Error adding dish:', error);
                alert('❌ Erreur lors de l\'ajout du plat.');
            }
        });
    }
}

// Load Current Menu for Admin
async function loadCurrentMenu() {
    const container = document.getElementById('current-menu-container');

    if (!window.db) {
        container.innerHTML = '<p>Connexion Firebase requise pour charger le menu.</p>';
        return;
    }

    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, 'menu'));
        const menuItems = [];

        querySnapshot.forEach((doc) => {
            menuItems.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (menuItems.length === 0) {
            container.innerHTML = '<p>Aucun plat dans le menu.</p>';
            return;
        }

        // Group by category
        const menuByCategory = {
            antipasti: menuItems.filter(item => item.category === 'antipasti'),
            pates: menuItems.filter(item => item.category === 'pates'),
            pizzas: menuItems.filter(item => item.category === 'pizzas')
        };

        container.innerHTML = '';

        Object.keys(menuByCategory).forEach(category => {
            if (menuByCategory[category].length > 0) {
                container.innerHTML += `<h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>`;
                menuByCategory[category].forEach(item => {
                    container.innerHTML += `
                        <div class="admin-menu-item">
                            <div class="menu-item-info">
                                <h5>${item.name}</h5>
                                <p>${item.description}</p>
                                <span class="price">${item.price}€</span>
                            </div>
                            <div class="menu-item-actions">
                                <button class="btn-edit" onclick="editDish('${item.id}')">Modifier</button>
                                <button class="btn-delete" onclick="deleteDish('${item.id}')">Supprimer</button>
                            </div>
                        </div>
                    `;
                });
            }
        });

    } catch (error) {
        console.error('Error loading menu:', error);
        container.innerHTML = '<p>Erreur lors du chargement du menu.</p>';
    }
}

// Edit Dish
async function editDish(dishId) {
    console.log('editDish called with ID:', dishId);

    if (!window.db) {
        alert('Connexion Firebase requise pour modifier les plats.');
        return;
    }

    try {
        // Get the dish data
        const docRef = window.doc(window.db, 'menu', dishId);
        const docSnap = await window.getDoc(docRef);

        if (docSnap.exists()) {
            const dish = docSnap.data();
            console.log('Dish data loaded:', dish);

            // Create edit modal
            const modal = document.createElement('div');
            modal.className = 'edit-modal';
            modal.innerHTML = `
                <div class="edit-modal-content">
                    <h3>Modifier le Plat</h3>
                    <form id="editDishForm">
                        <div class="form-group">
                            <label for="editCategory">Catégorie</label>
                            <select id="editCategory" name="category" required>
                                <option value="antipasti" ${dish.category === 'antipasti' ? 'selected' : ''}>Antipasti</option>
                                <option value="pates" ${dish.category === 'pates' ? 'selected' : ''}>Pâtes</option>
                                <option value="pizzas" ${dish.category === 'pizzas' ? 'selected' : ''}>Pizzas</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="editName">Nom du Plat</label>
                            <input type="text" id="editName" name="name" value="${dish.name}" required>
                        </div>

                        <div class="form-group">
                            <label for="editDescription">Description</label>
                            <textarea id="editDescription" name="description" required>${dish.description}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="editPrice">Prix (€)</label>
                            <input type="number" id="editPrice" name="price" value="${dish.price}" step="0.01" required>
                        </div>

                        <div class="form-group">
                            <label for="editImage">URL de l'Image (optionnel)</label>
                            <input type="url" id="editImage" name="image" value="${dish.image || ''}" placeholder="https://...">
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" onclick="closeEditModal()">Annuler</button>
                            <button type="submit" class="btn-primary">Modifier</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
            console.log('Modal appended to body');

            // Add click outside to close modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeEditModal();
                }
            });

            // Handle form submission
            const editForm = document.getElementById('editDishForm');
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Form submitted');

                const formData = new FormData(editForm);
                const updatedDishData = Object.fromEntries(formData);

                try {
                    await window.updateDoc(docRef, {
                        ...updatedDishData,
                        price: parseFloat(updatedDishData.price),
                        updatedAt: window.serverTimestamp()
                    });

                    alert('✅ Plat modifié avec succès !\n\n📱 Le plat est mis à jour dans votre app mobile\n🌐 Le plat sera mis à jour sur votre site web après actualisation de la page');
                    closeEditModal();
                    loadCurrentMenu(); // Reload menu

                } catch (error) {
                    console.error('Error updating dish:', error);
                    alert('❌ Erreur lors de la modification du plat.');
                }
            });

        } else {
            alert('Plat non trouvé.');
        }

    } catch (error) {
        console.error('Error getting dish:', error);
        alert('Erreur lors du chargement du plat.');
    }
}

// Close edit modal
function closeEditModal() {
    const modal = document.querySelector('.edit-modal');
    if (modal) {
        modal.remove();
    }
}

// Delete Dish
async function deleteDish(dishId) {
    if (!window.db) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) return;

    try {
        await window.deleteDoc(window.doc(window.db, 'menu', dishId));
        alert('Plat supprimé avec succès !');
        loadCurrentMenu(); // Reload menu

    } catch (error) {
        console.error('Error deleting dish:', error);
        alert('Erreur lors de la suppression du plat.');
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
