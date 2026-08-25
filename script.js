/**
 * Finance Tracker • V2 Design System Architecture
 * Engineered by Zakria Khan
 * 
 * 1. Responsive Network Particle Canvas Engine
 * 2. Zero-Latency Trailing Lerp Custom Cursor
 * 3. Dynamic Category Filtering (Income vs Expense)
 * 4. Global Currency Engine (USD & PKR)
 * 5. Reactive Finance State Machine & Telemetry
 * 6. Animated Transaction Feed & Filtering Engine
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. RESPONSIVE NETWORK PARTICLE CANVAS ENGINE
     ========================================================================== */
  (function initParticleEngine() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null };
    let maxParticles, connectDistance;

    function computeSettings() {
      const w = window.innerWidth;
      if (w <= 480) {
        maxParticles = 25;
        connectDistance = 60;
      } else if (w <= 768) {
        maxParticles = 50;
        connectDistance = 80;
      } else {
        maxParticles = 90;
        connectDistance = 110;
      }
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      computeSettings();
      resize();
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          index: i
        });
      }
    }

    window.addEventListener('resize', () => {
      computeSettings();
      resize();
    });

    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const len = particles.length;

      for (let i = 0; i < len; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle node
        ctx.fillStyle = 'rgba(88, 166, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Connect to neighbouring peer nodes
        for (let j = i + 1; j < len; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectDistance) {
            ctx.strokeStyle = `rgba(88, 166, 255, ${1 - dist / connectDistance})`;
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // Connect to pointer position if active
        if (mouse.x !== null) {
          const dxm = p.x - mouse.x;
          const dym = p.y - mouse.y;
          const distM = Math.hypot(dxm, dym);

          if (distM < connectDistance) {
            ctx.strokeStyle = `rgba(88, 166, 255, ${1 - distM / connectDistance})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    init();
    animate();
  })();

  /* ==========================================================================
     2. ZERO-LATENCY LERP CUSTOM CURSOR
     ========================================================================== */
  (function initCustomCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let isVisible = false;
    const lerpFactor = 0.45;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        ringX = mouseX;
        ringY = mouseY;
      }

      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    window.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
      isVisible = false;
    });

    window.addEventListener('mouseenter', () => {
      if (mouseX > 0 && mouseY > 0) {
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        isVisible = true;
      }
    });

    // Hover detection on interactive UI components
    const interactiveSelector = 'a, button, input, select, .type-toggle-option, .metric-card, .panel, .transaction-item, [role="button"]';
    
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelector)) {
        ring.classList.add('cursor-hover');
        dot.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSelector)) {
        ring.classList.remove('cursor-hover');
        dot.classList.remove('cursor-hover');
      }
    });

    // RAF Lerp loop for trailing ring
    function renderCursor() {
      if (isVisible) {
        ringX += (mouseX - ringX) * lerpFactor;
        ringY += (mouseY - ringY) * lerpFactor;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      requestAnimationFrame(renderCursor);
    }

    requestAnimationFrame(renderCursor);
  })();

  /* ==========================================================================
     3. CONSTANTS & CATEGORY DATA
     ========================================================================== */
  const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Business', 'Other'];
  const expenseCategories = ['Food & Dining', 'Rent & Bills', 'Utilities', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Other'];

  const categoryIcons = {
    'Salary': '💼',
    'Freelance': '💻',
    'Investments': '📈',
    'Business': '🏢',
    'Food & Dining': '🍔',
    'Rent & Bills': '🏠',
    'Utilities': '💡',
    'Transportation': '🚗',
    'Shopping': '🛍️',
    'Entertainment': '🎬',
    'Healthcare': '🏥',
    'Other': '📦'
  };

  /* ==========================================================================
     4. DOM ELEMENT SELECTORS
     ========================================================================== */
  const form = document.getElementById('transaction-form');
  const amountInput = document.getElementById('amount');
  const amountPrefix = document.getElementById('amount-prefix');
  const amountWrapper = document.getElementById('amount-wrapper');
  const categoryInput = document.getElementById('category');
  const descriptionInput = document.getElementById('description');
  const dateInput = document.getElementById('date');
  const typeRadios = document.getElementsByName('transaction-type');
  
  const balanceEl = document.getElementById('balance');
  const totalIncomeEl = document.getElementById('total-income');
  const totalExpenseEl = document.getElementById('total-expense');
  const incomeCountEl = document.getElementById('income-count');
  const expenseCountEl = document.getElementById('expense-count');

  const progressIncome = document.getElementById('progress-income');
  const progressExpense = document.getElementById('progress-expense');
  const ratioIncomeVal = document.getElementById('ratio-income-val');
  const ratioExpenseVal = document.getElementById('ratio-expense-val');
  const ratioSummary = document.getElementById('ratio-summary');

  const transactionList = document.getElementById('transaction-list');
  const emptyState = document.getElementById('empty-state');
  
  const filterBtns = document.querySelectorAll('.filter-btn');
  const countAllEl = document.getElementById('count-all');
  const countIncomeEl = document.getElementById('count-income');
  const countExpenseEl = document.getElementById('count-expense');

  const currencyBtns = document.querySelectorAll('.currency-btn');

  const modal = document.getElementById('custom-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalText = document.getElementById('modal-text');
  const modalButtons = document.getElementById('modal-buttons');

  /* ==========================================================================
     5. GLOBAL APPLICATION STATE
     ========================================================================== */
  let transactions = [];
  let currentFilter = 'all';
  let currentCurrency = localStorage.getItem('finance_currency') || 'USD';

  /**
   * Load and normalize transactions from localStorage
   */
  function loadTransactions() {
    try {
      const raw = localStorage.getItem('transactions');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Normalize existing data structure safely
          transactions = parsed.map(item => ({
            id: item.id || Date.now() + Math.random(),
            amount: parseFloat(item.amount) || 0,
            category: item.category || 'Other',
            description: item.description || item.text || '',
            date: item.date || new Date().toISOString().split('T')[0],
            type: (item.type || 'expense').toLowerCase() === 'income' ? 'income' : 'expense'
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse transactions from storage:', e);
      transactions = [];
    }
  }

  /**
   * Persist current state to localStorage
   */
  function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }

  /**
   * Format numeric currency based on global currentCurrency (USD vs PKR)
   * USD: $1,200.00
   * PKR: Rs 1,200.00
   */
  function formatCurrency(amount) {
    const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    
    if (currentCurrency === 'PKR') {
      return 'Rs ' + num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    // Default USD ($)
    return '$' + num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Format standard ISO date (YYYY-MM-DD) into readable format
   */
  function formatDate(dateString) {
    if (!dateString) return 'Recent';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return dateString;
  }

  /**
   * Dynamically populate the Category dropdown based on selected Type
   */
  function populateCategories(type) {
    if (!categoryInput) return;

    const list = type === 'income' ? incomeCategories : expenseCategories;
    categoryInput.innerHTML = '<option value="" disabled selected>Select Category</option>';

    list.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      const icon = categoryIcons[cat] || (type === 'income' ? '💰' : '📦');
      option.textContent = `${icon} ${cat}`;
      categoryInput.appendChild(option);
    });
  }

  /**
   * Get currently active Transaction Type from radio group
   */
  function getSelectedType() {
    for (const radio of typeRadios) {
      if (radio.checked) {
        return radio.value;
      }
    }
    return 'expense';
  }

  /**
   * Update Currency Toggle UI & Input Prefix
   */
  function updateCurrencyUI() {
    currencyBtns.forEach(btn => {
      if (btn.dataset.currency === currentCurrency) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (amountPrefix) {
      amountPrefix.textContent = currentCurrency === 'PKR' ? 'Rs' : '$';
    }

    if (amountWrapper) {
      if (currentCurrency === 'PKR') {
        amountWrapper.classList.add('prefix-wide');
      } else {
        amountWrapper.classList.remove('prefix-wide');
      }
    }
  }

  /**
   * Update Summary Metrics and Cash Flow Progress Bar
   */
  function updateTelemetry() {
    const incomeList = transactions.filter(t => t.type === 'income');
    const expenseList = transactions.filter(t => t.type === 'expense');

    const totalIncome = incomeList.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseList.reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;

    // Balance display
    if (netBalance < 0) {
      balanceEl.textContent = `-${formatCurrency(Math.abs(netBalance))}`;
      balanceEl.style.color = 'var(--neon-red)';
    } else {
      balanceEl.textContent = formatCurrency(netBalance);
      balanceEl.style.color = '#ffffff';
    }

    // Totals display
    totalIncomeEl.textContent = `+${formatCurrency(totalIncome)}`;
    totalExpenseEl.textContent = `-${formatCurrency(totalExpense)}`;

    // Count pills
    incomeCountEl.textContent = `${incomeList.length} ${incomeList.length === 1 ? 'credit' : 'credits'}`;
    expenseCountEl.textContent = `${expenseList.length} ${expenseList.length === 1 ? 'debit' : 'debits'}`;

    // Filter counts
    countAllEl.textContent = transactions.length;
    countIncomeEl.textContent = incomeList.length;
    countExpenseEl.textContent = expenseList.length;

    // Dynamic Income vs Expense Ratio Progress Calculation
    const totalCashFlow = totalIncome + totalExpense;

    if (totalCashFlow === 0) {
      progressIncome.style.width = '50%';
      progressExpense.style.width = '50%';
      ratioIncomeVal.textContent = '0%';
      ratioExpenseVal.textContent = '0%';
      ratioSummary.textContent = '0% Logged';
    } else {
      const incomePercent = Math.round((totalIncome / totalCashFlow) * 100);
      const expensePercent = 100 - incomePercent;

      progressIncome.style.width = `${incomePercent}%`;
      progressExpense.style.width = `${expensePercent}%`;
      ratioIncomeVal.textContent = `${incomePercent}%`;
      ratioExpenseVal.textContent = `${expensePercent}%`;

      if (totalIncome > totalExpense) {
        const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
        ratioSummary.textContent = `${savingsRate}% Retained`;
      } else if (totalIncome === totalExpense) {
        ratioSummary.textContent = `Balanced (1:1)`;
      } else {
        ratioSummary.textContent = `Deficit (-${formatCurrency(totalExpense - totalIncome)})`;
      }
    }
  }

  /**
   * Render Transaction Ledger according to current filter & currency
   */
  function renderTransactions() {
    transactionList.innerHTML = '';

    // Filter transactions
    const filtered = transactions.filter(item => {
      if (currentFilter === 'income') return item.type === 'income';
      if (currentFilter === 'expense') return item.type === 'expense';
      return true;
    });

    // Sort by Date descending (newest first)
    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

    if (sorted.length === 0) {
      emptyState.style.display = 'flex';
      transactionList.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    transactionList.style.display = 'flex';

    const fragment = document.createDocumentFragment();

    sorted.forEach(t => {
      const itemEl = document.createElement('div');
      itemEl.className = 'transaction-item';
      itemEl.dataset.id = t.id;

      const isIncome = t.type === 'income';
      const icon = categoryIcons[t.category] || (isIncome ? '💰' : '📦');
      const typeBadgeClass = isIncome ? 'badge-green' : 'badge-red';
      const amountPrefixChar = isIncome ? '+' : '-';
      const amountClass = isIncome ? 'income' : 'expense';

      itemEl.innerHTML = `
        <div class="item-left">
          <div class="item-category-icon">
            <span>${icon}</span>
          </div>
          <div class="item-info">
            <div class="item-title-wrap">
              <span class="item-category">${escapeHTML(t.category)}</span>
              <span class="item-type-badge ${typeBadgeClass}">${t.type}</span>
            </div>
            ${t.description ? `<p class="item-desc" title="${escapeHTML(t.description)}">${escapeHTML(t.description)}</p>` : ''}
            <div class="item-meta">
              <span class="item-date">${formatDate(t.date)}</span>
            </div>
          </div>
        </div>
        <div class="item-right">
          <div class="item-amount ${amountClass}">
            ${amountPrefixChar}${formatCurrency(t.amount)}
          </div>
          <button class="delete-action-btn" title="Delete Transaction" aria-label="Delete Transaction" data-id="${t.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;

      fragment.appendChild(itemEl);
    });

    transactionList.appendChild(fragment);
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  /**
   * Show Custom Confirmation / Alert Modal
   */
  function showModal({ title, text, confirmText = 'Confirm', confirmClass = 'modal-btn-danger', onConfirm }) {
    modalTitle.textContent = title;
    modalText.textContent = text;
    modalButtons.innerHTML = '';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-btn modal-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.className = `modal-btn ${confirmClass}`;
    confirmBtn.textContent = confirmText;
    confirmBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    });

    modalButtons.appendChild(cancelBtn);
    modalButtons.appendChild(confirmBtn);
    modal.style.display = 'flex';
  }

  /**
   * Handle Form Submission (Add Transaction)
   */
  function handleAddTransaction(e) {
    e.preventDefault();

    const amountVal = parseFloat(amountInput.value);
    const categoryVal = categoryInput.value;
    const descVal = descriptionInput.value.trim();
    const dateVal = dateInput.value;
    const selectedType = getSelectedType();

    if (isNaN(amountVal) || amountVal <= 0) {
      showModal({
        title: 'Invalid Amount',
        text: 'Please specify a positive monetary transaction amount.',
        confirmText: 'Acknowledge',
        confirmClass: 'modal-btn-danger'
      });
      return;
    }

    if (!categoryVal) {
      showModal({
        title: 'Missing Category',
        text: 'Please select a valid category for this entry.',
        confirmText: 'Acknowledge',
        confirmClass: 'modal-btn-danger'
      });
      return;
    }

    if (!dateVal) {
      showModal({
        title: 'Missing Date',
        text: 'Please specify the transaction execution date.',
        confirmText: 'Acknowledge',
        confirmClass: 'modal-btn-danger'
      });
      return;
    }

    const newTransaction = {
      id: Date.now(),
      amount: amountVal,
      category: categoryVal,
      description: descVal,
      date: dateVal,
      type: selectedType
    };

    // Prepend to state
    transactions.unshift(newTransaction);
    saveTransactions();
    updateTelemetry();
    renderTransactions();

    // Reset Form Fields (keep today's date)
    amountInput.value = '';
    categoryInput.selectedIndex = 0;
    descriptionInput.value = '';
    setDefaultDate();
    amountInput.focus();
  }

  /**
   * Handle Deletion with Animation and Confirmation
   */
  function handleDeleteClick(e) {
    const deleteBtn = e.target.closest('.delete-action-btn');
    if (!deleteBtn) return;

    const id = parseFloat(deleteBtn.dataset.id);
    const itemCard = deleteBtn.closest('.transaction-item');

    showModal({
      title: 'Delete Transaction',
      text: 'Are you sure you want to remove this transaction? This will automatically adjust your live balance telemetry.',
      confirmText: 'Delete Record',
      confirmClass: 'modal-btn-danger',
      onConfirm: () => {
        if (itemCard) {
          itemCard.classList.add('deleting');
          setTimeout(() => {
            transactions = transactions.filter(t => t.id !== id);
            saveTransactions();
            updateTelemetry();
            renderTransactions();
          }, 320);
        } else {
          transactions = transactions.filter(t => t.id !== id);
          saveTransactions();
          updateTelemetry();
          renderTransactions();
        }
      }
    });
  }

  /**
   * Handle Filter Tabs
   */
  function handleFilterClick(e) {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentFilter = btn.dataset.filter || 'all';
    renderTransactions();
  }

  /**
   * Handle Global Currency Switch (USD / PKR)
   */
  function handleCurrencySwitch(e) {
    const btn = e.target.closest('.currency-btn');
    if (!btn) return;

    const selectedCurrency = btn.dataset.currency;
    if (selectedCurrency && selectedCurrency !== currentCurrency) {
      currentCurrency = selectedCurrency;
      localStorage.setItem('finance_currency', currentCurrency);
      
      updateCurrencyUI();
      updateTelemetry();
      renderTransactions();
    }
  }

  /**
   * Set Default Date input to local today (YYYY-MM-DD)
   */
  function setDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Initialize App Engine
   */
  function initApp() {
    setDefaultDate();
    loadTransactions();

    // Populate initial categories based on default selected type
    const initialType = getSelectedType();
    populateCategories(initialType);

    // Initialize currency UI
    updateCurrencyUI();

    // Render telemetry & feed
    updateTelemetry();
    renderTransactions();

    // Event Listeners
    form.addEventListener('submit', handleAddTransaction);
    transactionList.addEventListener('click', handleDeleteClick);
    
    // Type change listener for dynamic category population
    typeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        populateCategories(e.target.value);
      });
    });

    // Filter clicks
    filterBtns.forEach(btn => {
      btn.addEventListener('click', handleFilterClick);
    });

    // Currency Switcher
    currencyBtns.forEach(btn => {
      btn.addEventListener('click', handleCurrencySwitch);
    });

    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  initApp();
});