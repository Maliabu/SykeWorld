/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import * as React from "react";
import { Room } from "@/app/types/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import DeleteRoom from "./deleteRoom"
import EditRoom from "./editRoom"

export function RoomCard({
  id,
  roomNumber,
  floor,
  status,
  roomType,
  images,
  services,
  reviews,
}: Room) {
  const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
  const mainImage = images?.[0]?.image || placeholderSvg;
  const [imageError, setImageError] = React.useState(false);

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Room {roomNumber}</CardTitle>
          <div className="flex gap-2">
            <EditRoom id={id} submitId={roomNumber} />
            <DeleteRoom id={id} submitId={roomNumber} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Room image */}
        <div className="relative w-full h-48 mb-4">
          <img
            src={imageError ? placeholderSvg : mainImage}
            alt={`Room ${roomNumber}`}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              // Prevent infinite loop - use data URI placeholder
              if (!e.currentTarget.src.includes('data:image')) {
                e.currentTarget.src = placeholderSvg;
                setImageError(true);
              }
            }}
          />
        </div>

        {/* Room details */}
        <div className="space-y-2">
          <p className="text-lg font-bold text-orange-600">
            {roomType?.name || "No Type"} - ${roomType?.basePrice || "0"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Floor: {floor}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Status: <span className="capitalize">{status}</span></p>
          
          {/* Services */}
          {services && services.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Services:</p>
              <div className="flex flex-wrap gap-2">
                {services.map((service, index) => (
                  <span
                    key={service.id || `service-${index}`}
                    className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full px-2 py-1"
                  >
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reviews ({reviews.length}):</p>
              {reviews.slice(0, 2).map((r, index) => (
                <div key={r.id || `review-${index}`} className="text-xs text-gray-500 dark:text-gray-400">
                  {r.stars}⭐ {r.message?.substring(0, 50)}{r.message && r.message.length > 50 ? '...' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
