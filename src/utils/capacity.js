export function getTotalEmployees(assets) {
  return (assets.empL1 || 0) + (assets.empL2 || 0) + (assets.empL3 || 0);
}

export function getTotalEmployeeCapacity(assets) {
  return (assets.empL1 || 0) * 1 + (assets.empL2 || 0) * 2 + (assets.empL3 || 0) * 3;
}

export function getWorkingCapacity(assets) {
  const empCapacity = getTotalEmployeeCapacity(assets);
  const desks = assets.desks || 0;
  return Math.min(empCapacity, desks);
}

export function getSolvableMarketCeiling(assets, certLimits) {
  const workingCapacity = getWorkingCapacity(assets);
  const certLevel = assets.certLevel || 0;
  const certLimit = certLimits[certLevel] !== undefined ? certLimits[certLevel] : 0;
  return Math.min(workingCapacity, certLimit);
}

export function validateCaseInputs(assets, certLimits, inputs) {
  const errors = {};
  const t1 = parseInt(inputs.type1 || 0, 10);
  const t2 = parseInt(inputs.type2 || 0, 10);
  const t3 = parseInt(inputs.type3 || 0, 10);
  const total = t1 + t2 + t3;

  const ceiling = getSolvableMarketCeiling(assets, certLimits);
  
  if (total > ceiling) {
    errors.total = `Total cases (${total}) exceeds solvable market ceiling (${ceiling}).`;
  }
  
  const tvMax = assets.tvCharges || 0;
  if (t1 > tvMax) {
    errors.type1 = `Type 1 cases (${t1}) exceeds active TV capacity (${tvMax} cases remaining).`;
  }

  const couchMax = assets.couchCharges || 0;
  if (t2 > couchMax) {
    errors.type2 = `Type 2 cases (${t2}) exceeds active Couch capacity (${couchMax} cases remaining).`;
  }

  const computerMax = assets.computerCharges || 0;
  if (t3 > computerMax) {
    errors.type3 = `Type 3 cases (${t3}) exceeds active Computer capacity (${computerMax} cases remaining).`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function calculateNetWorth(team, config) {
  let value = team.cash;
  // Calculate value of permanent assets based on Market 1 prices (since they are permanent)
  // Or we can just calculate them as purchase value. Let's use Market 1 prices as baseline
  const prices = config.prices.market1;
  value += (team.assets.empL1 || 0) * prices.empL1;
  value += (team.assets.empL2 || 0) * prices.empL2;
  value += (team.assets.empL3 || 0) * prices.empL3;
  value += (team.assets.desks || 0) * prices.desk;
  
  // Certificates: add cost of all levels up to their current level
  for (let i = 1; i <= (team.assets.certLevel || 0); i++) {
    const key = `cert${i}`;
    value += prices[key] || 0;
  }

  // Consumables: add value of active charges
  // (1/3 of the purchase price per charge)
  value += Math.round(((team.assets.tvCharges || 0) / 3) * prices.tv);
  value += Math.round(((team.assets.couchCharges || 0) / 3) * prices.couch);
  value += Math.round(((team.assets.computerCharges || 0) / 3) * prices.computer);

  return value;
}
