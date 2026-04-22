const sharp = require('sharp');
const axios = require('axios');
const {
  funcApi,
  Processor,
  arrayExhaustedCheck,
} = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');
const { REGIONS_WF } = require('../constants');

const productAttrs = `
  id
  title
  handle
  customId: metafield(namespace: "custom", key: "id") {
    value
  }
  media(first: 10) {
    edges {
      node {
        mediaContentType
        ... on MediaImage {
          id
          image { url }
        }
      }
    }
  }
`;

const HAMMING_THRESHOLD = 5;

const logBad = (id) => console.log(`\x1b[31m[BAD]\x1b[0m -> ${ id }`);

const extractMediaUrls = (product) => {
  if (!product.media) return [];
  return product.media
    .filter(m => m.mediaContentType === 'IMAGE' && m.image?.url)
    .map(m => m.image.url);
};

const computePHash = async (buffer) => {
  const { data } = await sharp(buffer)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  let sum = 0;
  for (let i = 0; i < pixels.length; i++) sum += pixels[i];
  const mean = sum / pixels.length;

  let hash = BigInt(0);
  for (let i = 0; i < 64; i++) {
    if (pixels[i] > mean) {
      hash |= BigInt(1) << BigInt(63 - i);
    }
  }
  return hash;
};

const hammingDistance = (a, b) => {
  let xor = a ^ b;
  let count = 0;
  while (xor) {
    count += Number(xor & BigInt(1));
    xor >>= BigInt(1);
  }
  return count;
};

const fetchImageBuffer = async (url) => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });
  return Buffer.from(response.data);
};

const compareImageBuffers = async (bufferA, bufferB) => {
  const [hashA, hashB] = await Promise.all([
    computePHash(bufferA),
    computePHash(bufferB),
  ]);
  return hammingDistance(hashA, hashB);
};

const makeStoreSummary = (stores) => Object.fromEntries(
  Object.entries(stores).map(([r, d]) => [r, {
    mediaUrls: d.mediaUrls,
    mediaCount: d.mediaUrls.length,
  }]),
);

