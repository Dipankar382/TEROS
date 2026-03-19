// Mock Data for the full-stack system — Complete Uttarakhand dataset

export type BedData = { total: number; available: number };
export type Hospital = {
  id: string; name: string; name_hi: string; lat: number; lng: number; dist: string;
  beds: { general: BedData; icu: BedData; emergency: BedData; ventilator: BedData };
  specialties: string[]; specialties_hi: string[]; open: boolean;
};
export type Route = {
  name: string; name_hi: string; distance: string; time: string; steepness: string; steepness_hi: string;
  weatherRisk: string; weatherRisk_hi: string; recommended: boolean; score: number;
  path: number[][]; elevation: number[];
};
export type WeatherItem = {
  location: string; location_hi: string; icon: string; temp: number; condition: string; condition_hi: string;
  humidity: number; wind: number; severe: boolean; lat: number; lng: number;
};

export const hospitals: Hospital[] = [
  {
    id: 'aiims_rishikesh', name: 'AIIMS Rishikesh', name_hi: 'एम्स ऋषिकेश', lat: 30.0687, lng: 78.2950, dist: '48.2 km',
    beds: { general: { total: 120, available: 23 }, icu: { total: 30, available: 4 }, emergency: { total: 20, available: 7 }, ventilator: { total: 15, available: 2 } },
    specialties: ['Trauma', 'Cardiology', 'Neurology'], specialties_hi: ['ट्रॉमा', 'कार्डियोलॉजी', 'न्यूरोलॉजी'], open: true
  },
  {
    id: 'max_dehradun', name: 'Max Super Speciality, Dehradun', name_hi: 'मैक्स सुपर स्पेशलिटी, देहरादून', lat: 30.3165, lng: 78.0322, dist: '55.4 km',
    beds: { general: { total: 200, available: 45 }, icu: { total: 40, available: 8 }, emergency: { total: 25, available: 12 }, ventilator: { total: 20, available: 5 } },
    specialties: ['Cardiology', 'Oncology', 'Nephrology'], specialties_hi: ['कार्डियोलॉजी', 'ऑन्कोलॉजी', 'नेफ्रोलॉजी'], open: true
  },
  {
    id: 'himalayan_jolly', name: 'Himalayan Hospital, Jolly Grant', name_hi: 'हिमालयन अस्पताल, जौली ग्रांट', lat: 30.1870, lng: 78.1750, dist: '38.1 km',
    beds: { general: { total: 150, available: 31 }, icu: { total: 25, available: 3 }, emergency: { total: 15, available: 5 }, ventilator: { total: 10, available: 0 } },
    specialties: ['Orthopedics', 'Surgery', 'Pediatrics'], specialties_hi: ['ऑर्थोपेडिक्स', 'सर्जरी', 'पीडियाट्रिक्स'], open: true
  },
  {
    id: 'district_tehri', name: 'District Hospital, New Tehri', name_hi: 'जिला अस्पताल, नई टिहरी', lat: 30.3860, lng: 78.4320, dist: '1.2 km',
    beds: { general: { total: 100, available: 20 }, icu: { total: 10, available: 2 }, emergency: { total: 12, available: 4 }, ventilator: { total: 5, available: 1 } },
    specialties: ['General Medicine', 'Maternity'], specialties_hi: ['सामान्य चिकित्सा', 'प्रसूति'], open: true
  },
  {
    id: 'thdc_hospital', name: 'THDC Hospital, Bhagirathipuram', name_hi: 'टीएचडीसी अस्पताल, भागीरथीपुरम', lat: 30.3715, lng: 78.4305, dist: '0.5 km',
    beds: { general: { total: 50, available: 12 }, icu: { total: 4, available: 1 }, emergency: { total: 6, available: 2 }, ventilator: { total: 2, available: 1 } },
    specialties: ['Emergency Care', 'First Aid'], specialties_hi: ['आपातकालीन देखभाल', 'प्राथमिक चिकित्सा'], open: true
  },
  {
    id: 'metro_haridwar', name: 'Metro Hospital, Haridwar', name_hi: 'मेट्रो अस्पताल, हरिद्वार', lat: 29.9412, lng: 78.1132, dist: '65.5 km',
    beds: { general: { total: 150, available: 22 }, icu: { total: 20, available: 5 }, emergency: { total: 15, available: 2 }, ventilator: { total: 12, available: 4 } },
    specialties: ['Cardiac', 'Dialysis'], specialties_hi: ['कार्डियक', 'डायलिसिस'], open: true
  },
  {
    id: 'masiha_chamba', name: 'Masiha Hospital, Chamba', name_hi: 'मसीहा अस्पताल, चंबा', lat: 30.3475, lng: 78.3880, dist: '8.2 km',
    beds: { general: { total: 40, available: 5 }, icu: { total: 2, available: 0 }, emergency: { total: 4, available: 1 }, ventilator: { total: 1, available: 0 } },
    specialties: ['Trauma', 'General'], specialties_hi: ['ट्रॉमा', 'सामान्य'], open: true
  },
  {
    id: 'base_srinagar', name: 'Base Hospital, Srinagar', name_hi: 'बेस अस्पताल, श्रीनगर', lat: 30.2224, lng: 78.7844, dist: '105 km',
    beds: { general: { total: 250, available: 60 }, icu: { total: 40, available: 12 }, emergency: { total: 30, available: 15 }, ventilator: { total: 20, available: 8 } },
    specialties: ['Trauma', 'Burn Center', 'Cardiology'], specialties_hi: ['ट्रॉमा', 'बर्न सेंटर', 'कार्डियोलॉजी'], open: true
  },
  {
    id: 'district_pauri', name: 'District Hospital, Pauri', name_hi: 'जिला अस्पताल, पौड़ी', lat: 30.1500, lng: 78.7800, dist: '115 km',
    beds: { general: { total: 100, available: 18 }, icu: { total: 12, available: 2 }, emergency: { total: 10, available: 4 }, ventilator: { total: 6, available: 1 } },
    specialties: ['General Medicine', 'Surgery'], specialties_hi: ['सामान्य चिकित्सा', 'सर्जरी'], open: true
  },
  {
    id: 'kedarnath_base', name: 'GMVN Multi-Care, Kedarnath Base', name_hi: 'जीएमवीएन मल्टी-केयर, केदारनाथ बेस', lat: 30.7350, lng: 79.0669, dist: '180 km',
    beds: { general: { total: 20, available: 5 }, icu: { total: 5, available: 2 }, emergency: { total: 8, available: 3 }, ventilator: { total: 4, available: 2 } },
    specialties: ['Altitude Sickness', 'Trauma'], specialties_hi: ['ऊंचाई की बीमारी', 'ट्रॉमा'], open: true
  },
  {
    id: 'chc_agastyamuni', name: 'CHC Agastyamuni', name_hi: 'सीएचसी अगस्त्यमुनि', lat: 30.3950, lng: 78.9850, dist: '145 km',
    beds: { general: { total: 30, available: 4 }, icu: { total: 0, available: 0 }, emergency: { total: 6, available: 2 }, ventilator: { total: 0, available: 0 } },
    specialties: ['Primary Care'], specialties_hi: ['प्राथमिक चिकित्सा'], open: true
  },
  {
    id: 'govt_gopeshwar', name: 'Govt. Hospital, Gopeshwar', name_hi: 'सरकारी अस्पताल, गोपेश्वर', lat: 30.4130, lng: 79.3250, dist: '190 km',
    beds: { general: { total: 80, available: 22 }, icu: { total: 8, available: 3 }, emergency: { total: 10, available: 5 }, ventilator: { total: 4, available: 1 } },
    specialties: ['Emergency Care', 'Orthopedics'], specialties_hi: ['आपातकालीन देखभाल', 'ऑर्थोपेडिक्स'], open: true
  }
];

