/* =====================================================
   ROOTS — scripts.js
   ===================================================== */

/* -------------------------------------------------------
   SCROLL GRADIENT
------------------------------------------------------- */
window.addEventListener('scroll', () => {
    const scrolled  = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    const progress = (scrolled / maxScroll) * 100;
    document.body.style.backgroundPosition = `0% ${progress}%`;
});

/* -------------------------------------------------------
   LOCALSTORAGE HELPERS — available on every page
------------------------------------------------------- */
function getCart()              { return JSON.parse(localStorage.getItem('cart'))     || []; }
function getWishlist()          { return JSON.parse(localStorage.getItem('wishlist')) || []; }
function saveCart(cart)         { localStorage.setItem('cart',     JSON.stringify(cart)); }
function saveWishlist(wishlist) { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }

function addToCart(id, name, price, qty) {
    qty = qty || 1;
    const cart     = getCart();
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id, name, price, qty });
    }
    saveCart(cart);
}

function toggleWishlist(id, name, price) {
    const wishlist = getWishlist();
    const index    = wishlist.findIndex(item => item.id === id);
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

/* -------------------------------------------------------
   QUANTITY SELECTOR ON PRODUCT CARD
------------------------------------------------------- */
function changeCardQty(btn, delta) {
    const qtyRow     = btn.closest('.qty-control');
    const card       = btn.closest('.product-card');
    const display    = qtyRow.querySelector('.qty-display');
    const subtotalEl = card.querySelector('.qty-subtotal');
    const price      = parseFloat(card.dataset.price);

    let qty = parseInt(display.textContent) + delta;
    if (qty < 1) qty = 1;
    if (qty > 99) qty = 99;

    display.textContent    = qty;
    subtotalEl.textContent = 'R' + (price * qty).toFixed(2);
}

/* -------------------------------------------------------
   CART & WISHLIST HANDLERS
------------------------------------------------------- */
function handleCart(btn) {
    const card  = btn.closest('.product-card');
    const id    = card.dataset.id;
    const name  = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    const qty   = parseInt(card.querySelector('.qty-display').textContent) || 1;

    addToCart(id, name, price, qty);

    const original = btn.textContent;
    btn.textContent = qty > 1 ? `✓ ${qty} Added!` : '✓ Added!';
    btn.style.backgroundColor = '#015005';
    setTimeout(() => {
        btn.textContent = original;
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
    btn.title = added ? 'Remove from wishlist' : 'Add to wishlist';
}

/* -------------------------------------------------------
   PRODUCT PAGE INIT
------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

    const grid = document.getElementById('productGrid');
    if (!grid) return;

    // Highlight already-wishlisted stars
    const wishlist = getWishlist();
    grid.querySelectorAll('.product-card').forEach(card => {
        const btn = card.querySelector('.wishlist-btn');
        if (btn && wishlist.find(item => item.id === card.dataset.id)) {
            btn.classList.add('active');
        }
    });

    // Filter setup
    const applyBtn     = document.getElementById('applyFilters');
    const keywordInput = document.getElementById('keywordSearch');
    const priceFrom    = document.getElementById('priceFrom');
    const priceTo      = document.getElementById('priceTo');
    const noResults    = document.getElementById('noResults');
    const cards        = Array.from(grid.querySelectorAll('.product-card'));

    function applyFilters() {
        const keyword     = keywordInput ? keywordInput.value.trim().toLowerCase() : '';
        const checkedCats = Array.from(
            document.querySelectorAll('.filter-checkbox input:checked')
        ).map(cb => cb.value);
        const from = priceFrom ? (parseFloat(priceFrom.value) || 0)        : 0;
        const to   = priceTo   ? (parseFloat(priceTo.value)   || Infinity) : Infinity;

        let visibleCount = 0;
        cards.forEach(card => {
            const name     = card.querySelector('.product-name').textContent.toLowerCase();
            const category = card.dataset.category;
            const price    = parseFloat(card.dataset.price);

            const show = (keyword === '' || name.includes(keyword))
                      && (checkedCats.length === 0 || checkedCats.includes(category))
                      && (price >= from && price <= to);

            card.classList.toggle('hidden', !show);
            if (show) visibleCount++;
        });

        if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    if (applyBtn)     applyBtn.addEventListener('click', applyFilters);
    if (keywordInput) keywordInput.addEventListener('input', applyFilters);
    document.querySelectorAll('.filter-checkbox input').forEach(cb => {
        cb.addEventListener('change', applyFilters);
    });

    // URL ?filter= param
    const filterCategory = new URLSearchParams(window.location.search).get('filter');
    if (filterCategory) {
        document.querySelectorAll('.filter-checkbox input').forEach(cb => {
            if (cb.value === filterCategory) cb.checked = true;
        });
        applyFilters();
    }
});

/* =====================================================
   ROOTS — checkout.js
   ===================================================== */

const DELIVERY_FEE = 80;
let currentStep    = 1;
let activePayTab   = 'card';
let activeWallet   = 'snapscan';
let orderRef       = '';

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    const cart = getCart();

    if (!cart || cart.length === 0) {
        document.getElementById('checkoutPage').style.display = 'none';
        document.getElementById('emptyState').style.display   = 'flex';
        return;
    }

    orderRef = 'RTX-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    document.getElementById('eftRef').textContent = orderRef;

    renderOrderSummary();
    updateMiniTotals();
    generateQR();
});

/* -------------------------------------------------------
   STEP NAVIGATION
------------------------------------------------------- */
function goToStep(n) {
    document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
    document.getElementById('step' + n).classList.add('active');

    document.querySelectorAll('.progress-step').forEach((s, i) => {
        s.classList.toggle('active',    i + 1 === n);
        s.classList.toggle('completed', i + 1 < n);
    });

    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (n === 4) renderReview();
    if (n === 3) updateMiniTotals();
}

/* -------------------------------------------------------
   RENDER ORDER SUMMARY (step 1)
------------------------------------------------------- */
function renderOrderSummary() {
    const cart      = getCart();
    const container = document.getElementById('orderItems');
    const totalsEl  = document.getElementById('orderTotals');

    let subtotal = 0;
    container.innerHTML = cart.map(item => {
        const line = item.price * item.qty;
        subtotal += line;
        return `
        <div class="order-item">
            <div class="order-item-info">
                <span class="order-item-name">${item.name}</span>
                <span class="order-item-qty">x${item.qty} &nbsp;@&nbsp; R${parseFloat(item.price).toFixed(2)}</span>
            </div>
            <span class="order-item-total">R${line.toFixed(2)}</span>
        </div>`;
    }).join('');

    const isDeliver  = document.querySelector('input[name="fulfilment"]:checked')?.value === 'deliver';
    const delivery   = isDeliver ? DELIVERY_FEE : 0;
    const total      = subtotal + delivery;

    totalsEl.innerHTML = `
        <div class="total-row"><span>Subtotal</span><span>R${subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>Delivery</span><span>${delivery === 0 ? '<em>Free</em>' : 'R' + delivery.toFixed(2)}</span></div>
        <div class="total-row grand"><span>Total</span><span>R${total.toFixed(2)}</span></div>`;
}

/* -------------------------------------------------------
   MINI TOTAL (steps 2 & 3)
------------------------------------------------------- */
function updateMiniTotals() {
    const cart      = getCart();
    const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const isDeliver = document.querySelector('input[name="fulfilment"]:checked')?.value === 'deliver';
    const delivery  = isDeliver ? DELIVERY_FEE : 0;
    const total     = subtotal + delivery;

    const html = `
        <div class="mini-total-row"><span>Subtotal</span><span>R${subtotal.toFixed(2)}</span></div>
        <div class="mini-total-row"><span>Delivery</span><span>${delivery === 0 ? 'Free' : 'R' + delivery.toFixed(2)}</span></div>
        <div class="mini-total-row grand"><span>Order Total</span><span>R${total.toFixed(2)}</span></div>`;

    const d = document.getElementById('deliveryMiniTotal');
    const p = document.getElementById('paymentMiniTotal');
    if (d) d.innerHTML = html;
    if (p) p.innerHTML = html;
}

/* -------------------------------------------------------
   FULFILMENT TOGGLE
------------------------------------------------------- */
function switchFulfilment() {
    const isDeliver = document.getElementById('opt-deliver').checked;

    document.getElementById('deliveryForm').style.display = isDeliver ? 'block' : 'none';
    document.getElementById('collectInfo').style.display  = isDeliver ? 'none'  : 'block';

    document.getElementById('label-collect').classList.toggle('selected', !isDeliver);
    document.getElementById('label-deliver').classList.toggle('selected',  isDeliver);

    updateMiniTotals();
    renderOrderSummary();
}

// Set initial selected state
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('label-collect').classList.add('selected');
});

