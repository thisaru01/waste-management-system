// src/components/ui/StatCard.jsx

import React from 'react';
// Assuming Card components are defined and exported from Card.jsx
import { Card, CardContent } from './Card'; 

/**
 * Displays a key performance indicator with a trend value.
 */
export default function StatCard({ title, value, unit = '', trendValue, trendType = 'positive' }) {
  // Determine color and icon for the trend
  const trendColor = trendType === 'positive' ? 'text-green-600' : 'text-red-600';
  const trendIcon = trendType === 'positive' ? '▲' : '▼';

  return (
    <Card className="shadow-sm">
      <CardContent>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="flex items-end justify-between mt-1">
          <p className="text-3xl font-bold text-gray-900">
            {value} <span className="text-xl font-normal text-gray-500">{unit}</span>
          </p>
          <div className={`flex items-center text-sm font-medium ${trendColor}`}>
            {trendIcon} {trendValue}
          </div>
        </div>
      </CardContent>
      
    </Card>
  );
}