const shopifyImageAudit = async (
  credsPaths = REGIONS_WF,
  {
    limit,
    apiVersion,
    hammingThreshold = HAMMING_THRESHOLD,
    concurrency = 5,
  } = {},
) => {

  const piles = {
    toCompare: [],
    toDownload: [],
    toClassify: [],
    bad: [],
    good: [],
  };

  const fetchAllRegions = async () => {
    console.log(`fetching products from ${ credsPaths.join(', ') } in parallel`);

    const regionResults = await Promise.all(credsPaths.map(async (credsPath) => {
      const response = await shopifyGet(credsPath, 'product', {
        attrs: productAttrs,
        ...(limit && { perPage: limit }),
        apiVersion,
      });

      if (!response.success) {
        console.error(`failed to fetch products from ${ credsPath }`, response.error);
        return { region: credsPath, products: [] };
      }

      const products = response.result.filter(p => p.customId?.value);
      console.log(`${ credsPath }: ${ products.length } products with custom.id`);
      return { region: credsPath, products };
    }));

    const productMap = new Map();
    for (const { region, products } of regionResults) {
      for (const product of products) {
        const customId = product.customId.value;
        if (!productMap.has(customId)) {
          productMap.set(customId, {});
        }
        productMap.get(customId)[region] = {
          id: product.id,
          title: product.title,
          handle: product.handle,
          mediaUrls: extractMediaUrls(product),
        };
      }
    }

    for (const [customId, stores] of productMap) {
      const presentRegions = Object.keys(stores);
      if (!credsPaths.every(r => presentRegions.includes(r))) continue;
      piles.toCompare.push({ customId, stores });
    }

    console.log(`${ piles.toCompare.length } products present in all ${ credsPaths.length } regions`);
  };

  await fetchAllRegions();

  const countCheckProcessor = new Processor(
    piles.toCompare,
    async (pile) => {
      const item = pile.shift();
      const { customId, stores } = item;
      const au = 'au';
      const otherRegions = Object.keys(stores).filter(r => r !== au);

      const mediaCounts = {};
      for (const region of Object.keys(stores)) {
        mediaCounts[region] = stores[region].mediaUrls.length;
      }

      if (!otherRegions.every(r => mediaCounts[r] === mediaCounts[au])) {
        logBad(customId);
        piles.bad.push({
          customId,
          title: stores[au].title,
          handle: stores[au].handle,
          stores: makeStoreSummary(stores),
          mismatchDetails: `media count differs from au: ${ detail }`,
        });
        return { customId, mismatch: true };
      }

      piles.toDownload.push(item);
      return { customId, needsDownload: true };
    },
    arrayExhaustedCheck,
    { logFlavourText: 'count-check:' },
  );

  const downloadProcessor = new Processor(
    piles.toDownload,
    async (pile) => {
      const item = pile.shift();
      const { customId, stores } = item;

      const downloadJobs = [];
      for (const [region, storeData] of Object.entries(stores)) {
        for (const [i, url] of storeData.mediaUrls.entries()) {
          downloadJobs.push({ region, index: i, url });
        }
      }

      const buffersByRegion = {};
      for (const region of Object.keys(stores)) {
        buffersByRegion[region] = new Array(stores[region].mediaUrls.length).fill(null);
      }

      const results = await Promise.allSettled(
        downloadJobs.map(async ({ region, index, url }) => {
          const buffer = await fetchImageBuffer(url);
          buffersByRegion[region][index] = buffer;
        }),
      );

      let hasError = false;
      for (const [i, result] of results.entries()) {
        if (result.status === 'rejected') {
          const { region, url } = downloadJobs[i];
          console.error(`${ customId } ${ region }: failed to download ${ url }`, result.reason?.message);
          hasError = true;
        }
      }

      if (hasError) {
        logBad(customId);
        piles.bad.push({
          customId,
          stores: makeStoreSummary(stores),
          mismatchDetails: 'failed to download one or more images',
        });
        return { customId, error: true };
      }

      const storesWithBuffers = {};
      for (const [region, storeData] of Object.entries(stores)) {
        storesWithBuffers[region] = {
          ...storeData,
          buffers: buffersByRegion[region],
        };
      }

      piles.toClassify.push({ customId, stores: storesWithBuffers });
      return { customId, downloaded: true };
    },
    arrayExhaustedCheck,
    {
      canFinish: false,
      logFlavourText: 'download:',
      maxInFlightRequests: concurrency,
    },
  );

  const hashCompareProcessor = new Processor(
    piles.toClassify,
    async (pile) => {
      const item = pile.shift();
      const { customId, stores } = item;
      const au = 'au';
      const auBuffers = stores[au].buffers;
      const auUrls = stores[au].mediaUrls;
      const otherRegions = Object.keys(stores).filter(r => r !== au);
      const mismatches = [];

      for (let i = 0; i < auBuffers.length; i++) {
        for (const region of otherRegions) {
          const distance = await compareImageBuffers(auBuffers[i], stores[region].buffers[i]);
          if (distance > hammingThreshold) {
            mismatches.push({
              imageIndex: i,
              auUrl: auUrls[i],
              differRegion: region,
              differUrl: stores[region].mediaUrls[i],
              hammingDistance: distance,
            });
          }
        }
      }

      if (mismatches.length > 0) {
        logBad(customId);
        piles.bad.push({
          customId,
          title: stores[au].title,
          handle: stores[au].handle,
          stores: makeStoreSummary(stores),
          mismatches,
          mismatchDetails: mismatches.map(m =>
            `image ${ m.imageIndex }: au vs ${ m.differRegion } (hamming=${ m.hammingDistance })`
          ).join('; '),
        });
        return { customId, mismatch: true };
      }

      piles.good.push({ customId, title: stores[au].title, handle: stores[au].handle });
      return { customId, mismatch: false };
    },
    arrayExhaustedCheck,
    {
      canFinish: false,
      logFlavourText: 'hash-compare:',
      maxInFlightRequests: concurrency,
    },
  );

  countCheckProcessor.on('done', () => downloadProcessor.canFinish = true);
  downloadProcessor.on('done', () => hashCompareProcessor.canFinish = true);

  await Promise.all([
    countCheckProcessor.run(),
    downloadProcessor.run(),
    hashCompareProcessor.run(),
  ]);

  console.log(`audit complete: ${ piles.bad.length } mismatches, ${ piles.good.length } in sync`);

  return {
    success: true,
    result: {
      bad: piles.bad,
      good: piles.good,
    },
    meta: {
      totalBad: piles.bad.length,
      totalGood: piles.good.length,
      totalCompared: piles.bad.length + piles.good.length,
    },
  };
};

const shopifyImageAuditApi = funcApi(shopifyImageAudit, {
  argNames: ['credsPaths', 'options'],
  validatorsByArg: {
    credsPaths: Array.isArray,
  },
});

module.exports = {
  shopifyImageAudit,
  shopifyImageAuditApi,
};

// curl localhost:8000/shopifyImageAudit -H "Content-Type: application/json" -d '{ "credsPaths": ["au", "us", "uk"] }'
// curl localhost:8000/shopifyImageAudit -H "Content-Type: application/json" -d '{ "credsPaths": ["au", "us", "uk"], "options": { "limit": 10 } }'
// curl localhost:8000/shopifyImageAudit -H "Content-Type: application/json" -d '{ "credsPaths": ["au", "us"], "options": { "limit": 10, "concurrency": 10 } }'
