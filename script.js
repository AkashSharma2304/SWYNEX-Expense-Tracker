let greeting = document.getElementById("greeting");
let currentTime = new Date();
let currentHours = currentTime.getHours();
if (currentHours >= 5 && currentHours < 12) {
    greeting.innerText = "Good Morning";
} else if (currentHours >= 12 && currentHours < 17) {
    greeting.innerText = "Good Afternoon";
} else if (currentHours >= 17 && currentHours < 21) {
    greeting.innerText = "Good Evening";
} else {
    greeting.innerText = "Good Night";
}
let greetingMessage = greeting.innerText;
let username = document.getElementById("username");
let nameinput = document.getElementById("userName");
let savename = localStorage.getItem("username");

if (savename) {
    username.innerText = savename;
    greeting.innerText = greetingMessage + ", " + savename + " !";
}
nameinput.value = savename || "";
nameinput.addEventListener("input", function () {
    username.innerText = nameinput.value;
    greeting.innerText = greetingMessage + ", " + username.innerText + " !";
    localStorage.setItem("username", nameinput.value);
});
let resetName = document.getElementById("resetName");
resetName.addEventListener("click", function () {
    localStorage.removeItem("username");
    username.innerText = "";
    nameinput.value = "";
    greeting.innerText = greetingMessage;
});

//------------------------------- Currency Settings---------------------------

let currency = document.getElementById("currency");
let savecurrency = localStorage.getItem("currency");
if (savecurrency) {
    currency.value = savecurrency;
}
let currencysymbol = "";
function updateCurrencysymbol() {
    if (currency.value === "INR") {
        currencysymbol = "₹";
    } else if (currency.value === "USD") {
        currencysymbol = "$";
    } else if (currency.value === "EURO") {
        currencysymbol = "€";
    } else {
        currencysymbol = "";
    }

}
updateCurrencysymbol();

// -----------------------Get HTML Elements---------------------------------

let transactionForm = document.getElementById("transactionForm");
let transactionTableBody = document.getElementById("transactionTableBody");
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editIndex = null;
let submitButton = transactionForm.querySelector('button[type="submit"]');
localStorage.removeItem("chartHistory");
transactions.forEach(function (transaction) {

    if (!transaction.id) {
        transaction.id = Date.now() + Math.random();
    }

});

localStorage.setItem("transactions", JSON.stringify(transactions));
function displayTransactions(data = transactions) {
    transactionTableBody.innerHTML = "";
    data.forEach(function (transaction) {
        let index = transactions.findIndex(function (item) {
            return item.id === transaction.id;
        });
        transactionTableBody.innerHTML += `
            <tr class="${transaction.Type}">
                <td>${transaction.Title}</td>
                <td>${transaction.Category}</td>
                <td>${transaction.Date}</td>
                <td>${currencysymbol}${Number(transaction.Amount).toFixed(2)}</td>
                <td>${transaction.Type}</td>
                <td>${transaction.Description}</td>
                <td>
                    <button type="button" class="delete-btn" data-index="${index}">
                        Delete
                    </button>
                    <button type="button" class="edit-btn" data-index="${index}">
                        Edit
                    </button>
                </td>
            </tr>
        `;
    });

    deleteTransaction();
    editTransaction();
}

//  ----------------------Individual Transaction Delete---------------------------------

function deleteTransaction() {
    let deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            let index = Number(button.getAttribute("data-index"));
            transactions.splice(index, 1);
            localStorage.setItem("transactions", JSON.stringify(transactions));
            applyFilters();
            updateSummary();
            updateCharts();
        });
    });
}

// -----------------------------------Edit Transaction---------------------------------

