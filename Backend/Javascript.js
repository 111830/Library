/*-------------------------------------------
    Slider Functionality
-------------------------------------------*/
const initslider = () => { 
  const slideButtons = document.querySelectorAll('.slide-button');

  slideButtons.forEach(button => {
    button.addEventListener('click', () => {
      const slider = button.closest('.slider-wrapper');
      if (!slider) return;
      const booklist = slider.querySelector('.book-list');
      if (!booklist) return;

      const direction = button.id === "prev-slide" ? -1 : 1;
      const scrollAmount = booklist.clientWidth * direction;
      booklist.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  });

  const booklists = document.querySelectorAll('.book-list');
  booklists.forEach(booklist => {
    const slider = booklist.closest('.slider-wrapper');
    if (slider) {
      booklist.addEventListener('scroll', () => {
      });
    }
  });
};

window.addEventListener('load', initslider);

/*-------------------------------------------
    Filter me Select Dropdown
-------------------------------------------*/
const selectGenre = document.getElementById('auto');
const firstContainer = document.querySelector('.container');
const firstRowBooks = firstContainer ? firstContainer.querySelectorAll('.book-list .all') : [];
let lastSelectedGenre = 'all';

if (selectGenre) {
  selectGenre.addEventListener('change', function() {
    const selectedGenre = this.value;
    if (selectedGenre === lastSelectedGenre) {
      filterBooks('all');
      lastSelectedGenre = 'all';
      selectGenre.value = 'all';
    } else {
      filterBooks(selectedGenre);
      lastSelectedGenre = 'all';
    }
  });
}

function filterBooks(genre) {
  firstRowBooks.forEach(function(book) {
    if (genre === 'all' || book.getAttribute('data-genre') === genre) {
      book.style.display = 'flex';
    } else {
      book.style.display = 'none';
    }
  });
}

/*-------------------------------------------
    Genre Filtering me Dropdown Links
-------------------------------------------*/
let booksDataForGenre = [];
let basket = JSON.parse(localStorage.getItem('basket')) || [];

fetch('Backend/Librat.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Gabim në ngarkimin e JSON: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    booksDataForGenre = data;

    const genreLinksDropdown = document.querySelectorAll('.dropdown-content .genre-link');
    if (genreLinksDropdown.length === 0) {
      console.error('Asnjë genre-link nuk u gjet në dropdown!');
    }

    genreLinksDropdown.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const selectedGenre = this.textContent.trim().toLowerCase();
        console.log('Selected genre (dropdown):', selectedGenre);

        localStorage.setItem('lastGenre', selectedGenre);
        window.location.href = `index.html?genre=${encodeURIComponent(selectedGenre)}`;
      });
    });

    const dropdownTitles = document.querySelectorAll('.dropdown > a');
    dropdownTitles.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const category = this.textContent.trim().toLowerCase();
        window.location.href = `index.html?genre=${encodeURIComponent(category)}`;
      });
    });

    const params = new URLSearchParams(window.location.search);
    const lastGenre = params.get('genre');
    const lastAuthor = params.get('author');

    if (lastGenre) {
      const lookScrene = document.querySelector('.look-screne');
      const zhvillim = document.querySelector('.zhvillim');
      const containers = document.querySelectorAll('.container');
      const rekomandimet = document.querySelector('.rekomandimet');

      if (lookScrene) lookScrene.style.display = "none";
      if (zhvillim) zhvillim.style.display = "none";
      containers.forEach(container => {
        container.style.display = "none";
      });
      if (rekomandimet) {
        rekomandimet.style.display = "none";
      }
      filterBooksByGenre(lastGenre);
    } else if (lastAuthor) {
      filterBooksByAuthor(decodeURIComponent(lastAuthor));
    }

    window.addEventListener('popstate', function (event) {
      const lookScrene = document.querySelector('.look-screne');
      const zhvillim = document.querySelector('.zhvillim');
      const containers = document.querySelectorAll('.container');
      const rekomandimet = document.querySelector('.rekomandimet');

      if (event.state && event.state.genre) {
        if (lookScrene) lookScrene.style.display = "none";
        if (zhvillim) zhvillim.style.display = "none";
        containers.forEach(container => {
          container.style.display = "none";
        });
        if (rekomandimet) {
          rekomandimet.style.display = "none";
        }
        filterBooksByGenre(event.state.genre);
      } else if (event.state && event.state.author) {
        filterBooksByAuthor(event.state.author);
      } else {
        if (lookScrene) lookScrene.style.display = "flex";
        if (zhvillim) zhvillim.style.display = "block";
        containers.forEach(container => {
          container.style.display = "block";
        });
        if (rekomandimet) {
          rekomandimet.style.display = "block";
        }
        const container = document.getElementById('koherenc');
        if (container) container.style.display = "none";
      }
      renderBasket();
    });

    const addButtons = document.querySelectorAll('.add');
    addButtons.forEach(button => {
      button.addEventListener('click', () => {
        const productId = parseInt(button.getAttribute('data-id'), 10);
        const productFound = booksDataForGenre.find(p => p.id === productId);
        if (!productFound) return;

        const foundIndex = basket.findIndex(item => item.id === productFound.id);
        if (foundIndex > -1) {
          basket[foundIndex].quantity += 1;
        } else {
          basket.push({
            id: productFound.id,
            name: productFound.title,
            price: productFound.price,
            image: productFound.image,
            quantity: 1
          });
        }
        localStorage.setItem('basket', JSON.stringify(basket));
        const carTop = document.getElementById('carTop');
        if (carTop) carTop.classList.add('active');
        renderBasket();
      });
    });

    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (searchInput && searchResults) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();

        if (query === '') {
          searchResults.style.display = 'none';
          return;
        }

        const matchingBooks = booksDataForGenre.filter(book => 
          book.title.toLowerCase().includes(query) || 
          book.author.toLowerCase().trim() === query
        );

        const matchingAuthors = [...new Set(booksDataForGenre.map(book => book.author).filter(author => 
          author.toLowerCase().trim().includes(query)
        ))];

        searchResults.innerHTML = '';
        searchResults.style.display = 'block';

        matchingBooks.forEach(book => {
          const bookItem = document.createElement('div');
          bookItem.className = 'search-result-item';
          bookItem.innerHTML = `
            <img src="${book.image}" alt="${book.title}">
            <span>${book.title}</span>
          `;
          bookItem.addEventListener('click', () => {
            window.location.href = `index1.html?id=${book.id}`;
          });
          searchResults.appendChild(bookItem);
        });

        matchingAuthors.forEach(author => {
          const authorItem = document.createElement('div');
          authorItem.className = 'search-result-item author';
          authorItem.innerHTML = `<span>${author}</span>`;
          authorItem.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Klikuar autori:', author);
            window.location.href = `index.html?author=${encodeURIComponent(author)}`;
          });
          searchResults.appendChild(authorItem);
        });

        if (matchingBooks.length === 0 && matchingAuthors.length === 0) {
          searchResults.innerHTML = '<div class="search-result-item">Asnjë rezultat</div>';
        }
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = searchInput.value.trim().toLowerCase();
          if (query === '') return;

          const matchingBooks = booksDataForGenre.filter(book => 
            book.title.toLowerCase().includes(query) || 
            book.author.toLowerCase().trim() === query
          );

          const matchingAuthors = [...new Set(booksDataForGenre.map(book => book.author).filter(author => 
            author.toLowerCase().trim().includes(query)
          ))];

          if (matchingBooks.length > 0) {
            window.location.href = `index1.html?id=${matchingBooks[0].id}`;
          } else if (matchingAuthors.length > 0) {
            window.location.href = `index.html?author=${encodeURIComponent(matchingAuthors[0])}`;
          } else {
            console.log('Asnjë rezultat për:', query);
          }

          searchResults.style.display = 'none';
          searchInput.value = '';
        }
      });

      document.addEventListener('click', (e) => {
        if (!searchBar.contains(e.target)) {
          searchResults.style.display = 'none';
        }
      });
    }
    const checkOutBtn = document.querySelector('.checkOut');
    const checkout = document.getElementById('checkout');
    const closeCheckoutBtn = document.getElementById('closeCheckout');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutForm = document.getElementById('checkoutForm');
    const stateSelect = document.getElementById('state');
    const totalAmountSpan = document.getElementById('totalAmount');
    const submitOrderBtn = document.querySelector('.submitOrder');

    if (checkOutBtn && checkout) {
      checkOutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (basket.length === 0) {
          alert('Shporta juaj është bosh!');
          return;
        }
        if (carTop) {
          carTop.classList.remove('show');
          carTop.classList.add('hide');
        }
        checkout.classList.remove('hide');
        checkout.classList.add('show');
        if (checkoutItems) {
          checkoutItems.innerHTML = '';
          basket.forEach(product => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item');
            itemDiv.innerHTML = `
              <div class="image">
                <img src="${product.image}" alt="${product.name}">
              </div>
              <div class="name">${product.name}</div>
              <div class="totalPrice">${product.price * product.quantity} LEK</div>
            `;
            checkoutItems.appendChild(itemDiv);
          });
        }
        let total = basket.reduce((sum, product) => sum + product.price * product.quantity, 0);
        if (totalAmountSpan) totalAmountSpan.textContent = `${total} LEK`;
      });
    }

    if (closeCheckoutBtn && checkout) {
      closeCheckoutBtn.addEventListener('click', () => {
        checkout.classList.remove('show');
        checkout.classList.add('hide');
      });
    }

    if (stateSelect) {
      stateSelect.addEventListener('change', () => {
        let total = basket.reduce((sum, product) => sum + product.price * product.quantity, 0);
        const shippingCost = stateSelect.value === 'Shqipëri' ? 200 : stateSelect.value === 'Kosovë' ? 500 : 0;
        if (totalAmountSpan) totalAmountSpan.textContent = `${total + shippingCost} LEK`;
      });
    }
    if (submitOrderBtn) {
      submitOrderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const firstName = document.getElementById('firstName') ? document.getElementById('firstName').value : '';
        const lastName = document.getElementById('lastName') ? document.getElementById('lastName').value : '';
        const phone = document.getElementById('phone') ? document.getElementById('phone').value : '';
        const city = document.getElementById('city') ? document.getElementById('city').value : '';
        const state = document.getElementById('state') ? document.getElementById('state').value : '';
        const address = document.getElementById('address') ? document.getElementById('address').value : '';
        const items = basket.map(item => `${item.name} - ${item.quantity} x ${item.price} LEK`).join('\n');
        const total = totalAmountSpan ? totalAmountSpan.textContent : '0 LEK';
        const message = `Porosi e re:%0AEmri: ${firstName}%0AMbiemri: ${lastName}%0ANumri i Telefonit: ${phone}%0AQyteti: ${city}%0AShteti: ${state}%0AAdresa: ${address}%0AArtikujt:%0A${items}%0ATotali: ${total}`;
        const whatsappNumber = "+355683544145"; 
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        alert('Porosia juaj u regjistrua dhe u dërgua me sukses në WhatsApp!');
        if (checkout) {
          checkout.classList.remove('show');
          checkout.classList.add('hide');
        }
        basket = [];
        localStorage.setItem('basket', JSON.stringify(basket));
        renderBasket();
        if (checkoutForm) checkoutForm.reset();
      });
    }

    if (checkout) {
      document.addEventListener('click', (e) => {
        if (checkout.classList.contains('show') && !checkout.contains(e.target) && e.target !== checkOutBtn) {
          checkout.classList.remove('show');
          checkout.classList.add('hide');
        }
      });
    }
    renderBasket();
  })
  .catch(err => {
    console.error('Gabim gjatë leximit të Librat.json për genre dropdown:', err);
  });

