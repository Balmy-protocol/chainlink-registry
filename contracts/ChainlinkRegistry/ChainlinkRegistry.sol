// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.7 <0.9.0;

import '../interfaces/IChainlinkRegistry.sol';
import '../utils/Governable.sol';
import '../utils/CollectableDust.sol';

contract ChainlinkRegistry is Governable, CollectableDust, IChainlinkRegistry {
  mapping(bytes32 => AssignedFeed) internal _feeds;

  constructor(address _governor) Governable(_governor) {}

  /// @inheritdoc IChainlinkRegistry
  function getAssignedFeed(address _base, address _quote) external view returns (AssignedFeed memory) {
    return _feeds[_getKey(_base, _quote)];
  }

  /// @inheritdoc IChainlinkRegistry
  function assignFeeds(Feed[] calldata _feedsToAssign) external onlyGovernor {
    for (uint256 i = 0; i < _feedsToAssign.length; i++) {
      Feed memory _feed = _feedsToAssign[i];
      _feeds[_getKey(_feed.base, _feed.quote)] = AssignedFeed(AggregatorV2V3Interface(_feed.feed), _isProxy(_feed.feed));
    }
    emit FeedsModified(_feedsToAssign);
  }

  function sendDust(
    address _to,
    address _token,
    uint256 _amount
  ) external onlyGovernor {
    _sendDust(_to, _token, _amount);
  }

  function _getAssignedFeedOrFail(address _base, address _quote) internal view returns (AggregatorV2V3Interface) {
    AggregatorV2V3Interface _feed = _feeds[_getKey(_base, _quote)].feed;
    if (address(_feed) == address(0)) revert FeedNotFound();
    return _feed;
  }

  function _isProxy(address _feed) internal view returns (bool) {
    if (_feed == address(0)) return false;
    try IAggregatorProxy(_feed).aggregator() returns (address) {
      return true;
    } catch {
      return false;
    }
  }

  /// @inheritdoc IFeedRegistry
  function decimals(address _base, address _quote) external view returns (uint8) {
    return _getAssignedFeedOrFail(_base, _quote).decimals();
  }

  /// @inheritdoc IFeedRegistry
  function description(address _base, address _quote) external view returns (string memory) {
    return _getAssignedFeedOrFail(_base, _quote).description();
  }

  /// @inheritdoc IFeedRegistry
  function version(address _base, address _quote) external view returns (uint256) {
    return _getAssignedFeedOrFail(_base, _quote).version();
  }

  /// @inheritdoc IFeedRegistry
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
    return _getAssignedFeedOrFail(_base, _quote).latestRoundData();
  }

  function _getKey(address _base, address _quote) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(_base, _quote));
  }
}

interface IAggregatorProxy is AggregatorV2V3Interface {
  function aggregator() external view returns (address);
}
