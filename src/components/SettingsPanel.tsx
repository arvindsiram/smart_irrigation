import { Settings, X, Save } from 'lucide-react';
import { useState } from 'react';

interface Threshold {
  id: string;
  sensor_type: string;
  min_value: number | null;
  max_value: number | null;
  enabled: boolean;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: Threshold[];
  onSaveThreshold: (type: string, min: number | null, max: number | null) => void;
  useMockData: boolean;
  onMockDataToggle: (enabled: boolean) => void;
}

export function SettingsPanel({
  isOpen,
  onClose,
  thresholds,
  onSaveThreshold,
  useMockData,
  onMockDataToggle
}: SettingsPanelProps) {
  const [editingType, setEditingType] = useState<string | null>(null);
  const [minValue, setMinValue] = useState<number | null>(null);
  const [maxValue, setMaxValue] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (editingType) {
      onSaveThreshold(editingType, minValue, maxValue);
      setEditingType(null);
      setMinValue(null);
      setMaxValue(null);
    }
  };

  const sensors = [
    { type: 'soilMoisture', label: 'Soil Moisture', unit: '%', min: 0, max: 100 },
    { type: 'temperature', label: 'Temperature', unit: '°C', min: -10, max: 50 },
    { type: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100 },
    { type: 'phLevel', label: 'pH Level', unit: '', min: 0, max: 14 }
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="text-blue-600" size={24} />
            <h2 className="text-lg font-bold text-gray-800">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="border-b pb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useMockData}
                onChange={(e) => onMockDataToggle(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-gray-700 font-medium">Use Mock Data</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              For testing without Firebase connection
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Alert Thresholds</h3>

            {editingType ? (
              <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                <p className="font-medium text-gray-700">
                  {sensors.find(s => s.type === editingType)?.label}
                </p>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Minimum Value {sensors.find(s => s.type === editingType)?.unit}
                  </label>
                  <input
                    type="number"
                    value={minValue ?? ''}
                    onChange={(e) => setMinValue(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="No limit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Maximum Value {sensors.find(s => s.type === editingType)?.unit}
                  </label>
                  <input
                    type="number"
                    value={maxValue ?? ''}
                    onChange={(e) => setMaxValue(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="No limit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingType(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {sensors.map(sensor => {
                  const threshold = thresholds.find(t => t.sensor_type === sensor.type);
                  return (
                    <button
                      key={sensor.type}
                      onClick={() => {
                        setEditingType(sensor.type);
                        setMinValue(threshold?.min_value ?? null);
                        setMaxValue(threshold?.max_value ?? null);
                      }}
                      className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <p className="font-medium text-gray-800">{sensor.label}</p>
                      <p className="text-xs text-gray-600">
                        {threshold && (threshold.min_value || threshold.max_value)
                          ? `${threshold.min_value ?? 'No min'} - ${threshold.max_value ?? 'No max'} ${sensor.unit}`
                          : 'No thresholds set'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
