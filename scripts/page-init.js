/* ============================================================
   ROOTS — page-init.js
   Include AFTER React, ReactDOM, and shared-components.js.
   Mounts Navbar, Footer, LowDataToggle, RevealObserver,
   and ParallaxHandler into their root divs on every page.
   ============================================================ */
(function() {
  var navRoot    = document.getElementById('navbar-root');
  var footRoot   = document.getElementById('footer-root');
  var toggleRoot = document.getElementById('toggle-root');

  var mountDiv = document.createElement('div');
  document.body.appendChild(mountDiv);

  ReactDOM.createRoot(mountDiv).render(
    React.createElement(RootsStore.StoreProvider, null,
      navRoot    && ReactDOM.createPortal(React.createElement(RootsComponents.Navbar),          navRoot),
      footRoot   && ReactDOM.createPortal(React.createElement(RootsComponents.Footer),          footRoot),
      toggleRoot && ReactDOM.createPortal(React.createElement(RootsComponents.LowDataToggle),   toggleRoot),
      React.createElement(RootsComponents.RevealObserver),
      React.createElement(RootsComponents.ParallaxHandler)
    )
  );
})();