/* -------------------------------------------------------
   VALIDATION HELPERS
------------------------------------------------------- */
function setError(id, msg) {
    const el  = document.getElementById(id);
    const err = el.parentElement.querySelector('.field-error');
    el.classList.add('input-error');
    if (err) { err.textContent = msg; return; }
    const span = document.createElement('span');
    span.className   = 'field-error';
    span.textContent = msg;
    el.parentElement.appendChild(span);
}

function clearError(id) {
    const el  = document.getElementById(id);
    const err = el.parentElement.querySelector('.field-error');
    el.classList.remove('input-error');
    if (err) err.remove();
}

function clearAll(ids) { ids.forEach(clearError); }

function isEmpty(id) { return !document.getElementById(id).value.trim(); }

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function isValidPhone(v) { return /^[\d\s+()-]{7,15}$/.test(v.trim()); }

/* -------------------------------------------------------
   VALIDATE STEP 2 — DELIVERY
------------------------------------------------------- */
function validateDelivery() {
    const ids = ['firstName','lastName','email','phone'];
    clearAll(ids);
    let ok = true;

    if (isEmpty('firstName')) { setError('firstName', 'First name is required'); ok = false; }
    if (isEmpty('lastName'))  { setError('lastName',  'Last name is required');  ok = false; }

    const email = document.getElementById('email').value.trim();
    if (!email) { setError('email', 'Email is required'); ok = false; }
    else if (!isValidEmail(email)) { setError('email', 'Enter a valid email address'); ok = false; }

    const phone = document.getElementById('phone').value.trim();
    if (!phone) { setError('phone', 'Phone number is required'); ok = false; }
    else if (!isValidPhone(phone)) { setError('phone', 'Enter a valid phone number'); ok = false; }

    if (document.getElementById('opt-deliver').checked) {
        const dIds = ['street','suburb','city','province','postalCode'];
        clearAll(dIds);

        if (isEmpty('street'))     { setError('street',     'Street address is required'); ok = false; }
        if (isEmpty('suburb'))     { setError('suburb',     'Suburb is required');          ok = false; }
        if (isEmpty('city'))       { setError('city',       'City is required');            ok = false; }
        if (!document.getElementById('province').value) { setError('province', 'Select a province'); ok = false; }

        const pc = document.getElementById('postalCode').value.trim();
        if (!pc) { setError('postalCode', 'Postal code is required'); ok = false; }
        else if (!/^\d{4}$/.test(pc)) { setError('postalCode', 'Enter a 4-digit postal code'); ok = false; }
    }

    if (ok) goToStep(3);
}

