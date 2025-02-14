import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to load categories into the dropdown in categorias.html
async function loadCategories() {
    const categoryDropdown = document.getElementById("category-dropdown");

    try {
        const querySnapshot = await getDocs(collection(db, "inventario"));
        const categories = new Set();

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.categoria) {
                categories.add(data.categoria); // Collect categories in a set (to avoid duplicates)
            }
        });

        // Clear the dropdown first
        categoryDropdown.innerHTML = '<option value="">Categorías</option>';  // Reset to the default option

        // Add each category to the dropdown
        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryDropdown.appendChild(option); // Add to dropdown
        });

    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// Function to load items for the selected category and search query
async function loadCategoryItems(category, searchQuery = '') {
    const categoryItemsContainer = document.getElementById("category-items");
    categoryItemsContainer.innerHTML = ""; // Clear existing items

    try {
        const querySnapshot = await getDocs(collection(db, "inventario"));
        const filteredItems = [];

        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            // Filter items by category and search query
            if (itemData.categoria === category && itemData.nombre.toLowerCase().includes(searchQuery.toLowerCase())) {
                filteredItems.push(itemData);
            }
        });

        if (filteredItems.length === 0) {
            categoryItemsContainer.innerHTML = "<p>No hay productos en esta categoría.</p>";
            return;
        }

        // Display items
        filteredItems.forEach((item) => {
            const itemCard = document.createElement("div");
            itemCard.className = "item-card";
            itemCard.innerHTML = `
                <img src="${item.imageUrl || 'img/noImage.jpg'}" alt="${item.nombre}" class="item-image">
                <div class="item-info">
                    <h3>${item.nombre}</h3>
                    <p>${item.precio > 0 ? `Precio: ${item.precio} pesos` : 'Preguntar precio'}</p>
                    <button class="btn me-interesa-btn" data-item='${JSON.stringify(item)}'>
                        ${item.precio > 0 ? 'Me interesa' : 'Preguntar precio'}
                    </button>
                </div>
            `;

            // Add event listener to the button
            itemCard.querySelector(".me-interesa-btn").addEventListener("click", (e) => {
                const itemData = JSON.parse(e.target.getAttribute("data-item"));
                sendWhatsAppMessage(itemData);
            });

            categoryItemsContainer.appendChild(itemCard);
        });

    } catch (error) {
        console.error("Error loading category items:", error);
    }
}

// Function to send a WhatsApp message
function sendWhatsAppMessage(item) {
    const phone = "YOUR_WHATSAPP_NUMBER"; // Replace with actual number
    const message = `Hola, estoy interesado en "${item.nombre}" (${item.categoria}).`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
}

// Function to update the category parameter in the URL and reload the items
function handleCategoryChange(event) {
    const selectedCategory = event.target.value;
    const url = new URL(window.location);
    if (selectedCategory) {
        url.searchParams.set("categoria", selectedCategory); // Update URL with selected category
        window.history.pushState({}, "", url); // Update browser history without reloading
    } else {
        url.searchParams.delete("categoria");
        window.history.pushState({}, "", url);
    }

    // Reload the items based on the selected category
    loadCategoryItems(selectedCategory);
}

// Get category from URL (initial load)
const params = new URLSearchParams(window.location.search);
const categoryFromURL = params.get("categoria");
document.getElementById("category-title").textContent = categoryFromURL ? `Categoría: ${categoryFromURL}` : "Categoría no encontrada";

// Load categories into dropdown
loadCategories();

// Set event listener on dropdown to handle category change
document.getElementById("category-dropdown").addEventListener("change", handleCategoryChange);

// Add search functionality to filter items
document.getElementById('search-box').addEventListener('input', function () {
    const searchQuery = this.value.trim();

    // Reload items based on selected category and search query
    loadCategoryItems(categoryFromURL, searchQuery);
});

// Load the items for the selected category on page load
if (categoryFromURL) {
    loadCategoryItems(categoryFromURL);
}
