// Configuration for external APIs that can be accessed through the gateway
const apis = {
  // Example API configurations
  github: {
    baseUrl: 'https://api.github.com',
    requiresAuth: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  weather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    requiresAuth: true,
    rateLimit: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000 // limit each IP to 1000 requests per windowMs
    }
  },
  // Add more APIs as needed
};

module.exports = apis;