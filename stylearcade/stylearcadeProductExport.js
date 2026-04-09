const { funcApi, logDeep, askQuestion } = require('../utils');
const { stylearcadeDataGet } = require('../stylearcade/stylearcadeDataGet');
con

const stylearcadeProductExport = async (
  {
    option,
  } = {},
) => {

  const styleArcadeDataResponse = await stylearcadeDataGet({});

  const { success: styleArcadeDataResponseSuccess, result: styleArcadeData } = styleArcadeDataResponse;
  if (!styleArcadeDataResponseSuccess) {
    return styleArcadeDataResponse;
  }

  const productExport = [];
  styleArcadeData.forEach(product => {
    if (!product.data) {
      return;
    }
    logDeep('product', product);
    const {
      productId,
      sizeConvention,
      name,
      colour,
      category,
      subCategory,
      // priceStatus, // may be able to fetch from original price and current price, but current price is not available in range plan api
      // productCount, // need to confirm if this is necessary and what this is actually counting
    } = product.data;

    sizeConvention.sizes.forEach((size, index) => {
      const {
        name: sizeName,
      } = size;

      productExport.push({
        "Product code": productId,
        "Size": sizeName,
        "Barcode": `${ productId }-${ sizeName }`,
        "Product name": name,
        "Colour": colour,
        "Category": category,
        "Subcategory": subCategory,
      });
    });
    if (productExport.length >= 10) {
      return;
    }
  });

  logDeep('productExport', productExport);

  return {
    success: true,
    result: {},
  };
};

const stylearcadeProductExportApi = funcApi(stylearcadeProductExport, {
  argNames: ['options'],
});

module.exports = {
  stylearcadeProductExport,
  stylearcadeProductExportApi,
};

// curl localhost:8000/stylearcadeProductExport