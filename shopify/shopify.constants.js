module.exports = {
  REGIONS_WF: ['au', 'us', 'uk'],
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
  INVENTORY_HOLD_REGIONAL_TAGS: {
    au: 'inv_hold',
    us: 'inv_hold_us',
    uk: 'inv_hold_uk',
  },
  SWELL_VIP_TAGS: {
    member: 'swell_vip_club member',
    level1: 'swell_vip_level 1',
    level2: 'swell_vip_level 2',
    level3: 'swell_vip_level 3',
  }
};