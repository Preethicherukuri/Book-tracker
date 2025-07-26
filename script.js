document.addEventListener('DOMContentLoaded', function() {
    // Initialize default shelves
    const defaultShelves = ['To Read', 'Reading', 'Read'];
    let shelves = JSON.parse(localStorage.getItem('lorelineShelves')) || defaultShelves;
    let books = JSON.parse(localStorage.getItem('lorelineBooks')) || [];
    
    // DOM elements
    const shelvesList = document.getElementById('shelvesList');
    const booksDisplay = document.getElementById('booksDisplay');
    const addBookBtn = document.getElementById('addBookBtn');
    const addShelfBtn = document.getElementById('addShelfBtn');
    const searchInput = document.getElementById('searchInput');
    const bookModal = document.getElementById('bookModal');
    const detailsModal = document.getElementById('detailsModal');
    const shelfModal = document.getElementById('shelfModal');
    const bookForm = document.getElementById('bookForm');
    const shelfForm = document.getElementById('shelfForm');
    const bookShelfSelect = document.getElementById('bookShelf');
    const moveShelfSelect = document.getElementById('moveShelfSelect');
    const currentPageContainer = document.getElementById('currentPageContainer');
    const currentPageInput = document.getElementById('currentPage');
    const closeButtons = document.querySelectorAll('.close');
    const saveMessage = document.getElementById('saveMessage');
    
    // Current book being viewed/modified
    let currentBookId = null;
    let currentRating = 0;
    let currentShelf = 'Reading'; // Default selected shelf
    
    // Initialize the app
    function init() {
        renderShelvesList();
        updateShelfSelects();
        renderBooksForShelf(currentShelf);
        
        // Load books if they exist
        if (books.length > 0) {
            renderBooksForShelf(currentShelf);
        }
    }
    
    // Render shelves list
    function renderShelvesList() {
        shelvesList.innerHTML = '';
        
        shelves.forEach(shelf => {
            const shelfItem = document.createElement('div');
            shelfItem.className = `shelf-item ${shelf === currentShelf ? 'active' : ''}`;
            shelfItem.textContent = shelf;
            shelfItem.dataset.shelf = shelf;
            
            // Only add delete button for non-default shelves
            if (!defaultShelves.includes(shelf)) {
                const deleteShelfBtn = document.createElement('button');
                deleteShelfBtn.className = 'delete-shelf';
                deleteShelfBtn.textContent = '×';
                deleteShelfBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteShelf(shelf);
                });
                shelfItem.appendChild(deleteShelfBtn);
            }
            
            shelfItem.addEventListener('click', () => {
                currentShelf = shelf;
                renderShelvesList();
                renderBooksForShelf(shelf);
            });
            
            shelvesList.appendChild(shelfItem);
        });
    }
    
    // Render books for selected shelf
    function renderBooksForShelf(shelfName, filter = '') {
        booksDisplay.innerHTML = '';
        
        // Filter books for this shelf
        let shelfBooks = books.filter(book => book.shelf === shelfName);
        
        // Apply search filter if provided
        if (filter) {
            const searchTerm = filter.toLowerCase();
            shelfBooks = shelfBooks.filter(book => 
                book.title.toLowerCase().includes(searchTerm) || 
                book.author.toLowerCase().includes(searchTerm)
            );
        }
        
        // Add books to display
        if (shelfBooks.length > 0) {
            shelfBooks.forEach(book => {
                const bookElement = createBookElement(book);
                booksDisplay.appendChild(bookElement);
            });
        } else {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-shelf';
            emptyMsg.textContent = 'No books on this shelf yet';
            booksDisplay.appendChild(emptyMsg);
        }
    }
    
    // Create book element
    function createBookElement(book) {
        const bookElement = document.createElement('div');
        bookElement.className = 'book';
        bookElement.dataset.id = book.id;
    
        const bookSpine = document.createElement('div');
        bookSpine.className = 'book-spine';
    
        const bookTitle = document.createElement('div');
        bookTitle.className = 'book-title';
        bookTitle.textContent = book.title;
    
        const bookAuthor = document.createElement('div');
        bookAuthor.className = 'book-author';
        bookAuthor.textContent = book.author;
    
        const bookCover = document.createElement('div');
        bookCover.className = 'book-cover';
    
        bookSpine.appendChild(bookTitle);
        bookSpine.appendChild(bookAuthor);
        bookElement.appendChild(bookSpine);
        bookElement.appendChild(bookCover);
    
        bookElement.addEventListener('click', () => showBookDetails(book.id));
    
        return bookElement;
    }
    
    // Update shelf select options in forms
    function updateShelfSelects() {
        bookShelfSelect.innerHTML = '';
        moveShelfSelect.innerHTML = '';
        
        shelves.forEach(shelf => {
            const option1 = document.createElement('option');
            option1.value = shelf;
            option1.textContent = shelf;
            bookShelfSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = shelf;
            option2.textContent = shelf;
            moveShelfSelect.appendChild(option2);
        });
    }
    
    // Show add book modal
    addBookBtn.addEventListener('click', () => {
        bookForm.reset();
        bookModal.style.display = 'block';
    });
    
    // Show add shelf modal
    addShelfBtn.addEventListener('click', () => {
        shelfForm.reset();
        shelfModal.style.display = 'block';
    });
    
    // Close modals
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Handle add book form submission
    bookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('bookTitle').value.trim();
        const author = document.getElementById('bookAuthor').value.trim();
        const pages = parseInt(document.getElementById('bookPages').value);
        const shelf = document.getElementById('bookShelf').value;
        
        // Check if book already exists
        if (books.some(book => book.title.toLowerCase() === title.toLowerCase() && 
                              book.author.toLowerCase() === author.toLowerCase())) {
            alert('This book already exists in your collection!');
            return;
        }
        
        const newBook = {
            id: Date.now().toString(),
            title,
            author,
            pages,
            currentPage: 0,
            shelf,
            addedDate: new Date().toISOString(),
            startDate: shelf === 'Reading' || shelf === 'Read' ? new Date().toISOString() : null,
            endDate: shelf === 'Read' ? new Date().toISOString() : null,
            rating: 0,
            opinion: ''
        };
        
        books.push(newBook);
        saveData();
        renderBooksForShelf(currentShelf);
        bookModal.style.display = 'none';
    });
    
    // Handle add shelf form submission
    shelfForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const shelfName = document.getElementById('newShelfName').value.trim();
        
        if (shelves.includes(shelfName)) {
            alert('A shelf with this name already exists!');
            return;
        }
        
        shelves.push(shelfName);
        saveData();
        renderShelvesList();
        updateShelfSelects();
        shelfModal.style.display = 'none';
    });
    
    // Delete a shelf
    function deleteShelf(shelfName) {
        // Check if shelf has books
        const shelfBooks = books.filter(book => book.shelf === shelfName);
        
        if (shelfBooks.length > 0) {
            if (!confirm(`This shelf contains ${shelfBooks.length} book(s). Are you sure you want to delete it?`)) {
                return;
            }
            
            // Move books to "To Read" shelf
            books.forEach(book => {
                if (book.shelf === shelfName) {
                    book.shelf = 'To Read';
                }
            });
        }
        
        shelves = shelves.filter(shelf => shelf !== shelfName);
        
        // If we're deleting the currently selected shelf, switch to Reading shelf
        if (shelfName === currentShelf) {
            currentShelf = 'Reading';
        }
        
        saveData();
        renderShelvesList();
        renderBooksForShelf(currentShelf);
        updateShelfSelects();
    }
    
    // Show book details
    function showBookDetails(bookId) {
        const book = books.find(b => b.id === bookId);
        if (!book) return;
        
        currentBookId = bookId;
        currentRating = book.rating || 0;
        
        document.getElementById('detailTitle').textContent = book.title;
        document.getElementById('detailAuthor').textContent = book.author;
        document.getElementById('detailPages').textContent = book.pages;
        document.getElementById('detailShelf').textContent = book.shelf;
        document.getElementById('detailStartDate').textContent = book.startDate ? new Date(book.startDate).toLocaleDateString() : 'Not started';
        document.getElementById('detailEndDate').textContent = book.endDate ? new Date(book.endDate).toLocaleDateString() : 'Not finished';
        document.getElementById('bookOpinion').value = book.opinion || '';
        
        // Show current page input only for Reading shelf
        if (book.shelf === 'Reading') {
            currentPageContainer.style.display = 'block';
            currentPageInput.value = book.currentPage || 0;
        } else {
            currentPageContainer.style.display = 'none';
        }
        
        // Set current shelf in move select
        moveShelfSelect.value = book.shelf;
        
        // Update star rating display
        updateStarRating(book.rating);
        
        detailsModal.style.display = 'block';
    }
    
    // Handle star rating
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = parseInt(this.dataset.value);
            currentRating = value;
            updateStarRating(value);
        });
    });
    
    // Update star rating display
    function updateStarRating(rating) {
        stars.forEach(star => {
            const value = parseInt(star.dataset.value);
            star.classList.toggle('active', value <= rating);
        });
        
        // Update emoji based on rating
        const emoji = document.getElementById('ratingEmoji');
        if (rating === 0) {
            emoji.textContent = '';
        } else if (rating === 1) {
            emoji.textContent = '😞';
        } else if (rating === 2) {
            emoji.textContent = '😕';
        } else if (rating === 3) {
            emoji.textContent = '😐';
        } else if (rating === 4) {
            emoji.textContent = '🙂';
        } else if (rating === 5) {
            emoji.textContent = '😊';
        }
    }
    
    // Save book details
    document.getElementById('saveDetailsBtn').addEventListener('click', function() {
        const bookIndex = books.findIndex(b => b.id === currentBookId);
        if (bookIndex === -1) return;
        
        const book = books[bookIndex];
        const newShelf = moveShelfSelect.value;
        
        // Update current page if on Reading shelf
        if (book.shelf === 'Reading') {
            book.currentPage = parseInt(currentPageInput.value) || 0;
        }
        
        // Update dates if moving to Reading or Read
        if (newShelf === 'Reading' && book.shelf !== 'Reading') {
            book.startDate = new Date().toISOString();
        } else if (newShelf === 'Read' && book.shelf !== 'Read') {
            book.endDate = new Date().toISOString();
        }
        
        // Update shelf if changed
        if (book.shelf !== newShelf) {
            book.shelf = newShelf;
        }
        
        book.rating = currentRating;
        book.opinion = document.getElementById('bookOpinion').value.trim();
        
        saveData();
        
        // Show save message
        saveMessage.textContent = 'Changes saved!';
        setTimeout(() => {
            saveMessage.textContent = '';
            detailsModal.style.display = 'none';
            renderBooksForShelf(currentShelf);
        }, 1000);
    });
    
    // Delete book
    document.getElementById('deleteBookBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this book?')) {
            books = books.filter(b => b.id !== currentBookId);
            saveData();
            detailsModal.style.display = 'none';
            renderBooksForShelf(currentShelf);
        }
    });
    
    // Search books
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        renderBooksForShelf(currentShelf, searchTerm);
    });
    
    // Save data to localStorage
    function saveData() {
        localStorage.setItem('lorelineShelves', JSON.stringify(shelves));
        localStorage.setItem('lorelineBooks', JSON.stringify(books));
    }
    
    // Initialize the app
    init();
});
