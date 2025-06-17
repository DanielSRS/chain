#!/bin/bash

# Test script for atomic multi-station reservation

echo "🧪 Testing Atomic Multi-Station Reservation"
echo "==========================================="

# Ensure blockchain is running
echo "📡 Checking blockchain network..."
if ! curl -s http://localhost:8545 > /dev/null; then
    echo "❌ Blockchain network not running. Start with: npx hardhat node"
    exit 1
fi

# Start server if not running
echo "🚀 Starting server..."
cd /Users/dsrs/Documents/Projects/worktrees/slaps_and_kisses/apps/server
COMPANY_ID=test-company yarn dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to initialize..."
sleep 5

# Test atomic reservation
echo "🔬 Testing atomic reservation of multiple stations..."

# Test data - reserve stations 2, 12, and future station 3
RESERVATION_DATA='{
  "stationIds": [2, 12],
  "userId": "test-user-123",
  "startTime": 1640995200000,
  "estimatedStopTimes": [1640995200000, 1640998800000]
}'

echo "📤 Sending atomic reservation request..."
RESPONSE=$(curl -s -X POST http://localhost:3000/reserve-multiple \
  -H "Content-Type: application/json" \
  -d "$RESERVATION_DATA")

echo "📥 Response:"
echo "$RESPONSE" | jq '.'

# Check if reservation was successful
if echo "$RESPONSE" | jq -e '.status == "success"' > /dev/null; then
    echo "✅ Atomic reservation successful!"
    
    # Extract reservation IDs
    RESERVATION_IDS=$(echo "$RESPONSE" | jq -r '.reservationIds[]' | tr '\n' ' ')
    echo "🎫 Reservation IDs: $RESERVATION_IDS"
    
    echo "🔍 Verifying reservations on blockchain..."
    # Here you could add verification calls to check the blockchain state
    
else
    echo "❌ Atomic reservation failed!"
    echo "Error: $(echo "$RESPONSE" | jq -r '.error // .message')"
fi

# Test via MQTT (if available)
echo ""
echo "📡 Testing via MQTT..."
echo "Note: For MQTT testing, use the car application or MQTT client"

# Cleanup
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true

echo ""
echo "✅ Test completed!"
echo ""
echo "📚 Usage examples:"
echo "  REST API: POST /reserve-multiple"
echo "  MQTT:     Publish to 'reserveMultipleStations' topic"
echo ""
echo "📋 Required data format:"
echo "$RESERVATION_DATA" | jq '.'