/* -------------------------------------------------------
   PAYMENT TAB SWITCH
------------------------------------------------------- */
function switchPayTab(tab, btn) {
    activePayTab = tab;
    document.querySelectorAll('.pay-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.pay-panel').forEach(p => p.style.display = 'none');
    document.getElementById('pay-' + tab).style.display = 'block';
}

/* -------------------------------------------------------
   CARD NUMBER / EXPIRY FORMATTING
------------------------------------------------------- */
function formatCardNumber(input) {
    let v = input.value.replace(/\D/g, '').substr(0, 16);
    input.value = v.replace(/(.{4})/g, '$1 ').trim();
    const display = v.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
    document.getElementById('cardNumDisplay').textContent = display;
}

function formatExpiry(input) {
    let v = input.value.replace(/\D/g, '').substr(0, 4);
    if (v.length >= 2) v = v.substr(0, 2) + '/' + v.substr(2);
    input.value = v;
    document.getElementById('cardExpDisplay').textContent = v || 'MM/YY';
}

/* -------------------------------------------------------
   WALLET SELECTOR
------------------------------------------------------- */
function selectWallet(el, name) {
    activeWallet = name;
    document.querySelectorAll('.wallet-option').forEach(w => w.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('qrLabel').textContent = 'Scan with ' +
        name.charAt(0).toUpperCase() + name.slice(1) + ' to pay';
}

/* -------------------------------------------------------
   FAKE QR CODE GENERATOR
------------------------------------------------------- */
function generateQR() {
    const grid = document.getElementById('qrGrid');
    if (!grid) return;
    let html = '';
    for (let i = 0; i < 100; i++) {
        html += `<div class="qr-cell ${Math.random() > 0.5 ? 'filled' : ''}"></div>`;
    }
    grid.innerHTML = html;
    // Corner markers
    [0, 9, 90].forEach(idx => {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const cell = grid.children[idx + r * 10 + c];
                if (cell) cell.classList.add('filled', 'marker');
            }
        }
    });
}

/* -------------------------------------------------------
   VALIDATE STEP 3 — PAYMENT
------------------------------------------------------- */
function validatePayment() {
    if (activePayTab === 'card') {
        const ids = ['cardName','cardNumber','cardExpiry','cardCVV'];
        clearAll(ids);
        let ok = true;

        if (isEmpty('cardName'))   { setError('cardName',   'Name on card is required'); ok = false; }

        const num = document.getElementById('cardNumber').value.replace(/\s/g, '');
        if (!num)        { setError('cardNumber', 'Card number is required'); ok = false; }
        else if (num.length !== 16) { setError('cardNumber', 'Enter a valid 16-digit card number'); ok = false; }

        const exp = document.getElementById('cardExpiry').value;
        if (!exp) { setError('cardExpiry', 'Expiry date is required'); ok = false; }
        else {
            const [mm, yy] = exp.split('/');
            const now = new Date();
            const expDate = new Date(2000 + parseInt(yy), parseInt(mm) - 1);
            if (!mm || !yy || expDate < now) { setError('cardExpiry', 'Card has expired or date is invalid'); ok = false; }
        }

        const cvv = document.getElementById('cardCVV').value;
        if (!cvv) { setError('cardCVV', 'CVV is required'); ok = false; }
        else if (!/^\d{3,4}$/.test(cvv)) { setError('cardCVV', 'Enter a valid 3 or 4-digit CVV'); ok = false; }

        if (!ok) return;
    }

    if (activePayTab === 'eft' || activePayTab === 'wallet') {
        goToStep(4);
        return;
    }

    goToStep(4);
}

