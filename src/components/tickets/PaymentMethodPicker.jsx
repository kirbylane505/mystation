/**
 * MYTICKETSLIVE - Payment Method Picker
 * CashApp, Zelle, Apple Pay selection with premium styling
 */

'use client';

import { DollarSign, Mail, Smartphone } from 'lucide-react';

const METHODS = [
  {
    id: 'cashapp',
    name: 'CashApp',
    icon: DollarSign,
    color: '#00D632',
    bgActive: 'bg-[#00D632]/20',
    borderActive: 'border-[#00D632]',
    ringActive: 'ring-[#00D632]/30',
    textActive: 'text-[#00D632]',
  },
  {
    id: 'zelle',
    name: 'Zelle',
    icon: Mail,
    color: '#6D1ED4',
    bgActive: 'bg-[#6D1ED4]/20',
    borderActive: 'border-[#6D1ED4]',
    ringActive: 'ring-[#6D1ED4]/30',
    textActive: 'text-[#6D1ED4]',
  },
  {
    id: 'applepay',
    name: 'Apple Pay',
    icon: Smartphone,
    color: '#FFFFFF',
    bgActive: 'bg-white/15',
    borderActive: 'border-white/60',
    ringActive: 'ring-white/20',
    textActive: 'text-white',
  },
];

export default function PaymentMethodPicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {METHODS.map((method) => {
        const isSelected = selected === method.id;
        const Icon = method.icon;

        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={`relative flex flex-col items-center gap-2.5 px-4 py-5 rounded-xl border-2 transition-all duration-300 ${
              isSelected
                ? `${method.bgActive} ${method.borderActive} ring-2 ${method.ringActive} scale-[1.03] shadow-lg`
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            {/* Icon circle */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isSelected ? 'scale-110' : ''
              }`}
              style={{
                background: isSelected
                  ? `${method.color}22`
                  : 'rgba(255,255,255,0.08)',
              }}
            >
              <Icon
                size={22}
                style={{ color: isSelected ? method.color : 'rgba(255,255,255,0.4)' }}
                className="transition-colors duration-300"
              />
            </div>

            {/* Label */}
            <span
              className={`text-sm font-bold transition-colors duration-300 ${
                isSelected ? method.textActive : 'text-white/50'
              }`}
              style={isSelected ? { color: method.color } : undefined}
            >
              {method.name}
            </span>

            {/* Selected indicator dot */}
            {isSelected && (
              <div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: method.color }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke={method.id === 'applepay' ? '#000' : '#FFF'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