export const routes: Record<string, Route[]> = {
  aiims_rishikesh: [
    {
      name: 'NH-58 via Laxman Jhula Road', name_hi: 'NH-58 लक्ष्मण झूला रोड के माध्यम से',
      distance: '12.4 km', time: '18 min', steepness: 'Low', steepness_hi: 'कम',
      weatherRisk: 'Low', weatherRisk_hi: 'कम', recommended: true, score: 92,
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
      name: 'Badrinath Road (NH-7)', name_hi: 'बद्रीनाथ रोड (NH-7)',
      distance: '15.8 km', time: '24 min', steepness: 'Medium', steepness_hi: 'मध्यम',
      weatherRisk: 'Medium', weatherRisk_hi: 'मध्यम', recommended: false, score: 76,
      path: [
        [30.0869, 78.2676],[30.0885, 78.2695],[30.0900, 78.2720],[30.0912, 78.2748],
        [30.0905, 78.2775],[30.0890, 78.2800],[30.0872, 78.2825],[30.0855, 78.2845],
        [30.0838, 78.2862],[30.0820, 78.2878],[30.0800, 78.2890],[30.0782, 78.2900],
        [30.0765, 78.2910],[30.0748, 78.2918],[30.0732, 78.2925],[30.0718, 78.2932],
        [30.0705, 78.2938],[30.0695, 78.2943],[30.0690, 78.2947],[30.0687, 78.2950]
      ],
      elevation: [372, 380, 395, 410, 405, 395, 382, 370, 360, 352, 345, 340, 335, 330, 326, 322, 320, 318, 316, 315]
    }
  ],
  max_dehradun: [
    {
      name: 'NH-58 via Haridwar–Dehradun', name_hi: 'NH-58 हरिद्वार-देहरादून के माध्यम से',
      distance: '43.2 km', time: '58 min', steepness: 'Medium', steepness_hi: 'मध्यम',
      weatherRisk: 'Low', weatherRisk_hi: 'कम', recommended: true, score: 85,
      path: [
        [30.0869, 78.2676],[30.0920, 78.2600],[30.1050, 78.2450],[30.1200, 78.2300],
        [30.1400, 78.2150],[30.1600, 78.2000],[30.1800, 78.1850],[30.2000, 78.1700],
        [30.2200, 78.1550],[30.2400, 78.1400],[30.2600, 78.1200],[30.2800, 78.1000],
        [30.2950, 78.0700],[30.3050, 78.0500],[30.3165, 78.0322]
      ],
      elevation: [372, 365, 355, 348, 340, 335, 342, 355, 370, 390, 410, 430, 450, 460, 455]
    }
  ],
  himalayan_jolly: [
    {
      name: 'NH-58 Direct to Jolly Grant', name_hi: 'NH-58 सीधे जौली ग्रांट तक',
      distance: '28.7 km', time: '38 min', steepness: 'Medium', steepness_hi: 'मध्यम',
      weatherRisk: 'Low', weatherRisk_hi: 'कम', recommended: true, score: 88,
      path: [
        [30.0869, 78.2676],[30.0950, 78.2580],[30.1080, 78.2470],[30.1200, 78.2350],
        [30.1350, 78.2230],[30.1500, 78.2120],[30.1650, 78.2020],[30.1800, 78.1940],
        [30.1950, 78.1880],[30.2100, 78.1830],[30.2250, 78.1800],[30.2400, 78.1790],
        [30.2550, 78.1780],[30.2636, 78.1775]
      ],
      elevation: [372, 365, 358, 352, 348, 345, 350, 358, 365, 375, 388, 395, 400, 405]
    }
  ]
};