function filterBooksByGenre(selectedGenre) {
  let filteredBooks = booksDataForGenre.filter(book => {
    let genresArray = Array.isArray(book.genre) ? book.genre : [book.genre];
    return genresArray.some(g => g && g.trim().toLowerCase() === selectedGenre);
  });

  console.log('Filtered Books (dropdown):', filteredBooks);

  const resultCountSpan = document.getElementById('resultCount');
  if (resultCountSpan) {
    resultCountSpan.textContent = `${filteredBooks.length} Rezultate`;
  }

  const container = document.getElementById('koherenc');
  if (!container) {
    console.error('Container me id "koherenc" nuk u gjet!');
    return;
  }

  const bookListEl = container.querySelector('.book-list');
  if (!bookListEl) {
    console.error('Elementi .book-list nuk u gjet brenda container-it!');
    return;
  }

  bookListEl.innerHTML = '';

  filteredBooks.forEach(book => {
    const li = document.createElement('li');
    li.id = `book-${book.id}`;
    li.innerHTML = `
      <a href="index1.html?id=${book.id}" class="book-link" data-genre="${selectedGenre}">
        <img src="${book.image}" alt="${book.title}">
        <div class="shkrimet">
          <p class="titulli"><strong>${book.title}</strong></p>
          <p class="autori">${book.author}</p>
          <p class="price">${book.price} LEKE</p>
        </div>
      </a>
      <button class="add" data-id="${book.id}">
        <i class="fa-light fa-cart-shopping"></i> Add to Basket
      </button>
    `;
    bookListEl.appendChild(li);
  });

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });

  const newAddButtons = bookListEl.querySelectorAll('.add');
  newAddButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = parseInt(btn.getAttribute('data-id'), 10);
      const productFound = booksDataForGenre.find(p => p.id === productId);
      if (!productFound) return;

      const foundIndex = basket.findIndex(item => item.id === productFound.id);
      if (foundIndex > -1) {
        basket[foundIndex].quantity += 1;
      } else {
        basket.push({
          id: productFound.id,
          name: productFound.title,
          price: productFound.price,
          image: productFound.image,
          quantity: 1
        });
      }
      localStorage.setItem('basket', JSON.stringify(basket));
      const carTop = document.getElementById('carTop');
      if (carTop) carTop.classList.add('active');
      renderBasket();
    });
  });

  const authorsContainer = document.getElementById('authors-checkboxes');
  const publishersContainer = document.getElementById('publishers-checkboxes');
  if (authorsContainer) authorsContainer.innerHTML = '';
  if (publishersContainer) publishersContainer.innerHTML = '';

  const authors = [...new Set(filteredBooks.map(book => book.author))];
  const publishers = [...new Set(filteredBooks.map(book => book.Botimi))];

  function displayAuthors(authorsList, showAll = false) {
    if (!authorsContainer) return;
    authorsContainer.innerHTML = '';
    const displayList = showAll ? authorsList : authorsList.slice(0, 4);
    displayList.forEach(author => {
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="checkbox" name="author" value="${author}"> ${author}
      `;
      authorsContainer.appendChild(label);
    });

    if (authorsList.length > 4 && !showAll) {
      const showMoreAuthorsBtn = document.createElement('button');
      showMoreAuthorsBtn.textContent = 'Shiko më shumë';
      showMoreAuthorsBtn.className = 'show-more';
      authorsContainer.appendChild(showMoreAuthorsBtn);

      showMoreAuthorsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        displayAuthors(authorsList, true);
        const showLessAuthorsBtn = document.createElement('button');
        showLessAuthorsBtn.textContent = 'Shiko më pak';
        showLessAuthorsBtn.className = 'show-less';
        authorsContainer.appendChild(showLessAuthorsBtn);

        showLessAuthorsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          displayAuthors(authorsList, false);
          addCheckboxListeners();
          updateFilteredBooks();
        });

        addCheckboxListeners();
        updateFilteredBooks();
      });
    }
  }

  function displayPublishers(publishersList, showAll = false) {
    if (!publishersContainer) return;
    publishersContainer.innerHTML = '';
    const displayList = showAll ? publishersList : publishersList.slice(0, 4);
    displayList.forEach(publisher => {
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="checkbox" name="publisher" value="${publisher}"> ${publisher}
      `;
      publishersContainer.appendChild(label);
    });

    if (publishersList.length > 4 && !showAll) {
      const showMorePublishersBtn = document.createElement('button');
      showMorePublishersBtn.textContent = 'Shiko më shumë';
      showMorePublishersBtn.className = 'show-more';
      publishersContainer.appendChild(showMorePublishersBtn);

      showMorePublishersBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        displayPublishers(publishersList, true);
        const showLessPublishersBtn = document.createElement('button');
        showLessPublishersBtn.textContent = 'Shiko më pak';
        showLessPublishersBtn.className = 'show-less';
        publishersContainer.appendChild(showLessPublishersBtn);

        showLessPublishersBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          displayPublishers(publishersList, false);
          addCheckboxListeners();
          updateFilteredBooks();
        });

        addCheckboxListeners();
        updateFilteredBooks();
      });
    }
  }

  displayAuthors(authors);
  displayPublishers(publishers);

  function updateFilteredBooks() {
    if (!authorsContainer || !publishersContainer) return;
    const selectedAuthors = Array.from(authorsContainer.querySelectorAll('input[name="author"]:checked'))
      .map(input => input.value);
    const selectedPublishers = Array.from(publishersContainer.querySelectorAll('input[name="publisher"]:checked'))
      .map(input => input.value);

    let updatedBooks = filteredBooks;

    if (selectedAuthors.length > 0) {
      updatedBooks = updatedBooks.filter(book => selectedAuthors.includes(book.author));
    }

    if (selectedPublishers.length > 0) {
      updatedBooks = updatedBooks.filter(book => selectedPublishers.includes(book.Botimi));
    }

    bookListEl.innerHTML = '';
    updatedBooks.forEach(book => {
      const li = document.createElement('li');
      li.id = `book-${book.id}`;
      li.innerHTML = `
        <a href="index1.html?id=${book.id}" class="book-link" data-genre="${selectedGenre}">
          <img src="${book.image}" alt="${book.title}">
          <div class="shkrimet">
            <p class="titulli"><strong>${book.title}</strong></p>
            <p class="autori">${book.author}</p>
            <p class="price">${book.price} LEKE</p>
          </div>
        </a>
        <button class="add" data-id="${book.id}">
          <i class="fa-light fa-cart-shopping"></i> Add to Basket
        </button>
      `;
      bookListEl.appendChild(li);
    });

    if (resultCountSpan) {
      resultCountSpan.textContent = `${updatedBooks.length} Rezultate`;
    }

    const newAddButtons = bookListEl.querySelectorAll('.add');
    newAddButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = parseInt(btn.getAttribute('data-id'), 10);
        const productFound = booksDataForGenre.find(p => p.id === productId);
        if (!productFound) return;

        const foundIndex = basket.findIndex(item => item.id === productFound.id);
        if (foundIndex > -1) {
          basket[foundIndex].quantity += 1;
        } else {
          basket.push({
            id: productFound.id,
            name: productFound.title,
            price: productFound.price,
            image: productFound.image,
            quantity: 1
          });
        }
        localStorage.setItem('basket', JSON.stringify(basket));
        const carTop = document.getElementById('carTop');
        if (carTop) carTop.classList.add('active');
        renderBasket();
      });
    });
  }

  function addCheckboxListeners() {
    if (!authorsContainer || !publishersContainer) return;
    const authorCheckboxes = authorsContainer.querySelectorAll('input[name="author"]');
    authorCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateFilteredBooks);
    });

    const publisherCheckboxes = publishersContainer.querySelectorAll('input[name="publisher"]');
    publisherCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateFilteredBooks);
    });
  }

  addCheckboxListeners();
}

