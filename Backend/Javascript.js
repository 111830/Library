function resetUIState() {
    const hamMenu = document.querySelector('.ham-menu');
    const ofScreneMenu = document.querySelector('.of-screne-menu');
    if (hamMenu && ofScreneMenu) {
        ofScreneMenu.style.transition = 'none';
        hamMenu.classList.remove('active');
        ofScreneMenu.classList.remove('active');
        setTimeout(function() {
            if (ofScreneMenu) {
                ofScreneMenu.style.transition = '';
            }
        }, 50);
    }
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
        const dropdownContent = dropdown.querySelector('.dropdown-content');
        const icon = dropdown.querySelector('i');
        if (dropdownContent) {
            dropdownContent.style.display = 'none';
        }
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
  const btnFemije = document.querySelector('.lib-femije-buton-femijesh');
  if (btnFemije) {
    btnFemije.addEventListener('click', function (e) {
      e.preventDefault();
      sessionStorage.setItem('forceReload', 'true');
      const genre = 'Libra për Fëmijë dhe Adoleshentë';
      localStorage.setItem('lastGenre', genre.toLowerCase());
      window.location.href = `index.html?genre=${encodeURIComponent(genre.toLowerCase())}`;
    });
  }
});

const initslider = () => {
  const sliders = document.querySelectorAll('.slider-wrapper');
  sliders.forEach(slider => {
    const bookList = slider.querySelector('.book-list');
    const prevSlideBtn = slider.querySelector('#prev-slide');
    const nextSlideBtn = slider.querySelector('#next-slide');
    const handleSlideButtons = () => {
      if (!bookList || !prevSlideBtn || !nextSlideBtn) return;
      prevSlideBtn.style.display = bookList.scrollLeft > 1 ? "block" : "none";
      let isAtEnd = bookList.scrollLeft + bookList.clientWidth >= bookList.scrollWidth - 1;
      nextSlideBtn.style.display = isAtEnd ? "none" : "block";
    };
    if (prevSlideBtn) {
      prevSlideBtn.addEventListener('click', () => {
        bookList.scrollBy({ left: -bookList.clientWidth, behavior: 'smooth' });
      });
    }
    if (nextSlideBtn) {
      nextSlideBtn.addEventListener('click', () => {
        bookList.scrollBy({ left: bookList.clientWidth, behavior: 'smooth' });
      });
    }
    if (bookList) {
      bookList.addEventListener('scroll', handleSlideButtons);
    }
    window.addEventListener('load', handleSlideButtons);
    window.addEventListener('resize', handleSlideButtons);
  });
};

initslider();

let booksDataForGenre = [];
let basket = JSON.parse(localStorage.getItem('basket')) || [];

const trackUserInterest = (author, genres) => {
  try {
    let interests = JSON.parse(localStorage.getItem('userInterests')) || [];
    if (author) {
      interests.unshift({ type: 'author', value: author.trim() });
    }
    if (Array.isArray(genres)) {
      genres.forEach(genre => {
        if (genre) {
          interests.unshift({ type: 'genre', value: genre.trim().toLowerCase() });
        }
      });
    } else if (typeof genres === 'string' && genres) {
      interests.unshift({ type: 'genre', value: genres.trim().toLowerCase() });
    }
    if (interests.length > 15) {
      interests = interests.slice(0, 15);
    }
    localStorage.setItem('userInterests', JSON.stringify(interests));
  } catch (e) {
    console.error("Gabim gjatë ruajtjes së interesave të përdoruesit:", e);
  }
};

