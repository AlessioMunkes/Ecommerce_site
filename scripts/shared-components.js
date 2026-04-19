/* ==========================================================
   ROOTS — shared-components.js
   React 18 + Tailwind (CDN). No build step required.
   Loaded on every page before page-specific scripts.
   Exposes: RootsStore.StoreProvider, RootsStore.useStore
            RootsComponents.Navbar, Footer, LowDataToggle, ScrollGradient
   ========================================================== */

var useState      = React.useState;
var useEffect     = React.useEffect;
var useReducer    = React.useReducer;
var createContext = React.createContext;
var useContext    = React.useContext;
var e             = React.createElement;

/* ----------------------------------------------------------
   STORE — cart + wishlist via React context + localStorage
---------------------------------------------------------- */
var StoreContext = createContext(null);

function storeReducer(state, action) {
  function saveLS(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(err) {}
  }

  switch (action.type) {
    case 'INIT':
      return action.payload;

    case 'CART_ADD': {
      var existing = null;
      for (var i = 0; i < state.cart.length; i++) {
        if (state.cart[i].id === action.item.id) { existing = state.cart[i]; break; }
      }
      var cart = existing
        ? state.cart.map(function(it) { return it.id === action.item.id ? Object.assign({}, it, { qty: it.qty + action.qty }) : it; })
        : state.cart.concat([Object.assign({}, action.item, { qty: action.qty })]);
      saveLS('roots-cart', cart);
      return Object.assign({}, state, { cart: cart });
    }

    case 'CART_REMOVE': {
      var cart = state.cart.filter(function(it) { return it.id !== action.id; });
      saveLS('roots-cart', cart);
      return Object.assign({}, state, { cart: cart });
    }

    case 'CART_SET_QTY': {
      var cart = state.cart.map(function(it) { return it.id === action.id ? Object.assign({}, it, { qty: Math.max(1, action.qty) }) : it; });
      saveLS('roots-cart', cart);
      return Object.assign({}, state, { cart: cart });
    }

    case 'CART_CLEAR':
      saveLS('roots-cart', []);
      return Object.assign({}, state, { cart: [] });

    case 'WISH_TOGGLE': {
      var exists = false;
      for (var i = 0; i < state.wishlist.length; i++) {
        if (state.wishlist[i].id === action.item.id) { exists = true; break; }
      }
      var wishlist = exists
        ? state.wishlist.filter(function(it) { return it.id !== action.item.id; })
        : state.wishlist.concat([action.item]);
      saveLS('roots-wishlist', wishlist);
      return Object.assign({}, state, { wishlist: wishlist });
    }

    case 'WISH_REMOVE': {
      var wishlist = state.wishlist.filter(function(it) { return it.id !== action.id; });
      saveLS('roots-wishlist', wishlist);
      return Object.assign({}, state, { wishlist: wishlist });
    }

    default:
      return state;
  }
}

function StoreProvider(props) {
  var result    = useReducer(storeReducer, { cart: [], wishlist: [] });
  var state     = result[0];
  var dispatch  = result[1];

  useEffect(function() {
    function load(key) {
      try { return JSON.parse(localStorage.getItem(key)) || []; } catch(err) { return []; }
    }
    dispatch({ type: 'INIT', payload: { cart: load('roots-cart'), wishlist: load('roots-wishlist') } });
  }, []);

  var api = {
    cart:        state.cart,
    wishlist:    state.wishlist,
    cartCount:   state.cart.reduce(function(s, i) { return s + i.qty; }, 0),
    cartTotal:   state.cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0),
    addToCart:           function(item, qty) { dispatch({ type: 'CART_ADD',     item: item, qty: qty || 1 }); },
    removeFromCart:      function(id)        { dispatch({ type: 'CART_REMOVE',  id: id }); },
    setQty:              function(id, qty)   { dispatch({ type: 'CART_SET_QTY', id: id, qty: qty }); },
    clearCart:           function()          { dispatch({ type: 'CART_CLEAR' }); },
    toggleWishlist:      function(item)      { dispatch({ type: 'WISH_TOGGLE', item: item }); },
    removeFromWishlist:  function(id)        { dispatch({ type: 'WISH_REMOVE', id: id }); },
    isInWishlist:        function(id)        { return state.wishlist.some(function(i) { return i.id === id; }); },
    isInCart:            function(id)        { return state.cart.some(function(i) { return i.id === id; }); },
  };

  return e(StoreContext.Provider, { value: api }, props.children);
}

function useStore() {
  return useContext(StoreContext);
}

