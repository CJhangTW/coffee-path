/** @param {number} value */
export function validateWater(value) { return Number.isFinite(value) && value >= 0 && value <= 250; }
