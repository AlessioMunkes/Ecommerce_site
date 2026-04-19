/* ==========================================================
   ROOTS — checkout.js
   localStorage cart helpers + full multi-step checkout logic.
   Loaded only on checkout.html (after shared-components.js).
   ========================================================== */

/* ----------------------------------------------------------
   LOCALSTORAGE HELPERS
---------------------------------------------------------- */
function getCart()              { return JSON.parse(localStorage.getItem('roots-cart'))     || []; }
function getWishlist()          { return JSON.parse(localStorage.getItem('roots-wishlist')) || []; }
function saveCart(cart)         { localStorage.setItem('roots-cart',     JSON.stringify(cart)); }
function saveWishlist(wishlist) { localStorage.setItem('roots-wishlist', JSON.stringify(wishlist)); }

/* ----------------------------------------------------------
   CHECKOUT STATE
---------------------------------------------------------- */
var DELIVERY_FEE = 80;
var currentStep  = 1;
var activePayTab = 'card';
var activeWallet = 'snapscan';
var orderRef     = '';

/* ----------------------------------------------------------
   INIT
---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
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

/* ----------------------------------------------------------
   STEP NAVIGATION
---------------------------------------------------------- */
function goToStep(n) {
    document.querySelectorAll('.checkout-step').forEach(function (s) { s.classList.remove('active'); });
    var stepEl = document.getElementById('step' + n);
    if (stepEl) stepEl.classList.add('active');

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

/* ----------------------------------------------------------
   RENDER ORDER SUMMARY (step 1)
---------------------------------------------------------- */
function renderOrderSummary() {
    var cart      = getCart();
    var container = document.getElementById('orderItems');
    var totalsEl  = document.getElementById('orderTotals');
    if (!container || !totalsEl) return;

    var subtotal = 0;
    var html = '';
    cart.forEach(function (item) {
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
        '<div class="flex justify-between text-white font-black text-base border-t border-white/10 pt-3 mt-2"><span>Total</span><span class="text-green-400">R' + total.toFixed(2) + '</span></div>';
}

/* ----------------------------------------------------------
   MINI TOTAL (steps 2 & 3)
---------------------------------------------------------- */
function updateMiniTotals() {
    var cart         = getCart();
    var subtotal     = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var fulfilmentEl = document.querySelector('input[name="fulfilment"]:checked');
    var isDeliver    = fulfilmentEl && fulfilmentEl.value === 'deliver';
    var delivery     = isDeliver ? DELIVERY_FEE : 0;
    var total        = subtotal + delivery;

    var html =
        '<div class="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span>R' + subtotal.toFixed(2) + '</span></div>' +
        '<div class="flex justify-between text-sm text-gray-400"><span>Delivery</span><span>' + (delivery === 0 ? 'Free' : 'R' + delivery.toFixed(2)) + '</span></div>' +
        '<div class="flex justify-between text-white font-black border-t border-white/10 pt-3 mt-2"><span>Order Total</span><span class="text-green-400">R' + total.toFixed(2) + '</span></div>';

    var d = document.getElementById('deliveryMiniTotal');
    var p = document.getElementById('paymentMiniTotal');
    if (d) d.innerHTML = html;
    if (p) p.innerHTML = html;
}

/* ----------------------------------------------------------
   FULFILMENT TOGGLE
---------------------------------------------------------- */
function switchFulfilment() {
    var isDeliver = document.getElementById('opt-deliver') && document.getElementById('opt-deliver').checked;

    var df = document.getElementById('deliveryForm');
    var ci = document.getElementById('collectInfo');
    if (df) { df.style.display = isDeliver ? 'block' : 'none'; df.classList.toggle('hidden', !isDeliver); }
    if (ci) { ci.style.display = isDeliver ? 'none'  : 'block'; ci.classList.toggle('hidden', isDeliver); }

    var lc = document.getElementById('label-collect');
    var ld = document.getElementById('label-deliver');
    if (lc) {
        lc.className = lc.className.replace('border-green-400 bg-green-400/5', 'border-white/15 bg-white/5');
        if (!isDeliver) { lc.className = lc.className.replace('border-white/15 bg-white/5', 'border-green-400 bg-green-400/5'); }
    }
    if (ld) {
        ld.className = ld.className.replace('border-green-400 bg-green-400/5', 'border-white/15 bg-white/5');
        if (isDeliver) { ld.className = ld.className.replace('border-white/15 bg-white/5', 'border-green-400 bg-green-400/5'); }
    }

    updateMiniTotals();
    renderOrderSummary();
}

document.addEventListener('DOMContentLoaded', function () {
    var lc = document.getElementById('label-collect');
    if (lc) lc.classList.add('selected');
});

/* ----------------------------------------------------------
   VALIDATION HELPERS
---------------------------------------------------------- */
function setError(id, msg) {
    var el = document.getElementById(id);
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
    var el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = '';
    var err = el.parentElement.querySelector('.field-error');
    if (err) err.remove();
}

function clearAll(ids) { ids.forEach(clearError); }

function isEmpty(id) {
    var el = document.getElementById(id);
    return !el || !el.value.trim();
}

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidPhone(v) { return /^[\d\s+()-]{7,15}$/.test(v.trim()); }

/* ----------------------------------------------------------
   VALIDATE STEP 2 — DELIVERY
---------------------------------------------------------- */
function validateDelivery() {
    var ids = ['firstName', 'lastName', 'email', 'phone'];
    clearAll(ids);
    var ok = true;

    if (isEmpty('firstName')) { setError('firstName', 'First name is required'); ok = false; }
    if (isEmpty('lastName'))  { setError('lastName',  'Last name is required');  ok = false; }

    var emailEl = document.getElementById('email');
    var email   = emailEl ? emailEl.value.trim() : '';
    if (!email)                   { setError('email', 'Email is required');                  ok = false; }
    else if (!isValidEmail(email)) { setError('email', 'Enter a valid email address');         ok = false; }

    var phoneEl = document.getElementById('phone');
    var phone   = phoneEl ? phoneEl.value.trim() : '';
    if (!phone)                   { setError('phone', 'Phone number is required');            ok = false; }
    else if (!isValidPhone(phone)) { setError('phone', 'Enter a valid phone number');          ok = false; }

    if (document.getElementById('opt-deliver') && document.getElementById('opt-deliver').checked) {
        var dIds = ['street', 'suburb', 'city', 'province', 'postalCode'];
        clearAll(dIds);
        if (isEmpty('street'))   { setError('street',   'Street address is required'); ok = false; }
        if (isEmpty('suburb'))   { setError('suburb',   'Suburb is required');          ok = false; }
        if (isEmpty('city'))     { setError('city',     'City is required');            ok = false; }

        var provEl = document.getElementById('province');
        if (!provEl || !provEl.value) { setError('province', 'Select a province'); ok = false; }

        var pc = document.getElementById('postalCode') ? document.getElementById('postalCode').value.trim() : '';
        if (!pc)                         { setError('postalCode', 'Postal code is required');          ok = false; }
        else if (!/^\d{4}$/.test(pc))    { setError('postalCode', 'Enter a 4-digit postal code');     ok = false; }
    }

    if (ok) goToStep(3);
}

/* ----------------------------------------------------------
   PAYMENT TAB SWITCH
---------------------------------------------------------- */
function switchPayTab(tab, btn) {
    activePayTab = tab;
    var tabBtns = ['tab-card-btn', 'tab-eft-btn', 'tab-wallet-btn'];
    tabBtns.forEach(function (id) {
        var b = document.getElementById(id);
        if (!b) return;
        b.className = b.className.replace('bg-green-800/60 border-green-400 text-green-400', 'bg-white/5 border-white/15 text-gray-400 hover:text-gray-200');
    });
    if (btn) {
        btn.className = btn.className.replace('bg-white/5 border-white/15 text-gray-400 hover:text-gray-200', 'bg-green-800/60 border-green-400 text-green-400');
    }
    document.querySelectorAll('.pay-panel').forEach(function (p) { p.classList.remove('active'); });
    var panel = document.getElementById('pay-' + tab);
    if (panel) panel.classList.add('active');
}

/* ----------------------------------------------------------
   CARD NUMBER / EXPIRY FORMATTING
---------------------------------------------------------- */
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

/* ----------------------------------------------------------
   WALLET SELECTOR
---------------------------------------------------------- */
function selectWallet(el, name) {
    activeWallet = name;
    var walletIds = ['wallet-snapscan', 'wallet-ozow', 'wallet-zapper'];
    walletIds.forEach(function (id) {
        var w = document.getElementById(id);
        if (!w) return;
        w.className = w.className.replace('border-green-400 bg-green-400/5', 'border-white/15 bg-white/5');
    });
    el.className = el.className.replace('border-white/15 bg-white/5', 'border-green-400 bg-green-400/5');
    var ql = document.getElementById('qrLabel');
    if (ql) ql.textContent = 'Scan with ' + name.charAt(0).toUpperCase() + name.slice(1) + ' to pay';
}

/* ----------------------------------------------------------
   FAKE QR CODE GENERATOR
---------------------------------------------------------- */
function generateQR() {
    var grid = document.getElementById('qrGrid');
    if (!grid) return;
    var html = '';
    for (var i = 0; i < 100; i++) {
        html += '<div class="qr-cell ' + (Math.random() > 0.5 ? 'filled' : '') + '"></div>';
    }
    grid.innerHTML = html;
    var corners = [0, 9, 90];
    corners.forEach(function (idx) {
        for (var r = 0; r < 3; r++) {
            for (var c = 0; c < 3; c++) {
                var cell = grid.children[idx + r * 10 + c];
                if (cell) { cell.classList.add('filled'); cell.classList.add('marker'); }
            }
        }
    });
}

/* ----------------------------------------------------------
   VALIDATE STEP 3 — PAYMENT
---------------------------------------------------------- */
function validatePayment() {
    if (activePayTab === 'card') {
        var ids = ['cardName', 'cardNumber', 'cardExpiry', 'cardCVV'];
        clearAll(ids);
        var ok = true;

        if (isEmpty('cardName')) { setError('cardName', 'Name on card is required'); ok = false; }

        var numEl = document.getElementById('cardNumber');
        var num   = numEl ? numEl.value.replace(/\s/g, '') : '';
        if (!num)             { setError('cardNumber', 'Card number is required');                  ok = false; }
        else if (num.length !== 16) { setError('cardNumber', 'Enter a valid 16-digit card number'); ok = false; }

        var expEl = document.getElementById('cardExpiry');
        var exp   = expEl ? expEl.value : '';
        if (!exp) { setError('cardExpiry', 'Expiry date is required'); ok = false; }
        else {
            var parts   = exp.split('/');
            var mm      = parts[0];
            var yy      = parts[1];
            var now     = new Date();
            var expDate = new Date(2000 + parseInt(yy, 10), parseInt(mm, 10) - 1);
            if (!mm || !yy || expDate < now) { setError('cardExpiry', 'Card has expired or date is invalid'); ok = false; }
        }

        var cvvEl = document.getElementById('cardCVV');
        var cvv   = cvvEl ? cvvEl.value : '';
        if (!cvv)                       { setError('cardCVV', 'CVV is required');                     ok = false; }
        else if (!/^\d{3,4}$/.test(cvv)) { setError('cardCVV', 'Enter a valid 3 or 4-digit CVV');    ok = false; }

        if (!ok) return;
    }

    goToStep(4);
}

/* ----------------------------------------------------------
   RENDER REVIEW (step 4)
---------------------------------------------------------- */
function renderReview() {
    var cart      = getCart();
    var isDeliver = document.getElementById('opt-deliver') && document.getElementById('opt-deliver').checked;
    var subtotal  = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var delivery  = isDeliver ? DELIVERY_FEE : 0;
    var total     = subtotal + delivery;

    // Items
    var riEl = document.getElementById('reviewItems');
    if (riEl) {
        var riHtml = '';
        cart.forEach(function (item) {
            riHtml += '<div class="flex justify-between px-4 py-2.5 text-sm text-gray-300 border-b border-white/5">' +
                '<span>' + item.name + ' x' + item.qty + '</span>' +
                '<span class="text-white font-semibold">R' + (item.price * item.qty).toFixed(2) + '</span></div>';
        });
        riEl.innerHTML = riHtml;
    }

    // Delivery
    var rl = '<div class="flex justify-between px-4 py-2.5 text-sm border-b border-white/5">';
    var rs = '<span class="text-gray-400">';
    var rv = '</span><span class="text-white font-semibold">';
    var re = '</span></div>';
    function rlRow(label, val) { return rl + rs + label + rv + val + re; }

    var deliveryHTML = '';
    if (isDeliver) {
        deliveryHTML =
            rlRow('Method',      'Home Delivery (+R' + DELIVERY_FEE + ')') +
            rlRow('Address',     (document.getElementById('street')     ? document.getElementById('street').value     : '')) +
            rlRow('Suburb/City', (document.getElementById('suburb')     ? document.getElementById('suburb').value     : '') + ', ' +
                                 (document.getElementById('city')       ? document.getElementById('city').value       : '')) +
            rlRow('Province',    (document.getElementById('province')   ? document.getElementById('province').value   : '') + ', ' +
                                 (document.getElementById('postalCode') ? document.getElementById('postalCode').value : ''));
    } else {
        deliveryHTML =
            rlRow('Method',  'Collection (Free)') +
            rlRow('Address', '12 Harvest Road, Khayelitsha, CT');
    }
    deliveryHTML +=
        rlRow('Contact', (document.getElementById('firstName') ? document.getElementById('firstName').value : '') + ' ' +
                         (document.getElementById('lastName')  ? document.getElementById('lastName').value  : '')) +
        rlRow('Email',   (document.getElementById('email')     ? document.getElementById('email').value     : ''));

    var rdEl = document.getElementById('reviewDelivery');
    if (rdEl) rdEl.innerHTML = deliveryHTML;

    // Payment
    var payHTML = '';
    if (activePayTab === 'card') {
        var numEl  = document.getElementById('cardNumber');
        var num    = numEl ? numEl.value : '';
        var last4  = num.replace(/\s/g, '').substr(-4);
        payHTML =
            rlRow('Method', 'Credit / Debit Card') +
            rlRow('Card',   '.... .... .... ' + last4) +
            rlRow('Name',   document.getElementById('cardName') ? document.getElementById('cardName').value : '');
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
        '<div class="flex justify-between text-white font-black text-base border-t border-white/10 pt-3 mt-2"><span>Total to Pay</span><span class="text-green-400">R' + total.toFixed(2) + '</span></div>';
}

/* ----------------------------------------------------------
   PLACE ORDER
---------------------------------------------------------- */
function placeOrder() {
    var termsCheck = document.getElementById('termsCheck');
    if (!termsCheck || !termsCheck.checked) {
        var existing = document.querySelector('.terms-error');
        if (!existing) {
            var span = document.createElement('span');
            span.className   = 'terms-error field-error block text-red-400 text-xs mt-1 mb-3';
            span.textContent = 'Please accept the terms and conditions to continue';
            var termsLabel = document.querySelector('label[for="termsCheck"]');
            if (termsLabel) { termsLabel.after(span); }
            else { termsCheck.parentElement.after(span); }
        }
        return;
    }

    var btn = document.getElementById('placeOrderBtn');
    if (btn) {
        btn.textContent = 'Processing...';
        btn.disabled    = true;
        btn.classList.add('opacity-60', 'cursor-not-allowed');
    }

    setTimeout(function () {
        var isDeliver = document.getElementById('opt-deliver') && document.getElementById('opt-deliver').checked;
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
