import { TrendingUp } from 'lucide-react';

interface Reading {
  created_at: string;
  soil_moisture: number;
  temperature: number;
  humidity: number;
  ph_level: number;
}

interface ChartViewProps {
  readings: Reading[];
}

export function ChartView({ readings }: ChartViewProps) {
  if (!readings || readings.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-blue-600" size={24} />
          <h3 className="text-gray-700 font-semibold text-xl">Historical Data</h3>
        </div>
        <p className="text-gray-500 text-center py-8">No historical data available</p>
      </div>
    );
  }

  const sortedReadings = [...readings].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const maxMoisture = Math.max(...sortedReadings.map(r => r.soil_moisture), 100);
  const maxTemp = Math.max(...sortedReadings.map(r => r.temperature), 30);
  const maxHumidity = Math.max(...sortedReadings.map(r => r.humidity), 100);

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="text-blue-600" size={24} />
        <h3 className="text-gray-700 font-semibold text-xl">Historical Data</h3>
      </div>

      <div className="space-y-6">
        <MiniChart
          title="Soil Moisture"
          unit="%"
          data={sortedReadings.map(r => r.soil_moisture)}
          max={maxMoisture}
          color="bg-blue-500"
        />

        <MiniChart
          title="Temperature"
          unit="°C"
          data={sortedReadings.map(r => r.temperature)}
          max={maxTemp}
          color="bg-orange-500"
        />

        <MiniChart
          title="Humidity"
          unit="%"
          data={sortedReadings.map(r => r.humidity)}
          max={maxHumidity}
          color="bg-cyan-500"
        />
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Showing {sortedReadings.length} readings
        </p>
      </div>
    </div>
  );
}

interface MiniChartProps {
  title: string;
  unit: string;
  data: number[];
  max: number;
  color: string;
}

function MiniChart({ title, unit, data, max, color }: MiniChartProps) {
  const normalized = data.map(v => (v / max) * 100);
  const current = data[data.length - 1];
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length * 10) / 10;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-sm text-gray-600">
          Avg: {avg}{unit} | Current: {current}{unit}
        </p>
      </div>
      <div className="flex gap-1 h-12 items-end bg-gray-50 p-2 rounded">
        {normalized.map((height, idx) => (
          <div
            key={idx}
            className={`flex-1 ${color} rounded-t opacity-70 hover:opacity-100 transition-opacity`}
            style={{ height: `${Math.max(height, 5)}%` }}
            title={`${data[idx]}${unit}`}
          />
        ))}
      </div>
    </div>
  );
}
