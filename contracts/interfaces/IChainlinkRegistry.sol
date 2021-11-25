// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.8.7 <0.9.0;

import './utils/IGovernable.sol';

interface IChainlinkRegistry is IGovernable {
  /// @notice Thrown when one of the parameters is a zero address
  error ZeroAddress();

  /// @notice Emitted when a feed is set
  /// @param base The base asset address
  /// @param quote The quote asset address
  /// @param feed The feed address
  event FeedSet(address base, address quote, address feed);

  /// @notice Returns the feed for a specific quote and base
  /// @param _base The base asset address
  /// @param _quote The quote asset address
  /// @return The feed's address. Will return the zero address if no feed is set
  function feed(address _base, address _quote) external view returns (address);

  /// @notice Sets a feed for a specific quote and base
  /// @param _base The base asset address
  /// @param _quote The quote asset address
  /// @param _feed The feed's address (could be the zero address to delete a feed)
  function setFeed(
    address _base,
    address _quote,
    address _feed
  ) external;
}
