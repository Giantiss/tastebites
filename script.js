document.addEventListener('DOMContentLoaded', () => {
    displayCartItems();
    setupEventListeners();
});

function setupEventListeners() {
    const checkoutButton = document.getElementById('checkoutButton');
    const backToMenuButton = document.getElementById('backToMenu');

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            clearCart();
            proceedToCheckout();
        });
    }

    if (backToMenuButton) {
        backToMenuButton.addEventListener('click', navigateToMenu);
    }
}

function proceedToCheckout() {
    alert('Proceeding to checkout!');
}

function navigateToMenu() {
    window.location.href = 'menu.html';
}

function clearCart() {
    localStorage.removeItem('cart');
    displayCartItems();
}

function addToCart(name, price) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const newItem = {
            name: name,
            price: price,
            quantity: 1
        };
        cart.push(newItem);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
    displayCartItems();
}

function updateCartIcon() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartIcon = document.getElementById('cart-count');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    cartIcon.textContent = cartCount.toString();
}

function removeCartItem(name) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.name !== name);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCartItems();
}

function displayCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartItemsContainer.innerHTML = '';

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

    updateSubtotal();
}

function updateSubtotal() {
    const subtotalElement = document.getElementById('subtotal');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);
    subtotalElement.textContent = subtotal.toFixed(2);
}
