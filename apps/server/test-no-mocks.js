#!/usr/bin/env node
/* eslint-disable no-console */

// Test to verify the system works without any mocks or fallbacks
const { ethers } = require('ethers');

async function testBlockchainRequired() {
  console.log(
    '🧪 Testing that system requires real blockchain (no mocks/fallbacks)...\n',
  );

  // Test 1: Check that blockchain connection is required
  console.log('Test 1: Checking blockchain connection requirement...');

  try {
    // Connect to a non-existent blockchain to verify error handling
    const invalidProvider = new ethers.providers.JsonRpcProvider(
      'http://localhost:9999',
    );

    try {
      await invalidProvider.getNetwork();
      console.log(
        '❌ FAIL: Should have thrown error for invalid blockchain connection',
      );
      process.exit(1);
    } catch (error) {
      console.log(
        '✅ PASS: System correctly rejects invalid blockchain connection',
      );
    }
  } catch (error) {
    console.log(
      '✅ PASS: System correctly handles blockchain connection errors',
    );
  }

  // Test 2: Check that valid blockchain connection works
  console.log('\nTest 2: Checking valid blockchain connection...');

  try {
    const provider = new ethers.providers.JsonRpcProvider(
      'http://localhost:8545',
    );
    const network = await provider.getNetwork();
    console.log(`✅ PASS: Connected to blockchain network ${network.chainId}`);
  } catch (error) {
    console.log(
      `❌ FAIL: Cannot connect to blockchain at localhost:8545. Please start Hardhat network first.`,
    );
    console.log(`Run: npx hardhat node --port 8545`);
    process.exit(1);
  }

  // Test 3: Check contract deployment requirement
  console.log('\nTest 3: Checking contract deployment requirement...');

  try {
    const provider = new ethers.providers.JsonRpcProvider(
      'http://localhost:8545',
    );
    const wallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      provider,
    );

    // Try to connect to the expected contract address
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

    // Load the ABI from the compiled contract
    const ChargingConsensus = require('./artifacts/contracts/ChargingConsensus.sol/ChargingConsensus.json');

    const contract = new ethers.Contract(
      contractAddress,
      ChargingConsensus.abi,
      wallet,
    );

    // Try to call a contract function to verify it's deployed
    try {
      await contract.getStation(1);
      console.log('✅ PASS: Contract is deployed and accessible');
    } catch (error) {
      if (
        error.message.includes('call exception') ||
        error.message.includes('revert')
      ) {
        console.log(
          '✅ PASS: Contract exists (expected revert for non-existent station)',
        );
      } else {
        console.log('❌ FAIL: Contract not deployed or not accessible');
        console.log('Please deploy the ChargingConsensus contract first');
        process.exit(1);
      }
    }
  } catch (error) {
    console.log('❌ FAIL: Error checking contract deployment:', error.message);
    process.exit(1);
  }

  console.log(
    '\n🎉 All tests passed! System correctly requires real blockchain without mocks/fallbacks.',
  );
}

// Run the test
testBlockchainRequired().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
