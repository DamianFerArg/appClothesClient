// Import Firebase SDKs and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, where, doc, updateDoc, deleteDoc, addDoc, getDoc,  query, orderBy, limit  } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
//------------------------------------------------------------------------------------------LOAD CATEGORIES & ITEMS

// Call this function when the edit modal opens

document.addEventListener("DOMContentLoaded", async function () {
    const dropdowns = {
        clothing: document.getElementById("dropdown-clothing"),
        bedding: document.getElementById("dropdown-bedding"),
        other: document.getElementById("dropdown-other"),
        custom1: document.getElementById("dropdown-custom1"),
        custom2: document.getElementById("dropdown-custom2"),
        custom3: document.getElementById("dropdown-custom3"),
    };

    try {
        const querySnapshot = await getDocs(collection(db, "inventario"));
        const categories = new Set();

        // Collect all unique categories
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.categoria) {
                categories.add(data.categoria); // Normalize category names
            }
        });

        // Define category groups
        const clothingItems = new Set(["remera", "Vestido"]);
        const beddingItems = new Set(["sabana"]);
        const OtherItems = new Set(["sábana", "almohada"]);
        const Custom1Items = new Set(["toallon", "almohada"]);
        const Custom2Items = new Set(["medias", "Ropa interior"]);
        const Custom3Items = new Set(["pantalon", "bermuda", "short", "pescadora"]);

        // Track added categories to avoid duplication
        const addedCategories = new Set();

        // Clear dropdowns and set default labels
        dropdowns.clothing.innerHTML = '<option value="">Ropa</option>';
        dropdowns.bedding.innerHTML = '<option value="">Cama</option>';
        dropdowns.other.innerHTML = '<option value="">Otros</option>';
        dropdowns.custom1.innerHTML = '<option value="">Toallones</option>';
        dropdowns.custom2.innerHTML = '<option value="">Ropa Interior</option>';
        dropdowns.custom3.innerHTML = '<option value="">Pantalones</option>';

        // Process categories dynamically without depending on order
        categories.forEach((category) => {
            if (addedCategories.has(category)) return; // Skip if already added
            addedCategories.add(category);

            const option = document.createElement("option");
            option.value = category;
            option.textContent = category.toUpperCase(); // Always uppercase

            if (clothingItems.has(category)) {
                dropdowns.clothing.appendChild(option);
            } else if (beddingItems.has(category)) {
                dropdowns.bedding.appendChild(option);
            } else if (OtherItems.has(category)) {
                dropdowns.other.appendChild(option);
            } else if (Custom1Items.has(category)) {
                dropdowns.custom1.appendChild(option);
            } else if (Custom2Items.has(category)) {
                dropdowns.custom2.appendChild(option);
            } else if (Custom3Items.has(category)) {
                dropdowns.custom3.appendChild(option);
            } else {
                dropdowns.other.appendChild(option);
            }
        });

    } catch (error) {
        console.error("Error loading categories:", error);
    }

    // Function to handle dropdown selection
    function setupDropdownRedirect(dropdown) {
        dropdown.addEventListener("change", function (event) {
            const selectedCategory = event.target.value;
            if (selectedCategory) {
                window.location.href = `categorias.html?categoria=${selectedCategory}`;
            }
        });
    }

    // Set up redirects for all dropdowns
    Object.values(dropdowns).forEach(setupDropdownRedirect);
});






// Filter items based on selected category
document.getElementById('categoria-select').addEventListener('change', function () {
    const selectedCategory = this.value;
    const searchQuery = document.getElementById('search-box').value.trim();

    // Reset to the first page and reload items
    currentPage = 1;
    loadItems(currentPage, selectedCategory, searchQuery);
});

let currentPage = 1;
const itemsPerPage = 4;

