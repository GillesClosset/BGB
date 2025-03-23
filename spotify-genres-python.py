"""
Spotify Genre Fetcher - Python Version

This script demonstrates how to access Spotify's extensive genre taxonomy using their Web API.
You'll need to create a Spotify Developer account and register an application to get
client credentials (client_id and client_secret).
"""

import requests
import json
import time
import base64
import os
from typing import List, Set

# Step 1: Get Spotify API credentials
# Register your app at https://developer.spotify.com/dashboard/applications
CLIENT_ID = 'YOUR_CLIENT_ID'
CLIENT_SECRET = 'YOUR_CLIENT_SECRET'

def get_spotify_token() -> str:
    """Get an access token from Spotify API."""
    auth_string = f"{CLIENT_ID}:{CLIENT_SECRET}"
    auth_bytes = auth_string.encode('utf-8')
    auth_base64 = base64.b64encode(auth_bytes).decode('utf-8')
    
    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": f"Basic {auth_base64}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}
    
    response = requests.post(url, headers=headers, data=data)
    response.raise_for_status()
    json_result = response.json()
    
    return json_result["access_token"]

def get_available_genres(token: str) -> List[str]:
    """Get the list of available genre seeds from Spotify."""
    url = "https://api.spotify.com/v1/recommendations/available-genre-seeds"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    json_result = response.json()
    
    return json_result["genres"]

def get_detailed_genres(token: str) -> Set[str]:
    """Get a more detailed list of genres by searching for artists in different categories."""
    genre_prefixes = [
        'alternative', 'ambient', 'blues', 'classical', 'country', 
        'dance', 'electronic', 'folk', 'funk', 'hip-hop', 'indie', 
        'jazz', 'latin', 'metal', 'pop', 'punk', 'r&b', 'reggae', 
        'rock', 'soul', 'world', 'techno', 'trance', 'house', 'edm',
        'disco', 'drill', 'grime', 'trap', 'k-pop', 'j-pop', 'lo-fi',
        'experimental', 'afrobeat', 'reggaeton', 'salsa', 'flamenco',
        'opera', 'orchestral', 'vaporwave', 'synthwave', 'hardstyle',
        'hardcore', 'dubstep', 'drum-and-bass', 'garage', 'breakbeat'
    ]
    all_genres = set()
    headers = {"Authorization": f"Bearer {token}"}
    
    for prefix in genre_prefixes:
        print(f"Searching for {prefix} genres...")
        # Search for tracks in this genre
        search_url = f"https://api.spotify.com/v1/search?q=genre:{prefix}&type=track&limit=50"
        response = requests.get(search_url, headers=headers)
        
        if response.status_code != 200:
            print(f"Error searching for {prefix}: {response.status_code}")
            continue
            
        search_results = response.json()
        
        # Extract artist IDs from tracks
        artist_ids = []
        for item in search_results.get('tracks', {}).get('items', []):
            if item.get('artists') and len(item['artists']) > 0:
                artist_ids.append(item['artists'][0]['id'])
        
        # Get artist details including genres
        for artist_id in artist_ids[:5]:  # Limit to 5 artists per genre to avoid rate limiting
            artist_url = f"https://api.spotify.com/v1/artists/{artist_id}"
            artist_response = requests.get(artist_url, headers=headers)
            
            if artist_response.status_code != 200:
                continue
                
            artist_data = artist_response.json()
            artist_genres = artist_data.get('genres', [])
            all_genres.update(artist_genres)
            
        # Add delay to avoid rate limiting
        time.sleep(1)
    
    return all_genres

