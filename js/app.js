// Import Firebase SDKs and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvluKIuZRR3CDlGeJSa6qYF0pAdgCpnBE",
    authDomain: "proyectclothes-b6e88.firebaseapp.com",
    projectId: "proyectclothes-b6e88",
    storageBucket: "proyectclothes-b6e88.appspot.com",
    messagingSenderId: "973366577223",
    appId: "1:973366577223:web:66403424635d1300de4962",
    measurementId: "G-E7SX5N778J"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to load items from Firestore and display them
function loadItems() {
    getDocs(collection(db, "inventario")).then((querySnapshot) => {
        const itemList = document.getElementById('item-list');
        itemList.innerHTML = ''; // Clear existing items

        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            const itemId = docSnapshot.id;

            const itemCard = document.createElement('div');
            itemCard.className = 'card';
            itemCard.dataset.category = itemData.categoria; // Category for filtering

            // Added an image placeholder in the card
            itemCard.innerHTML = `
                <img src="https://via.placeholder.com/150" alt="${itemData.nombre}" class="item-image">
                <h3>${itemData.nombre}</h3>
                <p>Cantidad: ${itemData.cantidad}</p>
                <p>Precio: ${itemData.precio} pesos</p>
                <button class="edit-btn" data-id="${itemId}">Editar</button>
            `;

            itemList.appendChild(itemCard);
        });

        // Attach event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', openEditForm);
        });
    }).catch(error => {
        console.error("Error fetching Firestore data: ", error);
    });
}



// Open the edit form with the item’s details
function openEditForm(event) {
    const itemId = event.target.getAttribute('data-id');
    const item = event.target.parentElement;
    
    // Fill the form with the current item data
    document.getElementById('edit-id').value = itemId;
    document.getElementById('edit-nombre').value = item.childNodes[3].textContent;
    document.getElementById('edit-categoria').value = item.dataset.category;
    document.getElementById('edit-cantidad').value = parseInt(item.childNodes[5].textContent.replace('Cantidad: ', ''));
    document.getElementById('edit-precio').value = parseFloat(item.childNodes[7].textContent.replace('Precio: ', '').replace(' pesos', ''));
    
    document.getElementById('edit-item').classList.remove('hidden');
    document.getElementById('edit-overlay').classList.remove('hidden');
}

// Handle form submission for editing an item
document.getElementById('form-editar').addEventListener('submit', async function(event) {
    event.preventDefault();

    const itemId = document.getElementById('edit-id').value;
    const updatedData = {
        nombre: document.getElementById('edit-nombre').value,
        categoria: document.getElementById('edit-categoria').value,
        cantidad: parseInt(document.getElementById('edit-cantidad').value),
        precio: parseFloat(document.getElementById('edit-precio').value)
    };

    // Log data before update for debugging
    console.log("Updating item with ID:", itemId, "with data:", updatedData);

    try {
        await updateDoc(doc(db, "inventario", itemId), updatedData);

        alert('Prenda actualizada exitosamente!');

        // Log data after successful update
        console.log("Updated item:", itemId);

        // Delay reloading to ensure Firestore processes the update
        setTimeout(() => {
            loadItems();
            document.getElementById('edit-item').classList.add('hidden');
            document.getElementById('edit-overlay').classList.add('hidden');
        }, 500);

    } catch (error) {
        console.error("Error updating document: ", error);
        alert('Hubo un error al actualizar la prenda.');
    }
});


// Cancel editing
document.getElementById('cancel-edit').addEventListener('click', () => {
    document.getElementById('edit-overlay').classList.add('hidden');
});

// Filter items based on selected category
document.getElementById('categoria-select').addEventListener('change', function() {
    const selectedCategory = this.value;

    document.querySelectorAll('#item-list .card').forEach(item => {
        item.style.display = (selectedCategory === 'all' || item.dataset.category === selectedCategory) ? 'block' : 'none';
    });
});

// Load items on page load
loadItems();
