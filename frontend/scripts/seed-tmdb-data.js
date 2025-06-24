const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// TMDB Configuration
const TMDB_API_KEY = "adc1ee2dca7af5899e2aa613dd14a6c4";
const TMDB_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZGMxZWUyZGNhN2FmNTg5OWUyYWE2MTNkZDE0YTZjNCIsIm5iZiI6MTc1MDcxNDQ3Mi40NDUsInN1YiI6IjY4NTljODY4MjUxMTMwOGY5YTlhMjdlNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.gUx5_Ow1JI-Ex7Onnqp4sFYFuyTO8hu-k91xvYAGDjc";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// App Configuration
const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance for TMDB
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Create axios instance for our app
const appApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Test users data
const testUsers = [
  {
    fullName: "Cinema Lover",
    nickname: "CinemaFan2024",
    email: "cinema.lover@movieads.com",
    password: "MoviePass123!",
  },
  {
    fullName: "Film Critic Pro",
    nickname: "FilmCritic",
    email: "film.critic@movieads.com",
    password: "CriticsChoice456!",
  },
  {
    fullName: "Movie Collector",
    nickname: "MovieCollector",
    email: "movie.collector@movieads.com",
    password: "CollectorEdition789!",
  },
];

class TMDBSeeder {
  constructor() {
    this.users = [];
    this.createdAds = [];
    this.downloadedImages = new Set();
  }

  async init() {
    console.log("🎬 Starting TMDB Movie Ads Seeding...\n");

    try {
      // Step 1: Create test users
      await this.createUsers();

      // Step 2: Fetch movies from TMDB
      const movies = await this.fetchMovies(200);
      console.log(`📊 Fetched ${movies.length} movies from TMDB\n`);

      // Step 3: Create ads with images
      await this.createAdsFromMovies(movies);

      console.log(
        `\n🎉 Successfully created ${this.createdAds.length} movie ads!`
      );
      console.log(`👥 Distributed across ${this.users.length} users`);
      console.log(`🖼️ Downloaded ${this.downloadedImages.size} images`);
    } catch (error) {
      console.error("❌ Error during seeding:", error.message);
      throw error;
    }
  }

  async createUsers() {
    console.log("👥 Creating test users...");

    for (const userData of testUsers) {
      try {
        const response = await appApi.post("/users", userData);

        if (response.status === 201) {
          // Login to get token
          const loginResponse = await appApi.post("/auth/login", {
            email: userData.email,
            password: userData.password,
          });

          const user = {
            ...response.data,
            token: loginResponse.data.token,
            email: userData.email,
          };

          this.users.push(user);
          console.log(
            `✅ Created user: ${userData.nickname} (${userData.email})`
          );
        }
      } catch (error) {
        if (error.response?.status === 409) {
          // User already exists, try to login
          try {
            const loginResponse = await appApi.post("/auth/login", {
              email: userData.email,
              password: userData.password,
            });

            const user = {
              id: "existing",
              token: loginResponse.data.token,
              email: userData.email,
              nickname: userData.nickname,
            };

            this.users.push(user);
            console.log(
              `✅ Using existing user: ${userData.nickname} (${userData.email})`
            );
          } catch (loginError) {
            console.log(`⚠️ Could not login existing user: ${userData.email}`);
          }
        } else {
          console.log(
            `⚠️ Error creating user ${userData.email}:`,
            error.response?.data?.message || error.message
          );
        }
      }
    }

    console.log(`\n👥 Ready with ${this.users.length} users\n`);
  }

  async fetchMovies(count = 200) {
    console.log("🎬 Fetching movies from TMDB...");
    const movies = [];
    const maxPages = Math.ceil(count / 20); // TMDB returns 20 movies per page

    for (let page = 1; page <= maxPages && movies.length < count; page++) {
      try {
        console.log(`📄 Fetching page ${page}...`);

        const response = await tmdbApi.get("/movie/popular", {
          params: {
            page,
            language: "pt-BR", // Portuguese descriptions
          },
        });

        movies.push(...response.data.results);

        // Add delay to respect rate limits
        await this.delay(250);
      } catch (error) {
        console.log(`⚠️ Error fetching page ${page}:`, error.message);
      }
    }

    return movies.slice(0, count);
  }

