(function () {
  if (customElements.get('cart-recommendations')) return;

  function formatMoney(cents) {
    var amount = Math.round(cents / 100).toLocaleString('en-IN');
    return '₹' + amount;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  class CartRecommendations extends HTMLElement {
    connectedCallback() {
      this.list = this.querySelector('.fv-fbt__list');
      this.render();
      if (window.subscribe && window.PUB_SUB_EVENTS) {
        this._unsubscribe = subscribe(PUB_SUB_EVENTS.cartUpdate, () => this.render());
      }
    }

    disconnectedCallback() {
      if (this._unsubscribe) this._unsubscribe();
    }

    getSeedProductId() {
      var rows = document.querySelectorAll('.cart-drawer .cart-item[data-product-id]');
      if (!rows.length) return null;
      var last = rows[rows.length - 1];
      return last.dataset.productId || null;
    }

    async render() {
      if (!this.list) this.list = this.querySelector('.fv-fbt__list');
      var productId = this.getSeedProductId();
      if (!productId) {
        this.list.innerHTML = '<p class="fv-fbt__empty">Add an item to see suggestions.</p>';
        return;
      }
      this.list.innerHTML = '<p class="fv-fbt__loading">Loading suggestions&hellip;</p>';
      try {
        var response = await fetch(
          '/recommendations/products.json?product_id=' + productId + '&limit=4&intent=related'
        );
        if (!response.ok) throw new Error('bad response');
        var data = await response.json();
        var products = (data.products || []).slice(0, 2);
        if (!products.length) {
          this.list.innerHTML = '<p class="fv-fbt__empty">No suggestions right now.</p>';
          return;
        }
        var self = this;
        this.list.innerHTML = products.map(function (product) {
          return self.renderCard(product);
        }).join('');
        this.list.querySelectorAll('.fv-fbt__add').forEach(function (button) {
          button.addEventListener('click', function (event) {
            self.addToCart(event);
          });
        });
      } catch (error) {
        this.list.innerHTML = '<p class="fv-fbt__empty">Couldn&#39;t load suggestions.</p>';
      }
    }

    renderCard(product) {
      var image = product.featured_image || (product.images && product.images[0]) || '';
      var compareAtPrice = product.compare_at_price_max || product.compare_at_price || 0;
      var price = product.price_max || product.price || 0;
      var onSale = compareAtPrice > price;
      var variant = (product.variants && product.variants[0]) || {};
      var variantId = variant.id || product.id;
      var url = product.url || '#';
      var pctOff = onSale ? Math.round((1 - price / compareAtPrice) * 100) : 0;

      return (
        '<div class="fv-fbt__card">' +
        '<a href="' + url + '">' +
        (image ? '<img src="' + image + '" alt="' + escapeHtml(product.title) + '" loading="lazy">' : '') +
        '<p class="fv-fbt__title">' + escapeHtml(product.title) + '</p>' +
        '</a>' +
        (onSale ? '<span class="fv-fbt__badge">' + pctOff + '% OFF</span>' : '') +
        '<p class="fv-fbt__price">' +
        formatMoney(price) +
        (onSale ? '<s>' + formatMoney(compareAtPrice) + '</s>' : '') +
        '</p>' +
        '<button type="button" class="fv-fbt__add" data-variant-id="' + variantId + '">Add</button>' +
        '</div>'
      );
    }

    async addToCart(event) {
      var button = event.currentTarget;
      var variantId = button.dataset.variantId;
      var originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Adding…';
      try {
        await fetch((window.routes && window.routes.cart_add_url) || '/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }),
        });

        var cartResponse = await fetch(
          ((window.routes && window.routes.cart_url) || '/cart') + '?section_id=cart-drawer'
        );
        var text = await cartResponse.text();
        var html = new DOMParser().parseFromString(text, 'text/html');
        var newInner = html.querySelector('#CartDrawer');
        var currentInner = document.getElementById('CartDrawer');
        if (newInner && currentInner) {
          currentInner.innerHTML = newInner.innerHTML;
        }
        var drawer = document.querySelector('cart-drawer');
        if (drawer) {
          drawer.classList.remove('is-empty');
          if (typeof drawer.open === 'function') drawer.open();
        }
        if (window.publish && window.PUB_SUB_EVENTS) {
          publish(PUB_SUB_EVENTS.cartUpdate, { source: 'furniva-fbt' });
        }
      } catch (error) {
        button.textContent = 'Try again';
        button.disabled = false;
        return;
      }
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  customElements.define('cart-recommendations', CartRecommendations);

  // ---- Open the drawer from the real (custom) header cart icon ----
  // Furniva's header is a custom-liquid block (not Dawn's stock header),
  // so its cart link is `<a href="/cart" class="fv-icon-link">` with no
  // id="cart-icon-bubble" — Dawn's own cart-drawer.js only knows how to
  // find that id, so it silently no-ops and the link falls through to a
  // normal page navigation. Wire it up ourselves instead.
  function bindCustomCartIcon() {
    var drawer = document.querySelector('cart-drawer');
    if (!drawer) return;
    var candidates = document.querySelectorAll('a.fv-icon-link[href="/cart"], a.fv-icon-link[href^="/cart"]');
    candidates.forEach(function (link) {
      if (link.dataset.fvBound) return;
      link.dataset.fvBound = 'true';
      link.setAttribute('role', 'button');
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', function (event) {
        event.preventDefault();
        if (typeof drawer.open === 'function') drawer.open(link);
      });
    });
  }

  function updateCustomCartBadge(itemCount) {
    if (typeof itemCount !== 'number') return;
    var badges = document.querySelectorAll('a.fv-icon-link[href="/cart"] span, a.fv-icon-link[href^="/cart"] span');
    badges.forEach(function (badge) {
      badge.textContent = itemCount;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindCustomCartIcon();
    if (window.subscribe && window.PUB_SUB_EVENTS) {
      subscribe(PUB_SUB_EVENTS.cartUpdate, function (event) {
        bindCustomCartIcon();
        if (event && event.cartData && typeof event.cartData.item_count === 'number') {
          updateCustomCartBadge(event.cartData.item_count);
        }
      });
    }
  });

  // ---- Free gift auto add/remove at the ₹70,000 tier ----
  var FREE_GIFT_VARIANT_ID = 43687974174833; // Furniva Penny Cube Bed Side Table - Sandalwood
  var FREE_GIFT_THRESHOLD_CENTS = 7000000; // ₹70,000
  var FREE_GIFT_PROPERTY = '_furniva_auto_gift';
  var giftSyncInFlight = false;

  async function syncFreeGift() {
    if (giftSyncInFlight) return;
    giftSyncInFlight = true;
    try {
      var cartResponse = await fetch('/cart.js');
      var cart = await cartResponse.json();

      var giftLine = null;
      var otherItemsTotal = 0;
      cart.items.forEach(function (item) {
        var isGiftLine =
          item.variant_id === FREE_GIFT_VARIANT_ID && item.properties && item.properties[FREE_GIFT_PROPERTY];
        if (isGiftLine) {
          giftLine = item;
        } else {
          otherItemsTotal += item.line_price;
        }
      });

      if (otherItemsTotal >= FREE_GIFT_THRESHOLD_CENTS && !giftLine) {
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            items: [
              {
                id: FREE_GIFT_VARIANT_ID,
                quantity: 1,
                properties: { _furniva_auto_gift: 'true' },
              },
            ],
          }),
        });
        if (window.publish && window.PUB_SUB_EVENTS) {
          publish(PUB_SUB_EVENTS.cartUpdate, { source: 'furniva-gift' });
        }
      } else if (otherItemsTotal < FREE_GIFT_THRESHOLD_CENTS && giftLine) {
        await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ id: giftLine.key, quantity: 0 }),
        });
        if (window.publish && window.PUB_SUB_EVENTS) {
          publish(PUB_SUB_EVENTS.cartUpdate, { source: 'furniva-gift' });
        }
      }
    } catch (error) {
      // Progressive enhancement only — fail silently
    } finally {
      giftSyncInFlight = false;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    syncFreeGift();
    if (window.subscribe && window.PUB_SUB_EVENTS) {
      subscribe(PUB_SUB_EVENTS.cartUpdate, function (event) {
        if (event && event.source === 'furniva-gift') return;
        syncFreeGift();
      });
    }
  });

  // ---- Discount code apply ----
  document.addEventListener('submit', async function (event) {
    var form = event.target.closest('.fv-discount__form');
    if (!form) return;
    event.preventDefault();
    var input = form.querySelector('.fv-discount__input');
    var status = form.querySelector('.fv-discount__status');
    var code = (input.value || '').trim();
    if (!code) return;
    status.textContent = 'Applying…';
    status.className = 'fv-discount__status';
    try {
      var response = await fetch('/discount/' + encodeURIComponent(code) + '?redirect=/cart');
      if (!response.ok) throw new Error('bad response');
      status.textContent = 'Code "' + code + '" applied — it will be reflected at checkout.';
      status.classList.add('is-success');
      if (window.publish && window.PUB_SUB_EVENTS) {
        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'furniva-discount' });
      }
    } catch (error) {
      status.textContent = 'Could not apply that code. Please check it and try again.';
      status.classList.add('is-error');
    }
  });
})();
