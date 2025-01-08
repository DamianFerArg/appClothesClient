// Import Firebase SDKs and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc,  query, orderBy, limit  } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
//------------------------------------------------------------------------------------------LOAD CATEGORIES & ITEMS
// async function populateEditCategories() {
//     try {
//         const categorySet = new Set();

//         // Fetch all items from Firestore to extract unique categories
//         const querySnapshot = await getDocs(collection(db, "inventario"));
//         querySnapshot.forEach((doc) => {
//             const item = doc.data();
//             if (item.categoria) {
//                 categorySet.add(item.categoria); // Add category to the Set
//             }
//         });

//         // Select the edit-categoria dropdown
//         const editCategoriaSelect = document.getElementById("edit-categoria");

//         // Clear any existing options
//         editCategoriaSelect.innerHTML = "";

//         // Add options dynamically
//         categorySet.forEach((category) => {
//             const option = document.createElement("option");
//             option.value = category;
//             option.textContent = category;
//             editCategoriaSelect.appendChild(option);
//         });
//     } catch (error) {
//         console.error("Error populating categories in edit form:", error);
//     }
// }

// Call this function when the edit modal opens

// Function to load categories dynamically from Firestore
function loadCategories() {
    getDocs(collection(db, "inventario")).then((querySnapshot) => {
        const categoriaSelect = document.getElementById('categoria-select');
        const categories = new Set(); // To store unique categories

        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            if (itemData.categoria) {
                categories.add(itemData.categoria); // Add category to the set
            }
        });

        // Clear existing categories in the select
        categoriaSelect.innerHTML = '<option value="all">Todos</option>'; // Reset to "Todos"

        // Add categories dynamically to the select element
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoriaSelect.appendChild(option);
        });

    }).catch(error => {
        console.error("Error fetching categories from Firestore:", error);
    });
}

// Call loadCategories when the page is loaded or whenever necessary
loadCategories();

// Filter items based on selected category
document.getElementById('categoria-select').addEventListener('change', function() {
    const selectedCategory = this.value;

    document.querySelectorAll('#item-list .card').forEach(item => {
        item.style.display = (selectedCategory === 'all' || item.dataset.category === selectedCategory) ? 'block' : 'none';
    });
});


let currentPage = 1;
const itemsPerPage = 25;