/* -------------------------------------------------------
   RENDER REVIEW (step 4)
------------------------------------------------------- */
function renderReview() {
    const cart      = getCart();
    const isDeliver = document.getElementById('opt-deliver').checked;
    const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const delivery  = isDeliver ? DELIVERY_FEE : 0;
    const total     = subtotal + delivery;

    // Items
    document.getElementById('reviewItems').innerHTML =
        cart.map(i => `
        <div class="review-line">
            <span>${i.name} x${i.qty}</span>
            <span>R${(i.price * i.qty).toFixed(2)}</span>
        </div>`).join('');

    // Delivery
    let deliveryHTML = '';
    if (isDeliver) {
        deliveryHTML = `
            <div class="review-line"><span>Method</span><span>Home Delivery (+R${DELIVERY_FEE})</span></div>
            <div class="review-line"><span>${document.getElementById('street').value}</span></div>
            <div class="review-line"><span>${document.getElementById('suburb').value}, ${document.getElementById('city').value}</span></div>
            <div class="review-line"><span>${document.getElementById('province').value}, ${document.getElementById('postalCode').value}</span></div>`;
    } else {
        deliveryHTML = `
            <div class="review-line"><span>Method</span><span>Collection (Free)</span></div>
            <div class="review-line"><span>12 Harvest Road, Khayelitsha, CT</span></div>`;
    }
    deliveryHTML += `
        <div class="review-line"><span>Contact</span><span>${document.getElementById('firstName').value} ${document.getElementById('lastName').value}</span></div>
        <div class="review-line"><span>Email</span><span>${document.getElementById('email').value}</span></div>`;
    document.getElementById('reviewDelivery').innerHTML = deliveryHTML;

    // Payment
    let payHTML = '';
    if (activePayTab === 'card') {
        const num = document.getElementById('cardNumber').value;
        const last4 = num.replace(/\s/g, '').substr(-4);
        payHTML = `
            <div class="review-line"><span>Method</span><span>Credit / Debit Card</span></div>
            <div class="review-line"><span>Card</span><span>•••• •••• •••• ${last4}</span></div>
            <div class="review-line"><span>Name</span><span>${document.getElementById('cardName').value}</span></div>`;
    } else if (activePayTab === 'eft') {
        payHTML = `<div class="review-line"><span>Method</span><span>EFT / Bank Transfer</span></div>
                   <div class="review-line"><span>Ref</span><span>${orderRef}</span></div>`;
    } else {
        payHTML = `<div class="review-line"><span>Method</span><span>${activeWallet.charAt(0).toUpperCase() + activeWallet.slice(1)}</span></div>`;
    }
    document.getElementById('reviewPayment').innerHTML = payHTML;

    // Final total
    document.getElementById('finalTotal').innerHTML = `
        <div class="total-row"><span>Subtotal</span><span>R${subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>Delivery</span><span>${delivery === 0 ? '<em>Free</em>' : 'R' + delivery.toFixed(2)}</span></div>
        <div class="total-row grand"><span>Total to Pay</span><span>R${total.toFixed(2)}</span></div>`;
}

/* -------------------------------------------------------
   PLACE ORDER
------------------------------------------------------- */
function placeOrder() {
    if (!document.getElementById('termsCheck').checked) {
        const err = document.querySelector('.terms-error');
        if (!err) {
            const span = document.createElement('span');
            span.className   = 'terms-error field-error';
            span.textContent = 'Please accept the terms and conditions';
            document.querySelector('.terms-check').after(span);
        }
        return;
    }

    const btn = document.getElementById('placeOrderBtn');
    btn.textContent = 'Processing...';
    btn.disabled    = true;

    // Simulate payment processing delay
    setTimeout(() => {
        const isDeliver = document.getElementById('opt-deliver').checked;
        document.getElementById('popupEmail').textContent  = document.getElementById('email').value;
        document.getElementById('popupRef').textContent    = orderRef;
        document.getElementById('popupMethod').textContent = isDeliver
            ? 'delivery (2–4 business days)'
            : 'collection at Roots Distribution Centre';

        document.getElementById('successPopup').classList.add('visible');
        saveCart([]);
    }, 1800);
}

function finishOrder() {
    window.location.href = 'index.html';
}

