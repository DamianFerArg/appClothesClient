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
// async function loadCategoryItems(category, searchQuery = '') {
//     const categoryItemsContainer = document.getElementById("category-items");
//     categoryItemsContainer.innerHTML = ""; // Clear existing items

//     try {
//         const querySnapshot = await getDocs(collection(db, "inventario"));
//         const groupedItems = {};

//         querySnapshot.forEach((docSnapshot) => {
//             const itemData = docSnapshot.data();
//             const itemId = docSnapshot.id;
            
//             // Filter items by category and search query
//             if (itemData.categoria === category && itemData.nombre.toLowerCase().includes(searchQuery.toLowerCase())) {
//                 const groupKey = itemData.nombre; // Group by name

//                 if (!groupedItems[groupKey]) {
//                     groupedItems[groupKey] = [];
//                 }
//                 groupedItems[groupKey].push({ ...itemData, id: itemId });
//             }
//         });

//         const filteredItems = Object.values(groupedItems); // Convert to array

//         if (filteredItems.length === 0) {
//             categoryItemsContainer.innerHTML = "<p>No hay stock disponible en este momento.</p>";
//             return;
//         }

//         // Display items
//         filteredItems.forEach((itemsInGroup) => {
//             const firstItem = itemsInGroup[0]; // Base item for the card
//             const itemCard = document.createElement("div");
//             itemCard.className = "item-card";
//             itemCard.innerHTML = `
//                 <img src="${firstItem.imageUrl || 'img/noImage.jpg'}" alt="${firstItem.nombre}" class="item-image">
//                 <div class="item-info">
//                     <h3>${firstItem.nombre}</h3>
//                     <div class="talle-container"></div>
//                     <p>${firstItem.precio > 0 ? `Precio: ${firstItem.precio} pesos` : 'Preguntar precio'}</p>
//                     <button class="btn ${firstItem.precio > 0 ? 'me-interesa-btn' : 'preguntar-precio-btn'}" 
//                         data-item='${JSON.stringify(firstItem)}'>
//                         ${firstItem.precio > 0 ? 'Me interesa' : 'Preguntar precio'}
//                     </button>
//                 </div>
//             `;

//             // Handle talle buttons
//             const talleContainer = itemCard.querySelector('.talle-container');
//             if (itemsInGroup.length > 1) {
//                 const buttonWrapper = document.createElement("div");
//                 buttonWrapper.className = "talle-container";
            
//                 const colorWrapper = document.createElement("div");
//                 colorWrapper.className = "color-container";
            
//                 itemsInGroup.forEach((item) => {
//                     // Create talle button
//                     const talleButton = document.createElement("button");
//                     talleButton.textContent = item.talle;
//                     talleButton.className = "talle-btn";
//                     talleButton.dataset.id = item.id;
//                     talleButton.dataset.talle = item.talle;
            
//                     talleButton.addEventListener("click", function () {
//                         itemCard.querySelectorAll(".talle-btn").forEach((btn) => btn.classList.remove("selected"));
//                         this.classList.add("selected");
            
//                         const selectedItem = itemsInGroup.find((i) => i.id === item.id);
//                         updateCardWithSelectedTalle(itemCard, selectedItem);
//                     });
            
//                     buttonWrapper.appendChild(talleButton);
            
//                     // Create color button
//                     if (item.color) {
//                         const colorButton = document.createElement("button");
//                         colorButton.className = "color-btn";
//                         colorButton.dataset.id = item.id;
//                         colorButton.dataset.color = item.color;
//                         colorButton.style.backgroundColor = item.color.toLowerCase(); // Assume colors are stored as text like "red"
            
//                         colorButton.addEventListener("click", function () {
//                             itemCard.querySelectorAll(".color-btn").forEach((btn) => btn.classList.remove("selected"));
//                             this.classList.add("selected");
            
//                             const selectedItem = itemsInGroup.find((i) => i.id === item.id);
//                             updateCardWithSelectedTalle(itemCard, selectedItem);
//                         });
            
//                         colorWrapper.appendChild(colorButton);
//                     }
//                 });
            
//                 talleContainer.appendChild(buttonWrapper);
//                 talleContainer.appendChild(colorWrapper);
//             }
//              else {
//                 talleContainer.style.display = 'none';
//             }

//             categoryItemsContainer.appendChild(itemCard);
//         });

//         // Add event listeners for buttons
//         document.querySelectorAll('.me-interesa-btn').forEach((button) => {
//             button.addEventListener('click', (e) => {
//                 const item = JSON.parse(e.target.getAttribute('data-item'));
//                 sendWhatsAppMessage(item);
//             });
//         });

//         document.querySelectorAll('.preguntar-precio-btn').forEach(button => {
//             button.addEventListener('click', (e) => {
//                 const item = JSON.parse(e.target.getAttribute('data-item'));
//                 sendPriceInquiryWhatsAppMessage(item);
//             });
//         });

