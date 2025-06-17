import hre from 'hardhat';
const { ethers } = hre;

// Simple logger for deployment script
const log = {
  info: message => process.stdout.write(`[INFO] ${message}\n`),
  error: message => process.stderr.write(`[ERROR] ${message}\n`),
};

async function main() {
  log.info('🚀 Deploying ChargingConsensus contract...');

  // Get the ContractFactory and Signers here.
  const ChargingConsensus =
    await ethers.getContractFactory('ChargingConsensus');

  // Deploy the contract
  const chargingConsensus = await ChargingConsensus.deploy();

  // Wait for the contract to be deployed
  await chargingConsensus.deployed();

  log.info(`✅ ChargingConsensus deployed to: ${chargingConsensus.address}`);
  log.info(`📝 Transaction hash: ${chargingConsensus.deployTransaction.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    log.error('💥 Deployment failed:', error);
    process.exit(1);
  });
