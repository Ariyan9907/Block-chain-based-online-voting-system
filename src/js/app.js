        $('#resetVoting').click(async function() {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const from = accounts[0];
            
            // Get contract instance
            const instance = await VotingContract.deployed();
            
            // Get voting dates and current session
            const dates = await instance.getDates();
            const sessionNumber = await instance.currentSession();
            const countCandidates = await instance.getCountCandidates();
            
            // Collect all candidate data from blockchain
            const candidates = [];
            for (let i = 1; i <= countCandidates; i++) {
              const candidateData = await instance.getCandidate(i);
              candidates.push({
                id: candidateData[0].toNumber(),
                name: candidateData[1],
                party: candidateData[2],
                voteCount: candidateData[3].toNumber()
              });
            }
            
            // Save session results to database before resetting
            if (candidates.length > 0) {
              $('#resetMsg').html('<span style="color:blue">Saving session results to database...</span>');
              
              const token = localStorage.getItem('jwtTokenAdmin');
              const saveResponse = await fetch('/api/save-session-results', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  sessionNumber: sessionNumber.toNumber(),
                  startDate: dates[0].toNumber(),
                  endDate: dates[1].toNumber(),
                  candidates: candidates
                })
              });
              
              const saveData = await saveResponse.json();
              
              if (!saveResponse.ok) {
                $('#resetMsg').html('<span style="color:orange">Warning: ' + saveData.message + '. Proceeding with reset...</span>');
                // Continue with reset even if save fails
              } else {
                console.log('✅ Session results saved:', saveData);
              }
            }
            
            // Now reset voting on blockchain
            $('#resetMsg').html('<span style="color:blue">Resetting voting session on blockchain...</span>');
            
            instance.resetVoting({ from: from }).then(function(result) {
              $('#resetMsg').html('<span style="color:green">✅ Session results saved and voting reset successfully!</span>');
              setTimeout(() => {
                window.location.reload(1);
              }, 2000);
            }).catch(function(err) {
              $('#resetMsg').html('<span style="color:red">Blockchain reset error: ' + err.message + '</span>');
            });
            
          } catch(err) {
            console.error('Reset error:', err);
            $('#resetMsg').html('<span style="color:red">Error: ' + err.message + '</span>');
          }
        });
//import "../css/style.css"

const Web3 = require('web3');
const contract = require('@truffle/contract');

const votingArtifacts = require('../../build/contracts/Voting.json');
var VotingContract = contract(votingArtifacts)




