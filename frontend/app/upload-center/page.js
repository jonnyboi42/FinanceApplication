"use client";
import CreditCardPanel from "@/components/CreditCardPanel";
import CheckingPanel from "@/components/CheckingPanel";

export default function UploadCenterPage() {
  return (
    <div className="p-6 space-y-12 text-white">
      <h1 className="text-3xl font-bold mb-4">Upload Center</h1>

      
        <CreditCardPanel />
        <CheckingPanel />

    </div>
  );
}
