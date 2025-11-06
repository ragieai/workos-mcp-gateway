# Ragie MCP Gateway

A multi-tenant MCP (Model Context Protocol) gateway for the Ragie Model Context Protocol server that implements bearer token authentication using WorkOS. This gateway enables secure, organization-based access to Ragie's MCP services through JWT token validation and organization membership verification.

## Overview

This gateway acts as a secure proxy between AI clients (like Claude, OpenAI, or Anthropic) and the Ragie MCP server. It provides:

- **Bearer Token Authentication**: JWT token verification via WorkOS JWKS
- **Organization-Based Routing**: Multi-tenant routing with organization-scoped endpoints
- **Organization Membership Validation**: Verifies user membership in organizations via WorkOS
- **Optional Partition Mapping**: Maps organization IDs to Ragie partitions for flexible routing
- **Proxy Functionality**: Transparent forwarding of authenticated requests to Ragie MCP services
- **OAuth Discovery Endpoints**: Well-known endpoints for OAuth metadata discovery

## Features

- 🔐 **Bearer Token Authentication**: JWT token verification using WorkOS JWKS
- 🏢 **Multi-Tenant Architecture**: Organization-based routing and access control
- ✅ **Membership Validation**: Automatic verification of user membership in organizations
- 🗺️ **Flexible Routing**: Optional organization-to-partition mapping support
- 🔄 **Request Proxying**: Seamless forwarding to Ragie MCP services
- 📋 **OAuth Discovery**: Well-known endpoints for OAuth metadata
- 🚀 **Production Ready**: Graceful shutdown, error handling, and structured logging
- 🧪 **Test Coverage**: Comprehensive test suite with Jest

## Prerequisites

- Node.js 18+
- WorkOS account and application setup
- Ragie API key and MCP server access

## Installation

### Using npx (Recommended)

Run the gateway directly without installing:

```bash
npx @ragieai/mcp-gateway
```

### Global Installation

Install globally for system-wide access:

```bash
npm install -g @ragieai/mcp-gateway
```

Then run it from anywhere:

```bash
mcp-gateway
```

### Local Installation

Install as a dependency in your project:

```bash
npm install @ragieai/mcp-gateway
```

Then run it with:

```bash
npx mcp-gateway
```

Or add it to your `package.json` scripts:

```json
{
  "scripts": {
    "start:gateway": "mcp-gateway"
  }
}
```

### Development Setup

If you want to contribute or customize the gateway:

```bash
# Clone the repository
git clone <repository-url>
cd mcp-gateway

# Install dependencies
npm install

# Copy the environment template
cp env.example .env

# Configure your environment variables in .env (see Configuration section)

# Build the project
npm run build
```

## Configuration

The gateway requires several environment variables to be configured. You can set these via:

- Environment variables in your shell
- A `.env` file in the current directory (loaded automatically)
- Your deployment platform's environment configuration

### Required Variables

- `BASE_URL`: The public URL of your gateway server
- `RAGIE_API_KEY`: Your Ragie API key for accessing MCP services
- `RAGIE_MCP_SERVER_URL`: The URL of the Ragie MCP server
- `WORKOS_API_KEY`: Your WorkOS API key
- `WORKOS_AUTHORIZATION_SERVER_URL`: Your WorkOS AuthKit authorization server URL
- `WORKOS_CLIENT_ID`: Your WorkOS application client ID

### Optional Variables

- `PORT`: Server port (defaults to 3000)
- `LOG_LEVEL`: Logging level - debug, info, warn, or error (defaults to info)
- `NODE_ENV`: Environment mode (development, production, etc.)
- `MAPPING_FILE`: Path to a JSON file mapping organization IDs to Ragie partitions (optional)
- `STRICT_MAPPING`: Enable strict mapping mode - only organizations in the mapping file are allowed (defaults to false, requires `MAPPING_FILE`)

### Example `.env` File

```bash
BASE_URL=http://localhost:3000
RAGIE_API_KEY=your_ragie_api_key_here
RAGIE_MCP_SERVER_URL=https://api.ragie.ai/mcp/default
WORKOS_API_KEY=your_workos_api_key_here
WORKOS_AUTHORIZATION_SERVER_URL=https://api.workos.com/auth/v1
WORKOS_CLIENT_ID=your_workos_client_id_here
PORT=3000
LOG_LEVEL=info
NODE_ENV=production
# Optional: Organization mapping
MAPPING_FILE=mapping.json
STRICT_MAPPING=false
```

## Usage

### Basic Usage

Run the gateway with default settings:

```bash
npx @ragieai/mcp-gateway
```

The gateway will start on port 3000 (or the port specified in `PORT` environment variable).

### Organization Mapping

The gateway supports optional organization-to-partition mapping for flexible routing. Create a JSON mapping file:

```json
{
  "org_01K8BHJC61A42KN38TB98HZHTQ": "soc2",
  "org_01K8BHJC61A42KN38TB98HZHTQ2": "custom-partition"
}
```

Set the `MAPPING_FILE` environment variable to enable mapping:

```bash
MAPPING_FILE=mapping.json npx @ragieai/mcp-gateway
```

Or in your `.env` file:

```bash
MAPPING_FILE=mapping.json
```

### Strict Mapping Mode

When strict mapping is enabled, only organizations defined in the mapping file are allowed. Requests to unmapped organizations will return a 404 error. Set `STRICT_MAPPING=true`:

```bash
MAPPING_FILE=mapping.json STRICT_MAPPING=true npx @ragieai/mcp-gateway
```

Or in your `.env` file:

```bash
MAPPING_FILE=mapping.json
STRICT_MAPPING=true
```

### Example: Running with Environment Variables

```bash
BASE_URL=https://gateway.example.com \
RAGIE_API_KEY=your_key \
RAGIE_MCP_SERVER_URL=https://api.ragie.ai/mcp/default \
WORKOS_API_KEY=your_workos_key \
WORKOS_AUTHORIZATION_SERVER_URL=https://api.workos.com/auth/v1 \
WORKOS_CLIENT_ID=your_client_id \
MAPPING_FILE=mapping.json \
STRICT_MAPPING=false \
npx @ragieai/mcp-gateway
```

## API Endpoints

### OAuth Discovery Endpoints

- `GET /.well-known/oauth-protected-resource` - Returns OAuth protected resource metadata
- `GET /.well-known/oauth-authorization-server` - Returns OAuth authorization server metadata (proxied from WorkOS)

### Protected Endpoints

- `GET /:organizationId/mcp/*` - Proxies requests to Ragie MCP server (requires bearer token)

### Path Rewriting

When a mapping is configured, organization IDs are mapped to partitions:
- Without mapping: `/org_123/mcp/...` → `/mcp/org_123/...`
- With mapping: `/org_123/mcp/...` → `/mcp/soc2/...` (if `org_123` maps to `soc2`)

Organization IDs are automatically lowercased when no mapping exists.

## Authentication Flow

1. **Client obtains JWT**: Clients authenticate with WorkOS and receive a JWT bearer token
2. **Bearer Token**: Clients include the token in the `Authorization: Bearer <token>` header
3. **Token Verification**: The gateway verifies the JWT signature using WorkOS JWKS
4. **Membership Validation**: The gateway verifies the user is an active member of the requested organization
5. **Request Proxying**: Authenticated requests are proxied to the Ragie MCP server with the Ragie API key

## Security Features

- **JWT Verification**: All bearer tokens are cryptographically verified using WorkOS JWKS
- **Organization Membership**: Users must be active members of the organization they're accessing
- **API Key Injection**: Ragie API key is automatically injected in proxied requests
- **Error Handling**: Proper HTTP status codes and WWW-Authenticate headers for auth failures

## Development

### Project Structure

- **Gateway Class**: Main application logic and Express server setup
- **Configuration**: Environment-based configuration management with Zod validation
- **Logger**: Structured logging with configurable levels
- **Tests**: Comprehensive test coverage with mocked dependencies

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Start development server with hot reloading
- `npm start` - Start production server (after build)
- `npm run clean` - Clean build artifacts
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Integration with AI Clients

This gateway is designed to work with AI clients that support bearer token authentication. Clients should:

1. Authenticate users with WorkOS to obtain JWT tokens
2. Include bearer tokens in the `Authorization` header for all requests
3. Specify the organization ID in the URL path: `/{organizationId}/mcp/*`
4. Handle 401 responses with WWW-Authenticate headers for authentication errors
5. Discover OAuth endpoints via `/.well-known/oauth-protected-resource` if needed

### Example Request

```bash
curl -H "Authorization: Bearer <workos-jwt-token>" \
  https://gateway.example.com/org_123/mcp/retrieve
```

## Multi-Tenant Architecture

The gateway supports multi-tenant access through organization-based routing:

- Each organization has its own endpoint path
- Users must be members of the organization to access its endpoints
- Optional mapping allows organizations to share Ragie partitions
- Strict mapping mode restricts access to only mapped organizations

## Deployment

The gateway can be deployed to any platform that supports Node.js:

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

### Platform-Specific Guides

- **Heroku**: Set environment variables in Heroku dashboard and deploy
- **AWS Lambda**: Use AWS Lambda Node.js runtime with appropriate handler
- **Kubernetes**: Deploy as a containerized service with ConfigMaps for environment variables
- **Railway/Render/Fly.io**: Connect your repository and set environment variables

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