function filterBooksByAuthor(author) {
  console.log('Filtrimi për autorin:', author);
  const filteredBooks = booksDataForGenre.filter(book => {
    const bookAuthor = book.author.toLowerCase().trim();
    const searchAuthor = author.toLowerCase().trim();
    const matches = bookAuthor === searchAuthor;
    console.log(`Krahasimi: book.author='${bookAuthor}', author='${searchAuthor}', përputhet: ${matches}`);
    return matches;
  });
  console.log('Librat e filtruar për autorin (pas filtrimit):', filteredBooks, 'Gjatësia:', filteredBooks.length);

  const container = document.getElementById('koherenc');
  if (!container) {
    console.error('Container me id "koherenc" nuk u gjet!');
    return;
  }

  const bookListEl = container.querySelector('.book-list');
  if (!bookListEl) {
    console.error('Elementi .book-list nuk u gjet brenda container-it!');
    return;
  }

  const lookScrene = document.querySelector('.look-screne');
  const zhvillim = document.querySelector('.zhvillim');
  const containers = document.querySelectorAll('.container');
  const rekomandimet = document.querySelector('.rekomandimet');

  if (lookScrene) lookScrene.style.display = "none";
  if (zhvillim) zhvillim.style.display = "none";
  containers.forEach(container => {
    container.style.display = "none";
  });
  if (rekomandimet) {
    rekomandimet.style.display = "none";
  }

  bookListEl.innerHTML = '';
  filteredBooks.forEach(book => {
    const li = document.createElement('li');
    li.id = `book-${book.id}`;
    li.innerHTML = `
      <a href="index1.html?id=${book.id}" class="book-link" data-genre="${book.genre}">
        <img src="${book.image}" alt="${book.title}">
        <div class="shkrimet">
          <p class="titulli"><strong>${book.title}</strong></p>
          <p class="autori">${book.author}</p>
          <p class="price">${book.price} LEKE</p>
        </div>
      </a>
      <button class="add" data-id="${book.id}">
        <i class="fa-light fa-cart-shopping"></i> Add to Basket
      </button>
    `;
    bookListEl.appendChild(li);
    console.log('Shtuar libër në DOM:', book.title);
  });

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
  const resultCountSpan = document.getElementById('resultCount');
  if (resultCountSpan) {
    resultCountSpan.textContent = `${filteredBooks.length} Rezultate`;
  } else {
    console.warn('Span me id "resultCount" nuk u gjet!');
  }

  const newAddButtons = bookListEl.querySelectorAll('.add');
  newAddButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = parseInt(btn.getAttribute('data-id'), 10);
      const productFound = booksDataForGenre.find(p => p.id === productId);
      if (!productFound) return;

      const foundIndex = basket.findIndex(item => item.id === productFound.id);
      if (foundIndex > -1) {
        basket[foundIndex].quantity += 1;
      } else {
        basket.push({
          id: productFound.id,
          name: productFound.title,
          price: productFound.price,
          image: productFound.image,
          quantity: 1
        });
      }
      localStorage.setItem('basket', JSON.stringify(basket));
      const carTop = document.getElementById('carTop');
      if (carTop) carTop.classList.add('active');
      renderBasket();
    });
  });
}

