/* =====================================================
   ROOTS — Products Page JS
   products.js  — filtering & wishlist toggle
   ===================================================== */

const grid        = document.getElementById('productGrid');
const cards       = Array.from(grid.querySelectorAll('.product-card'));
const noResults   = document.getElementById('noResults');
const applyBtn    = document.getElementById('applyFilters');
const keywordInput = document.getElementById('keywordSearch');
const priceFrom   = document.getElementById('priceFrom');
const priceTo     = document.getElementById('priceTo');

/* ---------- Check for filter parameter in URL ---------- */
function initializeFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    const filterCategory = params.get('filter');
    
    if (filterCategory) {
        // Find and check the corresponding checkbox
        const checkboxes = document.querySelectorAll('.filter-checkbox input');
        checkboxes.forEach(cb => {
            if (cb.value === filterCategory) {
                cb.checked = true;
            }
        });
        
        // Apply filters after setting checkbox
        setTimeout(applyFilters, 0);
    }
}

/* ---------- Run filters ---------- */
function applyFilters() {
    const keyword   = keywordInput.value.trim().toLowerCase();
    const checkedCats = Array.from(
        document.querySelectorAll('.filter-checkbox input:checked')
    ).map(cb => cb.value);
    const from = parseFloat(priceFrom.value) || 0;
    const to   = parseFloat(priceTo.value)   || Infinity;

    let visibleCount = 0;

    cards.forEach(card => {
        const name     = card.querySelector('.product-name').textContent.toLowerCase();
        const category = card.dataset.category;
        const price    = parseFloat(card.dataset.price);

        const matchesKeyword  = keyword === '' || name.includes(keyword);
        const matchesCategory = checkedCats.length === 0 || checkedCats.includes(category);
        const matchesPrice    = price >= from && price <= to;

        if (matchesKeyword && matchesCategory && matchesPrice) {
            card.classList.remove('hidden');
            visibleCount++;
        } else {
            card.classList.add('hidden');
        }
    });

    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
}

/* ---------- Event listeners ---------- */
applyBtn.addEventListener('click', applyFilters);

// Also filter live as user types in keyword box
keywordInput.addEventListener('input', applyFilters);

// Re-run when checkboxes change
document.querySelectorAll('.filter-checkbox input').forEach(cb => {
    cb.addEventListener('change', applyFilters);
});

/* ---------- Wishlist toggle ---------- */
grid.addEventListener('click', function(e) {
    if (e.target.classList.contains('wishlist-btn')) {
        e.target.classList.toggle('active');
        const isActive = e.target.classList.contains('active');
        e.target.title = isActive ? 'Remove from wishlist' : 'Add to wishlist';
    }
});

/* ---------- Scrolling background gradient effect ---------- */
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const progress = scrolled / maxScroll * 100;

    document.body.style.backgroundPosition = `0% ${progress}%`;
});

/* ---------- Add to cart feedback ---------- */
grid.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-cart')) {
        const btn = e.target;
        const original = btn.textContent;
        btn.textContent = '✓ Added!';
        btn.style.backgroundColor = '#015005';
        setTimeout(() => {
            btn.textContent = original;
            btn.style.backgroundColor = '';
        }, 2000);
    }
});

/* =====================================================
   CART & WISHLIST — localStorage
   ===================================================== */

// ── Helpers ──────────────────────────────────────────
function getCart()     { return JSON.parse(localStorage.getItem('cart'))     || []; }
function getWishlist() { return JSON.parse(localStorage.getItem('wishlist')) || []; }
function saveCart(cart)         { localStorage.setItem('cart',     JSON.stringify(cart)); }
function saveWishlist(wishlist) { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }

// ── Add to Cart ───────────────────────────────────────
function addToCart(id, name, price) {
    const cart = getCart();
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    saveCart(cart);
}

// ── Toggle Wishlist ───────────────────────────────────
function toggleWishlist(id, name, price) {
    const wishlist = getWishlist();
    const index = wishlist.findIndex(item => item.id === id);
    if (index === -1) {
        wishlist.push({ id, name, price });
        saveWishlist(wishlist);
        return true;
    } else {
        wishlist.splice(index, 1);
        saveWishlist(wishlist);
        return false;
    }
}

function handleCart(btn) {
    const card  = btn.closest('.product-card');
    const id    = card.dataset.id;
    const name  = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    addToCart(id, name, price);
    btn.textContent = '✓ Added!';
    btn.style.backgroundColor = '#015005';
    setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.style.backgroundColor = '';
    }, 2000);
}

function handleWishlist(btn) {
    const card  = btn.closest('.product-card');
    const id    = card.dataset.id;
    const name  = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    const added = toggleWishlist(id, name, price);
    btn.classList.toggle('active', added);
}

// On page load, highlight already-wishlisted items and initialize URL filters
document.addEventListener('DOMContentLoaded', () => {
    const wishlist = getWishlist();
    document.querySelectorAll('.product-card').forEach(card => {
        const id  = card.dataset.id;
        const btn = card.querySelector('.wishlist-btn');
        if (btn && wishlist.find(item => item.id === id)) {
            btn.classList.add('active');
        }
    });
    
    // Initialize filters from URL parameters
    initializeFiltersFromURL();
});
