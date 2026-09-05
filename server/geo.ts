export interface CityInfo {
  iata: string;
  lat: number;
  lng: number;
  country: string;
  name?: string;
}

export const CITIES: Record<string, CityInfo> = {
  "london": { iata: "LON", lat: 51.5074, lng: -0.1278, country: "GB" },
  "paris": { iata: "PAR", lat: 48.8566, lng: 2.3522, country: "FR" },
  "new york": { iata: "NYC", lat: 40.7128, lng: -74.0060, country: "US" },
  "tokyo": { iata: "TYO", lat: 35.6762, lng: 139.6503, country: "JP" },
  "barcelona": { iata: "BCN", lat: 41.3874, lng: 2.1686, country: "ES" },
  "madrid": { iata: "MAD", lat: 40.4168, lng: -3.7038, country: "ES" },
  "rome": { iata: "ROM", lat: 41.9028, lng: 12.4964, country: "IT" },
  "berlin": { iata: "BER", lat: 52.5200, lng: 13.4050, country: "DE" },
  "amsterdam": { iata: "AMS", lat: 52.3676, lng: 4.9041, country: "NL" },
  "dubai": { iata: "DXB", lat: 25.2048, lng: 55.2708, country: "AE" },
  "singapore": { iata: "SIN", lat: 1.3521, lng: 103.8198, country: "SG" },
  "bangkok": { iata: "BKK", lat: 13.7563, lng: 100.5018, country: "TH" },
  "sydney": { iata: "SYD", lat: -33.8688, lng: 151.2093, country: "AU" },
  "melbourne": { iata: "MEL", lat: -37.8136, lng: 144.9631, country: "AU" },
  "mumbai": { iata: "BOM", lat: 19.0760, lng: 72.8777, country: "IN" },
  "delhi": { iata: "DEL", lat: 28.7041, lng: 77.1025, country: "IN" },
  "bengaluru": { iata: "BLR", lat: 12.9716, lng: 77.5946, country: "IN" },
  "bangalore": { iata: "BLR", lat: 12.9716, lng: 77.5946, country: "IN" },
  "istanbul": { iata: "IST", lat: 41.0082, lng: 28.9784, country: "TR" },
  "los angeles": { iata: "LAX", lat: 34.0522, lng: -118.2437, country: "US" },
  "san francisco": { iata: "SFO", lat: 37.7749, lng: -122.4194, country: "US" },
  "chicago": { iata: "CHI", lat: 41.8781, lng: -87.6298, country: "US" },
  "miami": { iata: "MIA", lat: 25.7617, lng: -80.1918, country: "US" },
  "toronto": { iata: "YTO", lat: 43.6532, lng: -79.3832, country: "CA" },
  "vancouver": { iata: "YVR", lat: 49.2827, lng: -123.1207, country: "CA" },
  "mexico city": { iata: "MEX", lat: 19.4326, lng: -99.1332, country: "MX" },
  "sao paulo": { iata: "SAO", lat: -23.5505, lng: -46.6333, country: "BR" },
  "rio de janeiro": { iata: "RIO", lat: -22.9068, lng: -43.1729, country: "BR" },
  "cairo": { iata: "CAI", lat: 30.0444, lng: 31.2357, country: "EG" },
  "cape town": { iata: "CPT", lat: -33.9249, lng: 18.4241, country: "ZA" },
  "nairobi": { iata: "NBO", lat: -1.2921, lng: 36.8219, country: "KE" },
  "hong kong": { iata: "HKG", lat: 22.3193, lng: 114.1694, country: "HK" },
  "seoul": { iata: "SEL", lat: 37.5665, lng: 126.9780, country: "KR" },
  "beijing": { iata: "BJS", lat: 39.9042, lng: 116.4074, country: "CN" },
  "shanghai": { iata: "SHA", lat: 31.2304, lng: 121.4737, country: "CN" },
  "vienna": { iata: "VIE", lat: 48.2082, lng: 16.3738, country: "AT" },
  "prague": { iata: "PRG", lat: 50.0755, lng: 14.4378, country: "CZ" },
  "lisbon": { iata: "LIS", lat: 38.7223, lng: -9.1393, country: "PT" },
  "athens": { iata: "ATH", lat: 37.9838, lng: 23.7275, country: "GR" },
  "dublin": { iata: "DUB", lat: 53.3498, lng: -6.2603, country: "IE" },
  "zurich": { iata: "ZRH", lat: 47.3769, lng: 8.5417, country: "CH" },
  "milan": { iata: "MIL", lat: 45.4642, lng: 9.1900, country: "IT" },
  "venice": { iata: "VCE", lat: 45.4408, lng: 12.3155, country: "IT" },
  "florence": { iata: "FLR", lat: 43.7696, lng: 11.2558, country: "IT" },
  "edinburgh": { iata: "EDI", lat: 55.9533, lng: -3.1883, country: "GB" },
  "manchester": { iata: "MAN", lat: 53.4808, lng: -2.2426, country: "GB" },
  "brussels": { iata: "BRU", lat: 50.8503, lng: 4.3517, country: "BE" },
  "warsaw": { iata: "WAW", lat: 52.2297, lng: 21.0122, country: "PL" },
  "budapest": { iata: "BUD", lat: 47.4979, lng: 19.0402, country: "HU" },
  "stockholm": { iata: "STO", lat: 59.3293, lng: 18.0686, country: "SE" },
  "oslo": { iata: "OSL", lat: 59.9139, lng: 10.7522, country: "NO" },
  "helsinki": { iata: "HEL", lat: 60.1699, lng: 24.9384, country: "FI" },
  "reykjavik": { iata: "REK", lat: 64.1466, lng: -21.9426, country: "IS" },
  "bali": { iata: "DPS", lat: -8.4095, lng: 115.1889, country: "ID" },
  "phuket": { iata: "HKT", lat: 7.8804, lng: 98.3923, country: "TH" },
  "kuala lumpur": { iata: "KUL", lat: 3.1390, lng: 101.6869, country: "MY" },
  "ho chi minh": { iata: "SGN", lat: 10.8231, lng: 106.6297, country: "VN" },
  "hanoi": { iata: "HAN", lat: 21.0278, lng: 105.8342, country: "VN" },
  "taipei": { iata: "TPE", lat: 25.0330, lng: 121.5654, country: "TW" },
  "osaka": { iata: "OSA", lat: 34.6937, lng: 135.5023, country: "JP" },
  "kyoto": { iata: "UKY", lat: 35.0116, lng: 135.7681, country: "JP" },
  "marrakech": { iata: "RAK", lat: 31.6295, lng: -7.9811, country: "MA" },
  "casablanca": { iata: "CMN", lat: 33.5731, lng: -7.5898, country: "MA" },
  "doha": { iata: "DOH", lat: 25.2854, lng: 51.5310, country: "QA" },
  "abu dhabi": { iata: "AUH", lat: 24.4539, lng: 54.3773, country: "AE" },
  "jakarta": { iata: "JKT", lat: -6.2088, lng: 106.8456, country: "ID" },
  "manila": { iata: "MNL", lat: 14.5995, lng: 120.9842, country: "PH" },
  "auckland": { iata: "AKL", lat: -36.8509, lng: 174.7645, country: "NZ" },
  "wellington": { iata: "WLG", lat: -41.2866, lng: 174.7756, country: "NZ" },
  "buenos aires": { iata: "BUE", lat: -34.6037, lng: -58.3816, country: "AR" },
  "santiago": { iata: "SCL", lat: -33.4489, lng: -70.6693, country: "CL" },
  "lima": { iata: "LIM", lat: -12.0464, lng: -77.0428, country: "PE" },
  "bogota": { iata: "BOG", lat: 4.7110, lng: -74.0721, country: "CO" },
  "quito": { iata: "UIO", lat: -0.1807, lng: -78.4678, country: "EC" },
  "havana": { iata: "HAV", lat: 23.1136, lng: -82.3666, country: "CU" },
  "san juan": { iata: "SJU", lat: 18.4655, lng: -66.1057, country: "PR" },
  "las vegas": { iata: "LAS", lat: 36.1699, lng: -115.1398, country: "US" },
  "seattle": { iata: "SEA", lat: 47.6062, lng: -122.3321, country: "US" },
  "boston": { iata: "BOS", lat: 42.3601, lng: -71.0589, country: "US" },
  "washington": { iata: "WAS", lat: 38.9072, lng: -77.0369, country: "US" },
  "atlanta": { iata: "ATL", lat: 33.7490, lng: -84.3880, country: "US" },
  "denver": { iata: "DEN", lat: 39.7392, lng: -104.9903, country: "US" },
  "austin": { iata: "AUS", lat: 30.2672, lng: -97.7431, country: "US" },
  "nashville": { iata: "BNA", lat: 36.1627, lng: -86.7816, country: "US" },
  "new orleans": { iata: "MSY", lat: 29.9511, lng: -90.0715, country: "US" },
  "orlando": { iata: "ORL", lat: 28.5383, lng: -81.3792, country: "US" },
  "montreal": { iata: "YMQ", lat: 45.5017, lng: -73.5673, country: "CA" },
  "calgary": { iata: "YYC", lat: 51.0447, lng: -114.0719, country: "CA" },
};

