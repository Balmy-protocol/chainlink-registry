import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { networkBeingForked } from '@test-utils/evm';
import { IChainlinkRegistry__factory } from '@typechained';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  const network = hre.network.name !== 'hardhat' ? hre.network.name : networkBeingForked ?? hre.network.name;

  switch (network) {
    case 'mainnet':
    case 'kovan':
    case 'hardhat':
      await hre.deployments.save('FeedRegistry', {
        abi: IChainlinkRegistry__factory.abi,
        address: '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf',
      });
      break;
    default:
      await hre.deployments.deploy('FeedRegistry', {
        contract: 'contracts/ChainlinkRegistry/ChainlinkRegistry.sol:ChainlinkRegistry',
        from: deployer,
        args: [governor],
        log: true,
      });
      break;
  }
};

deployFunction.tags = ['FeedRegistry'];
export default deployFunction;