const PRODUCTS = {
    1: {
        id:          '1',
        name:        'Spinach Bundle',
        category:    'Vegetables',
        price:       45,
        priceUnit:   'per bundle',
        stock:       'In Stock',
        image:       '../media/spinach.jpg',
        badge:       'Vegetables',
        chips: [
            { label: 'Weight',  value: '±500g' },
            { label: 'Pack',    value: '1 bundle' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: 'Khayelitsha, CT' },
        ],
        farmer: {
            name:        '[Farmer / Collective Name]',
            collective:  '[Collective Name]',
            location:    'Khayelitsha, Cape Town',
            note:        '[One sentence about the farmer or collective — how long they have been farming, what makes their produce special, etc.]',
        },
        description: `
            <p>[Replace with a detailed description of this product. What variety is it? How is it grown? What does it taste like? Any preparation tips?]</p>
            <p>[Add a second paragraph about storage, shelf life, or how best to use this product in cooking.]</p>
            <p>[Optional: mention the farming method, any certifications, or what season it is harvested in.]</p>
        `,
        nutrition: [
            { label: 'Energy',       value: '[000 kcal / 100g]' },
            { label: 'Protein',      value: '[0.0g]' },
            { label: 'Carbohydrates',value: '[0.0g]' },
            { label: 'of which sugars', value: '[0.0g]' },
            { label: 'Fat',          value: '[0.0g]' },
            { label: 'Fibre',        value: '[0.0g]' },
            { label: 'Sodium',       value: '[0.0mg]' },
        ],
        reviews: [
            { author: '[Customer Name]', rating: 5, date: '[Month Year]', body: '[Replace with a real customer review of this product.]' },
            { author: '[Customer Name]', rating: 4, date: '[Month Year]', body: '[Replace with a real customer review of this product.]' },
        ],
    },
 
    2: {
        id:          '2',
        name:        'Tomatoes (1kg)',
        category:    'Vegetables',
        price:       30,
        priceUnit:   'per kg',
        stock:       'In Stock',
        image:       '../media/tomatoes.jpg',
        badge:       'Vegetables',
        chips: [
            { label: 'Weight',  value: '1kg' },
            { label: 'Variety', value: '[e.g. Roma / Cherry]' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: '[Township, City]' },
        ],
        farmer: {
            name:        '[Farmer / Collective Name]',
            collective:  '[Collective Name]',
            location:    '[Township, Cape Town]',
            note:        '[One sentence about the farmer or collective.]',
        },
        description: `
            <p>[Replace with a detailed description of these tomatoes. What variety? How are they best used — salads, sauces, grilling?]</p>
            <p>[Storage tip: keep at room temperature until ripe, then refrigerate. Use within X days of purchase.]</p>
        `,
        nutrition: [
            { label: 'Energy',        value: '[000 kcal / 100g]' },
            { label: 'Protein',       value: '[0.0g]' },
            { label: 'Carbohydrates', value: '[0.0g]' },
            { label: 'of which sugars', value: '[0.0g]' },
            { label: 'Fat',           value: '[0.0g]' },
            { label: 'Fibre',         value: '[0.0g]' },
            { label: 'Sodium',        value: '[0.0mg]' },
        ],
        reviews: [
            { author: '[Customer Name]', rating: 5, date: '[Month Year]', body: '[Replace with a real customer review.]' },
        ],
    },
 
    3: {
        id:          '3',
        name:        'Mixed Citrus Box',
        category:    'Fruits',
        price:       60,
        priceUnit:   'per box',
        stock:       'In Stock',
        image:       '../media/citrus.jpg',
        badge:       'Fruits',
        chips: [
            { label: 'Weight',   value: '±2kg' },
            { label: 'Contents', value: '[e.g. Oranges, Lemons, Naartjies]' },
            { label: 'Method',   value: 'Naturally grown' },
            { label: 'Origin',   value: '[Township, City]' },
        ],
        farmer: {
            name:        '[Farmer / Collective Name]',
            collective:  '[Collective Name]',
            location:    '[Township, City]',
            note:        '[One sentence about the farmer or collective.]',
        },
        description: `
            <p>[Replace with a description of what fruits are included in this box, the flavour profile, and best uses — juicing, eating fresh, cooking, etc.]</p>
            <p>[Add storage and shelf-life information.]</p>
        `,
        nutrition: [
            { label: 'Energy',        value: '[000 kcal / 100g]' },
            { label: 'Protein',       value: '[0.0g]' },
            { label: 'Carbohydrates', value: '[0.0g]' },
            { label: 'of which sugars', value: '[0.0g]' },
            { label: 'Fat',           value: '[0.0g]' },
            { label: 'Fibre',         value: '[0.0g]' },
            { label: 'Vitamin C',     value: '[000mg]' },
        ],
        reviews: [
            { author: '[Customer Name]', rating: 5, date: '[Month Year]', body: '[Replace with a real customer review.]' },
            { author: '[Customer Name]', rating: 4, date: '[Month Year]', body: '[Replace with a real customer review.]' },
        ],
    },
 
    4: {
        id:          '4',
        name:        'Maize Meal (2kg)',
        category:    'Grains',
        price:       55,
        priceUnit:   'per 2kg bag',
        stock:       'In Stock',
        image:       '../media/maize.jpg',
        badge:       'Grains',
        chips: [
            { label: 'Weight',  value: '2kg' },
            { label: 'Grade',   value: '[e.g. Super / Special / Fine]' },
            { label: 'Method',  value: 'Community-milled' },
            { label: 'Origin',  value: '[Township, City]' },
        ],
        farmer: {
            name:        '[Farmer / Collective Name]',
            collective:  '[Collective Name]',
            location:    '[Township, City]',
            note:        '[One sentence about the farming or milling collective.]',
        },
        description: `
            <p>[Replace with a description of this maize meal — the grade, texture (fine/coarse), and typical uses like pap, porridge, or baking.]</p>
            <p>[Storage: store in a cool, dry place. Best used within X months of purchase.]</p>
        `,
        nutrition: [
            { label: 'Energy',        value: '[000 kcal / 100g]' },
            { label: 'Protein',       value: '[0.0g]' },
            { label: 'Carbohydrates', value: '[0.0g]' },
            { label: 'of which sugars', value: '[0.0g]' },
            { label: 'Fat',           value: '[0.0g]' },
            { label: 'Fibre',         value: '[0.0g]' },
            { label: 'Iron',          value: '[0.0mg]' },
        ],
        reviews: [
            { author: '[Customer Name]', rating: 5, date: '[Month Year]', body: '[Replace with a real customer review.]' },
        ],
    },
 
    5: {
        id:          '5',
        name:        'Butternut Squash',
        category:    'Vegetables',
        price:       25,
        priceUnit:   'per unit',
        stock:       'In Stock',
        image:       '../media/butternut.jpg',
        badge:       'Vegetables',
        chips: [
            { label: 'Weight',  value: '±800g–1.2kg' },
            { label: 'Pack',    value: '1 whole squash' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: '[Township, City]' },
        ],
        farmer: {
            name:        '[Farmer / Collective Name]',
            collective:  '[Collective Name]',
            location:    '[Township, City]',
            note:        '[One sentence about the farmer or collective.]',
        },
        description: `
            <p>[Replace with a description of this butternut — sweetness, texture, best cooking methods (roasting, soup, grilling).]</p>
            <p>[Storage: keep uncut butternuts in a cool dark place for up to X weeks. Once cut, refrigerate and use within X days.]</p>
        `,
        nutrition: [
            { label: 'Energy',        value: '[000 kcal / 100g]' },
            { label: 'Protein',       value: '[0.0g]' },
            { label: 'Carbohydrates', value: '[0.0g]' },
            { label: 'of which sugars', value: '[0.0g]' },
            { label: 'Fat',           value: '[0.0g]' },
            { label: 'Fibre',         value: '[0.0g]' },
            { label: 'Vitamin A',     value: '[000mcg]' },
        ],
        reviews: [
            { author: '[Customer Name]', rating: 5, date: '[Month Year]', body: '[Replace with a real customer review.]' },
            { author: '[Customer Name]', rating: 5, date: '[Month Year]', body: '[Replace with a real customer review.]' },
        ],
    },
 
    6: {
        id:          '6',
        name:        'Seed Pack — Greens',
        category:    'Seeds',
        price:       35,
        priceUnit:   'per pack',
        stock:       'In Stock',
        image:       '../media/seeds.jpg',
        badge:       'Seeds',
        chips: [
            { label: 'Contents', value: '[e.g. Spinach, Kale, Swiss Chard]' },
            { label: 'Seeds',    value: '[Approx. 000 seeds]' },
            { label: 'Season',   value: '[e.g. All year / Spring–Autumn]' },
            { label: 'Origin',   value: '[Supplier / Township]' },
        ],
        farmer: {
            name:        '[Supplier / Collective Name]',
            collective:  '[Collective Name]',
            location:    '[City]',
            note:        '[One sentence about where these seeds come from and how they were selected.]',
        },
        description: `
            <p>[Replace with a description of what seeds are included, germination rates, and what conditions they grow best in.]</p>
            <p>[Planting instructions: sow at X cm depth, water X times per week, harvest in X–X weeks. Suitable for container and ground planting.]</p>
        `,
        nutrition: [
            { label: 'Seed varieties',  value: '[List varieties]' },
            { label: 'Approx. count',   value: '[000 seeds]' },
            { label: 'Germination rate', value: '[00%+]' },
            { label: 'Sow depth',       value: '[0–0cm]' },
            { label: 'Days to harvest', value: '[00–00 days]' },
            { label: 'Suitable for',    value: 'Container &amp; ground' },
            { label: 'Best season',     value: '[Season]' },
        ],
        reviews: [
            { author: '[Customer Name]', rating: 5, date: '[Month Year]', body: '[Replace with a real customer review.]' },
        ],
    },
};
 
