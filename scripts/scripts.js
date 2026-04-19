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
function getCart()              { return JSON.parse(localStorage.getItem('roots-cart'))     || []; }
function getWishlist()          { return JSON.parse(localStorage.getItem('roots-wishlist')) || []; }
function saveCart(cart)         { localStorage.setItem('roots-cart',     JSON.stringify(cart)); }
function saveWishlist(wishlist) { localStorage.setItem('roots-wishlist', JSON.stringify(wishlist)); }

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
document.addEventListener('DOMContentLoaded', function() {
    // Only run on the checkout page
    if (!document.getElementById('checkoutPage')) return;

    var cart = getCart();

    if (!cart || cart.length === 0) {
        document.getElementById('checkoutPage').style.display = 'none';
        var es = document.getElementById('emptyState');
        if (es) { es.style.display = 'flex'; es.classList.remove('hidden'); }
        return;
    }

    orderRef = 'RTX-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    var eftEl = document.getElementById('eftRef');
    if (eftEl) eftEl.textContent = orderRef;

    renderOrderSummary();
    updateMiniTotals();
    generateQR();
});

/* -------------------------------------------------------
   STEP NAVIGATION
------------------------------------------------------- */
function goToStep(n) {
    document.querySelectorAll('.checkout-step').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById('step' + n).classList.add('active');

    // Update Tailwind-based progress indicators (step-ind-N IDs)
    for (var i = 1; i <= 4; i++) {
        var ind = document.getElementById('step-ind-' + i);
        if (!ind) continue;
        var circle = ind.querySelector('div');
        var label  = ind.querySelector('span');
        if (!circle || !label) continue;
        if (i <= n) {
            circle.className = 'w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-black transition-all border-green-400 bg-green-800/60 text-green-400';
            label.className  = 'text-[10px] font-bold uppercase tracking-wide text-green-400';
        } else {
            circle.className = 'w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-black transition-all border-white/20 bg-white/5 text-gray-500';
            label.className  = 'text-[10px] font-bold uppercase tracking-wide text-gray-500';
        }
    }

    currentStep = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (n === 4) renderReview();
    if (n === 3) updateMiniTotals();
}

/* -------------------------------------------------------
   RENDER ORDER SUMMARY (step 1)
------------------------------------------------------- */
function renderOrderSummary() {
    var cart      = getCart();
    var container = document.getElementById('orderItems');
    var totalsEl  = document.getElementById('orderTotals');
    if (!container || !totalsEl) return;

    var subtotal = 0;
    var html = '';
    cart.forEach(function(item) {
        var line = item.price * item.qty;
        subtotal += line;
        html += '<div class="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">' +
            '<div><p class="text-sm font-semibold text-white">' + item.name + '</p>' +
            '<p class="text-xs text-gray-400 mt-0.5">x' + item.qty + ' @ R' + parseFloat(item.price).toFixed(2) + '</p></div>' +
            '<span class="text-sm font-black text-green-400">R' + line.toFixed(2) + '</span></div>';
    });
    container.innerHTML = html;

    var fulfilmentEl = document.querySelector('input[name="fulfilment"]:checked');
    var isDeliver    = fulfilmentEl && fulfilmentEl.value === 'deliver';
    var delivery     = isDeliver ? DELIVERY_FEE : 0;
    var total        = subtotal + delivery;

    totalsEl.innerHTML =
        '<div class="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span>R' + subtotal.toFixed(2) + '</span></div>' +
        '<div class="flex justify-between text-sm text-gray-400"><span>Delivery</span><span>' + (delivery === 0 ? 'Free' : 'R' + delivery.toFixed(2)) + '</span></div>' +
        '<div class="flex justify-between text-white font-black text-base border-t border-white/10 pt-3 mt-2"><span>Total</span><span class=\"text-green-400\">R' + total.toFixed(2) + '</span></div>';
}

/* -------------------------------------------------------
   MINI TOTAL (steps 2 & 3)
------------------------------------------------------- */
function updateMiniTotals() {
    var cart      = getCart();
    var subtotal  = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
    var fulfilmentEl = document.querySelector('input[name="fulfilment"]:checked');
    var isDeliver    = fulfilmentEl && fulfilmentEl.value === 'deliver';
    var delivery  = isDeliver ? DELIVERY_FEE : 0;
    var total     = subtotal + delivery;

    var html =
        '<div class="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span>R' + subtotal.toFixed(2) + '</span></div>' +
        '<div class="flex justify-between text-sm text-gray-400"><span>Delivery</span><span>' + (delivery === 0 ? 'Free' : 'R' + delivery.toFixed(2)) + '</span></div>' +
        '<div class="flex justify-between text-white font-black border-t border-white/10 pt-3 mt-2"><span>Order Total</span><span class=\"text-green-400\">R' + total.toFixed(2) + '</span></div>';

    var d = document.getElementById('deliveryMiniTotal');
    var p = document.getElementById('paymentMiniTotal');
    if (d) d.innerHTML = html;
    if (p) p.innerHTML = html;
}

/* -------------------------------------------------------
   FULFILMENT TOGGLE
------------------------------------------------------- */
function switchFulfilment() {
    var isDeliver = document.getElementById('opt-deliver').checked;

    var df = document.getElementById('deliveryForm');
    var ci = document.getElementById('collectInfo');
    if (df) { df.style.display = isDeliver ? 'block' : 'none'; df.classList.toggle('hidden', !isDeliver); }
    if (ci) { ci.style.display = isDeliver ? 'none'  : 'block'; ci.classList.toggle('hidden', isDeliver); }

    var lc = document.getElementById('label-collect');
    var ld = document.getElementById('label-deliver');
    if (lc) {
        lc.className = lc.className.replace('border-green-400 bg-green-400/5','border-white/15 bg-white/5');
        if (!isDeliver) { lc.className = lc.className.replace('border-white/15 bg-white/5','border-green-400 bg-green-400/5'); }
    }
    if (ld) {
        ld.className = ld.className.replace('border-green-400 bg-green-400/5','border-white/15 bg-white/5');
        if (isDeliver) { ld.className = ld.className.replace('border-white/15 bg-white/5','border-green-400 bg-green-400/5'); }
    }

    updateMiniTotals();
    renderOrderSummary();
}