export const weatherData: WeatherItem[] = [
  { location: 'Rishikesh', location_hi: 'ऋषिकेश', icon: '🌤️', temp: 18, condition: 'Partly Cloudy', condition_hi: 'आंशिक रूप से बादल छाए हुए', humidity: 65, wind: 12, severe: false, lat: 30.0869, lng: 78.2676 },
  { location: 'Devprayag', location_hi: 'देवप्रयाग', icon: '🌧️', temp: 12, condition: 'Rain', condition_hi: 'बारिश', humidity: 85, wind: 28, severe: true, lat: 30.1450, lng: 78.5980 },
  { location: 'Haridwar', location_hi: 'हरिद्वार', icon: '☀️', temp: 22, condition: 'Clear', condition_hi: 'साफ', humidity: 45, wind: 8, severe: false, lat: 29.9457, lng: 78.1642 },
  { location: 'Dehradun', location_hi: 'देहरादून', icon: '⛅', temp: 16, condition: 'Cloudy', condition_hi: 'बादल छाए हुए', humidity: 70, wind: 15, severe: false, lat: 30.3165, lng: 78.0322 },
  { location: 'Mussoorie', location_hi: 'मसूरी', icon: '🌫️', temp: 6, condition: 'Dense Fog', condition_hi: 'घना कोहरा', humidity: 95, wind: 35, severe: true, lat: 30.4599, lng: 78.0664 },
  { location: 'Tehri', location_hi: 'टिहरी', icon: '🌧️', temp: 8, condition: 'Heavy Rain', condition_hi: 'भारी बारिश', humidity: 92, wind: 32, severe: true, lat: 30.3860, lng: 78.4320 },
  { location: 'Srinagar UK', location_hi: 'श्रीनगर यूके', icon: '⛅', temp: 14, condition: 'Overcast', condition_hi: 'बादल छाए हुए', humidity: 72, wind: 18, severe: false, lat: 30.2224, lng: 78.7844 },
];
