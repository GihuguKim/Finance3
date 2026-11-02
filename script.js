/**
 * GYANNA'S SOFTWARE ENGINEERING STUDIO // PROJECT 07
 * Personal Finance & Analytics Ledger Engine
 * Architecture: Pure JavaScript ES6+, Web Storage API & HTML5 Canvas 2D
 */

// 1. DATA STATE MANAGEMENT
let transactions = [];
let currentFilter = 'all';

// Category Color Palette for Analytics
const categoryColors = {
  Academics: '#6366f1',   // Indigo
  Technology: '#06b6d4',  // Cyan
  Transport: '#f59e0b',   // Amber
  Stipend: '#10b981',     // Emerald
  Food: '#ec4899',        // Pink
  Other: '#8b5cf6'        // Violet
};

// 2. DOM TARGET REFERENCES
const totalBalanceEl = document.getElementById('total-balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const savingsRateEl = document.getElementById('savings-rate');
const balanceStatusEl = document.getElementById('balance-status');
const incomeCountEl = document.getElementById('income-count');
const expenseCountEl = document.getElementById('expense-count');

const transactionForm = document.getElementById('transaction-form');
const descInput = document.getElementById('desc-input');
const amountInput = document.getElementById('amount-input');
const typeSelect = document.getElementById('type-select');
const categorySelect = document.getElementById('category-select');
const formError = document.getElementById('form-error');

const ledgerBody = document.getElementById('ledger-body');
const emptyState = document.getElementById('empty-state');
const canvas = document.getElementById('analyticsCanvas');
const ctx = canvas.getContext('2d');
const chartLegend = document.getElementById('chart-legend');

// 3. SEED STARTER DATA (If user storage is fresh)
function initializeSeedData() {
  const storedData = localStorage.getItem('gyannaFinanceTransactions');
  if (storedData) {
    try {
      transactions = JSON.parse(storedData);
    } catch (e) {
      console.error("Error parsing stored data:", e);
      transactions = [];
    }
  } else {
    // Academic Sixth Form Seed Data
    transactions = [
      {
        id: 'txn-101',
        description: 'Sixth Form Monthly Academic Stipend',
        amount: 350.00,
        type: 'income',
        category: 'Stipend',
        date: '2026-10-25'
      },
      {
        id: 'txn-102',
        description: 'Edexcel Pure Mathematics 2 Textbook',
        amount: 38.50,
        type: 'expense',
        category: 'Academics',
        date: '2026-10-26'
      },
      {
        id: 'txn-103',
        description: 'GitHub Copilot Student Developer Subscription',
        amount: 10.00,
        type: 'expense',
        category: 'Technology',
        date: '2026-10-28'
      },
      {
        id: 'txn-104',
        description: 'Weekly Campus Commute Pass',
        amount: 22.00,
        type: 'expense',
        category: 'Transport',
        date: '2026-10-30'
      }
    ];
    persistData();
  }
}

// 4. STORAGE PERSISTENCE ENGINE
function persistData() {
  localStorage.setItem('gyannaFinanceTransactions', JSON.stringify(transactions));
}

// 5. TRANSACTION FORM SUBMISSION HANDLER
function handleTransactionSubmit(event) {
  event.preventDefault(); // Intercept browser page refresh

  const desc = descInput.value.trim();
  const rawAmount = parseFloat(amountInput.value);
  const type = typeSelect.value;
  const category = categorySelect.value;

  // Validation
  if (!desc || isNaN(rawAmount) || rawAmount <= 0) {
    formError.textContent = 'Please enter a valid description and a positive numerical amount.';
    return;
  }
  formError.textContent = '';

  // Construct Transaction Object
  const newTransaction = {
    id: 'txn-' + Date.now(),
    description: desc,
    amount: parseFloat(rawAmount.toFixed(2)),
    type: type,
    category: category,
    date: new Date().toISOString().split('T')[0]
  };

  // Prepend to array
  transactions.unshift(newTransaction);
  persistData();

  // Reset form fields
  descInput.value = '';
  amountInput.value = '';
  descInput.focus();

  // Refresh UI
  renderAll();
}

// 6. DELETE INDIVIDUAL TRANSACTION
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  persistData();
  renderAll();
}

// 7. WIPE ENTIRE CACHE (RESTORATION GUARD)
function clearAllData() {
  const confirmed = window.confirm("Are you sure you want to reset all records to empty?");
  if (confirmed) {
    transactions = [];
    persistData();
    renderAll();
  }
}

// 8. FILTER LEDGER RECORDS
function filterLedger(filterType) {
  currentFilter = filterType;
  
  // Update active chip styling
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filterType);
  });

  renderLedgerTable();
}

// 9. FINANCIAL AGGREGATIONS & MATHEMATICAL ACCUMULATIONS
function calculateMetrics() {
  const incomeTotal = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = incomeTotal - expenseTotal;

  // Savings efficiency percentage: (Net / Income) * 100
  const savingsRatio = incomeTotal > 0 ? Math.max(0, (netBalance / incomeTotal) * 100) : 0;

  const incomeCount = transactions.filter(t => t.type === 'income').length;
  const expenseCount = transactions.filter(t => t.type === 'expense').length;

  return {
    incomeTotal,
    expenseTotal,
    netBalance,
    savingsRatio,
    incomeCount,
    expenseCount
  };
}

