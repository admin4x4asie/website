(function () {
  function compose (behaviour, properties) {
    var props = properties || [];
    return function factory () {
      var listeners = {};
      var instance = Object.create(Object.assign({}, behaviour, {
        _onChange: function (prop) {
          var ls = listeners[prop] || [];
          ls.forEach(function (cb) {
            cb();
          });
        },
        on: function (event, cb) {
          var listenersList = listeners[event] || [];
          listenersList.push(cb);
          listeners[event] = listenersList;
          return this;
        }
      }));
      props.forEach(function (prop) {
        var value;
        Object.defineProperty(instance, prop, {
          get: function () {
            return value;
          },
          set: function (val) {
            value = val;
            this._onChange(prop);
          }
        })
      });

      return instance;
    }
  }

  var Itemable = {
    addItem: function (item) {
      this.items.push(item);
      return this;
    }
  };

  var AccordionItem = {
    toggle: function () {
      this.accordion.toggleItem(this);
    }
  };

  var Accordion = Object.assign({
    toggleItem: function (item) {
      if (this.items.indexOf(item) !== -1) {
        this.items.forEach(function (i) {
          if (i === item) {
            i.isOpen = !i.isOpen;
          } else {
            i.isOpen = false;
          }
        });
      }
    }
  }, Itemable);

  var Gallery = Object.assign({
    selectItem: function (index) {
      if (this.items[index]) {
        this.selectedIndex = index;
      }
      return this;
    },
    selectNext: function () {
      return this.selectItem(this.selectedIndex + 1)
    },
    selectPrevious: function () {
      return this.selectItem(this.selectedIndex - 1);
    },
    isItemSelected: function (item) {
      return item === this.items[this.selectedIndex];
    },
    isLast: function () {
      return this.selectedIndex >= this.items.length - 1;
    },
    isFirst: function () {
      return this.selectedIndex === 0;
    }
  }, Itemable);

  var GalleryItem = {
    hide: function () {
      this.el.style.display = 'none';
      return this;
    },
    show: function () {
      this.el.style.display = 'inline-block';
      return this;
    }
  };

  var accordionItemFactory = compose(AccordionItem, ['isOpen']);
  var galleryFactory = compose(Gallery, ['selectedIndex']);

  function gallery () {
    var instance = galleryFactory();
    Object.defineProperty(instance, 'items', {value: []});
    return instance;
  }

  function galleryItem (el, gallery) {
    var instance = Object.create(GalleryItem, {
      gallery: {value: gallery},
      el: {value: el}
    });

    gallery.addItem(instance);

    gallery.on('selectedIndex', function () {
      if (gallery.isItemSelected(instance)) {
        instance.show();
      } else {
        instance.hide();
      }
    });
    return instance;
  }


  function accordion (el) {
    var items = [];
    return Object.create(Accordion, {
      items: {value: items},
      el: {value: el}
    });
  }

  function tabAccordion (accordion, toggleEl, tabEl) {
    var isOpen = toggleEl.parentNode.firstChild === toggleEl;
    var instance = accordionItemFactory();

    Object.defineProperty(instance, 'accordion', {value: accordion});
    Object.defineProperty(instance, 'toggleEl', {value: toggleEl});
    Object.defineProperty(instance, 'tabEl', {value: tabEl});

    instance.on('isOpen', function () {
      toggleEl.setAttribute('aria-selected', instance.isOpen);
      toggleEl.setAttribute('tabindex', instance.isOpen ? 0 : -1);
      tabEl.style.display = instance.isOpen ? 'flex' : 'none';
    });

    instance.isOpen = isOpen;
    return instance;
  }


  var acc = accordion();
  var toggles = [].slice.call(document.querySelectorAll("li[role=tab]"));

  var headers = toggles.map(function (toggleButton) {
    var tab = document.querySelector('[aria-labelledby='+toggleButton.id+']');
    return tabAccordion(acc, toggleButton, tab);
  });

  headers.forEach(function (item) {
    acc.addItem(item);
    item.toggleEl.addEventListener('click', item.toggle.bind(item));
  });

  var g = gallery();
  var galleryItems = [].slice.call(document.querySelectorAll('.gallery-items-list li'));
  galleryItems.forEach(function (gi) {
    galleryItem(gi, g);
  });

  [].slice.call(document.querySelectorAll('.handle > button')).forEach(function (h, index) {
    if (index === 0) {
      h.addEventListener('click', g.selectPrevious.bind(g));
      g.on('selectedIndex', function () {
        h.disabled = g.isFirst();
      });
    } else {
      h.addEventListener('click', g.selectNext.bind(g));
      g.on('selectedIndex', function () {
        h.disabled = g.isLast();
      });
    }
  });

  g.selectItem(0);
})(window);