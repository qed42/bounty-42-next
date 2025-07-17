# Bounty 42 Next

A modern Next.js application with Drupal authentication integration and GraphQL API communication.

> ⚠️ **This project is under active development** and features may change frequently.

## Features

- **Modern Stack**: Next.js 15 with React 19 and TypeScript
- **UI Components**: Tailwind CSS with shadcn/ui component library
- **Authentication**: Integrated Drupal authentication client
- **GraphQL**: URQL client for efficient API communication
- **Package Management**: pnpm for fast, efficient dependency management
- **Development Tools**: ESLint, Turbopack for fast development builds

## Prerequisites

- Node.js 18+ 
- pnpm 10.7.0+ (recommended package manager)
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bounty-42-next
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Create your environment file
   cp .env.example .env.local
   ```

4. **Configure Drupal authentication**
   Update your environment variables with your Drupal instance details:
   ```
   DRUPAL_URI=your-drupal-instance-url
   DRUPAL_CLIENT_ID=your-client-id
   DRUPAL_CLIENT_SECRET=your-client-secret
   ```

## Usage

### Development

Start the development server with Turbopack:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

Create a production build:
```bash
pnpm build
```

### Production

Start the production server:
```bash
pnpm start
```

### Linting

Run ESLint to check code quality:
```bash
pnpm lint
```

## Project Structure

```
bounty-42-next/
├── app/                    # Next.js app directory
│   ├── [[...slug]]/       # Dynamic catch-all routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout component
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
├── utils/                # Utility functions
│   ├── auth.ts          # Drupal authentication
│   ├── client.ts        # GraphQL client setup
│   └── calculate-path.ts # Path calculation utilities
├── public/              # Static assets
└── components.json      # shadcn/ui configuration
```

## Technology Stack

### Frontend
- **Next.js 15.4.1** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.0** - Type safety
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library

### Authentication & API
- **drupal-auth-client** - Drupal authentication integration
- **URQL** - GraphQL client with caching
- **@urql/core** - Core GraphQL functionality

### Development Tools
- **ESLint** - Code linting
- **Turbopack** - Fast development builds
- **pnpm** - Package manager

### UI Components
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **class-variance-authority** - Utility for component variants
- **clsx & tailwind-merge** - Conditional CSS classes

## Authentication

This project integrates with Drupal for authentication using OAuth2. The authentication flow:

1. Client credentials are configured in environment variables
2. `getToken()` function in `utils/auth.ts` handles token retrieval
3. `getClient()` function in `utils/client.ts` creates authenticated GraphQL client
4. All API requests include the Bearer token in headers

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the existing code style
3. Run linting: `pnpm lint`
4. Test your changes thoroughly
5. Submit a pull request

## Development Status

🚧 **Under Active Development** - This project is actively being developed with frequent updates and changes. Features and APIs may change without notice.

## License

This project is private and proprietary.
