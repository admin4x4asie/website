(function (global, undefined) {

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

  var AccordionItem = {
    toggle: function () {
      this.accordion.toggleItem(this);
    }
  };

  var Accordion = {
    addItem: function (item) {
      this.items.push(item);
      return this;
    },
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
  };

  var accordionItemFactory = compose(AccordionItem, ['isOpen']);

  function accordion (el) {
    var items = [];
    return Object.create(Accordion, {
      items: {value: items},
      el: {value: el}
    });
  }

  function tabAccordion (accordion, toggleEl, tabEl) {
    var id = toggleEl.id;

    var isOpen = toggleEl.parentNode.firstChild === toggleEl;

    const instance = accordionItemFactory();

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
    var tab = document.querySelector(`[aria-labelledby=${toggleButton.id}]`);
    return tabAccordion(acc, toggleButton, tab);
  });

  headers.forEach(function (item) {
    acc.addItem(item);
    item.toggleEl.addEventListener('click', item.toggle.bind(item));
  });

})(window);