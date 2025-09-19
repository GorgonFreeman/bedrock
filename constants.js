module.exports = {
  HOSTED: !!process.env.HOSTED,
  REGIONS_ALL: [
    'au', 
    'us',
    'uk',
    'baddest',
  ],
  REGIONS_WF: [
    'au', 
    'us',
    'uk',
  ],
  REGIONS_PVX: [
    'au',
    'baddest',
  ],
  REGIONS_STARSHIPIT: [
    'au',
    'baddest',
  ],
  REGIONS_PIPE17: ['us'],
  REGIONS_LOGIWA: ['us'],
  // REGIONS_BLUEYONDER: ['uk'], // We don't have direct access to Blue Yonder, use Bleckmann API instead
  REGIONS_BLECKMANN: ['uk'],
  STARSHIPIT_ACCOUNT_HANDLES: [
    'wf',
    'melb',
    'bris',
    'baddest',
  ],
};