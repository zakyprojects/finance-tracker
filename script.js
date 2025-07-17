// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Selectors ---
    const transactionForm = document.getElementById('transaction-form');
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');
    const descriptionInput = document.getElementById('description');
    const dateInput = document.getElementById('date');
    const typeInput = document.getElementById('type');
    const transactionList = document.getElementById('transaction-list');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const balanceEl = document.getElementById('balance');
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalButtons = document.getElementById('modal-buttons');

    // --- State Management ---
    // Load transactions from localStorage or initialize an empty array
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // --- Functions ---

    /**
     * Shows a custom modal for alerts or confirmations.
     * @param {string} title - The title for the modal.
     * @param {string} text - The main message text.
     * @param {Array} buttons - An array of button objects, e.g., [{text: 'OK', class: 'btn-primary', action: () => {...}}]
     */
    function showModal(title, text, buttons) {
        modalTitle.textContent = title;
        modalText.textContent = text;
        modalButtons.innerHTML = ''; // Clear previous buttons

        buttons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.textContent = btnInfo.text;
            button.className = `btn ${btnInfo.class}`;
            button.addEventListener('click', () => {
                modal.style.display = 'none';
                if (btnInfo.action) {
                    btnInfo.action();
                }
            });
            modalButtons.appendChild(button);
        });

        modal.style.display = 'flex';
    }

    /**
     * Saves the current transactions array to localStorage.
     */
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    /**
     * Renders all transactions to the table in the DOM.
     */
    function renderTransactions() {
        transactionList.innerHTML = '';

        if (transactions.length === 0) {
            transactionList.innerHTML = '<tr><td colspan="6" class="text-center">No transactions yet.</td></tr>';
            return;
        }

        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedTransactions.forEach(transaction => {
            const tr = document.createElement('tr');
            const amountClass = transaction.type === 'income' ? 'income' : 'expense';
            tr.innerHTML = `
                <td>${transaction.date}</td>
                <td class="type-cell ${amountClass}">${transaction.type}</td>
                <td>${transaction.category}</td>
                <td>${transaction.description || '-'}</td>
                <td class="${amountClass}">$${parseFloat(transaction.amount).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${transaction.id}">
                        Delete
                    </button>
                </td>
            `;
            transactionList.appendChild(tr);
        });
    }

    /**
     * Updates the summary cards (Income, Expense, Balance).
     */
    function updateSummary() {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + parseFloat(t.amount), 0);

        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + parseFloat(t.amount), 0);

        const balance = income - expense;

        totalIncomeEl.textContent = `$${income.toFixed(2)}`;
        totalExpenseEl.textContent = `$${expense.toFixed(2)}`;
        balanceEl.textContent = `$${balance.toFixed(2)}`;
    }

    /**
     * Adds a new transaction based on form input.
     * @param {Event} e - The form submission event.
     */
    function addTransaction(e) {
        e.preventDefault();

        if (amountInput.value.trim() === '' || categoryInput.value.trim() === '' || dateInput.value.trim() === '' || typeInput.value === '') {
            showModal('Validation Error', 'Please fill out all required fields: Amount, Category, Date, and Type.', [{ text: 'OK', class: 'btn-primary' }]);
            return;
        }

        const newTransaction = {
            id: Date.now(), // Use timestamp for a unique ID
            amount: amountInput.value,
            category: categoryInput.value,
            description: descriptionInput.value,
            date: dateInput.value,
            type: typeInput.value,
        };

        transactions.push(newTransaction);
        saveTransactions();
        renderTransactions();
        updateSummary();
        transactionForm.reset();
        dateInput.valueAsDate = new Date();
    }

    /**
     * Handles click events on the transaction list for deleting items.
     * @param {Event} e - The click event.
     */
    function handleListClick(e) {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.dataset.id, 10);
            showModal(
                'Confirm Deletion',
                'Are you sure you want to delete this transaction?',
                [
                    {
                        text: 'Cancel',
                        class: 'btn-secondary',
                        action: null
                    },
                    {
                        text: 'Delete',
                        class: 'btn-danger',
                        action: () => {
                            transactions = transactions.filter(t => t.id !== id);
                            saveTransactions();
                            renderTransactions();
                            updateSummary();
                        }
                    }
                ]
            );
        }
    }
    
    /**
     * Initializes the application.
     */
    function init() {
        dateInput.valueAsDate = new Date();
        renderTransactions();
        updateSummary();
        transactionForm.addEventListener('submit', addTransaction);
        transactionList.addEventListener('click', handleListClick);
    }

    // --- Initial Application Load ---
    init();
});