function loadItems(page = 1) {
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

        const allItems = Object.values(groupedItems); // Convert groupedItems to an array
        const totalPages = Math.ceil(allItems.length / itemsPerPage);

        // Get items for the current page
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = page * itemsPerPage;
        const itemsToDisplay = allItems.slice(startIndex, endIndex);

        // Create cards for each group in the current page
        itemsToDisplay.forEach((itemsInGroup) => {
            const firstItem = itemsInGroup[0]; // Use the first item as a base for the card
            const itemCard = document.createElement('div');
            itemCard.className = 'card';
            itemCard.dataset.category = firstItem.categoria;

            // Add card content
            itemCard.innerHTML = `
                <img 
                    src="${firstItem.imageUrl || 'https://via.placeholder.com/150'}" 
                    alt="${firstItem.nombre}" 
                    class="item-image" 
                    id="item-image-${firstItem.id}" 
                >
                <h3>${firstItem.nombre}</h3>
                <p>Categoría: ${firstItem.categoria}</p>
                <div class="talle-container"></div>
                <p>Color: ${firstItem.color}</p>
                <p class="price" id="precio-${firstItem.id}">Precio: ${firstItem.precio} pesos</p>
                <button class="btn me-interesa-btn" data-item='${JSON.stringify(firstItem)}'>Me interesa</button>

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

        // Update pagination controls
        updatePaginationControls(totalPages, page);
    });
}

function updatePaginationControls(totalPages, currentPage) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Clear existing controls

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = 'pagination-btn';
        if (i === currentPage) pageButton.classList.add('active');

        pageButton.addEventListener('click', () => {
            currentPage = i;
            loadItems(currentPage);
        });

        paginationContainer.appendChild(pageButton);
    }
}


// Function to load items from Firestore and display them
// function loadItems() {
//     getDocs(collection(db, "inventario")).then((querySnapshot) => {
//         const itemList = document.getElementById('item-list');
//         itemList.innerHTML = ''; // Clear existing items

//         // Group items by name (or another attribute) to handle talles
//         const groupedItems = {};
//         querySnapshot.forEach((docSnapshot) => {
//             const itemData = docSnapshot.data();
//             const itemId = docSnapshot.id;

//             const groupKey = itemData.nombre; // Group by 'nombre'
//             if (!groupedItems[groupKey]) {
//                 groupedItems[groupKey] = [];
//             }
//             groupedItems[groupKey].push({ ...itemData, id: itemId });
//         });

//         // Create cards for each group
//         Object.values(groupedItems).forEach((itemsInGroup) => {
//             const firstItem = itemsInGroup[0]; // Use the first item as a base for the card
//             const itemCard = document.createElement('div');
//             itemCard.className = 'card';
//             itemCard.dataset.category = firstItem.categoria;

//             // Add card content
//             itemCard.innerHTML = `
//                 <img 
//                     src="${firstItem.imageUrl || 'https://via.placeholder.com/150'}" 
//                     alt="${firstItem.nombre}" 
//                     class="item-image" 
//                     id="item-image-${firstItem.id}" 
//                 >
//                 <h3>${firstItem.nombre}</h3>
//                 <p>Categoría: ${firstItem.categoria}</p>
//                 <div class="talle-container"></div>
//                 <p>Color: ${firstItem.color}</p>
//                 <p class="price" id="precio-${firstItem.id}">Precio: ${firstItem.precio} pesos</p>
//                 <button class="btn me-interesa-btn" data-item='${JSON.stringify(firstItem)}'>Me interesa</button>


//                 <!-- Modal for Image Enlargement -->
//                 <div class="modal" id="modal-${firstItem.id}">
//                     <span class="close-btn" id="close-modal-${firstItem.id}">&times;</span>
//                     <img class="modal-content" id="modal-image-${firstItem.id}" src="" alt="">
//                 </div>
//             `;

//             // Add talle buttons if there are multiple talles
//             const talleContainer = itemCard.querySelector('.talle-container');
//             if (itemsInGroup.length > 1) {
//                 itemsInGroup.forEach((item) => {
//                     const talleButton = document.createElement('button');
//                     talleButton.textContent = item.talle;
//                     talleButton.className = 'btn talle-btn';
//                     talleButton.dataset.id = item.id;
//                     talleButton.dataset.talle = item.talle;

//                     // Add click event to update details on selection
//                     talleButton.addEventListener('click', function () {
//                         // Update the selected talle button's appearance
//                         itemCard.querySelectorAll('.talle-btn').forEach(btn => {
//                             btn.classList.remove('selected');
//                         });
//                         this.classList.add('selected');

//                         // Update card details with the selected talle
//                         const selectedItem = itemsInGroup.find(i => i.id === item.id);
//                         updateCardWithSelectedTalle(itemCard, selectedItem);
//                     });

//                     talleContainer.appendChild(talleButton);
//                 });
//             } else {
//                 // If only one talle exists, hide the talle container
//                 talleContainer.style.display = 'none';
//             }

//             itemList.appendChild(itemCard);
//         });

//         // Add event listeners for "Me interesa" buttons
//         document.querySelectorAll('.me-interesa-btn').forEach(button => {
//             button.addEventListener('click', (e) => {
//                 const item = JSON.parse(e.target.getAttribute('data-item'));
//                 sendWhatsAppMessage(item);
//             });
//         });
//     });
// }


function updateCardWithSelectedTalle(card, selectedItem) {
    // Show a loading spinner or placeholder
    const imageElement = card.querySelector('.item-image');
    if (!imageElement) {
        console.error("Image element not found in the card.");
        return;
    }

    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    card.insertBefore(spinner, imageElement);

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
            priceElement.textContent = `Precio: ${selectedItem.precio} pesos`;
        } else {
            console.error(`Price element not found for item ID: ${selectedItem.id}`);
            console.log("Card HTML:", card.innerHTML); // Debugging log
        }

        // Update image
        if (imageElement) {
            imageElement.src = selectedItem.imageUrl || 'https://via.placeholder.com/150';
        }

        // Remove the spinner
        spinner.remove();
    }, 500);
}






// Function to send WhatsApp message
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
        `Precio: ${item.precio} pesos`
    );

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

//------------------------------------------------------------------------------------------EDITAR

