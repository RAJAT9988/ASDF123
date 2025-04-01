<script lang="ts">
  import { onMount } from 'svelte';
  import { ethers } from 'ethers';
  import ControllerManagerAbiJson from '../contracts/ControllerManager.json';
  const ControllerManagerABI = ControllerManagerAbiJson.abi;

  let provider: ethers.BrowserProvider | null = null;
  let signer: ethers.Signer | null = null;
  let contract: ethers.Contract | null = null;
  let account: string = '';
  let controllers: bigint[] = [];
  let selectedController: string = '';
  let errorMessage: string = '';
  let successMessage: string = '';
  let isLoading: boolean = false;

  const ControllerManagerModule = '0xb068d67d25de46bD6A952B15C06fF95169c89384';

  interface WindowWithEthereum extends Window {
    ethereum?: any;
  }

  function clearMessages() {
    errorMessage = '';
    successMessage = '';
  }

  async function connectWallet() {
    clearMessages();
    isLoading = true;
    
    if (typeof window === 'undefined' || !(window as WindowWithEthereum).ethereum) {
      errorMessage = 'Please install MetaMask!';
      isLoading = false;
      return;
    }
    
    try {
      const ethWindow = window as WindowWithEthereum;
      await ethWindow.ethereum.request({ method: 'eth_requestAccounts' });
      provider = new ethers.BrowserProvider(ethWindow.ethereum);
      signer = await provider.getSigner();
      account = await signer.getAddress();
      contract = new ethers.Contract(ControllerManagerModule, ControllerManagerABI, signer);
      
      if (!localStorage.getItem('walletConnected')) {
        successMessage = `Wallet connected successfully`;
        localStorage.setItem('walletConnected', 'true');
      }
    } catch (error) {
      errorMessage = `Connection error: ${(error as Error).message}`;
    } finally {
      isLoading = false;
    }
  }

  async function getHomeControllers() {
    clearMessages();
    
    if (!contract) {
      errorMessage = 'Please connect your wallet first';
      return;
    }
    
    isLoading = true;
    try {
      controllers = await contract.getHomeControllers();
      console.log('Controllers fetched:', controllers);
      if (controllers.length === 0) {
        errorMessage = 'No controllers found';
      }
    } catch (error) {
      errorMessage = `Error fetching controllers: ${(error as Error).message}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="container">
  <div class="card">
    <h1>Home Controllers</h1>
    
    {#if errorMessage}
      <div class="message error">
        {errorMessage}
      </div>
    {/if}
    
    {#if successMessage}
      <div class="message success">
        {successMessage}
      </div>
    {/if}
    
    <div class="wallet-section">
      {#if !account}
        <button on:click={connectWallet} class="connect-button" disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      {:else}
        <p class="wallet-address">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
      {/if}
    </div>

    <div class="action-section">
      <button on:click={getHomeControllers} class="action-button" disabled={isLoading || !account}>
        {isLoading ? 'Loading...' : 'Get Home Controllers'}
      </button>
    </div>

    {#if controllers.length > 0}
      <div class="controllers-list">
        <h2>Controller IDs:</h2>
        <div class="controller-items">
          {#each controllers as controller}
            <div class="controller-item">
              <input 
                type="radio" 
                id="controller-{controller}" 
                name="selectedController" 
                value={controller.toString()}
                bind:group={selectedController}
              />
              <label for="controller-{controller}">{controller.toString()}</label>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 20px;
  }

  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 30px;
    width: 100%;
    max-width: 600px;
    text-align: center;
  }

  h1 {
    color: #333;
    margin-bottom: 24px;
    font-size: 24px;
  }

  h2 {
    color: #444;
    margin: 20px 0 10px;
    font-size: 18px;
  }

  .wallet-section {
    margin-bottom: 20px;
  }

  .connect-button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }

  .connect-button:hover:not(:disabled) {
    background-color: #45a049;
  }

  .connect-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .wallet-address {
    background-color: #f0f0f0;
    padding: 10px;
    border-radius: 6px;
    font-family: monospace;
    word-break: break-all;
  }

  .action-button {
    background-color: #2196F3;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    margin: 10px 0;
    transition: background-color 0.3s;
  }

  .action-button:hover:not(:disabled) {
    background-color: #0b7dda;
  }

  .action-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .controllers-list {
    margin-top: 20px;
    text-align: left;
  }

  .controller-items {
    max-height: 300px;
    overflow-y: auto;
    margin-top: 10px;
  }

  .controller-item {
    padding: 10px;
    margin: 5px 0;
    background-color: #f9f9f9;
    border-radius: 6px;
    display: flex;
    align-items: center;
  }

  .controller-item input[type="radio"] {
    margin-right: 10px;
  }

  .controller-item label {
    cursor: pointer;
    font-family: monospace;
  }
  
  .message {
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 20px;
    font-size: 14px;
  }
  
  .error {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ef9a9a;
  }
  
  .success {
    background-color: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #a5d6a7;
  }
</style>