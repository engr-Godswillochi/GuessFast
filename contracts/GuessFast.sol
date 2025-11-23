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
        require(msg.sender == owner, "Only owner");
        
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

    function payout(uint256 tournamentId, address winner) external {
        require(msg.sender == owner, "Only owner");
        Tournament storage t = tournaments[tournamentId];
        require(!t.isPaidOut, "Already paid out");
        
        t.winner = winner;
        t.isPaidOut = true;
        t.isOpen = false;

        if (t.prizePool > 0 && winner != address(0)) {
            winnings[winner] += t.prizePool;
        }

        emit TournamentEnded(tournamentId, winner, t.prizePool);
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
