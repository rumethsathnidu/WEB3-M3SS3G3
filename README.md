# WEB3 M3SS3G3

A decentralized WhatsApp-inspired messaging app built with HTML, CSS, and vanilla JavaScript. Messages are sent between Ethereum addresses and stored on-chain via a smart contract on the Sepolia testnet.

---

## Features
- **MetaMask Wallet Connection** (Sepolia testnet only)
- **On-chain Messaging**: Send and receive plain text messages between Ethereum addresses
- **WhatsApp-like UI**: Responsive, modern, and clean interface
- **Conversation List**: Auto-populated from on-chain message history
- **No Backend/Local Storage**: All data is on-chain

---

## Getting Started

### 1. Prerequisites
- [MetaMask](https://metamask.io/) browser extension installed and unlocked
- Sepolia ETH in your wallet (for gas fees)
- Node.js or Python (for running a local web server)

### 2. Running the App
**Do NOT open the HTML file directly!**
MetaMask only injects `window.ethereum` on pages served via HTTP/HTTPS or localhost.

#### Using Node.js (recommended):
```sh
npx serve .
```
Then open [http://localhost:5000/WEBAPP/index.html](http://localhost:5000/WEBAPP/index.html) in your browser.

#### Using Python:
```sh
python3 -m http.server
```
Then open [http://localhost:8000/WEBAPP/index.html](http://localhost:8000/WEBAPP/index.html) in your browser.

---

## Smart Contract Integration
- The contract address is hardcoded in `index.html`:
  - `0x9f2031a740fC946Df3f154E47fef35D45c79e2E0` (Sepolia)
- The contract must implement:
  ```solidity
  function sendMessage(address recipient, string memory content) public;
  function getMessages() public view returns (Message[] memory);
  function getMessagesByAddress(address user) public view returns (Message[] memory);
  function getMessagesBetweenAddresses(address user1, address user2) public view returns (Message[] memory);
  // struct Message { address sender; address recipient; string content; uint256 timestamp; }
  ```
- Update the contract address in the HTML if you deploy your own.

---

## Usage
1. **Connect your MetaMask wallet** (Sepolia network)
2. **Start a new chat** by entering a recipient's Ethereum address
3. **Send and receive messages**—all stored on-chain
4. **View conversations** in the sidebar

---


## License
MIT 
