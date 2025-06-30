const axios = require("axios");

// App Configuration
const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance for our app
const appApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Clean database function
async function cleanDatabase() {
  console.log("🧹 Cleaning existing test data...");

  try {
    // Get all ads and delete them
    const adsResponse = await appApi.get("/ads");
    console.log(`Found ${adsResponse.data.length} existing ads to clean`);

    for (const ad of adsResponse.data) {
      try {
        await appApi.delete(`/ads/${ad.id}`);
      } catch (error) {
        // Ignore individual deletion errors
      }
    }

    // Get all users and delete test users
    const usersResponse = await appApi.get("/users");
    console.log(`Found ${usersResponse.data.length} existing users to clean`);

    for (const user of usersResponse.data) {
      if (user.email && user.email.includes("test")) {
        try {
          await appApi.delete(`/users/${user.id}`);
        } catch (error) {
          // Ignore individual deletion errors
        }
      }
    }

    console.log("✅ Database cleaned");
  } catch (error) {
    console.log(
      "⚠️ Database cleaning failed, but continuing...",
      error.message
    );
  }
}

// Minimal test users data
const testUsers = [
  {
    fullName: "Test User One",
    nickname: "TestUser1",
    email: "testuser1@example.com",
    password: "TestPassword123!",
  },
  {
    fullName: "Test User Two",
    nickname: "TestUser2",
    email: "testuser2@example.com",
    password: "TestPassword123!",
  },
];

// Minimal test ads - only what's needed for carousel and search tests
const testAds = [
  {
    title: "Produto de Teste 1",
    short: "Primeiro produto para testes",
    description:
      "Descrição do primeiro produto com palavras-chave beleza móveis construção",
    tags: "teste, produto, beleza",
    zipcode: "01001000",
    city: "São Paulo",
    state: "SP",
    phone1: "11999999999",
    email: "testuser1@example.com",
    images: [
      "https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Produto+1",
    ],
  },
  {
    title: "Produto de Teste 2",
    short: "Segundo produto para testes",
    description:
      "Descrição do segundo produto com palavras-chave pet restaurante negócio",
    tags: "teste, produto, pet",
    zipcode: "01001000",
    city: "São Paulo",
    state: "SP",
    phone1: "11999999998",
    email: "testuser2@example.com",
    images: [
      "https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Produto+2",
    ],
  },
  {
    title: "Produto de Beleza Premium",
    short: "Produto de beleza para testes",
    description: "Produto de beleza alta qualidade para cuidados especiais",
    tags: "beleza, cuidados, premium",
    zipcode: "01001000",
    city: "São Paulo",
    state: "SP",
    phone1: "11999999997",
    email: "testuser1@example.com",
    images: ["https://via.placeholder.com/400x300/45B7D1/FFFFFF?text=Beleza"],
  },
  {
    title: "Móvel Moderno Design",
    short: "Móveis para testes",
    description: "Móveis modernos para decoração contemporânea",
    tags: "móveis, design, moderno",
    zipcode: "01001000",
    city: "São Paulo",
    state: "SP",
    phone1: "11999999996",
    email: "testuser2@example.com",
    images: ["https://via.placeholder.com/400x300/96CEB4/FFFFFF?text=Moveis"],
  },
  {
    title: "Material de Construção",
    short: "Materiais para testes",
    description: "Materiais de construção para obras residenciais",
    tags: "construção, materiais, obras",
    zipcode: "01001000",
    city: "São Paulo",
    state: "SP",
    phone1: "11999999995",
    email: "testuser1@example.com",
    images: [
      "https://via.placeholder.com/400x300/FECA57/FFFFFF?text=Construcao",
    ],
  },
  {
    title: "Anúncio para Comentários",
    short: "Anúncio específico para testes de comentários",
    description:
      "Este anúncio é usado especificamente para testar funcionalidade de comentários",
    tags: "comentários, teste, funcional",
    zipcode: "01001000",
    city: "São Paulo",
    state: "SP",
    phone1: "11999999994",
    email: "testuser2@example.com",
    images: [
      "https://via.placeholder.com/400x300/FF9FF3/FFFFFF?text=Comentarios",
    ],
  },
  {
    title: "Anúncio para Favoritar",
    short: "Anúncio específico para testes de favoritos",
    description:
      "Este anúncio é usado especificamente para testar funcionalidade de favoritos",
    tags: "favoritos, teste, funcional",
    zipcode: "01001000",
    city: "São Paulo",
    state: "SP",
    phone1: "11999999993",
    email: "testuser1@example.com",
    images: [
      "https://via.placeholder.com/400x300/54A0FF/FFFFFF?text=Favoritos",
    ],
  },
];

