import { NextResponse } from 'next/server';
import { hospitals } from '@/lib/mockData';

export async function GET() {
  // Simulate backend processing and checking API keys securely mapped in .env
  const apiKey = process.env.HOSPITAL_API_KEY;
  
  if (!apiKey) {
    console.warn("API Key not found, proceeding in dev mode");
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return NextResponse.json({ success: true, data: hospitals });
}
