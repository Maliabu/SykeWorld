"use client";

import AddBookingCard from "../add-booking-card";

export default function AddBookingPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Add New Booking</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create a booking for customers checking in at the reception
          </p>
        </div>
        <AddBookingCard />
      </div>
    </div>
  );
}