function loadItems(page = 1, selectedCategory = 'all', searchQuery = '') {
    getDocs(collection(db, "inventario")).then((querySnapshot) => {
        const itemList = document.getElementById('item-list');
        itemList.innerHTML = ''; // Clear existing items

        // Group items by name (or another attribute) to handle talles
        const groupedItems = {};
        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            const itemId = docSnapshot.id;

            const groupKey = itemData.nombre; // Group by 'nombre'
            if (!groupedItems[groupKey]) {
                groupedItems[groupKey] = [];
            }
            groupedItems[groupKey].push({ ...itemData, id: itemId });
        });

        // Filter items by category and search query
        const allItems = Object.values(groupedItems); // Convert groupedItems to an array
        const filteredItems = allItems.filter(group => {
            const firstItem = group[0];
            const matchesCategory = (selectedCategory === 'all' || firstItem.categoria === selectedCategory);
            const matchesSearch = firstItem.nombre.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });

        const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

        // Get items for the current page
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = page * itemsPerPage;
        const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

        // Create cards for each group in the current page
        itemsToDisplay.forEach((itemsInGroup) => {
            const firstItem = itemsInGroup[0]; // Use the first item as a base for the card
            const itemCard = document.createElement('div');
            itemCard.className = 'card';
            itemCard.dataset.category = firstItem.categoria;

            // Add card content
            itemCard.innerHTML = `
            <img 
                src="${firstItem.imageUrl || 'img/noImage.jpg'}"
                alt="${firstItem.nombre}" 
                class="item-image" 
                id="item-image-${firstItem.id}" 
            >
            <h3>${firstItem.nombre}</h3>
            <p>Categoría: ${firstItem.categoria}</p>
            <div class="talle-container"></div>
            <p>Color: ${firstItem.color}</p>
            <p class="price" id="precio-${firstItem.id}">
                ${firstItem.precio > 0 ? `Precio: ${firstItem.precio} pesos` : 'Preguntar precio'}
            </p>
            <button class="btn ${firstItem.precio > 0 ? 'me-interesa-btn' : 'preguntar-precio-btn'}" 
                data-item='${JSON.stringify(firstItem)}'>
                ${firstItem.precio > 0 ? 'Me interesa' : 'Preguntar precio'}
            </button>
    
            <!-- Modal for Image Enlargement -->
            <div class="modal" id="modal-${firstItem.id}">
                <span class="close-btn" id="close-modal-${firstItem.id}">&times;</span>
                <img class="modal-content" id="modal-image-${firstItem.id}" src="" alt="">
            </div>
        `;
    
            // Add talle buttons if there are multiple talles
            const talleContainer = itemCard.querySelector('.talle-container');
            if (itemsInGroup.length > 1) {
                itemsInGroup.forEach((item) => {
                    const talleButton = document.createElement('button');
                    talleButton.textContent = item.talle;
                    talleButton.className = 'btn talle-btn';
                    talleButton.dataset.id = item.id;
                    talleButton.dataset.talle = item.talle;

                    // Add click event to update details on selection
                    talleButton.addEventListener('click', function () {
                        // Update the selected talle button's appearance
                        itemCard.querySelectorAll('.talle-btn').forEach((btn) => {
                            btn.classList.remove('selected');
                        });
                        this.classList.add('selected');

                        // Update card details with the selected talle
                        const selectedItem = itemsInGroup.find((i) => i.id === item.id);
                        updateCardWithSelectedTalle(itemCard, selectedItem);
                    });

                    talleContainer.appendChild(talleButton);
                });
            } else {
                // If only one talle exists, hide the talle container
                talleContainer.style.display = 'none';
            }

            itemList.appendChild(itemCard);
        });

        // Add event listeners for "Me interesa" buttons
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

        // Update pagination controls
        // updatePaginationControls(totalPages, page);
    });
}

