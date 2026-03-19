import { NextResponse } from 'next/server';
import { routes } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get('hospitalId') || 'aiims_rishikesh';
  
  // Checking .env routing key securely
  const apiKey = process.env.ROUTING_API_KEY;
  
  if (!apiKey) {
    console.warn("Routing API Key not found, proceeding in dev mode");
  }

  // Simulate routing engine processing
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // @ts-ignore
  const pathData = routes[hospitalId] || routes['aiims_rishikesh'];
  
  return NextResponse.json({ success: true, routeParams: pathData });
}
