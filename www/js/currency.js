
const Currency = {
  // Constants
  FMG_TO_AR: 1/5,
  AR_TO_FMG: 5,

  /**
   * Format a numeric amount into a string with currency symbol
   */
  format(amount, code) {
    const val = Number(amount) || 0;

    // Malagasy currencies usually don't show cents
    const digits = (code === 'MGA' || code === 'FMG') ? 0 : 2;

    const formatted = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(val);

    switch(code) {
      case 'EUR': return `${formatted} €`;
      case 'USD': return `${formatted} $`;
      case 'MGA': return `${formatted} Ar`;
      case 'FMG': return `${formatted} FMG`;
      default: return `${formatted} ${code}`;
    }
  },

  /**
   * Convert amount between two currencies using the provided rates
   * rates = { EUR: 5000, USD: 4500 } // relative to MGA
   */
  convert(amount, from, to, rates = { EUR: 5000, USD: 4500 }) {
    if (from === to) return amount;

    // Normalize to MGA first
    let mgaVal = 0;
    if (from === 'MGA') mgaVal = amount;
    else if (from === 'FMG') mgaVal = amount * this.FMG_TO_AR;
    else if (from === 'EUR') mgaVal = amount * (rates.EUR || 5000);
    else if (from === 'USD') mgaVal = amount * (rates.USD || 4500);

    // Convert MGA to target
    if (to === 'MGA') return mgaVal;
    if (to === 'FMG') return mgaVal * this.AR_TO_FMG;
    if (to === 'EUR') return mgaVal / (rates.EUR || 5000);
    if (to === 'USD') return mgaVal / (rates.USD || 4500);

    return mgaVal;
  },

  /**
   * Quick fixed conversions
   */
  arToFmg(amount) { return amount * this.AR_TO_FMG; },
  fmgToAr(amount) { return amount * this.FMG_TO_AR; }
};
