// ============================================================
// STATE
// ============================================================

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let chartInstance = null;

// ============================================================
// DOM REFS
// ============================================================

const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const transactionList = document.getElementById('transactionList');
const filterMonth = document.getElementById('filterMonth');
const filterType = document.getElementById('filterType');
const clearFilterBtn = document.getElementById('clearFilterBtn');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const transactionDesc = document.getElementById('transactionDesc');
const transactionAmount = document.getElementById('transactionAmount');
const transactionType = document.getElementById('transactionType');
const transactionMonth = document.getElementById('transactionMonth');
const analysisGrid = document.getElementById('analysisGrid');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtnMobile = document.getElementById('loginBtnMobile');
const signupBtnMobile = document.getElementById('signupBtnMobile');
const logoutBtnMobile = document.getElementById('logoutBtnMobile');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginClose = document.getElementById('loginClose');
const signupClose = document.getElementById('signupClose');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const backToTop = document.getElementById('backToTop');
const themeToggle = document.getElementById('themeToggle');
const newsletterBtn = document.getElementById('newsletterBtn');
const newsletterEmail = document.getElementById('newsletterEmail');

// ============================================================
// DARK MODE
// ============================================================

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

if (isDarkMode) {
    document.body.classList.add('dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

themeToggle.addEventListener('click', toggleDarkMode);

// ============================================================
// SET DEFAULT MONTH
// ============================================================

function setDefaultMonth() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const value = `${year}-${month}`;
    if (transactionMonth) transactionMonth.value = value;
    if (filterMonth) filterMonth.value = value;
}

// ============================================================
// ADD TRANSACTION
// ============================================================

function addTransaction() {
    const desc = transactionDesc.value.trim();
    const amount = parseFloat(transactionAmount.value);
    const type = transactionType.value;
    const month = transactionMonth.value;

    if (!desc) {
        showToast('Please enter a description.');
        return;
    }
    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount.');
        return;
    }
    if (!month) {
        showToast('Please select a month.');
        return;
    }

    const transaction = {
        id: Date.now(),
        desc,
        amount,
        type,
        month,
        date: new Date().toISOString()
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    transactionDesc.value = '';
    transactionAmount.value = '';
    transactionType.value = 'income';

    showToast('Transaction added successfully!');
    renderAll();
}

addTransactionBtn.addEventListener('click', addTransaction);

// Enter key support
transactionAmount.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTransaction();
});
transactionDesc.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTransaction();
});

// ============================================================
// DELETE TRANSACTION
// ============================================================

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        renderAll();
        showToast('Transaction deleted.');
    }
}

// ============================================================
// FILTER TRANSACTIONS
// ============================================================

function getFilteredTransactions() {
    let filtered = [...transactions];
    const month = filterMonth.value;
    const type = filterType.value;

    if (month) {
        filtered = filtered.filter(t => t.month === month);
    }
    if (type !== 'all') {
        filtered = filtered.filter(t => t.type === type);
    }

    return filtered.sort((a, b) => b.id - a.id);
}

// ============================================================
// CALCULATE BALANCES
// ============================================================

function calculateBalances() {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
        if (t.type === 'income') {
            income += t.amount;
        } else {
            expense += t.amount;
        }
    });

    const balance = income - expense;
    return { income, expense, balance };
}

// ============================================================
// RENDER TRANSACTIONS
// ============================================================

function renderTransactions() {
    const filtered = getFilteredTransactions();

    if (filtered.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions found.</p>
                <span style="font-size:0.85rem; color:#aaa;">Add a transaction to get started.</span>
            </div>
        `;
        return;
    }

    transactionList.innerHTML = filtered.map(t => {
        const isIncome = t.type === 'income';
        const icon = isIncome ? 'fa-arrow-up' : 'fa-arrow-down';
        const amountClass = isIncome ? 'income' : 'expense';
        const sign = isIncome ? '+' : '-';
        const monthDisplay = t.month ? t.month.replace('-', ' / ') : '';

        return `
            <div class="transaction-item">
                <div class="tx-info">
                    <div class="tx-icon ${t.type}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="tx-details">
                        <span class="tx-desc">${t.desc}</span>
                        <span class="tx-meta">${monthDisplay}</span>
                    </div>
                </div>
                <span class="tx-amount ${amountClass}">${sign}$${t.amount.toFixed(2)}</span>
                <button class="tx-delete" data-id="${t.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }).join('');

    // Delete handlers
    document.querySelectorAll('.tx-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteTransaction(parseInt(btn.dataset.id));
        });
    });
}

// ============================================================
// RENDER BALANCES
// ============================================================

function renderBalances() {
    const { income, expense, balance } = calculateBalances();
    totalBalance.textContent = `$${balance.toFixed(2)}`;
    totalIncome.textContent = `$${income.toFixed(2)}`;
    totalExpense.textContent = `$${expense.toFixed(2)}`;
}

// ============================================================
// RENDER ANALYSIS
// ============================================================