fetch('/api/books')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Gabim në marrjen e të dhënave nga serveri: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    booksDataForGenre = data;

    document.body.addEventListener('click', function (event) {
      const button = event.target.closest('.add');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      const productId = parseInt(button.getAttribute('data-id'), 10);
      const productFound = booksDataForGenre.find(p => Number(p.id) === productId);
      if (!productFound) {
        console.error(`Libri me ID ${productId} nuk u gjet në të dhënat e ngarkuara.`);
        return;
      }
      trackUserInterest(productFound.author, productFound.genre);
      let basketItemId, nameToUse, priceToUse;
      const selectedLangName = button.dataset.selectedLangName || 'Shqip';
      const selectedPrice = button.dataset.selectedPrice;
      if (selectedLangName !== 'Shqip' && selectedPrice) {
        basketItemId = `${productFound.id}-${selectedLangName}`;
        nameToUse = `${productFound.title} (${selectedLangName})`;
        priceToUse = parseFloat(selectedPrice);
      } else {
        basketItemId = `${productFound.id}-Shqip`;
        nameToUse = productFound.title;
        priceToUse = (productFound.offerPrice && productFound.offerPrice > 0) ? productFound.offerPrice : productFound.price;
      }
      const foundIndex = basket.findIndex(item => item.id === basketItemId);
      if (foundIndex > -1) {
        basket[foundIndex].quantity += 1;
      } else {
        basket.push({
          id: basketItemId,
          productId: productFound.id,
          name: nameToUse,
          price: priceToUse,
          image: productFound.image,
          quantity: 1
        });
      }
      localStorage.setItem('basket', JSON.stringify(basket));
      renderBasket();
      updateCartIcon();
      button.textContent = 'U shtua!';
      button.disabled = true;
      setTimeout(() => {
        button.innerHTML = '<i class="fa-light fa-cart-shopping"></i>Add to Basket';
        button.disabled = false;
      }, 1500);
    });

    displayTopSellers();
    setupTopSellerFilter();
    displayNewBooks();
    displayRecommendations();
    initInfoLinks();

    const hamMenu = document.querySelector('.ham-menu');
    const ofScreneMenu = document.querySelector('.of-screne-menu');

    const genreLinksDropdown = document.querySelectorAll('.dropdown-content .genre-link');
    genreLinksDropdown.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        sessionStorage.setItem('forceReload', 'true');
        if (hamMenu && ofScreneMenu) {
            hamMenu.classList.remove('active');
            ofScreneMenu.classList.remove('active');
        }
        const selectedGenre = this.textContent.trim().toLowerCase();
        localStorage.setItem('lastGenre', selectedGenre);
        window.location.href = `index.html?genre=${encodeURIComponent(selectedGenre)}`;
      });
    });

    const dropdownTitles = document.querySelectorAll('.dropdown > a');
    dropdownTitles.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        sessionStorage.setItem('forceReload', 'true');
        if (hamMenu && ofScreneMenu) {
            hamMenu.classList.remove('active');
            ofScreneMenu.classList.remove('active');
        }
        const category = this.textContent.trim().toLowerCase();
        window.location.href = `index.html?genre=${encodeURIComponent(category)}`;
      });
    });
    
    const params = new URLSearchParams(window.location.search);
    const lastGenre = params.get('genre');
    const lastAuthor = params.get('author');
    const offerFilter = params.get('filter');

    const hideMainPageSections = () => {
      const sectionsToHide = [
        document.querySelector('.hero-section-background'),
        document.querySelector('.zhvillim'),
        ...document.querySelectorAll('.container'),
        document.querySelector('.rekomandimet'),
        document.querySelector('.lib-femije-seksion-bg'),
        document.querySelector('.autor-dinamik-mbajtesi'),
        document.querySelector('.seksion-oferte')
      ];
      sectionsToHide.forEach(section => {
        if (section) section.style.display = "none";
      });
    };

    if (lastGenre) {
      hideMainPageSections();
      filterBooksByGenre(lastGenre);
    } else if (lastAuthor) {
      hideMainPageSections();
      filterBooksByAuthor(decodeURIComponent(lastAuthor));
    } else if (offerFilter === 'oferta') {
      hideMainPageSections();
      filterBooksByOffer();
    }

    window.addEventListener('popstate', function (event) {
      resetUIState();
      const mainPageSections = [
        document.querySelector('.hero-section-background'),
        document.querySelector('.zhvillim'),
        ...document.querySelectorAll('.container'),
        document.querySelector('.rekomandimet'),
        document.querySelector('.lib-femije-seksion-bg'),
        document.querySelector('.autor-dinamik-mbajtesi'),
        document.querySelector('.seksion-oferte')
      ];
      const filterContainer = document.getElementById('koherenc');
      if (window.location.search === '') {
        mainPageSections.forEach(section => {
          if (section) section.style.display = '';
        });
        if (filterContainer) filterContainer.style.display = 'none';
      } else {
        mainPageSections.forEach(section => {
          if (section) section.style.display = 'none';
        });
        if (filterContainer) filterContainer.style.display = 'block';
      }
      renderBasket();
    });

    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchBar = document.querySelector('.search-bar');

    if (searchInput && searchResults && searchBar) {
      searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim();
        if (query.length < 2) {
          searchResults.style.display = 'none';
          return;
        }
        try {
          const response = await fetch(`/api/book/search?title=${encodeURIComponent(query)}`);
          const results = await response.json();
          searchResults.innerHTML = '';
          searchResults.style.display = 'block';
          if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">Asnjë rezultat</div>';
          } else {
            results.forEach(result => {
              const resultItem = document.createElement('div');
              resultItem.className = 'search-result-item';
              resultItem.addEventListener('click', () => {
                sessionStorage.setItem('forceReload', 'true');
                if (result.type === 'book') {
                    window.location.href = `index1.html?id=${result.id}`;
                } else if (result.type === 'author') {
                    window.location.href = `index.html?author=${encodeURIComponent(result.name)}`;
                }
              });
              if (result.type === 'book') {
                resultItem.innerHTML = `<img src="${result.image}" alt="${result.name}"><span>${result.name}</span>`;
              } else if (result.type === 'author') {
                resultItem.innerHTML = `<i class="fa-light fa-user" style="margin-right: 10px; color: #555;"></i><span>${result.name} (Autor)</span>`;
              }
              searchResults.appendChild(resultItem);
            });
          }
        } catch (err) {
          console.error("Gabim gjatë kërkimit:", err);
          searchResults.innerHTML = '<div class="search-result-item">Gabim në server</div>';
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
              <div class="image"><img src="${product.image}" alt="${product.name}"></div>
              <div class="name">${product.name}</div>
              <div class="totalPrice">${product.price * product.quantity} LEK</div>`;
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
      submitOrderBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const firstName = document.getElementById('firstName')?.value;
        const lastName = document.getElementById('lastName')?.value;
        const phone = document.getElementById('phone')?.value;
        const city = document.getElementById('city')?.value;
        const state = document.getElementById('state')?.value;
        const address = document.getElementById('address')?.value;
        if (!firstName || !lastName || !phone || !city || !state || !address) {
          alert('Ju lutem plotësoni të gjitha fushat e formularit!');
          return;
        }
        const userInfo = { firstName, lastName, phone, city, state, address };
        const basketWithAuthors = basket.map(item => {
          const product = booksDataForGenre.find(p => p.id === item.productId);
          return { ...item, author: product ? product.author : 'I panjohur' };
        });
        try {
          const response = await fetch('/api/order/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ basket: basketWithAuthors, userInfo: userInfo })
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Gabim në server gjatë regjistrimit të porosisë.');
          }
          alert('Porosia u dërgua me sukses! Do të njoftoheni nga postieri pas disa ditësh.');
          if (checkout) {
            checkout.classList.remove('show');
            checkout.classList.add('hide');
          }
          basket = [];
          localStorage.setItem('basket', JSON.stringify(basket));
          renderBasket();
          if (checkoutForm) checkoutForm.reset();
        } catch (error) {
          console.error('Gabim gjatë finalizimit të porosisë:', error);
          alert(`Ndodhi një problem: ${error.message}. Ju lutem provoni përsëri ose na kontaktoni.`);
        }
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
    console.error('Gabim gjatë leximit të të dhënave:', err);
  });

function filterBooksByGenre(selectedGenre) {
  let filteredBooks = booksDataForGenre.filter(book => {
    let genresArray = Array.isArray(book.genre) ? book.genre : [book.genre];
    return genresArray.some(g => g && g.trim().toLowerCase() === selectedGenre);
  });
  const resultCountSpan = document.getElementById('resultCount');
  if (resultCountSpan) {
    resultCountSpan.textContent = `${filteredBooks.length} Rezultate`;
  }
  const container = document.getElementById('koherenc');
  if (!container) return;
  const bookListEl = container.querySelector('.book-list');
  if (!bookListEl) return;
  bookListEl.innerHTML = '';
  filteredBooks.forEach(book => {
    const li = document.createElement('li');
    li.id = `book-${book.id}`;
    let priceHTML = book.offerPrice > 0 ? `<p class="price"><del>${book.price} LEKE</del> <span class="offer-price">${book.offerPrice} LEKE</span></p>` : `<p class="price">${book.price} LEKE</p>`;
    li.innerHTML = `
      <a href="index1.html?id=${book.id}" class="book-link" data-genre="${book.genre}">
      <img src="${book.image}" alt="${book.title}">
      <div class="shkrimet">
          <p class="titulli"><strong>${book.title}</strong></p>
          <p class="autori">${book.author}</p>
          ${priceHTML}
          <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
      </div>
      </a>`;
    bookListEl.appendChild(li);
  });
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
  const authorsContainer = document.getElementById('authors-checkboxes');
  const publishersContainer = document.getElementById('publishers-checkboxes');
  if (authorsContainer) authorsContainer.innerHTML = '';
  if (publishersContainer) publishersContainer.innerHTML = '';
  const authors = [...new Set(filteredBooks.map(book => book.author))];
  const publishers = [...new Set(filteredBooks.map(book => book.botimi))];

  function displayAuthors(authorsList, showAll = false) {
    if (!authorsContainer) return;
    authorsContainer.innerHTML = '';
    const displayList = showAll ? authorsList : authorsList.slice(0, 4);
    displayList.forEach(author => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" name="author" value="${author}"> ${author}`;
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
      label.innerHTML = `<input type="checkbox" name="publisher" value="${publisher}"> ${publisher}`;
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
    const selectedAuthors = Array.from(authorsContainer.querySelectorAll('input[name="author"]:checked')).map(input => input.value);
    const selectedPublishers = Array.from(publishersContainer.querySelectorAll('input[name="publisher"]:checked')).map(input => input.value);
    let updatedBooks = filteredBooks;
    if (selectedAuthors.length > 0) {
      updatedBooks = updatedBooks.filter(book => selectedAuthors.includes(book.author));
    }
    if (selectedPublishers.length > 0) {
      updatedBooks = updatedBooks.filter(book => selectedPublishers.includes(book.botimi));
    }
    bookListEl.innerHTML = '';
    updatedBooks.forEach(book => {
      const li = document.createElement('li');
      li.id = `book-${book.id}`;
      let priceHTML = book.offerPrice > 0 ? `<p class="price"><del>${book.price} LEKE</del> <span class="offer-price">${book.offerPrice} LEKE</span></p>` : `<p class="price">${book.price} LEKE</p>`;
      li.innerHTML = `
        <a href="index1.html?id=${book.id}" class="book-link" data-genre="${book.genre}">
        <img src="${book.image}" alt="${book.title}">
        <div class="shkrimet">
            <p class="titulli"><strong>${book.title}</strong></p>
            <p class="autori">${book.author}</p>
            ${priceHTML}
            <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
        </div>
        </a>`;
      bookListEl.appendChild(li);
    });
    if (resultCountSpan) {
      resultCountSpan.textContent = `${updatedBooks.length} Rezultate`;
    }
  }

  function addCheckboxListeners() {
    if (!authorsContainer || !publishersContainer) return;
    const authorCheckboxes = authorsContainer.querySelectorAll('input[name="author"]');
    authorCheckboxes.forEach(checkbox => checkbox.addEventListener('change', updateFilteredBooks));
    const publisherCheckboxes = publishersContainer.querySelectorAll('input[name="publisher"]');
    publisherCheckboxes.forEach(checkbox => checkbox.addEventListener('change', updateFilteredBooks));
  }
  addCheckboxListeners();
}

