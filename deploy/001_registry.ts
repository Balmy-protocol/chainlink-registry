import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { networkBeingForked } from '@test-utils/evm';
import { IFeedRegistry__factory } from '@typechained';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  const network = hre.network.name !== 'hardhat' ? hre.network.name : networkBeingForked ?? hre.network.name;

  switch (network) {
    case 'mainnet':
    case 'hardhat':
      await hre.deployments.save('FeedRegistry', {
        abi: IFeedRegistry__factory.abi,
        address: '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf',
      });
      break;
    case 'kovan':
      await hre.deployments.save('FeedRegistry', {
        abi: IFeedRegistry__factory.abi,
        address: '0xAa7F6f7f507457a1EE157fE97F6c7DB2BEec5cD0',
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
