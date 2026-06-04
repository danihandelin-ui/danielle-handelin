import { Marker } from '../types';

export const GENERAL_TIPS = [
  "Lube is your friend, but too much is a enemy. A light sheen is all you need.",
  "Always check your battery before deep-diving into a leak. Low voltage causes weird solenoid behavior.",
  "Dwell settings should usually stay at factory default unless you have a specific reason to change them.",
  "If it leaks from the barrel, focus on the inner can O-rings or the bolt guide tip.",
  "Never use oil-based lubricants on paintball markers; only use 100% synthetic grease like Dow 33.",
  "If the trigger feels 'mushy' on a legacy marker, check the return spring or the 3-way alignment."
];

export const MARKERS: Marker[] = [
  // --- PLANET ECLIPSE ---
  {
    id: 'cs3',
    name: 'CS3 / CS3 Pro',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'CS Series',
    series: 'CS3',
    engine: 'OP Core',
    description: 'The latest flagship platform using the OP Core drivetrain.',
    boltImageUrl: '/Marker%20images/CS3%20Internals.png',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: [
      { description: 'Air leaking from the barrel', likelyCauses: ['Inner can O-rings worn'], solution: 'Replace inner can seals' },
      { description: 'Hissing from the frame', likelyCauses: ['Solenoid gasket failure'], solution: 'Replace solenoid gasket' },
      { description: 'Leaking from back grip', likelyCauses: ['Regulator O-ring dried out'], solution: 'Lubricate or replace regulator O-ring' }
    ]
  },
  {
    id: 'cs2',
    name: 'CS2 / CS2 Pro',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'CS Series',
    series: 'CS2',
    engine: 'GP Core',
    description: 'Flagship predecessor with the GP Core system.',
    boltImageUrl: '/Marker%20images/CS2%20internals.png',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: [
      { description: 'Air leaking from the barrel', likelyCauses: ['Inner can O-rings degraded'], solution: 'Rebuild inner can with new seals' },
      { description: 'Solenoid not firing or sticking', likelyCauses: ['Solenoid plunger stuck or seal worn'], solution: 'Clean or replace solenoid assembly' }
    ]
  },
  {
    id: 'geo5',
    name: 'Geo 5 (R5)',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'Geo Series',
    series: 'Geo 5',
    engine: 'GR Core',
    description: 'The newest evolution of the Geo line.',
    boltImageUrl: '/Marker%20images/R5%20internals.png',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: [
      { description: 'Leaking from the back grip', likelyCauses: ['LPR (Low Pressure Regulator) seal worn'], solution: 'Service or replace LPR' },
      { description: 'Weak shots or low velocity', likelyCauses: ['Air escaping internally, often at spool valve'], solution: 'Lubricate spool or replace spool O-rings' }
    ]
  },
  {
    id: 'geo4',
    name: 'Geo 4',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'Geo Series',
    series: 'Geo 4',
    engine: 'IV Core',
    description: 'Legacy style ergonomics with modern IV Core performance.',
    boltImageUrl: '/Marker%20images/GEO%204%20internals.png',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: []
  },
  {
    id: 'geo35',
    name: 'Geo 3.5',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'Geo Series',
    series: 'Geo 3',
    engine: 'IV Core',
    description: 'The iconic platform that defined the legendary Geo smooth shot.',
    boltImageUrl: '/Marker%20images/GEO%203.5%20internals.png',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: []
  },
  {
    id: 'lv2',
    name: 'LV2',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'LV Series',
    series: 'LV2',
    engine: 'Lever Valve',
    description: 'Premier hoseless poppet platform.',
    boltImageUrl: '/Marker%20images/LV2%20internals.png',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: []
  },
  {
    id: 'lv16',
    name: 'LV1.6',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'LV Series',
    series: 'LV1',
    engine: 'Lever Valve',
    description: 'The last and most refined of the tubed LV series.',
    boltImageUrl: '/Marker%20images/LV1.6%20internals.png',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: []
  },
  {
    id: 'etha3',
    name: 'Etha 3 / 3M',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'Etha Series',
    series: 'Etha 3',
    engine: 'Gamma Core',
    description: 'High performance Gamma Core in a composite body.',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: []
  },
  {
    id: 'gtek180r',
    name: 'Gtek 180R',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'Gtek Series',
    series: '180R',
    engine: 'OP-R Core',
    description: 'Mid-range performance with the OP-R Core drivetrain, mech-frame compatible.',
    boltImageUrl: '/Marker%20images/GTEK%20180r.png',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: []
  },
  {
    id: 'gtek170r',
    name: 'Gtek 170R / 170RM',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'Gtek Series',
    series: '170R',
    engine: 'Gamma Core',
    description: 'The definitive mid-range spool of its era, famous for the hoseless Gamma Core design.',
    boltImageUrl: '/Marker%20images/GTEK%20170r.png',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: []
  },
  {
    id: 'etha2',
    name: 'Etha 2',
    brand: 'Planet Eclipse',
    category: 'Modern',
    seriesGroup: 'Etha Series',
    series: 'Etha 2',
    engine: 'Gamma Core',
    description: 'The revolutionary mid-range spool that introduced the Gamma Core.',
    boltImageUrl: '/Marker%20images/etha2%20internals.png',
    manualUrl: 'https://planeteclipse.com/manuals/',
    commonSymptoms: []
  },
  // --- DYE ---
  {
    id: 'mxr',
    name: 'Dye MXR',
    brand: 'Dye',
    category: 'Modern',
    seriesGroup: 'MXR Series',
    series: 'MXR',
    engine: 'ARC Bolt',
    description: 'The newest flagship spool with refined ARC technology.',
    boltImageUrl: '/Marker%20images/Dye%20MXR%20interals.png',
    youtubeUrl: 'https://www.youtube.com/watch?v=0kF_H-K-Y-E',
    youtubeSearch: 'Dye MXR troubleshooting',
    manualUrl: 'https://shop.dyepaintball.com/pages/manuals?srsltid=AfmBOopIGgdzf1rP0ElQmu28rKrJjBs85FglaYV63GyaFQu_ADLu8Sht',
    commonSymptoms: [
      { description: 'Hissing from the bolt', likelyCauses: ['ARC bolt poppet O-ring worn'], solution: 'Replace ARC bolt poppet seal kit' },
      { description: 'Leaking from the back grip', likelyCauses: ['High pressure regulator seal degraded'], solution: 'Service HPR or replace seals' }
    ]
  },
  {
    id: 'dsr',
    name: 'DSR / DSR+',
    brand: 'Dye',
    category: 'Modern',
    seriesGroup: 'DSR Series',
    series: 'DSR',
    engine: 'ARC Bolt',
    description: 'Super smooth ARC bolt system with toolless design.',
    boltImageUrl: '/Marker%20images/Dye%20DSR%20internals.png',
    youtubeUrl: 'https://www.youtube.com/watch?v=t-L6S6J8_S0',
    youtubeSearch: 'Dye DSR troubleshoot leak',
    manualUrl: 'https://shop.dyepaintball.com/pages/manuals?srsltid=AfmBOopIGgdzf1rP0ElQmu28rKrJjBs85FglaYV63GyaFQu_ADLu8Sht',
    commonSymptoms: [
      { description: 'Air leaking at the barrel threads', likelyCauses: ['Barrel threads O-ring loose or worn'], solution: 'Tighten barrel or replace barrel O-ring' },
      { description: 'Leaking when you pull the trigger', likelyCauses: ['Manifold seal failure or poppet misalignment'], solution: 'Clean manifold or service poppet assembly' }
    ]
  },
  {
    id: 'm3plus',
    name: 'M3+',
    brand: 'Dye',
    category: 'Modern',
    seriesGroup: 'M Series',
    series: 'M3+',
    engine: 'FL-21',
    description: 'Dye flagship with the hyper-efficient FL-21 bolt system.',
    manualUrl: 'https://shop.dyepaintball.com/pages/manuals?srsltid=AfmBOopmzZVdeMBIUggvYv6RrC8_cQljkL_5WVlFEetLCwMajVOUda7A',
    commonSymptoms: []
  },
  // --- LEGACY ---
];