/* ----------------------------------------------------------
   ICONS
---------------------------------------------------------- */
function CartIcon() {
  return e('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    fill: 'none', 
    viewBox: '0 0 24 24', 
    strokeWidth: 1.5, 
    stroke: 'currentColor', 
    className: 'w-6 h-6' 
  },
    e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z' })
  );
}

function WishlistIcon() {
  return e('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    fill: 'none', 
    viewBox: '0 0 24 24', 
    strokeWidth: 1.5, 
    stroke: 'currentColor', 
    className: 'w-6 h-6' 
  },
    e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' })
  );
}

/* ----------------------------------------------------------
   NAVBAR
---------------------------------------------------------- */
var NAV_LINKS = [
  { href: 'index.html',            label: 'Home' },
  { href: 'produce_products.html', label: 'Products' },
  { href: 'newsletter.html',       label: 'Newsletter' },
  { href: 'about_us.html',         label: 'About Us' },
  { href: 'contact_us.html',       label: 'Contact' },
];

function Navbar() {
  var openState  = useState(false);
  var open       = openState[0];
  var setOpen    = openState[1];
  var store      = useStore();
  var cartCount  = store.cartCount;
  var wishlist   = store.wishlist;
  var current    = window.location.pathname.split('/').pop() || 'index.html';

  return e('header', { className: 'fixed top-0 left-0 right-0 z-50 bg-parchment-50/90 backdrop-blur-md shadow-sm border-b border-soil-600/10' },
    /* Main bar */
    e('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4' },
      /* Brand */
      e('a', { href: 'index.html', className: 'text-2xl font-black tracking-tight shrink-0 font-sans' },
        e('span', { className: 'text-bark-800' }, 'Roots'),
        e('span', { className: 'text-moss-600' }, '.')
      ),

      /* Desktop links */
      e('nav', { className: 'hidden md:flex items-center gap-1' },
        NAV_LINKS.map(function(link) {
          var isActive = current === link.href;
          return e('a', {
            key: link.href,
            href: link.href,
            className: 'px-3 py-2 rounded-lg text-sm font-bold font-sans uppercase tracking-widest transition-colors ' +
              (isActive ? 'bg-moss-50 text-moss-700' : 'text-soil-700 hover:text-moss-600 hover:bg-soil-600/5')
          }, link.label);
        })
      ),

      /* Right icons & mobile toggle */
      e('div', { className: 'flex items-center gap-1 sm:gap-2' },

        /* Wishlist */
        e('a', {
          href: 'wishlist.html',
          className: 'relative p-2 rounded-xl text-soil-600 hover:text-yellow-500 hover:bg-soil-600/5 transition-colors'
        },
          e(WishlistIcon, null),
          wishlist.length > 0 && e('span', {
            className: 'absolute -top-0.5 -right-0.5 bg-yellow-400 border border-yellow-500 text-yellow-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center font-sans shadow-sm'
          }, wishlist.length)
        ),

        /* Cart */
        e('a', {
          href: 'cart.html',
          className: 'relative p-2 rounded-xl text-soil-600 hover:text-moss-600 hover:bg-moss-50 transition-colors'
        },
          e(CartIcon, null),
          cartCount > 0 && e('span', {
            className: 'absolute -top-0.5 -right-0.5 bg-moss-600 border border-moss-700 text-parchment-50 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center font-sans shadow-sm'
          }, cartCount > 9 ? '9+' : cartCount)
        ),

        /* Hamburger */
        e('button', {
          className: 'md:hidden p-2.5 rounded-lg text-soil-600 hover:text-moss-600 hover:bg-moss-50 transition-colors',
          onClick: function() { setOpen(!open); },
          'aria-label': 'Toggle menu'
        }, open ? 'X' : '☰')
      )
    ),

    /* Mobile menu */
    open && e('div', {
      className: 'md:hidden border-t border-soil-600/10 bg-parchment-50/95 backdrop-blur-md px-4 pb-4 pt-2'
    },
      NAV_LINKS.map(function(link) {
        var isActive = current === link.href;
        return e('a', {
          key: link.href,
          href: link.href,
          onClick: function() { setOpen(false); },
          className: 'block px-3 py-3 rounded-lg text-sm font-bold font-sans uppercase tracking-widest mb-1 transition-colors ' +
            (isActive ? 'bg-moss-50 text-moss-700' : 'text-soil-700 hover:text-moss-600 hover:bg-soil-600/5')
        }, link.label);
      })
    )
  );
}

