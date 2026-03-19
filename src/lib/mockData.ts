// Mock Data for the full-stack system — Complete Uttarakhand dataset

export type BedData = { total: number; available: number };
export type Hospital = {
  id: string; name: string; lat: number; lng: number; dist: string;
  beds: { general: BedData; icu: BedData; emergency: BedData; ventilator: BedData };
  specialties: string[]; open: boolean;
};
export type Route = {
  name: string; distance: string; time: string; steepness: string;
  weatherRisk: string; recommended: boolean; score: number;
  path: number[][]; elevation: number[];
};
export type WeatherItem = {
  location: string; icon: string; temp: number; condition: string;
  humidity: number; wind: number; severe: boolean;
};

export const hospitals: Hospital[] = [
  {
    id: 'aiims_rishikesh', name: 'AIIMS Rishikesh', lat: 30.0687, lng: 78.2950, dist: '48.2 km',
    beds: { general: { total: 120, available: 23 }, icu: { total: 30, available: 4 }, emergency: { total: 20, available: 7 }, ventilator: { total: 15, available: 2 } },
    specialties: ['Trauma', 'Cardiology', 'Neurology'], open: true
  },
  {
    id: 'max_dehradun', name: 'Max Super Speciality, Dehradun', lat: 30.3165, lng: 78.0322, dist: '55.4 km',
    beds: { general: { total: 200, available: 45 }, icu: { total: 40, available: 8 }, emergency: { total: 25, available: 12 }, ventilator: { total: 20, available: 5 } },
    specialties: ['Cardiology', 'Oncology', 'Nephrology'], open: true
  },
  {
    id: 'himalayan_jolly', name: 'Himalayan Hospital, Jolly Grant', lat: 30.1870, lng: 78.1750, dist: '38.1 km',
    beds: { general: { total: 150, available: 31 }, icu: { total: 25, available: 3 }, emergency: { total: 15, available: 5 }, ventilator: { total: 10, available: 0 } },
    specialties: ['Orthopedics', 'Surgery', 'Pediatrics'], open: true
  },
  {
    id: 'district_tehri', name: 'District Hospital, New Tehri', lat: 30.3860, lng: 78.4320, dist: '1.2 km',
    beds: { general: { total: 100, available: 20 }, icu: { total: 10, available: 2 }, emergency: { total: 12, available: 4 }, ventilator: { total: 5, available: 1 } },
    specialties: ['General Medicine', 'Maternity'], open: true
  },
  {
    id: 'thdc_hospital', name: 'THDC Hospital, Bhagirathipuram', lat: 30.3715, lng: 78.4305, dist: '0.5 km',
    beds: { general: { total: 50, available: 12 }, icu: { total: 4, available: 1 }, emergency: { total: 6, available: 2 }, ventilator: { total: 2, available: 1 } },
    specialties: ['Emergency Care', 'First Aid'], open: true
  },
  {
    id: 'metro_haridwar', name: 'Metro Hospital, Haridwar', lat: 29.9412, lng: 78.1132, dist: '65.5 km',
    beds: { general: { total: 150, available: 22 }, icu: { total: 20, available: 5 }, emergency: { total: 15, available: 2 }, ventilator: { total: 12, available: 4 } },
    specialties: ['Cardiac', 'Dialysis'], open: true
  },
  {
    id: 'masiha_chamba', name: 'Masiha Hospital, Chamba', lat: 30.3475, lng: 78.3880, dist: '8.2 km',
    beds: { general: { total: 40, available: 5 }, icu: { total: 2, available: 0 }, emergency: { total: 4, available: 1 }, ventilator: { total: 1, available: 0 } },
    specialties: ['Trauma', 'General'], open: true
  }
];

