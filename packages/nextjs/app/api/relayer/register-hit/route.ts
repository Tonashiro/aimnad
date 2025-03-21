// File: packages/nextjs/app/api/relayer/register-hit/route.ts
import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseGwei } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "~~/scaffold.config";
import { CONTRACT_ABI } from "~~/utils/scaffold-eth/abi";

const transport = http(process.env.NEXT_PUBLIC_MONAD_RPC_URL);
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport,
});

const PRIVATE_KEYS = [
  process.env.RELAYER_PRIVATE_KEY_1,
  process.env.RELAYER_PRIVATE_KEY_2,
  process.env.RELAYER_PRIVATE_KEY_3,
  process.env.RELAYER_PRIVATE_KEY_4,
  process.env.RELAYER_PRIVATE_KEY_5,
].filter((key): key is string => !!key);

const CONTRACT_ADDRESS = "0xA5A485E24E7F4e5C0F9823685A13881d12d9C564"; // Replace with your real contract address

const txQueue: { wallet: string }[] = [];
const busyKeys = new Set<string>();
let isCheckingQueue = false;

async function getAvailableKey(): Promise<string | undefined> {
  return PRIVATE_KEYS.find(key => !busyKeys.has(key));
}

async function processSingleTransaction(privateKey: string, wallet: string) {
  try {
    const account = privateKeyToAccount(`0x${privateKey}`);
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport,
    });

    const gasEstimate = await publicClient.estimateContractGas({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "registerHit",
      account,
      args: [wallet],
      value: 0n,
    });

    const maxPriorityFeePerGas = parseGwei("2");
    const maxFeePerGas = parseGwei("2.1");

    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "registerHit",
      chain: monadTestnet,
      gas: gasEstimate,
      maxFeePerGas,
      maxPriorityFeePerGas,
      args: [wallet],
      value: 0n,
    });

    await publicClient.waitForTransactionReceipt({ hash });
    console.log("registerHit tx confirmed:", hash);
  } catch (error) {
    console.error("Error processing registerHit tx:", error);
  } finally {
    busyKeys.delete(privateKey);
  }
}

async function processQueue() {
  if (isCheckingQueue) return;
  isCheckingQueue = true;

  while (txQueue.length > 0) {
    const privateKey = await getAvailableKey();
    if (!privateKey) {
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    const tx = txQueue.shift();
    if (tx) {
      busyKeys.add(privateKey);
      processSingleTransaction(privateKey, tx.wallet);
    }
  }

  isCheckingQueue = false;
}

export async function POST(req: Request) {
  try {
    const { wallet } = await req.json();

    if (!wallet) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    txQueue.push({ wallet });
    processQueue();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in register-hit route:", error);
    return NextResponse.json({ error: "Failed to queue registerHit" }, { status: 500 });
  }
}
