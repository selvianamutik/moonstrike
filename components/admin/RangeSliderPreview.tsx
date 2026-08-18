'use client';

import React, { useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import '@/app/admin/range-slider-preview.css';

interface RangeSliderPreviewProps {
  min: number;
  max: number;
  pricePerUnit?: number;
  label?: string;
}

export function RangeSliderPreview({ min, max, pricePerUnit = 0, label }: RangeSliderPreviewProps) {
  const [range, setRange] = useState<[number, number]>([
    Math.floor((max - min) * 0.3 + min),
    Math.floor((max - min) * 0.7 + min),
  ]);

  const totalUnits = range[1] - range[0];
  const totalPrice = totalUnits * pricePerUnit;

  // Generate marks dynamically based on range
  const marks: Record<number, string> = {};
  marks[min] = String(min);
  marks[max] = String(max);

  // Add intermediate marks for better UX
  const rangeSpan = max - min;
  if (rangeSpan > 10) {
    const step = Math.floor(rangeSpan / 4);
    for (let i = 1; i <= 3; i++) {
      const value = min + step * i;
      marks[value] = String(value);
    }
  }

  return (
    <div className="w-full rounded-lg border border-[#334155] bg-[#1E293B] p-6">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white mb-1">
          {label || 'Preview: Range Slider'}
        </h4>
        <p className="text-xs text-[#94A3B8]">
          Customer will see this on the service page
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 rounded-lg border border-[#334155] bg-[#0F172A] p-3">
          <label className="block text-xs text-[#94A3B8] mb-1">From</label>
          <input
            type="number"
            value={range[0]}
            onChange={(e) => {
              const val = Math.max(min, Math.min(Number(e.target.value), range[1]));
              setRange([val, range[1]]);
            }}
            className="w-full bg-transparent border-none text-center text-base font-semibold text-white focus:outline-none"
            min={min}
            max={range[1]}
          />
        </div>
        <div className="flex-1 rounded-lg border border-[#334155] bg-[#0F172A] p-3">
          <label className="block text-xs text-[#94A3B8] mb-1">To</label>
          <input
            type="number"
            value={range[1]}
            onChange={(e) => {
              const val = Math.min(max, Math.max(Number(e.target.value), range[0]));
              setRange([range[0], val]);
            }}
            className="w-full bg-transparent border-none text-center text-base font-semibold text-white focus:outline-none"
            min={range[0]}
            max={max}
          />
        </div>
      </div>

      <div className="px-2 pb-8 range-slider-preview">
        <Slider
          range
          min={min}
          max={max}
          value={range}
          onChange={(val) => setRange(val as [number, number])}
          marks={marks}
          allowCross={false}
          styles={{
            track: { backgroundColor: '#22D3EE', height: 6, borderRadius: 3 },
            rail: { backgroundColor: '#334155', height: 6, borderRadius: 3 },
            handle: {
              borderColor: '#22D3EE',
              backgroundColor: '#22D3EE',
              height: 20,
              width: 20,
              marginTop: -7,
              opacity: 1,
              boxShadow: '0 2px 8px rgba(34, 211, 238, 0.4)',
            },
          }}
        />
      </div>

      {pricePerUnit > 0 && (
        <div className="mt-4 pt-4 border-t border-[#334155]">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#94A3B8]">
              {totalUnits} unit{totalUnits !== 1 ? 's' : ''} × USD {pricePerUnit.toFixed(2)}
            </span>
            <span className="text-white font-semibold">
              USD {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
