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