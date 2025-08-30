// contracts/AgentOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentOracle {
    uint256 public value;
    event ValueUpdated(uint256 newValue, address indexed caller);

    function updateValue(uint256 newValue) external {
        value = newValue;
        emit ValueUpdated(newValue, msg.sender);
    }
}
