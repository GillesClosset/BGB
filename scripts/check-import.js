const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xogokxeanaivkpreokod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ29reGVhbmFpdmtwcmVva29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzOTc1MDYsImV4cCI6MjA1Nzk3MzUwNn0.4YSBPpD7CwYffT9MSOiLvK2NFS565vHxIt6ObSYcV-c';
const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE_PATH = './songs_with_attributes.csv';
const TABLE_NAME = 'songs_with_attributes';

async function countDatabaseRecords() {
  try {
    // Try using the count function directly
    const { data, error, count } = await supabase
      .from(TABLE_NAME)
      .select('id', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('Error counting records in database:', error);
      
      // Fallback method: get a small sample to verify connection
      console.log('Trying fallback method to verify connection...');
      const { data: sampleData, error: sampleError } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .limit(5);
      
      if (sampleError) {
        console.error('Error with fallback query:', sampleError);
        return null;
      }
      
      console.log('Connection verified. Sample data:', sampleData);
      
      // Try a direct SQL count if the API count fails
      console.log('Checking if data exists in the table...');
      return sampleData.length > 0 ? "Unknown (API count failed)" : 0;
    }
    
    return count;
  } catch (err) {
    console.error('Exception counting records:', err);
    return null;
  }
}

function countCsvRows() {
  return new Promise((resolve, reject) => {
    let rowCount = 0;
    
    if (!fs.existsSync(CSV_FILE_PATH)) {
      reject(new Error(`CSV file not found at ${CSV_FILE_PATH}`));
      return;
    }
    
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', () => {
        rowCount++;
        
        // Log progress every 100,000 rows
        if (rowCount % 100000 === 0) {
          console.log(`Counted ${rowCount} rows in CSV file so far...`);
        }
      })
      .on('end', () => {
        resolve(rowCount);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function checkImport() {
  console.log('Checking import status...');
  
  try {
    // Count records in the database
    console.log('Counting records in Supabase...');
    const dbCount = await countDatabaseRecords();
    
    if (dbCount === null) {
      console.error('Could not count records in the database. Check your connection settings.');
      return;
    }
    
    console.log(`Found ${dbCount} records in the Supabase database.`);
    
    // Count rows in the CSV file
    console.log('Counting rows in the CSV file...');
    const csvCount = await countCsvRows();
    console.log(`Found ${csvCount} rows in the CSV file.`);
    
    // Compare the counts
    const difference = csvCount - dbCount;
    
    if (difference === 0) {
      console.log('✅ SUCCESS: All rows have been imported correctly!');
    } else if (difference > 0) {
      console.log(`⚠️ WARNING: ${difference} rows are missing from the database.`);
      console.log(`Import progress: ${Math.round((dbCount / csvCount) * 100)}% complete`);
    } else {
      console.log(`⚠️ UNUSUAL: There are ${Math.abs(difference)} more records in the database than in the CSV file.`);
    }
  } catch (err) {
    console.error('Error checking import:', err);
  }
}

checkImport()
  .then(() => console.log('Check complete!'))
  .catch(err => console.error('Check failed:', err)); 