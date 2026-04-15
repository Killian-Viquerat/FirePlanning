export const FUNCTIONS = ['APR', 'CPL', 'MEA', 'EQ', 'CE'];

export const FUNCTION_LABELS = {
  APR: 'Porteur appareil respiratoire',
  CPL: 'Chauffeur point lourd',
  MEA: 'Machiniste échelle',
  EQ: 'Équipier',
  CE: 'Chef extinction'
};

export const WEEKEND_REQUIREMENTS = { APR: 2, CPL: 1, EQ: 1, CE: 1 };
export const WEEKDAY_REQUIREMENTS = { CE: 1, CPL: 1, MEA: 1, APR: 2, EQ: 1 };
