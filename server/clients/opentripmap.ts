import { CONFIG } from '../config.js';

export interface Activity {
  xid: string;
  name: string;
  short_description: string;
  description: string;
  image: string;
  url: string;
  kinds: string;
  category: string;
  latitude: number;
  longitude: number;
  price: number;
  currency: string;
}

export const KIND_FILTERS: Record<string, string[]> = {
  adventure: ['adventure', 'sports', 'hiking', 'climbing'],
  food: ['foods', 'restaurants', 'cafes'],
  culture: ['museums', 'cultural', 'historic', 'architecture', 'religion'],
  beach: ['beaches', 'water', 'swimming'],
  shopping: ['shops', 'mall'],
  nightlife: ['nightlife', 'bars', 'clubs'],
  nature: ['natural', 'parks', 'gardens', 'viewpoints'],
  family: ['amusements', 'aquarium', 'zoo', 'theme_park'],
};

export class OpenTripMapClient {
  lastError: string | null = null;

  get isAvailable(): boolean {
    return Boolean(CONFIG.OPENTRIPMAP_API_KEY);
  }

  async searchActivities(
    destinationName: string,
    latitude: number,
    longitude: number,
    preferences: string[] = [],
    maxResults = 8
  ): Promise<Activity[]> {
    if (!this.isAvailable) {
      this.lastError = 'OPENTRIPMAP_API_KEY missing (using curated destination POIs)';
      return this.generateSimulatedActivities(destinationName, latitude, longitude, preferences, maxResults);
    }

    try {
      let kindsParam = '';
      if (preferences.length) {
        const kindsSet = new Set<string>();
        for (const pref of preferences) {
          const mapped = KIND_FILTERS[pref.toLowerCase()];
          if (mapped) mapped.forEach(k => kindsSet.add(k));
        }
        kindsParam = Array.from(kindsSet).join(',');
      }

      const params = new URLSearchParams({
        radius: '10000',
        lon: String(longitude),
        lat: String(latitude),
        format: 'json',
        limit: String(maxResults),
        apikey: CONFIG.OPENTRIPMAP_API_KEY
      });
      if (kindsParam) params.set('kinds', kindsParam);

      const res = await fetch(`https://api.opentripmap.com/0.1/en/places/radius?${params.toString()}`);
      if (!res.ok) {
        this.lastError = `OpenTripMap error: HTTP ${res.status}`;
        return this.generateSimulatedActivities(destinationName, latitude, longitude, preferences, maxResults);
      }

      const places = await res.json();
      if (!Array.isArray(places) || !places.length) {
        return this.generateSimulatedActivities(destinationName, latitude, longitude, preferences, maxResults);
      }

      return places.slice(0, maxResults).map((p: any, idx: number) => ({
        xid: p.xid || `otm_${idx}`,
        name: p.name || 'City Landmark',
        short_description: p.kinds ? `Tagged under ${p.kinds.split(',').slice(0, 3).join(', ')}` : 'Popular visitor destination',
        description: '',
        image: '',
        url: '',
        kinds: p.kinds || 'cultural',
        category: p.kinds?.split(',')[0] || 'attraction',
        latitude: p.point?.lat || latitude,
        longitude: p.point?.lon || longitude,
        price: idx % 3 === 0 ? 25 : idx % 2 === 0 ? 15 : 0,
        currency: 'USD',
      }));
    } catch (err: any) {
      this.lastError = `OpenTripMap error: ${err?.message || err}`;
      return this.generateSimulatedActivities(destinationName, latitude, longitude, preferences, maxResults);
    }
  }