// Open the edit form with the item’s details
function openEditForm(event) {
    const itemId = event.target.getAttribute('data-id');
    
    // Populate the edit-categoria dropdown dynamically
    populateEditCategories().then(() => {
        // Get the item data from Firestore after populating the categories
        getDoc(doc(db, "inventario", itemId)).then((docSnapshot) => {
            if (docSnapshot.exists()) {
                const itemData = docSnapshot.data();

                // Populate the form fields with data from Firestore
                document.getElementById('edit-id').value = itemId;
                document.getElementById('edit-codCatalogo').value = itemData.codigoCatalogo || '';
                document.getElementById('edit-nombre').value = itemData.nombre || '';
                document.getElementById('edit-marca').value = itemData.marca || '';
                document.getElementById('edit-categoria').value = itemData.categoria || '';
                document.getElementById('edit-cantidad').value = itemData.cantidad || '';
                document.getElementById('edit-precio').value = itemData.precio || '';
                document.getElementById('edit-talle').value = itemData.talle || '';
                document.getElementById('edit-color').value = itemData.color || '';

                // Set the delete button's data-id attribute
                const deleteButton = document.querySelector('.delete-btn');
                deleteButton.setAttribute('data-id', itemId);

                // Attach the delete button listener
                deleteButton.removeEventListener('click', handleDelete); // Avoid duplicate listeners
                deleteButton.addEventListener('click', handleDelete);

                // Show the edit modal
                document.getElementById('edit-item').classList.remove('hidden');
                document.getElementById('edit-overlay').classList.remove('hidden');
            }
        }).catch((error) => {
            console.error("Error fetching document: ", error);
        });
    }).catch((error) => {
        console.error("Error populating categories: ", error);
    });
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

async function loadLatestItems() {
    try {
        // Create a query for the latest 5 items
        const latestItemsQuery = query(
            collection(db, "inventario"),
            orderBy("createdAt", "desc"), // Order by 'createdAt' field in descending order
            limit(5) // Limit to 5 items
        );

        // Fetch the data
        const querySnapshot = await getDocs(latestItemsQuery);

        // Find the Swiper wrapper in the DOM
        const swiperWrapper = document.querySelector('.swiper-wrapper');
        swiperWrapper.innerHTML = ''; // Clear existing slides

        // Process the documents
        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();

            // Create a new Swiper slide
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';

            slide.innerHTML = `
                <img src="${itemData.imageUrl || 'https://via.placeholder.com/150'}" alt="${itemData.nombre}">
                <h4>${itemData.nombre}</h4>
                <p>Precio: ${itemData.precio} pesos</p>
                
                <button class="btn me-interesa-btn" data-item='${JSON.stringify(itemData)}'>Me interesa</button>
            `;

            // Append the slide to the Swiper wrapper
            swiperWrapper.appendChild(slide);
        });

        // Initialize SwiperJS
        new Swiper('.swiper', {
            loop: true,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            slidesPerView: 1,
            spaceBetween: 10,
        });
    } catch (error) {
        console.error("Error loading latest items:", error);
    }

    document.querySelectorAll('.me-interesa-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const item = JSON.parse(e.target.getAttribute('data-item'));
            sendWhatsAppMessage(item);
        });
    });
}

// Call the function after DOM is ready
document.addEventListener('DOMContentLoaded', loadLatestItems);
// Delete handler function to call deleteItem with item ID

//-----------------------------------------------------------------------------------IMPORTAR
export async function importData() {
    const fileInput = document.getElementById('excel-file');
    const file = fileInput.files[0];

    if (!file) {
        alert("Por favor, selecciona un archivo de Excel.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log("Datos importados:", jsonData);

        for (const item of jsonData) {
            // Ensure "Precio unitario" is treated as a string for replacement
            const rawPrice = item["Precio unitario"] || "0"; // Default to "0" if missing or undefined
            const priceString = rawPrice.toString(); // Convert to string in case it's not

            const cleanedItem = {
                idProducto: item["ID Producto"] || null,
                codigoCatalogo: item["Codigo catalogo"] || "",
                nombre: item["Nombre del producto"] || "Sin nombre",
                marca: item["Marca"] || "Sin marca",
                categoria: item["Categoria"] || "Sin categoría",
                talle: item["Talle"] || "Unico",
                color: item["Color"] || "Sin color",
                cantidad: parseInt(item["Cantidad en stock"]) || 0,
                precio: parseFloat(priceString.replace("$", "").trim()) || 0, // Clean and parse price
            };

            // Skip invalid rows
            if (!cleanedItem.nombre || cleanedItem.cantidad === 0) {
                console.warn("Fila ignorada debido a datos inválidos:", item);
                continue;
            }

            try {
                await addDoc(collection(db, "inventario"), cleanedItem);
                console.log("Item agregado:", cleanedItem);
            } catch (error) {
                console.error("Error al agregar ítem a Firestore:", error);
            }
        }

        alert("Datos importados exitosamente.");
        loadItems();
    };

    reader.readAsArrayBuffer(file);
}


// Attach importData to the global window object
window.importData = importData;


// Load items on page load
loadItems();