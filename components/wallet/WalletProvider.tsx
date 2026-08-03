"use client";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const APTOS_TESTNET_NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
const aptosTestnet = new Aptos(
  new AptosConfig({
    network: Network.TESTNET,
    fullnode: APTOS_TESTNET_NODE_URL,
  })
);

const transactionSubmitter = {
  async submitTransaction(args: Parameters<typeof aptosTestnet.transaction.submit.simple>[0]) {
    return aptosTestnet.transaction.submit.simple(args);
  },
};

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      optInWallets={["Petra"]}
      dappConfig={{ network: Network.TESTNET, transactionSubmitter }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