function filterBooksByAuthor(author) {
  const filteredBooks = booksDataForGenre.filter(book => book.author.toLowerCase().trim() === author.toLowerCase().trim());
  const container = document.getElementById('koherenc');
  if (!container) return;
  const bookListEl = container.querySelector('.book-list');
  if (!bookListEl) return;
  const lookScrene = document.querySelector('.look-screne');
  const zhvillim = document.querySelector('.zhvillim');
  const containers = document.querySelectorAll('.container');
  const rekomandimet = document.querySelector('.rekomandimet');
  if (lookScrene) lookScrene.style.display = "none";
  if (zhvillim) zhvillim.style.display = "none";
  containers.forEach(container => container.style.display = "none");
  if (rekomandimet) rekomandimet.style.display = "none";
  bookListEl.innerHTML = '';
  filteredBooks.forEach(book => {
    const li = document.createElement('li');
    li.id = `book-${book.id}`;
    let priceHTML = book.offerPrice > 0 ? `<p class="price"><del>${book.price} LEKE</del> <span class="offer-price">${book.offerPrice} LEKE</span></p>` : `<p class="price">${book.price} LEKE</p>`;
    li.innerHTML = `
      <a href="index1.html?id=${book.id}" class="book-link" data-genre="${book.genre}">
        <img src="${book.image}" alt="${book.title}">
        <div class="shkrimet">
          <p class="titulli"><strong>${book.title}</strong></p>
          <p class="autori">${book.author}</p>
          ${priceHTML}
          <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
        </div>
      </a>`;
    bookListEl.appendChild(li);
  });
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
  const resultCountSpan = document.getElementById('resultCount');
  if (resultCountSpan) {
    resultCountSpan.textContent = `${filteredBooks.length} Rezultate`;
  }
}

