import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define genre interface to fix TypeScript errors
interface Genre {
  id: string;
  name: string;
  similarity?: number;
}

// Create a Supabase client - load from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ovhCloudApiKey = process.env.OVHCLOUD_API_KEY || '';

// Use the URL exactly as shown in the documentation
const OVHCLOUD_BASE_URL = 'https://bge-base-en-v1-5.endpoints.kepler.ai.cloud.ovh.net';
const OVHCLOUD_TEXT2VEC_ENDPOINT = `${OVHCLOUD_BASE_URL}/api/text2vec`;

// Function to get embeddings from OVHcloud AI API
async function getEmbeddings(text: string) {
  console.log(`[Vector Search] Getting embeddings for text: ${text.substring(0, 50)}...`);
  
  try {
    // Environment variable validation with specific errors
    if (!ovhCloudApiKey) {
      console.error('[Vector Search] Missing OVHCLOUD_API_KEY environment variable');
      throw new Error('Missing OVHcloud API key configuration. Please check server environment variables.');
    }

    // Log request being made (without the API key)
    console.log('[Vector Search] Sending request to OVHcloud embeddings API');
    console.log(`[Vector Search] Using endpoint: ${OVHCLOUD_TEXT2VEC_ENDPOINT}`);
    
    // Use the exact API format according to documentation
    const response = await fetch(OVHCLOUD_TEXT2VEC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ovhCloudApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text
      }),
      // Add timeout to prevent long hanging requests
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    console.log(`[Vector Search] Embeddings API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Vector Search] Embeddings API error (${response.status}): ${errorText}`);
      throw new Error(`Failed to get embeddings: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[Vector Search] Successfully received embeddings response');
    
    // Check if the response is an array (the embedding vector directly)
    if (Array.isArray(data)) {
      console.log(`[Vector Search] Received embedding array with ${data.length} dimensions`);
      return data;
    }
    
    // If not an array, check if it has an embedding property
    if (data.embedding) {
      console.log(`[Vector Search] Received embedding from 'embedding' property with ${data.embedding.length} dimensions`);
      return data.embedding;
    }
    
    // Log data structure for debugging
    console.error('[Vector Search] Unexpected embedding response format:', 
      typeof data === 'object' ? `Keys: ${Object.keys(data).join(', ')}` : `Type: ${typeof data}`);
    
    // First 100 characters of the response for debugging
    console.error('[Vector Search] Response preview:', JSON.stringify(data).substring(0, 100));
    
    throw new Error('Unexpected embedding response format from OVHcloud API');
  } catch (error) {
    // Enhance error reporting
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Vector Search] Error in getEmbeddings: ${errorMessage}`);
    throw error; // Re-throw to be handled by the caller
  }
}

export async function POST(request: NextRequest) {
  console.log('[Vector Search] Received POST request');
  
  try {
    // Parse request body
    const body = await request.json();
    const { text, limit = 50, threshold = 0.5 } = body;

    console.log(`[Vector Search] Request params: text length=${text?.length || 0}, limit=${limit}, threshold=${threshold}`);

    // Input validation
    if (!text) {
      console.error('[Vector Search] Missing required parameter: text');
      return NextResponse.json(
        { error: 'Missing text parameter' },
        { status: 400 }
      );
    }

    // Validate environment configuration
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Vector Search] Missing Supabase credentials in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing database credentials' },
        { status: 500 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[Vector Search] Supabase client created successfully');

    // Get embeddings for the query text
    try {
      const embedding = await getEmbeddings(text);
      console.log(`[Vector Search] Got embedding vector of length: ${embedding.length}`);

      // Query Supabase for similar genres
      console.log(`[Vector Search] Querying Supabase for similar genres (limit=${limit}, threshold=${threshold})`);
      const { data: genres, error } = await supabase.rpc('match_genres', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit
      });

      if (error) {
        console.error(`[Vector Search] Supabase query error: ${error.message}`);
        return NextResponse.json(
          { error: `Database query error: ${error.message}` },
          { status: 500 }
        );
      }

      // Log success and result summary
      const genreCount = genres?.length || 0;
      console.log(`[Vector Search] Successfully found ${genreCount} matching genres`);
      
      if (genres && genres.length > 0) {
        const sampleGenres = genres.slice(0, 5).map((g: Genre) => g.name).join(', ');
        console.log(`[Vector Search] Sample genres: ${sampleGenres}`);
        return NextResponse.json({ 
          matches: genres,
          count: genres.length
        });
      } else {
        console.warn('[Vector Search] No genres found matching the query');
        return NextResponse.json({
          matches: [],
          count: 0
        });
      }
    } catch (embeddingsError) {
      // Handle embeddings error specifically
      const errorMessage = embeddingsError instanceof Error ? embeddingsError.message : 'Unknown error';
      console.error(`[Vector Search] Error with embeddings: ${errorMessage}`);
      
      // Return a specific error for connectivity issues
      if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        return NextResponse.json(
          { error: 'Vector search service currently unavailable. Please try again later.' },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { error: `Vector embedding error: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Vector Search] Uncaught error: ${errorMessage}`);
    console.error(error); // Log the full error for debugging
    
    return NextResponse.json(
      { error: errorMessage || 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 