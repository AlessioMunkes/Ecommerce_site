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

  return e('header', { className: 'sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10' },
    /* Main bar */
    e('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4' },
      /* Brand */
      e('a', { href: 'index.html', className: 'text-xl font-black tracking-tight shrink-0' },
        e('span', { className: 'text-white' }, 'Roots'),
        e('span', { className: 'text-green-400' }, '.')
      ),

      /* Desktop links */
      e('nav', { className: 'hidden md:flex items-center gap-1' },
        NAV_LINKS.map(function(link) {
          var isActive = current === link.href;
          return e('a', {
            key: link.href,
            href: link.href,
            className: 'px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
              (isActive ? 'bg-green-800/60 text-green-400' : 'text-gray-300 hover:text-white hover:bg-white/10')
          }, link.label);
        })
      ),

      /* Right icons */
      e('div', { className: 'flex items-center gap-1' },

        /* Wishlist */
        e('a', {
          href: 'wishlist.html',
          className: 'relative p-2.5 rounded-lg text-gray-300 hover:text-yellow-400 hover:bg-white/10 transition-colors'
        },
          e('span', { className: 'text-base leading-none font-bold', 'aria-label': 'Wishlist' }, '[ ]'),
          wishlist.length > 0 && e('span', {
            className: 'absolute -top-0.5 -right-0.5 bg-yellow-400 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center'
          }, wishlist.length)
        ),

        /* Cart */
        e('a', {
          href: 'cart.html',
          className: 'relative p-2.5 rounded-lg text-gray-300 hover:text-green-400 hover:bg-white/10 transition-colors'
        },
          e('span', { className: 'text-base leading-none font-bold', 'aria-label': 'Cart' }, '[C]'),
          cartCount > 0 && e('span', {
            className: 'absolute -top-0.5 -right-0.5 bg-green-400 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center'
          }, cartCount > 9 ? '9+' : cartCount)
        ),

        /* Hamburger */
        e('button', {
          className: 'md:hidden p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors',
          onClick: function() { setOpen(!open); },
          'aria-label': 'Toggle menu'
        }, open ? 'X' : '=')
      )
    ),

    /* Mobile menu */
    open && e('div', {
      className: 'md:hidden border-t border-white/10 bg-black/70 backdrop-blur-md px-4 pb-4 pt-2'
    },
      NAV_LINKS.map(function(link) {
        var isActive = current === link.href;
        return e('a', {
          key: link.href,
          href: link.href,
          onClick: function() { setOpen(false); },
          className: 'block px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ' +
            (isActive ? 'bg-green-800/60 text-green-400' : 'text-gray-300 hover:text-white hover:bg-white/10')
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

  return e('footer', { className: 'border-t border-white/10 bg-black/20 mt-20' },
    e('div', { className: 'max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8' },
      e('div', null,
        e('span', { className: 'text-xl font-black' },
          e('span', { className: 'text-white' }, 'Roots'),
          e('span', { className: 'text-green-400' }, '.')
        ),
        e('p', { className: 'mt-2 text-sm text-gray-400 leading-relaxed' },
          'Rooted in community. Growing together. Every purchase supports township farmers directly.'
        )
      ),
      e('div', null,
        e('h4', { className: 'text-xs font-bold text-gray-400 uppercase tracking-widest mb-3' }, 'Shop'),
        e('div', { className: 'flex flex-col gap-2' },
          shopLinks.map(function(item) {
            return e('a', { key: item[0], href: item[1], className: 'text-sm text-gray-300 hover:text-green-400 transition-colors' }, item[0]);
          })
        )
      ),
      e('div', null,
        e('h4', { className: 'text-xs font-bold text-gray-400 uppercase tracking-widest mb-3' }, 'Info'),
        e('div', { className: 'flex flex-col gap-2' },
          infoLinks.map(function(item) {
            return e('a', { key: item[0], href: item[1], className: 'text-sm text-gray-300 hover:text-green-400 transition-colors' }, item[0]);
          })
        )
      )
    ),
    e('div', { className: 'border-t border-white/10 px-4 py-4 text-center text-xs text-gray-500' },
      '2026 Roots Collective. Built with care for township communities.'
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
    className: 'fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-full border backdrop-blur-sm shadow-xl transition-all ' +
      (on ? 'bg-green-900/80 border-green-400/50' : 'bg-black/70 border-white/15 hover:border-green-400/30'),
    title: 'Toggle Low Data Mode'
  },
    e('span', { className: 'text-xs font-black ' + (on ? 'text-green-400' : 'text-gray-500') }, 'LD'),
    e('span', { className: 'text-xs font-bold uppercase tracking-wide ' + (on ? 'text-green-400' : 'text-gray-400') }, 'Low Data'),
    e('div', {
      className: 'w-8 h-4 rounded-full relative transition-colors ' +
        (on ? 'bg-green-400/30 border border-green-400' : 'bg-white/10 border border-white/20')
    },
      e('div', {
        className: 'absolute top-0.5 w-3 h-3 rounded-full transition-all ' +
          (on ? 'left-4 bg-green-400' : 'left-0.5 bg-gray-500')
      })
    )
  );
}

/* ----------------------------------------------------------
   SCROLL GRADIENT
---------------------------------------------------------- */
function ScrollGradient() {
  useEffect(function() {
    function handler() {
      if (document.body.classList.contains('low-data')) return;
      var max = document.body.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      document.body.style.backgroundPosition = '0% ' + ((window.scrollY / max) * 100) + '%';
    }
    window.addEventListener('scroll', handler, { passive: true });
    return function() { window.removeEventListener('scroll', handler); };
  }, []);
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
