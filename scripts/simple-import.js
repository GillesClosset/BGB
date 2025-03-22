const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xogokxeanaivkpreokod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ29reGVhbmFpdmtwcmVva29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzOTc1MDYsImV4cCI6MjA1Nzk3MzUwNn0.4YSBPpD7CwYffT9MSOiLvK2NFS565vHxIt6ObSYcV-c';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const CSV_FILE_PATH = './songs_with_attributes.csv';
const BATCH_SIZE = 50; // Very small batches to avoid timeouts
const TABLE_NAME = 'songs_with_attributes';
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay
const LOG_FREQUENCY = 100; // Only log every 100 batches

// Sleep function to add delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if the table exists by trying to select a single row
async function checkTable() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .limit(1);
    
    return !error;
  } catch (err) {
    console.error('Error checking table:', err);
    return false;
  }
}

async function importData() {
  try {
    // Check if table exists
    const tableExists = await checkTable();
    if (!tableExists) {
      console.error('Table does not exist. Please create it first with SQL.');
      return;
    }
    
    console.log('Table exists. Starting import...');
    
    // Check if file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`CSV file not found at ${CSV_FILE_PATH}`);
      return;
    }
    
    console.log(`Importing data from ${CSV_FILE_PATH} in batches of ${BATCH_SIZE}...`);
    console.log('This may take a while. We will log progress every few minutes.');
    
    let currentBatch = [];
    let totalProcessedRows = 0;
    let totalSuccessfulRows = 0;
    let batchCount = 0;
    let lastLogTime = Date.now();
    
    const logProgress = () => {
      const now = Date.now();
      // Only log if it's been more than 60 seconds since last log
      if (now - lastLogTime >= 60000 || totalProcessedRows % 10000 === 0) {
        console.log(`Processed ${totalProcessedRows} rows, successfully imported ${totalSuccessfulRows} rows`);
        lastLogTime = now;
      }
    };
    
    // Process a batch of records
    const processBatch = async (batch) => {
      batchCount++;
      
      try {
        // Clean the data
        const cleanedBatch = batch.map(row => ({
          id: row.id,
          name: row.name,
          album_name: row.album_name,
          artists: row.artists,
          danceability: parseFloat(row.danceability) || 0,
          energy: parseFloat(row.energy) || 0,
          key: parseInt(row.key, 10) || 0,
          loudness: parseFloat(row.loudness) || 0,
          mode: parseInt(row.mode, 10) || 0,
          speechiness: parseFloat(row.speechiness) || 0,
          acousticness: parseFloat(row.acousticness) || 0,
          instrumentalness: parseFloat(row.instrumentalness) || 0,
          liveness: parseFloat(row.liveness) || 0,
          valence: parseFloat(row.valence) || 0,
          tempo: parseFloat(row.tempo) || 0,
          duration_ms: parseInt(row.duration_ms, 10) || 0
        }));
        
        const { error } = await supabase
          .from(TABLE_NAME)
          .upsert(cleanedBatch, { onConflict: 'id' });
        
        if (error) {
          if (batchCount % LOG_FREQUENCY === 0) {
            console.error(`Batch ${batchCount} error:`, error.message);
          }
        } else {
          totalSuccessfulRows += batch.length;
        }
      } catch (err) {
        if (batchCount % LOG_FREQUENCY === 0) {
          console.error(`Batch ${batchCount} unexpected error:`, err.message);
        }
      }
      
      // Add delay between batches
      await sleep(DELAY_BETWEEN_BATCHES);
    };
    
    // Process the CSV file
    return new Promise((resolve, reject) => {
      let fileStream = fs.createReadStream(CSV_FILE_PATH);
      let parser = csv();
      
      fileStream
        .pipe(parser)
        .on('data', (row) => {
          currentBatch.push(row);
          totalProcessedRows++;
          
          // Process batch when it reaches the size limit
          if (currentBatch.length >= BATCH_SIZE) {
            const batchToProcess = [...currentBatch];
            currentBatch = [];
            
            processBatch(batchToProcess)
              .then(() => {
                // Log progress periodically
                logProgress();
              })
              .catch(err => {
                console.error('Error processing batch:', err);
              });
          }
        })
        .on('end', async () => {
          // Process any remaining rows
          if (currentBatch.length > 0) {
            await processBatch(currentBatch);
          }
          
          console.log('\nImport process completed!');
          console.log(`Total rows processed: ${totalProcessedRows}`);
          console.log(`Total rows successfully imported: ${totalSuccessfulRows}`);
          resolve();
        })
        .on('error', (error) => {
          console.error('Error reading CSV:', error);
          reject(error);
        });
    });
  } catch (err) {
    console.error('Top-level error during import:', err);
  }
}

// Run the import
console.log('Starting import process...');
importData()
  .then(() => console.log('Import complete!'))
  .catch(err => console.error('Import failed:', err)); 