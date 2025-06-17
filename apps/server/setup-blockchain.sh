#!/bin/bash

# Blockchain setup script for EV charging consensus system

echo "🚀 Setting up Ethereum blockchain for EV charging consensus..."

# Navigate to server directory
cd /Users/dsrs/Documents/Projects/worktrees/slaps_and_kisses/apps/server

# Check if Hardhat network is running
echo "📋 Checking Hardhat network status..."
if ! curl -s http://localhost:8545 > /dev/null; then
    echo "⚠️  Hardhat network not running. Please start it with:"
    echo "   cd apps/server && npx hardhat node"
    echo ""
    echo "💡 Or run this script to start it in background:"
    echo "   npx hardhat node > hardhat.log 2>&1 &"
    echo ""
else
    echo "✅ Hardhat network is running"
fi

# Compile contract
echo "🔨 Compiling smart contract..."
npx hardhat compile || {
    echo "❌ Failed to compile contract"
    echo "Creating contracts directory and compiling..."
    mkdir -p contracts
    npx hardhat compile
}

echo ""
echo "✅ Blockchain setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Make sure Hardhat network is running: npx hardhat node"
echo "2. Start the server: yarn dev"
echo "3. The server will automatically connect to the blockchain"
echo ""
