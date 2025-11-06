export function generateMockSensorData() {
  return {
    waterPump: Math.random() > 0.5 ? 1 : 0,
    soilMoisture: Math.floor(Math.random() * 100),
    temperature: Math.round((15 + Math.random() * 25) * 10) / 10,
    humidity: Math.floor(Math.random() * 100),
    phLevel: Math.round((6.5 + Math.random() * 1.5) * 10) / 10,
    flowRate: Math.random() > 0.5 ? Math.round(Math.random() * 100) / 10 : undefined
  };
}

export function getMockWeatherData() {
  return {
    city: "Delhi",
    temperature: Math.floor(20 + Math.random() * 15),
    humidity: Math.floor(40 + Math.random() * 40),
    weather: ["Sunny", "Cloudy", "Partly Cloudy", "Clear"][Math.floor(Math.random() * 4)],
    forecast: [
      {
        date: "Tomorrow",
        temp: Math.floor(20 + Math.random() * 15),
        condition: "Partly Cloudy"
      },
      {
        date: "Day After",
        temp: Math.floor(20 + Math.random() * 15),
        condition: "Sunny"
      },
      {
        date: "Next Week",
        temp: Math.floor(18 + Math.random() * 15),
        condition: "Clear"
      }
    ]
  };
}
