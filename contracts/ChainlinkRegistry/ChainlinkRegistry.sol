// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.7 <0.9.0;

import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import '../interfaces/IChainlinkRegistry.sol';
import '../utils/Governable.sol';

contract ChainlinkRegistry is Governable, IChainlinkRegistry {
  mapping(address => mapping(address => address)) public feed;

  constructor(address _governor) Governable(_governor) {}

  function setFeed(
    address _base,
    address _quote,
    address _feed
  ) external onlyGovernor {
    if (address(_base) == address(0) || address(_quote) == address(0)) revert ZeroAddress();
    feed[_base][_quote] = _feed;
    emit FeedSet(_base, _quote, _feed);
  }
}
