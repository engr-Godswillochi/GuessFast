// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GuessFast {
    address public owner;

    event Deposit(address indexed player, uint256 amount);
    event Withdrawal(address indexed to, uint256 amount);

    struct Tournament {
        uint256 id;
        uint256 entryFee;
        uint256 endTime;
        uint256 prizePool;
        address winner;
        bool isOpen;
        bool isPaidOut;
    }

    uint256 public tournamentCount;
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(address => uint256) public winnings;

    event TournamentCreated(uint256 indexed id, uint256 entryFee, uint256 endTime);
    event PlayerJoined(uint256 indexed tournamentId, address indexed player);
    event TournamentEnded(uint256 indexed tournamentId, address indexed winner, uint256 prizeAmount);
    event WinningsClaimed(address indexed player, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function createTournament(uint256 entryFee, uint256 duration) external {
        tournamentCount++;
        tournaments[tournamentCount] = Tournament({
            id: tournamentCount,
            entryFee: entryFee,
            endTime: block.timestamp + duration,
            prizePool: 0,
            winner: address(0),
            isOpen: true,
            isPaidOut: false
        });

        emit TournamentCreated(tournamentCount, entryFee, block.timestamp + duration);
    }

    function joinTournament(uint256 tournamentId) external payable {
        Tournament storage t = tournaments[tournamentId];
        require(t.isOpen, "Tournament not open");
        require(block.timestamp < t.endTime, "Tournament ended");
        require(msg.value == t.entryFee, "Incorrect entry fee");

        t.prizePool += msg.value;

        emit PlayerJoined(tournamentId, msg.sender);
    }

    function payout(uint256 tournamentId, address winner, bytes memory signature) external {
        Tournament storage t = tournaments[tournamentId];
        require(block.timestamp >= t.endTime, "Tournament not ended");
        require(!t.isPaidOut, "Already paid out");
        require(msg.sender == winner, "Only winner can claim");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(tournamentId, winner));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address signer = recoverSigner(ethSignedMessageHash, signature);
        require(signer == owner, "Invalid signature");
        
        t.winner = winner;
        t.isPaidOut = true;
        t.isOpen = false;

        if (t.prizePool > 0 && winner != address(0)) {
            // Transfer directly to winner (msg.sender is verified as winner above)
            (bool success, ) = payable(winner).call{value: t.prizePool}("");
            require(success, "Transfer failed");
        }

        emit TournamentEnded(tournamentId, winner, t.prizePool);
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function claimWinnings() external {
        uint256 amount = winnings[msg.sender];
        require(amount > 0, "No winnings to claim");

        winnings[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(msg.sender, amount);
    }
}
