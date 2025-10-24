# Ragie MCP Gateway

A TypeScript-based MCP (Model Context Protocol) server gateway that demonstrates how to integrate with clients like Claude and OpenAI.

## Features

- 🚀 **TypeScript**: Full TypeScript support with strict type checking
- 🏗️ **Modular Architecture**: Clean separation of concerns with organized modules
- 📝 **Comprehensive Logging**: Structured logging with configurable levels
- 🧪 **Testing**: Jest-based testing with coverage reporting
- 🔧 **Development Tools**: ESLint, Prettier, and TypeScript compiler
- 📦 **Build System**: Automated build and development workflows

## Project Structure

```
src/
├── gateway/
│   └── Gateway.ts          # Main gateway implementation
├── utils/
│   └── Logger.ts          # Logging utility
├── types/
│   └── index.ts           # TypeScript type definitions
├── __tests__/
│   ├── setup.ts           # Test setup
│   └── Gateway.test.ts    # Gateway tests
└── index.ts               # Main entry point
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the gateway:
```bash
npm start
```

### Development

For development with hot reloading:

```bash
npm run dev:start
```

This will compile TypeScript on-the-fly and restart the server when files change.

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for TypeScript compilation
- `npm start` - Run the compiled JavaScript
- `npm run dev:start` - Run TypeScript directly with ts-node
- `npm run clean` - Clean the dist directory
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Configuration

The gateway can be configured through the constructor:

```typescript
const gateway = new Gateway({
  port: 3000,
  host: 'localhost',
  logLevel: 'info',
  maxConnections: 100,
  timeout: 30000,
});
```

## API

### Gateway Class

The main `Gateway` class provides the following methods:

- `initialize()` - Initialize the gateway
- `start()` - Start the gateway
- `stop()` - Stop the gateway
- `processRequest(request)` - Process MCP requests
- `getStats()` - Get gateway statistics
- `isActive()` - Check if gateway is running

### Request/Response Format

The gateway processes MCP requests in the following format:

```typescript
interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
  timestamp: Date;
}

interface MCPResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  timestamp: Date;
}
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Code Quality

The project includes:

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Jest**: Testing framework

## License

MIT


