(function () {
  // ---------------------------------------------------------------------
  // Pincode delivery checker (client-side only, no courier API).
  // ---------------------------------------------------------------------
  function parsePincodeList(raw) {
    if (!raw) return [];
    return raw
      .split(/[\s,\n]+/)
      .map(function (p) {
        return p.trim();
      })
      .filter(function (p) {
        return p.length > 0;
      });
  }

  function initPincodeChecker(root) {
    if (root.dataset.fvBound) return;
    root.dataset.fvBound = 'true';

    var input = root.querySelector('.fv-pincode__input');
    var button = root.querySelector('.fv-pincode__button');
    var result = root.querySelector('.fv-pincode__result');
    var nonServiceable = parsePincodeList(root.dataset.nonServiceable || '');
    var eta = root.dataset.eta || '5-9 business days';

    function check() {
      var value = (input.value || '').trim();
      result.classList.remove('is-success', 'is-error');
      if (!/^\d{6}$/.test(value)) {
        result.textContent = 'Please enter a valid 6-digit pincode.';
        result.classList.add('is-error');
        return;
      }
      if (nonServiceable.indexOf(value) !== -1) {
        result.textContent = "Sorry, we don't currently deliver to " + value + '.';
        result.classList.add('is-error');
      } else {
        result.textContent = 'Delivers to ' + value + ' — estimated ' + eta + '.';
        result.classList.add('is-success');
      }
    }

    button.addEventListener('click', check);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        check();
      }
    });
  }

  // ---------------------------------------------------------------------
  // Wishlist (browser-local, no account required).
  // ---------------------------------------------------------------------
  var WISHLIST_KEY = 'furniva_wishlist';

  function getWishlist() {
    try {
      var raw = window.localStorage.getItem(WISHLIST_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveWishlist(items) {
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    } catch (error) {
      // ignore storage errors (private browsing, quota, etc.)
    }
  }

  function isInWishlist(id) {
    return getWishlist().some(function (item) {
      return String(item.id) === String(id);
    });
  }

  function addToWishlist(item) {
    var items = getWishlist();
    if (!items.some(function (existing) {
      return String(existing.id) === String(item.id);
    })) {
      items.unshift(item);
      saveWishlist(items);
    }
    renderAll();
  }

  function removeFromWishlist(id) {
    var items = getWishlist().filter(function (item) {
      return String(item.id) !== String(id);
    });
    saveWishlist(items);
    renderAll();
  }

  function updateButtons() {
    document.querySelectorAll('[data-fv-wishlist-toggle]').forEach(function (button) {
      var active = isInWishlist(button.dataset.productId);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      var icon = button.querySelector('.fv-wishlist-button__icon');
      var label = button.querySelector('.fv-wishlist-button__label');
      if (icon) icon.innerHTML = active ? '&#9829;' : '&#9825;';
      if (label) label.textContent = active ? 'Saved to Wishlist' : 'Add to Wishlist';
    });
  }

  function updateCountBadges() {
    var count = getWishlist().length;
    document.querySelectorAll('[data-fv-wishlist-count]').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
    // Also try to badge the real header wishlist icon if one exists.
    document
      .querySelectorAll('a.fv-icon-link[href*="wishlist" i]')
      .forEach(function (link) {
        var badge = link.querySelector('.fv-wishlist-count');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'fv-wishlist-count';
          link.style.position = link.style.position || 'relative';
          link.appendChild(badge);
        }
        badge.textContent = count;
        badge.style.display = count > 0 ? '' : 'none';
      });
  }

  function renderDrawerList() {
    var list = document.querySelector('.fv-wishlist-drawer__list');
    if (!list) return;
    var items = getWishlist();
    if (!items.length) {
      list.innerHTML = '<p class="fv-wishlist-drawer__empty">Your wishlist is empty. Tap the heart on any product to save it here.</p>';
      return;
    }
    list.innerHTML = items
      .map(function (item) {
        return (
          '<div class="fv-wishlist-item" data-id="' + item.id + '">' +
          (item.image
            ? '<img class="fv-wishlist-item__image" src="' + item.image + '" alt="" loading="lazy">'
            : '<div class="fv-wishlist-item__image"></div>') +
          '<div class="fv-wishlist-item__info">' +
          '<a class="fv-wishlist-item__title" href="' + item.url + '">' + item.title + '</a>' +
          '<div class="fv-wishlist-item__price">' + (item.price || '') + '</div>' +
          '</div>' +
          '<button type="button" class="fv-wishlist-item__remove" data-remove-id="' + item.id + '" aria-label="Remove">&#10005;</button>' +
          '</div>'
        );
      })
      .join('');
    list.querySelectorAll('[data-remove-id]').forEach(function (button) {
      button.addEventListener('click', function () {
        removeFromWishlist(button.dataset.removeId);
      });
    });
  }

  function ensureDrawer() {
    if (document.querySelector('.fv-wishlist-drawer')) return;
    var overlay = document.createElement('div');
    overlay.className = 'fv-wishlist-drawer__overlay';
    var drawer = document.createElement('div');
    drawer.className = 'fv-wishlist-drawer';
    drawer.innerHTML =
      '<div class="fv-wishlist-drawer__header">' +
      '<h2>Your Wishlist</h2>' +
      '<button type="button" class="fv-wishlist-drawer__close" aria-label="Close">&#10005;</button>' +
      '</div>' +
      '<div class="fv-wishlist-drawer__list"></div>';
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    function close() {
      drawer.classList.remove('is-active');
      overlay.classList.remove('is-active');
    }
    overlay.addEventListener('click', close);
    drawer.querySelector('.fv-wishlist-drawer__close').addEventListener('click', close);

    window.fvOpenWishlistDrawer = function () {
      renderDrawerList();
      drawer.classList.add('is-active');
      overlay.classList.add('is-active');
    };
  }

  function bindWishlistButtons() {
    document.querySelectorAll('[data-fv-wishlist-toggle]').forEach(function (button) {
      if (button.dataset.fvBound) return;
      button.dataset.fvBound = 'true';
      button.addEventListener('click', function () {
        var id = button.dataset.productId;
        if (isInWishlist(id)) {
          removeFromWishlist(id);
        } else {
          addToWishlist({
            id: id,
            handle: button.dataset.productHandle,
            title: button.dataset.productTitle,
            image: button.dataset.productImage,
            price: button.dataset.productPrice,
            url: button.dataset.productUrl,
          });
        }
      });
    });
  }

  function bindHeaderWishlistIcon() {
    document
      .querySelectorAll('a.fv-icon-link[href*="wishlist" i]')
      .forEach(function (link) {
        if (link.dataset.fvWishlistBound) return;
        link.dataset.fvWishlistBound = 'true';
        link.addEventListener('click', function (event) {
          event.preventDefault();
          ensureDrawer();
          if (window.fvOpenWishlistDrawer) window.fvOpenWishlistDrawer();
        });
      });
  }

  // ---------------------------------------------------------------------
  // Compare (browser-local, up to 4 products, real spec data only).
  // ---------------------------------------------------------------------
  var COMPARE_KEY = 'furniva_compare';
  var COMPARE_MAX = 4;

  function getCompare() {
    try {
      var raw = window.localStorage.getItem(COMPARE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveCompare(items) {
    try {
      window.localStorage.setItem(COMPARE_KEY, JSON.stringify(items));
    } catch (error) {
      // ignore storage errors
    }
  }

  function isInCompare(id) {
    return getCompare().some(function (item) {
      return String(item.id) === String(id);
    });
  }

  function addToCompare(item) {
    var items = getCompare();
    if (items.some(function (existing) {
      return String(existing.id) === String(item.id);
    })) {
      renderAll();
      return;
    }
    if (items.length >= COMPARE_MAX) {
      window.alert('You can compare up to ' + COMPARE_MAX + ' products at a time. Remove one to add another.');
      return;
    }
    items.push(item);
    saveCompare(items);
    renderAll();
  }

  function removeFromCompare(id) {
    var items = getCompare().filter(function (item) {
      return String(item.id) !== String(id);
    });
    saveCompare(items);
    renderAll();
  }

  function updateCompareButtons() {
    document.querySelectorAll('[data-fv-compare-toggle]').forEach(function (button) {
      var active = isInCompare(button.dataset.productId);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      var label = button.querySelector('.fv-compare-button__label');
      if (label) label.textContent = active ? 'Added to Compare' : 'Add to Compare';
    });
  }

  function updateCompareCountBadges() {
    var count = getCompare().length;
    document
      .querySelectorAll('a.fv-icon-link[href*="compare" i]')
      .forEach(function (link) {
        var badge = link.querySelector('.fv-compare-count');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'fv-compare-count';
          link.style.position = link.style.position || 'relative';
          link.appendChild(badge);
        }
        badge.textContent = count;
        badge.style.display = count > 0 ? '' : 'none';
      });
  }

  function renderCompareBar() {
    var items = getCompare();
    var bar = document.querySelector('.fv-compare-bar');
    if (!items.length) {
      if (bar) bar.classList.remove('is-active');
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'fv-compare-bar';
      document.body.appendChild(bar);
    }
    bar.innerHTML =
      '<div class="fv-compare-bar__items"></div>' +
      '<div class="fv-compare-bar__actions">' +
      '<button type="button" class="fv-compare-bar__clear">Clear all</button>' +
      '<a class="fv-compare-bar__cta" href="/pages/compare">Compare (' + items.length + ')</a>' +
      '</div>';
    var itemsWrap = bar.querySelector('.fv-compare-bar__items');
    items.forEach(function (item) {
      var el = document.createElement('div');
      el.className = 'fv-compare-bar__item';
      el.innerHTML =
        (item.image
          ? '<img src="' + item.image + '" alt="">'
          : '<div class="fv-compare-bar__item-placeholder"></div>') +
        '<button type="button" class="fv-compare-bar__item-remove" data-remove-id="' + item.id + '" aria-label="Remove">&#10005;</button>';
      itemsWrap.appendChild(el);
    });
    bar.querySelectorAll('[data-remove-id]').forEach(function (button) {
      button.addEventListener('click', function () {
        removeFromCompare(button.dataset.removeId);
      });
    });
    bar.querySelector('.fv-compare-bar__clear').addEventListener('click', function () {
      saveCompare([]);
      renderAll();
    });
    bar.classList.add('is-active');
  }

  function bindCompareButtons() {
    document.querySelectorAll('[data-fv-compare-toggle]').forEach(function (button) {
      if (button.dataset.fvCompareBound) return;
      button.dataset.fvCompareBound = 'true';
      button.addEventListener('click', function () {
        var id = button.dataset.productId;
        if (isInCompare(id)) {
          removeFromCompare(id);
        } else {
          addToCompare({
            id: id,
            handle: button.dataset.productHandle,
            title: button.dataset.productTitle,
            image: button.dataset.productImage,
            price: button.dataset.productPrice,
            url: button.dataset.productUrl,
            dimensions: button.dataset.specDimensions,
            material: button.dataset.specMaterial,
            capacity: button.dataset.specCapacity,
            assembly: button.dataset.specAssembly,
            warranty: button.dataset.specWarranty,
          });
        }
      });
    });
  }

  function renderAll() {
    updateButtons();
    updateCountBadges();
    renderDrawerList();
    updateCompareButtons();
    updateCompareCountBadges();
    renderCompareBar();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-fv-pincode]').forEach(initPincodeChecker);
    ensureDrawer();
    bindWishlistButtons();
    bindHeaderWishlistIcon();
    bindCompareButtons();
    renderAll();
  });
})();
