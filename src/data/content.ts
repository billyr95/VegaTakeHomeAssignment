export const event = {
  name: '16-Bit Con',
  tagline: 'The retro gaming convention for people who never stopped playing.',
  dates: 'October 3–5',
  year: '2026',
  venue: 'Javits Center, New York',
  registerUrl: 'https://vega.io/16-bit-con',
  booth: 'Booth 630',
};

export const sessions = [
  { id: 'keynote', time: '10:00', meridiem: 'AM', title: 'Opening Keynote: The Future of Retro', art: '/art/island-keynote.svg', w: 300, ground: 0.587 },
  { id: 'panel', time: '2:00', meridiem: 'PM', title: 'Panel: Pixel Art in the Age of AI', art: '/art/island-panel.svg', w: 300, ground: 0.537 },
  { id: 'party', time: '6:00', meridiem: 'PM', title: 'Vega After Party — Booth 630', art: '/art/island-party.svg', w: 341, ground: 0.578 },
];

export const CLOUD_PX: Record<number, number> = { 1: 495, 2: 220, 3: 171, 4: 94, 5: 206 };

export const countries = [
  'United States', 'Canada', 'United Kingdom', 'Ireland', 'Germany', 'France', 'Netherlands', 'Spain', 'Italy',
  'Sweden', 'Japan', 'South Korea', 'Australia', 'New Zealand', 'Brazil', 'Mexico', 'India', 'Singapore', 'Other',
];
