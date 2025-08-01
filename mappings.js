const shopifyRegionToStarshipitAccount = (shopifyRegion, shippingMethod) => {
  if (shopifyRegion === 'au') {
    if (shippingMethod?.includes('Melbourne')) {
      return 'melb';
    }
    if (shippingMethod?.includes('Brisbane')) {
      return 'bris';
    }
    return 'wf';
  }

  if (shopifyRegion === 'baddest') {
    return 'baddest';
  }
  
  return null;
}

module.exports = {
  shopifyRegionToStarshipitAccount,
};