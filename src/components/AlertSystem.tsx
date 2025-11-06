import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
}

interface AlertSystemProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

export function AlertSystem({ alerts, onDismiss }: AlertSystemProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 space-y-2 max-w-md z-50">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 animate-in slide-in-from-top flex items-start gap-3 ${
            alert.type === 'error'
              ? 'bg-red-50 border-red-500 text-red-800'
              : alert.type === 'warning'
              ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
              : 'bg-green-50 border-green-500 text-green-800'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {alert.type === 'error' && <AlertTriangle size={20} />}
            {alert.type === 'warning' && <AlertCircle size={20} />}
            {alert.type === 'success' && <CheckCircle size={20} />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{alert.title}</p>
            <p className="text-sm opacity-90">{alert.message}</p>
          </div>
          <button
            onClick={() => onDismiss(alert.id)}
            className="flex-shrink-0 opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function checkThresholds(
  sensorData: any,
  thresholds: any[]
): Alert[] {
  const alerts: Alert[] = [];

  const thresholdMap = {
    soilMoisture: { key: 'Soil Moisture', value: sensorData.soilMoisture },
    temperature: { key: 'Temperature', value: sensorData.temperature },
    humidity: { key: 'Humidity', value: sensorData.humidity },
    phLevel: { key: 'pH Level', value: sensorData.phLevel }
  };

  thresholds.forEach(threshold => {
    if (!threshold.enabled) return;

    const metric = thresholdMap[threshold.sensor_type as keyof typeof thresholdMap];
    if (!metric) return;

    const value = metric.value;
    const { min_value, max_value } = threshold;

    if (min_value !== null && value < min_value) {
      alerts.push({
        id: `${threshold.id}-low`,
        type: 'warning',
        title: `${metric.key} Low`,
        message: `${metric.key} is ${value}, below minimum ${min_value}`,
        timestamp: new Date()
      });
    }

    if (max_value !== null && value > max_value) {
      alerts.push({
        id: `${threshold.id}-high`,
        type: 'error',
        title: `${metric.key} High`,
        message: `${metric.key} is ${value}, above maximum ${max_value}`,
        timestamp: new Date()
      });
    }
  });

  return alerts;
}
