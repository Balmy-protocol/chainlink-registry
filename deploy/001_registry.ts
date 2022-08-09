import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from '@0xged/hardhat-deploy/types';
import { bytecode } from '../artifacts/contracts/ChainlinkRegistry/ChainlinkRegistry.sol/ChainlinkRegistry.json';
import { abi as FeedRegistryAbi } from '../artifacts/@chainlink/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol/FeedRegistryInterface.json';
import { deployThroughDeterministicFactory } from '@mean-finance/deterministic-factory/utils/deployment';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, msig } = await hre.getNamedAccounts();

  if (hre.deployments.getNetworkName() === 'ethereum') {
    // We will use the one operated by chainlink
    await hre.deployments.save('ChainlinkFeedRegistry', {
      abi: FeedRegistryAbi,
      address: '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf',
    });
  } else {
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
  }
};

deployFunction.tags = ['ChainlinkFeedRegistry'];
export default deployFunction;
