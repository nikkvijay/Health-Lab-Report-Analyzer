import React from "react";
import TrendChart from "../components/Charts/TrendChart";

const Trends = () => {
  // Mock historical data
  const mockTrendData = [
    { date: "2024-01", glucose: 92, cholesterol: 180, bloodPressure: 120 },
    { date: "2024-02", glucose: 88, cholesterol: 175, bloodPressure: 118 },
    { date: "2024-03", glucose: 95, cholesterol: 190, bloodPressure: 125 },
    { date: "2024-04", glucose: 91, cholesterol: 185, bloodPressure: 122 },
    { date: "2024-05", glucose: 89, cholesterol: 170, bloodPressure: 115 },
    { date: "2024-06", glucose: 95, cholesterol: 220, bloodPressure: 128 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Trends</h1>
        <p className="text-gray-600">Track your health parameters over time</p>
      </div>

      <TrendChart data={mockTrendData} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Latest Glucose
          </h3>
          <p className="text-3xl font-bold text-blue-600 mb-1">95 mg/dL</p>
          <p className="text-sm text-green-600">↗ 6.7% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Latest Cholesterol
          </h3>
          <p className="text-3xl font-bold text-red-600 mb-1">220 mg/dL</p>
          <p className="text-sm text-red-600">↗ 18.9% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Latest Blood Pressure
          </h3>
          <p className="text-3xl font-bold text-green-600 mb-1">128 mmHg</p>
          <p className="text-sm text-red-600">↗ 11.3% from last month</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-3">
          Health Recommendations
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-amber-800">
              Your cholesterol has increased significantly. Consider reducing
              saturated fat intake.
            </p>
          </li>
          <li className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-amber-800">
              Blood pressure is slightly elevated. Regular exercise may help
              improve cardiovascular health.
            </p>
          </li>
          <li className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-amber-800">
              Glucose levels remain stable. Continue your current dietary
              habits.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Trends;
