// Import Firebase SDKs and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { firebaseConfig } from "./config.js";

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

//------------------------------------------------------------------------------------------LOAD CATEGORIES & ITEMS
async function populateEditCategories() {
    try {
        const categorySet = new Set();

        // Fetch all items from Firestore to extract unique categories
        const querySnapshot = await getDocs(collection(db, "inventario"));
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            if (item.categoria) {
                categorySet.add(item.categoria); // Add category to the Set
            }
        });

        // Select the edit-categoria dropdown
        const editCategoriaSelect = document.getElementById("edit-categoria");

        // Clear any existing options
        editCategoriaSelect.innerHTML = "";

        // Add options dynamically
        categorySet.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            editCategoriaSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error populating categories in edit form:", error);
    }
}

// Call this function when the edit modal opens
document.addEventListener("DOMContentLoaded", () => {
    const editOverlay = document.getElementById("edit-overlay");

    // Add an event listener to trigger category population when the overlay is shown
    editOverlay.addEventListener("show", populateEditCategories);
});
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

            // Update the item card to display new fields
            itemCard.innerHTML = `
                <img src="https://via.placeholder.com/150" alt="${itemData.nombre}" class="item-image">
                <h3>${itemData.nombre}</h3>
                <p>CodCatalogo: ${itemData.codigoCatalogo}</p>
                <p>Categoría: ${itemData.categoria}</p>
                <p>Marca: ${itemData.marca}</p>
                <p>Talle: ${itemData.talle}</p>
                <p>Color: ${itemData.color}</p>
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
document.getElementById('form-editar').addEventListener('submit', async function(event) {
    event.preventDefault();

    const itemId = document.getElementById('edit-id').value;
    const updatedData = {
        nombre: document.getElementById('edit-codCatalogo').value,
        nombre: document.getElementById('edit-nombre').value,
        categoria: document.getElementById('edit-categoria').value,
        marca: document.getElementById('edit-marca').value,
        cantidad: parseInt(document.getElementById('edit-cantidad').value),
        precio: parseFloat(document.getElementById('edit-precio').value),
        talle: document.getElementById('edit-talle').value,  // Add talle
        color: document.getElementById('edit-color').value   // Add color
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
//---------------------------------------------------------------------------BORRAR
async function deleteItem(itemId) {
    if (confirm("¿Estás seguro de que deseas eliminar este ítem?")) {
        try {
            await deleteDoc(doc(db, "inventario", itemId));
            alert("Ítem eliminado exitosamente.");
            loadItems(); // Refresh the inventory list after deletion
            document.getElementById('edit-item').classList.add('hidden'); // Hide the modal after deletion
            document.getElementById('edit-overlay').classList.add('hidden'); // Hide the overlay
        } catch (error) {
            console.error("Error al eliminar el ítem: ", error);
            alert("Ocurrió un error al eliminar el ítem.");
        }
    }
}

// Attach the delete button listener
document.querySelector('.delete-btn').addEventListener('click', (event) => {
    const itemId = event.target.getAttribute('data-id');
    deleteItem(itemId);
});

document.getElementById('import-btn').addEventListener('click', importData);

// Delete handler function to call deleteItem with item ID
function handleDelete(event) {
    const itemId = event.target.getAttribute('data-id');
    deleteItem(itemId);
}
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