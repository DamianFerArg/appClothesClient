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
        const groupedItems = {};

        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            const itemId = docSnapshot.id;
            
            // Filter items by category and search query
            if (itemData.categoria === category && itemData.nombre.toLowerCase().includes(searchQuery.toLowerCase())) {
                const groupKey = itemData.nombre; // Group by name

                if (!groupedItems[groupKey]) {
                    groupedItems[groupKey] = [];
                }
                groupedItems[groupKey].push({ ...itemData, id: itemId });
            }
        });

        const filteredItems = Object.values(groupedItems); // Convert to array

        if (filteredItems.length === 0) {
            categoryItemsContainer.innerHTML = "<p>No hay stock disponible en este momento.</p>";
            return;
        }

        // Display items
        filteredItems.forEach((itemsInGroup) => {
            const firstItem = itemsInGroup[0]; // Base item for the card
            const itemCard = document.createElement("div");
            itemCard.className = "item-card";
            itemCard.innerHTML = `
                <img src="${firstItem.imageUrl || 'img/noImage.jpg'}" alt="${firstItem.nombre}" class="item-image">
                <div class="item-info">
                    <h3>${firstItem.nombre}</h3>
                    <div class="talle-container"></div>
                    <p>${firstItem.precio > 0 ? `Precio: ${firstItem.precio} pesos` : 'Preguntar precio'}</p>
                    <button class="btn ${firstItem.precio > 0 ? 'me-interesa-btn' : 'preguntar-precio-btn'}" 
                        data-item='${JSON.stringify(firstItem)}'>
                        ${firstItem.precio > 0 ? 'Me interesa' : 'Preguntar precio'}
                    </button>
                </div>
            `;

            // Handle talle buttons
            const talleContainer = itemCard.querySelector('.talle-container');
            if (itemsInGroup.length > 1) {
                itemsInGroup.forEach((item) => {
                    const talleButton = document.createElement('button');
                    talleButton.textContent = item.talle;
                    talleButton.className = 'talle-btn';
                    talleButton.dataset.id = item.id;
                    talleButton.dataset.talle = item.talle;

                    // Click event to update details
                    talleButton.addEventListener('click', function () {
                        itemCard.querySelectorAll('.talle-btn').forEach((btn) => btn.classList.remove('selected'));
                        this.classList.add('selected');

                        const selectedItem = itemsInGroup.find((i) => i.id === item.id);
                        updateCardWithSelectedTalle(itemCard, selectedItem);
                    });

                    talleContainer.appendChild(talleButton);
                });
            } else {
                talleContainer.style.display = 'none';
            }

            categoryItemsContainer.appendChild(itemCard);
        });

        // Add event listeners for buttons
        document.querySelectorAll('.me-interesa-btn').forEach((button) => {
            button.addEventListener('click', (e) => {
                const item = JSON.parse(e.target.getAttribute('data-item'));
                sendWhatsAppMessage(item);
            });
        });

        document.querySelectorAll('.preguntar-precio-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const item = JSON.parse(e.target.getAttribute('data-item'));
                sendPriceInquiryWhatsAppMessage(item);
            });
        });

    } catch (error) {
        console.error("Error loading category items:", error);
    }
}

function updateCardWithSelectedTalle(itemCard, selectedItem) {
    // Update image
    const imageElement = itemCard.querySelector('.item-image');
    if (selectedItem.imageUrl) {
        imageElement.src = selectedItem.imageUrl;
        imageElement.alt = selectedItem.nombre;
    }

    // Update price
    const priceElement = itemCard.querySelector('.item-info p');
    priceElement.textContent = selectedItem.precio > 0 
        ? `Precio: ${selectedItem.precio} pesos` 
        : 'Preguntar precio';

    // Update WhatsApp button data
    const button = itemCard.querySelector('.item-info .btn');
    button.setAttribute('data-item', JSON.stringify(selectedItem));

    // Update button text and class based on price
    if (selectedItem.precio > 0) {
        button.textContent = 'Me interesa';
        button.classList.remove('preguntar-precio-btn');
        button.classList.add('me-interesa-btn');
    } else {
        button.textContent = 'Preguntar precio';
        button.classList.remove('me-interesa-btn');
        button.classList.add('preguntar-precio-btn');
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

document.addEventListener("DOMContentLoaded", function () {
    if (window.location.href.includes("categorias.html")) {
        document.querySelector(".header").classList.add("categorias-margin");

        // Apply margin to #category-items too
        const categoryItems = document.querySelector("#category-items");
        if (categoryItems) {
            categoryItems.classList.add("categorias-margin-top");
        }
    }
});
document.getElementById("category-dropdown").addEventListener("change", function () {
    let selectedCategory = this.value;
    if (selectedCategory) {
        // Reload the page with the selected category as a URL parameter
        window.location.href = window.location.pathname + "?categoria=" + selectedCategory;
    }
});
document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".menu-toggle");
    const fullScreenMenu = document.querySelector(".full-screen-menu");
    const closeMenu = document.querySelector(".close-menu");

    menuToggle.addEventListener("click", function () {
        fullScreenMenu.classList.add("active");
    });

    closeMenu.addEventListener("click", function () {
        fullScreenMenu.classList.remove("active");
    });

    // Close menu when clicking outside the menu items
    fullScreenMenu.addEventListener("click", function (event) {
        if (event.target === fullScreenMenu) {
            fullScreenMenu.classList.remove("active");
        }
    });
});
// Call the function to populate the menu
document.querySelectorAll('.category-title').forEach((categoryTitle) => {
    categoryTitle.addEventListener('click', (e) => {
        const subcategoryList = categoryTitle.nextElementSibling; // Get the next sibling (subcategory list)

        // Toggle the 'open' class to show/hide the subcategories
        subcategoryList.classList.toggle('open');
    });
});
