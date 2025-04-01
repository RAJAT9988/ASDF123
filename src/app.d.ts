// src/app.d.ts
declare module '*.json' {
	const value: {
	  abi: any[];
	  // Add other properties if your JSON has them
	};
	export default value;
  }