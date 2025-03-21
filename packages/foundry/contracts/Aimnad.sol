//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "forge-std/console.sol";

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
// import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author BuidlGuidl
 */

contract Aimnad {
    struct PlayerStats {
        uint256 maxHitsInOneMatch;
        uint256 currentMatchHits;
    }

    mapping(address => PlayerStats) public playerStats;
    address[] public players;

    // Called every time the user hits a circle
    function registerHit(address wallet) external {
        if (
            playerStats[wallet].currentMatchHits == 0 &&
            playerStats[wallet].maxHitsInOneMatch == 0
        ) {
            players.push(wallet);
        }
        playerStats[wallet].currentMatchHits += 1;
    }

    // Called when the game finishes to finalize match and update record
    function finalizeMatch(address wallet) external {
        PlayerStats storage stats = playerStats[wallet];

        if (stats.currentMatchHits > stats.maxHitsInOneMatch) {
            stats.maxHitsInOneMatch = stats.currentMatchHits;
        }

        stats.currentMatchHits = 0;
    }

    // Leaderboard will now only show players & their best match (record)
    function getLeaderboard()
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        uint256[] memory maxHits = new uint256[](players.length);

        for (uint256 i = 0; i < players.length; i++) {
            maxHits[i] = playerStats[players[i]].maxHitsInOneMatch;
        }

        return (players, maxHits);
    }

    function getCurrentMatchHits(
        address wallet
    ) external view returns (uint256) {
        return playerStats[wallet].currentMatchHits;
    }
}
