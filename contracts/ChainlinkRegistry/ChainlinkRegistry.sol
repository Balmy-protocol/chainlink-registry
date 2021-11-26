// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.7 <0.9.0;

import '../interfaces/IChainlinkRegistry.sol';
import '../utils/Governable.sol';

contract ChainlinkRegistry is Governable, IChainlinkRegistry {
  mapping(address => mapping(address => address)) internal _feeds;

  constructor(address _governor) Governable(_governor) {}

  function getFeedProxy(address _base, address _quote) external view returns (AggregatorV3Interface) {
    address _feed = _feeds[_base][_quote];
    if (_feed == address(0)) revert FeedNotFound();
    return AggregatorV3Interface(_feed);
  }

  function setFeedProxy(
    address _base,
    address _quote,
    address _feed
  ) external onlyGovernor {
    if (address(_base) == address(0) || address(_quote) == address(0)) revert ZeroAddress();
    _feeds[_base][_quote] = _feed;
    emit FeedSet(_base, _quote, _feed);
  }
}
