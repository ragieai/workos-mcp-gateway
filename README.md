# OAuth MCP Gateway

An MCP (Model Context Protocol) gateway for the Ragie Model Context Protocol server that implements OAuth authentication using WorkOS. This gateway enables secure access to Ragie's MCP services through OAuth 2.0 authentication flows.

## Overview

This gateway acts as a secure proxy between AI clients (like Claude, OpenAI, or Anthropic) and the Ragie MCP server. It provides:

- **OAuth 2.0 Authentication**: Secure user authentication via WorkOS
- **Bearer Token Validation**: JWT token verification for API access
- **Session Management**: Secure cookie-based session handling
- **Proxy Functionality**: Transparent forwarding of authenticated requests to Ragie MCP services
- **Well-Known Endpoints**: OAuth discovery endpoints for client integration

## Features

- 🔐 **Secure Authentication**: OAuth 2.0 flow with WorkOS integration
- 🛡️ **JWT Token Validation**: Automatic verification of bearer tokens
- 🍪 **Session Management**: Secure HTTP-only cookie sessions
- 🔄 **Request Proxying**: Seamless forwarding to Ragie MCP services
- 📋 **OAuth Discovery**: Well-known endpoints for OAuth metadata
- 🚀 **Production Ready**: Graceful shutdown, error handling, and logging
- 🧪 **Test Coverage**: Comprehensive test suite with Jest

## Prerequisites

- Node.js 18+
- npm or yarn
- WorkOS account and application setup
- Ragie API key and MCP server access

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd oauth-mcp-gateway
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template:
```bash
cp env.example .env
```

4. Configure your environment variables in `.env` (see Configuration section)

5. Build the project:
```bash
npm run build
```

## Configuration

The gateway requires several environment variables to be configured:

### Required Variables

- `BASE_URL`: The public URL of your gateway server
- `RAGIE_API_KEY`: Your Ragie API key for accessing MCP services
- `RAGIE_MCP_SERVER_URL`: The URL of the Ragie MCP server
- `WORKOS_API_KEY`: Your WorkOS API key
- `WORKOS_AUTHORIZATION_SERVER_URL`: Your WorkOS AuthKit authorization server URL
- `WORKOS_CLIENT_ID`: Your WorkOS application client ID
- `WORKOS_REDIRECT_URI`: The callback URL for OAuth flow (typically `{BASE_URL}/auth/callback`)
- `WORKOS_COOKIE_PASSWORD`: A secure random string for session encryption (generate with `openssl rand -hex 32`)
- `WORKOS_ORGANIZATION`: Your WorkOS organization ID

### Optional Variables

- `PORT`: Server port (defaults to 3000)
- `LOG_LEVEL`: Logging level - debug, info, warn, or error (defaults to info)
- `NODE_ENV`: Environment mode (development, production, etc.)

## Usage

### Development

Start the development server with hot reloading:
```bash
npm run dev
```

### Production

Build and start the production server:
```bash
npm run build
npm start
```

### Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## API Endpoints

### Authentication Endpoints

- `GET /auth/login` - Initiates OAuth login flow
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/logout` - Logs out the user

### OAuth Discovery Endpoints

- `GET /.well-known/oauth-protected-resource` - Returns OAuth protected resource metadata
- `GET /.well-known/oauth-authorization-server` - Returns OAuth authorization server metadata

### Protected Endpoints

- `/*/mcp` - Proxies requests to Ragie MCP server (requires bearer token)

## Authentication Flow

1. **User Login**: Users are redirected to `/auth/login` which initiates the WorkOS OAuth flow
2. **OAuth Callback**: After authentication, WorkOS redirects to `/auth/callback` with an authorization code
3. **Session Creation**: The gateway exchanges the code for tokens and creates a secure session cookie
4. **API Access**: Clients can access MCP endpoints using bearer tokens validated against WorkOS JWKS

## Security Features

- **HTTP-Only Cookies**: Session cookies are not accessible via JavaScript
- **Secure Cookies**: Cookies are only sent over HTTPS in production
- **SameSite Protection**: CSRF protection via SameSite cookie attribute
- **JWT Verification**: All bearer tokens are cryptographically verified
- **Token Refresh**: Automatic session refresh when tokens expire

## Development

### Project Structure

- **Gateway Class**: Main application logic and Express server setup
- **Configuration**: Environment-based configuration management
- **Logger**: Structured logging with configurable levels
- **Tests**: Comprehensive test coverage with mocked dependencies

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Start development server with hot reloading
- `npm start` - Start production server
- `npm run clean` - Clean build artifacts
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Integration with AI Clients

This gateway is designed to work with AI clients that support OAuth 2.0 and bearer token authentication. Clients should:

1. Discover OAuth endpoints via `/.well-known/oauth-protected-resource`
2. Implement OAuth 2.0 authorization code flow
3. Use bearer tokens for API requests to `/mcp/*` endpoints
4. Handle token refresh when tokens expire

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For issues and questions, please refer to the project's issue tracker or documentation.