function loadRemerasOnly(searchQuery = '') {
    getDocs(collection(db, "inventario")).then((querySnapshot) => {
        const remeraList = document.getElementById('remera-list');
        remeraList.innerHTML = ''; // Clear existing remeras

        const groupedItems = {};
        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            const itemId = docSnapshot.id;

            if (itemData.categoria === 'remera') {  // Filter for remeras only
                const groupKey = itemData.nombre;
                if (!groupedItems[groupKey]) {
                    groupedItems[groupKey] = [];
                }
                groupedItems[groupKey].push({ ...itemData, id: itemId });
            }
        });

        const allRemeras = Object.values(groupedItems);
        const filteredRemeras = allRemeras.filter(group => {
            const firstItem = group[0];
            return firstItem.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        });

        const itemsToDisplay = filteredRemeras.slice(0, 6); // Show only first 5 remeras

        itemsToDisplay.forEach((itemsInGroup) => {
            const firstItem = itemsInGroup[0];
            const itemCard = document.createElement('div');
            itemCard.className = 'remera-card'; // Custom class for remera styling

            itemCard.innerHTML = `
                <img src="${firstItem.imageUrl || 'img/noImage.jpg'}" alt="${firstItem.nombre}" class="remera-image">
                <h3>${firstItem.nombre}</h3>
                <p>${firstItem.precio > 0 ? `Precio: ${firstItem.precio} pesos` : 'Preguntar precio'}</p>
                <button class="btn ${firstItem.precio > 0 ? 'me-interesa-btn' : 'preguntar-precio-btn'}" 
                    data-item='${JSON.stringify(firstItem)}'>
                    ${firstItem.precio > 0 ? 'Me interesa' : 'Preguntar precio'}
                </button>
            `;

            // Add the "Me interesa" button functionality
            const meInteresaBtn = itemCard.querySelector('.me-interesa-btn');
            if (meInteresaBtn) {
                meInteresaBtn.addEventListener('click', (e) => {
                    const item = JSON.parse(e.target.getAttribute('data-item'));
                    sendWhatsAppMessage(item);
                });
            }

            // Add the "Preguntar precio" button functionality
            const preguntarPrecioBtn = itemCard.querySelector('.preguntar-precio-btn');
            if (preguntarPrecioBtn) {
                preguntarPrecioBtn.addEventListener('click', (e) => {
                    const item = JSON.parse(e.target.getAttribute('data-item'));
                    sendPriceInquiryWhatsAppMessage(item);
                });
            }

            remeraList.appendChild(itemCard);
        });
    });
}


function loadPantalonesOnly(searchQuery = '') {
    getDocs(collection(db, "inventario")).then((querySnapshot) => {
        const pantalonList = document.getElementById('pantalon-list');
        pantalonList.innerHTML = ''; // Clear existing pantalones

        const groupedItems = {};
        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            const itemId = docSnapshot.id;

            if (itemData.categoria === 'pantalon') {  // Filter for pantalones only
                const groupKey = itemData.nombre;
                if (!groupedItems[groupKey]) {
                    groupedItems[groupKey] = [];
                }
                groupedItems[groupKey].push({ ...itemData, id: itemId });
            }
        });

        const allPantalones = Object.values(groupedItems);
        const filteredPantalones = allPantalones.filter(group => {
            const firstItem = group[0];
            return firstItem.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        });

        const itemsToDisplay = filteredPantalones.slice(0, 6); // Show only first 5 pantalones

        itemsToDisplay.forEach((itemsInGroup) => {
            const firstItem = itemsInGroup[0];
            const itemCard = document.createElement('div');
            itemCard.className = 'pantalon-card'; // Custom class for pantalones

            itemCard.innerHTML = `
                <img src="${firstItem.imageUrl || 'img/noImage.jpg'}" alt="${firstItem.nombre}" class="pantalon-image">
                <h3>${firstItem.nombre}</h3>
                <p>${firstItem.precio > 0 ? `Precio: ${firstItem.precio} pesos` : 'Preguntar precio'}</p>
                <button class="btn ${firstItem.precio > 0 ? 'me-interesa-btn' : 'preguntar-precio-btn'}" 
                    data-item='${JSON.stringify(firstItem)}'>
                    ${firstItem.precio > 0 ? 'Me interesa' : 'Preguntar precio'}
                </button>
            `;

            // Add the "Me interesa" button functionality
            const meInteresaBtn = itemCard.querySelector('.me-interesa-btn');
            if (meInteresaBtn) {
                meInteresaBtn.addEventListener('click', (e) => {
                    const item = JSON.parse(e.target.getAttribute('data-item'));
                    sendWhatsAppMessage(item);
                });
            }

            // Add the "Preguntar precio" button functionality
            const preguntarPrecioBtn = itemCard.querySelector('.preguntar-precio-btn');
            if (preguntarPrecioBtn) {
                preguntarPrecioBtn.addEventListener('click', (e) => {
                    const item = JSON.parse(e.target.getAttribute('data-item'));
                    sendPriceInquiryWhatsAppMessage(item);
                });
            }

            pantalonList.appendChild(itemCard);
        });
    });
}



document.addEventListener("DOMContentLoaded", function () {
    loadItems();            // Load all items
    loadRemerasOnly();      // Load only remeras
    loadPantalonesOnly();   // Load only pantalones
});

// document.getElementById('search-box').addEventListener('input', function () {
//     const searchQuery = this.value.trim();
//     const selectedCategory = document.getElementById('categoria-select').value;

//     // Reset to the first page and reload items
//     currentPage = 1;
//     loadItems(currentPage, selectedCategory, searchQuery);
// });