export const routes: Record<string, Route[]> = {
  aiims_rishikesh: [
    {
      name: 'NH-58 via Laxman Jhula Road',
      distance: '12.4 km', time: '18 min', steepness: 'Low',
      weatherRisk: 'Low', recommended: true, score: 92,
      path: [
        [30.0869, 78.2676],[30.0855, 78.2698],[30.0841, 78.2725],[30.0830, 78.2751],
        [30.0818, 78.2770],[30.0802, 78.2789],[30.0790, 78.2805],[30.0778, 78.2823],
        [30.0769, 78.2841],[30.0757, 78.2856],[30.0748, 78.2870],[30.0740, 78.2883],
        [30.0732, 78.2897],[30.0724, 78.2910],[30.0716, 78.2918],[30.0709, 78.2925],
        [30.0701, 78.2932],[30.0695, 78.2940],[30.0690, 78.2948],[30.0687, 78.2950]
      ],
      elevation: [372, 365, 358, 350, 345, 341, 338, 335, 332, 330, 328, 326, 324, 322, 320, 319, 318, 317, 316, 315]
    },
    {
      name: 'Badrinath Road (NH-7)',
      distance: '15.8 km', time: '24 min', steepness: 'Medium',
      weatherRisk: 'Medium', recommended: false, score: 76,
      path: [
        [30.0869, 78.2676],[30.0885, 78.2695],[30.0900, 78.2720],[30.0912, 78.2748],
        [30.0905, 78.2775],[30.0890, 78.2800],[30.0872, 78.2825],[30.0855, 78.2845],
        [30.0838, 78.2862],[30.0820, 78.2878],[30.0800, 78.2890],[30.0782, 78.2900],
        [30.0765, 78.2910],[30.0748, 78.2918],[30.0732, 78.2925],[30.0718, 78.2932],
        [30.0705, 78.2938],[30.0695, 78.2943],[30.0690, 78.2947],[30.0687, 78.2950]
      ],
      elevation: [372, 380, 395, 410, 405, 395, 382, 370, 360, 352, 345, 340, 335, 330, 326, 322, 320, 318, 316, 315]
    },
    {
      name: 'Haridwar Bypass Road',
      distance: '19.2 km', time: '32 min', steepness: 'Low',
      weatherRisk: 'High', recommended: false, score: 58,
      path: [
        [30.0869, 78.2676],[30.0850, 78.2650],[30.0835, 78.2620],[30.0820, 78.2595],
        [30.0810, 78.2570],[30.0798, 78.2580],[30.0785, 78.2605],[30.0770, 78.2640],
        [30.0755, 78.2672],[30.0742, 78.2700],[30.0730, 78.2728],[30.0720, 78.2755],
        [30.0712, 78.2780],[30.0705, 78.2810],[30.0700, 78.2840],[30.0697, 78.2865],
        [30.0694, 78.2888],[30.0692, 78.2910],[30.0690, 78.2932],[30.0687, 78.2950]
      ],
      elevation: [372, 360, 348, 335, 325, 320, 318, 320, 325, 328, 330, 328, 325, 322, 320, 318, 317, 316, 315, 315]
    }
  ],
  max_dehradun: [
    {
      name: 'NH-58 via Haridwar–Dehradun',
      distance: '43.2 km', time: '58 min', steepness: 'Medium',
      weatherRisk: 'Low', recommended: true, score: 85,
      path: [
        [30.0869, 78.2676],[30.0920, 78.2600],[30.1050, 78.2450],[30.1200, 78.2300],
        [30.1400, 78.2150],[30.1600, 78.2000],[30.1800, 78.1850],[30.2000, 78.1700],
        [30.2200, 78.1550],[30.2400, 78.1400],[30.2600, 78.1200],[30.2800, 78.1000],
        [30.2950, 78.0700],[30.3050, 78.0500],[30.3165, 78.0322]
      ],
      elevation: [372, 365, 355, 348, 340, 335, 342, 355, 370, 390, 410, 430, 450, 460, 455]
    },
    {
      name: 'Rishikesh–Doiwala–Dehradun',
      distance: '48.5 km', time: '65 min', steepness: 'Low',
      weatherRisk: 'Medium', recommended: false, score: 72,
      path: [
        [30.0869, 78.2676],[30.0950, 78.2550],[30.1100, 78.2400],[30.1300, 78.2250],
        [30.1500, 78.2100],[30.1700, 78.1950],[30.1900, 78.1800],[30.2050, 78.1650],
        [30.2200, 78.1500],[30.2350, 78.1300],[30.2500, 78.1100],[30.2700, 78.0900],
        [30.2900, 78.0650],[30.3050, 78.0450],[30.3165, 78.0322]
      ],
      elevation: [372, 360, 350, 342, 338, 335, 340, 348, 358, 370, 385, 400, 420, 445, 455]
    }
  ],
  himalayan_jolly: [
    {
      name: 'NH-58 Direct to Jolly Grant',
      distance: '28.7 km', time: '38 min', steepness: 'Medium',
      weatherRisk: 'Low', recommended: true, score: 88,
      path: [
        [30.0869, 78.2676],[30.0950, 78.2580],[30.1080, 78.2470],[30.1200, 78.2350],
        [30.1350, 78.2230],[30.1500, 78.2120],[30.1650, 78.2020],[30.1800, 78.1940],
        [30.1950, 78.1880],[30.2100, 78.1830],[30.2250, 78.1800],[30.2400, 78.1790],
        [30.2550, 78.1780],[30.2636, 78.1775]
      ],
      elevation: [372, 365, 358, 352, 348, 345, 350, 358, 365, 375, 388, 395, 400, 405]
    }
  ],
  doon_hospital: [
    {
      name: 'NH-58 via Haridwar Road',
      distance: '47.1 km', time: '62 min', steepness: 'Medium',
      weatherRisk: 'Low', recommended: true, score: 80,
      path: [
        [30.0869, 78.2676],[30.0930, 78.2590],[30.1060, 78.2460],[30.1200, 78.2320],
        [30.1400, 78.2170],[30.1600, 78.2010],[30.1800, 78.1860],[30.2000, 78.1710],
        [30.2200, 78.1560],[30.2400, 78.1380],[30.2600, 78.1180],[30.2800, 78.0960],
        [30.3000, 78.0700],[30.3120, 78.0520],[30.3256, 78.0402]
      ],
      elevation: [372, 365, 356, 348, 342, 338, 345, 355, 368, 385, 405, 425, 445, 455, 460]
    }
  ]
};

export const weatherData: WeatherItem[] = [
  { location: 'Rishikesh', icon: '🌤️', temp: 18, condition: 'Partly Cloudy', humidity: 65, wind: 12, severe: false },
  { location: 'Devprayag', icon: '🌧️', temp: 12, condition: 'Rain', humidity: 85, wind: 28, severe: true },
  { location: 'Haridwar', icon: '☀️', temp: 22, condition: 'Clear', humidity: 45, wind: 8, severe: false },
  { location: 'Dehradun', icon: '⛅', temp: 16, condition: 'Cloudy', humidity: 70, wind: 15, severe: false },
  { location: 'Mussoorie', icon: '🌫️', temp: 6, condition: 'Dense Fog', humidity: 95, wind: 35, severe: true },
  { location: 'Tehri', icon: '🌧️', temp: 8, condition: 'Heavy Rain', humidity: 92, wind: 32, severe: true },
  { location: 'Srinagar UK', icon: '⛅', temp: 14, condition: 'Overcast', humidity: 72, wind: 18, severe: false },
];
