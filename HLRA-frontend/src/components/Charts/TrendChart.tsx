import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { TrendingUp, Info } from "lucide-react";

interface TrendChartProps {
  data: Array<{
    date: string;
    glucose: number;
    cholesterol: number;
    bloodPressure: number;
  }>;
  title?: string;
  showReferenceRanges?: boolean;
  height?: number;
}

const TrendChart: React.FC<TrendChartProps> = ({ 
  data, 
  title = "Clinical Parameter Trends",
  showReferenceRanges = true,
  height = 400 
}) => {
  
  // Reference ranges for clinical parameters
  const referenceRanges = {
    glucose: { min: 70, max: 100, optimal: { min: 80, max: 90 } },
    cholesterol: { min: 125, max: 200, optimal: { min: 150, max: 180 } },
    bloodPressure: { min: 90, max: 120, optimal: { min: 100, max: 110 } }
  };
  
  const getParameterStatus = (value: number, param: 'glucose' | 'cholesterol' | 'bloodPressure') => {
    const range = referenceRanges[param];
    if (value < range.min * 0.8 || value > range.max * 1.3) return 'critical';
    if (value < range.min || value > range.max) return 'abnormal';
    if (range.optimal && value >= range.optimal.min && value <= range.optimal.max) return 'optimal';
    return 'normal';
  };
  
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-xl">
          <p className="text-parameter-label text-slate-700 mb-3">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => {
            const status = getParameterStatus(entry.value, entry.dataKey);
            const statusColor = 
              status === 'critical' ? 'text-red-600' :
              status === 'abnormal' ? 'text-orange-600' :
              status === 'optimal' ? 'text-emerald-600' : 'text-blue-600';
            
            return (
              <div key={index} className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium text-slate-700">{entry.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${statusColor}`}>
                    {entry.value}
                  </span>
                  <div className="text-xs text-slate-500">
                    {status === 'optimal' ? '✓ Optimal' : 
                     status === 'normal' ? '✓ Normal' :
                     status === 'abnormal' ? '⚠ Abnormal' : '🚨 Critical'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border-2 border-slate-200 p-6 card-enhanced">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-medical-heading">{title}</h3>
            <p className="text-xs text-slate-500">Clinical values over time with reference ranges</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showReferenceRanges && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Info className="h-3 w-3" />
              <span>Reference ranges shown</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" strokeOpacity={0.6} />
            
            {/* Reference ranges for glucose */}
            {showReferenceRanges && (
              <>
                <ReferenceArea
                  y1={referenceRanges.glucose.min}
                  y2={referenceRanges.glucose.max}
                  fill="#dbeafe"
                  fillOpacity={0.1}
                  stroke="#3b82f6"
                  strokeOpacity={0.2}
                />
                <ReferenceLine 
                  y={referenceRanges.glucose.optimal.min} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.5}
                  label={{ value: "Optimal Range", position: "insideTopRight", fontSize: 10 }}
                />
                <ReferenceLine 
                  y={referenceRanges.glucose.optimal.max} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.5}
                />
              </>
            )}
            
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              stroke="#94a3b8" 
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              stroke="#94a3b8"
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
              label={{ 
                value: 'Clinical Values', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: 12, fill: '#64748b' }
              }}
            />
            
            <Tooltip content={customTooltip} />
            
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontSize: '12px',
                color: '#475569'
              }}
            />
            
            {/* Clinical parameter lines with medical-grade styling */}
            <Line
              type="monotone"
              dataKey="glucose"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ 
                fill: "#0ea5e9", 
                strokeWidth: 2, 
                r: 5,
                stroke: '#ffffff'
              }}
              activeDot={{ 
                r: 7, 
                fill: '#0ea5e9',
                stroke: '#ffffff',
                strokeWidth: 2
              }}
              name="Glucose (mg/dL)"
            />
            <Line
              type="monotone"
              dataKey="cholesterol"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ 
                fill: "#f59e0b", 
                strokeWidth: 2, 
                r: 5,
                stroke: '#ffffff'
              }}
              activeDot={{ 
                r: 7, 
                fill: '#f59e0b',
                stroke: '#ffffff',
                strokeWidth: 2
              }}
              name="Cholesterol (mg/dL)"
            />
            <Line
              type="monotone"
              dataKey="bloodPressure"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ 
                fill: "#16a34a", 
                strokeWidth: 2, 
                r: 5,
                stroke: '#ffffff'
              }}
              activeDot={{ 
                r: 7, 
                fill: '#16a34a',
                stroke: '#ffffff',
                strokeWidth: 2
              }}
              name="Blood Pressure (mmHg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;
