import { useEffect, useState, useCallback } from 'react';
import {
  Droplet,
  ThermometerSun,
  Wind,
  Leaf,
  Power,
  Gauge,
  CloudRain,
  Calendar,
  Settings as SettingsIcon,
  Search,
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { ChartView } from './components/ChartView';
import { AlertSystem, Alert, checkThresholds } from './components/AlertSystem';
import { SettingsPanel } from './components/SettingsPanel';
import { generateMockSensorData, getMockWeatherData } from './lib/mockData';
import {
  getLatestReadings,
  getThresholds,
  saveSensorReading,
} from './lib/supabaseClient';

const firebaseConfig = {
  apiKey: "AIzaSyAYTHJ8HuxP7t-PVx094ZEpaEJ6zPSPsZQ",
  authDomain: "smart-irrigation-system-55048.firebaseapp.com",
  databaseURL: "https://smart-irrigation-system-55048-default-rtdb.firebaseio.com",
  projectId: "smart-irrigation-system-55048",
  storageBucket: "smart-irrigation-system-55048.firebasestorage.app",
  messagingSenderId: "880782214282",
  appId: "1:880782214282:web:25fa222bfa01f841e3d973",
  measurementId: "G-V9GCCV5GXH"
};

interface SensorData {
  waterPump: number;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  phLevel: number;
  flowRate?: number;
}

interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  weather: string;
  forecast: Array<{
    date: string;
    temp: number;
    condition: string;
  }>;
}

interface Reading {
  created_at: string;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  ph_level: number;
}