/*-------------------------------------------
    Basket Initialization & Core Functionality
-------------------------------------------*/
function updateCartIcon() {
  const cartCountSpan = document.getElementById('cartCount');
  let totalQuantity = 0;
  basket.forEach(product => {
    totalQuantity += product.quantity;
  });
  if (cartCountSpan) {
    cartCountSpan.textContent = totalQuantity;
  }
}

window.addEventListener('load', () => {
  updateCartIcon();
  renderBasket();
});

/*-------------------------------------------
    Cart Display & Interaction
-------------------------------------------*/
const cart = document.querySelector('.carTop');
const cartButton = document.querySelector('.icon-cart button');
const carTop = document.getElementById('carTop');
const listCart = document.getElementById('listCart');
const closeCartBtn = document.getElementById('closeCart');
const clearButton = document.querySelector('.close');

if (cartButton && cart) {
  cartButton.addEventListener('click', () => {
    cart.classList.toggle('show');
    cart.classList.toggle('hide');
    renderBasket();
  });
}

if (clearButton && cart) {
  clearButton.addEventListener('click', () => {
    cart.classList.remove('show');
    cart.classList.add('hide');
  });
}

if (closeCartBtn) {
  closeCartBtn.addEventListener('click', () => {
    if (carTop) {
      carTop.classList.remove('active');
      carTop.classList.remove('show');
      carTop.classList.add('hide');
    }
  });
}