function updateCartIcon() {
  const cartCountSpan = document.getElementById('cartCount');
  let totalQuantity = 0;
  basket.forEach(product => totalQuantity += product.quantity);
  if (cartCountSpan) {
    cartCountSpan.textContent = totalQuantity;
  }
}

window.addEventListener('pageshow', function (event) {
    if (event.persisted && sessionStorage.getItem('forceReload') === 'true') {
        sessionStorage.removeItem('forceReload');
        window.location.reload();
    }
});

window.addEventListener('load', () => {
  updateCartIcon();
  renderBasket();
});

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
            <div class="image"><img src="${product.image}" alt="${product.name}" width="50"></div>
            <div class="name">${product.name}</div>
            <div class="totalPrice">${product.price * product.quantity} LEK</div>
            <div class="quantity">
                <span class="minus" style="cursor:pointer" data-id="${product.id}"><</span>
                <span class="qtyValue">${product.quantity}</span>
                <span class="plus" style="cursor:pointer" data-id="${product.id}">></span>
            </div>`;
    listCart.appendChild(itemDiv);
  });
  listCart.querySelectorAll('.minus').forEach(btn => btn.addEventListener('click', (e) => changeQuantity(e.target.dataset.id, -1)));
  listCart.querySelectorAll('.plus').forEach(btn => btn.addEventListener('click', (e) => changeQuantity(e.target.dataset.id, 1)));
  updateCartIcon();
}

function changeQuantity(basketItemId, amount) {
  const productIndex = basket.findIndex(p => p.id === basketItemId);
  if (productIndex > -1) {
    basket[productIndex].quantity += amount;
    if (basket[productIndex].quantity <= 0) {
      basket.splice(productIndex, 1);
    }
    localStorage.setItem('basket', JSON.stringify(basket));
    renderBasket();
  }
}

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
    containers.forEach(container => container.style.display = "none");
    if (rekomandimet) rekomandimet.style.display = "none";
  });
});

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

document.addEventListener('click', function () {
  dropdowns.forEach(dropdown => {
    dropdown.classList.remove('active');
    const dropdownContent = dropdown.querySelector('.dropdown-content');
    const icon = dropdown.querySelector('i');
    if (dropdownContent) {
      dropdownContent.style.display = 'none';
    }
    if (icon) {
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
    }
  });
});

function searchFunction() {
  const inputValue = document.getElementById('search-input').value.trim();
  if (inputValue) {
    alert(`You searched for: ${inputValue}`);
  } else {
    alert('Please enter something to search!');
  }
}

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
        sortedBooks.sort((a, b) => (a.offerPrice > 0 ? a.offerPrice : a.price) - (b.offerPrice > 0 ? b.offerPrice : b.price));
        break;
      case 'priceDesc':
        sortedBooks.sort((a, b) => (b.offerPrice > 0 ? b.offerPrice : b.price) - (a.offerPrice > 0 ? a.offerPrice : a.price));
        break;
      case 'titleAsc':
        sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'year':
        sortedBooks.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
    }
    bookListEl.innerHTML = '';
    sortedBooks.forEach(book => {
      const li = document.createElement('li');
      li.id = `book-${book.id}`;
      let priceHTML = book.offerPrice > 0 ? `<p class="price"><del>${book.price} LEKE</del> <span class="offer-price">${book.offerPrice} LEKE</span></p>` : `<p class="price">${book.price} LEKE</p>`;
      li.innerHTML = `
        <a href="index1.html?id=${book.id}" class="book-link" data-genre="${book.genre}">
          <img src="${book.image}" alt="${book.title}">
          <div class="shkrimet">
            <p class="titulli"><strong>${book.title}</strong></p>
            <p class="autori">${book.author}</p>
            ${priceHTML}
            <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
          </div>
        </a>`;
      bookListEl.appendChild(li);
    });
  });
}

const createModal = () => {
  const modal = document.createElement('div');
  modal.id = 'passwordModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">×</span>
      <h2>Identifikohu si Menaxher</h2>
      <form id="passwordForm">
        <label for="managerPassword">Fjalëkalimi:</label>
        <input type="password" id="managerPassword" name="managerPassword" required>
        <button type="submit">Hyr</button>
      </form>
    </div>`;
  document.body.appendChild(modal);
};

