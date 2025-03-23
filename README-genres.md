# Spotify Complete Genres List

This README provides instructions for generating, viewing, and downloading a comprehensive list of Spotify genres using the included Python script and HTML test page.

## Overview

The Spotify Genres Test page is designed to help you explore the full range of genres available in Spotify's catalog, including official genre seeds and those found through artist metadata. The complete list contains around 6,000 genres, far more than the ~50 genres provided by the official recommendations API.

## Setup and Usage

### Prerequisites

- Python 3.6+
- Spotify Developer account with API credentials
- Node.js and npm (to run the Next.js project)

### Step 1: Get Spotify API Credentials

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new application
3. Note your Client ID and Client Secret

### Step 2: Edit the Python Script

1. Open `spotify-genres-python.py`
2. Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with the values from your Spotify Developer account:

```python
CLIENT_ID = 'your-client-id-here'
CLIENT_SECRET = 'your-client-secret-here'
```

### Step 3: Run the Python Script

```bash
python spotify-genres-python.py
```

This script will:
- Fetch genre seeds from Spotify's recommendations API
- Search for additional genres through artist metadata
- Explore related artists to find even more genres
- Save the complete list to `spotify-genres.json` in the current directory
- If the script detects a `public` directory (part of the Next.js project), it will also save a copy there

The script may take 5-10 minutes to run as it makes multiple API requests to gather as many genres as possible.

### Step 4: View the Results

There are two ways to view the results:

#### Method 1: Start the Next.js Development Server

```bash
npm run dev
```

Then navigate to:
```
http://localhost:3000/genre-test.html
```

#### Method 2: Open the HTML File Directly

If you're not running the Next.js server, you can simply open the HTML file directly in your browser:

```
public/genre-test.html
```

### Step 5: Use the Genre Test Page

The HTML page provides the following features:
- Display total number of genres found
- Preview the first 20 genres
- View the complete list organized alphabetically
- Download the full list in JSON or TXT format
- Interactive UI to explore genres by first letter

## Using the Genres in Your Application

Once you have the complete genres list, you can:

1. Use it as a replacement for the limited genre seeds API
2. Implement better auto-complete functionality for genre selection
3. Create more comprehensive music exploration tools
4. Analyze genre relationships and popularity

## Troubleshooting

If you encounter any issues:

- Ensure your Spotify API credentials are correct
- Check that you have a stable internet connection
- If API rate limiting occurs, the script has built-in delays to mitigate this
- For "Access Denied" errors, verify your Spotify Developer application has the correct settings

## Notes

- The Spotify Genre API may change over time, so the script might need updates
- The script uses several methods to gather genres, so the number of genres found may vary
- Some genres may be duplicated with slight variations (e.g., "hip hop" vs "hip-hop") 