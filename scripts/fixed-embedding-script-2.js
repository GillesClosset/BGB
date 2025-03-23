require('dotenv').config({ path: './.env.local' });
// scripts/generate-embeddings.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Load environment variables from .env.local
require('dotenv').config({ path: './.env.local' });

// Log environment variables to verify they are loaded correctly
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key available:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No');
console.log('HuggingFace API Key available:', process.env.HUGGINGFACE_API_KEY ? 'Yes' : 'No');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// HuggingFace API for embeddings
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_URL = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';

async function getEmbedding(text) {
  try {
    // Add context for short genres to help the model
    const enhancedText = text.length < 10 ? 
      `Music genre: "${text}" is a style of music` : 
      text;
    
    console.log(`Getting embedding for: "${enhancedText.substring(0, 50)}..."`);
    
    // Make up to 3 retry attempts
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        const response = await fetch(MODEL_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputs: enhancedText })
        });
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`Successfully received embedding of length: ${result[0].length}`);
        return result[0]; // Return the embedding vector
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

async function processGenres() {
  try {
    // Read the JSON file with Spotify genres
    console.log('Reading genres file...');
    const genresData = JSON.parse(fs.readFileSync('./data/spotify_genres.json', 'utf8'));
    const genres = Array.isArray(genresData) ? genresData : genresData.genres;
    
    console.log(`Processing ${genres.length} genres...`);
    
    // Track successful and failed genres
    const successful = [];
    const failed = [];
    
    // Process in smaller batches to avoid rate limits
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < genres.length; i += BATCH_SIZE) {
      const batch = genres.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(genres.length / BATCH_SIZE)} (genres ${i+1} to ${Math.min(i+BATCH_SIZE, genres.length)})`);
      
      // Process each genre in the batch sequentially
      for (const genre of batch) {
        try {
          console.log(`\nProcessing genre: "${genre}"`);
          const embedding = await getEmbedding(genre);
          
          // Insert into Supabase
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
          console.error(`Failed to process genre "${genre}":`, err.message);
          failed.push(genre);
          // Continue with next genre rather than stopping
        }
        
        // Add a small delay to avoid rate limiting
        console.log('Waiting before processing next genre...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      console.log(`Completed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      
      // Add a longer delay between batches
      if (i + BATCH_SIZE < genres.length) {
        console.log('Waiting before starting next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('\n==== Processing Complete ====');
    console.log(`Successfully processed: ${successful.length}/${genres.length} genres`);
    console.log(`Failed to process: ${failed.length}/${genres.length} genres`);
    
    if (failed.length > 0) {
      console.log('\nFailed genres:');
      console.log(failed.join(', '));
    }
  } catch (error) {
    console.error('Error in processGenres:', error);
  }
}

// Start processing
console.log('Starting genre processing...');
processGenres();