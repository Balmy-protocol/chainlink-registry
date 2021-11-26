// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.7 <0.9.0;

import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV2V3Interface.sol';
import './utils/IGovernable.sol';

interface IChainlinkRegistry is IGovernable {
  /// @notice Thrown when one of the parameters is a zero address
  error ZeroAddress();

  /// @notice Thrown when trying to execute a call with a base and quote that don't have a feed assigned
  error FeedNotFound();

  /// @notice Emitted when a feed is set
  /// @param base The base asset address
  /// @param quote The quote asset address
  /// @param feed The feed address
  event FeedSet(address base, address quote, address feed);

  /// @notice Returns the proxy feed for a specific quote and base
  /// @dev Will revert with `FeedNotFound` if no feed is found for the given base and quote
  /// @param _base The base asset address
  /// @param _quote The quote asset address
  /// @return The feed's address
  function getFeedProxy(address _base, address _quote) external view returns (AggregatorV2V3Interface);

  /// @notice Sets a proxy feed for a specific quote and base
  /// @param _base The base asset address
  /// @param _quote The quote asset address
  /// @param _feed The feed's address (could be the zero address to delete a feed)
  function setFeedProxy(
    address _base,
    address _quote,
    address _feed
  ) external;
}
