import { CONFIG } from '../config.js';

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  city: string;
}

export interface DayForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
}

export class WeatherClient {
  lastError: string | null = null;

  get isAvailable(): boolean {
    return Boolean(CONFIG.OPENWEATHER_API_KEY);
  }

  async current(lat: number, lon: number, units = 'metric'): Promise<CurrentWeather | null> {
    if (!this.isAvailable) {
      this.lastError = 'OPENWEATHER_API_KEY missing (using preview weather)';
      return this.generateSimulatedCurrent(lat);
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.OPENWEATHER_API_KEY}&units=${units}`;
      const res = await fetch(url);
      if (!res.ok) {
        this.lastError = `OpenWeather error: HTTP ${res.status}`;
        return this.generateSimulatedCurrent(lat);
      }
      const data = await res.json();
      return {
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: (data.weather?.[0]?.description || 'Clear').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        icon: data.weather?.[0]?.icon || '01d',
        wind_speed: data.wind?.speed || 3.5,
        city: data.name || '',
      };
    } catch (err: any) {
      this.lastError = `OpenWeather error: ${err?.message || err}`;
      return this.generateSimulatedCurrent(lat);
    }
  }

  async forecast(lat: number, lon: number, units = 'metric', days = 5): Promise<DayForecast[]> {
    if (!this.isAvailable) {
      this.lastError = 'OPENWEATHER_API_KEY missing (using preview weather)';
      return this.generateSimulatedForecast(days);
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.OPENWEATHER_API_KEY}&units=${units}`;
      const res = await fetch(url);
      if (!res.ok) {
        this.lastError = `OpenWeather forecast error: HTTP ${res.status}`;
        return this.generateSimulatedForecast(days);
      }
      const data = await res.json();
      return this.collapseDaily(data.list || [], days);
    } catch (err: any) {
      this.lastError = `OpenWeather forecast error: ${err?.message || err}`;
      return this.generateSimulatedForecast(days);
    }
  }

  private collapseDaily(entries: any[], days: number): DayForecast[] {
    const byDay: Record<string, any[]> = {};
    for (const entry of entries) {
      const day = (entry.dt_txt || '').slice(0, 10);
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(entry);
    }

    const result: DayForecast[] = [];
    for (const [dayStr, list] of Object.entries(byDay)) {
      const temps = list.map(e => e.main.temp);
      const min = Math.round(Math.min(...temps));
      const max = Math.round(Math.max(...temps));
      const mid = list[Math.floor(list.length / 2)] || list[0];
      result.push({
        date: dayStr,
        temp_min: min,
        temp_max: max,
        description: (mid.weather?.[0]?.description || 'Partly cloudy').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        icon: mid.weather?.[0]?.icon || '02d',
      });
      if (result.length >= days) break;
    }
    return result;
  }

  private generateSimulatedCurrent(lat: number): CurrentWeather {
    const isTropical = Math.abs(lat) < 23.5;
    const isTemperate = Math.abs(lat) >= 23.5 && Math.abs(lat) < 55;
    const baseTemp = isTropical ? 28 : isTemperate ? 19 : 11;

    return {
      temp: baseTemp,
      feels_like: baseTemp + 1,
      humidity: 58,
      description: 'Pleasant & Sunny',
      icon: '01d',
      wind_speed: 3.8,
      city: '',
    };
  }

  private generateSimulatedForecast(days: number): DayForecast[] {
    const weatherVariations = [
      { desc: 'Clear & Sunny', icon: '01d', deltaMin: -2, deltaMax: 3 },
      { desc: 'Partly Cloudy', icon: '02d', deltaMin: -3, deltaMax: 1 },
      { desc: 'Scattered Showers', icon: '10d', deltaMin: -5, deltaMax: -1 },
      { desc: 'Mostly Sunny', icon: '01d', deltaMin: -1, deltaMax: 4 },
      { desc: 'Light Breeze', icon: '03d', deltaMin: -2, deltaMax: 2 },
      { desc: 'Overcast', icon: '04d', deltaMin: -4, deltaMax: 0 },
      { desc: 'Sunny & Warm', icon: '01d', deltaMin: 0, deltaMax: 5 },
    ];

    const today = new Date();
    const result: DayForecast[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const v = weatherVariations[i % weatherVariations.length];
      const base = 20;

      result.push({
        date: iso,
        temp_min: base + v.deltaMin,
        temp_max: base + v.deltaMax,
        description: v.desc,
        icon: v.icon,
      });
    }

    return result;
  }
}
