import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { behaviours, constants } from '@test-utils';
import { contract, given, then, when } from '@test-utils/bdd';
import { snapshot } from '@test-utils/evm';
import { AggregatorV3Interface, ChainlinkRegistry, ChainlinkRegistry__factory } from '@typechained';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signers';
import { FakeContract, smock } from '@defi-wonderland/smock';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { BigNumber } from 'ethers';

chai.use(smock.matchers);

contract('ChainlinkRegistry', () => {
  const LINK = '0xa36085F69e2889c224210F603D836748e7dC0088';
  const USD = '0x0000000000000000000000000000000000000348';

  let governor: SignerWithAddress;
  let feed: FakeContract<AggregatorV3Interface>;
  let registry: ChainlinkRegistry;
  let snapshotId: string;

  before('Setup accounts and contracts', async () => {
    [, governor] = await ethers.getSigners();
    const factory: ChainlinkRegistry__factory = await ethers.getContractFactory(
      'contracts/ChainlinkRegistry/ChainlinkRegistry.sol:ChainlinkRegistry'
    );
    registry = await factory.deploy(governor.address);
    feed = await smock.fake('AggregatorV3Interface');
    snapshotId = await snapshot.take();
  });

  beforeEach('Deploy and configure', async () => {
    await snapshot.revert(snapshotId);
  });

  describe('setFeedProxy', () => {
    when('zero address is sent for base address', () => {
      then('reverts with message', async () => {
        await behaviours.txShouldRevertWithMessage({
          contract: registry.connect(governor),
          func: 'setFeedProxy',
          args: [constants.ZERO_ADDRESS, USD, feed.address],
          message: 'ZeroAddress',
        });
      });
    });
    when('zero address is sent for quote address', () => {
      then('reverts with message', async () => {
        await behaviours.txShouldRevertWithMessage({
          contract: registry.connect(governor),
          func: 'setFeedProxy',
          args: [LINK, constants.ZERO_ADDRESS, feed.address],
          message: 'ZeroAddress',
        });
      });
    });
    when('setting a feed', () => {
      let tx: TransactionResponse;
      given(async () => {
        tx = await registry.connect(governor).setFeedProxy(LINK, USD, feed.address);
      });
      then('it is set correctly', async () => {
        expect(await registry.getFeedProxy(LINK, USD)).to.equal(feed.address);
      });
      then('event is emitted', async () => {
        await expect(tx).to.emit(registry, 'FeedSet').withArgs(LINK, USD, feed.address);
      });
    });
    when('removing a feed', () => {
      let tx: TransactionResponse;
      given(async () => {
        await registry.connect(governor).setFeedProxy(LINK, USD, feed.address);
        tx = await registry.connect(governor).setFeedProxy(LINK, USD, constants.ZERO_ADDRESS);
      });
      then('feed is removed correctly', async () => {
        await expect(registry.getFeedProxy(LINK, USD)).to.be.revertedWith('FeedNotFound');
      });
      then('event is emitted', async () => {
        await expect(tx).to.emit(registry, 'FeedSet').withArgs(LINK, USD, constants.ZERO_ADDRESS);
      });
    });
    behaviours.shouldBeExecutableOnlyByGovernor({
      contract: () => registry,
      funcAndSignature: 'setFeedProxy',
      params: () => [constants.NOT_ZERO_ADDRESS, constants.NOT_ZERO_ADDRESS, constants.NOT_ZERO_ADDRESS],
      governor: () => governor,
    });
  });

  redirectTest({
    method: 'decimals',
    returnsWhenMocked: 18,
  });

  redirectTest({
    method: 'description',
    returnsWhenMocked: 'some random description',
  });

  redirectTest({
    method: 'version',
    returnsWhenMocked: BigNumber.from(2),
  });

  redirectTest({
    method: 'latestRoundData',
    returnsWhenMocked: [BigNumber.from(1), BigNumber.from(2), BigNumber.from(3), BigNumber.from(4), BigNumber.from(5)],
  });

  /**
   * This test makes sure that when a method is called and the feed is not set, then the call reverts.
   * However, when the method is called and there is a feed set, then the return value is just redirected
   * from the feed, to the registry's caller
   */
  function redirectTest<Key extends keyof Functions>({
    method,
    returnsWhenMocked: returnValue,
  }: {
    method: Key;
    returnsWhenMocked: Awaited<ReturnType<Functions[Key]>>;
  }) {
    describe(method, () => {
      when('feed proxy is not set', () => {
        then(`calling ${method} will revert with message`, async () => {
          await behaviours.txShouldRevertWithMessage({
            contract: registry,
            func: method,
            args: [constants.NOT_ZERO_ADDRESS, USD],
            message: 'FeedNotFound',
          });
        });
      });
      when('feed registry is set', () => {
        given(async () => {
          await registry.connect(governor).setFeedProxy(LINK, USD, feed.address);
          feed[method].returns(returnValue);
        });
        then('return value from feed proxy is returned through registry', async () => {
          const result = await registry[method](LINK, USD);
          expect(result).to.eql(returnValue);
        });
      });
    });
  }
  type Keys = keyof AggregatorV3Interface['functions'] & keyof ChainlinkRegistry['functions'];
  type Functions = Pick<AggregatorV3Interface & ChainlinkRegistry, Keys>;
  type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
});
