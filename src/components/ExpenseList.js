import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSortAmountDownAlt, FaSortAmountUp } from 'react-icons/fa';
import './ExpenseList.css';

const ExpenseList = () => {
    const [expenses, setExpenses] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentExpense, setCurrentExpense] = useState(null);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [searchCategory, setSearchCategory] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [sortBy, setSortBy] = useState('amount');
    const [sortOrder, setSortOrder] = useState('asc');
    const [editingIndex, setEditingIndex] = useState(null); // Track the index of the expense being edited

    useEffect(() => {
        const fetchExpenses = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get('http://localhost:5000/api/expenses', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setExpenses(response.data);
            } catch (error) {
                console.error('Error fetching expenses:', error);
            }
        };
        fetchExpenses();
    }, []);

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/expenses/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExpenses(expenses.filter(expense => expense._id !== id));
        } catch (error) {
            console.error('Error deleting expense:', error.response ? error.response.data : error.message);
        }
    };

    const handleEdit = (expense, index) => {
        setCurrentExpense(expense);
        setDescription(expense.description || '');
        setAmount(expense.amount);
        setCategory(expense.category);
        setDate(new Date(expense.createdAt).toISOString().slice(0, 10));
        setIsEditing(true);
        setEditingIndex(index); // Set the index of the current expense being edited
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const updatedExpense = {
                description: description || undefined, // Keep description optional
                amount: Number(amount),
                category,
                createdAt: date,
            };
            await axios.put(`http://localhost:5000/api/expenses/${currentExpense._id}`, updatedExpense, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExpenses(expenses.map(expense =>
                expense._id === currentExpense._id ? { ...expense, ...updatedExpense } : expense
            ));
            resetForm();
        } catch (error) {
            console.error('Error updating expense:', error.response ? error.response.data : error.message);
        }
    };

    const resetForm = () => {
        setCurrentExpense(null);
        setDescription('');
        setAmount('');
        setCategory('');
        setDate('');
        setIsEditing(false);
        setEditingIndex(null); // Reset the editing index
    };

    const calculateTotalExpenses = () => {
        const filteredExpenses = expenses.filter(expense => {
            const matchesCategory = searchCategory ? expense.category === searchCategory : true;
            const matchesDate = searchDate ? new Date(expense.createdAt).toISOString().slice(0, 10) === searchDate : true;
            return matchesCategory && matchesDate;
        });
        return filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
    };

    const filteredExpenses = expenses.filter(expense => {
        const matchesCategory = searchCategory ? expense.category === searchCategory : true;
        const matchesDate = searchDate ? new Date(expense.createdAt).toISOString().slice(0, 10) === searchDate : true;
        return matchesCategory && matchesDate;
    });

    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
        const aValue = sortBy === 'amount' ? a.amount : new Date(a.createdAt).getTime();
        const bValue = sortBy === 'amount' ? b.amount : new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    const handleClearFilters = () => {
        setSearchCategory('');
        setSearchDate('');
        setSortBy('amount');
        setSortOrder('asc');
    };

    return (
        <div>
            <h2>Your Expenses</h2>
            <div className="search-bar">
                <div className="filter-container">
                    <select onChange={(e) => setSearchCategory(e.target.value)} value={searchCategory}>
                        <option value="">All Categories</option>
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Health">Health</option>
                        <option value="Education">Education</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Bills">Bills</option>
                        <option value="Rent">Rent</option>
                        <option value="Other">Other</option>
                    </select>
                    <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                    />
                    <button onClick={handleClearFilters}>Clear Filters</button>
                </div>
                <div className="sort-container">
                    <select onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
                        <option value="amount">Sort by Amount</option>
                        <option value="date">Sort by Date</option>
                    </select>
                    <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                        {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDownAlt />}
                    </button>
                </div>
            </div>

            <h3>Total Expenses: ₹{calculateTotalExpenses().toFixed(2)}</h3> {/* Total displayed here */}

            {sortedExpenses.length === 0 ? (
                <p>No expenses found for the selected filters.</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>Amount</th>
                                <th>Category</th>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedExpenses.map((expense, index) => (
                                <React.Fragment key={expense._id}>
                                    <tr>
                                        <td>₹{expense.amount}</td>
                                        <td>{expense.category}</td>
                                        <td>{new Date(expense.createdAt).toLocaleDateString()}</td>
                                        <td>{expense.description}</td>
                                        <td>
                                            <button onClick={() => handleEdit(expense, index)}>Update</button>
                                            <button onClick={() => handleDelete(expense._id)}>Delete</button>
                                        </td>
                                    </tr>
                                    {isEditing && editingIndex === index && ( // Show form below the selected row
                                    <tr>
                                        <td colSpan="5">
                                            <form onSubmit={handleUpdate}>
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    required
                                                />
                                                <select
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Category</option>
                                                    <option value="Food">Food</option>
                                                    <option value="Transport">Transport</option>
                                                    <option value="Entertainment">Entertainment</option>
                                                    <option value="Utilities">Utilities</option>
                                                    <option value="Health">Health</option>
                                                    <option value="Education">Education</option>
                                                    <option value="Shopping">Shopping</option>
                                                    <option value="Bills">Bills</option>
                                                    <option value="Rent">Rent</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Description (optional)"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                />
                                                <button type="submit">Update Expense</button>
                                                <button type="button" onClick={resetForm}>Cancel</button>
                                            </form>
                                        </td>
                                    </tr>
                                )}

                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default ExpenseList;