function editTransaction() {
    let editButtons = document.querySelectorAll(".edit-btn");
    editButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            let index = Number(button.getAttribute("data-index"));
            let transaction = transactions[index];
            editIndex = index;
            document.getElementById("transactiontitle").value = transaction.Title;
            document.getElementById("amount").value = transaction.Amount;
            document.getElementById("transactionType").value = transaction.Type;
            document.getElementById("category").value = transaction.Category;
            document.getElementById("transactionDate").value = transaction.Date;
            document.getElementById("description").value = transaction.Description;
            submitButton.innerText = "Update Transaction";
        });
    });
}

// Update Dashboard Summary

function updateSummary() {
    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach(function (transaction) {
        if (transaction.Type === "income") {
            totalIncome += Number(transaction.Amount);
        } else if (transaction.Type === "expense") {
            totalExpenses += Number(transaction.Amount);
        }
    });
    let totalBalance = totalIncome - totalExpenses;
    document.getElementById("totalIncome").innerText =
        currencysymbol + totalIncome.toFixed(2);
    document.getElementById("totalExpenses").innerText =
        currencysymbol + totalExpenses.toFixed(2);
    document.getElementById("totalBalance").innerText =
        currencysymbol + totalBalance.toFixed(2);
}

// Get Last Three Months

function getLastThreeMonths() {
    let months = [];
    let currentDate = new Date();
    for (let i = 2; i >= 0; i--) {
        let date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
        );
        let year = date.getFullYear();
        let month = String(date.getMonth() + 1).padStart(2, "0");
        months.push({
            key: year + "-" + month,
            label: date.toLocaleString("en-IN", {
                month: "short"
            }) + " " + year
        });
    }
    return months;
}

// Chart Elements

