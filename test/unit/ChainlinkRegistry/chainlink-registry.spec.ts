import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { behaviours, constants } from '@test-utils';
import { contract, given, then, when } from '@test-utils/bdd';
import { snapshot } from '@test-utils/evm';
import {
  AggregatorV2V3Interface,
  AggregatorV3Interface,
  ChainlinkRegistry,
  ChainlinkRegistry__factory,
  IAggregatorProxy,
  IERC20,
} from '@typechained';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { FakeContract, smock } from '@defi-wonderland/smock';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { BigNumber } from 'ethers';
import { readArgFromEventOrFail } from '@test-utils/event-utils';

chai.use(smock.matchers);

contract('ChainlinkRegistry', () => {
  const LINK = '0xa36085F69e2889c224210F603D836748e7dC0088';
  const USD = '0x0000000000000000000000000000000000000348';

  let superAdmin: SignerWithAddress, admin: SignerWithAddress;
  let feed: FakeContract<IAggregatorProxy>;
  let factory: ChainlinkRegistry__factory;
  let registry: ChainlinkRegistry;
  let token: FakeContract<IERC20>;
  let superAdminRole: string, adminRole: string;
  let snapshotId: string;

  before('Setup accounts and contracts', async () => {
    [, superAdmin, admin] = await ethers.getSigners();
    factory = await ethers.getContractFactory('contracts/ChainlinkRegistry/ChainlinkRegistry.sol:ChainlinkRegistry');
    registry = await factory.deploy(superAdmin.address, [admin.address]);
    superAdminRole = await registry.SUPER_ADMIN_ROLE();
    adminRole = await registry.ADMIN_ROLE();
    feed = await smock.fake('IAggregatorProxy');
    token = await smock.fake('IERC20');
    token.transfer.returns(true);
    snapshotId = await snapshot.take();
  });

  beforeEach('Deploy and configure', async () => {
    await snapshot.revert(snapshotId);
  });

  describe('constructor', () => {
    when('super admin is zero address', () => {
      then('tx is reverted with reason error', async () => {
        await behaviours.deployShouldRevertWithMessage({
          contract: factory,
          args: [constants.ZERO_ADDRESS, []],
          message: 'ZeroAddress',
        });
      });
    });
    when('all arguments are valid', () => {
      then('super admin is set correctly', async () => {
        const hasRole = await registry.hasRole(superAdminRole, superAdmin.address);
        expect(hasRole).to.be.true;
      });
      then('initial admins are set correctly', async () => {
        const hasRole = await registry.hasRole(adminRole, admin.address);
        expect(hasRole).to.be.true;
      });
      then('super admin role is set as super admin role', async () => {
        const admin = await registry.getRoleAdmin(superAdminRole);
        expect(admin).to.equal(superAdminRole);
      });
      then('super admin role is set as admin role', async () => {
        const admin = await registry.getRoleAdmin(adminRole);
        expect(admin).to.equal(superAdminRole);
      });
    });
  });

  describe('assignFeeds', () => {
    when('setting a feed', () => {
      let tx: TransactionResponse;
      given(async () => {
        tx = await registry.connect(admin).assignFeeds([{ base: LINK, quote: USD, feed: feed.address }]);
      });
      then('it is set correctly', async () => {
        const assignedFeed = await registry.getAssignedFeed(LINK, USD);
        expect(assignedFeed.feed).to.equal(feed.address);
        expect(assignedFeed.isProxy).to.equal(true);
      });
      then('event is emitted', async () => {
        await expectEventToHaveBeenEmitted(tx, feed.address);
      });
    });
    when('setting a feed that is not a proxy', () => {
      let tx: TransactionResponse;
      given(async () => {
        tx = await registry.connect(admin).assignFeeds([{ base: LINK, quote: USD, feed: registry.address }]);
      });
      then('it is set correctly', async () => {
        const assignedFeed = await registry.getAssignedFeed(LINK, USD);
        expect(assignedFeed.feed).to.equal(registry.address);
        expect(assignedFeed.isProxy).to.equal(false);
      });
      then('event is emitted', async () => {
        await expectEventToHaveBeenEmitted(tx, registry.address);
      });
    });
    when('removing a feed', () => {
      let tx: TransactionResponse;
      given(async () => {
        await registry.connect(admin).assignFeeds([{ base: LINK, quote: USD, feed: feed.address }]);
        tx = await registry.connect(admin).assignFeeds([{ base: LINK, quote: USD, feed: constants.ZERO_ADDRESS }]);
      });
      then('feed is removed correctly', async () => {
        const assignedFeed = await registry.getAssignedFeed(LINK, USD);
        expect(assignedFeed.feed).to.equal(constants.ZERO_ADDRESS);
        expect(assignedFeed.isProxy).to.equal(false);
      });
      then('event is emitted', async () => {
        await expectEventToHaveBeenEmitted(tx, constants.ZERO_ADDRESS);
      });
    });
    behaviours.shouldBeExecutableOnlyByRole({
      contract: () => registry,
      funcAndSignature: 'assignFeeds',
      params: () => [[{ base: constants.NOT_ZERO_ADDRESS, quote: constants.NOT_ZERO_ADDRESS, feed: constants.NOT_ZERO_ADDRESS }]],
      role: () => adminRole,
      addressWithRole: () => admin,
    });
    async function expectEventToHaveBeenEmitted(tx: TransactionResponse, feed: string) {
      const feeds: { base: string; quote: string; feed: string }[] = await readArgFromEventOrFail(tx, 'FeedsModified', 'feeds');
      expect(feeds.length).to.equal(1);
      expect(feeds[0].base).to.equal(LINK);
      expect(feeds[0].quote).to.equal(USD);
      expect(feeds[0].feed).to.equal(feed);
    }
  });

  describe('sendDust', () => {
    behaviours.shouldBeExecutableOnlyByRole({
      contract: () => registry,
      funcAndSignature: 'sendDust',
      params: () => [constants.NOT_ZERO_ADDRESS, token.address, 2000],
      role: () => adminRole,
      addressWithRole: () => admin,
    });
  });

  redirectTest({
    method: 'decimals',
    args: () => [LINK, USD],
    returnsWhenMocked: 18,
  });

  redirectTest({
    method: 'description',
    args: () => [LINK, USD],
    returnsWhenMocked: 'some random description',
  });

  redirectTest({
    method: 'version',
    args: () => [LINK, USD],
    returnsWhenMocked: BigNumber.from(2),
  });

  redirectTest({
    method: 'latestRoundData',
    args: () => [LINK, USD],
    returnsWhenMocked: [BigNumber.from(1), BigNumber.from(2), BigNumber.from(3), BigNumber.from(4), BigNumber.from(5)],
  });

  redirectTest({
    method: 'getRoundData',
    args: () => [LINK, USD, 1000],
    returnsWhenMocked: [BigNumber.from(1), BigNumber.from(2), BigNumber.from(3), BigNumber.from(4), BigNumber.from(5)],
  });

  redirectTest({
    method: 'latestAnswer',
    args: () => [LINK, USD],
    returnsWhenMocked: BigNumber.from(10),
  });

  redirectTest({
    method: 'latestTimestamp',
    args: () => [LINK, USD],
    returnsWhenMocked: BigNumber.from(20),
  });

  redirectTest({
    method: 'latestRound',
    args: () => [LINK, USD],
    returnsWhenMocked: BigNumber.from(30),
  });

  redirectTest({
    method: 'getAnswer',
    args: () => [LINK, USD, 1234],
    returnsWhenMocked: BigNumber.from(40),
  });

  redirectTest({
    method: 'getTimestamp',
    args: () => [LINK, USD, 1234],
    returnsWhenMocked: BigNumber.from(50),
  });

  /**
   * This test makes sure that when a method is called and the feed is not set, then the call reverts.
   * However, when the method is called and there is a feed set, then the return value is just redirected
   * from the feed, to the registry's caller
   */
  function redirectTest<Key extends keyof Functions, ReturnValue extends Awaited<ReturnType<Functions[Key]>>>({
    method,
    args,
    returnsWhenMocked: returnValue,
  }: {
    method: Key;
    args: () => Parameters<Functions[Key]>;
    returnsWhenMocked: Arrayed<ReturnValue> | ReturnValue;
  }) {
    describe(method, () => {
      when('feed is not set', () => {
        then(`calling ${method} will revert with message`, async () => {
          const [, ...other] = args();
          await behaviours.txShouldRevertWithMessage({
            contract: registry,
            func: method,
            args: [constants.NOT_ZERO_ADDRESS, ...other],
            message: 'FeedNotFound',
          });
        });
      });
      when('feed is set', () => {
        let result: any;
        given(async () => {
          await registry.connect(admin).assignFeeds([{ base: LINK, quote: USD, feed: feed.address }]);
          feed[method].returns(returnValue);
          result = await (registry[method] as any)(...args());
        });
        then('feed is called correctly', () => {
          const redirectedArgs = args().splice(2);
          if (redirectedArgs.length > 0) {
            expect(feed[method]).to.have.been.calledOnceWith(...redirectedArgs);
          } else {
            expect(feed[method]).to.have.been.calledOnce;
          }
        });
        then('return value from feed is returned through registry', async () => {
          expect(result).to.eql(returnValue);
        });
      });
    });
  }
  type Keys = keyof AggregatorV2V3Interface['functions'] & keyof ChainlinkRegistry['functions'];
  type Functions = Pick<AggregatorV2V3Interface['functions'] & ChainlinkRegistry['functions'], Keys>;
  type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
  type Arrayed<T> = T extends Array<infer U> ? U : T;
});