const style = document.createElement('style');
style.textContent = `
  .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); }
  .modal-content { background-color: white; margin: 15% auto; padding: 20px; border-radius: 10px; width: 80%; max-width: 400px; text-align: center; font-family: 'Cinzel', serif; }
  .close-modal { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
  .close-modal:hover { color: black; }
  #passwordForm label { display: block; margin: 10px 0; font-size: 16px; }
  #passwordForm input { width: 80%; padding: 10px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 5px; }
  #passwordForm button { background-color: #6B1A1A; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
  #passwordForm button:hover { background-color: #872819; }`;
document.head.appendChild(style);

const userIcon = document.querySelector('.menu-right a:first-child');
if (userIcon) {
  createModal();
  const passwordModal = document.getElementById('passwordModal');
  const closeModal = document.querySelector('.close-modal');
  const passwordForm = document.getElementById('passwordForm');
  userIcon.addEventListener('click', (e) => {
    e.preventDefault();
    passwordModal.style.display = 'block';
  });
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      passwordModal.style.display = 'none';
    });
  }
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const passwordInput = document.getElementById('managerPassword').value;
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: passwordInput }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          window.location.href = 'manager.html';
        } else {
          alert(result.message || 'Ndodhi një gabim.');
        }
      } catch (error) {
        console.error('Gabim gjatë tentativës për login:', error);
        alert('Nuk mund të lidhemi me serverin. Ju lutem provoni përsëri.');
      }
    });
  }
  document.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
      passwordModal.style.display = 'none';
    }
  });
}

