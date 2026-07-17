/**
 * VendorFlow — Currency Utilities
 * All monetary values stored in USD internally.
 * This module handles display conversion to/from ZAR.
 */

const Currency = (() => {
  // State — synced from settings
  let _rate = 18.5;    // 1 USD = X ZAR
  let _active = 'USD'; // display currency

  /**
   * Set the current exchange rate and display currency.
   * Called on app init and when settings are updated.
   */
  function init(rate, displayCurrency) {
    _rate    = parseFloat(rate)       || 18.5;
    _active  = (displayCurrency || 'USD').toUpperCase();
  }

  /** Set display currency without changing rate */
  function setDisplay(currency) {
    _active = currency.toUpperCase();
  }

  /** Get current display currency */
  function getDisplay() { return _active; }

  /** Get current exchange rate */
  function getRate() { return _rate; }

  /**
   * Convert a USD value for display.
   * @param {number} usd
   * @param {string} [forceCurrency] — override active currency
   */
  function fromUSD(usd, forceCurrency) {
    const cur = (forceCurrency || _active).toUpperCase();
    const val = cur === 'ZAR' ? usd * _rate : usd;
    return val;
  }

  /**
   * Convert a ZAR value to USD.
   * @param {number} zar
   */
  function toUSD(zar) {
    return _rate > 0 ? zar / _rate : 0;
  }

  /**
   * Format a USD value as a display string.
   * @param {number} usd
   * @param {string} [forceCurrency]
   * @param {number} [decimals=2]
   */
  function format(usd, forceCurrency, decimals = 2) {
    const cur = (forceCurrency || _active).toUpperCase();
    const val = cur === 'ZAR' ? usd * _rate : usd;
    const sym = cur === 'ZAR' ? 'R' : '$';
    return `${sym}${val.toFixed(decimals)}`;
  }

  /**
   * Format a number with the given currency symbol, no conversion.
   */
  function formatRaw(amount, currency, decimals = 2) {
    const sym = (currency || _active).toUpperCase() === 'ZAR' ? 'R' : '$';
    return `${sym}${parseFloat(amount).toFixed(decimals)}`;
  }

  /**
   * Get the symbol for a currency string.
   */
  function symbol(currency) {
    return (currency || _active).toUpperCase() === 'ZAR' ? 'R' : '$';
  }

  /**
   * Parse a user-entered price field.
   * If the display currency is ZAR, converts to USD for storage.
   * @param {string|number} input
   * @param {string} [inputCurrency] — currency the user typed in
   */
  function parseInput(input, inputCurrency) {
    const val = parseFloat(input) || 0;
    const cur = (inputCurrency || _active).toUpperCase();
    return cur === 'ZAR' ? toUSD(val) : val;
  }

  /**
   * Return a short label for the active currency.
   */
  function label() { return _active === 'ZAR' ? 'ZAR (R)' : 'USD ($)'; }

  return { init, setDisplay, getDisplay, getRate, fromUSD, toUSD, format, formatRaw, symbol, parseInput, label };
})();

// Make available globally
window.Currency = Currency;
