const state = {
    cryptoData: [],
    selectedCrypto: 'bitcoin',
    selectedFiat: 'USD',
    fiatSymbol: '$',
    fiatRate: 1,
    isCryptoInputActive: true,
    currentPage: 1,
    rowsPerPage: 50,
    fiatRates: {
        'USD': { rate: 1, symbol: '$', icon: '🇺🇸', name: 'Dollar' },
        'EUR': { rate: 0.92, symbol: '€', icon: '🇪🇺', name: 'Euro' },
        'RUB': { rate: 92.5, symbol: '₽', icon: '🇷🇺', name: 'Ruble' },
        'BYN': { rate: 3.25, symbol: 'Br', icon: '🇧🇾', name: 'B. Ruble' },
        'GBP': { rate: 0.79, symbol: '£', icon: '🇬🇧', name: 'Pound' },
        'KZT': { rate: 450.5, symbol: '₸', icon: '🇰🇿', name: 'Tenge' },
        'UAH': { rate: 39.5, symbol: '₴', icon: '🇺🇦', name: 'Hryvnia' }
    }
};

const cryptoTableBody = document.getElementById('crypto-table-body');
const marketSearch = document.getElementById('market-search');
const navLinks = document.querySelectorAll('.nav-link');
const pageViews = document.querySelectorAll('.page-view');
const themeToggle = document.getElementById('theme-toggle');

const calcCryptoAmount = document.getElementById('calc-crypto-amount');
const calcFiatAmount = document.getElementById('calc-fiat-amount');
const cryptoDropdownList = document.getElementById('crypto-dropdown-list');
const fiatDropdownList = document.getElementById('fiat-dropdown-list');
const cryptoSelectWrapper = document.getElementById('crypto-custom-select');
const fiatSelectWrapper = document.getElementById('fiat-custom-select');
const cryptoSelectTrigger = cryptoSelectWrapper?.querySelector('.custom-select-trigger');
const fiatSelectTrigger = fiatSelectWrapper?.querySelector('.custom-select-trigger');
const dropdownSearchInput = document.getElementById('dropdown-search-input');
const cryptoPriceHint = document.getElementById('crypto-price-hint');
const fiatSymbolSpans = document.querySelectorAll('.js-fiat-symbol');
const swapBtn = document.getElementById('swap-calc-btn');

const chartModal = document.getElementById('chart-modal');
const closeModalBtn = document.querySelector('.close-modal');
const modalCoinTitle = document.getElementById('modal-coin-title');

const paginationContainer = document.getElementById('pagination');

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initSPA();
    initDropdownToggle();
    initFiatDropdown();
    initCryptoDropdownListener();
    initCalculatorEvents();
    initChartModal();
    await fetchFiatRates();
    await fetchCryptoData();
});

function initTheme() {
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    const dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');

    themeToggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

function initSPA() {
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = link.dataset.page;

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            pageViews.forEach(view => {
                if (view.id === target) {
                    view.style.display = 'block';
                    void view.offsetWidth;
                    view.classList.add('active', 'animate-in');
                } else {
                    view.classList.remove('active', 'animate-in');
                    setTimeout(() => {
                        if (!view.classList.contains('active')) view.style.display = 'none';
                    }, 500);
                }
            });
        });
    });

    document.querySelector('.page-view.active')?.classList.add('animate-in');
}

async function fetchFiatRates() {
    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.rates) {
            Object.keys(state.fiatRates).forEach(k => {
                if (data.rates[k]) state.fiatRates[k].rate = data.rates[k];
            });
        }
    } catch (e) { console.warn('Fiat rates fallback:', e); }
}

