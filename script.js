// API URLs
const API_BASE_URL = 'https://fakestoreapi.com';
const PRODUCTS_URL = `${API_BASE_URL}/products`;
const CATEGORIES_URL = `${API_BASE_URL}/products/categories`;

// Global variables
let allProducts = [];
let currentProducts = [];

// DOM elements
const productsGrid = document.querySelector('.product-grid');
const categoryButtons = document.querySelectorAll('.btn');
const trendingGrid = document.getElementById('trendingGrid');

// Cart Management System
let cart = [];
const CART_STORAGE_KEY = 'swiftcart_cart';

// Load cart from localStorage on page load
function loadCartFromStorage() {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// Add product to cart
function addProductToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity: 1
        });
    }
    
    saveCartToStorage();
    updateCartCount();
    showToast(`Added "${product.title}" to cart!`, 'success');
}

// Remove product from cart
function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        const removedItem = cart[itemIndex];
        cart.splice(itemIndex, 1);
        saveCartToStorage();
        updateCartCount();
        showToast(`Removed "${removedItem.title}" from cart`, 'info');
        
        // Update cart display if cart modal is open
        if (document.getElementById('cartModal')?.open) {
            displayCartItems();
        }
    }
}

// Update quantity of item in cart
function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCartToStorage();
            updateCartCount();
            
            // Update cart display if cart modal is open
            if (document.getElementById('cartModal')?.open) {
                displayCartItems();
            }
        }
    }
}

// Update cart count in navbar
function updateCartCount() {
    const cartButton = document.querySelector('.btn-ghost.btn-circle');
    const cartIcon = cartButton?.querySelector('i');
    
    if (cartButton && cartIcon) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Remove existing badge
        const existingBadge = cartButton.querySelector('.badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add cart count badge if there are items
        if (totalItems > 0) {
            const badge = document.createElement('div');
            badge.className = 'badge badge-secondary badge-sm absolute -top-2 -right-2 min-w-5 h-5 text-xs';
            badge.textContent = totalItems > 99 ? '99+' : totalItems.toString();
            cartButton.style.position = 'relative';
            cartButton.appendChild(badge);
        }
    }
}

// Calculate cart totals
function calculateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const total = subtotal + tax + shipping;
    
    return {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2)
    };
}

// Create cart modal
function createCartModal() {
    if (document.getElementById('cartModal')) {
        return;
    }

    const cartModalHTML = `
        <dialog id="cartModal" class="modal">
            <div class="modal-box max-w-4xl">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold">Shopping Cart</h3>
                    <form method="dialog">
                        <button class="btn btn-sm btn-circle btn-ghost">✕</button>
                    </form>
                </div>
                
                <div id="cartContent">
                    <!-- Cart items will be inserted here -->
                </div>
                
                <div class="modal-action">
                    <button id="clearCart" class="btn btn-outline btn-error mr-auto">
                        <i class="fa-solid fa-trash mr-2"></i>
                        Clear Cart
                    </button>
                    <form method="dialog">
                        <button class="btn btn-outline">Continue Shopping</button>
                    </form>
                    <button id="checkout" class="btn btn-primary">
                        <i class="fa-solid fa-credit-card mr-2"></i>
                        Checkout
                    </button>
                </div>
            </div>
        </dialog>
    `;

    document.body.insertAdjacentHTML('beforeend', cartModalHTML);
    
    // Add event listeners
    document.getElementById('clearCart').addEventListener('click', clearCart);
    document.getElementById('checkout').addEventListener('click', handleCheckout);
}

