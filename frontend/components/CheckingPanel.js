"use client";
import { useState, useEffect } from "react";
// import UncategorizedReview from "@/components/UncategorizedReview";
import UncategorizedReviewChecking from "./UncategorizedReviewChecking";

export default function CheckingPanel() {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [data, setData] = useState([]);
  const [uncategorized, setUncategorized] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryTransactions, setCategoryTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [localCategory, setLocalCategory] = useState("");

  // Helper to display "Income" as "Total Earned"
  const displayCategoryName = (cat) => {
    if (cat === "Income") return "Total Earned";
    return cat;
  };

  useEffect(() => {
    async function fetchPeriods() {
      const res = await fetch("http://localhost:8000/checking/available-statement-periods");
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
          fetch(`http://localhost:8000/checking/summary?statement_period=${encodeURIComponent(selectedPeriod)}`),
          fetch(`http://localhost:8000/checking/uncategorized?statement_period=${encodeURIComponent(selectedPeriod)}`)
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

  const handleDelete = async (txId) => {
    if (!confirm("Are you sure you want to remove this transaction?")) return;

    try {
      await fetch(`http://localhost:8000/checking/delete-transaction/${txId}`, {
        method: "DELETE",
      });
      refreshData();
      fetchCategoryTransactions(selectedCategory);
    } catch (err) {
      console.error("Failed to delete transaction", err);
      alert("Failed to delete transaction.");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/checking/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      refreshData();
    } catch (err) {
      console.error("Error uploading PDF:", err);
      alert("Upload failed. Please try again.");
    }
  };

  const fetchCategoryTransactions = async (category) => {
    const res = await fetch(
      `http://localhost:8000/checking/transactions?statement_period=${encodeURIComponent(selectedPeriod)}&category=${encodeURIComponent(category)}`
    );
    const json = await res.json();
    setSelectedCategory(category);
    setCategoryTransactions(json);
    setEditingId(null);
    setLocalCategory("");
  };

  const handleSave = async (txId) => {
    await fetch("http://localhost:8000/checking/update-category", {
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
    <div className="p-6 text-white bg-black/30 rounded-xl border border-amber-400 shadow-lg">
      <div className="mb-10">
        <label htmlFor="pdf-upload" className="block mb-4 text-lg font-semibold text-amber-300">
          Upload Checking PDF 
        </label>
        <input
          type="file"
          id="pdf-upload"
          accept=".pdf"
          onChange={handleUpload}
          className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-6 file:rounded-lg file:border-0
                     file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500
                     transition-all duration-200"
        />
      </div>

      <h2 className="text-2xl font-bold mt-2 mb-4">Select Statement Period</h2>

      <select
        className="border border-gray-300 p-2 mb-6 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value)}
      >
        {periods.map((period) => (
          <option key={period} value={period}>
            {period}
          </option>
        ))}
      </select>

      <div>
        <h2 className="text-xl font-semibold mb-2">Category Totals</h2>
        <ul className="space-y-2 text-gray-300">
          {data.map((item) => (
            <li
              key={item.category}
              className="flex justify-between border-b pb-1 cursor-pointer hover:text-amber-400"
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
              <span className="font-medium">{displayCategoryName(item.category)}</span>
              <span>${item.total.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      {selectedCategory && (
        <div className="mt-6 bg-gray-800 p-4 rounded">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Transactions in {displayCategoryName(selectedCategory)}</h3>
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
                            "Income",    
                            "Misc",
                            "Other",
                          ].map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <button
                          className="bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave(tx.id);
                          }}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">{tx.category}</span>
                        <button
                          className="text-xs text-red-400 hover:text-red-600 underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tx.id);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {uncategorized.length > 0 && (
        <UncategorizedReviewChecking transactions={uncategorized} onCategoryUpdate={refreshData} />
      )}
    </div>
  );
}
