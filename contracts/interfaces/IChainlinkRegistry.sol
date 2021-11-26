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

  /// @notice Returns the number of decimals present in the response value.
  /// @dev Will revert with `FeedNotFound` if no feed is found for the given base and quote
  /// @param _base The base asset address
  /// @param _quote The quote asset address
  /// @return The number of decimals in the response
  function decimals(address _base, address _quote) external view returns (uint8);

  /// @notice Returns the description of the underlying aggregator that the proxy points to.
  /// @dev Will revert with `FeedNotFound` if no feed is found for the given base and quote
  /// @param _base The base asset address
  /// @param _quote The quote asset address
  /// @return The description of the underlying aggregator
  function description(address _base, address _quote) external view returns (string memory);

  /// @notice Returns the version representing the type of aggregator the proxy points to.
  /// @dev Will revert with `FeedNotFound` if no feed is found for the given base and quote
  /// @param _base The base asset address
  /// @param _quote The quote asset address
  /// @return The version of the type of aggregator
  function version(address _base, address _quote) external view returns (uint256);

  /// @notice Returns the version representing the type of aggregator the proxy points to.
  /// @dev Will revert with `FeedNotFound` if no feed is found for the given base and quote
  /// @param _base The base asset address
  /// @param _quote The quote asset address
  /// @return _roundId The round ID
  /// @return _answer The price
  /// @return _startedAt Timestamp of when the round started
  /// @return _updatedAt Timestamp of when the round was updated
  /// @return _answeredInRound The round ID of the round in which the answer was computed
  function latestRoundData(address _base, address _quote)
    external
    view
    returns (
      uint80 _roundId,
      int256 _answer,
      uint256 _startedAt,
      uint256 _updatedAt,
      uint80 _answeredInRound
    );

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