  async createAdsFromMovies(movies) {
    console.log("🏗️ Creating ads from movie data...\n");

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      const userIndex = i % this.users.length; // Distribute across users
      const user = this.users[userIndex];

      try {
        console.log(
          `[${i + 1}/${movies.length}] Creating ad: "${movie.title}" for ${user.email}`
        );

        // Create the ad
        const adData = this.movieToAdData(movie);
        const ad = await this.createAd(adData, user);

        if (ad) {
          // Add random number of images (0-5)
          const imageCount = Math.floor(Math.random() * 6); // 0 to 5
          if (imageCount > 0 && movie.poster_path) {
            await this.addImagesToAd(ad.id, movie, imageCount, user);
          }

          this.createdAds.push(ad);
          console.log(`  ✅ Created ad with ${imageCount} images`);
        }

        // Add delay between requests
        await this.delay(500);
      } catch (error) {
        console.log(
          `  ❌ Error creating ad for "${movie.title}":`,
          error.message
        );
      }
    }
  }

  movieToAdData(movie) {
    // Generate contact info
    const phones = ["11987654321", "11876543210", "11765432109"];
    const cities = [
      "São Paulo",
      "Rio de Janeiro",
      "Belo Horizonte",
      "Brasília",
      "Salvador",
    ];
    const states = ["SP", "RJ", "MG", "DF", "BA"];
    const zipcodes = [
      "01001000",
      "20040020",
      "30112000",
      "70040010",
      "40020141",
    ];

    const randomIndex = Math.floor(Math.random() * cities.length);

    return {
      title: movie.title,
      short: movie.overview
        ? movie.overview.substring(0, 100) + "..."
        : "Filme imperdível do cinema!",
      description:
        movie.overview ||
        "Uma experiência cinematográfica única que você não pode perder. Este filme oferece entretenimento de alta qualidade com uma história envolvente e personagens memoráveis.",
      tags: this.generateTags(movie),
      zipcode: zipcodes[randomIndex],
      city: cities[randomIndex],
      state: states[randomIndex],
      address1: "Cinema Central",
      streetnumber: Math.floor(Math.random() * 999) + 1,
      phone1: phones[Math.floor(Math.random() * phones.length)],
      email: `contato.${movie.id}@cinemaads.com`,
      website: `https://cinema-${movie.id}.com.br`,
      timetext: "Sessões disponíveis todos os dias",
    };
  }

  generateTags(movie) {
    const tags = ["cinema", "filme", "entretenimento"];

    // Add genre-based tags
    if (movie.genre_ids) {
      const genreMap = {
        28: "ação",
        18: "drama",
        35: "comédia",
        27: "terror",
        10749: "romance",
        878: "ficção científica",
        53: "suspense",
        16: "animação",
        14: "fantasia",
        80: "crime",
      };

      movie.genre_ids.forEach((id) => {
        if (genreMap[id]) tags.push(genreMap[id]);
      });
    }

    // Add rating-based tags
    if (movie.vote_average >= 8) tags.push("premiado");
    if (movie.vote_average >= 7) tags.push("popular");

    return tags.join(", ");
  }

  async createAd(adData, user) {
    try {
      const response = await appApi.post("/ads", adData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to create ad: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async addImagesToAd(adId, movie, imageCount, user) {
    const imagePaths = [];

    // Collect possible image URLs
    if (movie.poster_path) imagePaths.push(movie.poster_path);
    if (movie.backdrop_path) imagePaths.push(movie.backdrop_path);

    // If we need more images, fetch additional ones from movie details
    if (imagePaths.length < imageCount) {
      try {
        const movieDetails = await tmdbApi.get(`/movie/${movie.id}/images`);
        const additionalImages = movieDetails.data.posters
          .concat(movieDetails.data.backdrops)
          .slice(0, imageCount - imagePaths.length);

        additionalImages.forEach((img) => {
          if (img.file_path) imagePaths.push(img.file_path);
        });

        await this.delay(250);
      } catch (error) {
        console.log(
          `    ⚠️ Could not fetch additional images: ${error.message}`
        );
      }
    }

    // Download and upload images
    const uploadedCount = Math.min(imageCount, imagePaths.length);
    for (let i = 0; i < uploadedCount; i++) {
      try {
        await this.downloadAndUploadImage(adId, imagePaths[i], user, i + 1);
      } catch (error) {
        console.log(`    ⚠️ Failed to upload image ${i + 1}: ${error.message}`);
      }
    }
  }

  async downloadAndUploadImage(adId, imagePath, user, imageIndex) {
    const imageUrl = `${TMDB_IMAGE_BASE_URL}${imagePath}`;
    const fileName = `movie-${adId}-${imageIndex}.jpg`;
    const tempPath = path.join(__dirname, "temp", fileName);

    try {
      // Create temp directory if it doesn't exist
      const tempDir = path.dirname(tempPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Download image
      const response = await axios.get(imageUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Upload to our app
      const formData = new FormData();
      formData.append("image", fs.createReadStream(tempPath));

      await appApi.post(`/ads/${adId}/images`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${user.token}`,
        },
      });

      this.downloadedImages.add(fileName);

      // Clean up temp file
      fs.unlinkSync(tempPath);
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Cleanup method
  async cleanup() {
    console.log("\n🧹 Cleaning up created data...");

    for (const user of this.users) {
      try {
        if (user.id !== "existing") {
          await appApi.delete(`/users/${user.id}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          console.log(`🗑️ Deleted user: ${user.email}`);
        }
      } catch (error) {
        console.log(`⚠️ Could not delete user ${user.email}: ${error.message}`);
      }
    }

    // Clean up temp directory
    const tempDir = path.join(__dirname, "temp");
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// Main execution
async function main() {
  const seeder = new TMDBSeeder();

  try {
    await seeder.init();
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on("SIGINT", async () => {
  console.log("\n⚠️ Received SIGINT, cleaning up...");
  // Note: In a real scenario, you might want to implement cleanup
  process.exit(0);
});

// Export for use as module or run directly
if (require.main === module) {
  main();
} else {
  module.exports = TMDBSeeder;
}
