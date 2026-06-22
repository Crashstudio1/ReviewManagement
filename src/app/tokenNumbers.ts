const DEFAULT_TEMPORARY_TOKEN_START = 300;

const TEMPORARY_TOKEN_STARTS: Record<string, number> = {
  A: 303,
  B: 250,
  C: 305,
  D: 310,
  E: 315,
  F: 320,
  G: 325,
  H: 330,
  I: 335,
  J: 340,
  K: 345,
  L: 350,
};

export function getTemporaryTokenStart(serviceCode: string) {
  return TEMPORARY_TOKEN_STARTS[serviceCode.trim().toUpperCase()] || DEFAULT_TEMPORARY_TOKEN_START;
}

export function getNextTemporaryTokenNumber(serviceCode: string, currentCounter = 0) {
  return Math.max(currentCounter + 1, getTemporaryTokenStart(serviceCode));
}
