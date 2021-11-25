// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.7 <0.9.0;

import './utils/IGovernable.sol';

interface IChainlinkRegistry is IGovernable {
  /// @notice Thrown when one of the parameters is a zero address
  error ZeroAddress();

  /// @notice Emitted when a feed is set
  /// @param quote The quote asset address
  /// @param base The base asset address
  /// @param feed The feed address
  event FeedSet(address quote, address base, address feed);

  /// @notice Returns the feed for a specific quote and base
  /// @param _quote The quote asset address
  /// @param _base The base asset address
  /// @return The feed's address. Will return the zero address if no feed is set
  function feed(address _quote, address _base) external view returns (address);

  /// @notice Sets a feed for a specific quote and base
  /// @param _quote The quote asset address
  /// @param _base The base asset address
  /// @param _base The feed's address (could be the zero address) to delete a feed
  function setFeed(
    address _quote,
    address _base,
    address _feed
  ) external;
}
