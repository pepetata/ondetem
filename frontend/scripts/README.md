# TMDB Movie Ads Seeder

This script populates your app with real movie data from The Movie Database (TMDB).

## What it does:

- 🎬 Fetches 200 popular movies from TMDB
- 👥 Creates 3 test users to distribute the ads
- 🏗️ Creates ads using movie titles, descriptions, and metadata
- 🖼️ Downloads and attaches 0-5 movie images per ad
- 🌍 Uses Portuguese descriptions when available
- 📍 Generates realistic Brazilian contact information

## Prerequisites:

1. **Backend must be running** in development mode:

   ```bash
   cd ../backend
   npm run dev
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

## Usage:

```bash
# Run the seeder
npm run seed:tmdb
```

## Test Users Created:

The script creates these test users (or uses existing ones):

1. **Cinema Lover** (cinema.lover@movieads.com) - Password: `MoviePass123!`
2. **Film Critic Pro** (film.critic@movieads.com) - Password: `CriticsChoice456!`
3. **Movie Collector** (movie.collector@movieads.com) - Password: `CollectorEdition789!`

## Generated Data:

- **Titles**: Real movie titles from TMDB
- **Descriptions**: Movie overviews and synopses
- **Images**: Movie posters and backdrops (0-5 per ad)
- **Tags**: Generated based on movie genres and ratings
- **Contact Info**: Realistic Brazilian addresses, phones, emails
- **Location**: Random Brazilian cities (São Paulo, Rio, etc.)

## Features:

- ✅ Rate-limited API calls to respect TMDB limits
- ✅ Error handling for failed requests
- ✅ Progress tracking during execution
- ✅ Automatic image download and upload
- ✅ Clean temporary file management
- ✅ Even distribution across test users

## Sample Output:

```
🎬 Starting TMDB Movie Ads Seeding...

👥 Creating test users...
✅ Created user: CinemaFan2024 (cinema.lover@movieads.com)
✅ Created user: FilmCritic (film.critic@movieads.com)
✅ Created user: MovieCollector (movie.collector@movieads.com)

👥 Ready with 3 users

🎬 Fetching movies from TMDB...
📄 Fetching page 1...
📄 Fetching page 2...
...
📊 Fetched 200 movies from TMDB

🏗️ Creating ads from movie data...

[1/200] Creating ad: "Avatar: The Way of Water" for cinema.lover@movieads.com
  ✅ Created ad with 3 images
[2/200] Creating ad: "Top Gun: Maverick" for film.critic@movieads.com
  ✅ Created ad with 5 images
...

🎉 Successfully created 200 movie ads!
👥 Distributed across 3 users
🖼️ Downloaded 650 images
```

## API Configuration:

The script uses your provided TMDB credentials:

- **API Key**: `adc1ee2dca7af5899e2aa613dd14a6c4`
- **Access Token**: `eyJhbGciOiJIUzI1NiJ9...` (configured in script)

## Notes:

- The script takes about 5-10 minutes to complete
- Images are temporarily downloaded and then uploaded to your app
- Each user gets approximately 67 ads (200 ÷ 3)
- Movie descriptions are fetched in Portuguese when available
- All temporary files are cleaned up after execution

## Troubleshooting:

- **Backend not running**: Make sure your backend is running on port 3000
- **TMDB rate limits**: The script includes delays to respect API limits
- **Image download fails**: Some images might fail, this is normal
- **Users already exist**: The script will try to login with existing users

Enjoy your movie-themed ad data! 🍿
