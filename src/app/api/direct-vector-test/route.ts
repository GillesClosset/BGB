import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    // Check if we have credentials
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing Supabase credentials',
        status: 'error'
      }, { status: 500 });
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Collect information about the database
    const results = {
      environment: {
        supabaseUrl: supabaseUrl ? '✓ Available' : '❌ Missing',
        supabaseServiceKey: supabaseServiceKey ? '✓ Available (hidden)' : '❌ Missing',
      },
      tables: {},
      functions: {},
      test: {}
    };
    
    // Check what tables exist
    try {
      // First try to query the spotify_genres table
      const { data: spotifyGenres, error: spotifyGenresError } = await supabase
        .from('spotify_genres')
        .select('id, genre')
        .limit(1);
        
      results.tables.spotify_genres = {
        exists: !spotifyGenresError,
        error: spotifyGenresError ? spotifyGenresError.message : null,
        sample: spotifyGenres
      };
      
      // Try to query genres table
      const { data: genres, error: genresError } = await supabase
        .from('genres')
        .select('id, name')
        .limit(1);
        
      results.tables.genres = {
        exists: !genresError,
        error: genresError ? genresError.message : null,
        sample: genres
      };
    } catch (error: any) {
      results.tables.error = error.message;
    }
    
    // Check if the match_genres function exists
    try {
      // Create a dummy embedding vector
      const dummyEmbedding = new Array(768).fill(0);
      dummyEmbedding[0] = 1; // Set first element to 1
      
      // Try to call the function
      const { data: matchResult, error: matchError } = await supabase.rpc('match_genres', {
        query_embedding: dummyEmbedding,
        match_threshold: 0.5,
        match_count: 1
      });
      
      results.functions.match_genres = {
        exists: !matchError,
        error: matchError ? matchError.message : null,
        sample: matchResult
      };
    } catch (error: any) {
      results.functions.error = error.message;
    }
    
    // Try to get the list of available functions
    try {
      // This is a system table query that might require admin rights
      const { data: functionsList, error: functionsError } = await supabase
        .from('pg_proc')
        .select('proname')
        .limit(20);
        
      results.functions.available = {
        success: !functionsError,
        error: functionsError ? functionsError.message : null,
        list: functionsList
      };
    } catch (error: any) {
      results.functions.available = {
        success: false,
        error: error.message
      };
    }
    
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      status: 'error'
    }, { status: 500 });
  }
} 