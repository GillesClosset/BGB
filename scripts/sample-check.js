const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://xogokxeanaivkpreokod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ29reGVhbmFpdmtwcmVva29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzOTc1MDYsImV4cCI6MjA1Nzk3MzUwNn0.4YSBPpD7CwYffT9MSOiLvK2NFS565vHxIt6ObSYcV-c';
const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE_PATH = './songs_with_attributes.csv';
const TABLE_NAME = 'songs_with_attributes';
const SAMPLE_SIZE = 100; // Number of random rows to check

// Function to get a random sample of rows from the CSV
async function getSampleFromCsv() {
  return new Promise((resolve, reject) => {
    const allRows = [];
    
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        allRows.push(row);
      })
      .on('end', () => {
        // If there are fewer rows than our sample size, use all of them
        if (allRows.length <= SAMPLE_SIZE) {
          console.log(`CSV has only ${allRows.length} rows, using all of them as sample.`);
          resolve(allRows);
          return;
        }
        
        // Take a random sample
        const sample = [];
        const indices = new Set();
        
        while (indices.size < SAMPLE_SIZE) {
          const randomIndex = Math.floor(Math.random() * allRows.length);
          if (!indices.has(randomIndex)) {
            indices.add(randomIndex);
            sample.push(allRows[randomIndex]);
          }
        }
        
        console.log(`Randomly sampled ${sample.length} rows from CSV.`);
        resolve(sample);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Function to check if a row exists in the database
async function checkIfRecordExists(id) {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error(`Error checking if record ${id} exists:`, error);
      return false;
    }
    
    return data !== null;
  } catch (err) {
    console.error(`Exception checking if record ${id} exists:`, err);
    return false;
  }
}

// Main function to check the import progress
async function checkImportProgress() {
  console.log(`Starting import progress check using ${SAMPLE_SIZE} random samples...`);
  
  try {
    // Get a sample of rows from the CSV
    const sampleRows = await getSampleFromCsv();
    console.log(`Got ${sampleRows.length} sample rows.`);
    
    // Check which rows exist in the database
    let existingCount = 0;
    
    for (let i = 0; i < sampleRows.length; i++) {
      const row = sampleRows[i];
      const exists = await checkIfRecordExists(row.id);
      
      if (exists) {
        existingCount++;
      }
      
      // Log progress every 10 rows
      if ((i + 1) % 10 === 0 || i === sampleRows.length - 1) {
        console.log(`Checked ${i + 1}/${sampleRows.length} rows, ${existingCount} exist in database.`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate the percentage
    const existingPercentage = (existingCount / sampleRows.length) * 100;
    
    console.log(`\nResults:`);
    console.log(`${existingCount} out of ${sampleRows.length} sampled rows exist in the database.`);
    console.log(`Estimated import progress: ${existingPercentage.toFixed(2)}%`);
    
    if (existingPercentage === 100) {
      console.log('✅ Based on sampling, it appears all records have been imported!');
    } else {
      console.log(`⚠️ Based on sampling, approximately ${(100 - existingPercentage).toFixed(2)}% of records may still be missing.`);
    }
  } catch (err) {
    console.error('Error checking import progress:', err);
  }
}

checkImportProgress()
  .then(() => console.log('Check complete!'))
  .catch(err => console.error('Check failed:', err)); 