function renderBasket() {
  if (!listCart) return;
  listCart.innerHTML = '';
  if (basket.length === 0) {
    listCart.innerHTML = '<p style="text-align:center;">Shporta është bosh.</p>';
    updateCartIcon();
    return;
  }
  basket.forEach(product => {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('item');
    itemDiv.innerHTML = `
      <div class="image">
        <img src="${product.image}" alt="${product.name}" width="50">
      </div>
      <div class="name">${product.name}</div>
      <div class="totalPrice">${product.price * product.quantity} LEK</div>
      <div class="quantity">
        <span class="minus" style="cursor:pointer"><</span>
        <span class="qtyValue">${product.quantity}</span>
        <span class="plus" style="cursor:pointer">></span>
      </div>
    `;
    const minusBtn = itemDiv.querySelector('.minus');
    const plusBtn = itemDiv.querySelector('.plus');
    const qtyValue = itemDiv.querySelector('.qtyValue');
    const totalPriceDiv = itemDiv.querySelector('.totalPrice');

    minusBtn.addEventListener('click', () => {
      if (product.quantity > 1) {
        product.quantity -= 1;
        qtyValue.textContent = product.quantity;
        totalPriceDiv.textContent = (product.price * product.quantity) + ' LEK';
      } else {
        basket = basket.filter(p => p.id !== product.id);
      }
      localStorage.setItem('basket', JSON.stringify(basket));
      renderBasket();
    });
    plusBtn.addEventListener('click', () => {
      product.quantity += 1;
      qtyValue.textContent = product.quantity;
      totalPriceDiv.textContent = (product.price * product.quantity) + ' LEK';
      localStorage.setItem('basket', JSON.stringify(basket));
      updateCartIcon();
    });
    listCart.appendChild(itemDiv);
  });
  updateCartIcon();
}

