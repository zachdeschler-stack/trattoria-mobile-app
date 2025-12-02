// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_example_key_here",
  authDomain: "trattoria-mobile-app.firebaseapp.com",
  projectId: "trattoria-mobile-app",
  storageBucket: "trattoria-mobile-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Function to save reservation
async function saveReservation(reservation) {
  try {
    const docRef = await db.collection('reservations').add({
      ...reservation,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      synced: true
    });
    console.log('Reservation saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving reservation:', error);
    throw error;
  }
}

// Function to get all reservations
async function getReservations() {
  try {
    const querySnapshot = await db.collection('reservations').orderBy('timestamp', 'desc').get();
    const reservations = [];
    querySnapshot.forEach((doc) => {
      reservations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return reservations;
  } catch (error) {
    console.error('Error getting reservations:', error);
    throw error;
  }
}

// Function to sync offline reservations
async function syncOfflineReservations() {
  const offlineReservations = JSON.parse(localStorage.getItem('offlineReservations') || '[]');

  if (offlineReservations.length === 0) return;

  for (const reservation of offlineReservations) {
    try {
      await saveReservation(reservation);
      // Remove from offline storage after successful sync
      const index = offlineReservations.indexOf(reservation);
      offlineReservations.splice(index, 1);
    } catch (error) {
      console.error('Failed to sync reservation:', reservation, error);
    }
  }

  localStorage.setItem('offlineReservations', JSON.stringify(offlineReservations));
}