window.App = {
  eventStart: async function() { 
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    VotingContract.setProvider(window.ethereum)
    VotingContract.defaults({from: accounts[0],gas:6654755})

    // Load account data
    App.account = accounts[0];
    $("#accountAddress").html("Your Account: " + accounts[0]);
    VotingContract.deployed().then(function(instance){
     instance.getCountCandidates().then(function(countCandidates){

            $(document).ready(function(){
        $('#addCandidate').click(async function() {
          var nameCandidate = $('#name').val().trim();
          var partyCandidate = $('#party').val().trim();
          if (!nameCandidate || !partyCandidate) {
            alert("Please enter both candidate name and party.");
            return;
          }
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const from = accounts[0];
          instance.addCandidate(nameCandidate, partyCandidate, { from: from }).then(function(result){ })
        });   
        $('#addDate').click(async function(){             
          var startDateInput = document.getElementById("startDate").value;
          var endDateInput = document.getElementById("endDate").value;
          if (!startDateInput || !endDateInput) {
            alert("Please enter both start and end dates.");
            return;
          }
          // Convert datetime-local input (YYYY-MM-DDTHH:MM) to Unix timestamp (seconds)
          var startDate = Math.floor(new Date(startDateInput).getTime() / 1000);
          var endDate = Math.floor(new Date(endDateInput).getTime() / 1000);
          if (!startDate || !endDate || endDate <= startDate) {
            alert("Please enter valid start and end dates. End date must be after start date.");
            return;
          }
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const from = accounts[0];
          instance.setDates(startDate, endDate, { from: from }).then(function(rslt){ 
            console.log("Dates set");
            window.location.reload(1);
          });
        });

              instance.getDates().then(function(result){
                var startDate = new Date(result[0]*1000);
                var endDate = new Date(result[1]*1000);

                $("#dates").text( startDate.toDateString(("#DD#/#MM#/#YYYY#")) + " - " + endDate.toDateString("#DD#/#MM#/#YYYY#"));
                let statusColor = "#f44336"; // Default red
                let statusMessage = "Session Ended";
                var now = new Date();

                if (now < startDate) {
                    statusColor = "#ff9800"; // Orange
                    statusMessage = "Session Not Started";
                } else if (now <= endDate) {
                    statusColor = "#4CAF50"; // Green
                    statusMessage = "Session Active";
                }

                $("#session-status").css("background-color", statusColor)
                                  .css("color", "white")
                                  .text(statusMessage);

                // Update timer every second
                function updateTimer() {
                    var now = new Date();
                    var timeLeft;
                    var message;
                    
                    if (now < startDate) {
                        timeLeft = startDate - now;
                        message = "Voting starts in: ";
                        $("#voteButton").attr("disabled", true);
                        $("#msg").html("<p style='color:orange'>Voting has not started yet.</p>");
                    } else if (now > endDate) {
                        $("#timer").html("<span style='color: #f44336;'>Voting session has ended</span>");
                        $("#voteButton").attr("disabled", true);
                        $("#msg").html("<p style='color:red'>Voting session has ended.</p>");
                        return;
                    } else {
                        timeLeft = endDate - now;
                        message = "Time remaining: ";
                        // Enable vote button only if user hasn't voted
                        instance.checkVote().then(function(voted) {
                            if (voted) {
                                $("#voteButton").attr("disabled", true);
                                $("#msg").html("<p style='color:orange'>You have already voted in this session.</p>");
                            }
                        });
                    }
                    
                    var days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                    var hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                    
                    $("#timer").html(message + days + "d " + hours + "h " + minutes + "m " + seconds + "s");
                }
                
                // Initial call and set interval
                updateTimer();
                setInterval(updateTimer, 1000);
              }).catch(function(err){ 
                console.error("ERROR! " + err.message)
              });           
          });
             
          for (var i = 0; i < countCandidates; i++ ){
            instance.getCandidate(i+1).then(function(data){
              var id = data[0];
              var name = data[1];
              var party = data[2];
              var voteCount = data[3];
              var viewCandidates = `<tr><td> <input class="form-check-input" type="radio" name="candidate" value="${id}" id=${id}>` + name + "</td><td>" + party + "</td><td>" + voteCount + "</td></tr>"
              $("#boxCandidate").append(viewCandidates)
            })
        }
        
        window.countCandidates = countCandidates 
      });

      instance.checkVote().then(function (voted) {
          console.log(voted);
          if(!voted)  {
            $("#voteButton").attr("disabled", false);

          }
      });

    }).catch(function(err){ 
      console.error("ERROR! " + err.message)
    })
  },

  vote: async function() {    
    var candidateID = $("input[name='candidate']:checked").val();
    if (!candidateID) {
      $("#msg").html("<p style='color:red'>Please select a candidate.</p>")
      return
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const from = accounts[0];
      
      VotingContract.deployed().then(async function(instance) {
        // Check voting period
        const dates = await instance.getDates();
        const now = Math.floor(Date.now() / 1000);
        const startDate = dates[0].toNumber();
        const endDate = dates[1].toNumber();
        
        if (now < startDate) {
          $("#msg").html("<p style='color:red'>Voting has not started yet!</p>");
          return;
        }
        
        if (now > endDate) {
          $("#msg").html("<p style='color:red'>Voting session has ended!</p>");
          return;
        }
        
        // Check if already voted
        const hasVoted = await instance.checkVote();
        if (hasVoted) {
          $("#msg").html("<p style='color:red'>You have already voted in this session!</p>");
          $("#voteButton").attr("disabled", true);
          return;
        }
        
        // If all checks pass, proceed with voting
        $("#msg").html("<p style='color:blue'>Processing your vote...</p>");
        instance.vote(parseInt(candidateID), { from: from }).then(function(result){
          $("#voteButton").attr("disabled", true);
          showMessage("✅ Vote cast successfully!", "success");
          setTimeout(() => {
            window.location.reload(1);
          }, 2000);
        }).catch(function(err){
          console.error("Voting error:", err);
          let errorMsg = err.message;
          if (errorMsg.includes("Already voted")) {
            errorMsg = "You have already voted in this session!";
          } else if (errorMsg.includes("Voting is not active")) {
            errorMsg = "Voting is not currently active!";
          }
          $("#msg").html("<p style='color:red'>Error: " + errorMsg + "</p>");
        });
      }).catch(function(err){ 
        console.error("Contract error:", err);
        $("#msg").html("<p style='color:red'>Contract error: " + err.message + "</p>");
      });
    } catch(err) {
      console.error("MetaMask error:", err);
      $("#msg").html("<p style='color:red'>MetaMask error: " + err.message + "</p>");
    }
  }
}

window.addEventListener("load", async function() {
  if (typeof window.ethereum !== "undefined") {
    console.warn("Using web3 detected from external source like Metamask")
    window.eth = new Web3(window.ethereum)
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for deployment. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
    window.eth = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"))
  }
  await window.App.eventStart()
})
