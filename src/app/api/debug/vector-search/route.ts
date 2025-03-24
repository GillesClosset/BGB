import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ovhCloudApiKey = process.env.OVHCLOUD_API_KEY || '';

// OVHcloud embeddings API URL
const OVHCLOUD_BASE_URL = 'https://bge-base-en-v1-5.endpoints.kepler.ai.cloud.ovh.net';
const OVHCLOUD_TEXT2VEC_ENDPOINT = `${OVHCLOUD_BASE_URL}/api/text2vec`;

export async function GET(request: NextRequest) {
  const results: any = {
    environment: {},
    supabase: {},
    embeddings: {},
    vectorSearch: {},
    errors: []
  };

  try {
    // 1. Test environment variables
    results.environment = {
      supabaseUrl: supabaseUrl ? '✓ Available' : '❌ Missing',
      supabaseServiceKey: supabaseServiceKey ? '✓ Available (hidden)' : '❌ Missing',
      ovhCloudApiKey: ovhCloudApiKey ? '✓ Available (hidden)' : '❌ Missing',
      vercelUrl: process.env.VERCEL_URL ? `✓ ${process.env.VERCEL_URL}` : '❌ Not set'
    };

    // 2. Test Supabase connection
    if (supabaseUrl && supabaseServiceKey) {
      try {
        // Create client with service key
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        // Try simple query to check connection
        const { data, error } = await supabase.from('genres').select('id, name').limit(1);
        
        results.supabase = {
          connection: error ? '❌ Failed' : '✓ Success',
          error: error ? error.message : null,
          sample: data ?? []
        };
      } catch (err: any) {
        results.supabase = { 
          connection: '❌ Error',
          error: err.message
        };
        results.errors.push(`Supabase connection: ${err.message}`);
      }
    } else {
      results.supabase = { 
        connection: '❌ Skipped (missing credentials)'
      };
    }

    // 3. Test embeddings generation
    if (ovhCloudApiKey) {
      try {
        const sampleText = "This is a test to generate embeddings for vector search";
        
        const embeddingsResponse = await fetch(OVHCLOUD_TEXT2VEC_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ovhCloudApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: sampleText }),
        });
        
        if (!embeddingsResponse.ok) {
          const errorText = await embeddingsResponse.text();
          results.embeddings = {
            status: '❌ Failed',
            code: embeddingsResponse.status,
            error: errorText
          };
          results.errors.push(`Embeddings generation: ${embeddingsResponse.status} - ${errorText}`);
        } else {
          const data = await embeddingsResponse.json();
          const embedding = Array.isArray(data) ? data : data.embedding;
          
          results.embeddings = {
            status: '✓ Success',
            dimensions: embedding ? embedding.length : 'Unknown',
            sample: embedding ? embedding.slice(0, 3) : null
          };
        }
      } catch (err: any) {
        results.embeddings = {
          status: '❌ Error',
          error: err.message
        };
        results.errors.push(`Embeddings generation: ${err.message}`);
      }
    } else {
      results.embeddings = {
        status: '❌ Skipped (missing API key)'
      };
    }

    // 4. Test vector search directly
    if (supabaseUrl && supabaseServiceKey && results.embeddings.status === '✓ Success') {
      try {
        const embedding = results.embeddings.sample ? 
          results.embeddings.sample.concat(new Array(results.embeddings.dimensions - 3).fill(0)) :
          [];
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: genres, error } = await supabase.rpc('match_genres', {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 5
        });
        
        results.vectorSearch = {
          status: error ? '❌ Failed' : '✓ Success',
          error: error ? error.message : null,
          results: genres ?? []
        };
        
        if (error) {
          results.errors.push(`Vector search: ${error.message}`);
        }
      } catch (err: any) {
        results.vectorSearch = {
          status: '❌ Error',
          error: err.message
        };
        results.errors.push(`Vector search: ${err.message}`);
      }
    } else {
      results.vectorSearch = {
        status: '❌ Skipped (missing prerequisites)'
      };
    }
    
    // 5. Test vector search API endpoint
    try {
      // Create a test query
      const testQuery = "Board game with strategy and resource management";
      
      // Call our own vector-search endpoint directly
      const localEndpoint = '/api/vector-search';
      const baseUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'http://localhost:3000';
        
      // Create diagnostics about what URL we're using
      results.apiTest = {
        url: `${baseUrl}${localEndpoint}`,
        vercelUrl: process.env.VERCEL_URL,
        method: 'POST',
        requestSent: true
      };
      
      // Try calling with direct service key
      const response = await axios.post(
        localEndpoint,
        { text: testQuery, limit: 5, threshold: 0.5 },
        {
          baseURL: baseUrl,
          headers: {
            'Content-Type': 'application/json',
            'x-supabase-auth': supabaseServiceKey,
          }
        }
      );
      
      results.apiTest.status = response.status;
      results.apiTest.success = response.status >= 200 && response.status < 300;
      results.apiTest.data = response.data;
    } catch (err: any) {
      results.apiTest = {
        ...results.apiTest,
        status: err.response?.status || 'No status',
        success: false,
        error: err.message,
        responseData: err.response?.data || 'No data'
      };
      results.errors.push(`API test: ${err.message}`);
    }

    // Return the results of all tests
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error.message,
      results
    }, { status: 500 });
  }
} 