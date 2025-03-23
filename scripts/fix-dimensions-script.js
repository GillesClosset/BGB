// scripts/fix-dimensions.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDimensions() {
  try {
    console.log('Starting database fix for embedding dimensions...');
    
    // Step 1: Drop the existing table and functions
    console.log('Dropping existing table and functions...');
    const dropSQL = `
      DROP FUNCTION IF EXISTS match_genres;
      DROP TABLE IF EXISTS spotify_genres;
    `;
    
    await supabase.rpc('pgcrypto', { query: dropSQL });
    console.log('Successfully dropped existing objects');
    
    // Step 2: Create the table with correct dimensions (768 for BGE-base-en-v1.5)
    console.log('Creating table with 768 dimensions...');
    const createTableSQL = `
      CREATE TABLE spotify_genres (
        id SERIAL PRIMARY KEY,
        genre TEXT UNIQUE NOT NULL,
        embedding VECTOR(768)
      );
      
      CREATE INDEX spotify_genres_embedding_idx 
      ON spotify_genres 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `;
    
    await supabase.rpc('pgcrypto', { query: createTableSQL });
    console.log('Successfully created table with 768 dimensions');
    
    // Step 3: Create the match_genres function with 768 dimensions
    console.log('Creating match_genres function with 768 dimensions...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION match_genres(
        query_embedding VECTOR(768),
        match_threshold FLOAT DEFAULT 0.6,
        match_count INT DEFAULT 30
      )
      RETURNS TABLE (
        id INT,
        genre TEXT,
        similarity FLOAT
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          sg.id,
          sg.genre,
          1 - (sg.embedding <=> query_embedding) AS similarity
        FROM spotify_genres sg
        WHERE 1 - (sg.embedding <=> query_embedding) > match_threshold
        ORDER BY similarity DESC
        LIMIT match_count;
      END;
      $$;
    `;
    
    await supabase.rpc('pgcrypto', { query: createFunctionSQL });
    console.log('Successfully created match_genres function');
    
    console.log('Database schema has been updated to use 768 dimensions!');
    console.log('You can now run the embedding script again.');
    
  } catch (error) {
    console.error('Error fixing dimensions:', error);
  }
}

// Run the function
fixDimensions();