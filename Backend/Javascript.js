document.addEventListener('DOMContentLoaded', function () {
  const btnFemije = document.querySelector('.lib-femije-buton-femijesh');
  if (btnFemije) {
    btnFemije.addEventListener('click', function (e) {
      e.preventDefault();
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
        const scrollAmount = -bookList.clientWidth;
        bookList.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      });
    }

    if (nextSlideBtn) {
      nextSlideBtn.addEventListener('click', () => {
        const scrollAmount = bookList.clientWidth;
        bookList.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      });
    }

    if (bookList) {
      bookList.addEventListener('scroll', () => {
        handleSlideButtons();
      });
    }

    window.addEventListener('load', () => handleSlideButtons());
    window.addEventListener('resize', () => handleSlideButtons());
  });
};

initslider();

let booksDataForGenre = [];
let basket = JSON.parse(localStorage.getItem('basket')) || [];

const trackUserInterest = (author, genres) => {
  try {
    let interests = JSON.parse(localStorage.getItem('userInterests')) || [];
    if (author) {
      interests.unshift({
        type: 'author',
        value: author.trim()
      });
    }
    if (Array.isArray(genres)) {
      genres.forEach(genre => {
        if (genre) {
          interests.unshift({
            type: 'genre',
            value: genre.trim().toLowerCase()
          });
        }
      });
    } else if (typeof genres === 'string' && genres) {
      interests.unshift({
        type: 'genre',
        value: genres.trim().toLowerCase()
      });
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

    const genreLinksDropdown = document.querySelectorAll('.dropdown-content .genre-link');
    if (genreLinksDropdown.length === 0) {
      console.error('Asnjë genre-link nuk u gjet në dropdown!');
    }

    genreLinksDropdown.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const selectedGenre = this.textContent.trim().toLowerCase();
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
        if (section) {
          section.style.display = "none";
        }
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

              if (result.type === 'book') {
                resultItem.innerHTML = `
                              <img src="${result.image}" alt="${result.name}">
                              <span>${result.name}</span>
                            `;
                resultItem.addEventListener('click', () => {
                  window.location.href = `index1.html?id=${result.id}`;
                });
              } else if (result.type === 'author') {
                resultItem.innerHTML = `
                              <i class="fa-light fa-user" style="margin-right: 10px; color: #555;"></i>
                              <span>${result.name} (Autor)</span>
                            `;
                resultItem.addEventListener('click', () => {
                  window.location.href = `index.html?author=${encodeURIComponent(result.name)}`;
                });
              }
              searchResults.appendChild(resultItem);
            });
          }
        } catch (err) {
          console.error("Gabim gjatë kërkimit:", err);
          searchResults.innerHTML = '<div class="search-result-item">Gabim në server</div>';
        }
      });

      searchInput.addEventListener('keydown', (e) => {
      });
      document.addEventListener('click', (e) => {
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
      submitOrderBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('firstName') ?.value;
        const lastName = document.getElementById('lastName') ?.value;
        const phone = document.getElementById('phone') ?.value;
        const city = document.getElementById('city') ?.value;
        const state = document.getElementById('state') ?.value;
        const address = document.getElementById('address') ?.value;

        if (!firstName || !lastName || !phone || !city || !state || !address) {
          alert('Ju lutem plotësoni të gjitha fushat e formularit!');
          return;
        }

        const userInfo = {
          firstName,
          lastName,
          phone,
          city,
          state,
          address
        };

        const basketWithAuthors = basket.map(item => {
          const product = booksDataForGenre.find(p => p.id === item.productId);
          return {
            ...item,
            author: product ? product.author : 'I panjohur'
          };
        });

        try {
          const response = await fetch('/api/order/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              basket: basketWithAuthors,
              userInfo: userInfo
            })
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

    let priceHTML = '';
    if (book.offerPrice && book.offerPrice > 0) {
      priceHTML = `
            <p class="price">
                <del>${book.price} LEKE</del> 
                <span class="offer-price">${book.offerPrice} LEKE</span>
            </p>`;
    } else {
      priceHTML = `<p class="price">${book.price} LEKE</p>`;
    }

    li.innerHTML = `
      <a href="index1.html?id=${book.id}" class="book-link" data-genre="${book.genre}">
      <img src="${book.image}" alt="${book.title}">
      <div class="shkrimet">
          <p class="titulli"><strong>${book.title}</strong></p>
          <p class="autori">${book.author}</p>
          ${priceHTML}
          <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
      </div>
      </a>
    `;
    bookListEl.appendChild(li);
  });

  container.style.display = 'block';
  container.scrollIntoView({
    behavior: 'smooth'
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
      let priceHTML = '';
      if (book.offerPrice && book.offerPrice > 0) {
        priceHTML = `
        <p class="price">
            <del>${book.price} LEKE</del> 
            <span class="offer-price">${book.offerPrice} LEKE</span>
        </p>`;
      } else {
        priceHTML = `<p class="price">${book.price} LEKE</p>`;
      }

      li.innerHTML = `
        <a href="index1.html?id=${book.id}" class="book-link" data-genre="${book.genre}">
        <img src="${book.image}" alt="${book.title}">
        <div class="shkrimet">
            <p class="titulli"><strong>${book.title}</strong></p>
            <p class="autori">${book.author}</p>
            ${priceHTML}
            <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
        </div>
        </a>
      `;
      bookListEl.appendChild(li);
    });

    if (resultCountSpan) {
      resultCountSpan.textContent = `${updatedBooks.length} Rezultate`;
    }
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
  const filteredBooks = booksDataForGenre.filter(book => {
    const bookAuthor = book.author.toLowerCase().trim();
    const searchAuthor = author.toLowerCase().trim();
    return bookAuthor === searchAuthor;
  });

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

    let priceHTML = '';
    if (book.offerPrice && book.offerPrice > 0) {
      priceHTML = `
            <p class="price">
                <del>${book.price} LEKE</del> 
                <span class="offer-price">${book.offerPrice} LEKE</span>
            </p>`;
    } else {
      priceHTML = `<p class="price">${book.price} LEKE</p>`;
    }

    li.innerHTML = `
      <a href="index1.html?id=${book.id}" class="book-link" data-genre="${book.genre}">
        <img src="${book.image}" alt="${book.title}">
        <div class="shkrimet">
          <p class="titulli"><strong>${book.title}</strong></p>
          <p class="autori">${book.author}</p>
          ${priceHTML}
          <button class="add" data-id="${book.id}"><i class="fa-light fa-cart-shopping"></i> Add to Basket</button>
        </div>
      </a>
    `;
    bookListEl.appendChild(li);
  });

  container.style.display = 'block';
  container.scrollIntoView({
    behavior: 'smooth'
  });
  const resultCountSpan = document.getElementById('resultCount');
  if (resultCountSpan) {
    resultCountSpan.textContent = `${filteredBooks.length} Rezultate`;
  }
}

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

// Zgjidhje për problemin e menusë që mbetet hapur pas kthimit mbrapsht
window.addEventListener('pageshow', function(event) {
    // Kjo pjesë kodi kontrollon nëse faqja po ngarkohet nga memoria cache e shfletuesit
    // (gjë që ndodh kur përdoruesi klikon butonin "back").
    // 'event.persisted' është 'true' në këtë rast.
    if (event.persisted) {
        // Nese faqja po vjen nga cache, bëj një ringarkim të plotë të saj.
        window.location.reload();
    }
});