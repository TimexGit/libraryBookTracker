/*
    HELPER FUNCTIONS
*/
let nextLoanId = 5;

const now = new Date();
const today =
  now.getFullYear() +
  "-" +
  String(now.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(now.getDate()).padStart(2, "0");


function countActiveLoans(bookId) {
  return loans.filter((loan) => loan.bookId == bookId && !loan.returned).length;
}

function getAvailable(book) {
  return book.copies - countActiveLoans(book.id);
}

function isOverdue(loan) {
  return !loan.returned && loan.dueDate < today;
}

function getBookTitle(bookId) {
  const book = books.find((book) => book.id == bookId);
  return book.title;
}


const pageNames = ["Books", "Borrow", "Loans", "History"];

function showPage(name) {
  pageNames.forEach((pageName) => {
    document.getElementById("page" + pageName).style.display = "none";
    document.getElementById("menu" + pageName).className = "";
  });

  document.getElementById("page" + name).style.display = "block";
  document.getElementById("menu" + name).className = "active";
}




/*
    BOOKS PAGE
*/
let inputSearch = document.getElementById("inputSearch");
let selectCategory = document.getElementById("selectCategory");
let selectAvailability = document.getElementById("selectAvailability");
let bookTableBody = document.getElementById("bookTableBody");

function renderBookTable(dataArray) {
  const rowsHtml = dataArray
    .map(
      (book) => `
        <tr>
            <td>${book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.category}</td>
            <td>${book.copies}</td>
            <td>${getAvailable(book)}</td>
            <td>
              <button onclick="btnEdit(${book.id})">Edit</button>
              <button onclick="btnDelete(${book.id})">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");

  bookTableBody.innerHTML = rowsHtml;
}

function btnSearch() {
  const keyword = inputSearch.value.trim().toLowerCase();
  const category = selectCategory.value;
  const availability = selectAvailability.value;

  let result = books.filter(
    (book) =>
      String(book.id) === keyword ||
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword),
  );

  if (category != "") {
    result = result.filter((book) => book.category == category);
  }

  if (availability == "available") {
    result = result.filter((book) => getAvailable(book) > 0);
  }

  if (availability == "unavailable") {
    result = result.filter((book) => getAvailable(book) == 0);
  }

  renderBookTable(result);
}

let modal = document.getElementById("myModal");
let modalTitle = document.getElementById("modalTitle");
let span = document.getElementsByClassName("close")[0];

let inputID = document.getElementById("inputID");
let inputTitle = document.getElementById("inputTitle");
let inputAuthor = document.getElementById("inputAuthor");
let inputCategory = document.getElementById("inputCategory");
let inputCopies = document.getElementById("inputCopies");

let editingId = null;

function btnCreate() {
  editingId = null;
  modalTitle.innerText = "Create Book";
  inputID.disabled = false;

  [inputID, inputTitle, inputAuthor, inputCopies].forEach(
    (input) => (input.value = ""),
  );

  modal.style.display = "block";
}

function btnEdit(id) {
  const book = books.find((book) => book.id == id);

  editingId = id;
  modalTitle.innerText = "Edit Book";
  inputID.disabled = true;

  inputID.value = book.id;
  inputTitle.value = book.title;
  inputAuthor.value = book.author;
  inputCategory.value = book.category;
  inputCopies.value = book.copies;

  modal.style.display = "block";
}

span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

function btnSubmit() {
  const bookID = Number(inputID.value);
  const bookTitle = inputTitle.value;
  const bookAuthor = inputAuthor.value;
  const bookCategory = inputCategory.value;
  const bookCopies = Number(inputCopies.value);

  if (bookCopies < 0 || !Number.isInteger(bookCopies)) {
    alert("Total copies must be a whole number, 0 or more.");
    return;
  }

  if (editingId == null) {
    const duplicate = books.find((book) => book.id == bookID);
    if (duplicate) {
      alert("Book ID already exists.");
      return;
    }

    books.push({
      id: bookID,
      title: bookTitle,
      author: bookAuthor,
      category: bookCategory,
      copies: bookCopies,
    });
  } else {
    if (bookCopies < countActiveLoans(editingId)) {
      alert("Total copies cannot be less than the active loans of this book.");
      return;
    }

    const book = books.find((book) => book.id == editingId);
    book.title = bookTitle;
    book.author = bookAuthor;
    book.category = bookCategory;
    book.copies = bookCopies;
  }

  modal.style.display = "none";
  renderAll();
}

function btnDelete(id) {
  if (countActiveLoans(id) > 0) {
    alert("Cannot delete a book that has active loans.");
    return;
  }

  const index = books.findIndex((book) => book.id == id);
  books.splice(index, 1);

  renderAll();
}





/*
    BORROW BOOK PAGE
*/
let selectBook = document.getElementById("selectBook");
let inputBorrower = document.getElementById("inputBorrower");
let inputBorrowDate = document.getElementById("inputBorrowDate");
let inputDueDate = document.getElementById("inputDueDate");

function renderBookOptions() {
  const optionsHtml = books
    .map(
      (book) => `
        <option value="${book.id}">${book.id} - ${book.title} (${getAvailable(book)} available)</option>
    `,
    )
    .join("");

  selectBook.innerHTML = optionsHtml;
}

function btnBorrow() {
  const bookId = Number(selectBook.value);
  const borrower = inputBorrower.value;
  const borrowDate = inputBorrowDate.value;
  const dueDate = inputDueDate.value;

  const book = books.find((book) => book.id == bookId);

  if (getAvailable(book) <= 0) {
    alert("No copies available for this book.");
    return;
  }

  if (dueDate < borrowDate) {
    alert("Due date must be on or after the borrowing date.");
    return;
  }

  loans.push({
    id: nextLoanId,
    bookId: bookId,
    borrower: borrower,
    borrowDate: borrowDate,
    dueDate: dueDate,
    returned: false,
  });
  nextLoanId = nextLoanId + 1;

  inputBorrower.value = "";
  inputDueDate.value = "";

  renderAll();
  showPage("Loans");
}




/*
    ACTIVE LOANS PAGE
*/
let loanTableBody = document.getElementById("loanTableBody");

function renderLoanTable() {
  const activeLoans = loans.filter((loan) => !loan.returned);

  const rowsHtml = activeLoans
    .map(
      (loan) => `
        <tr class="${isOverdue(loan) ? "overdue" : ""}">
            <td>${loan.id}</td>
            <td>${getBookTitle(loan.bookId)}</td>
            <td>${loan.borrower}</td>
            <td>${loan.borrowDate}</td>
            <td>${loan.dueDate}</td>
            <td><button onclick="btnReturn(${loan.id})">Return</button></td>
        </tr>
    `,
    )
    .join("");

  loanTableBody.innerHTML = rowsHtml;
}

function btnReturn(id) {
  const loan = loans.find((loan) => loan.id == id);

  if (loan.returned) {
    alert("This loan is already returned.");
    return;
  }

  loan.returned = true;
  renderAll();
}




/*
    HISTORY PAGE
*/
let historyTableBody = document.getElementById("historyTableBody");

function renderHistoryTable() {
  const rowsHtml = loans
    .map(
      (loan) => `
        <tr>
            <td>${loan.id}</td>
            <td>${getBookTitle(loan.bookId)}</td>
            <td>${loan.borrower}</td>
            <td>${loan.borrowDate}</td>
            <td>${loan.dueDate}</td>
            <td>${loan.returned ? "Returned" : "Not Returned"}</td>
        </tr>
    `,
    )
    .join("");

  historyTableBody.innerHTML = rowsHtml;
}

function renderAll() {
  btnSearch();
  renderBookOptions();
  renderLoanTable();
  renderHistoryTable();
}

inputBorrowDate.value = today;
renderAll();
showPage("Books");
