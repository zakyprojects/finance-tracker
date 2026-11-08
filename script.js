// Finance Tracker: write down income and expenses, see each month at a glance.
// Plain JavaScript, no libraries. Data lives only in this browser (localStorage).
(function () {
  'use strict';

  // ---------- Storage ----------
  // Keys and entry shape are the same as the old version, so entries people already saved stay.
  var KEY = 'transactions';
  var CURRENCY_KEY = 'finance_currency';
  var THEME_KEY = 'finance_theme';

  var CATEGORIES = {
    expense: ['Food & Dining', 'Rent & Bills', 'Utilities', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Education', 'Other'],
    income: ['Salary', 'Freelance', 'Business', 'Investments', 'Gift', 'Other']
  };

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function isISODate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map(function (t, i) {
        var amount = Math.abs(parseFloat(t.amount)) || 0;
        var type = String(t.type || '').toLowerCase() === 'income' ? 'income' : 'expense';
        return {
          id: String(t.id || Date.now() + '-' + i),
          amount: Math.round(amount * 100) / 100,
          category: t.category || 'Other',
          description: t.description || t.text || '',
          date: isISODate(t.date) ? t.date : todayISO(),
          type: type
        };
      }).filter(function (t) { return t.amount > 0; });
    } catch (e) {
      return [];
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(entries)); }
    catch (e) { toast('Could not save. Your browser storage may be full.'); }
  }

  // ---------- State ----------
  var entries = load();
  var currency = localStorage.getItem(CURRENCY_KEY) === 'USD' ? 'USD' : 'PKR';
  var now = new Date();
  var view = { year: now.getFullYear(), month: now.getMonth(), range: 'month', filter: 'all', q: '' };
  var editingId = null;
  var lastAddedId = null;

  // ---------- Helpers ----------
  var $ = function (id) { return document.getElementById(id); };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function money(n, signed) {
    var abs = Math.abs(n);
    var hasCents = Math.round(abs * 100) % 100 !== 0;
    var body = abs.toLocaleString('en-US', { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 });
    var sym = currency === 'USD' ? '$' : 'Rs ';
    var sign = signed && n < 0 ? '−' : '';
    return sign + sym + body;
  }
  function monthKey(y, m) { return y + '-' + pad(m + 1); }
  function inView(t) { return view.range === 'all' || t.date.slice(0, 7) === monthKey(view.year, view.month); }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dayLabel(iso) {
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var t = todayISO();
    var y = new Date(); y.setDate(y.getDate() - 1);
    var yISO = y.getFullYear() + '-' + pad(y.getMonth() + 1) + '-' + pad(y.getDate());
    if (iso === t) return 'Today';
    if (iso === yISO) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: view.range === 'all' ? 'numeric' : undefined });
  }
  function sum(list, type) {
    return list.reduce(function (s, t) { return t.type === type ? s + t.amount : s; }, 0);
  }

  var toastTimer;
  function toast(text, action) {
    var el = $('toast');
    el.innerHTML = '';
    var span = document.createElement('span');
    span.textContent = text;
    el.appendChild(span);
    if (action) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = action.label;
      b.addEventListener('click', function () { action.run(); el.hidden = true; });
      el.appendChild(b);
    }
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, action ? 6000 : 3000);
  }

  function confirmDialog(title, text, okLabel) {
    var dlg = $('confirm');
    $('confirm-title').textContent = title;
    $('confirm-text').textContent = text;
    $('confirm-ok').textContent = okLabel;
    if (typeof dlg.showModal !== 'function') return Promise.resolve(window.confirm(title + '\n' + text));
    return new Promise(function (resolve) {
      dlg.addEventListener('close', function onClose() {
        dlg.removeEventListener('close', onClose);
        resolve(dlg.returnValue === 'ok');
      });
      dlg.returnValue = '';
      dlg.showModal();
    });
  }

  // ---------- Render ----------
  function render() {
    var periodList = entries.filter(inView);

    // Period title and arrows
    $('period-title').textContent = view.range === 'all' ? 'All time' : MONTHS[view.month] + ' ' + view.year;
    $('prev-month').disabled = view.range === 'all';
    $('next-month').disabled = view.range === 'all';

    // Summary
    var inc = sum(periodList, 'income');
    var exp = sum(periodList, 'expense');
    var bal = inc - exp;
    $('sum-income').textContent = money(inc);
    $('sum-expense').textContent = money(exp);
    var balEl = $('sum-balance');
    balEl.textContent = money(bal, true);
    balEl.classList.toggle('negative', bal < 0);
    var note;
    if (!periodList.length) note = 'Nothing written down yet.';
    else if (inc === 0) note = 'No income recorded for this period.';
    else if (bal >= 0) note = 'You kept ' + Math.round((bal / inc) * 100) + '% of your income.';
    else note = 'You spent ' + money(-bal) + ' more than you earned.';
    $('sum-note').textContent = note;

    renderCategories(periodList);
    renderTrend();
    renderList(periodList);
  }

  function renderCategories(list) {
    var box = $('cat-chart');
    var totals = {};
    list.forEach(function (t) { if (t.type === 'expense') totals[t.category] = (totals[t.category] || 0) + t.amount; });
    var rows = Object.keys(totals).map(function (k) { return [k, totals[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    if (!rows.length) { box.innerHTML = '<p class="muted">No expenses in this period.</p>'; return; }
    var total = rows.reduce(function (s, r) { return s + r[1]; }, 0);
    var top = rows[0][1];
    box.innerHTML = rows.slice(0, 6).map(function (r) {
      var pct = Math.round((r[1] / total) * 100);
      return '<div class="cat-row"><span>' + escapeHTML(r[0]) + '</span><span class="amt num">' + money(r[1]) + ' · ' + pct + '%</span>' +
        '<span class="bar"><i style="width:' + Math.max(2, (r[1] / top) * 100) + '%"></i></span></div>';
    }).join('');
  }

  function renderTrend() {
    // Six months ending at the month in view (or the current month for "All time").
    var endY = view.range === 'all' ? now.getFullYear() : view.year;
    var endM = view.range === 'all' ? now.getMonth() : view.month;
    var months = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(endY, endM - i, 1);
      var key = monthKey(d.getFullYear(), d.getMonth());
      var ms = entries.filter(function (t) { return t.date.slice(0, 7) === key; });
      months.push({ label: MONTHS[d.getMonth()].slice(0, 3), inc: sum(ms, 'income'), exp: sum(ms, 'expense'), current: i === 0 });
    }
    var max = Math.max.apply(null, months.map(function (m) { return Math.max(m.inc, m.exp); }).concat([1]));
    var W = 300, H = 130, base = 108, colW = W / 6, bw = 12;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Income and expenses for the last six months">';
    months.forEach(function (m, idx) {
      var cx = colW * idx + colW / 2;
      var hi = (m.inc / max) * 92, he = (m.exp / max) * 92;
      svg += '<rect class="in" x="' + (cx - bw - 1) + '" y="' + (base - hi) + '" width="' + bw + '" height="' + hi + '" rx="2"><title>' + m.label + ' income ' + money(m.inc) + '</title></rect>';
      svg += '<rect class="out" x="' + (cx + 1) + '" y="' + (base - he) + '" width="' + bw + '" height="' + he + '" rx="2"><title>' + m.label + ' expenses ' + money(m.exp) + '</title></rect>';
      svg += '<text class="lbl' + (m.current ? ' cur' : '') + '" x="' + cx + '" y="124" text-anchor="middle">' + m.label + '</text>';
    });
    svg += '<line class="base" x1="0" x2="' + W + '" y1="' + (base + 0.5) + '" y2="' + (base + 0.5) + '"/></svg>';
    $('trend-chart').innerHTML = svg;
  }

  var ICON_EDIT = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var ICON_DEL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>';

  function renderList(periodList) {
    var q = view.q.trim().toLowerCase();
    var list = periodList.filter(function (t) {
      if (view.filter !== 'all' && t.type !== view.filter) return false;
      if (q && (t.category + ' ' + t.description).toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1); });

    var box = $('list');
    var empty = $('empty');
    if (!list.length) {
      box.innerHTML = '';
      empty.hidden = false;
      var nothingAtAll = entries.length === 0;
      $('empty-title').textContent = nothingAtAll ? 'Your ledger is empty.' : q || view.filter !== 'all' ? 'No matching entries.' : 'No entries in this period.';
      $('empty-text').textContent = nothingAtAll ? 'Add your first entry with the form. Everything stays on this device.' : 'Try another month, filter or search.';
      $('sample-btn').hidden = !nothingAtAll;
      return;
    }
    empty.hidden = true;

    var html = '';
    var day = null;
    list.forEach(function (t) {
      if (t.date !== day) {
        if (day !== null) html += '</div>';
        day = t.date;
        var dayList = list.filter(function (x) { return x.date === day; });
        var net = sum(dayList, 'income') - sum(dayList, 'expense');
        html += '<div class="day"><div class="day-head"><span>' + dayLabel(day) + '</span><span class="num">' + money(net, true) + '</span></div>';
      }
      var sign = t.type === 'income' ? '+' : '−';
      html += '<div class="entry ' + t.type + (t.id === editingId ? ' is-editing' : '') + (t.id === lastAddedId ? ' just-added' : '') + '" data-id="' + escapeHTML(t.id) + '">' +
        '<span class="mark" aria-hidden="true">' + sign + '</span>' +
        '<span class="what"><span class="cat">' + escapeHTML(t.category) + '</span>' + (t.description ? '<span class="note">' + escapeHTML(t.description) + '</span>' : '') + '</span>' +
        '<span class="amt num"><span class="sr-only">' + t.type + ' </span>' + sign + money(t.amount) + '</span>' +
        '<span class="row-actions"><button type="button" class="edit" aria-label="Edit entry">' + ICON_EDIT + '</button>' +
        '<button type="button" class="del" aria-label="Delete entry">' + ICON_DEL + '</button></span></div>';
    });
    html += '</div>';
    box.innerHTML = html;
    lastAddedId = null;
  }

  // ---------- Form ----------
  var form = $('entry-form');
  function selectedType() { return form.querySelector('input[name="type"]:checked').value; }
  function fillCategories(type, keep) {
    var sel = $('category');
    var list = CATEGORIES[type].slice();
    if (keep && list.indexOf(keep) === -1) list.unshift(keep); // old custom category stays editable
    sel.innerHTML = list.map(function (c) { return '<option>' + escapeHTML(c) + '</option>'; }).join('');
    if (keep) sel.value = keep;
  }
  function showError(msg, field) {
    var el = $('form-error');
    el.textContent = msg;
    el.hidden = false;
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  }
  function clearError() {
    $('form-error').hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
  }
  function resetForm() {
    editingId = null;
    form.reset();
    fillCategories('expense');
    $('date').value = todayISO();
    $('form-title').textContent = 'Add an entry';
    $('submit-btn').textContent = 'Add entry';
    $('cancel-edit').hidden = true;
    clearError();
  }
  function startEdit(id) {
    var t = entries.find(function (x) { return x.id === id; });
    if (!t) return;
    editingId = id;
    form.querySelector('input[value="' + t.type + '"]').checked = true;
    fillCategories(t.type, t.category);
    $('amount').value = t.amount;
    $('note').value = t.description;
    $('date').value = t.date;
    $('form-title').textContent = 'Edit entry';
    $('submit-btn').textContent = 'Save changes';
    $('cancel-edit').hidden = false;
    clearError();
    render();
    $('add').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    $('amount').focus({ preventScroll: true });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();
    var amount = parseFloat($('amount').value);
    var date = $('date').value;
    if (!(amount > 0)) return showError('Enter an amount above zero.', $('amount'));
    if (amount > 1e12) return showError('That amount is too large.', $('amount'));
    if (!isISODate(date)) return showError('Pick a date.', $('date'));

    var data = {
      amount: Math.round(amount * 100) / 100,
      category: $('category').value,
      description: $('note').value.trim(),
      date: date,
      type: selectedType()
    };
    var wasEditing = editingId;
    if (editingId) {
      var t = entries.find(function (x) { return x.id === editingId; });
      if (t) Object.assign(t, data);
      lastAddedId = editingId;
    } else {
      data.id = String(Date.now());
      entries.push(data);
      lastAddedId = data.id;
    }
    save();
    // Jump to the month of the entry so it is visible right away.
    if (view.range === 'month') {
      view.year = +date.slice(0, 4);
      view.month = +date.slice(5, 7) - 1;
    }
    var keepType = data.type;
    resetForm();
    if (!wasEditing) {
      form.querySelector('input[value="' + keepType + '"]').checked = true;
      fillCategories(keepType);
      $('amount').focus();
    }
    render();
    toast(wasEditing ? 'Changes saved.' : 'Entry added.');
  });

  form.addEventListener('change', function (e) {
    if (e.target.name === 'type') fillCategories(e.target.value);
  });
  form.addEventListener('input', function (e) { if (e.target.hasAttribute('aria-invalid')) clearError(); });
  $('cancel-edit').addEventListener('click', function () { resetForm(); render(); });

  // ---------- List actions ----------
  $('list').addEventListener('click', function (e) {
    var row = e.target.closest('.entry');
    if (!row) return;
    var id = row.dataset.id;
    if (e.target.closest('.edit')) return startEdit(id);
    if (e.target.closest('.del')) {
      var t = entries.find(function (x) { return x.id === id; });
      if (!t) return;
      confirmDialog('Delete this entry?', t.category + ', ' + money(t.amount) + ' on ' + dayLabel(t.date) + '.', 'Delete').then(function (ok) {
        if (!ok) return;
        var index = entries.indexOf(t);
        entries.splice(index, 1);
        if (editingId === id) resetForm();
        save();
        render();
        toast('Entry deleted.', { label: 'Undo', run: function () { entries.splice(index, 0, t); save(); render(); } });
      });
    }
  });

  // ---------- Period, filters, search ----------
  $('prev-month').addEventListener('click', function () { shiftMonth(-1); });
  $('next-month').addEventListener('click', function () { shiftMonth(1); });
  function shiftMonth(step) {
    var d = new Date(view.year, view.month + step, 1);
    view.year = d.getFullYear();
    view.month = d.getMonth();
    render();
  }
  function wireSeg(selector, attr, apply) {
    document.querySelectorAll(selector).forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.parentNode.querySelectorAll('.seg-btn').forEach(function (b) {
          b.classList.toggle('is-on', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        apply(btn.dataset[attr]);
        render();
      });
    });
  }
  wireSeg('[data-range]', 'range', function (v) { view.range = v; });
  wireSeg('[data-filter]', 'filter', function (v) { view.filter = v; });
  $('search').addEventListener('input', function (e) { view.q = e.target.value; renderList(entries.filter(inView)); });

  // ---------- Currency and theme ----------
  var curSel = $('currency');
  curSel.value = currency;
  $('amount-prefix').textContent = currency === 'USD' ? '$' : 'Rs';
  curSel.addEventListener('change', function () {
    currency = curSel.value;
    localStorage.setItem(CURRENCY_KEY, currency);
    $('amount-prefix').textContent = currency === 'USD' ? '$' : 'Rs';
    render();
  });

  var root = document.documentElement;
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function setThemeColor() { themeMeta.content = root.dataset.theme === 'dark' ? '#0e1520' : '#edf1f5'; }
  setThemeColor();
  $('theme-btn').addEventListener('click', function () {
    if (root.dataset.theme === 'dark') delete root.dataset.theme; else root.dataset.theme = 'dark';
    try { localStorage.setItem(THEME_KEY, root.dataset.theme === 'dark' ? 'dark' : 'light'); } catch (e) {}
    setThemeColor();
  });
  // Until the visitor picks a theme, keep following the device/browser theme.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) {}
    if (saved === 'dark' || saved === 'light') return;
    if (e.matches) root.dataset.theme = 'dark'; else delete root.dataset.theme;
    setThemeColor();
  });

  // ---------- Export, clear, sample ----------
  $('export-btn').addEventListener('click', function () {
    if (!entries.length) return toast('Nothing to export yet.');
    var rows = [['Date', 'Type', 'Category', 'Note', 'Amount']].concat(
      entries.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; })
        .map(function (t) { return [t.date, t.type, t.category, t.description, t.amount.toFixed(2)]; })
    );
    var csv = rows.map(function (r) {
      return r.map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',');
    }).join('\n');
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = 'finance-tracker-' + todayISO() + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  $('clear-btn').addEventListener('click', function () {
    if (!entries.length) return toast('There are no entries to delete.');
    confirmDialog('Delete all entries?', 'All ' + entries.length + ' entries will be removed from this browser. Export a CSV first if you want a copy.', 'Delete all').then(function (ok) {
      if (!ok) return;
      entries = [];
      save();
      resetForm();
      render();
      toast('All entries deleted.');
    });
  });

  $('sample-btn').addEventListener('click', function () {
    // A believable month of sample data, so visitors can see the charts working.
    var y = now.getFullYear(), m = now.getMonth();
    function d(back, day) { var x = new Date(y, m - back, back === 0 ? Math.min(day, now.getDate()) : day); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); }
    var sample = [];
    for (var b = 0; b < 4; b++) {
      sample.push(
        { type: 'income', category: 'Salary', description: 'Monthly pay', amount: 85000, date: d(b, 1) },
        { type: 'income', category: 'Freelance', description: 'Landing page project', amount: 18000 + b * 4000, date: d(b, 12) },
        { type: 'expense', category: 'Rent & Bills', description: 'Rent', amount: 30000, date: d(b, 2) },
        { type: 'expense', category: 'Food & Dining', description: 'Groceries', amount: 12500 - b * 600, date: d(b, 5) },
        { type: 'expense', category: 'Utilities', description: 'Electricity and internet', amount: 7800 + b * 300, date: d(b, 8) },
        { type: 'expense', category: 'Transportation', description: 'Fuel', amount: 6000, date: d(b, 10) },
        { type: 'expense', category: 'Education', description: 'Online course', amount: 4500, date: d(b, 14) },
        { type: 'expense', category: 'Shopping', description: 'Clothes', amount: 5200 + b * 900, date: d(b, 15) }
      );
    }
    entries = sample.map(function (t, i) { t.id = String(Date.now() + i); return t; });
    if (currency !== 'PKR') { currency = 'PKR'; curSel.value = 'PKR'; $('amount-prefix').textContent = 'Rs'; localStorage.setItem(CURRENCY_KEY, 'PKR'); }
    save();
    render();
    toast('Sample data added. Delete it anytime with "Delete all entries".');
  });

  // ---------- Start ----------
  resetForm();
  render();
})();
