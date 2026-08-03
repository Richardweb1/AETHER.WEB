"use client";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const APTOS_MAINNET_NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const aptosMainnet = new Aptos(
  new AptosConfig({
    network: Network.MAINNET,
    fullnode: APTOS_MAINNET_NODE_URL,
  })
);

const transactionSubmitter = {
  async submitTransaction(args: Parameters<typeof aptosMainnet.transaction.submit.simple>[0]) {
    return aptosMainnet.transaction.submit.simple(args);
  },
};

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      optInWallets={["Petra"]}
      dappConfig={{ network: Network.MAINNET, transactionSubmitter }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
