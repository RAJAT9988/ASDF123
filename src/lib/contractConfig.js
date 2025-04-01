export const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE"; // Replace with your actual address

export const abi = [
  {
    inputs: [
      { internalType: "address", name: "homeowner", type: "address" },
      { internalType: "string", name: "uri", type: "string" }
    ],
    name: "addHomeController",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];