async function createTestUser(userData) {
  try {
    console.log(`  Creating user: ${userData.email}`);
    const response = await appApi.post("/users", userData);
    console.log(`  ✅ User created: ${userData.email}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      // User already exists, try to get user info by logging in
      try {
        console.log(`  User already exists, logging in: ${userData.email}`);
        const loginResponse = await appApi.post("/auth/login", {
          email: userData.email,
          password: userData.password,
        });
        console.log(`  ✅ User login successful: ${userData.email}`);
        return { id: "existing", token: loginResponse.data.token };
      } catch (loginError) {
        console.log(
          `⚠️ User ${userData.email} exists but login failed:`,
          loginError.response?.data || loginError.message
        );
        return null;
      }
    }
    console.error(
      `❌ Error creating user ${userData.email}:`,
      error.response?.data || error.message
    );
    throw error;
  }
}

async function createTestAd(adData, userToken) {
  try {
    console.log(`    Creating ad: ${adData.title}`);

    const response = await appApi.post("/ads/test-seed", adData, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    console.log(`    ✅ Ad created with ID: ${response.data.adId}`);
    return response.data;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    const statusCode = error.response?.status;
    console.error(
      `❌ Error creating ad ${adData.title} (${statusCode}):`,
      JSON.stringify(errorDetails, null, 2)
    );
    return null;
  }
}

async function downloadPlaceholderImage(url, filename) {
  // For simplicity, we'll just create a reference to the placeholder image
  // In a real scenario, you might want to download and store actual images
  return filename;
}

async function addImagesToAd(adId, imageUrls, userToken) {
  // For minimal testing, we'll just log that images would be added
  console.log(
    `  📸 Would add ${imageUrls.length} placeholder images to ad ${adId}`
  );
  return imageUrls.length;
}

async function seedMinimalData() {
  console.log("🌱 Starting minimal E2E test data seeding...");

  try {
    // Step 0: Clean existing data first
    await cleanDatabase();

    // Step 1: Create test users
    console.log("👥 Creating minimal test users...");
    const createdUsers = [];

    for (const userData of testUsers) {
      const user = await createTestUser(userData);
      if (user) {
        // Get token for user
        const loginResponse = await appApi.post("/auth/login", {
          email: userData.email,
          password: userData.password,
        });
        user.token = loginResponse.data.token;
        createdUsers.push(user);
        console.log(`✅ User ready: ${userData.nickname} (${userData.email})`);
      }
    }

    console.log(`👥 Ready with ${createdUsers.length} users`);

    // Step 2: Create minimal test ads
    console.log("🏗️ Creating minimal test ads...");
    let adsCreated = 0;

    for (let i = 0; i < testAds.length; i++) {
      const adData = testAds[i];
      const user = createdUsers[i % createdUsers.length]; // Rotate between users

      console.log(
        `[${i + 1}/${testAds.length}] Creating ad: "${adData.title}"`
      );

      const ad = await createTestAd(adData, user.token);
      if (ad) {
        adsCreated++;

        // Add placeholder images for carousel testing
        if (adData.images && adData.images.length > 0) {
          await addImagesToAd(ad.id, adData.images, user.token);
        }

        console.log(
          `  ✅ Created ad with ${adData.images?.length || 0} placeholder images`
        );
      }
    }

    console.log(`🎉 Successfully created ${adsCreated} minimal test ads!`);
    console.log(`📊 Total: ${createdUsers.length} users, ${adsCreated} ads`);
    console.log("⚡ Minimal seeding completed - tests ready to run!");
  } catch (error) {
    console.error("❌ Minimal seeding failed:", error.message);
    throw error;
  }
}

// Only run if called directly
if (require.main === module) {
  seedMinimalData().catch(console.error);
}

module.exports = { seedMinimalData };
