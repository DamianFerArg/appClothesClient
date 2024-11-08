// login.js

// Set your generic username and password here
const VALID_USERNAME = "andrea";
const VALID_PASSWORD = "damaristeamo";

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent page reload on form submission

    // Get entered credentials
    const enteredUsername = document.getElementById('username').value;
    const enteredPassword = document.getElementById('password').value;

    // Check if entered credentials match
    if (enteredUsername === VALID_USERNAME && enteredPassword === VALID_PASSWORD) {
        // Store login state in session storage
        sessionStorage.setItem("isLoggedIn", "true");
        
        // Redirect to the inventory page
        window.location.href = "index.html";
    } else {
        // Display error message if credentials are incorrect
        document.getElementById('login-error').classList.remove('hidden');
    }
});

