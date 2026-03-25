module.exports = {
  REGIONS_WF: ['au', 'us', 'uk'],
  EU_REGION_COUNTRIES: [
    'AT', // Austria
    'BE', // Belgium
    'HR', // Croatia
    'DK', // Denmark
    'FI', // Finland
    'FR', // France
    'DE', // Germany
    'GR', // Greece
    'HU', // Hungary
    'IE', // Ireland
    'IT', // Italy
    'LT', // Lithuania
    'LU', // Luxembourg
    'MT', // Malta
    'NL', // Netherlands
    'NO', // Norway
    'PL', // Poland
    'PT', // Portugal
    'SI', // Slovenia
    'ES', // Spain
    'SE', // Sweden
    'CH', // Switzerland
  ],
  AE_REGION_COUNTRIES: [
    'AE', // United Arab Emirates
    'SA', // Saudi Arabia
  ],
  UK_REGION_COUNTRIES: [
    'GB', // United Kingdom
    'GG', // Guernsey
    'JE', // Jersey
    'IM', // Isle of Man
  ],
  US_REGION_COUNTRIES: [
    'US', // United States
  ],
  AU_REGION_COUNTRIES: [
    'AU', // Australia
    'NZ', // New Zealand
    'CA', // Canada
    'MX', // Mexico
  ],
  HOSTNAME_TO_CREDSPATH: {
    'whitefoxboutique.com.au': 'au',
    'whitefoxboutique.com': 'us',
    'whitefoxboutique.co.uk': 'uk',
    'white-fox-boutique-develop.myshopify.com': 'develop',
  },
  SHOP_DOMAIN_TO_STORE: {
    'white-fox-boutique-aus': 'au',
    'white-fox-boutique-usa': 'us',
    'white-fox-boutique-uk': 'uk',
    'white-fox-boutique-develop': 'develop',
  },
  MAX_TAG_LENGTH: 255,
  MAX_TAG_LENGTH_FOR_ORDERS: 40,
  MAX_PAYLOADS: 250, // Currently true for inventoryQuantitiesSet, use more broadly if appropriate
  MAX_METAFIELDS_PER_SET: 25,
  INVENTORY_NAMES: [
    'available', 
    'on_hand',
  ],
  INVENTORY_REASONS: [
    'correction', 
    'cycle_count_available',
    'damaged',
    'movement_created',
    'movement_updated',
    'movement_received',
    'movement_canceled',
    'other',
    'promotion',
    'quality_control',
    'received',
    'reservation_created',
    'reservation_deleted',
    'reservation_updated',
    'restock',
    'safety_stock',
    'shrinkage',
  ],
};