/* ----------------------------------------------------------
   FOOTER
---------------------------------------------------------- */
function Footer() {
  var shopLinks = [
    ['Fresh Produce',  'produce_products.html'],
    ['Equipment',      'produce_products.html?filter=equipment'],
    ['Seeds',          'produce_products.html?filter=seeds'],
  ];
  var infoLinks = [
    ['About Us',        'about_us.html'],
    ['Newsletter',      'newsletter.html'],
    ['Contact',         'contact_us.html'],
    ['Become a Seller', 'contact_us.html#become-a-seller'],
  ];

  return e('footer', { className: 'bg-bark-900 text-parchment-100 mt-20 pt-16' },
    e('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10' },
      e('div', null,
        e('span', { className: 'text-3xl font-black font-sans tracking-tight' },
          e('span', { className: 'text-parchment-50' }, 'Roots'),
          e('span', { className: 'text-moss-400' }, '.')
        ),
        e('p', { className: 'mt-4 text-[15px] text-parchment-200/70 leading-relaxed font-serif' },
          'Rooted in community. Growing together. Every purchase supports township farmers directly.'
        )
      ),
      e('div', null,
        e('h4', { className: 'text-[11px] font-bold text-parchment-200/50 font-sans uppercase tracking-widest mb-4' }, 'Shop'),
        e('div', { className: 'flex flex-col gap-3' },
          shopLinks.map(function(item) {
            return e('a', { key: item[0], href: item[1], className: 'text-[14px] text-parchment-200 hover:text-moss-400 transition-colors font-sans' }, item[0]);
          })
        )
      ),
      e('div', null,
        e('h4', { className: 'text-[11px] font-bold text-parchment-200/50 font-sans uppercase tracking-widest mb-4' }, 'Info'),
        e('div', { className: 'flex flex-col gap-3' },
          infoLinks.map(function(item) {
            return e('a', { key: item[0], href: item[1], className: 'text-[14px] text-parchment-200 hover:text-moss-400 transition-colors font-sans' }, item[0]);
          })
        )
      )
    ),
    e('div', { className: 'border-t border-parchment-200/10 px-4 py-6 text-center text-[12px] text-parchment-200/50 font-sans' },
      '© 2026 Roots Collective. Built with care for township communities.'
    )
  );
}

/* ----------------------------------------------------------
   LOW DATA TOGGLE
---------------------------------------------------------- */
function LowDataToggle() {
  var onState  = useState(false);
  var on       = onState[0];
  var setOn    = onState[1];

  useEffect(function() {
    var saved = localStorage.getItem('roots-low-data') === 'on';
    setOn(saved);
    if (saved) document.body.classList.add('low-data');
  }, []);

  function toggle() {
    var next = !on;
    setOn(next);
    localStorage.setItem('roots-low-data', next ? 'on' : 'off');
    document.body.classList.toggle('low-data', next);
  }

  return e('button', {
    onClick: toggle,
    className: 'fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full border backdrop-blur-sm shadow-xl transition-all font-sans ' +
      (on ? 'bg-moss-50 border-moss-400/50' : 'bg-parchment-50 border-soil-600/15 hover:border-moss-400/30'),
    title: 'Toggle Low Data Mode'
  },
    e('span', { className: 'text-[11px] font-black ' + (on ? 'text-moss-600' : 'text-soil-500') }, 'LD'),
    e('span', { className: 'text-[11px] font-bold uppercase tracking-widest ' + (on ? 'text-moss-600' : 'text-soil-500') }, 'Low Data'),
// The Toggle Track
    e('div', {
      className: 'w-8 h-4 rounded-full relative transition-colors ' +
        (on ? 'bg-moss-300 border border-moss-500' : 'bg-soil-300 border border-soil-400') // Darkened the track
    },
      // The Toggle Thumb (the circle)
      e('div', {
        className: 'absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm ' +
          (on ? 'left-4 bg-moss-800' : 'left-0.5 bg-soil-700') // Darkened the thumb
      })
    )
  );
}

/* ----------------------------------------------------------
   SCROLL GRADIENT
---------------------------------------------------------- */
// Disabling gradient effect for the light parchment theme so the background stays solid.
function ScrollGradient() {
  return null;
}

/* ----------------------------------------------------------
   EXPOSE globals for use in page scripts
---------------------------------------------------------- */
window.RootsStore = {
  StoreProvider: StoreProvider,
  useStore:      useStore,
};

window.RootsComponents = {
  Navbar:         Navbar,
  Footer:         Footer,
  LowDataToggle:  LowDataToggle,
  ScrollGradient: ScrollGradient,
};