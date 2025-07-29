#!/bin/bash

# AssetSync Backend Setup Script

echo "🚀 Setting up AssetSync Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please update the .env file with your actual database credentials"
else
    echo "✅ .env file already exists"
fi

echo "🗄️  Database setup instructions:"
echo "1. Make sure PostgreSQL is running"
echo "2. Create a database for AssetSync"
echo "3. Update the DATABASE_URL in .env file"
echo "4. Run: pnpm db:generate"
echo "5. Run: pnpm db:migrate"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "  pnpm dev"
echo ""
echo "To generate database migrations:"
echo "  pnpm db:generate"
echo ""
echo "To run migrations:"
echo "  pnpm db:migrate"
echo ""
echo "To open Drizzle Studio:"
echo "  pnpm db:studio"
echo ""
echo "📚 Check the README.md for more information!"
