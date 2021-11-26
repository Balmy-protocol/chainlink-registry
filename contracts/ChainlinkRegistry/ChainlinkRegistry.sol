// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.7 <0.9.0;

import '../interfaces/IChainlinkRegistry.sol';
import '../utils/Governable.sol';
import '../utils/CollectableDust.sol';

contract ChainlinkRegistry is Governable, CollectableDust, IChainlinkRegistry {
  mapping(address => mapping(address => address)) internal _feeds;

  constructor(address _governor) Governable(_governor) {}

  function getFeedProxy(address _base, address _quote) public view returns (AggregatorV2V3Interface) {
    address _feed = _feeds[_base][_quote];
    if (_feed == address(0)) revert FeedNotFound();
    return AggregatorV2V3Interface(_feed);
  }

  function decimals(address _base, address _quote) external view returns (uint8) {
    return getFeedProxy(_base, _quote).decimals();
  }

  function description(address _base, address _quote) external view returns (string memory) {
    return getFeedProxy(_base, _quote).description();
  }

  function version(address _base, address _quote) external view returns (uint256) {
    return getFeedProxy(_base, _quote).version();
  }

  function latestRoundData(address _base, address _quote)
    external
    view
    returns (
      uint80,
      int256,
      uint256,
      uint256,
      uint80
    )
  {
    return getFeedProxy(_base, _quote).latestRoundData();
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

  function sendDust(
    address _to,
    address _token,
    uint256 _amount
  ) external onlyGovernor {
    _sendDust(_to, _token, _amount);
  }
}
