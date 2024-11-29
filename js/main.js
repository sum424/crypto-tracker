const API_BASE_URL = 'https://api.coingecko.com/api/v3';
const comparisonContainer = $('#comparison-container');
const suggestions = $('#suggestions');
const searchBar = $('#search-bar');
const cryptoContainer = $('#crypto-container');
const paginationControls = $('#pagination-controls');
const filterSelect = $('#filter-select');

// Maximum allowed cryptocurrencies in comparison
const MAX_COMPARISONS = 7;

// Track the added cryptocurrencies by their IDs
let comparisonList = [];

// Pagination settings
let currentPage = 1;
let currentFilter = 'market_cap_desc'; // Track the current filter
const itemsPerPage = 10;

// Fetch and render cryptocurrencies based on current page and filter
function fetchCryptos(page = 1, filter = 'market_cap_desc') {
  $.get(
    `${API_BASE_URL}/coins/markets?vs_currency=cad&order=${filter}&per_page=${itemsPerPage}&page=${page}`,
    function (data) {
      renderCryptoList(data);
      updatePaginationControls(page);
    }
  ).fail(function (error) {
    console.error('Error fetching cryptocurrencies:', error);
  });
}

// Render the cryptocurrency list with more details
function renderCryptoList(data) {
  cryptoContainer.empty(); // Clear any previous content
  data.forEach((crypto) => {
    const trendClass = crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
    const cryptoMarkup = `
      <div class="crypto-item">
        <img src="${crypto.image}" alt="${crypto.name} icon" class="crypto-icon" />
        <h3>${crypto.name} (${crypto.symbol.toUpperCase()})</h3>
        <p>Price: $${crypto.current_price.toFixed(2)} CAD</p>
        <p>Market Cap: $${crypto.market_cap.toLocaleString()} CAD</p>
        <p>24h Volume: $${crypto.total_volume.toLocaleString()} CAD</p>
        <p>24h Change: <span class="${trendClass}">${crypto.price_change_percentage_24h.toFixed(2)}%</span></p>
        <button class="compare-btn" onclick="addToComparison('${crypto.id}')">Compare</button>
      </div>
    `;
    cryptoContainer.append(cryptoMarkup);
  });
}

// Update pagination controls
function updatePaginationControls(page) {
  paginationControls.empty();
  paginationControls.append(`
    <button ${page === 1 ? 'disabled' : ''} onclick="changePage(${page - 1})">Previous</button>
    <span>Page ${page}</span>
    <button onclick="changePage(${page + 1})">Next</button>
  `);
}

// Change to a new page
function changePage(newPage) {
  currentPage = newPage;
  fetchCryptos(currentPage, currentFilter); // Pass the current filter
}

// Filter cryptocurrencies based on selected criteria
filterSelect.on('change', function () {
  currentFilter = $(this).val(); // Update the filter
  currentPage = 1; // Reset to page 1
  fetchCryptos(currentPage, currentFilter);
});

// Search functionality
searchBar.on('input', function () {
  const query = searchBar.val().trim();
  if (!query) {
    suggestions.empty();
    return;
  }
  $.get(`${API_BASE_URL}/search?query=${query}`, function (data) {
    renderSuggestions(data.coins);
  }).fail(function (error) {
    console.error('Error fetching search results:', error);
  });
});

// Render search suggestions
function renderSuggestions(data) {
  suggestions.empty(); // Clear previous suggestions
  data.forEach((coin) => {
    const suggestionMarkup = `
      <div>
        <img src="${coin.image}" alt="${coin.name} icon" class="crypto-icon" />
        <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
        <button class="compare-btn" onclick="addToComparison('${coin.id}')">Compare</button>
      </div>
    `;
    suggestions.append(suggestionMarkup);
  });
}

// Add cryptocurrency to comparison
function addToComparison(id) {
  if (comparisonList.length >= MAX_COMPARISONS) {
    alert(`You can only compare up to ${MAX_COMPARISONS} cryptocurrencies.`);
    return;
  }

  if (comparisonList.includes(id)) {
    alert('This cryptocurrency is already in the comparison list.');
    return;
  }

  $.get(`${API_BASE_URL}/coins/markets?vs_currency=cad&ids=${id}`, function (data) {
    const crypto = data[0];
    const trendClass = crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative';

    // Add the cryptocurrency to the comparison list
    comparisonList.push(crypto.id);

    const comparisonMarkup = `
      <div class="comparison-item" id="comparison-${crypto.id}">
        <img src="${crypto.image}" alt="${crypto.name} icon" class="crypto-icon" />
        <h3>${crypto.name} (${crypto.symbol.toUpperCase()})</h3>
        <p>Price: $${crypto.current_price.toFixed(2)} CAD</p>
        <p>Market Cap: $${crypto.market_cap.toLocaleString()} CAD</p>
        <p>24h Volume: $${crypto.total_volume.toLocaleString()} CAD</p>
        <p>24h Change: <span class="${trendClass}">${crypto.price_change_percentage_24h.toFixed(2)}%</span></p>
        <button class="remove-btn" onclick="removeFromComparison('${crypto.id}')">Remove</button>
      </div>
    `;
    comparisonContainer.append(comparisonMarkup);
  }).fail(function (error) {
    console.error('Error adding crypto to comparison:', error);
  });
}

// Remove cryptocurrency from comparison
function removeFromComparison(id) {
  $(`#comparison-${id}`).remove(); // Remove the comparison item with the given ID

  // Remove the ID from the comparison list
  const index = comparisonList.indexOf(id);
  if (index > -1) {
    comparisonList.splice(index, 1);
  }
}

// Initialize application
$(document).ready(function () {
  fetchCryptos(); // Initial fetch with default settings
});
