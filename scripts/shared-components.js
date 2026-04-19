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
   NAVBAR  — parchment / organic theme
---------------------------------------------------------- */
var NAV_LINKS = [
  { href: 'index.html',            label: 'Home' },
  { href: 'produce_products.html', label: 'Products' },
  { href: 'newsletter.html',       label: 'Newsletter' },
  { href: 'about_us.html',         label: 'About Us' },
  { href: 'contact_us.html',       label: 'Contact' },
];

function Navbar() {
  var openState = useState(false);
  var open      = openState[0];
  var setOpen   = openState[1];
  var store     = useStore();
  var cartCount = store.cartCount;
  var wishlist  = store.wishlist;
  var current   = window.location.pathname.split('/').pop() || 'index.html';

  var navStyle = {
    position: 'sticky', top: 0, zIndex: 50,
    background: 'rgba(247,238,216,0.92)',
    borderBottom: '1px solid rgba(92,61,30,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };
  var innerStyle = { maxWidth:'1280px', margin:'0 auto', padding:'0 20px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px' };

  function linkClass(href) {
    var base = 'px-3 py-1.5 rounded-full text-sm font-medium transition-colors ';
    return href === current
      ? base + 'bg-moss-600/12 text-moss-700'
      : base + 'text-bark-700 hover:bg-bark-700/8 hover:text-bark-900';
  }

  return e('header', { style: navStyle },
    e('div', { style: innerStyle },

      /* Brand */
      e('a', { href: 'index.html', style: { textDecoration:'none', display:'flex', alignItems:'center', gap:'2px', flexShrink:0 } },
        e('span', { style: { fontFamily:"'Caveat',cursive", fontSize:'26px', fontWeight:700, color:'#3d2810', lineHeight:1 } }, 'Roots'),
        e('span', { style: { fontFamily:"'Caveat',cursive", fontSize:'26px', fontWeight:700, color:'#4a7c35', lineHeight:1 } }, '.')
      ),

      /* Desktop links */
      e('nav', { style: { display:'none', gap:'2px' }, className: 'hidden md:flex items-center' },
        NAV_LINKS.map(function(link) {
          var isActive = current === link.href;
          return e('a', {
            key: link.href, href: link.href,
            style: {
              padding: '7px 14px',
              borderRadius: '50px',
              fontSize: '14px',
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: 500,
              textDecoration: 'none',
              color: isActive ? '#345c24' : '#6b4a28',
              background: isActive ? 'rgba(74,124,53,0.1)' : 'transparent',
              transition: 'all 0.15s',
            }
          }, link.label);
        })
      ),

      /* Right icons */
      e('div', { style: { display:'flex', alignItems:'center', gap:'4px' } },

        /* Wishlist */
        e('a', { href: 'wishlist.html', style: { position:'relative', padding:'8px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b4a28', textDecoration:'none', background:'transparent', transition:'background 0.15s' } },
          e('span', { style: { fontSize:'18px', lineHeight:1, fontFamily:"'Lora',serif" } }, '\u2605'),
          wishlist.length > 0 && e('span', {
            style: { position:'absolute', top:0, right:0, background:'#b45309', color:'#fdf8f0', fontSize:'9px', fontWeight:700, width:'16px', height:'16px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif" }
          }, wishlist.length)
        ),

        /* Cart */
        e('a', { href: 'cart.html', style: { position:'relative', padding:'8px 10px', borderRadius:'50px', display:'flex', alignItems:'center', gap:'5px', color:'#fdf8f0', textDecoration:'none', background:'linear-gradient(135deg,#345c24,#4a7c35)', fontSize:'13px', fontFamily:"'DM Sans',sans-serif", fontWeight:600, boxShadow:'0 2px 8px rgba(52,92,36,0.22)', transition:'transform 0.15s' } },
          e('span', null, 'Cart'),
          cartCount > 0 && e('span', {
            style: { background:'rgba(253,248,240,0.25)', borderRadius:'50px', padding:'1px 7px', fontSize:'11px', fontWeight:700 }
          }, cartCount > 9 ? '9+' : cartCount)
        ),

        /* Hamburger */
        e('button', {
          style: { display:'flex', flexDirection:'column', gap:'5px', cursor:'pointer', padding:'6px', background:'none', border:'none', marginLeft:'4px' },
          onClick: function() { setOpen(!open); },
          'aria-label': 'Toggle menu',
          className: 'md:hidden'
        },
          e('span', { style: { display:'block', width:'22px', height:'2px', background:'#3d2810', borderRadius:'2px', transition:'all 0.25s', transform: open ? 'translateY(7px) rotate(45deg)' : 'none' } }),
          e('span', { style: { display:'block', width:'22px', height:'2px', background:'#3d2810', borderRadius:'2px', transition:'all 0.25s', opacity: open ? 0 : 1 } }),
          e('span', { style: { display:'block', width:'22px', height:'2px', background:'#3d2810', borderRadius:'2px', transition:'all 0.25s', transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' } })
        )
      )
    ),

    /* Mobile menu */
    open && e('div', {
      style: { borderTop:'1px solid rgba(92,61,30,0.1)', background:'rgba(247,238,216,0.98)', padding:'12px 20px 20px' },
      className: 'md:hidden'
    },
      NAV_LINKS.map(function(link) {
        var isActive = current === link.href;
        return e('a', {
          key: link.href, href: link.href,
          onClick: function() { setOpen(false); },
          style: {
            display: 'block', padding: '10px 14px', borderRadius: '12px',
            marginBottom: '4px', textDecoration: 'none',
            fontFamily: "'DM Sans',sans-serif", fontSize: '14px', fontWeight: 500,
            color: isActive ? '#345c24' : '#6b4a28',
            background: isActive ? 'rgba(74,124,53,0.1)' : 'transparent',
          }
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

  return e('footer', { style: { background:'#261808', borderTop:'1px solid rgba(122,173,90,0.15)', marginTop:'60px' } },
    e('div', { style: { maxWidth:'1280px', margin:'0 auto', padding:'48px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'32px' } },
      e('div', null,
        e('div', { style: { fontFamily:"'Caveat',cursive", fontSize:'28px', fontWeight:700, marginBottom:'10px' } },
          e('span', { style: { color:'#fdf8f0' } }, 'Roots'),
          e('span', { style: { color:'#7aad5a' } }, '.')
        ),
        e('p', { style: { fontFamily:"'Lora',serif", fontSize:'13px', color:'#c4b49a', lineHeight:'1.7' } },
          'Rooted in community. Growing together. Every purchase supports township farmers directly.'
        )
      ),
      e('div', null,
        e('h4', { style: { fontFamily:"'DM Sans',sans-serif", fontSize:'10px', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'#7aad5a', marginBottom:'14px' } }, 'Shop'),
        e('div', { style: { display:'flex', flexDirection:'column', gap:'10px' } },
          shopLinks.map(function(item) {
            return e('a', { key: item[0], href: item[1], style: { fontFamily:"'Lora',serif", fontSize:'13px', color:'#c4b49a', textDecoration:'none', transition:'color 0.2s' } }, item[0]);
          })
        )
      ),
      e('div', null,
        e('h4', { style: { fontFamily:"'DM Sans',sans-serif", fontSize:'10px', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'#7aad5a', marginBottom:'14px' } }, 'Info'),
        e('div', { style: { display:'flex', flexDirection:'column', gap:'10px' } },
          infoLinks.map(function(item) {
            return e('a', { key: item[0], href: item[1], style: { fontFamily:"'Lora',serif", fontSize:'13px', color:'#c4b49a', textDecoration:'none', transition:'color 0.2s' } }, item[0]);
          })
        )
      )
    ),
    e('div', { style: { borderTop:'1px solid rgba(122,173,90,0.1)', padding:'16px 20px', textAlign:'center', fontFamily:"'DM Sans',sans-serif", fontSize:'11px', color:'rgba(196,180,154,0.5)' } },
      '2026 Roots Collective. Built with care for township communities.'
    )
  );
}

/* ----------------------------------------------------------
   LOW DATA TOGGLE
---------------------------------------------------------- */
function LowDataToggle() {
  var onState = useState(false);
  var on      = onState[0];
  var setOn   = onState[1];

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
    style: {
      position:'fixed', bottom:'20px', right:'20px', zIndex:50,
      display:'flex', alignItems:'center', gap:'10px',
      padding:'10px 16px', borderRadius:'50px',
      background: on ? 'rgba(74,124,53,0.12)' : 'rgba(247,238,216,0.94)',
      border: on ? '1.5px solid rgba(74,124,53,0.35)' : '1.5px solid rgba(92,61,30,0.18)',
      boxShadow: '0 4px 20px rgba(58,35,12,0.12)',
      backdropFilter: 'blur(8px)',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    title: 'Toggle Low Data Mode'
  },
    e('span', { style: { fontFamily:"'DM Sans',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color: on ? '#345c24' : '#8b6340' } }, 'Low Data'),
    e('div', { style: { width:'32px', height:'18px', borderRadius:'50px', position:'relative', background: on ? '#4a7c35' : 'rgba(92,61,30,0.15)', border: on ? 'none' : '1px solid rgba(92,61,30,0.2)', transition:'background 0.2s' } },
      e('div', { style: { position:'absolute', top:'3px', width:'12px', height:'12px', borderRadius:'50%', background: on ? '#fdf8f0' : '#8b6340', left: on ? '17px' : '3px', transition:'left 0.2s' } })
    )
  );
}

/* ----------------------------------------------------------
   SCROLL GRADIENT — not needed on parchment theme,
   but kept for completeness (no-op on non-gradient pages)
---------------------------------------------------------- */
function ScrollGradient() { return null; }

/* ----------------------------------------------------------
   REVEAL — attach IntersectionObserver after mount
---------------------------------------------------------- */
function RevealObserver() {
  useEffect(function() {
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) { entry.target.classList.add('revealed'); io.unobserve(entry.target); }
        });
      }, { threshold: 0.08 });
      reveals.forEach(function(el) { io.observe(el); });
    } else {
      reveals.forEach(function(el) { el.classList.add('revealed'); });
    }
  }, []);
  return null;
}

/* ----------------------------------------------------------
   PARALLAX — panel images + generic parallax
---------------------------------------------------------- */
function ParallaxHandler() {
  useEffect(function() {
    function onScroll() {
      if (document.body.classList.contains('low-data')) return;

      /* Hero bg */
      var heroBg = document.getElementById('heroBg');
      if (heroBg) heroBg.style.transform = 'translateY(' + (window.pageYOffset * 0.38) + 'px)';

      /* Producer section */
      var producerBg  = document.getElementById('producerBg');
      var producerSec = document.getElementById('producerSection');
      if (producerBg && producerSec) {
        var rect   = producerSec.getBoundingClientRect();
        var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * 0.22;
        producerBg.style.transform = 'translateY(' + offset + 'px)';
      }

      /* Panel images */
      document.querySelectorAll('.panel-wrap img[data-parallax]').forEach(function(img) {
        var factor = parseFloat(img.dataset.parallax) || 0.12;
        var wrap   = img.closest('.panel-wrap');
        if (!wrap) return;
        var r  = wrap.getBoundingClientRect();
        var cx = r.top + r.height / 2 - window.innerHeight / 2;
        img.style.transform = 'translateY(' + (cx * factor) + 'px) scale(1.14)';
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    return function() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return null;
}

/* ----------------------------------------------------------
   EXPOSE globals
---------------------------------------------------------- */
window.RootsStore = {
  StoreProvider: StoreProvider,
  useStore:      useStore,
};

window.RootsComponents = {
  Navbar:          Navbar,
  Footer:          Footer,
  LowDataToggle:   LowDataToggle,
  ScrollGradient:  ScrollGradient,
  RevealObserver:  RevealObserver,
  ParallaxHandler: ParallaxHandler,
};
