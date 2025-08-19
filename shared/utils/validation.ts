export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function isValidBid(bidAmount: number, currentPrice: number, minIncrement: number = 10): boolean {
  return bidAmount > currentPrice && bidAmount >= currentPrice + minIncrement;
}

export function isValidAuctionDuration(startTime: string, endTime: string): boolean {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();
  
  // Start time should be in the future (or within 5 minutes)
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  if (start < fiveMinutesFromNow) return false;
  
  // End time should be after start time
  if (end <= start) return false;
  
  // Auction duration should be at least 1 hour
  const oneHour = 60 * 60 * 1000;
  if (end.getTime() - start.getTime() < oneHour) return false;
  
  return true;
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>\"']/g, '');
}

export function isValidPrice(price: number): boolean {
  return price > 0 && price <= 1000000 && Number.isFinite(price);
}