export const IATA_COORDS: Record<string, { lat: number; lng: number }> = {
  "LHR": { lat: 51.4700, lng: -0.4543 },
  "LGW": { lat: 51.1537, lng: -0.1821 },
  "CDG": { lat: 49.0097, lng: 2.5479 },
  "ORY": { lat: 48.7262, lng: 2.3652 },
  "JFK": { lat: 40.6413, lng: -73.7781 },
  "EWR": { lat: 40.6895, lng: -74.1745 },
  "LAX": { lat: 33.9416, lng: -118.4085 },
  "SFO": { lat: 37.6213, lng: -122.3790 },
  "ORD": { lat: 41.9742, lng: -87.9073 },
  "MIA": { lat: 25.7959, lng: -80.2870 },
  "DXB": { lat: 25.2532, lng: 55.3657 },
  "SIN": { lat: 1.3644, lng: 103.9915 },
  "BKK": { lat: 13.6900, lng: 100.7501 },
  "SYD": { lat: -33.9399, lng: 151.1753 },
  "MEL": { lat: -37.6690, lng: 144.8410 },
  "BOM": { lat: 19.0896, lng: 72.8656 },
  "DEL": { lat: 28.5562, lng: 77.1000 },
  "BLR": { lat: 13.1986, lng: 77.7066 },
  "IST": { lat: 41.2753, lng: 28.7519 },
  "YVR": { lat: 49.1967, lng: -123.1815 },
  "YYZ": { lat: 43.6777, lng: -79.6248 },
  "MEX": { lat: 19.4361, lng: -99.0719 },
  "GRU": { lat: -23.4356, lng: -46.4731 },
  "CAI": { lat: 30.1219, lng: 31.4056 },
  "CPT": { lat: -33.9715, lng: 18.6021 },
  "NBO": { lat: -1.3192, lng: 36.9278 },
  "HKG": { lat: 22.3080, lng: 113.9185 },
  "ICN": { lat: 37.4602, lng: 126.4407 },
  "PEK": { lat: 40.0799, lng: 116.6031 },
  "PVG": { lat: 31.1443, lng: 121.8083 },
  "VIE": { lat: 48.1103, lng: 16.5697 },
  "PRG": { lat: 50.1008, lng: 14.2600 },
  "LIS": { lat: 38.7742, lng: -9.1342 },
  "ATH": { lat: 37.9364, lng: 23.9445 },
  "DUB": { lat: 53.4264, lng: -6.2499 },
  "ZRH": { lat: 47.4647, lng: 8.5492 },
  "MXP": { lat: 45.6306, lng: 8.7281 },
  "VCE": { lat: 45.5053, lng: 12.3519 },
  "FLR": { lat: 43.8100, lng: 11.2051 },
  "EDI": { lat: 55.9500, lng: -3.3725 },
  "MAN": { lat: 53.3537, lng: -2.2750 },
  "BRU": { lat: 50.9014, lng: 4.4844 },
  "WAW": { lat: 52.1657, lng: 20.9671 },
  "BUD": { lat: 47.4369, lng: 19.2556 },
  "ARN": { lat: 59.6498, lng: 17.9238 },
  "OSL": { lat: 60.1976, lng: 11.1004 },
  "HEL": { lat: 60.3172, lng: 24.9633 },
  "KEF": { lat: 63.9850, lng: -22.6056 },
  "DPS": { lat: -8.7482, lng: 115.1671 },
  "HKT": { lat: 8.1132, lng: 98.3169 },
  "KUL": { lat: 2.7456, lng: 101.7099 },
  "SGN": { lat: 10.8188, lng: 106.6520 },
  "HAN": { lat: 21.2212, lng: 105.8072 },
  "TPE": { lat: 25.0777, lng: 121.2328 },
  "KIX": { lat: 34.4347, lng: 135.2441 },
  "RAK": { lat: 31.6069, lng: -8.0363 },
  "CMN": { lat: 33.3675, lng: -7.5898 },
  "DOH": { lat: 25.2731, lng: 51.6081 },
  "AUH": { lat: 24.4330, lng: 54.6511 },
  "CGK": { lat: -6.1256, lng: 106.6559 },
  "MNL": { lat: 14.5086, lng: 121.0198 },
  "AKL": { lat: -37.0082, lng: 174.7850 },
  "WLG": { lat: -41.3272, lng: 174.8053 },
  "EZE": { lat: -34.8222, lng: -58.5358 },
  "SCL": { lat: -33.3930, lng: -70.7858 },
  "LIM": { lat: -12.0219, lng: -77.1143 },
  "BOG": { lat: 4.7016, lng: -74.1469 },
  "UIO": { lat: -0.1292, lng: -78.3575 },
  "HAV": { lat: 22.9892, lng: -82.4091 },
  "SJU": { lat: 18.4394, lng: -66.0018 },
  "LAS": { lat: 36.0840, lng: -115.1537 },
  "SEA": { lat: 47.4502, lng: -122.3088 },
  "BOS": { lat: 42.3656, lng: -71.0096 },
  "IAD": { lat: 38.9531, lng: -77.4565 },
  "ATL": { lat: 33.6407, lng: -84.4277 },
  "DEN": { lat: 39.8561, lng: -104.6737 },
  "AUS": { lat: 30.1975, lng: -97.6664 },
  "BNA": { lat: 36.1263, lng: -86.6774 },
  "MSY": { lat: 29.9934, lng: -90.2580 },
  "MCO": { lat: 28.4312, lng: -81.3081 },
  "YUL": { lat: 45.4706, lng: -73.7408 },
  "YYC": { lat: 51.1215, lng: -114.0078 },
  "BER": { lat: 52.3667, lng: 13.5033 },
  "AMS": { lat: 52.3105, lng: 4.7683 },
  "FCO": { lat: 41.8003, lng: 12.2389 },
  "BCN": { lat: 41.2974, lng: 2.0833 },
  "MAD": { lat: 40.4983, lng: -3.5676 },
  "NRT": { lat: 35.7720, lng: 140.3929 },
  "HND": { lat: 35.5494, lng: 139.7798 },
};

