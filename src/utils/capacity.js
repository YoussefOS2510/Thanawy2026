export function getTotalEmployees(assets = {}) {
  return (assets.empL1 || 0) + (assets.empL2 || 0) + (assets.empL3 || 0);
}

/**
 * Calculates effective desk assignments.
 * Prioritizes higher tier employees (L3 -> L2 -> L1) to available desks,
 * while respecting any explicit assignments if defined.
 */
export function getEffectiveDeskAssignments(assets = {}) {
  const totalL1 = Math.max(0, assets.empL1 || 0);
  const totalL2 = Math.max(0, assets.empL2 || 0);
  const totalL3 = Math.max(0, assets.empL3 || 0);
  const totalDesks = Math.max(0, assets.desks || 0);

  // If explicit assignments are provided, clamp them to valid ranges
  if (
    assets.assignedEmpL1 !== undefined ||
    assets.assignedEmpL2 !== undefined ||
    assets.assignedEmpL3 !== undefined
  ) {
    let assignedL3 = Math.min(totalL3, Math.max(0, assets.assignedEmpL3 || 0));
    let remainingDesks = Math.max(0, totalDesks - assignedL3);

    let assignedL2 = Math.min(totalL2, Math.max(0, assets.assignedEmpL2 || 0), remainingDesks);
    remainingDesks = Math.max(0, remainingDesks - assignedL2);

    let assignedL1 = Math.min(totalL1, Math.max(0, assets.assignedEmpL1 || 0), remainingDesks);

    return {
      assignedL1,
      assignedL2,
      assignedL3,
      unassignedL1: totalL1 - assignedL1,
      unassignedL2: totalL2 - assignedL2,
      unassignedL3: totalL3 - assignedL3,
      totalAssigned: assignedL1 + assignedL2 + assignedL3,
      totalDesks,
      isAuto: false
    };
  }

  // Automatic optimal assignment: L3 -> L2 -> L1
  let remainingDesks = totalDesks;

  const assignedL3 = Math.min(totalL3, remainingDesks);
  remainingDesks -= assignedL3;

  const assignedL2 = Math.min(totalL2, remainingDesks);
  remainingDesks -= assignedL2;

  const assignedL1 = Math.min(totalL1, remainingDesks);
  remainingDesks -= assignedL1;

  return {
    assignedL1,
    assignedL2,
    assignedL3,
    unassignedL1: totalL1 - assignedL1,
    unassignedL2: totalL2 - assignedL2,
    unassignedL3: totalL3 - assignedL3,
    totalAssigned: assignedL1 + assignedL2 + assignedL3,
    totalDesks,
    isAuto: true
  };
}

export function getTotalEmployeeCapacity(assets = {}) {
  return (assets.empL1 || 0) * 1 + (assets.empL2 || 0) * 2 + (assets.empL3 || 0) * 3;
}

/**
 * Working capacity is calculated from employees assigned to desks.
 * L1 at desk = 1 case, L2 at desk = 2 cases, L3 at desk = 3 cases.
 */
export function getWorkingCapacity(assets = {}) {
  const { assignedL1, assignedL2, assignedL3 } = getEffectiveDeskAssignments(assets);
  return (assignedL1 * 1) + (assignedL2 * 2) + (assignedL3 * 3);
}

export function getSolvableMarketCeiling(assets = {}, certLimits = {}) {
  const workingCapacity = getWorkingCapacity(assets);
  const certLevel = assets.certLevel || 0;
  const certLimit = certLimits[certLevel] !== undefined ? certLimits[certLevel] : 0;
  return Math.min(workingCapacity, certLimit);
}

export function calculateTotalSpend(assets = {}, prices = {}) {
  if (!assets || !prices) return 0;

  const empL1Cost = (assets.empL1 || 0) * (prices.empL1 || 0);
  const empL2Cost = (assets.empL2 || 0) * (prices.empL2 || 0);
  const empL3Cost = (assets.empL3 || 0) * (prices.empL3 || 0);
  const deskCost = (assets.desks || 0) * (prices.desk || 0);

  const tvUnits = Math.ceil((assets.tvCharges || 0) / 3);
  const couchUnits = Math.ceil((assets.couchCharges || 0) / 3);
  const compUnits = Math.ceil((assets.computerCharges || 0) / 3);

  const tvCost = tvUnits * (prices.tv || 0);
  const couchCost = couchUnits * (prices.couch || 0);
  const compCost = compUnits * (prices.computer || 0);

  let certCost = 0;
  const certLvl = assets.certLevel || 0;
  for (let i = 1; i <= certLvl; i++) {
    certCost += prices[`cert${i}`] || 0;
  }

  return empL1Cost + empL2Cost + empL3Cost + deskCost + tvCost + couchCost + compCost + certCost;
}

/**
 * Computes optimal case assignment based on capacity, cert limit, and consumable charges.
 * Prioritizes highest revenue cases first based on caseRevenues.
 */
export function calculateOptimalCases(
  assets = {},
  certLimits = {},
  caseRevenues = { type1: 10000, type2: 15000, type3: 7500 }
) {
  const ceiling = getSolvableMarketCeiling(assets, certLimits);
  let remainingCapacity = ceiling;

  const revs = {
    type1: caseRevenues.type1 || 10000,
    type2: caseRevenues.type2 || 15000,
    type3: caseRevenues.type3 || 7500
  };

  const chargesMap = {
    type1: Math.max(0, assets.tvCharges || 0),
    type2: Math.max(0, assets.couchCharges || 0),
    type3: Math.max(0, assets.computerCharges || 0)
  };

  // Sort types by highest revenue descending
  const sortedTypes = ["type1", "type2", "type3"].sort((a, b) => revs[b] - revs[a]);

  const solved = { type1: 0, type2: 0, type3: 0 };

  for (const type of sortedTypes) {
    const num = Math.min(remainingCapacity, chargesMap[type]);
    solved[type] = num;
    remainingCapacity -= num;
  }

  const totalCases = solved.type1 + solved.type2 + solved.type3;
  const totalProfit =
    (solved.type1 * revs.type1) +
    (solved.type2 * revs.type2) +
    (solved.type3 * revs.type3);

  return {
    type1: solved.type1,
    type2: solved.type2,
    type3: solved.type3,
    totalCases,
    totalProfit,
    ceiling
  };
}

export function validateCaseInputs(assets = {}, certLimits = {}, inputs = {}) {
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

export function calculateNetWorth(team) {
  if (!team) return 0;
  if (team.profit !== undefined && team.profit !== null) {
    return Number(team.profit) || 0;
  }
  return Number(team.cash) || 0;
}