function App() {
  const [sensorData, setSensorData] = useState<SensorData>({
    waterPump: 0,
    soilMoisture: 0,
    temperature: 0,
    humidity: 0,
    phLevel: 0,
    flowRate: 0,
  });
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [useMockData, setUseMockData] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [historicalReadings, setHistoricalReadings] = useState<Reading[]>([]);
  const [thresholds, setThresholds] = useState<any[]>([]);

  const updateSensorData = useCallback(
    (data: SensorData) => {
      setSensorData(data);
      setLastUpdate(new Date().toLocaleString());

      if (thresholds.length > 0) {
        const newAlerts = checkThresholds(data, thresholds);
        setAlerts(newAlerts);
      }

      //saveSensorReading(data);
    },
    [thresholds]
  );

  useEffect(() => {
    if (useMockData) {
      const mockInterval = setInterval(() => {
        updateSensorData(generateMockSensorData());
      }, 3000);

      updateSensorData(generateMockSensorData());
      return () => clearInterval(mockInterval);
    }

    try {
      const app = initializeApp(firebaseConfig);
      const database = getDatabase(app);
      const sensorRef = ref(database, '/');

      const unsubscribe = onValue(
        sensorRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            updateSensorData({
              waterPump: data.waterPump || 0,
              soilMoisture: data.soilMoisture || 0,
              temperature: data.temperature || 0,
              humidity: data.humidity || 0,
              phLevel: data.phLevel || 0,
              flowRate: data.flowRate || 0,
            });
          }
        },
        (error) => {
          setError('Firebase connection error. Please check your configuration.');
          console.error('Firebase error:', error);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      setError('Failed to initialize Firebase. Please add your configuration.');
      console.error('Firebase initialization error:', err);
    }
  }, [useMockData, updateSensorData]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const readings = await getLatestReadings(24);
        setHistoricalReadings(readings as Reading[]);

        const thresholdData = await getThresholds('public');
        setThresholds(thresholdData);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    //loadData();
  }, []);

  const isPumpOn = sensorData.waterPump === 1;

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const handleSaveThreshold = async (
    type: string,
    min: number | null,
    max: number | null
  ) => {
    const existing = thresholds.find((t) => t.sensor_type === type);
    if (existing) {
      const updated = thresholds.map((t) =>
        t.sensor_type === type ? { ...t, min_value: min, max_value: max } : t
      );
      setThresholds(updated);
    } else {
      setThresholds([
        ...thresholds,
        { sensor_type: type, min_value: min, max_value: max, enabled: true },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Smart Irrigation Dashboard
            </h1>
            <p className="text-gray-600">Real-time monitoring and control system</p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-3 hover:bg-white rounded-lg shadow-sm transition-all"
          >
            <SettingsIcon className="text-blue-600" size={24} />
          </button>
        </header>

        {error && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded">
            <p className="text-amber-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataCard
                title="Water Pump"
                value={isPumpOn ? 'ON' : 'OFF'}
                icon={
                  <Power
                    className={isPumpOn ? 'text-green-600' : 'text-gray-400'}
                    size={32}
                  />
                }
                color={
                  isPumpOn
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }
                status={isPumpOn}
              />

              <DataCard
                title="Soil Moisture"
                value={`${sensorData.soilMoisture}%`}
                icon={<Droplet className="text-blue-600" size={32} />}
                color="bg-blue-50 border-blue-200"
              />

              {/* --- THIS IS THE CORRECTED LINE --- */}
              <DataCard
                title="Temperature"
                value={`${sensorData.temperature}°C`}
                icon={<ThermometerSun className="text-orange-600" size={32} />}
                color="bg-orange-50 border-orange-200"
              />

              <DataCard
                title="Humidity"
                value={`${sensorData.humidity}%`}
                icon={<Wind className="text-cyan-600" size={32} />}
                color="bg-cyan-50 border-cyan-200"
              />

              <DataCard
                title="pH Level"
                value={sensorData.phLevel.toFixed(1)}
                icon={<Leaf className="text-emerald-600" size={32} />}
                color="bg-emerald-50 border-emerald-200"
              />
            </div>

            {isPumpOn && (
              <div className="animate-in slide-in-from-bottom duration-300">
                <FlowDataCard flowRate={sensorData.flowRate || 0} />
              </div>
            )}

            <ChartView readings={historicalReadings} />
          </div>

          <div className="lg:col-span-1">
            <WeatherCard useMockData={useMockData} />
          </div>
        </div>

        <footer className="text-center text-gray-600 text-sm py-4 border-t border-gray-200">
          Last Updated: {lastUpdate || 'Waiting for data...'}
        </footer>
      </div>

      <AlertSystem alerts={alerts} onDismiss={dismissAlert} />
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        thresholds={thresholds}
        onSaveThreshold={handleSaveThreshold}
        useMockData={useMockData}
        onMockDataToggle={setUseMockData}
      />
    </div>
  );
}

interface DataCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  status?: boolean;
}

function DataCard({ title, value, icon, color, status }: DataCardProps) {
  return (
    <div
      className={`${color} border-2 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-700 font-semibold text-lg">{title}</h3>
        {icon}
      </div>
      <p
        className={`text-3xl font-bold ${
          status !== undefined
            ? status
              ? 'text-green-600'
              : 'text-gray-500'
            : 'text-gray-800'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

interface FlowDataCardProps {
  flowRate: number;
}

function FlowDataCard({ flowRate }: FlowDataCardProps) {
  return (
    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-700 font-semibold text-xl">Water Flow Rate</h3>
        <Gauge className="text-indigo-600" size={32} />
      </div>
      <p className="text-4xl font-bold text-indigo-600 mb-2">{flowRate} L/min</p>
      <p className="text-sm text-gray-600">Pump is currently active</p>
    </div>
  );
}

// --- WEATHER CARD COMPONENT (for WeatherAPI.com) ---

interface WeatherCardProps {
  useMockData: boolean;
}

// Interface for WeatherAPI.com search results
interface CitySearchResult {
  id: number;
  name: string;
  region: string;
  country: string;
  url: string; // WeatherAPI.com uses a 'url' string as a unique-ish ID
}

function WeatherCard({ useMockData }: WeatherCardProps) {
  // --- PASTE YOUR WeatherAPI.com API KEY HERE ---
  const API_KEY = '9119caa37253442298794843250611';

  const [weather, setWeatherData] = useState<WeatherData | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetches weather using a city name
  const fetchWeatherByCityName = useCallback(
    async (cityName: string) => {
      setIsLoading(true);
      setError('');
      setSearchResults([]);
      setSearchTerm('');
      setWeatherData(null); // Clear old weather data

      if (useMockData) {
        setWeatherData(getMockWeatherData());
        setIsLoading(false);
        return;
      }

      if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        setError('Please add your WeatherAPI.com API key.');
        setIsLoading(false);
        return;
      }

      try {
        // Get CURRENT weather and 3-DAY-FORECAST in one call
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${cityName}&days=3`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch weather data.');
        }
        const data = await response.json();

        // Process the data
        const { location, current, forecast } = data;

        setWeatherData({
          city: `${location.name}, ${location.region}`,
          temperature: current.temp_c,
          humidity: current.humidity,
          weather: current.condition.text,
          forecast: forecast.forecastday.map((day: any) => ({
            date: new Date(day.date).toLocaleDateString(undefined, {
              weekday: 'short',
            }),
            temp: day.day.avgtemp_c,
            condition: day.day.condition.text,
          })),
        });
      } catch (err) {
        console.error('Weather API error:', err);
        setError('Failed to fetch weather data. Check your API key.');
      } finally {
        setIsLoading(false);
      }
    },
    [useMockData, API_KEY]
  );

  // Fetch initial weather on load (Default: New Delhi)
  useEffect(() => {
    fetchWeatherByCityName('New Delhi');
  }, [fetchWeatherByCityName]);

  // Function to search for cities
  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      setError('Please add your API key to search.');
      return;
    }

    // --- REAL API CALL for Search/Autocomplete ---
    setError('');
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`
      );
      if (!response.ok) {
        throw new Error('Failed to search for cities.');
      }
      const data: CitySearchResult[] = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search API error:', err);
      setError('Failed to search for cities.');
    }
    // --- END REAL API CALL ---
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-700 font-semibold text-xl">Weather Forecast</h3>
        <CloudRain className="text-blue-500" size={32} />
      </div>

      {/* --- SEARCH SECTION --- */}
      <div className="relative mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for a city..."
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>

        {searchResults.length > 0 && (
          <div className="absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
            {searchResults.map((city) => (
              <button
                key={city.id} // WeatherAPI provides an ID
                onClick={() => fetchWeatherByCityName(city.name)}
                className="block w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                {city.name}, {city.region}, {city.country}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* --- END SEARCH SECTION --- */}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500">Loading weather data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-red-500 font-medium">{error}</p>
          {error.includes('API key') && (
            <p className="text-sm text-gray-600 mt-1">
              Please paste your key into the `WeatherCard` component.
            </p>
          )}
        </div>
      ) : weather ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">{weather.city}</p>
            <p className="text-3xl font-bold text-gray-800">
              {Math.round(weather.temperature)}°C
            </p>
            <p className="text-sm text-gray-700 mt-1 capitalize">
              {weather.weather}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Humidity: {weather.humidity}%
            </p>
          </div>

          {weather.forecast && weather.forecast.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar size={16} />
                <span>3-Day Forecast</span>
              </div>
              {weather.forecast.map((day, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 rounded p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {day.date}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">
                      {day.condition}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    {Math.round(day.temp)}°C
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500">No weather data available.</p>
        </div>
      )}
    </div>
  );
}

export default App;
