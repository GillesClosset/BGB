import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get all URL parameters
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Construct the target URL with all query parameters
    const targetUrl = new URL('https://api.reccobeats.com/v1/track/recommendation');
    params.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });
    
    console.log(`Making GET request to ReccoBeats API: ${targetUrl.toString()}`);
    
    // Forward request to ReccoBeats API
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Check if request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ReccoBeats API error:', response.status, errorText);
      
      // Try to parse the error as JSON if possible
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // If not JSON, use the raw text
        errorJson = { message: errorText };
      }
      
      return NextResponse.json(
        { error: `ReccoBeats API error: ${response.status} - ${JSON.stringify(errorJson)}` },
        { status: response.status }
      );
    }

    // Return the API response
    const data = await response.json();
    
    // Log summary of what we received
    if (data.tracks) {
      console.log(`ReccoBeats returned ${data.tracks.length} tracks`);
    } else {
      console.log('ReccoBeats response structure:', Object.keys(data));
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying request to ReccoBeats:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    console.log('Making request to ReccoBeats API with parameters:', JSON.stringify(body));
    
    // Forward request to ReccoBeats API without authentication (per documentation)
    const response = await fetch('https://api.reccobeats.com/v1/track/recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check if request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ReccoBeats API error:', response.status, errorText);
      
      // Try to parse the error as JSON if possible
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // If not JSON, use the raw text
        errorJson = { message: errorText };
      }
      
      return NextResponse.json(
        { error: `ReccoBeats API error: ${response.status} - ${JSON.stringify(errorJson)}` },
        { status: response.status }
      );
    }

    // Return the API response
    const data = await response.json();
    
    // Log summary of what we received
    if (data.tracks) {
      console.log(`ReccoBeats returned ${data.tracks.length} tracks`);
    } else {
      console.log('ReccoBeats response structure:', Object.keys(data));
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying request to ReccoBeats:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 