// At the top of your generate-embeddings.js file
require('dotenv').config({ path: './.env.local' });
// scripts/generate-embeddings.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Replace with your actual Supabase URL and service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// We'll use HuggingFace's Inference API for embeddings
// This is optional: you could also use OpenAI's embeddings API or a local model
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_URL = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';

async function getEmbedding(text) {
  const response = await fetch(MODEL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: text })
  });
  
  const result = await response.json();
  return result[0]; // Return the embedding vector
}

async function processGenres() {
  try {
    // Read the JSON file with 6000 Spotify genres
    const genresData = JSON.parse(fs.readFileSync('./data/spotify_genres.json', 'utf8'));
    const genres = Array.isArray(genresData) ? genresData : genresData.genres;
    
    console.log(`Processing ${genres.length} genres...`);
    
    // Process in batches to avoid rate limits
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < genres.length; i += BATCH_SIZE) {
      const batch = genres.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(genres.length / BATCH_SIZE)}`);
      
      // Generate embeddings for each genre in the batch
      for (const genre of batch) {
        try {
          const embedding = await getEmbedding(genre);
          
          // Insert into Supabase
          const { error } = await supabase
            .from('spotify_genres')
            .upsert({ 
              genre, 
              embedding 
            });
          
          if (error) {
            console.error(`Error inserting ${genre}:`, error);
          } else {
            console.log(`Successfully processed: ${genre}`);
          }
        } catch (err) {
          console.error(`Error processing genre "${genre}":`, err);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log(`Completed batch ${i / BATCH_SIZE + 1}`);
    }
    
    console.log('All genres processed successfully!');
  } catch (error) {
    console.error('Error in processGenres:', error);
  }
}

processGenres();