// function updatePaginationControls(totalPages, currentPage) {
//     const paginationContainer = document.getElementById('pagination');
//     paginationContainer.innerHTML = ''; // Clear existing controls

//     for (let i = 1; i <= totalPages; i++) {
//         const pageButton = document.createElement('button');
//         pageButton.textContent = i;
//         pageButton.className = 'pagination-btn';
//         if (i === currentPage) pageButton.classList.add('active');

//         pageButton.addEventListener('click', () => {
//             currentPage = i;
//             loadItems(currentPage);
//         });

//         paginationContainer.appendChild(pageButton);
//     }
// }



function updateCardWithSelectedTalle(card, selectedItem) {
    // Show a loading spinner or placeholder
    const imageElement = card.querySelector('.item-image');
    if (!imageElement) {
        console.error("Image element not found in the card.");
        return;
    }

    // Create a container for the spinner overlay
    const overlayContainer = document.createElement('div');
    overlayContainer.className = 'spinner-overlay';
    card.style.position = 'relative'; // Ensure the card is relatively positioned

    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    overlayContainer.appendChild(spinner);

    // Add the overlay container as a sibling to the image
    card.appendChild(overlayContainer);

    // Update the details after a small delay (simulating loading time)
    setTimeout(() => {
        // Update name if the element exists
        const nameElement = card.querySelector('h3');
        if (nameElement) {
            nameElement.textContent = selectedItem.nombre;
        }

        // Update price if the element exists
        const priceElement = card.querySelector(`[id^="precio-"]`); // Find the price element by partial ID
        if (priceElement) {
            priceElement.id = `precio-${selectedItem.id}`; // Update the ID to match the selected item's ID
            priceElement.textContent = 
                selectedItem.precio > 0 ? `Precio: ${selectedItem.precio} pesos` : 'Preguntar precio';
        } else {
            console.error(`Price element not found for item ID: ${selectedItem.id}`);
            console.log("Card HTML:", card.innerHTML); // Debugging log
        }

        // Update image
        if (imageElement) {
            imageElement.src = selectedItem.imageUrl || 'img/noImage.jpg';
        }

        // Remove the spinner overlay
        overlayContainer.remove();
    }, 1100);
}





function sendPriceInquiryWhatsAppMessage(item) {
    const phoneNumber = "5491168759154"; // Replace with your WhatsApp number
    const message = encodeURIComponent(
        `Hola! Tengo una consulta sobre este producto:\n\n` +
        `Nombre: ${item.nombre}\n` +
        `CodCatalogo: ${item.codigoCatalogo}\n` +
        `Categoría: ${item.categoria}\n` +
        `Marca: ${item.marca}\n` +
        `Talle: ${item.talle}\n` +
        `Color: ${item.color}\n\n` +
        `Podrías indicarme el precio por favor? Muchas gracias!`+
        `Mira la imagen del producto: ${item.imageUrl}` // Add the image URL here 
        
    );

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

function sendWhatsAppMessage(item) {
    const phoneNumber = "5491168759154"; // Replace with your WhatsApp number
    const message = encodeURIComponent(
        `Hola! Me interesa el siguiente producto:\n\n` +
        `Nombre: ${item.nombre}\n` +
        `CodCatalogo: ${item.codigoCatalogo}\n` +
        `Categoría: ${item.categoria}\n` +
        `Marca: ${item.marca}\n` +
        `Talle: ${item.talle}\n` +
        `Color: ${item.color}\n` +
        `Precio: ${item.precio} pesos\n\n` +
        `Mira la imagen del producto: ${item.imageUrl}` // Add the image URL here
    );

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}



// Handle form submission for editing an item




// Cancel editing


// Filter items based on selected category
document.getElementById('categoria-select').addEventListener('change', function() {
    const selectedCategory = this.value;

    document.querySelectorAll('#item-list .card').forEach(item => {
        item.style.display = (selectedCategory === 'all' || item.dataset.category === selectedCategory) ? 'block' : 'none';
    });
});
//---------------------------------------------------------------------------CARROUSEL



document.addEventListener("DOMContentLoaded", function () {
    const slides = document.querySelectorAll(".carousel-slide");
    let currentIndex = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? "block" : "none";
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }

    // Show first slide initially
    showSlide(currentIndex);

    // Change slide every 3 seconds
    setInterval(nextSlide, 3000);
});


// Attach importData to the global window object
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

// Load items on page load


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
