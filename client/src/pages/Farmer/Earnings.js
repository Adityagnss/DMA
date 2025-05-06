import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/auth';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faHistory, faSpinner } from '@fortawesome/free-solid-svg-icons';

const Earnings = () => {
  const [auth] = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);

  // Fetch balance and transactions
  const fetchEarnings = async () => {
    try {
      const { data } = await axios.get('/api/v1/earnings/farmer-earnings');
      setBalance(data.balance);
      setTransactions(data.transactions);
      setLoading(false);
    } catch (error) {
      console.log(error);
      toast.error('Error fetching earnings data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  // Handle withdrawal request
  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      return toast.error('Please fill in all bank details');
    }

    if (!withdrawAmount || withdrawAmount <= 0) {
      return toast.error('Please enter a valid amount');
    }

    if (withdrawAmount > balance) {
      return toast.error('Insufficient balance');
    }

    setProcessingWithdrawal(true);
    try {
      const { data } = await axios.post('/api/v1/earnings/withdraw', {
        amount: withdrawAmount,
        bankDetails
      });

      if (data.success) {
        toast.success('Withdrawal initiated successfully');
        setWithdrawAmount('');
        fetchEarnings();
      }
    } catch (error) {
      console.log(error);
      toast.error('Error processing withdrawal');
    }
    setProcessingWithdrawal(false);
  };

  return (
    <Layout>
      <div className="container py-4">
        <div className="row">
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-body">
                <h3 className="card-title">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                  Available Balance
                </h3>
                <h2 className="display-4 mb-4">₹{balance.toFixed(2)}</h2>

                <form onSubmit={handleWithdraw}>
                  <div className="mb-3">
                    <label className="form-label">Bank Account Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">IFSC Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bankDetails.ifscCode}
                      onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Account Holder Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bankDetails.accountHolderName}
                      onChange={(e) => setBankDetails({...bankDetails, accountHolderName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Withdrawal Amount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="1"
                      max={balance}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={processingWithdrawal}
                  >
                    {processingWithdrawal ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                        Processing...
                      </>
                    ) : (
                      'Withdraw Funds'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h3 className="card-title">
                  <FontAwesomeIcon icon={faHistory} className="me-2" />
                  Recent Transactions
                </h3>
                {loading ? (
                  <div className="text-center py-4">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                  </div>
                ) : (
                  <div className="transaction-list">
                    {transactions.map((tx) => (
                      <div key={tx._id} className="transaction-item border-bottom py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-0">{tx.type}</h6>
                            <small className="text-muted">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                          <div className={`amount ${tx.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                            {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                          </div>
                        </div>
                        <div className="text-muted small">{tx.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Earnings;
