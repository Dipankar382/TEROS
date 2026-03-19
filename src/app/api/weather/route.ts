import { NextResponse } from 'next/server';
import { weatherData } from '@/lib/mockData';

export async function GET() {
  const apiKey = process.env.WEATHER_API_KEY;
  
  if (!apiKey) {
    console.warn("Weather API Key not found, proceeding in dev mode");
  }

  // Simulate real-time weather checking
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return NextResponse.json({ success: true, weather: weatherData });
}
