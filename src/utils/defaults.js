export const DEFAULT_CONFIG = {
  maxEmployees: 5,
  startingCash: 15000,
  caseRevenues: {
    type1: 7500,
    type2: 10000,
    type3: 15000
  },
  certLimits: {
    0: 0,
    1: 3,
    2: 5,
    3: 8,
    4: 12,
    5: 18
  },
  prices: {
    market1: {
      empL1: 2000,
      empL2: 3500,
      empL3: 5000,
      desk: 1000,
      tv: 5000,
      couch: 7500,
      computer: 10000,
      cert1: 2000,
      cert2: 3500,
      cert3: 5000,
      cert4: 7500,
      cert5: 10000
    },
    market2: {
      empL1: 3000,
      empL2: 5000,
      empL3: 7500,
      desk: 1500,
      tv: 7500,
      couch: 11000,
      computer: 15000,
      cert1: 3000,
      cert2: 5000,
      cert3: 7500,
      cert4: 11000,
      cert5: 15000
    },
    market3: {
      empL1: 4500,
      empL2: 7500,
      empL3: 11000,
      desk: 2000,
      tv: 11000,
      couch: 16000,
      computer: 22000,
      cert1: 4500,
      cert2: 7500,
      cert3: 11000,
      cert4: 16000,
      cert5: 22000
    }
  }
};

export const DEFAULT_TEAMS = [
  { id: "team1", name: "Team 1", cash: 15000, assets: { empL1: 0, empL2: 0, empL3: 0, desks: 0, certLevel: 0, tvCharges: 0, couchCharges: 0, computerCharges: 0 }, casesLogged: { type1: 0, type2: 0, type3: 0 }, history: [] },
  { id: "team2", name: "Team 2", cash: 15000, assets: { empL1: 0, empL2: 0, empL3: 0, desks: 0, certLevel: 0, tvCharges: 0, couchCharges: 0, computerCharges: 0 }, casesLogged: { type1: 0, type2: 0, type3: 0 }, history: [] },
  { id: "team3", name: "Team 3", cash: 15000, assets: { empL1: 0, empL2: 0, empL3: 0, desks: 0, certLevel: 0, tvCharges: 0, couchCharges: 0, computerCharges: 0 }, casesLogged: { type1: 0, type2: 0, type3: 0 }, history: [] },
  { id: "team4", name: "Team 4", cash: 15000, assets: { empL1: 0, empL2: 0, empL3: 0, desks: 0, certLevel: 0, tvCharges: 0, couchCharges: 0, computerCharges: 0 }, casesLogged: { type1: 0, type2: 0, type3: 0 }, history: [] },
  { id: "team5", name: "Team 5", cash: 15000, assets: { empL1: 0, empL2: 0, empL3: 0, desks: 0, certLevel: 0, tvCharges: 0, couchCharges: 0, computerCharges: 0 }, casesLogged: { type1: 0, type2: 0, type3: 0 }, history: [] },
  { id: "team6", name: "Team 6", cash: 15000, assets: { empL1: 0, empL2: 0, empL3: 0, desks: 0, certLevel: 0, tvCharges: 0, couchCharges: 0, computerCharges: 0 }, casesLogged: { type1: 0, type2: 0, type3: 0 }, history: [] },
  { id: "team7", name: "Team 7", cash: 15000, assets: { empL1: 0, empL2: 0, empL3: 0, desks: 0, certLevel: 0, tvCharges: 0, couchCharges: 0, computerCharges: 0 }, casesLogged: { type1: 0, type2: 0, type3: 0 }, history: [] },
  { id: "team8", name: "Team 8", cash: 15000, assets: { empL1: 0, empL2: 0, empL3: 0, desks: 0, certLevel: 0, tvCharges: 0, couchCharges: 0, computerCharges: 0 }, casesLogged: { type1: 0, type2: 0, type3: 0 }, history: [] }
];
