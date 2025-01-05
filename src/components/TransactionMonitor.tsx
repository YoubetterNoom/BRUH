import { useState, useCallback, useEffect } from 'react';
import {
  Connection,
  PublicKey,
  ParsedTransactionWithMeta,
  ParsedInstruction,
  PartiallyDecodedInstruction,
} from '@solana/web3.js';

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  amount: number;
  isInput?: boolean;
}

interface Transaction {
  signature: string;
  timestamp: number;
  status: string;
  inputToken?: TokenInfo;
  outputToken?: TokenInfo;
  programName?: string;
}

interface TransactionMonitorProps {
  programId: string;
}

const TransactionMonitor: React.FC<TransactionMonitorProps> = ({ programId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [processedSignatures] = useState<Set<string>>(new Set());
  const [processedTokens] = useState<Set<string>>(new Set());

  const getTokenInfo = async (mintAddress: string) => {
    try {
      const response = await fetch('https://api.helius.xyz/v0/token-metadata?api-key=426605eb-af73-410a-af26-0dc37714935f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAccounts: [mintAddress],
          includeOffChain: true,
          disableCache: false
        })
      });
      
      const tokenData = await response.json();
      if (tokenData && tokenData[0]) {
        return {
          address: mintAddress,
          symbol: tokenData[0].symbol || 'Unknown',
          name: tokenData[0].name || 'Unknown Token',
          amount: 0
        } as TokenInfo;
      }
    } catch (error) {
      console.error('Error fetching token info:', error);
    }
    return null;
  };

  const getProgramName = (instruction: ParsedInstruction | PartiallyDecodedInstruction): string => {
    if ('programId' in instruction) {
      return instruction.programId.toString();
    }
    return 'Unknown';
  };

  const monitorTransactions = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const connection = new Connection(
        'https://mainnet.helius-rpc.com/?api-key=426605eb-af73-410a-af26-0dc37714935f',
        'confirmed'
      );

      const programPublicKey = new PublicKey(programId);
      const signatures = await connection.getSignaturesForAddress(
        programPublicKey,
        { limit: 10 }
      );

      const newSignatures = signatures.filter(sig => !processedSignatures.has(sig.signature));
      
      if (newSignatures.length === 0) {
        setLoading(false);
        return;
      }

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const newTransactions: Transaction[] = [];

      for (const sig of newSignatures) {
        try {
          await delay(500);
          const tx = await connection.getParsedTransaction(
            sig.signature,
            {
              maxSupportedTransactionVersion: 0,
              commitment: 'confirmed'
            }
          );

          if (tx?.meta && tx.blockTime) {
            const preTokenBalances = tx.meta.preTokenBalances || [];
            const postTokenBalances = tx.meta.postTokenBalances || [];
            
            const changedTokens = Array.from(new Set([
              ...preTokenBalances.map(b => b.mint),
              ...postTokenBalances.map(b => b.mint)
            ])).filter(mint => !processedTokens.has(mint));

            if (changedTokens.length === 0) continue;

            const tokenInfos: TokenInfo[] = [];
            
            for (const mint of changedTokens) {
              if (!mint) continue;
              const tokenInfo = await getTokenInfo(mint);
              if (tokenInfo) {
                const preBal = preTokenBalances.find(b => b.mint === mint)?.uiTokenAmount.uiAmount || 0;
                const postBal = postTokenBalances.find(b => b.mint === mint)?.uiTokenAmount.uiAmount || 0;
                const change = postBal - preBal;
                
                tokenInfos.push({
                  ...tokenInfo,
                  amount: Math.abs(change),
                  isInput: change < 0
                });
                
                processedTokens.add(mint);
              }
            }

            if (tokenInfos.length > 0) {
              const inputTokens = tokenInfos.filter(t => t.isInput);
              const outputTokens = tokenInfos.filter(t => !t.isInput);

              const newTx: Transaction = {
                signature: sig.signature,
                timestamp: tx.blockTime,
                status: tx.meta?.err ? 'Failed' : 'Success',
                inputToken: inputTokens[0],
                outputToken: outputTokens[0],
                programName: getProgramName(tx.transaction.message.instructions[0])
              };

              newTransactions.push(newTx);
              processedSignatures.add(sig.signature);
            }
          }
        } catch (error) {
          console.error('Error processing transaction:', sig.signature, error);
        }
      }

      if (newTransactions.length > 0) {
        setTransactions(prevTxs => [...newTransactions, ...prevTxs]);
      }
    } catch (error) {
      console.error('Error in monitorTransactions:', error);
    } finally {
      setLoading(false);
    }
  }, [programId, processedSignatures, processedTokens, loading]);

  useEffect(() => {
    setTransactions([]);
    processedSignatures.clear();
    processedTokens.clear();
    monitorTransactions();
    
    const interval = setInterval(monitorTransactions, 10000);
    return () => clearInterval(interval);
  }, [programId]);

  const openPhotonLink = (tokenAddress: string) => {
    window.open(`https://photon-sol.tinyastro.io/en/lp/${tokenAddress}`, '_blank');
  };

  return (
    <div className="transaction-monitor">
      <div className="monitor-header">
        <div className="title-section">
          <h2>Transaction Monitor</h2>
          <span className="subtitle">Real-time Solana transaction tracking</span>
        </div>
        <div className="refresh-container">
          <button 
            onClick={monitorTransactions} 
            disabled={loading}
            className="refresh-button"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Loading
              </>
            ) : (
              <>
                <span className="refresh-icon">↻</span>
                Manual Refresh
              </>
            )}
          </button>
        </div>
      </div>
      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div className="no-transactions">
            <p>No transactions found</p>
            <span className="hint">Click refresh to check for new transactions</span>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.signature} className="transaction-item">
              <div className="transaction-header">
                <div className="timestamp">
                  <span className="label">Time:</span>
                  {new Date(tx.timestamp * 1000).toLocaleString()}
                </div>
                <div className={`status ${tx.status === '成功' ? 'success' : 'failed'}`}>
                  {tx.status === '成功' ? 'Success' : 'Failed'}
                </div>
              </div>
              <div className="swap-info">
                {tx.inputToken && (
                  <div className="token-info input-token">
                    <div className="token-amount">
                      <span className="label">Paid:</span>
                      <span className="amount">{tx.inputToken.amount}</span>
                      <span className="symbol">{tx.inputToken.symbol}</span>
                    </div>
                    <button 
                      className="photon-link-button"
                      onClick={() => openPhotonLink(tx.inputToken!.address)}
                    >
                      View on Photon LP
                      <span className="address">({tx.inputToken.address})</span>
                    </button>
                  </div>
                )}
                {tx.outputToken && (
                  <div className="token-info output-token">
                    <div className="token-amount">
                      <span className="label">Received:</span>
                      <span className="amount">{tx.outputToken.amount}</span>
                      <span className="symbol">{tx.outputToken.symbol}</span>
                    </div>
                    <button 
                      className="photon-link-button"
                      onClick={() => openPhotonLink(tx.outputToken!.address)}
                    >
                      View on Photon LP
                      <span className="address">({tx.outputToken.address})</span>
                    </button>
                  </div>
                )}
              </div>
              {tx.programName && (
                <div className="program-name">
                  <span className="label">Program:</span>
                  {tx.programName}
                </div>
              )}
              <div className="signature">
                <span className="label">Transaction Signature:</span>
                <span className="value">{tx.signature}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionMonitor; 