// Set initial selected state
document.addEventListener('DOMContentLoaded', () => {
    var lc = document.getElementById('label-collect');
    if (lc) lc.classList.add('selected');
});

/* -------------------------------------------------------
   VALIDATION HELPERS
------------------------------------------------------- */
function setError(id, msg) {
    var el  = document.getElementById(id);
    if (!el) return;
    var err = el.parentElement.querySelector('.field-error');
    el.style.borderColor = '#ef4444';
    if (err) { err.textContent = msg; return; }
    var span = document.createElement('span');
    span.className   = 'field-error block text-red-400 text-xs mt-1';
    span.textContent = msg;
    el.parentElement.appendChild(span);
}

function clearError(id) {
    var el  = document.getElementById(id);
    if (!el) return;
    var err = el.parentElement.querySelector('.field-error');
    el.style.borderColor = '';
    if (err) err.remove();
}

function clearAll(ids) { ids.forEach(clearError); }

function isEmpty(id) {
    var el = document.getElementById(id);
    return !el || !el.value.trim();
}

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function isValidPhone(v) { return /^[\d\s+()-]{7,15}$/.test(v.trim()); }

/* -------------------------------------------------------
   VALIDATE STEP 2 — DELIVERY
------------------------------------------------------- */
function validateDelivery() {
    var ids = ['firstName','lastName','email','phone'];
    clearAll(ids);
    var ok = true;

    if (isEmpty('firstName')) { setError('firstName', 'First name is required'); ok = false; }
    if (isEmpty('lastName'))  { setError('lastName',  'Last name is required');  ok = false; }

    var email = document.getElementById('email').value.trim();
    if (!email) { setError('email', 'Email is required'); ok = false; }
    else if (!isValidEmail(email)) { setError('email', 'Enter a valid email address'); ok = false; }

    var phone = document.getElementById('phone').value.trim();
    if (!phone) { setError('phone', 'Phone number is required'); ok = false; }
    else if (!isValidPhone(phone)) { setError('phone', 'Enter a valid phone number'); ok = false; }

    if (document.getElementById('opt-deliver').checked) {
        var dIds = ['street','suburb','city','province','postalCode'];
        clearAll(dIds);

        if (isEmpty('street'))     { setError('street',     'Street address is required'); ok = false; }
        if (isEmpty('suburb'))     { setError('suburb',     'Suburb is required');          ok = false; }
        if (isEmpty('city'))       { setError('city',       'City is required');            ok = false; }
        if (!document.getElementById('province').value) { setError('province', 'Select a province'); ok = false; }

        var pc = document.getElementById('postalCode').value.trim();
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
    // Reset all tab buttons
    var tabBtns = ['tab-card-btn','tab-eft-btn','tab-wallet-btn'];
    tabBtns.forEach(function(id) {
        var b = document.getElementById(id);
        if (!b) return;
        b.className = b.className
            .replace('bg-green-800/60 border-green-400 text-green-400','bg-white/5 border-white/15 text-gray-400 hover:text-gray-200');
    });
    // Activate clicked tab
    if (btn) {
        btn.className = btn.className
            .replace('bg-white/5 border-white/15 text-gray-400 hover:text-gray-200','bg-green-800/60 border-green-400 text-green-400');
    }
    // Show correct panel
    document.querySelectorAll('.pay-panel').forEach(function(p) { p.classList.remove('active'); });
    var panel = document.getElementById('pay-' + tab);
    if (panel) panel.classList.add('active');
}

/* -------------------------------------------------------
   CARD NUMBER / EXPIRY FORMATTING
------------------------------------------------------- */
function formatCardNumber(input) {
    var v = input.value.replace(/[^0-9]/g, '').substr(0, 16);
    input.value = v.replace(/(.{4})/g, '$1 ').trim();
    var padded = v;
    while (padded.length < 16) { padded += '.'; }
    var display = padded.replace(/(.{4})/g, '$1 ').trim();
    var el = document.getElementById('cardNumDisplay');
    if (el) el.textContent = display;
}

function formatExpiry(input) {
    var v = input.value.replace(/[^0-9]/g, '').substr(0, 4);
    if (v.length >= 2) { v = v.substr(0, 2) + '/' + v.substr(2); }
    input.value = v;
    var el = document.getElementById('cardExpDisplay');
    if (el) el.textContent = v || 'MM/YY';
}

/* -------------------------------------------------------
   WALLET SELECTOR
------------------------------------------------------- */
function selectWallet(el, name) {
    activeWallet = name;
    // Reset all wallet options to unselected Tailwind classes
    var walletIds = ['wallet-snapscan','wallet-ozow','wallet-zapper'];
    walletIds.forEach(function(id) {
        var w = document.getElementById(id);
        if (!w) return;
        w.className = w.className
            .replace('border-green-400 bg-green-400/5','border-white/15 bg-white/5');
    });
    // Activate selected
    el.className = el.className
        .replace('border-white/15 bg-white/5','border-green-400 bg-green-400/5');
    var ql = document.getElementById('qrLabel');
    if (ql) ql.textContent = 'Scan with ' + name.charAt(0).toUpperCase() + name.slice(1) + ' to pay';
}

/* -------------------------------------------------------
   FAKE QR CODE GENERATOR
------------------------------------------------------- */
function generateQR() {
    var grid = document.getElementById('qrGrid');
    if (!grid) return;
    var html = '';
    for (var i = 0; i < 100; i++) {
        html += '<div class="qr-cell ' + (Math.random() > 0.5 ? 'filled' : '') + '"></div>';
    }
    grid.innerHTML = html;
    var corners = [0, 9, 90];
    corners.forEach(function(idx) {
        for (var r = 0; r < 3; r++) {
            for (var c = 0; c < 3; c++) {
                var cell = grid.children[idx + r * 10 + c];
                if (cell) { cell.classList.add('filled'); cell.classList.add('marker'); }
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
        var ok = true;

        if (isEmpty('cardName'))   { setError('cardName',   'Name on card is required'); ok = false; }

        var num = document.getElementById('cardNumber').value.replace(/\s/g, '');
        if (!num)        { setError('cardNumber', 'Card number is required'); ok = false; }
        else if (num.length !== 16) { setError('cardNumber', 'Enter a valid 16-digit card number'); ok = false; }

        var exp = document.getElementById('cardExpiry').value;
        if (!exp) { setError('cardExpiry', 'Expiry date is required'); ok = false; }
        else {
            var parts = exp.split('/'); var mm = parts[0]; var yy = parts[1];
            var now = new Date();
            var expDate = new Date(2000 + parseInt(yy), parseInt(mm) - 1);
            if (!mm || !yy || expDate < now) { setError('cardExpiry', 'Card has expired or date is invalid'); ok = false; }
        }

        var cvv = document.getElementById('cardCVV').value;
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
    var cart      = getCart();
    var isDeliver = document.getElementById('opt-deliver') && document.getElementById('opt-deliver').checked;
    var subtotal  = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
    var delivery  = isDeliver ? DELIVERY_FEE : 0;
    var total     = subtotal + delivery;

    // Items
    var riEl = document.getElementById('reviewItems');
    if (riEl) {
        var riHtml = '';
        cart.forEach(function(item) {
            riHtml += '<div class="flex justify-between px-4 py-2.5 text-sm text-gray-300 border-b border-white/5">' +
                '<span>' + item.name + ' x' + item.qty + '</span>' +
                '<span class="text-white font-semibold">R' + (item.price * item.qty).toFixed(2) + '</span></div>';
        });
        riEl.innerHTML = riHtml;
    }

    // Delivery
    var deliveryHTML = '';
    var rl = '<div class="flex justify-between px-4 py-2.5 text-sm border-b border-white/5">';
    var rs = '<span class="text-gray-400">';
    var rv = '</span><span class="text-white font-semibold">';
    var re = '</span></div>';
    function rlRow(label, val) { return rl + rs + label + rv + val + re; }

    if (isDeliver) {
        deliveryHTML =
            rlRow('Method', 'Home Delivery (+R' + DELIVERY_FEE + ')') +
            rlRow('Address', document.getElementById('street').value) +
            rlRow('Suburb/City', document.getElementById('suburb').value + ', ' + document.getElementById('city').value) +
            rlRow('Province', document.getElementById('province').value + ', ' + document.getElementById('postalCode').value);
    } else {
        deliveryHTML =
            rlRow('Method', 'Collection (Free)') +
            rlRow('Address', '12 Harvest Road, Epping, CT');
    }
    deliveryHTML +=
        rlRow('Contact', document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value) +
        rlRow('Email', document.getElementById('email').value);
    var rdEl = document.getElementById('reviewDelivery');
    if (rdEl) rdEl.innerHTML = deliveryHTML;

    // Payment
    var payHTML = '';
    if (activePayTab === 'card') {
        var num   = document.getElementById('cardNumber').value;
        var last4 = num.replace(/\s/g, '').substr(-4);
        payHTML =
            rlRow('Method', 'Credit / Debit Card') +
            rlRow('Card',   '.... .... .... ' + last4) +
            rlRow('Name',   document.getElementById('cardName').value);
    } else if (activePayTab === 'eft') {
        payHTML = rlRow('Method', 'EFT / Bank Transfer') + rlRow('Reference', orderRef);
    } else {
        payHTML = rlRow('Method', activeWallet.charAt(0).toUpperCase() + activeWallet.slice(1));
    }
    var rpEl = document.getElementById('reviewPayment');
    if (rpEl) rpEl.innerHTML = payHTML;

    // Final total
    var ftEl = document.getElementById('finalTotal');
    if (ftEl) ftEl.innerHTML =
        '<div class="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span>R' + subtotal.toFixed(2) + '</span></div>' +
        '<div class="flex justify-between text-sm text-gray-400"><span>Delivery</span><span>' + (delivery === 0 ? 'Free' : 'R' + delivery.toFixed(2)) + '</span></div>' +
        '<div class="flex justify-between text-white font-black text-base border-t border-white/10 pt-3 mt-2"><span>Total to Pay</span><span class=\"text-green-400\">R' + total.toFixed(2) + '</span></div>';
}

/* -------------------------------------------------------
   PLACE ORDER
------------------------------------------------------- */
function placeOrder() {
    var termsCheck = document.getElementById('termsCheck');
    if (!termsCheck || !termsCheck.checked) {
        var err = document.querySelector('.terms-error');
        if (!err) {
            var span = document.createElement('span');
            span.className   = 'terms-error field-error block text-red-400 text-xs mt-1 mb-3';
            span.textContent = 'Please accept the terms and conditions to continue';
            var termsLabel = document.querySelector('label[for="termsCheck"], label:has(#termsCheck)');
            if (termsLabel) { termsLabel.after(span); }
            else { termsCheck.parentElement.after(span); }
        }
        return;
    }

    var btn = document.getElementById('placeOrderBtn');
    btn.textContent = 'Processing...';
    btn.disabled    = true;
    btn.classList.add('opacity-60', 'cursor-not-allowed');

    setTimeout(function() {
        var isDeliver = document.getElementById('opt-deliver').checked;
        var emailEl   = document.getElementById('email');
        var popEmail  = document.getElementById('popupEmail');
        var popRef    = document.getElementById('popupRef');
        var popMethod = document.getElementById('popupMethod');
        var popup     = document.getElementById('successPopup');

        if (popEmail)  popEmail.textContent  = emailEl ? emailEl.value : '';
        if (popRef)    popRef.textContent    = orderRef;
        if (popMethod) popMethod.textContent = isDeliver
            ? 'delivery (2 to 4 business days)'
            : 'collection at Roots Distribution Centre';

        if (popup) popup.classList.add('visible');
        saveCart([]);
    }, 1800);
}

function finishOrder() {
    window.location.href = 'index.html';
}

const PRODUCTS = {

    /* ─────────────────────────────────────────
       PRODUCE
    ───────────────────────────────────────── */

    1: {
        id:        '1',
        name:      'Spinach (1kg)',
        category:  'Vegetables',
        price:     45,
        priceUnit: 'per kg',
        stock:     'In Stock',
        image:     'media/spinach-products.jpg',
        badge:     'Vegetables',
        chips: [
            { label: 'Weight',  value: '1 kg' },
            { label: 'Variety', value: 'Baby & Flat-leaf' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: 'Khayelitsha, CT' },
        ],
        farmer: {
            name:       'Khayelitsha Greens Farm',
            location:   'Khayelitsha, Cape Town',
            note:       'A community of 18 small-plot farmers pooling their harvests since 2021 — known for their chemical-free growing practices and consistent year-round supply.',
        },
        description: `
            <p>Fresh, tender spinach harvested by hand from community plots in Khayelitsha. Our spinach is a mix of baby and flat-leaf varieties, grown without pesticides or synthetic fertilisers on well-composted township soil.</p>
            <p>Best used in stir-fries, curries, smoothies, or lightly wilted with garlic and olive oil. Spinach pairs beautifully with pap and is a staple in many of the households that grow it.</p>
            <p>Storage: keep unwashed in a sealed bag in the fridge. Best consumed within 4–5 days of purchase for optimal freshness and nutrient content.</p>
        `,
        nutrition: [
            { label: 'Energy',           value: '23 kcal / 100g' },
            { label: 'Protein',          value: '2.9g' },
            { label: 'Carbohydrates',    value: '3.6g' },
            { label: 'of which sugars',  value: '0.4g' },
            { label: 'Fat',              value: '0.4g' },
            { label: 'Fibre',            value: '2.2g' },
            { label: 'Iron',             value: '2.7mg' },
            { label: 'Vitamin C',        value: '28mg' },
        ],
        reviews: [
            { author: 'Nomsa T.', rating: 5, date: 'March 2026', body: 'Absolutely fresh — still had dew on the leaves when it arrived. Best spinach I have bought in years.' },
            { author: 'Pieter V.', rating: 4, date: 'February 2026', body: 'Great quality and price. I use it in everything. Would be 5 stars if the leaves were a little more uniform in size.' },
        ],
    },

    2: {
        id:        '2',
        name:      'Tomatoes (1kg)',
        category:  'Vegetables',
        price:     30,
        priceUnit: 'per kg',
        stock:     'In Stock',
        image:     'media/tomatoes-products.jpg',
        badge:     'Vegetables',
        chips: [
            { label: 'Weight',  value: '1 kg' },
            { label: 'Variety', value: 'Roma & Round' },
            { label: 'Method',  value: 'Open-air grown' },
            { label: 'Origin',  value: 'Mitchells Plain, CT' },
        ],
        farmer: {
            name:       'Mitchells Plain Growers',
            location:   'Mitchells Plain, Cape Town',
            note:       'A family-led farm of 11 plots specialising in tomatoes and peppers, using rainwater harvesting and natural compost to keep their produce clean and affordable.',
        },
        description: `
            <p>Sun-ripened Roma and round tomatoes grown on open plots in Mitchells Plain. These tomatoes are picked at peak ripeness and delivered within 24 hours — meaning you get full flavour, not the pale, early-picked tomatoes typical of supermarkets.</p>
            <p>Perfect for sauces, salads, braises, and braai side dishes. Roma varieties are especially good for slow-cooked tomato bases and chakalaka.</p>
            <p>Storage: store at room temperature away from direct sunlight until fully ripe, then refrigerate and use within 3 days.</p>
        `,
        nutrition: [
            { label: 'Energy',           value: '18 kcal / 100g' },
            { label: 'Protein',          value: '0.9g' },
            { label: 'Carbohydrates',    value: '3.9g' },
            { label: 'of which sugars',  value: '2.6g' },
            { label: 'Fat',              value: '0.2g' },
            { label: 'Fibre',            value: '1.2g' },
            { label: 'Vitamin C',        value: '14mg' },
            { label: 'Lycopene',         value: '2573mcg' },
        ],
        reviews: [
            { author: 'Ayanda M.', rating: 5, date: 'April 2026', body: 'These taste like the tomatoes I grew up eating from the garden. Sweet, firm, and full of flavour.' },
            { author: 'Riana S.', rating: 5, date: 'March 2026', body: 'Made a tomato bredie with these and my whole family asked what I did differently. Nothing — just better tomatoes.' },
        ],
    },

    3: {
        id:        '3',
        name:      'Lemons (1kg)',
        category:  'Fruits',
        price:     60,
        priceUnit: 'per kg',
        stock:     'In Stock',
        image:     'media/lemons-products.jpeg',
        badge:     'Fruits',
        chips: [
            { label: 'Weight',  value: '1 kg (±6–8 lemons)' },
            { label: 'Variety', value: 'Eureka' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: 'Gugulethu, CT' },
        ],
        farmer: {
            name:       'Gugulethu Citrus Growers',
            location:   'Gugulethu, Cape Town',
            note:       'This farm has been growing Eureka lemons since 2019, using grey water irrigation and organic compost to produce juicy, thick-skinned lemons year-round.',
        },
        description: `
            <p>Bright, juicy Eureka lemons grown on community plots in Gugulethu. Each kilogram contains approximately 6–8 full-sized lemons with thick, fragrant skins and minimal seeds — ideal for both juice and zest.</p>
            <p>Use in cooking, baking, drinks, and home remedies. The zest is excellent in baked goods and pasta, while the juice adds brightness to everything from fish to salad dressings.</p>
            <p>Storage: lemons keep at room temperature for up to 1 week, or refrigerated in a sealed bag for up to 3 weeks.</p>
        `,
        nutrition: [
            { label: 'Energy',           value: '29 kcal / 100g' },
            { label: 'Protein',          value: '1.1g' },
            { label: 'Carbohydrates',    value: '9.3g' },
            { label: 'of which sugars',  value: '2.5g' },
            { label: 'Fat',              value: '0.3g' },
            { label: 'Fibre',            value: '2.8g' },
            { label: 'Vitamin C',        value: '53mg' },
            { label: 'Potassium',        value: '138mg' },
        ],
        reviews: [
            { author: 'Fatima A.', rating: 5, date: 'April 2026', body: 'Incredible lemons — so much juice in each one. I made lemon curd and it was the best I have ever tasted.' },
            { author: 'Johan B.', rating: 4, date: 'March 2026', body: 'Good size and very juicy. A bit pricier than the shop but the quality makes it worth it.' },
        ],
    },

    4: {
        id:        '4',
        name:      'Butternut Squash',
        category:  'Vegetables',
        price:     70,
        priceUnit: 'per unit',
        stock:     'In Stock',
        image:     'media/butternut-products.jpeg',
        badge:     'Vegetables',
        chips: [
            { label: 'Weight',  value: '±900g – 1.3kg' },
            { label: 'Pack',    value: '1 whole butternut' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: 'Langa, CT' },
        ],
        farmer: {
            name:       'Langa Community Gardens',
            location:   'Langa, Cape Town',
            note:       'One of the oldest community garden networks in Cape Town, Langa has been growing squash and pumpkins for over a decade using traditional composting methods.',
        },
        description: `
            <p>Sweet, dense butternuts grown on community plots in Langa. Each one is harvested by hand once fully mature, resulting in a deep orange flesh with a naturally sweet, nutty flavour.</p>
            <p>Exceptional roasted whole in the oven, cubed in soups and stews, or mashed as a side dish. A household staple in South African cooking and an excellent source of Vitamin A and fibre.</p>
            <p>Storage: uncut butternuts keep in a cool, dark place for up to 3 weeks. Once cut, wrap tightly and refrigerate — use within 5 days.</p>
        `,
        nutrition: [
            { label: 'Energy',           value: '45 kcal / 100g' },
            { label: 'Protein',          value: '1.0g' },
            { label: 'Carbohydrates',    value: '11.7g' },
            { label: 'of which sugars',  value: '2.2g' },
            { label: 'Fat',              value: '0.1g' },
            { label: 'Fibre',            value: '2.0g' },
            { label: 'Vitamin A',        value: '532mcg' },
            { label: 'Potassium',        value: '352mg' },
        ],
        reviews: [
            { author: 'Thandi N.', rating: 5, date: 'April 2026', body: 'Perfectly ripe, sweet, and a generous size. Made a big pot of butternut soup and it was divine.' },
            { author: 'Carel D.', rating: 5, date: 'March 2026', body: 'You can taste the difference compared to shop butternuts. Much sweeter and the flesh is a much deeper orange.' },
        ],
    },

    5: {
        id:        '5',
        name:      'Sorghum (1kg)',
        category:  'Grains',
        price:     70,
        priceUnit: 'per kg',
        stock:     'In Stock',
        image:     'media/sorghum-products.jpg',
        badge:     'Grains',
        chips: [
            { label: 'Weight',   value: '1 kg' },
            { label: 'Type',     value: 'Whole grain, red sorghum' },
            { label: 'Method',   value: 'Traditionally grown' },
            { label: 'Origin',   value: 'Khayelitsha, CT' },
        ],
        farmer: {
            name:       'Khayelitsha Grain',
            location:   'Khayelitsha, Cape Town',
            note:       'This farm revived traditional sorghum cultivation in the Western Cape, growing red sorghum using drought-resistant methods and minimal water inputs.',
        },
        description: `
            <p>Whole grain red sorghum, a traditional South African staple with deep cultural roots. Grown by Khayelitsha Grain using drought-resistant cultivation methods passed down through generations, this sorghum is naturally gluten-free and highly nutritious.</p>
            <p>Use to make traditional porridge (ting), fermented sorghum beer, or as a high-fibre substitute for rice. Can also be ground into flour for baking. Sorghum has a mildly earthy, slightly sweet flavour and a satisfying texture.</p>
            <p>Storage: store in an airtight container in a cool, dry place. Keeps for up to 12 months. Once cooked, refrigerate and consume within 3 days.</p>
        `,
        nutrition: [
            { label: 'Energy',           value: '339 kcal / 100g' },
            { label: 'Protein',          value: '11.3g' },
            { label: 'Carbohydrates',    value: '74.6g' },
            { label: 'of which sugars',  value: '2.5g' },
            { label: 'Fat',              value: '3.3g' },
            { label: 'Fibre',            value: '6.3g' },
            { label: 'Iron',             value: '4.4mg' },
            { label: 'Gluten',           value: 'Gluten-free' },
        ],
        reviews: [
            { author: 'Sipho K.', rating: 5, date: 'April 2026', body: 'Reminds me of the sorghum my grandmother used to grow. Made a beautiful traditional porridge with it.' },
            { author: 'Lerato M.', rating: 4, date: 'March 2026', body: 'Great quality grain. I use it as a rice substitute and it holds up really well in stews.' },
        ],
    },

    6: {
        id:        '6',
        name:      'Seed Pack — Greens',
        category:  'Seeds',
        price:     35,
        priceUnit: 'per pack',
        stock:     'In Stock',
        image:     'media/greens-seedpack-products.jpeg',
        badge:     'Seeds',
        chips: [
            { label: 'Contents',  value: 'Spinach, Swiss Chard, Kale' },
            { label: 'Seeds',     value: '≈ 150 seeds total' },
            { label: 'Season',    value: 'All year (best: Mar–Aug)' },
            { label: 'Supplier',  value: 'Roots Seed Initiative, CT' },
        ],
        farmer: {
            name:       'Roots Seed Initiative',
            location:   'Cape Town',
            note:       'Seeds are selected and packaged by the Roots Seed Initiative — a programme that sources open-pollinated, non-GMO varieties suitable for small-plot township growing conditions.',
        },
        description: `
            <p>A community-curated seed pack containing three of the most productive leafy green varieties for small-plot growing: flat-leaf spinach, Swiss chard (rainbow mix), and Tuscan kale. All seeds are open-pollinated and non-GMO, meaning you can save seeds from your harvest for the next season.</p>
            <p>Planting guide: sow seeds 1–2 cm deep, 15 cm apart, in well-drained soil or container mix. Water lightly every 2 days. Spinach and Swiss chard are ready in 6–8 weeks; kale in 8–10 weeks. Suitable for container, raised bed, and in-ground planting.</p>
            <p>Storage: store in a cool, dry place away from direct sunlight. Germination rate remains above 85% for 2 years when stored correctly.</p>
        `,
        nutrition: [
            { label: 'Seed varieties',    value: 'Spinach, Swiss Chard, Kale' },
            { label: 'Approx. count',     value: '≈ 150 seeds' },
            { label: 'Germination rate',  value: '85%+' },
            { label: 'Sow depth',         value: '1–2 cm' },
            { label: 'Spacing',           value: '15 cm apart' },
            { label: 'Days to harvest',   value: '42–70 days' },
            { label: 'Suitable for',      value: 'Container & in-ground' },
            { label: 'GMO status',        value: 'Non-GMO, open-pollinated' },
        ],
        reviews: [
            { author: 'Bongi M.', rating: 5, date: 'March 2026', body: 'All three varieties germinated within a week. Now I have more greens than I know what to do with — absolutely recommend.' },
            { author: 'Yasmine F.', rating: 5, date: 'February 2026', body: 'Grew the Swiss chard in a container on my balcony. It is thriving. Great value for what you get.' },
        ],
    },

    7: {
        id:        '7',
        name:      'Gardening Gloves',
        category:  'Equipment',
        price:     50,
        priceUnit: 'per pair',
        stock:     'In Stock',
        image:     'media/equipment-products-1.jpg',
        badge:     'Equipment',
        chips: [
            { label: 'Material', value: 'Nitrile-coated cotton' },
            { label: 'Sizes',    value: 'S, M, L, XL' },
            { label: 'Use',      value: 'General planting & weeding' },
            { label: 'Pack',     value: '1 pair' },
        ],
        farmer: {
            name:       'Roots Equipment Store',
            location:   'Cape Town',
            note:       'Equipment sourced in bulk by Roots and sold at community pricing — no retail markup, just the cost of getting the right tools into the right hands.',
        },
        description: `
            <p>Durable nitrile-coated cotton gardening gloves designed for everyday small-plot farming tasks. The nitrile palm coating provides excellent grip on wet and dry surfaces while protecting against thorns, soil abrasion, and minor cuts. The breathable cotton back keeps hands cool during long working sessions.</p>
            <p>Suitable for planting, weeding, pruning, and general garden maintenance. The snug fit gives you enough dexterity to handle seeds and seedlings without removing the gloves.</p>
            <p>Available in sizes S, M, L, and XL. If you are between sizes, size up for comfort during extended use. Machine washable — rinse after each use for longer glove life.</p>
        `,
        nutrition: [
            { label: 'Material',         value: 'Nitrile-coated cotton' },
            { label: 'Available sizes',  value: 'S, M, L, XL' },
            { label: 'Palm',             value: 'Nitrile-coated (grip & protection)' },
            { label: 'Back',             value: 'Breathable cotton' },
            { label: 'Washable',         value: 'Yes — machine washable' },
            { label: 'Best for',         value: 'Planting, weeding, pruning' },
            { label: 'Pack contents',    value: '1 pair' },
        ],
        reviews: [
            { author: 'Monde T.', rating: 5, date: 'April 2026', body: 'Finally gloves that actually fit well and do not slip. Have been using them daily for a month and they are still in great shape.' },
            { author: 'Karen S.', rating: 4, date: 'March 2026', body: 'Good quality for the price. The grip is excellent even when handling wet plants.' },
        ],
    },

    8: {
        id:        '8',
        name:      'Wooden Handle Hoe',
        category:  'Equipment',
        price:     100,
        priceUnit: 'each',
        stock:     'In Stock',
        image:     'media/hoe-products.jpeg',
        badge:     'Equipment',
        chips: [
            { label: 'Length',   value: '140 cm (adjustable)' },
            { label: 'Head',     value: 'Forged steel, 15 cm blade' },
            { label: 'Handle',   value: 'Smooth hardwood' },
            { label: 'Weight',   value: '±900g' },
        ],
        farmer: {
            name:       'Roots Equipment Store',
            location:   'Cape Town',
            note:       'Sourced through a bulk community purchase programme — this hoe is the same model used daily across plots in Khayelitsha and Mitchells Plain.',
        },
        description: `
            <p>A sturdy, full-length garden hoe with a forged steel head and smooth hardwood handle — the essential tool for breaking soil, making furrows, and clearing weeds between rows. The 15 cm steel blade is thick enough to cut through compacted township soil without bending.</p>
            <p>The 140 cm handle length suits most adults and reduces back strain during extended hoeing sessions. The wood is sanded smooth to prevent splinters and the blade is rust-treated for outdoor durability.</p>
            <p>Maintenance: rinse the blade after use and store in a dry place. Lightly oil the blade every few months to prevent surface rust. The handle can be replaced if needed using standard hardware fittings.</p>
        `,
        nutrition: [
            { label: 'Total length',     value: '140 cm' },
            { label: 'Blade width',      value: '15 cm' },
            { label: 'Blade material',   value: 'Forged carbon steel' },
            { label: 'Handle material',  value: 'Hardwood (smooth-sanded)' },
            { label: 'Weight',           value: '±900g' },
            { label: 'Rust treatment',   value: 'Yes' },
            { label: 'Replacement handle', value: 'Available separately' },
        ],
        reviews: [
            { author: 'Siphamandla N.', rating: 5, date: 'April 2026', body: 'Solid, heavy-duty hoe. I have been farming for 12 years and this is as good as tools that cost three times more.' },
            { author: 'Dave P.', rating: 4, date: 'March 2026', body: 'Good weight and balance. The steel head is thick and sharp. Very happy with it.' },
        ],
    },

    9: {
        id:        '9',
        name:      'Sorghum (1kg)',
        category:  'Grains',
        price:     80,
        priceUnit: 'per kg',
        stock:     'In Stock',
        image:     'media/sorghum-products.jpg',
        badge:     'Grains',
        chips: [
            { label: 'Weight',  value: '1 kg' },
            { label: 'Type',    value: 'Whole grain, white sorghum' },
            { label: 'Method',  value: 'Traditionally grown' },
            { label: 'Origin',  value: 'Gugulethu, CT' },
        ],
        farmer: {
            name:       'Gugulethu Grain Growers',
            location:   'Gugulethu, Cape Town',
            note:       'A smaller specialist grain farm focused exclusively on white sorghum, using traditional low-irrigation growing methods developed over many seasons.',
        },
        description: `
            <p>Premium white sorghum grain, grown using traditional low-input methods by the Gugulethu Grain Growers. White sorghum has a milder, sweeter flavour than red varieties, making it more versatile in both savoury and sweet applications.</p>
            <p>Use for traditional porridge, flatbreads, baked goods, or as a nutritious gluten-free side grain. White sorghum flour is increasingly popular in health-conscious baking. It cooks similarly to rice but with a chewier, more satisfying texture.</p>
            <p>Storage: store in an airtight container in a cool, dry pantry. Shelf life is 12+ months when stored correctly. Cooked sorghum keeps in the fridge for up to 4 days.</p>
        `,
        nutrition: [
            { label: 'Energy',           value: '329 kcal / 100g' },
            { label: 'Protein',          value: '10.6g' },
            { label: 'Carbohydrates',    value: '72.1g' },
            { label: 'of which sugars',  value: '1.9g' },
            { label: 'Fat',              value: '3.1g' },
            { label: 'Fibre',            value: '6.7g' },
            { label: 'Iron',             value: '3.9mg' },
            { label: 'Gluten',           value: 'Gluten-free' },
        ],
        reviews: [
            { author: 'Nozipho D.', rating: 5, date: 'April 2026', body: 'Smoother flavour than the red sorghum I normally buy. Makes a beautiful light porridge. Will definitely reorder.' },
        ],
    },

    10: {
        id:        '10',
        name:      'Cabbage (1kg)',
        category:  'Vegetables',
        price:     100,
        priceUnit: 'per head (±1kg)',
        stock:     'In Stock',
        image:     'media/cabbage-products.jpeg',
        badge:     'Vegetables',
        chips: [
            { label: 'Weight',  value: '±800g – 1.2kg per head' },
            { label: 'Variety', value: 'Drumhead & Savoy' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: 'Nyanga, CT' },
        ],
        farmer: {
            name:       'Nyanga Community Farm',
            location:   'Nyanga, Cape Town',
            note:       'A 24-plot in Nyanga growing cabbages year-round using rainwater collection and natural pest control — no synthetic chemicals used on any plot.',
        },
        description: `
            <p>Dense, crisp cabbages harvested fresh from community plots in Nyanga. We grow a mix of drumhead (smooth-leaf) and savoy (crinkle-leaf) varieties depending on the season, both known for their firm texture and full flavour.</p>
            <p>A South African kitchen essential — perfect for coleslaw, braised dishes, stews, vetkoek fillings, and traditional boontjiesop. Cabbage is one of the most nutritious and economical vegetables you can buy.</p>
            <p>Storage: keep whole cabbages in the fridge crisper drawer for up to 2 weeks. Once cut, wrap tightly and use within 4 days for best flavour.</p>
        `,
        nutrition: [
            { label: 'Energy',           value: '25 kcal / 100g' },
            { label: 'Protein',          value: '1.3g' },
            { label: 'Carbohydrates',    value: '5.8g' },
            { label: 'of which sugars',  value: '3.2g' },
            { label: 'Fat',              value: '0.1g' },
            { label: 'Fibre',            value: '2.5g' },
            { label: 'Vitamin C',        value: '36mg' },
            { label: 'Vitamin K',        value: '76mcg' },
        ],
        reviews: [
            { author: 'Zanele B.', rating: 5, date: 'April 2026', body: 'Fresh, tight heads and very good size. Made a big pot of cabbage soup and it was delicious. Good value.' },
            { author: 'Andrew C.', rating: 4, date: 'March 2026', body: 'Solid cabbage. Crisp and fresh when it arrived. The savoy variety I got was perfect for coleslaw.' },
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
document.addEventListener('DOMContentLoaded', function() {
    // Only run on the OLD (non-React) product detail page
    // The React version handles its own rendering
    if (!document.getElementById('detailPage') && !document.getElementById('notFound')) return;
    // If this is the React version (has app-root), skip - React handles everything
    if (document.getElementById('app-root')) return;

    var id      = new URLSearchParams(window.location.search).get('id');
    var product = PRODUCTS[id];

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
    if (document.getElementById('app-root')) return;
    var tdEl = document.getElementById('tab-description');
    if (tdEl) tdEl.innerHTML = '<div class="tab-content-body">' + p.description + '</div>';

    var tnEl = document.getElementById('tab-nutrition');
    if (tnEl) {
        var nHtml = '<div class="nutrition-table">';
        p.nutrition.forEach(function(row) {
            nHtml += '<div class="nutrition-row"><span class="nutrition-label">' + row.label +
                     '</span><span class="nutrition-value">' + row.value + '</span></div>';
        });
        nHtml += '</div>';
        tnEl.innerHTML = nHtml;
    }

    var trEl = document.getElementById('tab-reviews');
    if (trEl && p.reviews && p.reviews.length) {
        var avgRating = p.reviews.reduce(function(s, r) { return s + r.rating; }, 0) / p.reviews.length;
        var rHtml = '<div class="reviews-header"><div class="reviews-avg">' +
            '<span class="avg-number">' + avgRating.toFixed(1) + '</span>' +
            '<span class="avg-stars">' + renderStars(avgRating) + '</span>' +
            '<span class="avg-count">' + p.reviews.length + ' review' + (p.reviews.length !== 1 ? 's' : '') + '</span>' +
            '</div></div><div class="reviews-list">';
        p.reviews.forEach(function(r) {
            rHtml += '<div class="review-card"><div class="review-top">' +
                '<span class="review-author">' + r.author + '</span>' +
                '<span class="review-stars">' + renderStars(r.rating) + '</span>' +
                '<span class="review-date">' + r.date + '</span>' +
                '</div><p class="review-body">' + r.body + '</p></div>';
        });
        rHtml += '</div>';
        trEl.innerHTML = rHtml;
    }
}
 
function renderStars(rating) {
    var html = '';
    for (var i = 0; i < 5; i++) {
        html += '<span class="' + (i < Math.round(rating) ? 'star filled' : 'star') + '">*</span>';
    }
    return html;
}
 
function switchDetailTab(name, btn) {
    document.querySelectorAll('.detail-tab').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.detail-tab-panel').forEach(function(p) { p.style.display = 'none'; });
    btn.classList.add('active');
    var panel = document.getElementById('tab-' + name);
    if (panel) panel.style.display = 'block';
}
 
/* -------------------------------------------------------
   RELATED PRODUCTS
------------------------------------------------------- */
function renderRelated(p) {
    if (document.getElementById('app-root')) return;
    var allProds = Object.values(PRODUCTS);
    var related = allProds.filter(function(prod) { return prod.id !== p.id && prod.category === p.category; }).slice(0, 4);
    if (related.length < 3) {
        var others = allProds.filter(function(prod) { return prod.id !== p.id && prod.category !== p.category; }).slice(0, 4 - related.length);
        related = related.concat(others);
    }
 
    var rgEl = document.getElementById('relatedGrid');
    if (!rgEl) return;
    var rHtml = '';
    related.forEach(function(prod) {
        rHtml += '<div class="related-card">' +
            '<a href="product_detail.html?id=' + prod.id + '" class="related-img-link">' +
            '<div class="related-img-wrap">' +
            '<img src="' + prod.image + '" alt="' + prod.name + '" class="related-img">' +
            '<span class="product-badge">' + prod.badge + '</span></div></a>' +
            '<div class="related-body">' +
            '<span class="related-name">' + prod.name + '</span>' +
            '<span class="related-price">R' + prod.price.toFixed(2) + '</span></div>' +
            '<div class="related-actions">' +
            '<a href="product_detail.html?id=' + prod.id + '" class="btn btn-info related-btn">View</a>' +
            '<button class="btn btn-cart related-btn" onclick="addToCart(\'' + prod.id + '\',\'' + prod.name + '\',' + prod.price + ',1);this.textContent=\'Added!\';setTimeout(function(){this.textContent=\'Add\';}.bind(this),1800)">Add</button>' +
            '</div></div>';
    });
    rgEl.innerHTML = rHtml;
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