/*-------------------------------------------
    Hamburger Menu & Other Click Elements
-------------------------------------------*/
const hamMenu = document.querySelector('.ham-menu');
const ofscrean = document.querySelector('.of-screne-menu');
const genreLinks = document.querySelectorAll('.genre-link');
const lookScrene = document.querySelector('.look-screne');
const zhvillim = document.querySelector('.zhvillim');
const containers = document.querySelectorAll('.container');
const rekomandimet = document.querySelector('.rekomandimet');

if (hamMenu && ofscrean) {
  hamMenu.addEventListener('click', () => {
    hamMenu.classList.toggle('active');
    ofscrean.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!ofscrean.contains(e.target) && !hamMenu.contains(e.target)) {
      hamMenu.classList.remove('active');
      ofscrean.classList.remove('active');
    }
  });
}

genreLinks.forEach(link => {
  link.addEventListener('click', () => {
    hamMenu.classList.remove('active');
    ofscrean.classList.remove('active');

    if (lookScrene) lookScrene.style.display = "none";
    if (zhvillim) zhvillim.style.display = "none";
    containers.forEach(container => {
      container.style.display = "none";
    });
    if (rekomandimet) {
      rekomandimet.style.display = "none";
    }
  });
});

/*-------------------------------------------
    Dropdown Navigation Functionality
-------------------------------------------*/
const dropdowns = document.querySelectorAll('.dropdown');
dropdowns.forEach(dropdown => {
  dropdown.addEventListener('click', function (event) {
    event.stopPropagation();
    this.classList.toggle('active');
    const dropdownContent = this.querySelector('.dropdown-content');
    const icon = this.querySelector('i');
    if (dropdownContent.style.display === 'block') {
      dropdownContent.style.display = 'none';
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
    } else {
      dropdownContent.style.display = 'block';
      dropdownContent.scrollTop = 0;
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-up');
    }
  });
});

