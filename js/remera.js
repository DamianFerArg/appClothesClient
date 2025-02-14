// Import Firebase SDKs and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function loadRemeras(searchQuery = '') {
    const remeraList = document.getElementById('remera-list');
    remeraList.innerHTML = ''; // Clear existing remeras

    // Query Firestore for remeras only
    const remerasQuery = query(collection(db, "inventario"), where("categoria", "==", "remera"));

    getDocs(remerasQuery).then((querySnapshot) => {
        const groupedItems = {};

        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            const itemId = docSnapshot.id;

            const groupKey = itemData.nombre;
            if (!groupedItems[groupKey]) {
                groupedItems[groupKey] = [];
            }
            groupedItems[groupKey].push({ ...itemData, id: itemId });
        });

        // Convert grouped items to array and filter by search query
        const filteredRemeras = Object.values(groupedItems).filter(group => {
            const firstItem = group[0];
            return firstItem.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        });

        filteredRemeras.forEach((itemsInGroup) => {
            const firstItem = itemsInGroup[0]; // Use the first item for display
            const itemCard = document.createElement('div');
            itemCard.className = 'remera-card';

            itemCard.innerHTML = `
                <img src="${firstItem.imageUrl || 'img/noImage.jpg'}" alt="${firstItem.nombre}" class="remera-image">
                <h3>${firstItem.nombre}</h3>
                <p>${firstItem.precio > 0 ? `Precio: ${firstItem.precio} pesos` : 'Preguntar precio'}</p>
                <button class="btn ${firstItem.precio > 0 ? 'me-interesa-btn' : 'preguntar-precio-btn'}" 
                    data-item='${JSON.stringify(firstItem)}'>
                    ${firstItem.precio > 0 ? 'Me interesa' : 'Preguntar precio'}
                </button>
            `;

            // "Me interesa" button event
            itemCard.querySelector('.me-interesa-btn')?.addEventListener('click', (e) => {
                const item = JSON.parse(e.target.getAttribute('data-item'));
                sendWhatsAppMessage(item);
            });

            // "Preguntar precio" button event
            itemCard.querySelector('.preguntar-precio-btn')?.addEventListener('click', (e) => {
                const item = JSON.parse(e.target.getAttribute('data-item'));
                sendPriceInquiryWhatsAppMessage(item);
            });

            remeraList.appendChild(itemCard);
        });
    }).catch(error => {
        console.error("Error fetching remeras:", error);
    });
}

document.getElementById('search-box').addEventListener('input', function () {
    const searchQuery = this.value.trim();

    // Reset to the first page and reload items
    loadRemeras(searchQuery);
});

// Load remeras when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadRemeras();
});
