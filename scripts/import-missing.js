const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xogokxeanaivkpreokod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ29reGVhbmFpdmtwcmVva29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzOTc1MDYsImV4cCI6MjA1Nzk3MzUwNn0.4YSBPpD7CwYffT9MSOiLvK2NFS565vHxIt6ObSYcV-c';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const CSV_FILE_PATH = './songs_with_attributes.csv';
const TABLE_NAME = 'songs_with_attributes';
const BATCH_SIZE = 50; // Small batch size to avoid timeouts
const DELAY_BETWEEN_BATCHES = 500; // ms delay between batches
const MAX_RECORDS_TO_IMPORT = 200000; // Limit to avoid overwhelming the database

// Sleep function to add delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importMissingRecords() {
  console.log('Starting import of missing records...');
  
  try {
    // Step 1: Fetch all existing record IDs from the database
    console.log('Fetching existing record IDs from the database...');
    
    // Creating a Set to efficiently check if an ID exists
    const existingIds = new Set();
    
    // We need to page through the results because there might be many records
    let page = 0;
    const pageSize = 10000;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`Fetching page ${page + 1} of IDs...`);
      
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        console.error('Error fetching existing IDs:', error);
        return;
      }
      
      if (data.length === 0) {
        hasMore = false;
      } else {
        // Add these IDs to our set
        data.forEach(record => existingIds.add(record.id));
        console.log(`Loaded ${existingIds.size} existing IDs so far...`);
        page++;
        
        // Slight delay to avoid rate limiting
        await sleep(100);
      }
    }
    
    console.log(`Found ${existingIds.size} existing records in the database.`);
    
    // Step 2: Process the CSV file and identify/import missing records
    console.log('Processing CSV file to find missing records...');
    
    // Create a function to import a batch of records
    async function importBatch(batch) {
      if (batch.length === 0) return;
      
      try {
        // Prepare the data for import
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
        
        // Import the batch
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .upsert(cleanedBatch, { onConflict: 'id' });
        
        if (error) {
          console.error('Error importing batch:', error);
          return false;
        }
        
        return true;
      } catch (err) {
        console.error('Error during batch import:', err);
        return false;
      }
    }
    
    // Process the CSV file
    return new Promise((resolve, reject) => {
      let currentBatch = [];
      let processedRows = 0;
      let missingRows = 0;
      let importedRows = 0;
      let importLimit = false;
      
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', async (row) => {
          processedRows++;
          
          // Log progress periodically
          if (processedRows % 100000 === 0) {
            console.log(`Processed ${processedRows} rows, found ${missingRows} missing records, imported ${importedRows} so far...`);
          }
          
          // Check if this record already exists
          if (!existingIds.has(row.id)) {
            missingRows++;
            
            // Skip if we've reached the import limit
            if (importedRows >= MAX_RECORDS_TO_IMPORT) {
              if (!importLimit) {
                console.log(`Reached maximum import limit of ${MAX_RECORDS_TO_IMPORT} records. Skipping remaining records.`);
                importLimit = true;
              }
              return;
            }
            
            // Add the record to the current batch
            currentBatch.push(row);
            
            // If we've reached the batch size, import it
            if (currentBatch.length >= BATCH_SIZE) {
              const batchToProcess = [...currentBatch];
              currentBatch = [];
              
              const success = await importBatch(batchToProcess);
              if (success) {
                importedRows += batchToProcess.length;
                console.log(`Imported batch of ${batchToProcess.length} records. Total imported: ${importedRows}`);
              }
              
              // Add a delay between batches
              await sleep(DELAY_BETWEEN_BATCHES);
            }
          }
        })
        .on('end', async () => {
          // Import any remaining records
          if (currentBatch.length > 0) {
            const success = await importBatch(currentBatch);
            if (success) {
              importedRows += currentBatch.length;
              console.log(`Imported final batch of ${currentBatch.length} records. Total imported: ${importedRows}`);
            }
          }
          
          console.log(`CSV processing complete.`);
          console.log(`Processed ${processedRows} total rows.`);
          console.log(`Found ${missingRows} missing records.`);
          console.log(`Successfully imported ${importedRows} records.`);
          
          resolve();
        })
        .on('error', (error) => {
          console.error('Error reading CSV:', error);
          reject(error);
        });
    });
  } catch (err) {
    console.error('Error during import of missing records:', err);
  }
}

importMissingRecords()
  .then(() => console.log('Missing records import complete!'))
  .catch(err => console.error('Import failed:', err)); 