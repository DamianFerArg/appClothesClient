import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to load categories dynamically
async function loadCategories() {
    const categoryDropdown = document.getElementById("category-dropdown");

    try {
        const querySnapshot = await getDocs(collection(db, "inventario"));
        const categories = new Set();

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.categoria) {
                categories.add(data.categoria);
            }
        });

        if (categories.size === 0) {
            categoryDropdown.innerHTML = `<option value="">No hay categorías</option>`;
            return;
        }

        // Add default option
        categoryDropdown.innerHTML = `<option value="">Categorías</option>`;

        // Populate dropdown
        categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryDropdown.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// Event listener for category selection
document.getElementById("category-dropdown").addEventListener("change", function () {
    const selectedCategory = this.value;
    if (selectedCategory) {
        window.location.href = `categorias.html?categoria=${encodeURIComponent(selectedCategory)}`;
    }
});

// Load categories when the script runs
loadCategories();