/* -------------------------------------------------------
   PAGE STATE
------------------------------------------------------- */
let currentProduct = null;
let currentQty     = 1;
 
/* -------------------------------------------------------
   INIT
------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    const id      = new URLSearchParams(window.location.search).get('id');
    const product = PRODUCTS[id];
 
    if (!product) {
        document.getElementById('notFound').style.display  = 'flex';
        document.getElementById('detailPage').style.display = 'none';
        return;
    }
 
    currentProduct = product;
    document.title = product.name + ' — Roots';
    document.getElementById('detailPage').style.display = 'block';
 
    renderBreadcrumb(product);
    renderHero(product);
    renderChips(product);
    renderFarmerCard(product);
    renderTabs(product);
    renderRelated(product);
    updateLineTotal();
    syncWishlistStar();
});
 
/* -------------------------------------------------------
   BREADCRUMB
------------------------------------------------------- */
function renderBreadcrumb(p) {
    document.getElementById('breadcrumb').innerHTML = `
        <a href="index.html">Home</a>
        <span class="bc-sep">›</span>
        <a href="produce_products.html">Products</a>
        <span class="bc-sep">›</span>
        <a href="produce_products.html?filter=${p.category.toLowerCase()}">${p.category}</a>
        <span class="bc-sep">›</span>
        <span class="bc-current">${p.name}</span>`;
}
 