document.addEventListener('click', function() {
  dropdowns.forEach(dropdown => {
    dropdown.classList.remove('active');
    const dropdownContent = dropdown.querySelector('.dropdown-content');
    const icon = dropdown.querySelector('i');
    dropdownContent.style.display = 'none';
    icon.classList.remove('fa-chevron-up');
    icon.classList.add('fa-chevron-down');
  });
});

/*-------------------------------------------
    Search Function
-------------------------------------------*/
function searchFunction() {
  const inputValue = document.getElementById('search-input').value.trim();
  if (inputValue) {
    alert(`You searched for: ${inputValue}`);
  } else {
    alert('Please enter something to search!');
  }
}

/*-------------------------------------------
    Filter Panel Functionality
-------------------------------------------*/
const filterButton = document.querySelector('.filter');
const filterPanel = document.getElementById('filterInfo');
const closeFilterButton = document.querySelector('.close-filter');
const sortSelect = document.getElementById('sort');

function closeFilterPanel() {
  if (filterPanel) {
    filterPanel.classList.remove('active');
    setTimeout(() => {
      filterPanel.style.display = 'none';
    }, 300);
  }
}

if (filterButton && filterPanel) {
  filterButton.addEventListener('click', (e) => {
    e.stopPropagation();
    filterPanel.classList.add('active');
    filterPanel.style.display = 'block';
  });
}

