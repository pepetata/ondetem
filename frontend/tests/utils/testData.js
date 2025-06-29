/**
 * Test data fixtures for consistent testing
 */

export const testUsers = {
  basicUser: {
    id: 1,
    nickname: "testuser",
    email: "test@example.com",
    fullName: "Test User",
    photo: null,
  },

  adminUser: {
    id: 2,
    nickname: "admin",
    email: "admin@example.com",
    fullName: "Admin User",
    photo: null,
  },

  userWithPhoto: {
    id: 3,
    nickname: "photouser",
    email: "photo@example.com",
    fullName: "Photo User",
    photo: "profile-photo.jpg",
  },
};

export const testAds = {
  basicAd: {
    id: 123,
    title: "Test Ad Title",
    description: "This is a test ad description",
    short: "Short description",
    cep: "12345678",
    address: "Rua Test, 123",
    neighborhood: "Test Neighborhood",
    city: "Test City",
    state: "TS",
    category: "services",
    subcategory: "cleaning",
    price: "100.00",
    userId: 1,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },

  adWithImages: {
    id: 124,
    title: "Ad with Images",
    description: "Ad that has images",
    cep: "87654321",
    userId: 1,
    images: [
      { id: 1, filename: "image1.jpg", url: "/uploads/image1.jpg" },
      { id: 2, filename: "image2.jpg", url: "/uploads/image2.jpg" },
    ],
  },

  adList: [
    {
      id: 1,
      title: "First Ad",
      description: "First test ad",
      cep: "11111111",
      userId: 1,
    },
    {
      id: 2,
      title: "Second Ad",
      description: "Second test ad",
      cep: "22222222",
      userId: 2,
    },
    {
      id: 3,
      title: "Third Ad",
      description: "Third test ad",
      cep: "33333333",
      userId: 1,
    },
  ],
};

export const testComments = {
  basicComment: {
    id: 1,
    content: "Great service!",
    userId: 2,
    adId: 123,
    createdAt: "2023-01-01T00:00:00.000Z",
  },

  commentList: [
    {
      id: 1,
      content: "Great service!",
      userId: 2,
      adId: 123,
      user: testUsers.basicUser,
      createdAt: "2023-01-01T00:00:00.000Z",
    },
    {
      id: 2,
      content: "Highly recommended!",
      userId: 3,
      adId: 123,
      user: testUsers.userWithPhoto,
      createdAt: "2023-01-02T00:00:00.000Z",
    },
  ],
};

export const testForms = {
  userForm: {
    valid: {
      fullName: "Test User",
      nickname: "testuser",
      email: "test@example.com",
      password: "password123",
      confirmpassword: "password123",
      useragreement: true,
    },

    invalid: {
      fullName: "",
      nickname: "te", // too short
      email: "invalid-email",
      password: "123", // too short
      confirmpassword: "different",
      useragreement: false,
    },
  },

  adForm: {
    valid: {
      title: "Valid Ad Title",
      description: "Valid ad description with enough characters",
      short: "Short description",
      cep: "12345678",
      address: "Rua Test, 123",
      neighborhood: "Test Neighborhood",
      city: "Test City",
      state: "TS",
      category: "services",
      subcategory: "cleaning",
      price: "100.00",
    },

    minimal: {
      title: "Minimal Ad",
      cep: "12345678",
    },

    invalid: {
      title: "", // required
      cep: "123", // invalid format
      description: "x".repeat(2000), // too long
    },
  },

  loginForm: {
    valid: {
      email: "test@example.com",
      password: "password123",
    },

    invalid: {
      email: "invalid-email",
      password: "",
    },
  },
};

export const testFormFields = {
  adFormFields: {
    title: {
      label: "Título",
      type: "text",
      name: "title",
      required: true,
      minLength: 3,
      maxLength: 100,
      placeholder: "Título do serviço, negócio, evento ou produto",
    },
    description: {
      label: "Descrição detalhada",
      type: "textarea",
      name: "description",
      maxLength: 1000,
      placeholder: "Descrição detalhada",
    },
    cep: {
      label: "CEP",
      type: "text",
      name: "cep",
      required: true,
      placeholder: "CEP",
      pattern: "\\d{8}",
    },
  },
};

export const testFiles = {
  imageFile: new File(["test image content"], "test-image.jpg", {
    type: "image/jpeg",
  }),

  textFile: new File(["test content"], "test.txt", {
    type: "text/plain",
  }),

  largeFile: new File(
    [new Array(6 * 1024 * 1024).fill("x").join("")],
    "large.jpg",
    {
      type: "image/jpeg",
    }
  ),
};
