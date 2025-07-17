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
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // --- Functions ---

    /**
     * Formats a date string (YYYY-MM-DD) into "Month Day, Year".
     * @param {string} dateString - The date string to format.
     * @returns {string} The formatted date.
     */
    function formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

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
                <td data-label="Date">${formatDate(transaction.date)}</td>
                <td data-label="Type" class="type-cell ${amountClass}">${transaction.type}</td>
                <td data-label="Category">${transaction.category}</td>
                <td data-label="Description">${transaction.description || '-'}</td>
                <td data-label="Amount" class="${amountClass}">$${parseFloat(transaction.amount).toFixed(2)}</td>
                <td data-label="Action">
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${transaction.id}">
                        Delete
                    </button>
                </td>
            `;
            transactionList.appendChild(tr);
        });
    }

    /**
     * Updates the summary cards.
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
     * Adds a new transaction.
     */
    function addTransaction(e) {
        e.preventDefault();

        if (!amountInput.value || !categoryInput.value || !dateInput.value || !typeInput.value) {
            showModal('Validation Error', 'Please fill out all required fields.', [{ text: 'OK', class: 'btn-primary' }]);
            return;
        }

        const newTransaction = {
            id: Date.now(),
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
     * Handles clicks on the transaction list to trigger delete confirmation.
     * --- THIS FUNCTION IS UPDATED ---
     */
    function handleListClick(e) {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const id = parseInt(deleteButton.dataset.id, 10);
            
            // Use the browser's native confirm() dialog for a direct, unmissable prompt.
            const isConfirmed = confirm('Are you sure you want to delete this transaction?');

            if (isConfirmed) {
                // If user clicks "OK", proceed with the deletion.
                transactions = transactions.filter(t => t.id !== id);
                saveTransactions();
                renderTransactions();
                updateSummary();
            }
            // If user clicks "Cancel", do nothing.
        }
    }
    
    /**
     * Initializes the application and sets up event listeners.
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