if (closeFilterButton) {
  closeFilterButton.addEventListener('click', (e) => {
    e.stopPropagation();
    closeFilterPanel();
  });
}

document.addEventListener('click', (e) => {
  if (filterPanel && filterPanel.classList.contains('active')) {
    if (!filterPanel.contains(e.target) && e.target !== filterButton) {
      closeFilterPanel();
    }
  }
});

if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    const sortValue = sortSelect.value;
    const bookListEl = document.querySelector('#koherenc .book-list');
    if (!bookListEl) return;

    let sortedBooks = Array.from(bookListEl.children)
      .map(li => {
        const id = parseInt(li.id.replace('book-', ''), 10);
        return booksDataForGenre.find(book => book.id === id);
      })
      .filter(Boolean);

    switch (sortValue) {
      case 'priceAsc':
        sortedBooks.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        sortedBooks.sort((a, b) => b.price - a.price);
        break;
      case 'titleAsc':
        sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'year':
        sortedBooks.sort((a, b) => (b.Page || 0) - (a.Page || 0));
        break;
    }

    bookListEl.innerHTML = '';
    sortedBooks.forEach(book => {
      const li = document.createElement('li');
      li.id = `book-${book.id}`;
      li.innerHTML = `
        <a href="index1.html?id=${book.id}" class="book-link" data-genre="${book.genre}">
          <img src="${book.image}" alt="${book.title}">
          <div class="shkrimet">
            <p class="titulli"><strong>${book.title}</strong></p>
            <p class="autori">${book.author}</p>
            <p class="price">${book.price} LEKE</p>
          </div>
        </a>
        <button class="add" data-id="${book.id}">
          <i class="fa-light fa-cart-shopping"></i> Add to Basket
        </button>
      `;
      bookListEl.appendChild(li);
    });

    const newAddButtons = bookListEl.querySelectorAll('.add');
    newAddButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = parseInt(btn.getAttribute('data-id'), 10);
        const productFound = booksDataForGenre.find(p => p.id === productId);
        if (!productFound) return;

        const foundIndex = basket.findIndex(item => item.id === productFound.id);
        if (foundIndex > -1) {
          basket[foundIndex].quantity += 1;
        } else {
          basket.push({
            id: productFound.id,
            name: productFound.title,
            price: productFound.price,
            image: productFound.image,
            quantity: 1
          });
        }
        localStorage.setItem('basket', JSON.stringify(basket));
        const carTop = document.getElementById('carTop');
        if (carTop) carTop.classList.add('active');
        renderBasket();
      });
    });
  });
}