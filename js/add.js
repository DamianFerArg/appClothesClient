// Import Firebase SDKs and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Your web app's Firebase configuration (already in your HTML, so you can remove from there)
const firebaseConfig = {
    apiKey: "AIzaSyBvluKIuZRR3CDlGeJSa6qYF0pAdgCpnBE",
    authDomain: "proyectclothes-b6e88.firebaseapp.com",
    projectId: "proyectclothes-b6e88",
    storageBucket: "proyectclothes-b6e88.appspot.com",
    messagingSenderId: "973366577223",
    appId: "1:973366577223:web:66403424635d1300de4962",
    measurementId: "G-E7SX5N778J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);
console.log("Firebase App Initialized: ", app);
console.log("Firestore Initialized: ", db);

// Fetch and display inventory items from Firestore when the page loads
// Fetch items from Firestore and categorize them
// ... Existing Firebase and Firestore code ...

// Function to filter items based on selected category

// Fetch and display inventory items from Firestore when the page loads
getDocs(collection(db, "inventario")).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        let itemData = doc.data();
        
        let item = document.createElement('li');
        item.textContent = `${itemData.nombre} - Cantidad: ${itemData.cantidad} - Precio: ${itemData.precio} pesos`;
        item.dataset.category = itemData.categoria; // Store category for filtering

        document.getElementById('item-list').appendChild(item);
    });
}).catch(error => {
    console.error("Error fetching Firestore data: ", error);
});


document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the add_items page
    if (window.location.pathname.includes('add_item.html')) {
        const form = document.getElementById('form-agregar');
        
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();

                // Get form values
                let nombre = document.getElementById('nombre').value;
                let categoria = document.getElementById('categoria').value;
                let cantidad = document.getElementById('cantidad').value;
                let precio = document.getElementById('precio').value;

                // Create new document in Firestore
                try {
                    await addDoc(collection(db, "inventario"), {
                        nombre: nombre,
                        categoria: categoria,
                        cantidad: parseInt(cantidad),
                        precio: parseFloat(precio)
                    });

                    // Clear form after successful submission
                    form.reset();
                    alert('Prenda agregada exitosamente!');
                } catch (error) {
                    console.error("Error adding document: ", error);
                }
            });
        }
    }
});
