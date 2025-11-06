# Decentralized Voting System Using Ethereum Blockchain

## Project Overview
This project implements a decentralized voting platform using the Ethereum blockchain. It ensures secure, transparent, and tamper-proof elections by leveraging smart contracts, a web-based frontend, a Node.js backend, and a Python-based database API.

---

## Technologies Used

1. **Ethereum Blockchain & Solidity**  
   - Smart contracts are written in Solidity (`contracts/Voting.sol`, `contracts/Migrations.sol`).
   - Truffle framework is used for contract development, testing, and deployment (`truffle-config.js`, `migrations/`).

2. **Node.js & Express**  
   - Backend server (`index.js`, `db.js`) handles API requests, interacts with the blockchain using `web3.js`, and serves frontend files.
   - Manages user authentication, voting logic, and admin operations.

3. **Web3.js**  
   - JavaScript library for interacting with Ethereum smart contracts from the frontend and backend.

4. **Frontend (HTML, CSS, JavaScript)**  
   - User interfaces for registration, login, voting, and admin tasks (`src/html/`, `src/css/`, `src/js/`).
   - Assets like images are stored in `src/assets/`.

5. **Python (Database API)**  
   - `Database_API/main.py` provides additional database operations, possibly for off-chain data or analytics.

6. **Other Tools**  
   - Truffle for contract management.
   - Ganache (optional) for local blockchain testing.
   - npm for package management.

---

## Main Program Files and Structure

- **Smart Contracts**
  - `contracts/Voting.sol`: Main voting contract logic.
  - `contracts/Migrations.sol`: Truffle migration contract.
  - `migrations/`: Deployment scripts for contracts.

- **Backend**
  - `index.js`: Main server file, sets up Express, connects to blockchain, serves frontend.
  - `db.js`: Handles database connections and queries.
  - `package.json`: Node.js dependencies and scripts.

- **Frontend**
  - `src/html/`: HTML files for admin, index, login, register pages.
  - `src/css/`: CSS files for styling each page.
  - `src/js/`: JavaScript files for frontend logic (app.js, login.js, register.js).
  - `public/`: Static assets and images.

- **Database API**
  - `Database_API/main.py`: Python script for database operations.
  - `Database_API/src/`: Additional Python modules (if any).

- **Build Artifacts**
  - `build/contracts/`: Compiled contract ABIs and bytecode (e.g., `Voting.json`).

- **Configuration**
  - `.env`: Environment variables for sensitive data.
  - `.gitignore`: Files/folders to ignore in version control.

---

## How It Works

1. **Deployment**:  
   - Smart contracts are deployed to the Ethereum network using Truffle.

2. **User Interaction**:  
   - Users access the web interface to register, log in, and vote.
   - Admins manage elections and monitor results.

3. **Voting Process**:  
   - Votes are recorded on the blockchain via smart contracts, ensuring transparency and immutability.

4. **Backend Operations**:  
   - Node.js server handles API requests, interacts with the blockchain, and manages user sessions.
   - Python API may handle off-chain data or analytics.

5. **Security**:  
   - Blockchain ensures vote integrity.
   - User authentication and access control are managed by the backend.

---

If you need a more detailed explanation of any specific file or technology, or want a file-by-file breakdown, let me know!