// Display cart items in modal
function displayCartItems() {
    const cartContent = document.getElementById('cartContent');
    
    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="text-center py-12">
                <i class="fa-solid fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                <p class="text-xl text-gray-500 mb-4">Your cart is empty</p>
                <p class="text-gray-400">Add some products to get started!</p>
            </div>
        `;
        return;
    }

    const totals = calculateCartTotals();
    
    cartContent.innerHTML = `
        <div class="space-y-4 mb-6">
            ${cart.map(item => `
                <div class="flex items-center gap-4 p-4 border rounded-lg">
                    <img src="${item.image}" alt="${item.title}" class="w-16 h-16 object-contain rounded">
                    <div class="flex-1">
                        <h4 class="font-semibold line-clamp-2">${item.title}</h4>
                        <p class="text-sm text-gray-600">${formatCategoryName(item.category)}</p>
                        <p class="font-bold text-primary">$${item.price}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})" 
                                class="btn btn-sm btn-circle btn-outline">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <span class="w-12 text-center font-semibold">${item.quantity}</span>
                        <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})" 
                                class="btn btn-sm btn-circle btn-outline">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                    <div class="text-right">
                        <p class="font-bold">$${(item.price * item.quantity).toFixed(2)}</p>
                        <button onclick="removeFromCart(${item.id})" 
                                class="btn btn-xs btn-error btn-outline mt-1">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="border-t pt-4">
            <div class="space-y-2 mb-4">
                <div class="flex justify-between">
                    <span>Subtotal:</span>
                    <span>$${totals.subtotal}</span>
                </div>
                <div class="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>$${totals.tax}</span>
                </div>
                <div class="flex justify-between">
                    <span>Shipping:</span>
                    <span>${totals.shipping === '0.00' ? 'FREE' : '$' + totals.shipping}</span>
                </div>
                <div class="flex justify-between text-xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span class="text-primary">$${totals.total}</span>
                </div>
            </div>
        </div>
    `;
}

// Clear entire cart
function clearCart() {
    if (cart.length === 0) return;
    
    const confirmed = confirm('Are you sure you want to clear your cart?');
    if (confirmed) {
        cart = [];
        saveCartToStorage();
        updateCartCount();
        displayCartItems();
        showToast('Cart cleared successfully', 'info');
    }
}

// Handle checkout
function handleCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    const totals = calculateCartTotals();
    showToast(`Checkout total: $${totals.total}`, 'success');
    
    // Here you would typically redirect to a checkout page
    // For now, just show a success message
    setTimeout(() => {
        showToast('Checkout functionality would be implemented here', 'info');
    }, 1500);
}

// Show cart modal
function showCart() {
    createCartModal();
    displayCartItems();
    document.getElementById('cartModal').showModal();
}

// Fetch all products from the API
async function fetchProducts() {
    // Show skeleton loading
    showProductSkeletons(8);
    
    try {
        const response = await fetch(PRODUCTS_URL);
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        allProducts = products;
        currentProducts = products;
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        showErrorWithRetry('Failed to load products. Please try again later.', 'fetchProducts');
    }
}

// Fetch all categories from the API
async function fetchCategories() {
    try {
        const response = await fetch(CATEGORIES_URL);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const categories = await response.json();
        updateCategoryButtons(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// Fetch trending products (top 3 highest rated)
async function fetchTrendingProducts() {
    // Show skeleton loading
    showTrendingSkeletons(3);
    
    try {
        const response = await fetch(PRODUCTS_URL);
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        
        // Sort by rating (highest first) and take top 3
        const trendingProducts = products
            .filter(product => product.rating && product.rating.rate) // Filter products with ratings
            .sort((a, b) => b.rating.rate - a.rating.rate) // Sort by rating descending
            .slice(0, 3); // Take only top 3
        
        // Store trending products for modal access
        currentProducts = trendingProducts;
        displayTrendingProducts(trendingProducts);
    } catch (error) {
        console.error('Error fetching trending products:', error);
        showErrorWithRetry('Failed to load trending products. Please try again later.', 'fetchTrendingProducts');
    }
}

// Display products in the grid
function displayProducts(products) {
    if (!productsGrid) return;
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-gray-500 text-lg">No products found.</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = products.map(product => createProductCard(product)).join('');
}

// Display trending products in the grid
function displayTrendingProducts(products) {
    if (!trendingGrid) return;
    
    if (products.length === 0) {
        trendingGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-gray-500 text-lg">No trending products found.</p>
            </div>
        `;
        return;
    }

    trendingGrid.innerHTML = products.map(product => createTrendingProductCard(product)).join('');
}

// Create a product card HTML
function createProductCard(product) {
    const categoryName = formatCategoryName(product.category);
    const rating = product.rating ? product.rating.rate : 0;
    const ratingCount = product.rating ? product.rating.count : 0;
    
    return `
        <div class="card bg-base-200 shadow-md hover:shadow-xl transition duration-300">
            <figure class="bg-gray-100 p-6">
                <img
                    src="${product.image}"
                    alt="${product.title}"
                    class="h-64 object-contain"
                />
            </figure>

            <div class="card-body">
                <div class="flex justify-between items-center text-sm mb-2">
                    <span class="badge badge-primary badge-outline">
                        ${categoryName}
                    </span>
                    <div class="flex items-center gap-1 text-yellow-500">
                        <i class="fa-solid fa-star text-xs"></i>
                        <span class="text-gray-600">${rating} (${ratingCount})</span>
                    </div>
                </div>

                <h3 class="font-semibold text-lg line-clamp-2" title="${product.title}">
                    ${product.title}
                </h3>

                <p class="font-bold text-xl">$${product.price}</p>

                <div class="flex gap-3 mt-4">
                    <button class="btn btn-outline btn-sm flex-1" onclick="viewProductDetails(${product.id})">
                        <i class="fa-regular fa-eye mr-1"></i> Details
                    </button>
                    <button class="btn btn-primary btn-sm flex-1" onclick="addToCart(${product.id})">
                        <i class="fa-solid fa-cart-plus mr-1"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Create trending product card with trending badge
function createTrendingProductCard(product) {
    const categoryName = formatCategoryName(product.category);
    const rating = product.rating ? product.rating.rate : 0;
    const ratingCount = product.rating ? product.rating.count : 0;
    
    return `
        <div class="card bg-base-200 shadow-md hover:shadow-xl transition duration-300 relative">
            <!-- Trending Badge -->
            <div class="absolute top-4 left-4 z-10">
                <span class="badge badge-secondary text-white font-semibold">
                    <i class="fa-solid fa-fire mr-1"></i>
                    Top Rated
                </span>
            </div>
            
            <figure class="bg-gray-100 p-6">
                <img
                    src="${product.image}"
                    alt="${product.title}"
                    class="h-64 object-contain"
                />
            </figure>

            <div class="card-body">
                <div class="flex justify-between items-center text-sm mb-2">
                    <span class="badge badge-primary badge-outline">
                        ${categoryName}
                    </span>
                    <div class="flex items-center gap-1 text-yellow-500">
                        <i class="fa-solid fa-star text-xs"></i>
                        <span class="text-gray-600">${rating} (${ratingCount})</span>
                    </div>
                </div>

                <h3 class="font-semibold text-lg line-clamp-2" title="${product.title}">
                    ${product.title}
                </h3>

                <p class="font-bold text-xl">$${product.price}</p>

                <div class="flex gap-3 mt-4">
                    <button class="btn btn-outline btn-sm flex-1" onclick="viewProductDetails(${product.id})">
                        <i class="fa-regular fa-eye mr-1"></i> Details
                    </button>
                    <button class="btn btn-primary btn-sm flex-1" onclick="addToCart(${product.id})">
                        <i class="fa-solid fa-cart-plus mr-1"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Format category name for display
function formatCategoryName(category) {
    return category.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Update category buttons with fetched categories
function updateCategoryButtons(categories) {
    const categoryContainer = document.querySelector('.flex.flex-wrap.justify-center.gap-3.mb-10');
    if (!categoryContainer) return;

    const allButton = '<button class="btn btn-sm btn-primary rounded-full" data-category="all">All</button>';
    const categoryButtons = categories.map(category => 
        `<button class="btn btn-sm btn-outline rounded-full" data-category="${category}">${formatCategoryName(category)}</button>`
    ).join('');

    categoryContainer.innerHTML = allButton + categoryButtons;
    
    // Add event listeners to category buttons
    addCategoryEventListeners();
}

// Add event listeners to category buttons
function addCategoryEventListeners() {
    const buttons = document.querySelectorAll('[data-category]');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            
            // Update active button state
            buttons.forEach(btn => {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline');
            });
            e.target.classList.add('btn-primary');
            e.target.classList.remove('btn-outline');
            
            // Filter products
            filterByCategory(category);
        });
    });
}

// Filter products by category
async function filterByCategory(category) {
    // Show loading state
    showLoadingState();
    
    if (category === 'all') {
        currentProducts = allProducts;
        displayProducts(allProducts);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/category/${category}`);
        if (!response.ok) throw new Error('Failed to fetch category products');
        const products = await response.json();
        currentProducts = products;
        displayProducts(products);
    } catch (error) {
        console.error('Error filtering products:', error);
        showError('Failed to filter products. Please try again.');
    }
}

// Show loading state while fetching
function showLoadingState() {
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="col-span-full flex justify-center items-center py-12">
                <div class="loading loading-spinner loading-lg text-primary"></div>
                <span class="ml-3 text-gray-600">Loading products...</span>
            </div>
        `;
    }
}

// Create Product Details Modal dynamically
function createProductDetailsModal() {
    // Check if modal already exists
    if (document.getElementById('productDetailsModal')) {
        return;
    }

    const modalHTML = `
        <dialog id="productDetailsModal" class="modal">
            <div class="modal-box max-w-2xl">
                <h3 class="text-2xl font-bold mb-4" id="modalTitle">Product Details</h3>
                
                <div class="flex flex-col md:flex-row gap-6">
                    <!-- Product Image -->
                    <div class="md:w-1/2">
                        <figure class="bg-gray-100 p-4 rounded-lg">
                            <img id="modalImage" src="" alt="" class="w-full h-64 object-contain">
                        </figure>
                    </div>
                    
                    <!-- Product Info -->
                    <div class="md:w-1/2">
                        <div class="mb-3">
                            <span id="modalCategory" class="badge badge-primary badge-outline"></span>
                        </div>
                        
                        <div class="mb-3 flex items-center gap-2">
                            <div class="flex items-center gap-1 text-yellow-500">
                                <i class="fa-solid fa-star text-sm"></i>
                                <span id="modalRating" class="text-gray-600"></span>
                            </div>
                        </div>
                        
                        <p id="modalPrice" class="text-3xl font-bold text-primary mb-4"></p>
                        
                        <div class="mb-4">
                            <h4 class="font-semibold mb-2">Description:</h4>
                            <p id="modalDescription" class="text-gray-600 leading-relaxed"></p>
                        </div>
                        
                        <button id="modalAddToCart" class="btn btn-primary w-full mb-3">
                            <i class="fa-solid fa-cart-plus mr-2"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
                
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn btn-outline">Close</button>
                    </form>
                </div>
            </div>
        </dialog>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// View product details (using dynamic modal)
function viewProductDetails(productId) {
    // Create modal if it doesn't exist
    createProductDetailsModal();
    
    const product = currentProducts.find(p => p.id === productId);
    if (product) {
        // Update modal content
        document.getElementById('modalTitle').textContent = product.title;
        document.getElementById('modalImage').src = product.image;
        document.getElementById('modalImage').alt = product.title;
        document.getElementById('modalCategory').textContent = formatCategoryName(product.category);
        document.getElementById('modalPrice').textContent = `$${product.price}`;
        document.getElementById('modalDescription').textContent = product.description;
        
        // Update rating
        const rating = product.rating ? product.rating.rate : 0;
        const ratingCount = product.rating ? product.rating.count : 0;
        document.getElementById('modalRating').textContent = `${rating} (${ratingCount} reviews)`;
        
        // Update add to cart button
        const addToCartBtn = document.getElementById('modalAddToCart');
        addToCartBtn.onclick = () => addToCart(product.id);
        
        // Show modal
        document.getElementById('productDetailsModal').showModal();
    }
}

// Show product details for any product (by fetching from API if needed)
async function showProductDetails(productId, productData = null) {
    // Create modal if it doesn't exist
    createProductDetailsModal();
    
    let product = productData;
    
    // If no product data provided, try to find in currentProducts first
    if (!product) {
        product = currentProducts.find(p => p.id === productId);
    }
    
    // If still not found, fetch from API
    if (!product) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`);
            if (response.ok) {
                product = await response.json();
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
            showToast('Failed to load product details', 'error');
            return;
        }
    }
    
    if (product) {
        // Update modal content
        document.getElementById('modalTitle').textContent = product.title;
        document.getElementById('modalImage').src = product.image;
        document.getElementById('modalImage').alt = product.title;
        document.getElementById('modalCategory').textContent = formatCategoryName(product.category);
        document.getElementById('modalPrice').textContent = `$${product.price}`;
        document.getElementById('modalDescription').textContent = product.description;
        
        // Update rating
        const rating = product.rating ? product.rating.rate : 0;
        const ratingCount = product.rating ? product.rating.count : 0;
        document.getElementById('modalRating').textContent = `${rating} (${ratingCount} reviews)`;
        
        // Update add to cart button
        const addToCartBtn = document.getElementById('modalAddToCart');
        addToCartBtn.onclick = () => addToCart(product.id);
        
        // Show modal
        document.getElementById('productDetailsModal').showModal();
    } else {
        showToast('Product not found', 'error');
    }
}

// Add to cart function
function addToCart(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (product) {
        // Add to cart using the cart management system
        addProductToCart(product);
        
        // Close modal if it's open
        const modal = document.getElementById('productDetailsModal');
        if (modal && modal.open) {
            modal.close();
        }
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast toast-top toast-end z-50';
    
    const alertClass = type === 'success' ? 'alert-success' : 
                     type === 'error' ? 'alert-error' : 'alert-info';
    
    toast.innerHTML = `
        <div class="alert ${alertClass}">
            <i class="fa-solid ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

// Show error message
function showError(message) {
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="alert alert-error max-w-md mx-auto">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <span>${message}</span>
                </div>
            </div>
        `;
    }
}

// Show error message for trending section
function showTrendingError(message) {
    if (trendingGrid) {
        trendingGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="alert alert-error max-w-md mx-auto">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <span>${message}</span>
                </div>
            </div>
        `;
    }
}

// Create skeleton loader for products
function createProductSkeleton() {
    return `
        <div class="card bg-base-200 shadow-md animate-pulse">
            <figure class="bg-gray-300 p-6 h-64 flex items-center justify-center">
                <div class="w-32 h-32 bg-gray-400 rounded"></div>
            </figure>
            <div class="card-body">
                <div class="flex justify-between items-center text-sm mb-2">
                    <div class="h-4 bg-gray-300 rounded w-20"></div>
                    <div class="h-4 bg-gray-300 rounded w-16"></div>
                </div>
                <div class="h-6 bg-gray-300 rounded mb-2"></div>
                <div class="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div class="h-8 bg-gray-300 rounded w-20 mb-4"></div>
                <div class="flex gap-3">
                    <div class="h-8 bg-gray-300 rounded flex-1"></div>
                    <div class="h-8 bg-gray-300 rounded flex-1"></div>
                </div>
            </div>
        </div>
    `;
}

// Show skeleton loading for products
function showProductSkeletons(count = 8) {
    if (productsGrid) {
        const skeletons = Array(count).fill(null).map(() => createProductSkeleton()).join('');
        productsGrid.innerHTML = skeletons;
    }
}

// Show skeleton loading for trending products
function showTrendingSkeletons(count = 3) {
    if (trendingGrid) {
        const skeletons = Array(count).fill(null).map(() => createProductSkeleton()).join('');
        trendingGrid.innerHTML = skeletons;
    }
}

// Enhanced error display with retry functionality
function showErrorWithRetry(message, retryFunction) {
    const errorHTML = `
        <div class="col-span-full text-center py-12">
            <div class="max-w-md mx-auto">
                <i class="fa-solid fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
                <div class="alert alert-error mb-4">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <span>${message}</span>
                </div>
                <button onclick="${retryFunction}()" class="btn btn-primary">
                    <i class="fa-solid fa-refresh mr-2"></i>
                    Try Again
                </button>
            </div>
        </div>
    `;
    
    if (productsGrid) {
        productsGrid.innerHTML = errorHTML;
    }
    if (trendingGrid) {
        trendingGrid.innerHTML = errorHTML;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Only run on products page
    if (window.location.pathname.includes('products.html') || (productsGrid && !trendingGrid)) {
        fetchProducts();
        fetchCategories();
    }
    
    // Run trending products on homepage
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || trendingGrid) {
        fetchTrendingProducts();
    }
    
    // Create product details modal
    createProductDetailsModal();
    
    // Load cart from storage and setup cart button
    loadCartFromStorage();
    setupCartButton();
});

// Setup cart button click handler
function setupCartButton() {
    const cartButton = document.querySelector('.btn-ghost.btn-circle');
    if (cartButton) {
        cartButton.addEventListener('click', showCart);
        cartButton.style.cursor = 'pointer';
    }
}