//     } catch (error) {
//         console.error("Error loading category items:", error);
//     }
// }
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
                const groupKey = `${itemData.nombre}-${itemData.marca}`; // Group by name + brand

                if (!groupedItems[groupKey]) {
                    groupedItems[groupKey] = {};
                }

                if (!groupedItems[groupKey][itemData.talle]) {
                    groupedItems[groupKey][itemData.talle] = [];
                }

                groupedItems[groupKey][itemData.talle].push({ ...itemData, id: itemId });
            }
        });

        if (Object.keys(groupedItems).length === 0) {
            categoryItemsContainer.innerHTML = "<p>No hay stock disponible en este momento.</p>";
            return;
        }

        // Display items
        Object.entries(groupedItems).forEach(([groupKey, talles]) => {
            const firstTalle = Object.keys(talles)[0]; // Default talle to display first
            const itemsInGroup = talles[firstTalle];

            const firstItem = itemsInGroup[0]; // Base item for the card
            const itemCard = document.createElement("div");
            itemCard.className = "item-card";
            itemCard.innerHTML = `
                <img src="${firstItem.imageUrl || 'img/noImage.jpg'}" alt="${firstItem.nombre}" class="item-image">
                <div class="item-info">
                    <h3>${firstItem.nombre} (${firstItem.marca})</h3>
                    <div class="talle-container"></div>
                    <div class="color-container"></div>
                    <p>${firstItem.precio > 0 ? `Precio: ${firstItem.precio} pesos` : 'Preguntar precio'}</p>
                    <button class="btn ${firstItem.precio > 0 ? 'me-interesa-btn' : 'preguntar-precio-btn'}" 
                        data-item='${JSON.stringify(firstItem)}'>
                        ${firstItem.precio > 0 ? 'Me interesa' : 'Preguntar precio'}
                    </button>
                </div>
            `;

            // **Handle talle buttons (if more than one talle exists)**
            const talleContainer = itemCard.querySelector('.talle-container');
            const tallesArray = Object.keys(talles);
            let firstTalleButton = null;

            if (tallesArray.length > 0) {
                tallesArray.forEach((talle, index) => {
                    const talleButton = document.createElement('button');
                    talleButton.textContent = talle;
                    talleButton.className = 'talle-btn';
                    talleButton.dataset.talle = talle;

                    talleButton.addEventListener('click', function () {
                        itemCard.querySelectorAll('.talle-btn').forEach((btn) => btn.classList.remove('selected'));
                        this.classList.add('selected');
                        updateCardWithSelectedTalleAndColors(itemCard, talles[talle]);
                    });

                    talleContainer.appendChild(talleButton);

                    if (index === 0) {
                        firstTalleButton = talleButton;
                    }
                });
            } else {
                talleContainer.style.display = 'none';
            }

            // **Handle color buttons for the first talle**
            const colorContainer = itemCard.querySelector('.color-container');
            if (talles[firstTalle].length > 1) {
                talles[firstTalle].forEach((item) => {
                    const colorButton = document.createElement('button');
                    colorButton.className = 'color-btn';
                    colorButton.dataset.color = item.color;
                    colorButton.style.backgroundColor = item.color.toLowerCase();
                    colorButton.title = item.color; // Tooltip with color name

                    colorButton.addEventListener('click', function () {
                        itemCard.querySelectorAll('.color-btn').forEach((btn) => btn.classList.remove('selected'));
                        this.classList.add('selected');
                        updateCardWithSelectedTalleAndColors(itemCard, [item]);
                    });

                    colorContainer.appendChild(colorButton);
                });
            } else {
                colorContainer.style.display = 'none';
            }

            if (firstTalleButton) {
                firstTalleButton.classList.add('selected'); // Highlight the first talle
                firstTalleButton.click(); // Simulate click to load colors
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

function updateCardWithSelectedTalleAndColors(itemCard, selectedItems, keepColors = false) {
    const selectedItem = selectedItems[0];

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

    // Update color buttons
    const colorTranslationMap = {
        "Negro": "#000000",  
        "Blanco": "#FFFFFF",
        "Rojo": "#FF0000",   
        "Azul": "#0000FF",   
        "verde": "#008000",  
        "Verde Oscuro": "#006400",
        "Gris": "#808080",   
        "Amarillo": "#FFFF00", 
        "Naranja": "#FFA500", 
        "Morado": "#800080",  
        "Rosa": "#FFC0CB",  
        "Marrón": "#A52A2A",  
        "Beige": "#F5F5DC",   
    };

    const colorContainer = itemCard.querySelector('.color-container');

    if (!keepColors) { 
        colorContainer.innerHTML = ""; // Clear only if changing talle

        selectedItems.forEach((item) => {
            const colorButton = document.createElement('button');
            colorButton.className = 'color-btn';
            colorButton.dataset.color = item.color;
            colorButton.style.backgroundColor = colorTranslationMap[item.color] || item.color.toLowerCase();
            colorButton.title = item.color; // Tooltip

            colorButton.classList.add('color-circle');


            colorButton.addEventListener('click', function () {
                itemCard.querySelectorAll('.color-btn').forEach((btn) => btn.classList.remove('selected'));
                this.classList.add('selected');
                updateCardWithSelectedTalleAndColors(itemCard, [item], true); // Keep colors on click
            });

            colorContainer.appendChild(colorButton);
        });

        colorContainer.style.display = 'flex';
    }

    // Ensure the selected color is highlighted
    itemCard.querySelectorAll('.color-btn').forEach((btn) => {
        if (btn.dataset.color === selectedItem.color) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
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

document.addEventListener('DOMContentLoaded', function () {
    const images = document.querySelectorAll('img'); // Select all images
    images.forEach(img => {
        img.setAttribute('loading', 'lazy'); // Set loading="lazy" for each image
    });
});
