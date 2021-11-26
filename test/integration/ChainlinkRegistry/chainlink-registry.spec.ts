import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { JsonRpcSigner } from '@ethersproject/providers';
import { wallet } from '@test-utils';
import evm, { snapshot } from '@test-utils/evm';
import { AggregatorV2V3Interface, ChainlinkRegistry } from '@typechained';
import { getNodeUrl } from '@utils/network';
import FEED_ABI from '@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json';
import { given, then, when } from '@test-utils/bdd';
import { expect } from 'chai';

type Keys = keyof AggregatorV2V3Interface['functions'] & keyof ChainlinkRegistry['functions'];
type Token = { address: string; name: string };

const LINK = { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', name: 'LINK' };
const MANA = { address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942', name: 'MANA' };
const FLOKI = { address: '0x43f11c02439e2736800433b4594994bd43cd066d', name: 'FLOKI' };

const USD = { address: '0x0000000000000000000000000000000000000348', name: 'USD' };
const ETH = { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', name: 'ETH' };

const PAIRS = [
  { base: LINK, quote: USD, feed: '0xDC530D9457755926550b59e8ECcdaE7624181557' },
  { base: MANA, quote: ETH, feed: '0x82A44D92D6c329826dc557c5E1Be6ebeC5D5FeB9' },
  { base: FLOKI, quote: USD, feed: '0xfBAFc1F5b1b37CC0763780453d1eA635520708f2' },
  { base: LINK, quote: ETH, feed: '0xDC530D9457755926550b59e8ECcdaE7624181557' },
];

const REDIRECT_FUNCTIONS: Keys[] = ['decimals', 'description', 'version', 'latestRoundData'];

describe('ChainlinkRegistry', () => {
  let governor: JsonRpcSigner;
  let registry: ChainlinkRegistry;
  let snapshotId: string;

  before(async () => {
    await evm.reset({
      jsonRpcUrl: getNodeUrl('mainnet'),
    });
    await deployments.fixture('FeedRegistry', { keepExistingDeployments: false });
    registry = await ethers.getContract('FeedRegistry');
    const namedAccounts = await getNamedAccounts();
    governor = await wallet.impersonate(namedAccounts.governor);
    snapshotId = await snapshot.take();
  });

  beforeEach('Deploy and configure', async () => {
    await snapshot.revert(snapshotId);
  });

  for (const { base, quote, feed: feedAddress } of PAIRS) {
    describe(`${base.name}/${quote.name}`, () => {
      let feed: AggregatorV2V3Interface;
      given(async () => {
        feed = await ethers.getContractAt(FEED_ABI, feedAddress);
        await registry.connect(governor).setFeedProxy(base.address, quote.address, feedAddress);
      });
      for (const method of REDIRECT_FUNCTIONS) {
        whenFunctionIsCalledThenResultIsTheSameInTheFeedAndTheRegistry({
          method,
          base,
          quote,
          feed: () => feed,
        });
      }
    });
  }

  function whenFunctionIsCalledThenResultIsTheSameInTheFeedAndTheRegistry({
    method,
    base,
    quote,
    feed,
  }: {
    method: Keys;
    base: Token;
    quote: Token;
    feed: () => AggregatorV2V3Interface;
  }) {
    when(`'${method}' is called`, () => {
      then('result is the same in the feed, and in the registry', async () => {
        const feedResult = await feed()[method]();
        const registryResult = await registry[method](base.address, quote.address);
        expect(feedResult).to.eql(registryResult);
      });
    });
  }
});
