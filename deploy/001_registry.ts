import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from '@0xged/hardhat-deploy/types';
import { bytecode } from '../artifacts/contracts/ChainlinkRegistry/ChainlinkRegistry.sol/ChainlinkRegistry.json';
import { deployThroughDeterministicFactory } from '@mean-finance/deterministic-factory/utils/deployment';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, msig } = await hre.getNamedAccounts();

  await deployThroughDeterministicFactory({
    deployer,
    name: 'ChainlinkFeedRegistry',
    salt: 'MF-Chainlink-Feed-Registry-V1',
    contract: 'contracts/ChainlinkRegistry/ChainlinkRegistry.sol:ChainlinkRegistry',
    bytecode,
    constructorArgs: {
      types: ['address', 'address[]'],
      values: [msig, [msig]],
    },
    log: !process.env.TEST,
    overrides: {
      gasLimit: 3_000_000,
    },
  });
};

deployFunction.tags = ['ChainlinkFeedRegistry'];
export default deployFunction;
