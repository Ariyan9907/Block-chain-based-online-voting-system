pragma solidity ^0.5.15;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        string party; 
        uint voteCount;
    }

    mapping (uint => Candidate) public candidates;
    // Session-based voters mapping
    mapping (uint => mapping(address => bool)) public voters;

    uint public countCandidates;
    uint256 public votingEnd;
    uint256 public votingStart;
    uint public currentSession;

    function addCandidate(string memory name, string memory party) public  returns(uint) {
        countCandidates ++;
        candidates[countCandidates] = Candidate(countCandidates, name, party, 0);
        return countCandidates;
    }

    function vote(uint candidateID) public {
        // Only allow voting if now is between start and end date (inclusive)
        require(votingStart != 0 && votingEnd != 0, "Voting dates not set");
        require(now >= votingStart && now <= votingEnd, "Voting is not active");
        require(candidateID > 0 && candidateID <= countCandidates, "Invalid candidate");
        require(!voters[currentSession][msg.sender], "Already voted");
        voters[currentSession][msg.sender] = true;
        candidates[candidateID].voteCount ++;
    }

    function checkVote() public view returns(bool){
        return voters[currentSession][msg.sender];
    }

    function getCountCandidates() public view returns(uint) {
        return countCandidates;
    }

    function getCandidate(uint candidateID) public view returns (uint,string memory, string memory,uint) {
        return (candidateID,candidates[candidateID].name,candidates[candidateID].party,candidates[candidateID].voteCount);
    }

    function setDates(uint256 _startDate, uint256 _endDate) public {
        // Only allow setting dates in the future and end after start
        require(_startDate >= now, "Start date must be now or in the future");
        require(_endDate > _startDate, "End date must be after start date");
        // Delete all candidates from previous session
        for (uint i = 1; i <= countCandidates; i++) {
            delete candidates[i];
        }
        countCandidates = 0;
        votingStart = _startDate;
        votingEnd = _endDate;
        currentSession++;
    }

    function getDates() public view returns (uint256,uint256) {
      return (votingStart,votingEnd);
    }

    // Function to reset voting data after session ends
    function resetVoting() public {
        require(votingEnd != 0 && now > votingEnd, "Voting session not ended yet");
        // Delete all candidates
        for (uint i = 1; i <= countCandidates; i++) {
            delete candidates[i];
        }
        countCandidates = 0;
        votingStart = 0;
        votingEnd = 0;
        // Note: voters mapping is session-based and will be reset for new session
    }
}