// 10. RENDER KPI SUMMARY CARDS
function renderKPIs() {
  const metrics = calculateMetrics();

  // Net Balance
  totalBalanceEl.textContent = `${metrics.netBalance < 0 ? '-' : ''}$${Math.abs(metrics.netBalance).toFixed(2)}`;
  
  if (metrics.netBalance > 0) {
    balanceStatusEl.className = 'badge badge-surplus';
    balanceStatusEl.textContent = 'Surplus (+)';
    totalBalanceEl.style.color = '#34d399';
  } else if (metrics.netBalance < 0) {
    balanceStatusEl.className = 'badge badge-deficit';
    balanceStatusEl.textContent = 'Deficit (-)';
    totalBalanceEl.style.color = '#fb7185';
  } else {
    balanceStatusEl.className = 'badge badge-neutral';
    balanceStatusEl.textContent = 'Equilibrium';
    totalBalanceEl.style.color = '#f8fafc';
  }

  // Income & Expenses
  totalIncomeEl.textContent = `+$${metrics.incomeTotal.toFixed(2)}`;
  totalExpenseEl.textContent = `-$${metrics.expenseTotal.toFixed(2)}`;
  incomeCountEl.textContent = `${metrics.incomeCount} credit${metrics.incomeCount === 1 ? '' : 's'} recorded`;
  expenseCountEl.textContent = `${metrics.expenseCount} debit${metrics.expenseCount === 1 ? '' : 's'} recorded`;

  // Savings Efficiency Rate
  savingsRateEl.textContent = `${metrics.savingsRatio.toFixed(1)}%`;
}

// 11. RENDER LEDGER TABLE
function renderLedgerTable() {
  ledgerBody.innerHTML = '';

  const filteredList = transactions.filter(t => {
    if (currentFilter === 'all') return true;
    return t.type === currentFilter;
  });

  if (filteredList.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';

    filteredList.forEach(t => {
      const tr = document.createElement('tr');
      const isIncome = t.type === 'income';

      tr.innerHTML = `
        <td class="mono text-muted">${t.date}</td>
        <td><strong>${escapeHtml(t.description)}</strong></td>
        <td><span class="category-tag">${t.category}</span></td>
        <td>
          <span class="badge ${isIncome ? 'badge-surplus' : 'badge-deficit'}">
            ${isIncome ? 'Inflow' : 'Outflow'}
          </span>
        </td>
        <td class="text-right mono font-bold ${isIncome ? 'text-income' : 'text-expense'}">
          ${isIncome ? '+' : '-'}$${t.amount.toFixed(2)}
        </td>
        <td class="text-center">
          <button class="btn-delete-row" title="Delete entry" onclick="deleteTransaction('${t.id}')">&times;</button>
        </td>
      `;

      ledgerBody.appendChild(tr);
    });
  }
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// 12. NATIVE CANVAS ANALYTICS ENGINE (EXPENSE CATEGORY DISTRIBUTION)
function renderCanvasAnalytics() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Filter only expenses
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Update Legend Container
  chartLegend.innerHTML = '';

  if (totalExpense === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('No expense data logged yet.', w / 2, h / 2);
    return;
  }

  // Aggregate totals by category
  const categoryTotals = {};
  expenseTransactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  // Render Horizontal Progress Bars on Canvas
  const categories = Object.keys(categoryTotals);
  const startX = 140;
  const startY = 35;
  const barHeight = 18;
  const gap = 36;
  const maxBarWidth = w - startX - 80;

  categories.forEach((cat, idx) => {
    const amount = categoryTotals[cat];
    const pct = (amount / totalExpense);
    const barWidth = Math.max(8, pct * maxBarWidth);
    const color = categoryColors[cat] || '#818cf8';
    const yPos = startY + idx * gap;

    // Label on left
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(cat, startX - 14, yPos + 13);

    // Background track bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(startX, yPos, maxBarWidth, barHeight, 4);
    } else {
      ctx.rect(startX, yPos, maxBarWidth, barHeight);
    }
    ctx.fill();

    // Filled colored progress bar
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(startX, yPos, barWidth, barHeight, 4);
    } else {
      ctx.rect(startX, yPos, barWidth, barHeight);
    }
    ctx.fill();

    // Amount & percentage label on right
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`$${amount.toFixed(0)} (${(pct * 100).toFixed(0)}%)`, startX + barWidth + 8, yPos + 13);

    // Inject into HTML Legend
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <span class="legend-color" style="background-color: ${color}"></span>
      <span>${cat}: $${amount.toFixed(2)} (${(pct * 100).toFixed(1)}%)</span>
    `;
    chartLegend.appendChild(legendItem);
  });
}

// 13. MASTER RENDER CONTROLLER
function renderAll() {
  renderKPIs();
  renderLedgerTable();
  renderCanvasAnalytics();
}

// 14. INITIALIZATION ON DOM LOAD
document.addEventListener('DOMContentLoaded', () => {
  initializeSeedData();
  renderAll();
});