const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xogokxeanaivkpreokod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ29reGVhbmFpdmtwcmVva29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzOTc1MDYsImV4cCI6MjA1Nzk3MzUwNn0.4YSBPpD7CwYffT9MSOiLvK2NFS565vHxIt6ObSYcV-c';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const CSV_FILE_PATH = './songs_with_attributes.csv';
const BATCH_SIZE = 1000; // How many rows to insert at once
const TABLE_NAME = 'songs_with_attributes';

// First let's create the table if it doesn't exist
async function createTable() {
  console.log('Creating table if it doesn\'t exist...');

  // We'll try to use the Supabase API to check if the table exists
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .limit(1);
  
  if (error && error.code === '42P01') { // Table doesn't exist
    console.error('Table does not exist. Please create it first using the SQL in create_songs_table.sql');
    console.log(`
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id TEXT PRIMARY KEY,
  name TEXT,
  album_name TEXT,
  artists TEXT,
  danceability NUMERIC(5,4),
  energy NUMERIC(5,4),
  key INTEGER,
  loudness NUMERIC(7,3),
  mode INTEGER,
  speechiness NUMERIC(5,4),
  acousticness NUMERIC(5,4),
  instrumentalness NUMERIC(5,4),
  liveness NUMERIC(5,4),
  valence NUMERIC(5,4),
  tempo NUMERIC(8,3),
  duration_ms INTEGER
);
    `);
    return false;
  } else if (error) {
    console.error('Error checking if table exists:', error);
    return false;
  }
  
  console.log('Table exists!');
  return true;
}

async function importData() {
  // First check if the table exists
  const tableExists = await createTable();
  if (!tableExists) {
    console.log('Please create the table first using the SQL query above, then run this script again.');
    return;
  }
  
  // Check if the CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`CSV file not found at ${CSV_FILE_PATH}`);
    const currentDir = process.cwd();
    console.log(`Current directory: ${currentDir}`);
    console.log('Please ensure the songs_with_attributes.csv file is in the correct location.');
    return;
  }
  
  console.log(`Starting import from ${CSV_FILE_PATH}`);
  console.log(`Will import in batches of ${BATCH_SIZE} rows`);
  
  let currentBatch = [];
  let totalRows = 0;
  let successfulRows = 0;
  
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
        danceability: parseFloat(row.danceability),
        energy: parseFloat(row.energy),
        key: parseInt(row.key, 10),
        loudness: parseFloat(row.loudness),
        mode: parseInt(row.mode, 10),
        speechiness: parseFloat(row.speechiness),
        acousticness: parseFloat(row.acousticness),
        instrumentalness: parseFloat(row.instrumentalness),
        liveness: parseFloat(row.liveness),
        valence: parseFloat(row.valence),
        tempo: parseFloat(row.tempo),
        duration_ms: parseInt(row.duration_ms, 10)
      };
    });
    
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
  }
  
  // Read and process the CSV file
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        currentBatch.push(row);
        totalRows++;
        
        // Process in batches
        if (currentBatch.length >= BATCH_SIZE) {
          processBatch([...currentBatch]);
          currentBatch = [];
        }
      })
      .on('end', async () => {
        // Process any remaining rows
        if (currentBatch.length > 0) {
          await processBatch(currentBatch);
        }
        
        console.log('CSV file processing completed.');
        console.log(`Successfully imported ${successfulRows} out of ${totalRows} rows.`);
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

// Run the import
importData()
  .then(() => console.log('Import complete!'))
  .catch(err => console.error('Import failed:', err)); 