export function resolveCity(name: string): CityInfo | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (CITIES[key]) {
    const info = CITIES[key];
    return {
      iata: info.iata,
      lat: info.lat,
      lng: info.lng,
      name: name.trim().replace(/\b\w/g, c => c.toUpperCase()),
      country: info.country,
    };
  }
  const code = key.toUpperCase();
  if (code.length === 3 && /^[A-Z]{3}$/.test(code)) {
    const coords = IATA_COORDS[code];
    if (coords) {
      return {
        iata: code,
        lat: coords.lat,
        lng: coords.lng,
        name: code,
        country: '',
      };
    }
  }
  for (const [cityKey, info] of Object.entries(CITIES)) {
    if (key.includes(cityKey) || cityKey.includes(key)) {
      return {
        iata: info.iata,
        lat: info.lat,
        lng: info.lng,
        name: cityKey.replace(/\b\w/g, c => c.toUpperCase()),
        country: info.country,
      };
    }
  }
  return null;
}

export function resolveAirport(name: string): CityInfo | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  const code = key.toUpperCase();
  if (code.length === 3 && /^[A-Z]{3}$/.test(code) && IATA_COORDS[code]) {
    const coords = IATA_COORDS[code];
    return { iata: code, lat: coords.lat, lng: coords.lng, name: code, country: '' };
  }
  const city = resolveCity(name);
  if (city) {
    const concrete: Record<string, string> = {
      LON: 'LHR', PAR: 'CDG', NYC: 'JFK', TYO: 'NRT',
      ROM: 'FCO', MIL: 'MXP', STO: 'ARN', SEL: 'ICN',
      BJS: 'PEK', SHA: 'PVG', YTO: 'YYZ', YMQ: 'YUL',
      BUE: 'EZE', SAO: 'GRU', JKT: 'CGK', OSA: 'KIX',
      WAS: 'IAD', ORL: 'MCO', REK: 'KEF', UKY: 'KIX',
    };
    const iata = concrete[city.iata] || city.iata;
    return { ...city, iata };
  }
  return null;
}
