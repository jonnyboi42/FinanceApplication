"use client";
import { useState, useEffect } from "react";
import UncategorizedReview from "./UncategorizedReview";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border p-2 rounded shadow text-sm">
        <p className="font-semibold">{label}</p>
        <p>${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
}

export default function SpendingSummary() {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [data, setData] = useState([]);
  const [uncategorized, setUncategorized] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryTransactions, setCategoryTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [localCategory, setLocalCategory] = useState("");

  // Fetch statement periods, not months
  useEffect(() => {
    async function fetchPeriods() {
      const res = await fetch("http://localhost:8000/available-statement-periods");
      const json = await res.json();
      setPeriods(json);
      if (json.length > 0) {
        setSelectedPeriod(json[0]);
      }
    }
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (!selectedPeriod) return;

    async function fetchData() {
      try {
        const [summaryRes, uncategorizedRes] = await Promise.all([
          fetch(`http://localhost:8000/summary?statement_period=${encodeURIComponent(selectedPeriod)}`),
          fetch(`http://localhost:8000/uncategorized?statement_period=${encodeURIComponent(selectedPeriod)}`)
        ]);

        const summaryJson = await summaryRes.json();
        const uncategorizedJson = await uncategorizedRes.json();

        setData(summaryJson.summary || []);
        setUncategorized(uncategorizedJson || []);
        setSelectedCategory(null);
        setCategoryTransactions([]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    fetchData();
  }, [selectedPeriod]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
  
      if (!res.ok) throw new Error("Upload failed");
  
      // Optionally show a toast or success message
      refreshData(); // Trigger data refresh
    } catch (err) {
      console.error("Error uploading PDF:", err);
      alert("Upload failed. Please try again.");
    }
  };
  

  const fetchCategoryTransactions = async (category) => {
    const res = await fetch(
      `http://localhost:8000/transactions?statement_period=${encodeURIComponent(selectedPeriod)}&category=${encodeURIComponent(category)}`
    );
    const json = await res.json();
    setSelectedCategory(category);
    setCategoryTransactions(json);
    setEditingId(null);
    setLocalCategory("");
  };

  const handleSave = async (txId) => {
    await fetch("http://localhost:8000/update-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tx_id: txId, new_category: localCategory }),
    });

    setEditingId(null);
    refreshData();
    fetchCategoryTransactions(selectedCategory);
  };

  const refreshData = () => {
    setSelectedPeriod((prev) => prev);
  };

  return (
<div className="p-6 text-white">
  <div className="mb-10 bg-white/5 backdrop-blur-md border border-purple-500 rounded-xl p-6 shadow-[0_0_20px_#a855f7]">
    <label
      htmlFor="pdf-upload"
      className="block mb-4 text-lg font-semibold text-purple-300"
    >
      Upload Wells Fargo PDF Statement
    </label>
    <input
      type="file"
      id="pdf-upload"
      accept=".pdf"
      onChange={handleUpload}
      className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-6 file:rounded-lg file:border-0
                 file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500
                 transition-all duration-200"
    />
  </div>

      <h1 className="text-3xl font-bold mb-6">Spending Summary</h1>

      <select
        className="border border-gray-300 p-2 mb-6 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value)}
      >
        {periods.map((period) => (
          <option key={period} value={period}>
            {period}
          </option>
        ))}
      </select>

      <div className="h-72 w-full bg-white rounded shadow p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <defs>
              <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" stroke="#6B7280" tick={{ fontSize: 12 }} />
            <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="url(#barColor)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Category Totals</h2>
        <ul className="space-y-2 text-gray-300">
          {data.map((item) => (
            <li
              key={item.category}
              className="flex justify-between border-b pb-1 cursor-pointer hover:text-blue-400"
              onClick={() => {
                if (selectedCategory === item.category) {
                  setSelectedCategory(null);
                  setCategoryTransactions([]);
                  setEditingId(null);
                } else {
                  fetchCategoryTransactions(item.category);
                }
              }}
            >
              <span className="font-medium">{item.category}</span>
              <span>${item.total.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      {selectedCategory && (
        <div className="mt-6 bg-gray-800 p-4 rounded">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">
              Transactions in {selectedCategory}
            </h3>
            <button
              className="text-sm text-gray-400 hover:text-red-400"
              onClick={() => {
                setSelectedCategory(null);
                setCategoryTransactions([]);
                setEditingId(null);
              }}
            >
              ✕ Close
            </button>
          </div>
          <ul className="space-y-1 text-gray-300">
            {categoryTransactions.map((tx) => {
              const isEditing = editingId === tx.id;
              return (
                <li
                  key={tx.id}
                  className={`border-b border-gray-600 py-2 px-2 rounded transition-colors ${
                    isEditing ? "bg-gray-800" : "hover:bg-gray-700 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!isEditing) {
                      setEditingId(tx.id);
                      setLocalCategory(tx.category);
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {tx.date} – {tx.description}
                      </p>
                      <p className="text-sm">${tx.amount.toFixed(2)}</p>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1 text-black"
                          value={localCategory}
                          onChange={(e) => setLocalCategory(e.target.value)}
                        >
                          {[
                            "Groceries",
                            "Dining",
                            "Subscriptions",
                            "Retail",
                            "Travel",
                            "Online Services",
                            "Misc",
                            "Other",
                          ].map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave(tx.id);
                          }}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">{tx.category}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {uncategorized.length > 0 && (
        <UncategorizedReview
          transactions={uncategorized}
          onCategoryUpdate={refreshData}
        />
      )}
    </div>
  );
}
