/*
 * Mini moteur de rendu du portfolio — Emmanuel Rolland
 * --------------------------------------------------------
 * Chaque page contient :
 *   - un <template id="dc-template"> : le HTML de la page avec des trous {{ chemin }},
 *     des boucles <sc-for list="{{liste}}" as="item"> et des conditions <sc-if value="{{cond}}">
 *   - un <script type="text/x-dc"> : la classe Component (état + données + interactions)
 * Ce fichier rend le template dans <div id="app"> et le met à jour à chaque setState,
 * en modifiant le DOM existant (les transitions CSS sont donc conservées).
 * Aucune dépendance, aucun build : le site fonctionne tel quel sur GitHub Pages.
 */
(function () {
  'use strict';

  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(update) {
      const patch = typeof update === 'function' ? update(this.state, this.props) : update;
      this.state = Object.assign({}, this.state, patch);
      if (this.__schedule) this.__schedule();
    }
    forceUpdate() { if (this.__schedule) this.__schedule(); }
  }
  window.DCLogic = DCLogic;

  const WHOLE = /^\s*\{\{([^}]+)\}\}\s*$/;
  const ANY = /\{\{([^}]+)\}\}/g;

  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^(['"]).*\1$/.test(path)) return path.slice(1, -1);
    let v = scope;
    for (const key of path.split('.')) {
      if (v == null) return undefined;
      v = v[key];
    }
    return v;
  }

  function interp(str, scope) {
    return str.replace(ANY, (m, p) => {
      const v = lookup(scope, p);
      return v == null ? '' : String(v);
    });
  }

  function pathOf(attr) {
    const m = (attr || '').match(WHOLE);
    return m ? m[1] : '';
  }

  function render(node, scope, ctx, out) {
    if (node.nodeType === 3) {
      const t = node.nodeValue;
      out.push(document.createTextNode(t.indexOf('{{') > -1 ? interp(t, scope) : t));
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.localName;

    if (tag === 'sc-for') {
      const list = lookup(scope, pathOf(node.getAttribute('list'))) || [];
      const as = node.getAttribute('as') || 'item';
      list.forEach((item, index) => {
        const s = Object.create(scope);
        s[as] = item;
        s.$index = index;
        node.childNodes.forEach((c) => render(c, s, ctx, out));
      });
      return;
    }
    if (tag === 'sc-if') {
      if (lookup(scope, pathOf(node.getAttribute('value')))) {
        node.childNodes.forEach((c) => render(c, scope, ctx, out));
      }
      return;
    }

    const el = node.namespaceURI && node.namespaceURI !== 'http://www.w3.org/1999/xhtml'
      ? document.createElementNS(node.namespaceURI, node.localName)
      : document.createElement(node.localName);

    for (const at of Array.from(node.attributes)) {
      const name = at.name;
      const value = at.value;
      if (name.indexOf('hint-') === 0) continue;
      if (name.length > 2 && name.slice(0, 2).toLowerCase() === 'on' && WHOLE.test(value)) {
        const fn = lookup(scope, pathOf(value));
        if (typeof fn === 'function') {
          el.setAttribute('data-dc-' + name.slice(2).toLowerCase(), String(ctx.handlers.length));
          ctx.handlers.push(fn);
        }
        continue;
      }
      el.setAttribute(name, value.indexOf('{{') > -1 ? interp(value, scope) : value);
    }

    const kids = [];
    node.childNodes.forEach((c) => render(c, scope, ctx, kids));
    kids.forEach((k) => el.appendChild(k));
    out.push(el);
  }

  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) {
      a.replaceWith(b);
      return;
    }
    if (a.nodeType === 3) {
      if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
      return;
    }
    for (const at of Array.from(a.attributes)) {
      if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
    }
    for (const at of Array.from(b.attributes)) {
      if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    }
    morphChildren(a, b);
  }

  function morphChildren(a, b) {
    const ac = Array.from(a.childNodes);
    const bc = Array.from(b.childNodes);
    for (let i = 0; i < bc.length; i++) {
      if (i < ac.length) morph(ac[i], bc[i]);
      else a.appendChild(bc[i]);
    }
    for (let i = bc.length; i < ac.length; i++) ac[i].remove();
  }

  function boot() {
    const tpl = document.getElementById('dc-template');
    const logic = document.querySelector('script[type="text/x-dc"]');
    const root = document.getElementById('app');
    if (!tpl || !logic || !root) return;

    const props = {};
    try {
      const declared = JSON.parse(logic.getAttribute('data-props') || '{}');
      Object.keys(declared).forEach((k) => {
        if (k[0] !== '$' && declared[k] && 'default' in declared[k]) props[k] = declared[k].default;
      });
    } catch (e) { /* props facultatives */ }

    const Component = new Function('DCLogic', logic.textContent + '\n;return Component;')(DCLogic);
    const inst = new Component(props);
    let handlers = [];
    let pending = false;

    function update() {
      pending = false;
      const ctx = { handlers: [] };
      const vals = inst.renderVals ? inst.renderVals() : {};
      const out = [];
      tpl.content.childNodes.forEach((c) => render(c, vals, ctx, out));
      const holder = document.createElement('div');
      out.forEach((n) => holder.appendChild(n));
      handlers = ctx.handlers;
      morphChildren(root, holder);
    }

    inst.__schedule = function () {
      if (pending) return;
      pending = true;
      Promise.resolve().then(update);
    };

    update();

    ['click', 'input', 'change'].forEach((type) => {
      root.addEventListener(type, (e) => {
        let n = e.target;
        while (n && n !== root) {
          if (n.nodeType === 1 && n.hasAttribute('data-dc-' + type)) {
            const fn = handlers[Number(n.getAttribute('data-dc-' + type))];
            if (typeof fn === 'function') fn(e);
            break;
          }
          n = n.parentNode;
        }
      });
    });

    if (inst.componentDidMount) inst.componentDidMount();
    window.addEventListener('pagehide', () => { if (inst.componentWillUnmount) inst.componentWillUnmount(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