function displayNewBooks() {
  const newBooksContainer = document.getElementById('new-books-list');
  if (!newBooksContainer) return;
  const newBooks = booksDataForGenre.filter(book => {
    if (!book.genre) return false;
    const genres = Array.isArray(book.genre) ? book.genre : [book.genre];
    return genres.some(g => g.trim().toLowerCase() === 'new');
  });
  newBooks.forEach(book => {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'all';
    const genreForDataAttr = Array.isArray(book.genre) ? book.genre.join(',') : book.genre;
    bookDiv.setAttribute('data-genre', genreForDataAttr || 'Unknown');
    bookDiv.setAttribute('data-author', book.author);
    let priceHTML = book.offerPrice > 0 ? `<p class="price"><del>${book.price} LEKE</del> <span class="offer-price">${book.offerPrice} LEKE</span></p>` : `<p class="price">${book.price} LEKE</p>`;
    let shortDesc = '';
    if (book.longDescription) {
      const words = book.longDescription.split(/\s+/);
      shortDesc = words.slice(0, 10).join(' ');
      if (words.length > 10) shortDesc += '...';
    }
    bookDiv.innerHTML = `
            <a href="index1.html?id=${book.id}">
                <img src="${book.image}" alt="${book.title}">
                <div class="shkrimet">
                    <p><strong>${book.title.toUpperCase()}</strong></p>
                    <p>Nga ${book.author}</p>
                    <p class="desc">${shortDesc}</p>
                    ${priceHTML}
                    <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
                </div>
            </a>`;
    newBooksContainer.appendChild(bookDiv);
  });
  initslider();
}

document.querySelectorAll('.autor-dinamik-karta').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });
});

