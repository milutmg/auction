export const AUCTION_CATEGORIES = [
  'Furniture',
  'Art & Paintings',
  'Jewelry',
  'Collectibles',
  'Books & Manuscripts',
  'Ceramics & Pottery',
  'Clocks & Watches',
  'Textiles',
  'Silver & Metalware',
  'Musical Instruments',
  'Other'
] as const;

export const AUCTION_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  ENDED: 'ended'
} as const;

export const BID_INCREMENT = 10; // Minimum bid increment in dollars

export const AUCTION_DURATION_OPTIONS = [
  { label: '1 Day', value: 1 },
  { label: '3 Days', value: 3 },
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 }
];

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 12
};
