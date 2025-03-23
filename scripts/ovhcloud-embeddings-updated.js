require('dotenv').config({ path: './.env.local' });
// scripts/ovhcloud-embeddings.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Load environment variables from .env.local
require('dotenv').config({ path: './.env.local' });

// Log environment variables to verify they are loaded correctly
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key available:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No');
console.log('OVHcloud API Key available:', process.env.OVHCLOUD_API_KEY ? 'Yes' : 'No');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// OVHcloud API credentials and endpoints
const OVHCLOUD_API_KEY = process.env.OVHCLOUD_API_KEY;
const OVHCLOUD_EMBEDDING_BASE_URL = 'https://bge-base-en-v1-5.endpoints.kepler.ai.cloud.ovh.net';
const SINGLE_TEXT_ENDPOINT = '/api/text2vec';
const BATCH_TEXT_ENDPOINT = '/api/batch_text2vec'; 

// Function to get embeddings from OVHcloud API for a single text
async function getEmbedding(text) {
  try {
    // Add context for short genres to help the model
    const enhancedText = text.length < 10 ? 
      `Music genre: "${text}"` : 
      text;
    
    console.log(`Getting embedding for: "${enhancedText.substring(0, 50)}..."`);
    
    // Make up to 3 retry attempts
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        const response = await fetch(`${OVHCLOUD_EMBEDDING_BASE_URL}${SINGLE_TEXT_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OVHCLOUD_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            text: enhancedText
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API returned status ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        // Based on the API documentation, extract the embedding vector
        const embedding = result.embedding || result.embeddings || result;
        
        console.log(`Successfully received embedding of length: ${embedding.length}`);
        return embedding;
      } catch (error) {
        console.error(`Attempt ${attempts}/${maxAttempts} failed:`, error.message);
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // Wait longer between retries
        const delay = 2000 * attempts;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } catch (error) {
    console.error(`Error getting embedding for "${text}":`, error.message);
    throw error;
  }
}

// Function to get embeddings for a batch of texts (more efficient)
async function getBatchEmbeddings(texts) {
  try {
    console.log(`Getting embeddings for ${texts.length} texts as batch`);
    
    const response = await fetch(`${OVHCLOUD_EMBEDDING_BASE_URL}${BATCH_TEXT_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OVHCLOUD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        texts: texts
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Batch API returned status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    // Based on the API docs, extract the embeddings array
    const embeddings = result.embeddings || result;
    console.log(`Successfully received ${embeddings.length} embeddings`);
    
    return embeddings;
  } catch (error) {
    console.error(`Error in batch embedding:`, error.message);
    throw error;
  }
}

// Check if table exists and has correct dimensions
async function setupDatabase() {
  try {
    // Try to query the table
    const { error } = await supabase
      .from('spotify_genres')
      .select('id')
      .limit(1);
    
    // If table doesn't exist, create it
    if (error && error.code === '42P01') { // PostgreSQL code for undefined_table
      console.log('Creating spotify_genres table...');
      
      // Enable pgvector extension if not already enabled
      await supabase.rpc('pgcrypto', { 
        query: 'CREATE EXTENSION IF NOT EXISTS vector;' 
      });
      
      // Create table with correct dimensions for BGE model (768)
      await supabase.rpc('pgcrypto', { 
        query: `
          CREATE TABLE spotify_genres (
            id SERIAL PRIMARY KEY,
            genre TEXT UNIQUE NOT NULL,
            embedding VECTOR(768)
          );
          
          CREATE INDEX spotify_genres_embedding_idx 
          ON spotify_genres 
          USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100);
        `
      });
      
      // Create the matching function
      await supabase.rpc('pgcrypto', { 
        query: `
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
        `
      });
      
      console.log('Database setup completed');
    } else {
      console.log('spotify_genres table already exists');
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

async function processGenres() {
  try {
    // Ensure database is properly set up
    await setupDatabase();
    
    // Read the JSON file with Spotify genres
    console.log('Reading genres file...');
    const genresData = JSON.parse(fs.readFileSync('./data/spotify_genres.json', 'utf8'));
    const genres = Array.isArray(genresData) ? genresData : genresData.genres;
    
    console.log(`Processing ${genres.length} genres...`);
    
    // Track successful and failed genres
    const successful = [];
    const failed = [];
    
    // Process in batches
    const BATCH_SIZE = 10; // Adjust based on API limits
    
    for (let i = 0; i < genres.length; i += BATCH_SIZE) {
      const batch = genres.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(genres.length / BATCH_SIZE)} (genres ${i+1} to ${Math.min(i+BATCH_SIZE, genres.length)})`);
      
      try {
        // Enhance short text genres with context
        const enhancedTexts = batch.map(genre => 
          genre.length < 10 ? `Music genre: "${genre}"` : genre
        );
        
        // Get embeddings for the entire batch
        const embeddings = await getBatchEmbeddings(enhancedTexts);
        
        // Process each genre with its embedding
        for (let j = 0; j < batch.length; j++) {
          const genre = batch[j];
          const embedding = embeddings[j];
          
          try {
            console.log(`Inserting "${genre}" into database...`);
            const { error } = await supabase
              .from('spotify_genres')
              .upsert({ 
                genre, 
                embedding 
              });
            
            if (error) {
              console.error(`Error inserting ${genre}:`, error);
              failed.push(genre);
            } else {
              console.log(`Successfully processed: "${genre}"`);
              successful.push(genre);
            }
          } catch (err) {
            console.error(`Failed to insert genre "${genre}":`, err.message);
            failed.push(genre);
          }
        }
      } catch (batchError) {
        console.error(`Batch processing failed, falling back to individual processing:`, batchError.message);
        
        // Fall back to processing each genre individually
        for (const genre of batch) {
          try {
            console.log(`\nProcessing genre individually: "${genre}"`);
            const embedding = await getEmbedding(genre);
            
            const { error } = await supabase
              .from('spotify_genres')
              .upsert({ 
                genre, 
                embedding 
              });
            
            if (error) {
              console.error(`Error inserting ${genre}:`, error);
              failed.push(genre);
            } else {
              console.log(`Successfully processed: "${genre}"`);
              successful.push(genre);
            }
          } catch (err) {
            console.error(`Failed to process genre "${genre}":`, err.message);
            failed.push(genre);
          }
        }
      }
      
      // Add a longer delay between batches
      if (i + BATCH_SIZE < genres.length) {
        console.log('Waiting before starting next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n==== Processing Complete ====');
    console.log(`Successfully processed: ${successful.length}/${genres.length} genres`);
    console.log(`Failed to process: ${failed.length}/${genres.length} genres`);
    
    if (failed.length > 0) {
      console.log('\nFailed genres:');
      console.log(failed.join(', '));
      
      // Save failed genres to file for later retry
      fs.writeFileSync('./failed_genres.json', JSON.stringify(failed, null, 2));
    }
  } catch (error) {
    console.error('Error in processGenres:', error);
  }
}

// Start processing
console.log('Starting genre processing with OVHcloud embeddings...');
processGenres();