function displayTopSellers() {
  const topSellersList = document.getElementById('top-sellers-list');
  if (!topSellersList) return;
  const topSellerBooks = booksDataForGenre.filter(book => Array.isArray(book.genre) && book.genre.length > 0 && book.genre[0].trim() === 'Top Seller');
  topSellersList.innerHTML = '';
  topSellerBooks.forEach(book => {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'all';
    const subGenre = (Array.isArray(book.genre) && book.genre.length > 1) ? book.genre[1].trim() : 'Other';
    bookDiv.setAttribute('data-genre', subGenre);
    let priceHTML = book.offerPrice > 0 ? `<p class="price"><del>${book.price} LEKE</del> <span class="offer-price">${book.offerPrice} LEKE</span></p>` : `<p class="price">${book.price} LEKE</p>`;
    let shortDesc = '';
    if (book.longDescription) {
      const words = book.longDescription.split(/\s+/);
      shortDesc = words.slice(0, 10).join(' ');
      if (words.length > 10) shortDesc += '...';
    }
    bookDiv.innerHTML = `
            <a href="index1.html?id=${book.id}" class="book-link">
                <img src="${book.image}" alt="${book.title}">
                <div class="shkrimet">
                    <p class="titulli"><strong>${book.title}</strong></p>
                    <p class="autori">${book.author}</p>
                    <p class="desc">${shortDesc}</p>
                    ${priceHTML}
                    <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
                </div>
            </a>`;
    topSellersList.appendChild(bookDiv);
  });
  initslider();
}

function setupTopSellerFilter() {
  const topSellerSelect = document.getElementById('auto');
  if (!topSellerSelect) return;
  topSellerSelect.addEventListener('change', () => {
    const selectedSubGenre = topSellerSelect.value;
    const topSellerList = document.getElementById('top-sellers-list');
    if (!topSellerList) return;
    const allTopSellerItems = topSellerList.querySelectorAll('.all');
    allTopSellerItems.forEach(item => {
      const itemSubGenre = item.getAttribute('data-genre');
      if (selectedSubGenre === 'all' || itemSubGenre === selectedSubGenre) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
    const sliderWrapper = topSellerList.closest('.slider-wrapper');
    if (sliderWrapper) {
      const prevBtn = sliderWrapper.querySelector('#prev-slide');
      const nextBtn = sliderWrapper.querySelector('#next-slide');
      topSellerList.scrollLeft = 0;
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) {
        setTimeout(() => {
          const isScrollable = topSellerList.scrollWidth > topSellerList.clientWidth;
          nextBtn.style.display = isScrollable ? "block" : "none";
        }, 50);
      }
    }
  });
}

function filterBooksByOffer() {
  let filteredBooks = booksDataForGenre.filter(book => book.offerPrice && book.offerPrice > 0);
  const resultCountSpan = document.getElementById('resultCount');
  if (resultCountSpan) {
    resultCountSpan.textContent = `${filteredBooks.length} Rezultate`;
  }
  const container = document.getElementById('koherenc');
  if (!container) return;
  const bookListEl = container.querySelector('.book-list');
  if (!bookListEl) return;
  bookListEl.innerHTML = '';
  filteredBooks.forEach(book => {
    const li = document.createElement('li');
    li.id = `book-${book.id}`;
    let priceHTML = `<p class="price"><del>${book.price} LEKE</del> <span class="offer-price">${book.offerPrice} LEKE</span></p>`;
    li.innerHTML = `
      <a href="index1.html?id=${book.id}" class="book-link">
        <img src="${book.image}" alt="${book.title}">
        <div class="shkrimet">
          <p class="titulli"><strong>${book.title}</strong></p>
          <p class="autori">${book.author}</p>
          ${priceHTML}
          <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
        </div>
      </a>`;
    bookListEl.appendChild(li);
  });
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
  const authorsContainer = document.getElementById('authors-checkboxes');
  const publishersContainer = document.getElementById('publishers-checkboxes');
  if (authorsContainer) authorsContainer.innerHTML = '';
  if (publishersContainer) publishersContainer.innerHTML = '';
  const authors = [...new Set(filteredBooks.map(book => book.author))];
  const publishers = [...new Set(filteredBooks.map(book => book.botimi))];
  function displayAuthors(authorsList) {}
  function displayPublishers(publishersList) {}
}

function initInfoLinks() {
  const infoLinks = document.querySelectorAll('.info-link');
  const allInfoSections = document.querySelectorAll('.info-section');
  const mainContentSections = [
    document.querySelector('.hero-section-background'),
    document.querySelector('.zhvillim'),
    ...document.querySelectorAll('.container'),
    document.querySelector('.rekomandimet'),
    document.querySelector('.lib-femije-seksion-bg'),
    document.querySelector('.autor-dinamik-mbajtesi'),
    document.querySelector('.seksion-oferte'),
    document.getElementById('koherenc')
  ];
  infoLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetSection = document.getElementById('info-' + targetId);
      mainContentSections.forEach(section => {
        if (section) section.style.display = 'none';
      });
      allInfoSections.forEach(section => {
        section.style.display = 'none';
      });
      if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const hamMenu = document.querySelector('.ham-menu');
      const ofScreneMenu = document.querySelector('.of-screne-menu');
      if (hamMenu && ofScreneMenu) {
        hamMenu.classList.remove('active');
        ofScreneMenu.classList.remove('active');
      }
    });
  });
}

