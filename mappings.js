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
};

const shopifyRegionToPvxSite = (shopifyRegion) => {
  if (shopifyRegion === 'baddest') {
    return 'BaddestSite';
  } else if (shopifyRegion === 'au') {
    return 'PrimarySite';
  }

  return null;
};

module.exports = {
  shopifyRegionToStarshipitAccount,
  shopifyRegionToPvxSite,
};