/* -------------------------------------------------------
   HERO (image + info)
------------------------------------------------------- */
function renderHero(p) {
    document.getElementById('detailMainImg').src  = p.image;
    document.getElementById('detailMainImg').alt  = p.name;
    document.getElementById('detailName').textContent     = p.name;
    document.getElementById('detailBadge').textContent    = p.badge;
    document.getElementById('detailCategory').textContent = p.category;
    document.getElementById('detailPrice').textContent    = 'R' + p.price.toFixed(2);
    document.getElementById('detailPriceUnit').textContent = p.priceUnit;
    document.getElementById('detailDescription').innerHTML = p.description;
 
    const stockEl = document.getElementById('detailStock');
    stockEl.textContent = p.stock;
    stockEl.className   = 'detail-stock ' + (p.stock === 'In Stock' ? 'in-stock' : 'out-stock');
 
    // Thumbnail strip — only shows if product has an `images` array
    const thumbsEl = document.getElementById('detailThumbs');
    if (p.images && p.images.length > 1) {
        thumbsEl.innerHTML = p.images.map((src, i) => `
            <img src="${src}" alt="${p.name} image ${i+1}" class="detail-thumb ${i === 0 ? 'active' : ''}"
                onclick="switchMainImage(this, '${src}')">`
        ).join('');
    }
}
 
function switchMainImage(thumb, src) {
    document.getElementById('detailMainImg').src = src;
    document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}
 
/* -------------------------------------------------------
   CHIPS
------------------------------------------------------- */
function renderChips(p) {
    document.getElementById('detailChips').innerHTML =
        p.chips.map(c => `
        <div class="detail-chip">
            <div class="chip-text">
                <span class="chip-label">${c.label}</span>
                <span class="chip-value">${c.value}</span>
            </div>
        </div>`).join('');
}
 
/* -------------------------------------------------------
   FARMER CARD
------------------------------------------------------- */
function renderFarmerCard(p) {
    document.getElementById('detailFarmerCard').innerHTML = `
        <div class="farmer-info">
            <span class="farmer-label">Grown by</span>
            <span class="farmer-name">${p.farmer.name}</span>
            <span class="farmer-collective">${p.farmer.collective} &middot; ${p.farmer.location}</span>
            <p class="farmer-note">${p.farmer.note}</p>
        </div>`;
}
 
/* -------------------------------------------------------
   QUANTITY
------------------------------------------------------- */
function detailChangeQty(delta) {
    currentQty = Math.max(1, Math.min(99, currentQty + delta));
    document.getElementById('detailQtyDisplay').textContent = currentQty;
    updateLineTotal();
}
 
function updateLineTotal() {
    if (!currentProduct) return;
    document.getElementById('detailLineTotal').textContent =
        'R' + (currentProduct.price * currentQty).toFixed(2);
}
 
/* -------------------------------------------------------
   WISHLIST
------------------------------------------------------- */
function syncWishlistStar() {
    const btn = document.getElementById('detailWishlistBtn');
    const wl  = getWishlist();
    const active = wl.some(i => i.id === currentProduct.id);
    btn.classList.toggle('active', active);
}
 
function detailToggleWishlist() {
    const p = currentProduct;
    toggleWishlist(p.id, p.name, p.price);
    syncWishlistStar();
}
 
/* -------------------------------------------------------
   ADD TO CART
------------------------------------------------------- */
function detailAddToCart() {
    const p   = currentProduct;
    const btn = document.getElementById('detailCartBtn');
    addToCart(p.id, p.name, p.price, currentQty);
    btn.textContent = currentQty > 1 ? `✓ ${currentQty} Added!` : '✓ Added!';
    btn.style.backgroundColor = '#015005';
    setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.style.backgroundColor = '';
    }, 2000);
}
 
