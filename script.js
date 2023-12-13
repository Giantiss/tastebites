// Execute when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Display the cart items and set up event listeners
    displayCartItems();
    setupEventListeners();
});

// Set up event listeners for buttons
function setupEventListeners() {
    // Get buttons by their IDs
    const checkoutButton = document.getElementById('checkoutButton');
    const backToMenuButton = document.getElementById('backToMenu');

    // Add click event listener to the checkout button
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            // Clear the cart and proceed to checkout
            clearCart();
            proceedToCheckout();
        });
    }

    // Add click event listener to the back to menu button
    if (backToMenuButton) {
        backToMenuButton.addEventListener('click', navigateToMenu);
    }
}

// Proceed to the checkout process
function proceedToCheckout() {
    alert('Proceeding to checkout!');
}

// Navigate to the menu page
function navigateToMenu() {
    window.location.href = 'menu.html';
}

// Clear the cart by removing it from local storage and display updated cart items
function clearCart() {
    localStorage.removeItem('cart');
    displayCartItems();
}

// Add an item to the cart with a given name and price, and update cart display
function addToCart(name, price) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        // If the item already exists in the cart, increase its quantity
        existingItem.quantity += 1;
    } else {
        // If the item is not in the cart, add it with quantity 1
        const newItem = {
            name: name,
            price: price,
            quantity: 1
        };
        cart.push(newItem);
    }

    // Update cart in local storage and refresh display
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
    displayCartItems();
}

// Update the cart icon based on the number of items in the cart
function updateCartIcon() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartIcon = document.getElementById('cart-count');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    // Update the cart icon with the total quantity
    cartIcon.textContent = cartCount.toString();
}

// Remove an item from the cart based on its name and display updated cart items
function removeCartItem(name) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    // Filter out the item to be removed
    cart = cart.filter(item => item.name !== name);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems();
}

// Display cart items in the HTML table
function displayCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartItemsContainer.innerHTML = '';

    // Create table rows for each cart item and display them
    cart.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)}</td>
            <td>${(item.quantity * item.price).toFixed(2)}</td>
            <td><button onclick="removeCartItem('${item.name}')">Remove</button></td>
        `;
        cartItemsContainer.appendChild(row);
    });

    // Update the subtotal
    updateSubtotal();
}

// Update the subtotal based on the items in the cart
function updateSubtotal() {
    const subtotalElement = document.getElementById('subtotal');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    // Calculate the subtotal by summing the product of quantity and price for each item
    const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);
    // Update the subtotal display
    subtotalElement.textContent = subtotal.toFixed(2);
}
