// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../contracts/Aimnad.sol";

contract AimnadTest is Test {
    Aimnad public aimnad;

    address player = address(0xABCD);

    function setUp() public {
        aimnad = new Aimnad();
    }

    function testRegisterHitAndFinalize() public {
        // Before registering hits, should be 0
        uint256 initialHits = aimnad.getCurrentMatchHits(player);
        assertEq(initialHits, 0);

        // Register 3 hits
        aimnad.registerHit(player);
        aimnad.registerHit(player);
        aimnad.registerHit(player);

        uint256 hitsAfter3 = aimnad.getCurrentMatchHits(player);
        assertEq(hitsAfter3, 3);

        // Finalize match
        aimnad.finalizeMatch(player);

        // After finalizing, currentMatchHits should reset to 0
        uint256 resetHits = aimnad.getCurrentMatchHits(player);
        assertEq(resetHits, 0);

        // maxHitsInOneMatch should be updated to 3
        (, uint256[] memory maxHits) = aimnad.getLeaderboard();
        assertEq(maxHits[0], 3);
    }

    function testMultipleMatches() public {
        // Match 1 with 2 hits
        aimnad.registerHit(player);
        aimnad.registerHit(player);
        aimnad.finalizeMatch(player);

        (, uint256[] memory maxHits1) = aimnad.getLeaderboard();
        assertEq(maxHits1[0], 2);

        // Match 2 with 5 hits (new record)
        for (uint i = 0; i < 5; i++) {
            aimnad.registerHit(player);
        }
        aimnad.finalizeMatch(player);

        (, uint256[] memory maxHits2) = aimnad.getLeaderboard();
        assertEq(maxHits2[0], 5);

        // Match 3 with 1 hit (should not update record)
        aimnad.registerHit(player);
        aimnad.finalizeMatch(player);

        (, uint256[] memory maxHits3) = aimnad.getLeaderboard();
        assertEq(maxHits3[0], 5); // still 5 as record
    }
}
