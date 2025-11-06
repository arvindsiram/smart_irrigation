import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveSensorReading(data: {
  waterPump: number;
  soilMoisture: number;
  temperature: number;
  humidity: number;
  phLevel: number;
  flowRate?: number;
}) {
  const { error } = await supabase
    .from('sensor_readings')
    .insert({
      water_pump: data.waterPump,
      soil_moisture: data.soilMoisture,
      temperature: data.temperature,
      humidity: data.humidity,
      ph_level: data.phLevel,
      flow_rate: data.flowRate
    });

  if (error) console.error('Error saving sensor reading:', error);
  return !error;
}

export async function getLatestReadings(limit = 24) {
  const { data, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) console.error('Error fetching readings:', error);
  return data || [];
}

export async function getThresholds(userId: string) {
  const { data, error } = await supabase
    .from('alert_thresholds')
    .select('*')
    .eq('user_id', userId);

  if (error) console.error('Error fetching thresholds:', error);
  return data || [];
}

export async function saveThreshold(userId: string, sensorType: string, minValue: number, maxValue: number) {
  const { error } = await supabase
    .from('alert_thresholds')
    .insert({
      user_id: userId,
      sensor_type: sensorType,
      min_value: minValue,
      max_value: maxValue,
      enabled: true
    });

  if (error) console.error('Error saving threshold:', error);
  return !error;
}

export async function updateThreshold(thresholdId: string, minValue: number, maxValue: number) {
  const { error } = await supabase
    .from('alert_thresholds')
    .update({
      min_value: minValue,
      max_value: maxValue
    })
    .eq('id', thresholdId);

  if (error) console.error('Error updating threshold:', error);
  return !error;
}
