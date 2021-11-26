import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  await hre.deployments.deploy('FeedRegistry', {
    contract: 'contracts/ChainlinkRegistry/ChainlinkRegistry.sol:ChainlinkRegistry',
    from: deployer,
    args: [governor],
  });
};

deployFunction.tags = ['FeedRegistry'];
export default deployFunction;
