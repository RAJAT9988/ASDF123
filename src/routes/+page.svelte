<script lang="ts">
    import { onMount } from 'svelte';
    import { ethers } from 'ethers';
    import ControllerManagerAbiJson from '../contracts/ControllerManager.json';
    // Define the ABI for the smart contract (replace with your full ABI later)
    const ControllerManagerABI = ControllerManagerAbiJson.abi
  
    // Variable type definitions
    let provider: ethers.BrowserProvider | null = null;
    let signer: ethers.Signer | null = null;
    let contract: ethers.Contract | null = null;
    let account: string = '';
    let controllers: bigint[] = [];
    let selectedController: string = '';
    let deviceURI: string = '';
    let newOwner: string = '';
  
    // Replace this with your deployed contract address
    const ControllerManagerModule = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const DataAccessSubcription = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    const DeviceManagerModule = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

    
  
    // Extend the Window interface to include the ethereum property
    interface WindowWithEthereum extends Window {
      ethereum?: any;
    }
  
    async function connectWallet() {
  if (typeof window === 'undefined' || !(window as WindowWithEthereum).ethereum) {
    alert('Please install MetaMask!');
    return;
  }
  try {
    const ethWindow = window as WindowWithEthereum;
    await ethWindow.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.BrowserProvider(ethWindow.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    contract = new ethers.Contract(ControllerManagerModule, ControllerManagerABI, signer);

    // Check if this is the first connection
    if (!localStorage.getItem('walletConnected')) {
      alert(`Wallet connected successfully: ${account}`);
      localStorage.setItem('walletConnected', 'true'); // Flag set kar do
    }
  } catch (error) {
    alert(`Error: ${(error as Error).message}`);
  }
}

// Page load pe check karo agar wallet pehle se connected hai
onMount(async () => {
  if (typeof window !== 'undefined') {
    const ethWindow = window as WindowWithEthereum;
    if (ethWindow.ethereum) {
      ethWindow.ethereum.on('accountsChanged', (accounts: string[]) => {
        account = accounts[0] || '';
        if (!accounts[0]) localStorage.removeItem('walletConnected'); // Disconnect hone pe flag hatao
      });

      // Agar MetaMask already connected hai to account set karo bina prompt ke
      provider = new ethers.BrowserProvider(ethWindow.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0 && localStorage.getItem('walletConnected')) {
        signer = await provider.getSigner();
        account = await signer.getAddress();
        contract = new ethers.Contract(ControllerManagerModule, ControllerManagerABI, signer);
      }
    }
  }
});
  
    // Function to mint a new home controller
    async function addHomeController() {
      if (!contract) return alert('Connect your wallet first!');
      const homeowner = prompt('Enter the homeowner address:');
      const uri = prompt('Enter the controller URI:');
      try {
        const tx = await contract.addHomeController(homeowner, uri);
        await tx.wait();
        alert('Controller minted successfully!');
      } catch (error) {
        alert(`Error: ${(error as Error).message}`);
      }
    }
  
    // Function to fetch all controllers
    async function fetchControllers() {
      if (!contract) return alert('Connect your wallet first!');
      try {
        controllers = await contract.getHomeControllers();
      } catch (error) {
        alert(`Error: ${(error as Error).message}`);
      }
    }
  
    async function attachDevice() {
  if (!contract || !selectedController) return alert('Select a controller first!');
  console.log('Controller ID:', selectedController);
  console.log('Device URI:', deviceURI);
  try {
    const tx = await contract.attachHomeDevice(BigInt(selectedController), deviceURI, { gasLimit: 5*(10**6)});
    await tx.wait();
    alert('Device attached successfully!');
    deviceURI = '';
  } catch (error) {
    console.error('Full Error:', error);
    alert(`Error: ${(error as Error).message}`);
  }
}
    
    // Function to transfer ownership of a controller
    async function transferOwnership() {
      if (!contract || !selectedController) return alert('Select a controller first!');
      try {
        const tx = await contract.transferHomeControllerOwnership(BigInt(selectedController), newOwner);
        await tx.wait();
        alert('Ownership transferred successfully!');
        newOwner = '';
      } catch (error) {
        alert(`Error: ${(error as Error).message}`);
      }
    }
  
    // Client-side setup for event listeners
    onMount(() => {
      if (typeof window !== 'undefined') {
        const ethWindow = window as WindowWithEthereum;
        if (ethWindow.ethereum) {
          ethWindow.ethereum.on('accountsChanged', (accounts: string[]) => {
            account = accounts[0] || '';
          });
        }
      }
    });
  </script>
  
  <main>
    <h1>Home Automation Manager</h1>
  
    {#if !account}
      <button on:click={connectWallet}>Connect Wallet</button>
    {:else}
      <p>Connected: {account}</p>
  
      <h2>Admin Actions</h2>
      <button on:click={addHomeController}>Add Controller</button>
      <button on:click={fetchControllers}>Get Controllers</button>
      {#if controllers.length > 0}
        <ul>
          {#each controllers as controller}
            <li>{controller.toString()}</li>
          {/each}
        </ul>
      {/if}
  
      <h2>Homeowner Actions</h2>
      <label>
        Controller ID:
        <input type="number" bind:value={selectedController} placeholder="Enter Controller ID" />
      </label>
  
      <h3>Attach Device</h3>
      <input bind:value={deviceURI} placeholder="Device URI" />
      <button on:click={attachDevice}>Attach Device</button>
  
      <h3>Transfer Ownership</h3>
      <input bind:value={newOwner} placeholder="New Owner Address" />
      <button on:click={transferOwnership}>Transfer</button>
    {/if}
  </main>
  
  <style>
    main {
      max-width: 900px;
      margin: 0 auto;
      padding: 30px;
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #1e293b 0%, #f1f5f9 100%);
      min-height: 91vh;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 2.8rem;
      color: #ffffff;
      text-align: center;
      margin-bottom: 40px;
      font-weight: 700;
      text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.2);
    }
    h2 {
      font-size: 1.8rem;
      color: #facc15;
      margin: 40px 0 20px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    h3 {
      font-size: 1.3rem;
      color: #e5e7eb;
      margin: 25px 0 15px;
      font-weight: 500;
    }
    p {
      font-size: 1.1rem;
      color: #10b981;
      background: #dcfce7;
      padding: 12px 20px;
      border-radius: 10px;
      margin-bottom: 30px;
      text-align: center;
      font-weight: 500;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    button {
      padding: 12px 25px;
      font-size: 1rem;
      color: #fff;
      background: #7c3aed;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 10px 5px;
      font-weight: 600;
    }
    button:hover {
      background: #6d28d9;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    button:active {
      background: #5b21b6;
      transform: translateY(0);
    }
    input {
      width: 100%;
      max-width: 350px;
      padding: 12px;
      font-size: 1rem;
      color: #1f2937;
      background: #ffffff;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      margin: 10px 0;
      transition: all 0.3s ease;
    }
    input:focus {
      outline: none;
      border-color: #7c3aed;
      box-shadow: 0 0 8px rgba(124, 58, 237, 0.3);
    }
    label {
      display: block;
      font-size: 1rem;
      color: #e5e7eb;
      margin-bottom: 8px;
      font-weight: 500;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    li {
      font-size: 1rem;
      color: #1f2937;
      padding: 12px;
      background: #ffffff;
      border-radius: 8px;
      margin-bottom: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease;
    }
    li:hover {
      transform: scale(1.02);
    }
    @media (max-width: 600px) {
      h1 { font-size: 2rem; }
      h2 { font-size: 1.5rem; }
      h3 { font-size: 1.1rem; }
      button { width: 100%; margin: 10px 0; }
      input { max-width: none; }
    }
  </style>