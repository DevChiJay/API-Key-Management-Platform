# API Key Management Gateway - Copilot Instructions

## Project Overview
We're building an API key management gateway using Node.js, Express, Mongoose, and Axios. This system manages API keys, authenticates requests, routes them to appropriate services, and tracks usage.

## Tech Stack
- **Backend Framework**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **HTTP Client**: Axios for forwarding requests to backend services
- **Authentication**: Clerk for authentication

## Core Components
1. **API Key Management**
   - Generation, validation, and revocation of API keys
   - Rate limiting and usage tracking
   - Tiered access levels (free, basic, premium)

2. **Request Gateway**
   - Authentication middleware to validate API keys
   - Request forwarding to appropriate backend services
   - Response transformation and standardization

3. **Admin Dashboard**
   - User management and key administration
   - Usage analytics and reporting
   - Billing integration

4. **Database Schema**
   - Users (admin users who can manage API keys)
   - API Keys (with associated permissions and rate limits)
   - Usage Logs (tracking API calls and resource consumption)
   - Services (registered backend services and their endpoints)

## Common Patterns
- RESTful API design with consistent response format
- Middleware-based authentication and validation
- Async/await for database operations and external requests
- Robust error handling with appropriate status codes
- Environment-based configuration

## Preferred Code Style
- ES6+ features (arrow functions, destructuring, etc.)
- Modular architecture with separation of concerns
- Descriptive variable and function names
- JSDoc comments for functions and complex logic
- Async/await over promise chains

## Security Considerations
- API key hashing in the database
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Request logging for audit purposes

## Testing Approach
- Unit tests for core functionality
- Integration tests for API endpoints
- Mock external services for testing

## Additional Context
This gateway sits between client applications and our internal services, acting as a single point of entry that handles authentication, rate limiting, and request routing.