  private generateSimulatedActivities(
    destination: string,
    lat: number,
    lng: number,
    preferences: string[] = [],
    maxResults = 8
  ): Activity[] {
    const defaultCatalog: Record<string, Array<{ name: string; cat: string; desc: string; price: number; img: string; dLat: number; dLng: number }>> = {
      paris: [
        { name: 'Louvre Museum & Glass Pyramid Tour', cat: 'culture', desc: 'Marvel at Leonardo da Vinci’s Mona Lisa and classical antiquities in the world’s largest art museum.', price: 22, img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop&q=80', dLat: 0.007, dLng: -0.012 },
        { name: 'Eiffel Tower Sunset Summit Access', cat: 'culture', desc: 'Ascend to the top deck of the iron lady for panoramic views across Paris at dusk.', price: 35, img: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600&auto=format&fit=crop&q=80', dLat: -0.001, dLng: -0.055 },
        { name: 'Montmartre Artisan Pastry & Wine Walk', cat: 'food', desc: 'Taste freshly baked croissants, artisan cheeses, and Bordeaux wines with a local chef.', price: 65, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', dLat: 0.032, dLng: -0.013 },
        { name: 'Seine River Evening Bateaux-Mouches Cruise', cat: 'relaxation', desc: 'Glide past illuminated bridges, Notre-Dame, and Musée d’Orsay from the serene waters of the Seine.', price: 18, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80', dLat: -0.005, dLng: -0.002 },
        { name: 'Le Marais Boutique Galleries & Falafel Tasting', cat: 'food', desc: 'Explore historic Jewish quarter alleys, avant-garde fashion concepts, and famed street food.', price: 0, img: 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=600&auto=format&fit=crop&q=80', dLat: 0.004, dLng: 0.011 },
        { name: 'Jardin du Luxembourg Relaxing Promenade', cat: 'nature', desc: 'Stroll along grand tree-lined walkways, classical Medici fountains, and historic palace grounds.', price: 0, img: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&auto=format&fit=crop&q=80', dLat: -0.011, dLng: -0.009 },
      ],
      london: [
        { name: 'British Museum Antiquities Guided Walk', cat: 'culture', desc: 'Discover the Rosetta Stone and Parthenon sculptures in the breathtaking Great Court.', price: 0, img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&auto=format&fit=crop&q=80', dLat: 0.012, dLng: -0.003 },
        { name: 'Borough Market Gourmet Food Odyssey', cat: 'food', desc: 'Indulge in artisanal cheeses, hot salt beef bagels, and British ciders in historic market arches.', price: 30, img: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600&auto=format&fit=crop&q=80', dLat: -0.003, dLng: 0.038 },
        { name: 'Tower of London & Crown Jewels', cat: 'culture', desc: 'Explore 1,000 years of royal intrigue, medieval armor, and sparkling regalia guarded by Yeoman Warders.', price: 38, img: 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=600&auto=format&fit=crop&q=80', dLat: 0.002, dLng: 0.049 },
        { name: 'South Bank Thames Sunset Walk & Tate Modern', cat: 'culture', desc: 'Free contemporary exhibits in the turbine hall followed by skyline views over the Millennium Bridge.', price: 0, img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop&q=80', dLat: 0.001, dLng: 0.027 },
        { name: 'Hyde Park & Kensington Gardens Serpentine Boating', cat: 'nature', desc: 'Rent a rowboat or pedal boat on the historic Serpentine lake flanked by swans and regal weeping willows.', price: 16, img: 'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?w=600&auto=format&fit=crop&q=80', dLat: -0.004, dLng: -0.045 },
      ],
      tokyo: [
        { name: 'Senso-ji Temple & Asakusa Nakamise Stalls', cat: 'culture', desc: 'Tokyo’s oldest Buddhist sanctuary with giant red lanterns, incense cauldrons, and fresh ningyo-yaki sweets.', price: 0, img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80', dLat: 0.038, dLng: 0.045 },
        { name: 'Tsukiji Outer Market Fresh Sashimi & Tamagoyaki', cat: 'food', desc: 'Taste succulent wagyu skewers, torched fatty tuna nigiri, and sweet rolled omelets prepared live.', price: 40, img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80', dLat: -0.012, dLng: 0.021 },
        { name: 'Shibuya Crossing & Scramble Skyline Observatory', cat: 'adventure', desc: 'Watch thousands of pedestrians cross simultaneously and take in Tokyo Tower from the 46th floor.', price: 20, img: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80', dLat: -0.016, dLng: -0.052 },
        { name: 'Meiji Jingu Shrine & Harajuku Takeshita Street', cat: 'culture', desc: 'Walk under colossal cedar torii gates into tranquil evergreen forest before diving into youth pop fashion.', price: 0, img: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&auto=format&fit=crop&q=80', dLat: 0.005, dLng: -0.047 },
        { name: 'Akihabara Tech Arcades & Retro Gaming Vaults', cat: 'adventure', desc: 'Explore towering multi-story arcades, vintage Nintendo cartridges, and high-tech anime collectables.', price: 15, img: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&auto=format&fit=crop&q=80', dLat: 0.024, dLng: 0.025 },
      ]
    };

    const destKey = destination.toLowerCase().trim();
    let matches = defaultCatalog[destKey];

    if (!matches) {
      matches = [
        { name: `${destination} Historic City Square & Old Town`, cat: 'culture', desc: `Explore cobblestone pedestrian streets, historic clocktowers, and charming heritage plazas in central ${destination}.`, price: 0, img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&auto=format&fit=crop&q=80', dLat: 0.004, dLng: 0.003 },
        { name: `${destination} Central Food Hall & Regional Tasting`, cat: 'food', desc: `Sample signature local dishes, street food specialties, and regional delicacies directly from local artisans.`, price: 35, img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80', dLat: -0.003, dLng: 0.005 },
        { name: `${destination} Museum of Art & National History`, cat: 'culture', desc: `Discover centuries of local history, archaeological treasures, and masterworks from prominent regional artists.`, price: 18, img: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&auto=format&fit=crop&q=80', dLat: 0.008, dLng: -0.004 },
        { name: `${destination} Skyline Lookout & Sunset Terrace`, cat: 'adventure', desc: `A scenic hilltop viewpoint offering 360-degree vistas across the entire city and surrounding landscape.`, price: 10, img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80', dLat: -0.006, dLng: -0.007 },
        { name: `${destination} Botanical Garden & Riverside Trail`, cat: 'nature', desc: `A peaceful sanctuary featuring exotic flora, tranquil reflecting ponds, and shaded cycling and walking trails.`, price: 8, img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80', dLat: 0.006, dLng: 0.008 },
        { name: `${destination} Evening Music & Night Market Experience`, cat: 'nightlife', desc: `Experience the city after dark with open-air lantern stalls, live acoustic music, and vibrant night social hubs.`, price: 20, img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80', dLat: -0.002, dLng: 0.002 },
      ];
    }

    return matches.slice(0, maxResults).map((m, idx) => ({
      xid: `poi_${idx + 1}`,
      name: m.name,
      short_description: m.desc,
      description: m.desc,
      image: m.img,
      url: '',
      kinds: m.cat,
      category: m.cat,
      latitude: lat + m.dLat,
      longitude: lng + m.dLng,
      price: m.price,
      currency: 'USD',
    }));
  }
}