let monthlyChart = document.getElementById("monthly-income-chart");
let expenseChart = document.getElementById("expense-categories-chart");
let incomeExpenseChart;
let expenseCategoryChart;
function createTopSpendingChart() {
    let categories = [
        "food",
        "shopping",
        "travel",
        "bills",
        "entertainment",
        "other"
    ];
    let categoryLabels = [
        "Food",
        "Shopping",
        "Travel",
        "Bills",
        "Entertainment",
        "Other"
    ];
    let categoryTotals = categories.map(function (category) {
        let total = 0;
        transactions.forEach(function (transaction) {
            if (
                transaction.Type === "expense" &&
                transaction.Category === category
            ) {

                total += Number(transaction.Amount);

            }
        });
        return total;
    });
    let sortedCategories = categoryLabels.map(function (label, index) {
        return {
            label: label,
            total: categoryTotals[index]
        };
    }).filter(function (item) {
        return item.total > 0;
    }).sort(function (a, b) {
        return b.total - a.total;
    });
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    incomeExpenseChart = new Chart(monthlyChart, {
        type: "bar",
        data: {
            labels: sortedCategories.map(function (item) {
                return item.label;
            }),
            datasets: [
                {
                    label: "Total Spending",
                    data: sortedCategories.map(function (item) {
                        return item.total;
                    }),
                    backgroundColor: "#16A34A",
                    borderRadius: 5
                }
            ]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Expense Category Chart

function createExpenseCategoryChart() {
    let months = getLastThreeMonths();
    let categories = [
        "food",
        "shopping",
        "travel",
        "bills",
        "entertainment",
        "other"
    ];
    let categoryLabels = [
        "Food",
        "Shopping",
        "Travel",
        "Bills",
        "Entertainment",
        "Other"
    ];
    let categoryData = [];
    categories.forEach(function (category) {
        let total = 0;
        transactions.forEach(function (transaction) {
            let transactionMonth = transaction.Date.substring(0, 7);
            if (
                transaction.Type === "expense" &&
                transaction.Category === category &&
                months.some(function (month) {
                    return month.key === transactionMonth;
                })
            ) {
                total += Number(transaction.Amount);
            }
        });
        categoryData.push(total);
    });
    if (expenseCategoryChart) {
        expenseCategoryChart.destroy();
    }
    expenseCategoryChart = new Chart(expenseChart, {
        type: "doughnut",
        data: {
            labels: categoryLabels,
            datasets: [
                {
                    label: "Expenses",
                    data: categoryData,
                    backgroundColor: [
                        "#16A34A",
                        "#3B82F6",
                        "#F59E0B",
                        "#EF4444",
                        "#8B5CF6",
                        "#64748B"
                    ],
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

// Update Both Charts

function updateCharts() {
    createTopSpendingChart();
    createExpenseCategoryChart();
}

// Page Load

displayTransactions();
updateSummary();
updateCharts();

// Currency Change

currency.addEventListener("change", function () {
    localStorage.setItem("currency", currency.value);
    updateCurrencysymbol();
    applyFilters();
    updateSummary();
});

// Add / Update Transaction

transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();
    let transactiontitle = document.getElementById("transactiontitle").value;
    let category = document.getElementById("category").value;
    let transactionDate = document.getElementById("transactionDate").value;
    let amount = document.getElementById("amount").value;
    let description = document.getElementById("description").value;
    let transactionType = document.getElementById("transactionType").value;
    let transaction = {
        id: editIndex === null
            ? Date.now() + Math.random()
            : transactions[editIndex].id,
        Title: transactiontitle,
        Category: category,
        Date: transactionDate,
        Amount: amount,
        Type: transactionType,
        Description: description
    };
    if (editIndex === null) {
        transactions.push(transaction);
    } else {
        transactions[editIndex] = transaction;
        editIndex = null;
        submitButton.innerText = "Add Transaction";
    }
    localStorage.setItem("transactions", JSON.stringify(transactions));
    applyFilters();
    updateSummary();
    updateCharts();
    transactionForm.reset();
});

// Clear All Transactions Modal

let clearTransactions = document.getElementById("clearTransactions");
let deletemodel = document.getElementById("deletemodel");
let cancelDelete = document.getElementById("cancelDelete");
let confirmDelete = document.getElementById("confirmDelete");
clearTransactions.addEventListener("click", function () {
    deletemodel.style.display = "flex";
});
cancelDelete.addEventListener("click", function () {
    deletemodel.style.display = "none";
});
confirmDelete.addEventListener("click", function () {
    transactions = [];
    editIndex = null;
    localStorage.setItem("transactions", JSON.stringify(transactions));
    transactionForm.reset();
    submitButton.innerText = "Add Transaction";
    applyFilters();
    updateSummary();
    updateCharts();
    deletemodel.style.display = "none";
});

// Apply Search and Filters

let searchInput = document.getElementById("searchInput");
let filterType = document.getElementById("filterType");
let filterCategory = document.getElementById("filterCategory");
function applyFilters() {
    let searchValue = searchInput.value.toLowerCase();
    let selectedType = filterType.value;
    let selectedCategory = filterCategory.value;
    let filteredTransactions = transactions.filter(function (transaction) {
        let matchSearch = transaction.Title.toLowerCase().includes(searchValue);
        let matchType =
            selectedType === "all" || transaction.Type === selectedType;
        let matchCategory =
            selectedCategory === "all" ||
            transaction.Category === selectedCategory;
        return matchSearch && matchType && matchCategory;
    });
    displayTransactions(filteredTransactions);
}

// Event Listeners

searchInput.addEventListener("input", applyFilters);
filterType.addEventListener("change", applyFilters);
filterCategory.addEventListener("change", applyFilters);
let menuToggle = document.getElementById("menuToggle");
let closeSidebar = document.getElementById("closeSidebar");
let sidebar = document.querySelector(".sidebar");

// Open Sidebar

menuToggle.addEventListener("click", function () {
    sidebar.classList.add("active");
});
closeSidebar.addEventListener("click", function () {
    sidebar.classList.remove("active");
});
let backToTop = document.getElementById("backToTop");
window.addEventListener("scroll", function () {
    if (window.scrollY > 200) {
        backToTop.style.display = "block";
    } else {
        backToTop.style.display = "none";
    }
});

backToTop.addEventListener("click", function () {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});