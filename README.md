# API Key Management Platform

A scalable API Key Management platform built with Node.js, Express, and MongoDB, featuring JWT for authentication.

## Features

- **API Key Management**: Generate, view, update, and revoke API keys per user
- **Gateway Proxy**: Route requests to external APIs through a unified gateway
- **Rate Limiting**: Control request rates per API key
- **Usage Tracking**: Monitor API usage with detailed metrics
- **Authentication**: Secure user authentication with JWT
- **MongoDB Integration**: Store and manage data related to users, keys, APIs, and usage logs

## Architecture

The application follows a modular architecture with:

- **Models**: MongoDB schemas for users, API keys, API catalog, and usage logs
- **Controllers**: Route handlers for authentication, API, and key management
- **Middleware**: Authentication, API key validation, rate limiting, and request proxying
- **Services**: Business logic for key management, metrics, and policy enforcement
- **Config**: Application and API configuration
- **Utils**: Reusable utility functions

## Prerequisites

- Node.js 14.x or higher
- MongoDB 4.x or higher

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/api-key-management.git
   cd api-key-management
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.example` and add your configuration:
   ```
   cp .env.example .env
   ```

4. Update the `.env` file with your MongoDB URI and JWT secret.

## Database Configuration

The platform uses MongoDB to store API configurations, API keys, and usage logs. The database schema includes:

- **User**: Stores user accounts with authentication details and roles
- **ApiCatalog**: Stores information about available APIs, their endpoints, and gateway configurations
- **ApiKey**: Stores user API keys with permissions and rate limits
- **UsageLog**: Tracks API usage and performance metrics

### Initial API Setup

The platform comes with a migration script to set up initial API configurations:

1. Edit the API configurations in `src/scripts/migrateApiConfig.js` to include your desired APIs
2. Run the migration script:
   ```
   node src/scripts/migrateApiConfig.js
   ```

This script will create or update API configurations in the database based on the static configurations defined in the file. By default, it includes:

- GitHub API
- OpenWeather API

You can modify the script to add more APIs or update the existing configurations.

### API Configuration Structure

Each API configuration includes:
- Basic information (name, slug, description)
- Base URL for proxying requests
- Endpoint documentation
- Authentication type
- Gateway configuration (rate limits, headers, etc.)

Example configuration:
```javascript
{
  name: 'GitHub API',
  slug: 'github',
  description: 'GitHub REST API for accessing GitHub resources',
  baseUrl: 'https://api.github.com',
  endpoints: [
    { path: '/users/:username', method: 'GET', description: 'Get a user' },
    // more endpoints...
  ],
  documentation: 'https://docs.github.com/en/rest',
  authType: 'apiKey',
  gatewayConfig: {
    requiresAuth: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  }
}
```

## Running the Application

1. Start the server in development mode:
   ```
   npm run dev
   ```

2. The API will be available at `http://localhost:5000`

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user and receive JWT token
- `GET /api/auth/me` - Get current user profile (requires authentication)

### API Catalog Endpoints

- `GET /api/apis` - Get all available APIs
- `GET /api/apis/:idOrSlug` - Get details for a specific API
- `POST /api/apis` - Add a new API (requires authentication)
- `PUT /api/apis/:id` - Update an API (requires authentication)
- `DELETE /api/apis/:id` - Deactivate an API (requires authentication)

### API Key Endpoints

- `GET /api/keys` - Get all your API keys (requires authentication)
- `GET /api/keys/:id` - Get a specific API key (requires authentication)
- `POST /api/keys` - Generate a new API key (requires authentication)
- `PUT /api/keys/:id` - Update an API key (requires authentication)
- `POST /api/keys/:id/revoke` - Revoke an API key (requires authentication)
- `GET /api/keys/:id/metrics` - Get usage metrics for a key (requires authentication)

### Gateway Endpoint

- `ALL /gateway/:apiName/*` - Make requests to external APIs (requires valid API key)

## Using the Gateway

To use the gateway proxy, include your API key in the request header and specify the target API:

```
curl -X GET "http://localhost:5000/gateway/github/users/octocat" \
  -H "x-api-key: your-api-key" 
```

## Rate Limiting

Rate limits are configurable per API key. Default rate limits are defined at the API level and can be overridden when creating or updating API keys.

## Monitoring

API usage is logged in the database and can be accessed through the metrics endpoints. The platform tracks:

- Request counts
- Response times
- Success/error rates
- Endpoint usage patterns

## Security Considerations

- JWT authentication with secure token handling
- API keys are securely generated and stored
- Rate limiting helps prevent abuse
- CORS and Helmet are configured for security
- Input validation is performed on all endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.