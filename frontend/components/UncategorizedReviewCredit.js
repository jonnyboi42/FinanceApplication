"use client";

import { useState } from "react";

const CATEGORIES = [
  "Groceries",
  "Dining",
  "Subscriptions",
  "Retail",
  "Travel",
  "Online Services",
  "Misc",
];

export default function UncategorizedReviewCredit({ transactions, onCategoryUpdate }) {
  const [selected, setSelected] = useState({});

  const handleChange = (txId, category) => {
    setSelected((prev) => ({ ...prev, [txId]: category }));
  };

  const handleSubmit = async () => {
    for (const [txId, newCategory] of Object.entries(selected)) {
      await fetch("http://localhost:8000/credit/update-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_id: parseInt(txId), new_category: newCategory }),
      });
    }

    onCategoryUpdate();
  };

  return (
    <div className="border border-yellow-500 p-4 rounded shadow mt-6 bg-transparent">
      <h2 className="text-lg font-semibold text-yellow-400 mb-2">Uncategorized Transactions</h2>
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-300">No uncategorized transactions.</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{tx.description}</p>
                <p className="text-sm text-gray-400">${tx.amount.toFixed(2)}</p>
              </div>
              <select
                className="border rounded px-2 py-1 bg-black text-white"
                value={selected[tx.id] || ""}
                onChange={(e) => handleChange(tx.id, e.target.value)}
              >
                <option value="" className="bg-black text-white">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-black text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button
            className="mt-4 bg-yellow-500 text-black font-semibold px-4 py-2 rounded hover:bg-yellow-600"
            onClick={handleSubmit}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