/* -------------------------------------------------------
   TABS
------------------------------------------------------- */
function renderTabs(p) {
    // Description
    document.getElementById('tab-description').innerHTML = `
        <div class="tab-content-body">${p.description}</div>`;
 
    // Nutrition / Details
    document.getElementById('tab-nutrition').innerHTML = `
        <div class="nutrition-table">
            ${p.nutrition.map(row => `
            <div class="nutrition-row">
                <span class="nutrition-label">${row.label}</span>
                <span class="nutrition-value">${row.value}</span>
            </div>`).join('')}
        </div>`;
 
    // Reviews
    const avgRating = p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length;
    document.getElementById('tab-reviews').innerHTML = `
        <div class="reviews-header">
            <div class="reviews-avg">
                <span class="avg-number">${avgRating.toFixed(1)}</span>
                <div class="avg-stars">${renderStars(avgRating)}</div>
                <span class="avg-count">${p.reviews.length} review${p.reviews.length !== 1 ? 's' : ''}</span>
            </div>
        </div>
        <div class="reviews-list">
            ${p.reviews.map(r => `
            <div class="review-card">
                <div class="review-top">
                    <span class="review-author">${r.author}</span>
                    <span class="review-stars">${renderStars(r.rating)}</span>
                    <span class="review-date">${r.date}</span>
                </div>
                <p class="review-body">${r.body}</p>
            </div>`).join('')}
        </div>`;
}
 
function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) =>
        `<span class="${i < Math.round(rating) ? 'star filled' : 'star'}">★</span>`
    ).join('');
}
 
function switchDetailTab(name, btn) {
    document.querySelectorAll('.detail-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.detail-tab-panel').forEach(p => p.style.display = 'none');
    btn.classList.add('active');
    document.getElementById('tab-' + name).style.display = 'block';
}
 
/* -------------------------------------------------------
   RELATED PRODUCTS
------------------------------------------------------- */
function renderRelated(p) {
    const related = Object.values(PRODUCTS)
        .filter(prod => prod.id !== p.id && prod.category === p.category)
        .slice(0, 4);
 
    // If not enough in same category, fill from others
    if (related.length < 3) {
        const others = Object.values(PRODUCTS)
            .filter(prod => prod.id !== p.id && prod.category !== p.category)
            .slice(0, 4 - related.length);
        related.push(...others);
    }
 
    document.getElementById('relatedGrid').innerHTML = related.map(prod => `
        <div class="related-card">
            <a href="product_detail.html?id=${prod.id}" class="related-img-link">
                <div class="related-img-wrap">
                    <img src="${prod.image}" alt="${prod.name}" class="related-img">
                    <span class="product-badge">${prod.badge}</span>
                </div>
            </a>
            <div class="related-body">
                <span class="related-name">${prod.name}</span>
                <span class="related-price">R${prod.price.toFixed(2)}</span>
            </div>
            <div class="related-actions">
                <a href="product_detail.html?id=${prod.id}" class="btn btn-info related-btn">View</a>
                <button class="btn btn-cart related-btn"
                    onclick="addToCart('${prod.id}','${prod.name}',${prod.price},1); this.textContent='✓'; setTimeout(()=>this.textContent='Add',1800)">
                    Add
                </button>
            </div>
        </div>`).join('');
}

/* =====================================================
   LOW DATA MODE
   Persists via localStorage across all pages.
   Injects the toggle button into every page automatically.
   ===================================================== */
 
(function () {
    const LD_KEY = 'roots-low-data';
 
    /* --- Apply saved preference immediately (before paint) --- */
    if (localStorage.getItem(LD_KEY) === 'on') {
        document.body.classList.add('low-data');
    }
 
    /* --- Inject the floating toggle button --- */
    function injectToggle() {
        const btn = document.createElement('div');
        btn.className   = 'low-data-toggle';
        btn.title       = 'Toggle Low Data Mode';
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-pressed', isOn() ? 'true' : 'false');
        btn.innerHTML = `
            <span class="low-data-toggle-label">Low Data</span>
            <div class="low-data-switch"></div>`;
        btn.addEventListener('click', toggleLowData);
        document.body.appendChild(btn);
    }
 
    /* --- Inject image placeholders next to every <img> --- */
    function injectPlaceholders() {
        document.querySelectorAll('img').forEach(img => {
            if (img.dataset.ldDone) return;
            img.dataset.ldDone = 'true';
 
            const ph = document.createElement('div');
            ph.className = 'image-placeholder-ld';
            ph.textContent = img.alt || 'Image';
 
            /* Mirror the img's size constraints where possible */
            if (img.classList.contains('image')) {
                ph.style.maxWidth  = '880px';
                ph.style.minHeight = '200px';
            } else if (img.classList.contains('product-img') ||
                       img.classList.contains('detail-main-img') ||
                       img.classList.contains('related-img')) {
                ph.style.minHeight = '180px';
            }
 
            img.parentNode.insertBefore(ph, img.nextSibling);
        });
    }
 
    function isOn() {
        return document.body.classList.contains('low-data');
    }
 
    function toggleLowData() {
        const on = isOn();
        document.body.classList.toggle('low-data', !on);
        localStorage.setItem(LD_KEY, !on ? 'on' : 'off');
 
        /* Update aria-pressed */
        const btn = document.querySelector('.low-data-toggle');
        if (btn) btn.setAttribute('aria-pressed', !on ? 'true' : 'false');
 
        /* When turning ON — stop the scroll gradient JS from running */
        if (!on) {
            document.body.style.backgroundPosition = '';
        }
    }
 
    document.addEventListener('DOMContentLoaded', () => {
        injectToggle();
        injectPlaceholders();
    });
})();