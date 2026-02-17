// API URLs
const API_BASE_URL = 'https://fakestoreapi.com';
const PRODUCTS_URL = `${API_BASE_URL}/products`;
const CATEGORIES_URL = `${API_BASE_URL}/products/categories`;

// Global variables
let allProducts = [];
let currentProducts = [];

// DOM elements
const productsGrid = document.querySelector('.grid');
const categoryButtons = document.querySelectorAll('.btn');

// Fetch all products from the API
async function fetchProducts() {
    try {
        const response = await fetch(PRODUCTS_URL);
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();
        allProducts = products;
        currentProducts = products;
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        showError('Failed to load products. Please try again later.');
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

// View product details (using modal)
function viewProductDetails(productId) {
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

// Add to cart function
function addToCart(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (product) {
        // Show toast notification
        showToast(`Added "${product.title}" to cart!`, 'success');
        
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

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Only run on products page
    if (window.location.pathname.includes('products.html') || productsGrid) {
        fetchProducts();
        fetchCategories();
    }
});