function displayRecommendations() {
  const recommendationsContainer = document.getElementById('recommendations-container');
  const bookListEl = document.getElementById('recommendations-list');
  if (!recommendationsContainer || !bookListEl) return;
  const interests = JSON.parse(localStorage.getItem('userInterests')) || [];
  if (interests.length === 0) {
    recommendationsContainer.style.display = 'none';
    return;
  }
  const bookScores = {};
  interests.forEach((interest, index) => {
    const score = interests.length - index;
    booksDataForGenre.forEach(book => {
      if (!bookScores[book.id]) {
        bookScores[book.id] = { book: book, score: 0 };
      }
      let matches = false;
      if (interest.type === 'author' && book.author.trim() === interest.value) {
        matches = true;
      } else if (interest.type === 'genre') {
        const bookGenres = Array.isArray(book.genre) ? book.genre.map(g => g.trim().toLowerCase()) : [book.genre.trim().toLowerCase()];
        if (bookGenres.includes(interest.value)) {
          matches = true;
        }
      }
      if (matches) {
        bookScores[book.id].score += score;
      }
    });
  });
  const sortedBooks = Object.values(bookScores)
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.book)
    .slice(0, 20);
  if (sortedBooks.length < 3) {
    recommendationsContainer.style.display = 'none';
    return;
  }
  bookListEl.innerHTML = '';
  sortedBooks.forEach(book => {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'all';
    bookDiv.setAttribute('data-author', book.author);
    let priceHTML = book.offerPrice > 0 ? `<p class="price"><del>${book.price} LEKE</del> <span class="offer-price">${book.offerPrice} LEKE</span></p>` : `<p class="price">${book.price} LEKE</p>`;
    let shortDesc = '';
    if (book.longDescription) {
      const words = book.longDescription.split(/\s+/);
      shortDesc = words.slice(0, 10).join(' ');
      if (words.length > 10) shortDesc += '...';
    }
    bookDiv.innerHTML = `
            <a href="index1.html?id=${book.id}">
                <img src="${book.image}" alt="${book.title}">
                <div class="shkrimet">
                    <p><strong>${book.title.toUpperCase()}</strong></p>
                    <p>Nga ${book.author}</p>
                    <p class="desc">${shortDesc}</p>
                    ${priceHTML}
                    <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
                </div>
            </a>`;
    bookListEl.appendChild(bookDiv);
  });
  recommendationsContainer.style.display = 'block';
  initslider();
}

function loadFeaturedAuthors() {
    const container = document.getElementById('featured-authors-grid');
    if (!container) return;
    fetch('/api/featured-authors')
        .then(response => response.json())
        .then(authors => {
            container.innerHTML = '';
            authors.forEach(author => {
                const authorCard = document.createElement('div');
                authorCard.className = 'autor-dinamik-karta';
                const authorLink = `index.html?author=${encodeURIComponent(author.name)}`;
                authorCard.innerHTML = `
                    <div class="autor-dinamik-foto-mbajtes">
                        <img src="${author.image_url}" alt="Foto e autorit ${author.name}">
                    </div>
                    <h3 class="autor-dinamik-font-titull autor-dinamik-emri">${author.name}</h3>
                    <p class="autor-dinamik-kombesia">${author.nationality}</p>
                    <p class="autor-dinamik-pershkrim">${author.description}</p>
                    <a href="${authorLink}" class="autor-dinamik-buton">Zbulo Veprat</a>`;
                container.appendChild(authorCard);
            });
        })
        .catch(err => console.error('Gabim gjatë ngarkimit të autorëve:', err));
}

document.addEventListener('DOMContentLoaded', loadFeaturedAuthors);