def explore_related_artists(token: str, seed_artist_ids: List[str], depth: int = 2) -> Set[str]:
    """Explore related artists to find more genres."""
    all_genres = set()
    explored_artists = set()
    headers = {"Authorization": f"Bearer {token}"}
    
    def explore_artist(artist_id, current_depth):
        if current_depth > depth or artist_id in explored_artists:
            return
            
        explored_artists.add(artist_id)
        
        # Get artist details including genres
        artist_url = f"https://api.spotify.com/v1/artists/{artist_id}"
        artist_response = requests.get(artist_url, headers=headers)
        
        if artist_response.status_code != 200:
            return
            
        artist_data = artist_response.json()
        artist_genres = artist_data.get('genres', [])
        all_genres.update(artist_genres)
        
        # Get related artists
        related_url = f"https://api.spotify.com/v1/artists/{artist_id}/related-artists"
        related_response = requests.get(related_url, headers=headers)
        
        if related_response.status_code != 200:
            return
            
        related_data = related_response.json()
        related_artists = [artist['id'] for artist in related_data.get('artists', [])]
        
        # Explore each related artist (up to 5 to avoid too many requests)
        for related_id in related_artists[:5]:
            explore_artist(related_id, current_depth + 1)
            
        # Add delay to avoid rate limiting
        time.sleep(0.5)
    
    # Start exploration from seed artists
    for artist_id in seed_artist_ids:
        explore_artist(artist_id, 0)
        
    return all_genres

def get_seed_artist_ids(token: str) -> List[str]:
    """Get a diverse set of popular artists to use as seeds for exploration."""
    # We'll search for popular artists in different genres
    genres = ['pop', 'rock', 'hip-hop', 'jazz', 'classical', 'electronic', 'country', 'metal']
    seed_artists = []
    headers = {"Authorization": f"Bearer {token}"}
    
    for genre in genres:
        search_url = f"https://api.spotify.com/v1/search?q=genre:{genre}&type=artist&limit=1"
        response = requests.get(search_url, headers=headers)
        
        if response.status_code != 200:
            continue
            
        search_results = response.json()
        artists = search_results.get('artists', {}).get('items', [])
        
        if artists:
            seed_artists.append(artists[0]['id'])
            
        time.sleep(0.5)  # Avoid rate limiting
        
    return seed_artists

def get_all_spotify_genres() -> List[str]:
    """Combine multiple methods to get a comprehensive list of Spotify genres."""
    try:
        # Get access token
        token = get_spotify_token()
        print("Successfully obtained Spotify access token")
        
        # Method 1: Get available genre seeds
        basic_genres = get_available_genres(token)
        print(f"Found {len(basic_genres)} genres from available-genre-seeds endpoint")
        
        # Method 2: Search for more detailed genres
        detailed_genres = get_detailed_genres(token)
        print(f"Found {len(detailed_genres)} genres from search API")
        
        # Method 3: Explore related artists for even more genres
        seed_artists = get_seed_artist_ids(token)
        related_genres = explore_related_artists(token, seed_artists)
        print(f"Found {len(related_genres)} genres from related artists exploration")
        
        # Combine all methods
        all_genres = set(basic_genres) | detailed_genres | related_genres
        print(f"Total unique genres: {len(all_genres)}")
        
        # Convert to sorted list
        genre_list = sorted(list(all_genres))
        
        return genre_list
    except Exception as e:
        print(f"Error fetching Spotify genres: {str(e)}")
        return []

def save_genres_to_file(genres: List[str], filename: str = "spotify-genres.json"):
    """Save the genres to a JSON file."""
    # Save to both the current directory and the public directory
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(genres, f, indent=2)
    print(f"Saved {len(genres)} genres to {filename}")
    
    # Also save to the public directory for the HTML test page
    public_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
    if os.path.exists(public_dir):
        public_path = os.path.join(public_dir, filename)
        with open(public_path, 'w', encoding='utf-8') as f:
            json.dump(genres, f, indent=2)
        print(f"Also saved to {public_path} for the test page")

if __name__ == "__main__":
    print("Starting Spotify genre fetcher...")
    genres = get_all_spotify_genres()
    
    if genres:
        # Save to file
        save_genres_to_file(genres)
        
        # Print sample of genres
        print("\nSample of genres:")
        for genre in genres[:20]:
            print(f"- {genre}")
        print(f"... and {len(genres) - 20} more")
        
        # Print instructions for viewing the results
        print("\nTo view the complete genre list:")
        print("1. Navigate to http://localhost:3000/genre-test.html in your browser")
        print("2. You can view and download all genres from that page")
    else:
        print("Failed to retrieve genres")
