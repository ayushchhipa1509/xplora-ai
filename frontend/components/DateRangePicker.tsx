"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

interface DateRangePickerProps {
  onDateSelect: (checkIn: string, checkOut: string) => void;
  minDate?: string;
  disabled?: boolean;
}

export default function DateRangePicker({
  onDateSelect,
  minDate,
  disabled = false,
}: DateRangePickerProps) {
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");

  // Get minimum date (today or provided minDate)
  const getMinDate = () => {
    if (minDate) return minDate;
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get minimum checkout date (day after check-in)
  const getMinCheckoutDate = () => {
    if (!checkIn) return getMinDate();
    const checkInDate = new Date(checkIn);
    checkInDate.setDate(checkInDate.getDate() + 1);
    return checkInDate.toISOString().split("T")[0];
  };

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleConfirm = () => {
    if (checkIn && checkOut) {
      onDateSelect(checkIn, checkOut);
    }
  };

  const nights = calculateNights();

  return (
    <div className="bg-white rounded-xl border-2 border-gray-100 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-indigo-600" />
        Select Your Travel Dates
      </h3>

      <div className="space-y-3">
        {/* Check-in Date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Check-in Date
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={getMinDate()}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>

        {/* Check-out Date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Check-out Date
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={getMinCheckoutDate()}
            disabled={disabled || !checkIn}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>

        {/* Nights Display */}
        {nights > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-center">
            <p className="text-xs font-medium text-indigo-700">
              {nights} Night{nights !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={disabled || !checkIn || !checkOut}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Confirm Dates
        </button>
      </div>
    </div>
  );
}