async function fetchCryptoData() {
    try {
        const pages = [1, 2, 3, 4, 5];
        const results = await Promise.all(
            pages.map(p =>
                fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=${p}&sparkline=false`)
                    .then(r => r.ok ? r.json() : [])
                    .catch(() => [])
            )
        );

        const flat = results.flat();
        if (!flat.length) throw new Error('No data');

        state.cryptoData = flat.map(c => ({
            id: c.id,
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            priceUsd: c.current_price,
            changePercent24Hr: c.price_change_percentage_24h,
            marketCapUsd: c.market_cap,
            image: c.image
        }));

        state.currentPage = 1;
        renderTablePage();
        populateCryptoDropdown(state.cryptoData);
        calculateConversion();
    } catch (err) {
        console.error('Fetch error:', err);
        if (cryptoTableBody)
            cryptoTableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--negative)">Failed to load. Check connection or try again later.</td></tr>`;
    }
}

function getFilteredData() {
    const term = marketSearch ? marketSearch.value.toLowerCase() : '';
    if (!term) return state.cryptoData;
    return state.cryptoData.filter(c =>
        c.name.toLowerCase().includes(term) || c.symbol.toLowerCase().includes(term)
    );
}

function renderTablePage() {
    const data = getFilteredData();
    const start = (state.currentPage - 1) * state.rowsPerPage;
    const slice = data.slice(start, start + state.rowsPerPage);
    renderTableRows(slice, start);
    renderPagination(data.length);
}

function renderTableRows(coins, offset = 0) {
    if (!cryptoTableBody) return;
    cryptoTableBody.innerHTML = '';

    if (!coins.length) {
        cryptoTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No assets found.</td></tr>`;
        return;
    }

    coins.forEach((coin, i) => {
        const tr = document.createElement('tr');
        const price = (coin.priceUsd || 0) * state.fiatRate;
        const fmt = price < 0.01
            ? { maximumFractionDigits: 6 }
            : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
        const priceStr = state.fiatSymbol + price.toLocaleString('en-US', fmt);

        const change = parseFloat(coin.changePercent24Hr) || 0;
        const positive = change >= 0;
        const cap = formatMarketCap(coin.marketCapUsd);

        tr.innerHTML = `
            <td>
                <div class="asset-info">
                    <span class="rank-num">${offset + i + 1}</span>
                    <div class="coin-icon">
                        <img src="${coin.image}" alt="${coin.symbol}"
                             onerror="this.style.display='none';this.parentElement.textContent='${coin.symbol.substring(0, 3)}'">
                    </div>
                    <div>
                        <div class="asset-name">${coin.name}</div>
                        <div class="asset-symbol">${coin.symbol}</div>
                    </div>
                </div>
            </td>
            <td class="text-right price-value">${priceStr}</td>
            <td class="text-right">
                <span class="change-badge ${positive ? 'change-positive' : 'change-negative'}">
                    ${positive ? '+' : ''}${change.toFixed(2)}%
                </span>
            </td>
            <td class="text-right hidden-mobile market-cap-value">${cap}</td>
            <td class="text-center">
                <button class="action-btn" data-symbol="${coin.symbol}" data-name="${coin.name}">Chart</button>
            </td>
        `;

        tr.querySelector('.action-btn').addEventListener('click', e => {
            e.stopPropagation();
            openChartModal(coin.symbol, coin.name);
        });

        cryptoTableBody.appendChild(tr);
    });
}

function formatMarketCap(raw) {
    const n = (parseFloat(raw) || 0) * state.fiatRate;
    if (n >= 1e12) return state.fiatSymbol + (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return state.fiatSymbol + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return state.fiatSymbol + (n / 1e6).toFixed(2) + 'M';
    return state.fiatSymbol + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function renderPagination(total) {
    if (!paginationContainer) return;
    const pages = Math.ceil(total / state.rowsPerPage);
    if (pages <= 1) { paginationContainer.innerHTML = ''; return; }

    let html = `<button class="pg-btn" data-p="${state.currentPage - 1}" ${state.currentPage === 1 ? 'disabled' : ''}>&#8592;</button>`;

    pagRange(state.currentPage, pages).forEach(item => {
        if (item === '...') {
            html += `<span class="pg-ellipsis">…</span>`;
        } else {
            html += `<button class="pg-btn ${item === state.currentPage ? 'active' : ''}" data-p="${item}">${item}</button>`;
        }
    });

    html += `<button class="pg-btn" data-p="${state.currentPage + 1}" ${state.currentPage === pages ? 'disabled' : ''}>&#8594;</button>`;

    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('.pg-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentPage = parseInt(btn.dataset.p);
            renderTablePage();
            document.querySelector('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function pagRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const result = [];
    const left = Math.max(2, cur - 2);
    const right = Math.min(total - 1, cur + 2);
    result.push(1);
    if (left > 2) result.push('...');
    for (let i = left; i <= right; i++) result.push(i);
    if (right < total - 1) result.push('...');
    result.push(total);
    return result;
}

if (marketSearch) {
    marketSearch.addEventListener('input', () => {
        state.currentPage = 1;
        renderTablePage();
    });
}

function initDropdownToggle() {
    document.addEventListener('click', e => {
        if (!e.target.closest('.custom-select-wrapper'))
            document.querySelectorAll('.custom-select-wrapper.open').forEach(w => w.classList.remove('open'));
    });

    document.querySelectorAll('.custom-select-trigger').forEach(trigger => {
        trigger.addEventListener('click', e => {
            e.stopPropagation();
            const wrapper = trigger.closest('.custom-select-wrapper');
            const wasOpen = wrapper.classList.contains('open');
            document.querySelectorAll('.custom-select-wrapper.open').forEach(w => w.classList.remove('open'));
            if (!wasOpen) {
                wrapper.classList.add('open');
                const inp = wrapper.querySelector('input[type="text"]');
                if (inp) { inp.value = ''; inp.focus(); filterCryptoDropdown(''); }
            }
        });
    });
}

function initFiatDropdown() {
    if (!fiatDropdownList) return;

    fiatDropdownList.innerHTML = '';
    Object.entries(state.fiatRates).forEach(([key, cur]) => {
        const li = document.createElement('li');
        li.className = 'dropdown-item' + (key === state.selectedFiat ? ' selected' : '');
        li.dataset.value = key;
        li.innerHTML = `<span class="fiat-flag">${cur.icon}</span><span>${key}</span><span class="fiat-name">${cur.name}</span>`;
        fiatDropdownList.appendChild(li);
    });

    updateFiatTrigger(state.selectedFiat);

    fiatDropdownList.addEventListener('click', e => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        fiatDropdownList.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');

        const value = item.dataset.value;
        const cur = state.fiatRates[value];
        state.selectedFiat = value;
        state.fiatSymbol = cur.symbol;
        state.fiatRate = cur.rate;

        updateFiatTrigger(value);
        fiatSymbolSpans.forEach(s => s.textContent = cur.symbol);
        fiatSelectWrapper.classList.remove('open');

        renderTablePage();
        calculateConversion();
    });
}

function updateFiatTrigger(key) {
    if (!fiatSelectTrigger) return;
    const cur = state.fiatRates[key];
    fiatSelectTrigger.querySelector('.fiat-flag').textContent = cur.icon;
    fiatSelectTrigger.querySelector('.trigger-text').textContent = key;
}

function populateCryptoDropdown(data) {
    if (!cryptoDropdownList) return;
    cryptoDropdownList.innerHTML = '';

    data.forEach(coin => {
        const li = document.createElement('li');
        li.className = 'dropdown-item' + (coin.id === state.selectedCrypto ? ' selected' : '');
        li.dataset.id = coin.id;
        li.dataset.symbol = coin.symbol;
        li.dataset.name = coin.name;
        li.dataset.image = coin.image;

        li.innerHTML = `
            <div class="coin-icon drop-icon">
                <img src="${coin.image}"
                     onerror="this.style.display='none';this.parentElement.textContent='${coin.symbol.substring(0, 3)}'">
            </div>
            <span>${coin.name}</span>
            <span class="drop-sym">${coin.symbol}</span>
        `;
        cryptoDropdownList.appendChild(li);
    });

    const sel = data.find(c => c.id === state.selectedCrypto) || data[0];
    if (sel) updateCryptoTrigger(sel);
}

function initCryptoDropdownListener() {
    if (!cryptoDropdownList) return;

    cryptoDropdownList.addEventListener('click', e => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        cryptoDropdownList.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');

        state.selectedCrypto = item.dataset.id;
        updateCryptoTrigger({
            id: item.dataset.id,
            symbol: item.dataset.symbol,
            name: item.dataset.name,
            image: item.dataset.image
        });

        cryptoSelectWrapper.classList.remove('open');
        calculateConversion();
    });

    if (dropdownSearchInput) {
        dropdownSearchInput.addEventListener('input', e => filterCryptoDropdown(e.target.value));
        dropdownSearchInput.addEventListener('click', e => e.stopPropagation());
    }
}

function filterCryptoDropdown(term) {
    const t = term.toLowerCase();
    cryptoDropdownList.querySelectorAll('.dropdown-item').forEach(item => {
        const match = item.dataset.name.toLowerCase().includes(t) || item.dataset.symbol.toLowerCase().includes(t);
        item.style.display = match ? 'flex' : 'none';
    });
}

function updateCryptoTrigger(coin) {
    if (!cryptoSelectTrigger) return;
    const iconEl = cryptoSelectTrigger.querySelector('.coin-icon');
    iconEl.innerHTML = `<img src="${coin.image}"
        onerror="this.style.display='none';this.parentElement.textContent='${coin.symbol.substring(0, 3)}'">`;
    iconEl.style.border = 'none';
    cryptoSelectTrigger.querySelector('.trigger-text').textContent = coin.name;
}

function initCalculatorEvents() {
    calcCryptoAmount.addEventListener('input', () => { state.isCryptoInputActive = true; calculateConversion(); });
    calcFiatAmount.addEventListener('input', () => { state.isCryptoInputActive = false; calculateConversion(); });
    swapBtn.addEventListener('click', () => {
        state.isCryptoInputActive = !state.isCryptoInputActive;
        calculateConversion();
    });
}

function calculateConversion() {
    if (!state.cryptoData.length) return;
    const coin = state.cryptoData.find(c => c.id === state.selectedCrypto);
    if (!coin) return;

    const priceInFiat = (coin.priceUsd || 0) * state.fiatRate;
    cryptoPriceHint.textContent = `1 ${coin.symbol} ≈ ${state.fiatSymbol}${priceInFiat.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;

    if (state.isCryptoInputActive) {
        const val = parseFloat(calcCryptoAmount.value) || 0;
        calcFiatAmount.value = val > 0 ? (val * priceInFiat).toFixed(2) : '0.00';
    } else {
        const val = parseFloat(calcFiatAmount.value) || 0;
        calcCryptoAmount.value = val > 0 ? (val / priceInFiat).toFixed(6) : '0';
    }
}

function initChartModal() {
    closeModalBtn.addEventListener('click', () => chartModal.classList.remove('active'));
    chartModal.addEventListener('click', e => {
        if (e.target === chartModal || e.target.classList.contains('modal-backdrop'))
            chartModal.classList.remove('active');
    });
}

function openChartModal(symbol, name) {
    modalCoinTitle.textContent = `${name} (${symbol}) — Live Chart`;
    chartModal.classList.add('active');

    const container = document.getElementById('tradingview-widget-container');
    container.innerHTML = '';

    const tvTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

    new TradingView.widget({
        autosize: true,
        symbol: `CRYPTO:${symbol}USD`,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: tvTheme,
        style: '1',
        locale: 'en',
        enable_publishing: false,
        backgroundColor: 'rgba(0,0,0,0)',
        gridColor: 'rgba(150,150,150,0.1)',
        save_image: false,
        container_id: 'tradingview-widget-container'
    });
}
