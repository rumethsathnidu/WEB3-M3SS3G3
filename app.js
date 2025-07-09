// --- CONFIG ---
const CONTRACT_ADDRESS = '0x9f2031a740fC946Df3f154E47fef35D45c79e2E0'; 
const CONTRACT_ABI = [
  "function sendMessage(address recipient, string content)",
  "function getMessages() view returns (tuple(address sender, address recipient, string content, uint256 timestamp)[])",
  "function getMessagesByAddress(address user) view returns (tuple(address sender, address recipient, string content, uint256 timestamp)[])",
  "function getMessagesBetweenAddresses(address user1, address user2) view returns (tuple(address sender, address recipient, string content, uint256 timestamp)[])",
];
const SEPOLIA_CHAIN_ID = '0xaa36a7';
// --- STATE ---
let provider, signer, contract;
let userAddress = null;
let allMessages = [];
let conversations = [];
let selectedConversation = null;
let autoRefreshInterval = null;
// --- DOM ---
const connectBtn = document.getElementById('connectBtn');
const walletStatus = document.getElementById('walletStatus');
const conversationList = document.getElementById('conversationList');
const chatWindow = document.getElementById('chatWindow');
const chatWith = document.getElementById('chatWith');
const chatInputForm = document.getElementById('chatInputForm');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const newChatModal = document.getElementById('newChatModal');
const recipientAddressInput = document.getElementById('recipientAddress');
const startChatBtn = document.getElementById('startChatBtn');
// --- WALLET CONNECTION ---
async function connectWallet() {
  if (!window.ethereum) {
    alert('MetaMask is required!');
    return;
  }
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] });
  } catch (e) {
    alert('Please switch to Sepolia testnet in MetaMask.');
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = ethers.utils.getAddress(accounts[0]);
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    walletStatus.textContent = userAddress.slice(0, 6) + '...' + userAddress.slice(-4);
    connectBtn.textContent = 'Disconnect';
    connectBtn.onclick = disconnectWallet;
    fetchAndRenderAll();
    if (!autoRefreshInterval) {
      autoRefreshInterval = setInterval(fetchAndRenderAll, 8000);
    }
  } catch (err) {
    alert('Wallet connection failed.');
  }
}
function disconnectWallet() {
  userAddress = null;
  provider = signer = contract = null;
  walletStatus.textContent = 'Not connected';
  connectBtn.textContent = 'Connect';
  connectBtn.onclick = connectWallet;
  chatWith.textContent = 'Select a conversation';
  chatWindow.innerHTML = '<div style="color:#aaa;text-align:center;margin-top:40px;">No conversation selected.</div>';
  chatInputForm.style.display = 'none';
  conversationList.innerHTML = '';
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = null;
}
connectBtn.onclick = connectWallet;
// --- NEW CHAT MODAL ---
newChatBtn.onclick = () => {
  if (!userAddress) {
    alert('Connect your wallet first!');
    return;
  }
  recipientAddressInput.value = '';
  newChatModal.style.display = 'flex';
  recipientAddressInput.focus();
};
startChatBtn.onclick = () => {
  const addr = recipientAddressInput.value.trim();
  if (!ethers.utils.isAddress(addr)) {
    alert('Invalid Ethereum address.');
    return;
  }
  newChatModal.style.display = 'none';
  openConversation(addr);
};
newChatModal.onclick = (e) => {
  if (e.target === newChatModal) newChatModal.style.display = 'none';
};
// --- FETCH & RENDER ---
async function fetchAllMessages() {
  if (!contract) return [];
  try {
    const msgs = await contract.getMessages();
    return msgs.map(m => ({
      sender: m.sender,
      recipient: m.recipient,
      content: m.content,
      timestamp: Number(m.timestamp)
    }));
  } catch (e) {
    return [];
  }
}
function getConversationPartners(messages, userAddr) {
  const partners = {};
  messages.forEach(m => {
    if (m.sender === userAddr) partners[m.recipient] = true;
    if (m.recipient === userAddr) partners[m.sender] = true;
  });
  return Object.keys(partners);
}
function getMessagesBetween(user1, user2, messages) {
  return messages.filter(m =>
    (m.sender === user1 && m.recipient === user2) ||
    (m.sender === user2 && m.recipient === user1)
  ).sort((a, b) => a.timestamp - b.timestamp);
}
async function fetchAndRenderAll() {
  if (!userAddress || !contract) return;
  allMessages = await fetchAllMessages();
  conversations = getConversationPartners(allMessages, userAddress);
  renderConversationList();
  if (selectedConversation) {
    renderChat(selectedConversation);
  }
}
// --- CONVERSATION LIST ---
function renderConversationList() {
  conversationList.innerHTML = '';
  if (conversations.length === 0) {
    conversationList.innerHTML = '<li style="color:#aaa;padding:24px 0;text-align:center;">No conversations yet.</li>';
    return;
  }
  conversations.forEach(addr => {
    const msgs = getMessagesBetween(userAddress, addr, allMessages);
    const lastMsg = msgs[msgs.length - 1];
    const li = document.createElement('li');
    li.className = 'conversation-item' + (selectedConversation === addr ? ' active' : '');
    li.onclick = () => openConversation(addr);
    li.innerHTML = `
      <span class="conversation-address">${addr.slice(0, 6)}...${addr.slice(-4)}</span>
      <span class="conversation-preview">${lastMsg ? (lastMsg.sender === userAddress ? 'You: ' : '') + escapeHTML(lastMsg.content).slice(0, 32) : 'No messages yet.'}</span>
    `;
    conversationList.appendChild(li);
  });
}
// --- OPEN CONVERSATION ---
function openConversation(addr) {
  selectedConversation = addr;
  renderChat(addr);
  renderConversationList();
}
// --- RENDER CHAT ---
function renderChat(addr) {
  chatWith.textContent = addr.slice(0, 6) + '...' + addr.slice(-4);
  chatInputForm.style.display = 'flex';
  chatWindow.innerHTML = '';
  const msgs = getMessagesBetween(userAddress, addr, allMessages);
  if (msgs.length === 0) {
    chatWindow.innerHTML = '<div style="color:#aaa;text-align:center;margin-top:40px;">No messages yet. Say hello!</div>';
    return;
  }
  msgs.forEach(m => {
    const div = document.createElement('div');
    div.className = 'message-bubble ' + (m.sender === userAddress ? 'sent' : 'received');
    div.innerHTML = `${escapeHTML(m.content)} <span class="timestamp">${formatTimestamp(m.timestamp)}</span>`;
    chatWindow.appendChild(div);
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
// --- SEND MESSAGE ---
chatInputForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!selectedConversation || !chatInput.value.trim()) return;
  sendBtn.disabled = true;
  try {
    const tx = await contract.sendMessage(selectedConversation, chatInput.value.trim());
    await tx.wait();
    chatInput.value = '';
    fetchAndRenderAll();
  } catch (err) {
    alert('Failed to send message.');
  }
  sendBtn.disabled = false;
};
// --- HELPERS ---
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function(tag) {
    const chars = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'};
    return chars[tag] || tag;
  });
}
function formatTimestamp(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}
// --- INIT ---
if (window.ethereum && window.ethereum.selectedAddress) {
  connectWallet();
}
// Auto-refresh on account/network change
if (window.ethereum) {
  window.ethereum.on('accountsChanged', () => { disconnectWallet(); });
  window.ethereum.on('chainChanged', () => { disconnectWallet(); });
} 
