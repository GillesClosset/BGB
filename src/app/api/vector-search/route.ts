import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// OVHcloud AI credentials and endpoints
const OVHCLOUD_API_KEY = process.env.OVHCLOUD_API_KEY || '';
const OVHCLOUD_EMBEDDING_BASE_URL = 'https://bge-base-en-v1-5.endpoints.kepler.ai.cloud.ovh.net';
const SINGLE_TEXT_ENDPOINT = '/api/text2vec';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to get embeddings from OVHcloud API for a single text
async function getEmbedding(text: string) {
  try {
    console.log(`Getting embedding for: "${text.substring(0, 50)}..."`);
    
    const response = await axios.post(
      `${OVHCLOUD_EMBEDDING_BASE_URL}${SINGLE_TEXT_ENDPOINT}`,
      { text },
      {
        headers: {
          'Authorization': `Bearer ${OVHCLOUD_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const embedding = response.data.embedding || response.data;
    console.log(`Successfully received embedding of length: ${embedding.length}`);
    return embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { text, limit = 30, threshold = 0.6 } = body;
    
    // Validate input
    if (!text) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }
    
    // Generate embedding for the input text
    const embedding = await getEmbedding(text);
    
    // Query Supabase for similar genres using the match_genres function
    const { data, error } = await supabase.rpc(
      'match_genres',
      {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit
      }
    );
    
    if (error) {
      console.error('Error querying Supabase:', error);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }
    
    // Return the matching genres
    return NextResponse.json({
      matches: data,
      count: data.length
    });
  } catch (error: any) {
    console.error('Error in vector search API:', error);
    
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 