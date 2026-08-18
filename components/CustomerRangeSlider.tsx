'use client';

import React from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface CustomerRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label: string;
}

export function CustomerRangeSlider({ min, max, step = 1, value, onChange, label }: CustomerRangeSliderProps) {
  // Generate marks dynamically
  const marks: Record<number, string> = {};
  marks[min] = String(min);
  marks[max] = String(max);

  // Add intermediate marks for better UX
  const rangeSpan = max - min;
  if (rangeSpan > 10) {
    const markStep = Math.floor(rangeSpan / 4);
    for (let i = 1; i <= 3; i++) {
      const markValue = min + markStep * i;
      marks[markValue] = String(markValue);
    }
  }

  return (
    <div className="customer-range-slider">
      <Slider
        range
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(val) => onChange(val as [number, number])}
        marks={marks}
        allowCross={false}
        styles={{
          track: { 
            backgroundColor: 'var(--ms-gradient-end, #22D3EE)', 
            height: 6, 
            borderRadius: 3 
          },
          rail: { 
            backgroundColor: 'var(--ms-border, #334155)', 
            height: 6, 
            borderRadius: 3 
          },
          handle: {
            borderColor: 'var(--ms-gradient-end, #22D3EE)',
            backgroundColor: 'var(--ms-gradient-end, #22D3EE)',
            height: 20,
            width: 20,
            marginTop: -7,
            opacity: 1,
            boxShadow: '0 2px 8px rgba(34, 211, 238, 0.4)',
          },
        }}
        aria-label={label}
      />
    </div>
  );
}
