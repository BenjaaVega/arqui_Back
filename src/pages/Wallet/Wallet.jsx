import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { api, useApiAuth } from "../../lib/api";
import "./Wallet.css";

// Normalizador robusto: acepta number o strings como "$12.000", "12000 CLP", etc.
const toNumber = (v, fallback = 0) => {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
};

const Wallet = () => {
  useApiAuth();
  const { user, isAuthenticated } = useAuth0();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  // mensajes con tipo para estilos .message.success / .message.error
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        // Saldo
        const { data: balData } = await api.get("/wallet");
        setBalance(toNumber(balData?.balance, 0));

        // Transacciones
        const { data: txData } = await api.get("/wallet/transactions");
        const list = Array.isArray(txData) ? txData : (txData?.transactions ?? []);
        setTransactions(list);
      } catch (err) {
        console.error("Error loading wallet data:", err?.response?.data ?? err?.message);
        setBalance(0);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      loadWalletData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleDeposit = async (e) => {
    e.preventDefault();

    const amount = toNumber(depositAmount, 0);
    if (amount <= 0) {
      setMessage({ text: "Ingresa un monto válido", type: "error" });
      return;
    }

    setDepositing(true);
    setMessage({ text: "", type: "" });

    try {
      const { data } = await api.post("/wallet/deposit", { amount });
      const newBal = toNumber(data?.new_balance, balance);
      setBalance(newBal);
      setDepositAmount("");
      setMessage({ text: `Se cargaron $${amount} a tu wallet`, type: "success" });

      // Refrescar transacciones
      const { data: tx2 } = await api.get("/wallet/transactions");
      const list = Array.isArray(tx2) ? tx2 : (tx2?.transactions ?? []);
      setTransactions(list);
    } catch (err) {
      console.error("Error depositing:", err?.response?.data ?? err?.message);
      setMessage({ text: "Error al cargar dinero al wallet", type: "error" });
    } finally {
      setDepositing(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" })
      .format(toNumber(amount, 0));

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <main className="main">
        <div className="main-header">
          <h1>Mi Wallet</h1>
          <div>Cargando...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="main-header">
        <h1>Mi Wallet</h1>
        <p>Gestiona tu dinero y transacciones</p>
      </div>

      <div className="wallet-container">
        {/* Saldo actual */}
        <div className="balance-card">
          <h2>Saldo actual</h2>
          <div className="balance-amount">{formatCurrency(balance)}</div>
        </div>

        {/* Cargar dinero */}
        <div className="deposit-section">
          <h3>Cargar dinero</h3>
          
          <form onSubmit={handleDeposit} className="deposit-form">
            <div className="form-group">
              <label htmlFor="amount">Monto a cargar</label>
              <input
                type="number"
                id="amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="10000"
                min="1"
                step="1"
                required
              />
            </div>

            <button type="submit" disabled={depositing} className="deposit-button">
              {depositing ? "Cargando..." : "Cargar dinero"}
            </button>
          </form>

          {message.text && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}
        </div>

        {/* Historial de transacciones */}
        <div className="transactions-section">
          <h3>Historial de transacciones</h3>
          {transactions.length === 0 ? (
            <div className="no-transactions">
              <p>No hay transacciones aún</p>
            </div>
          ) : (
            <div className="transactions-list">
              {transactions.map((tx, idx) => (
                <div key={idx} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-type">
                      {tx.type === "deposit" ? "💰 Carga" : "💸 Compra"}
                    </div>
                    <div className="transaction-date">
                      {tx.created_at ? formatDate(tx.created_at) : ""}
                    </div>
                  </div>
                  <div
                    className={`transaction-amount ${
                      tx.type === "deposit" ? "positive" : "negative"
                    }`}
                  >
                    {tx.type === "deposit" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Wallet;
