<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ethers } from 'ethers';
  import ControllerManagerAbiJson from '../contracts/ControllerManager.json';
  const ControllerManagerABI = ControllerManagerAbiJson.abi;

  let provider: ethers.BrowserProvider | null = null;
  let signer: ethers.Signer | null = null;
  let contract: ethers.Contract | null = null;
  let account: string = '';
  let showModal: boolean = false;
  let homeownerAddress: string = '';
  let controllerURI: string = '';
  let isLoading: boolean = false;
  let transactionStatus: string | null = null;
  let controllers: bigint[] = [];
  let selectedController: string = '';
  let deviceURI: string = '';

  const ControllerManagerModule = '0xb068d67d25de46bD6A952B15C06fF95169c89384';

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
      if (!localStorage.getItem('walletConnected')) {
        localStorage.setItem('walletConnected', 'true');
      }
      await goto('/getHomeController');
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  }

  onMount(async () => {
    if (typeof window !== 'undefined') {
      const ethWindow = window as WindowWithEthereum;
      if (ethWindow.ethereum) {
        ethWindow.ethereum.on('accountsChanged', (accounts: string[]) => {
          account = accounts[0] || '';
          if (!accounts[0]) localStorage.removeItem('walletConnected');
        });
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

  function openModal() {
    showModal = true;
    homeownerAddress = '';
    controllerURI = '';
    transactionStatus = null;
  }

  function closeModal() {
    showModal = false;
    isLoading = false;
  }

  async function addHomeController() {
    if (!contract) {
      alert('Please connect your wallet first!');
      console.log('Contract not found');
      return;
    }
    if (!homeownerAddress || !controllerURI) {
      transactionStatus = 'Please fill all fields!';
      return;
    }

    try {
      isLoading = true;
      transactionStatus = 'Transaction is being processed...';
      console.log('Transaction started, address:', homeownerAddress, 'URI:', controllerURI);
      
      const tx = await contract.addHomeController(homeownerAddress, controllerURI);
      transactionStatus = 'Waiting for confirmation...';
      console.log('Transaction hash:', tx.hash);
      
      await tx.wait();
      transactionStatus = 'Controller successfully minted!';
      console.log('Transaction successful, redirecting...');
      
      await goto('/getHomeController');
      isLoading = false;
    } catch (error) {
      transactionStatus = `Error occurred: ${(error as Error).message}`;
      console.error('Error details:', error);
      isLoading = false;
    }
  }

  async function getHomeControllers() {
    if (!contract) return alert('Connect your wallet first!');
    try {
      isLoading = true;
      controllers = await contract.getHomeControllers();
      console.log('Controllers fetched:', controllers);
      if (controllers.length === 0) {
        alert('No controllers found!');
      }
      isLoading = false;
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
      isLoading = false;
    }
  }

  async function attachHomeDevice() {
    if (!contract || !selectedController) return alert('Select a controller first!');
    if (!deviceURI) return alert('Enter device URI!');
    
    try {
      isLoading = true;
      transactionStatus = 'Attaching device...';
      
      const txRequest = await contract.attachHomeDevice.populateTransaction(
        BigInt(selectedController), 
        deviceURI, 
        { gasLimit: 5 * (10 ** 6) }
      );
      const tx = await signer!.sendTransaction(txRequest);
      transactionStatus = 'Waiting for confirmation...';
      
      await tx.wait();
      transactionStatus = 'Device attached successfully!';
      deviceURI = '';
      isLoading = false;
    } catch (error) {
      transactionStatus = `Error: ${(error as Error).message}`;
      isLoading = false;
    }
  }
</script>

<main class="main-container">
  <!-- Section 1: Wallet Connection -->
  <section class="page-section first-section">
    <div class="card">
      <div class="logo-container">
        <div class="logo-icon">🏠</div>
        <h1>Home Controller Manager</h1>
      </div>
      
      {#if !account}
        <button on:click={connectWallet} class="connect-button pulse">
          <span class="icon">🔗</span> Connect Wallet
        </button>
      {:else}
        <div class="account-info">
          <p>Connected: <span class="wallet-address">{account.slice(0, 6)}...{account.slice(-4)}</span></p>
        </div>
        
        <div class="action-section">
          <button on:click={openModal} class="action-button">
            <span class="icon">➕</span> Add Home Controller
          </button>
        </div>
      {/if}
    </div>
  </section>

  <!-- Section 2: Controllers List -->
  {#if account}
    <section class="page-section second-section">
      <div class="card">
        <div class="controllers-header">
          <h2><span class="icon">🎛️</span> Your Controllers</h2>
          <button on:click={getHomeControllers} class="get-controller-button" disabled={isLoading}>
            {#if isLoading}
              <span class="spinner"></span> Loading...
            {:else}
              <span class="icon">🔄</span> Get Controllers
            {/if}
          </button>
        </div>

        {#if controllers.length > 0}
          <div class="controllers-list">
            <ul>
              {#each controllers as controller}
                <li>
                  <span class="controller-icon">📱</span>
                  <span class="controller-id">{controller.toString()}</span>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No controllers found. Get controllers to view them here.</p>
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Section 3: Device Attachment -->
  {#if account && controllers.length > 0}
    <section class="page-section third-section">
      <div class="card">
        <h2><span class="icon">🔌</span> Attach New Device</h2>
        
        <div class="form-group">
          <label for="controller-select">
            <span class="icon">🔘</span> Select Controller
          </label>
          <select id="controller-select" bind:value={selectedController} class="input-field">
            <option value="">-- Select a Controller --</option>
            {#each controllers as controller}
              <option value={controller.toString()}>{controller.toString()}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="device-uri">
            <span class="icon">🔗</span> Device URI
          </label>
          <input
            id="device-uri"
            type="text"
            bind:value={deviceURI}
            placeholder="ipfs://..."
            class="input-field"
          />
        </div>

        <button on:click={attachHomeDevice} class="action-button" disabled={isLoading}>
          {#if isLoading}
            <span class="spinner"></span> Attaching...
          {:else}
            <span class="icon">⚡</span> Attach Device
          {/if}
        </button>

        {#if transactionStatus}
          <div class:status-success={transactionStatus.includes('successfully')} 
               class:status-error={transactionStatus.includes('Error') || transactionStatus.includes('Please')}
               class="status-message">
            {#if transactionStatus.includes('successfully')}
              <span class="icon">✅</span>
            {:else if transactionStatus.includes('Error') || transactionStatus.includes('Please')}
              <span class="icon">❌</span>
            {/if}
            {transactionStatus}
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Modal -->
  {#if showModal}
    <div class="modal-backdrop" on:click|self={closeModal}>
      <div class="modal-content">
        <button class="close-button" on:click={closeModal}>×</button>
        <h2><span class="icon">🏡</span> Add New Home Controller</h2>
        
        <div class="form-group">
          <label for="homeowner">
            <span class="icon">👤</span> Homeowner Address
          </label>
          <input
            id="homeowner"
            type="text"
            bind:value={homeownerAddress}
            placeholder="0x..."
            class="input-field"
          />
        </div>
        
        <div class="form-group">
          <label for="uri">
            <span class="icon">🌐</span> Controller URI
          </label>
          <input
            id="uri"
            type="text"
            bind:value={controllerURI}
            placeholder="ipfs://..."
            class="input-field"
          />
        </div>
        
        {#if transactionStatus}
          <div class:status-success={transactionStatus.includes('successfully')} 
               class:status-error={transactionStatus.includes('Error') || transactionStatus.includes('Please')}
               class="status-message">
            {transactionStatus}
          </div>
        {/if}
        
        <button 
          on:click={addHomeController} 
          class="submit-button"
          disabled={isLoading}
        >
          {#if isLoading}
            <span class="spinner"></span> Processing...
          {:else}
            <span class="icon">🚀</span> Submit
          {/if}
        </button>
      </div>
    </div>
  {/if}
</main>

<style>
   /* Updated Status Messages with Scroll */
   .status-message {
    padding: 1rem;
    border-radius: 12px;
    margin: 1.5rem 0;
    font-size: 0.9rem;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    max-height: 150px; /* Fixed height */
    overflow-y: auto; /* Vertical scroll when needed */
    word-break: break-word;
    overflow-wrap: anywhere;
    max-width: 100%;
    box-sizing: border-box;
    scrollbar-width: thin; /* For Firefox */
    scrollbar-color: var(--gray) var(--light-gray); /* For Firefox */
  }

  /* Custom scrollbar for Webkit browsers */
  .status-message::-webkit-scrollbar {
    width: 6px;
  }
  
  .status-message::-webkit-scrollbar-track {
    background: var(--light-gray);
    border-radius: 3px;
  }
  
  .status-message::-webkit-scrollbar-thumb {
    background-color: var(--gray);
    border-radius: 3px;
  }

  .status-success {
    background-color: rgba(46, 125, 50, 0.1);
    color: #2e7d32;
    border: 1px solid rgba(46, 125, 50, 0.3);
  }

  .status-error {
    background-color: rgba(198, 40, 40, 0.1);
    color: #c62828;
    border: 1px solid rgba(198, 40, 40, 0.3);
  }

  /* Base styles */
  :root {
    --primary: #4361ee;
    --secondary: #3a0ca3;
    --success: #4cc9f0;
    --danger: #f72585;
    --light: #f8f9fa;
    --dark: #212529;
    --gray: #6c757d;
    --light-gray: #e9ecef;
    --white: #ffffff;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s ease;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    color: var(--dark);
    line-height: 1.6;
  }

  .main-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 2rem 1rem;
  }

  .page-section {
    width: 100%;
    min-height: 60vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.5rem;
    box-sizing: border-box;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    box-shadow: var(--shadow);
    transition: var(--transition);
  }

  .page-section:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  .first-section {
    background: linear-gradient(135deg, rgba(67, 97, 238, 0.1) 0%, rgba(58, 12, 163, 0.1) 100%);
  }

  .second-section {
    background: linear-gradient(135deg, rgba(76, 201, 240, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%);
  }

  .third-section {
    background: linear-gradient(135deg, rgba(247, 37, 133, 0.1) 0%, rgba(114, 9, 183, 0.1) 100%);
  }

  .card {
    background: var(--white);
    border-radius: 16px;
    padding: 2.5rem;
    text-align: center;
    width: 100%;
    max-width: 600px;
    box-shadow: var(--shadow);
  }

  .logo-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
  }

  .logo-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  h1, h2, h3 {
    color: var(--dark);
    margin-bottom: 1.5rem;
    font-weight: 700;
  }

  h1 {
    font-size: 2rem;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  h2 {
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
  }

  .icon {
    margin-right: 0.5rem;
    font-size: 1.2em;
  }

  /* Buttons */
  .connect-button, .action-button, .get-controller-button, .submit-button {
    border: none;
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    border-radius: 12px;
    cursor: pointer;
    transition: var(--transition);
    font-weight: 600;
    width: 100%;
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .connect-button {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: var(--white);
    box-shadow: 0 4px 14px rgba(67, 97, 238, 0.4);
  }

  .connect-button:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(67, 97, 238, 0.6);
  }

  .action-button {
    background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
    color: var(--white);
    box-shadow: 0 4px 14px rgba(76, 175, 80, 0.4);
  }

  .get-controller-button {
    background: linear-gradient(135deg, var(--success) 0%, #1d4ed8 100%);
    color: var(--white);
    box-shadow: 0 4px 14px rgba(76, 201, 240, 0.4);
  }

  .submit-button {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: var(--white);
    box-shadow: 0 4px 14px rgba(67, 97, 238, 0.4);
  }

  .pulse {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  /* Account Info */
  .account-info {
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(67, 97, 238, 0.1);
    border-radius: 12px;
  }

  .account-info p {
    color: var(--dark);
    margin: 0;
    font-size: 0.9rem;
  }

  .wallet-address {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    color: var(--secondary);
  }

  /* Controllers List */
  .controllers-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .controllers-list {
    margin-top: 1.5rem;
    text-align: left;
  }

  .controllers-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .controllers-list li {
    background: var(--light);
    padding: 1rem;
    border-radius: 12px;
    color: var(--dark);
    font-family: monospace;
    word-break: break-all;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-left: 4px solid var(--primary);
  }

  .controllers-list li:hover {
    background: var(--light-gray);
    transform: translateX(5px);
  }

  .controller-icon {
    font-size: 1.2rem;
  }

  .empty-state {
    padding: 2rem;
    color: var(--gray);
    font-style: italic;
    border: 2px dashed var(--light-gray);
    border-radius: 12px;
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .empty-icon {
    font-size: 2rem;
    opacity: 0.5;
  }

  /* Forms */
  .form-group {
    margin-bottom: 1.5rem;
    text-align: left;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--dark);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .input-field {
    width: 100%;
    padding: 0.8rem 1rem;
    border: 2px solid var(--light-gray);
    border-radius: 12px;
    font-size: 1rem;
    box-sizing: border-box;
    transition: var(--transition);
    font-family: inherit;
  }

  .input-field:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
  }

  select.input-field {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1rem;
  }

  /* Status Messages */
  .status-message {
    padding: 1rem;
    border-radius: 12px;
    margin: 1.5rem 0;
    font-size: 0.9rem;
    word-wrap: break-word;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-success {
    background-color: rgba(46, 125, 50, 0.1);
    color: #2e7d32;
    border: 1px solid rgba(46, 125, 50, 0.3);
  }

  .status-error {
    background-color: rgba(198, 40, 40, 0.1);
    color: #c62828;
    border: 1px solid rgba(198, 40, 40, 0.3);
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
  }

  .modal-content {
    background: var(--white);
    border-radius: 16px;
    padding: 2rem;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    position: relative;
    animation: modalFadeIn 0.3s ease-out;
  }

  @keyframes modalFadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--gray);
    padding: 0.5rem;
    transition: var(--transition);
  }

  .close-button:hover {
    color: var(--danger);
    transform: rotate(90deg);
  }

  /* Spinner */
  .spinner {
    display: inline-block;
    width: 1.2rem;
    height: 1.2rem;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: var(--white);
    animation: spin 1s ease-in-out infinite;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .main-container {
      padding: 1rem;
      gap: 1.5rem;
    }
    
    .card {
      padding: 1.5rem;
    }
    
    .page-section {
      min-height: auto;
      padding: 1rem;
    }
    
    .controllers-header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .get-controller-button {
      width: 100%;
    }
  }
</style>