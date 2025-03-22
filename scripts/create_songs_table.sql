-- Create the songs_with_attributes table
CREATE TABLE IF NOT EXISTS songs_with_attributes (
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

-- Create indexes for improved performance
CREATE INDEX IF NOT EXISTS idx_songs_name ON songs_with_attributes(name);
CREATE INDEX IF NOT EXISTS idx_songs_danceability ON songs_with_attributes(danceability);
CREATE INDEX IF NOT EXISTS idx_songs_energy ON songs_with_attributes(energy);
CREATE INDEX IF NOT EXISTS idx_songs_tempo ON songs_with_attributes(tempo); 