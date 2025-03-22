const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xogokxeanaivkpreokod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ29reGVhbmFpdmtwcmVva29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzOTc1MDYsImV4cCI6MjA1Nzk3MzUwNn0.4YSBPpD7CwYffT9MSOiLvK2NFS565vHxIt6ObSYcV-c';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const CSV_FILE_PATH = './songs_with_attributes.csv';
const BATCH_SIZE = 100; // Reduced batch size
const TABLE_NAME = 'songs_with_attributes';
const DELAY_BETWEEN_BATCHES = 500; // ms delay between batches to reduce load

// Count current records
async function countRecords() {
  try {
    const { count, error } = await supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error counting records:', error);
      return 0;
    }
    
    return count;
  } catch (err) {
    console.error('Error counting records:', err);
    return 0;
  }
}

// Sleep function to add delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importData() {
  // Check if the table exists
  console.log('Checking table and current record count...');
  
  try {
    const currentCount = await countRecords();
    console.log(`Table exists with ${currentCount} records already imported.`);
    
    // Check if the CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`CSV file not found at ${CSV_FILE_PATH}`);
      const currentDir = process.cwd();
      console.log(`Current directory: ${currentDir}`);
      console.log('Please ensure the songs_with_attributes.csv file is in the correct location.');
      return;
    }
    
    console.log(`Starting import from ${CSV_FILE_PATH}`);
    console.log(`Will import in smaller batches of ${BATCH_SIZE} rows with ${DELAY_BETWEEN_BATCHES}ms delay between batches`);
    
    let currentBatch = [];
    let totalRows = 0;
    let successfulRows = 0;
    let processedRows = 0;
    
    // Function to process a batch
    async function processBatch(batch) {
      if (batch.length === 0) return;
      
      console.log(`Processing batch of ${batch.length} rows...`);
      
      // Clean the data for each row
      const cleanedBatch = batch.map(row => {
        // Convert string values to appropriate types
        return {
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
        };
      });
      
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .upsert(cleanedBatch, { onConflict: 'id' });
        
        if (error) {
          console.error('Error inserting batch:', error);
          // Continue with the next batch
        } else {
          successfulRows += batch.length;
          console.log(`Batch inserted. Progress: ${successfulRows}/${totalRows} rows (${Math.round(successfulRows/totalRows*100)}%)`);
        }
        
        // Add delay between batches to avoid overloading the connection pool
        await sleep(DELAY_BETWEEN_BATCHES);
      } catch (err) {
        console.error('Unexpected error during batch insert:', err);
        // Still add the delay to avoid cascading failures
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }
    
    // Read and process the CSV file
    return new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', async (row) => {
          // Skip rows we've already processed based on count
          processedRows++;
          if (processedRows <= currentCount) {
            // Skip this row as it's likely already in the database
            return;
          }
          
          currentBatch.push(row);
          totalRows++;
          
          // Process in batches
          if (currentBatch.length >= BATCH_SIZE) {
            // Create a copy of the current batch
            const batchToProcess = [...currentBatch];
            // Clear the current batch immediately to continue collecting rows
            currentBatch = [];
            // Process the batch
            await processBatch(batchToProcess);
          }
        })
        .on('end', async () => {
          // Process any remaining rows
          if (currentBatch.length > 0) {
            await processBatch(currentBatch);
          }
          
          console.log('CSV file processing completed.');
          console.log(`Successfully imported ${successfulRows} out of ${totalRows} rows.`);
          console.log(`Total records in database: approximately ${currentCount + successfulRows}`);
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
importData()
  .then(() => console.log('Import complete!'))
  .catch(err => console.error('Import failed:', err)); 