function renderAnalysis() {
    const months = {};
    transactions.forEach(t => {
        if (!months[t.month]) {
            months[t.month] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            months[t.month].income += t.amount;
        } else {
            months[t.month].expense += t.amount;
        }
    });

    const sortedMonths = Object.keys(months).sort();

    if (sortedMonths.length === 0) {
        analysisGrid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fas fa-chart-pie"></i>
                <p>No data to analyze.</p>
            </div>
        `;
        return;
    }

    analysisGrid.innerHTML = sortedMonths.map(month => {
        const data = months[month];
        const balance = data.income - data.expense;
        const balanceClass = balance >= 0 ? 'positive' : 'negative';
        const monthDisplay = month.replace('-', ' / ');

        return `
            <div class="analysis-card">
                <div class="month-label">${monthDisplay}</div>
                <div class="month-income">Income: $${data.income.toFixed(2)}</div>
                <div class="month-expense">Expense: $${data.expense.toFixed(2)}</div>
                <div class="month-balance ${balanceClass}">
                    ${balance >= 0 ? '+' : ''}$${balance.toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// RENDER CHART
// ============================================================

function renderChart() {
    const ctx = document.getElementById('financeChart').getContext('2d');

    const months = {};
    transactions.forEach(t => {
        if (!months[t.month]) {
            months[t.month] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            months[t.month].income += t.amount;
        } else {
            months[t.month].expense += t.amount;
        }
    });

    const sortedMonths = Object.keys(months).sort();
    const labels = sortedMonths.map(m => m.replace('-', ' / '));
    const incomeData = sortedMonths.map(m => months[m].income);
    const expenseData = sortedMonths.map(m => months[m].expense);

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [
                {
                    label: 'Income',
                    data: incomeData.length ? incomeData : [0],
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: '#4CAF50',
                    borderWidth: 2,
                    borderRadius: 6
                },
                {
                    label: 'Expense',
                    data: expenseData.length ? expenseData : [0],
                    backgroundColor: 'rgba(244, 67, 54, 0.7)',
                    borderColor: '#F44336',
                    borderWidth: 2,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-color').trim() || '#3E2723',
                        font: { weight: '600', size: 12 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: 'rgba(136, 136, 136, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================================
// CLEAR FILTERS
// ============================================================

clearFilterBtn.addEventListener('click', () => {
    filterMonth.value = '';
    filterType.value = 'all';
    renderAll();
});

// ============================================================
// FILTER CHANGE
// ============================================================

filterMonth.addEventListener('change', renderAll);
filterType.addEventListener('change', renderAll);

// ============================================================
// RENDER ALL
// ============================================================

function renderAll() {
    renderBalances();
    renderTransactions();
    renderAnalysis();
    renderChart();
}

// ============================================================
// MODALS
// ============================================================

function openModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

loginBtn.addEventListener('click', () => openModal(loginModal));
signupBtn.addEventListener('click', () => openModal(signupModal));
loginBtnMobile.addEventListener('click', () => {
    openModal(loginModal);
    closeMobileMenu();
});
signupBtnMobile.addEventListener('click', () => {
    openModal(signupModal);
    closeMobileMenu();
});

loginClose.addEventListener('click', () => closeModal(loginModal));
signupClose.addEventListener('click', () => closeModal(signupModal));

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
});

switchToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(loginModal);
    openModal(signupModal);
});

switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(signupModal);
    openModal(loginModal);
});

// ============================================================
// LOGIN / SIGNUP / LOGOUT
// ============================================================

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    if (email) {
        currentUser = { email, name: email.split('@')[0] };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        closeModal(loginModal);
        showToast(`Welcome back, ${email.split('@')[0]}!`);
        updateNavbar();
    }
});

document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    if (name && email) {
        currentUser = { email, name };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        closeModal(signupModal);
        showToast(`Welcome, ${name}!`);
        updateNavbar();
    }
});

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showToast('Logged out successfully!');
    updateNavbar();
}

logoutBtn.addEventListener('click', handleLogout);
logoutBtnMobile.addEventListener('click', () => {
    handleLogout();
    closeMobileMenu();
});

function updateNavbar() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-flex';
        logoutBtn.textContent = `Log Out (${currentUser.name})`;
        
        loginBtnMobile.style.display = 'none';
        signupBtnMobile.style.display = 'none';
        logoutBtnMobile.style.display = 'inline-flex';
        logoutBtnMobile.textContent = `Log Out (${currentUser.name})`;
    } else {
        loginBtn.style.display = 'inline-flex';
        signupBtn.style.display = 'inline-flex';
        logoutBtn.style.display = 'none';
        
        loginBtnMobile.style.display = 'inline-flex';
        signupBtnMobile.style.display = 'inline-flex';
        logoutBtnMobile.style.display = 'none';
    }
}

// ============================================================
// MOBILE MENU
// ============================================================

function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    const icon = menuToggle.querySelector('i');
    if (icon) icon.className = 'fas fa-bars';
}

menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle('open');
    const icon = menuToggle.querySelector('i');
    if (mobileMenu.classList.contains('open')) {
        icon.className = 'fas fa-times';
    } else {
        icon.className = 'fas fa-bars';
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) {
        closeMobileMenu();
    }
});

document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        closeMobileMenu();
    });
});

// ============================================================
// SCROLL EFFECTS
// ============================================================

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    backToTop.classList.toggle('visible', window.scrollY > 400);
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================================
// NEWSLETTER
// ============================================================

newsletterBtn.addEventListener('click', () => {
    const email = newsletterEmail.value.trim();
    if (email) {
        showToast(`Subscribed! Check your inbox, ${email}`);
        newsletterEmail.value = '';
    } else {
        showToast('Please enter a valid email.');
    }
});

newsletterEmail.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        newsletterBtn.click();
    }
});

// ============================================================
// TOAST
// ============================================================

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================================
// INIT
// ============================================================

setDefaultMonth();
updateNavbar();
renderAll();

console.log('FinTrack Expense Tracker loaded successfully!');
console.log('Transactions:', transactions.length);
console.log('User:', currentUser ? currentUser.name : 'Not logged in');