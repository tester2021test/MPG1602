import React, { useState, useEffect, useMemo } from 'react';

// --- Authorized Owner Email (Strict Single-User Access Control) ---
const ALLOWED_EMAIL = 'vivekdn2504@gmail.com';

// --- Read Firebase Config from Vite Env (GitHub Actions) or Live Preview Globals ---
const getFirebaseConfig = (): Record<string, string> | null => {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env;
    if (metaEnv && metaEnv.VITE_FIREBASE_API_KEY) {
      return {
        apiKey: metaEnv.VITE_FIREBASE_API_KEY,
        authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: metaEnv.VITE_FIREBASE_APP_ID || ''
      };
    }
  } catch {
    // Ignore import.meta access errors in non-Vite runtimes
  }
  try {
    const g = globalThis as Record<string, unknown>;
    if (typeof g.__firebase_config === 'string' && g.__firebase_config) {
      return JSON.parse(g.__firebase_config);
    }
  } catch {
    // Ignore global config parse errors
  }
  return null;
};

const getAppId = (): string => {
  try {
    const g = globalThis as Record<string, unknown>;
    if (typeof g.__app_id === 'string' && g.__app_id) return g.__app_id;
  } catch {
    // Ignore
  }
  return 'home-renovation-manager';
};

const appId = getAppId();

// --- TypeScript Interfaces ---
interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  costType: 'Material' | 'Labour' | 'General' | string;
  paidBy: string;
  vendor: string;
  mode: string;
  status: string;
  date: string;
  notes?: string;
  receipt?: string | null;
}

interface MilestoneItem {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Due Soon' | 'Overdue' | 'Upcoming' | string;
}

interface VendorItem {
  id: string;
  name: string;
  trade: string;
  quoted: number;
  phone: string;
  milestones: MilestoneItem[];
}

interface ProjectData {
  id: 'interior';
  name: string;
  shortName: string;
  vendors: VendorItem[];
  expenses: ExpenseItem[];
}

interface MajuriEntry {
  id: string;
  vendor?: string;
  roomId: string;
  item: string;
  qty?: number;
  unit: 'ft' | 'in';
  height: number;
  width: number;
  sqft: number;
  rate: number;
  amount: number;
  date: string;
}

interface CarpenterAdvance {
  id: string;
  vendor?: string;
  syncedExpenseId?: string | null;
  weekLabel: string;
  amount: number;
  mode: string;
  paidBy: string;
  date: string;
  notes?: string;
}

interface IconProps {
  className?: string;
}

// --- Self-Contained Crisp SVG Icons (Zero External Bundle Mismatch) ---
const HomeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const PlusIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const SunIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const LayoutGridIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="7" height="7" x="3" y="3" rx="1.5" />
    <rect width="7" height="7" x="14" y="3" rx="1.5" />
    <rect width="7" height="7" x="14" y="14" rx="1.5" />
    <rect width="7" height="7" x="3" y="14" rx="1.5" />
  </svg>
);

const ReceiptIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" />
  </svg>
);

const HardHatIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
    <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
    <path d="M4 15v-3a6 6 0 0 1 6-6h0" />
    <path d="M14 6h0a6 6 0 0 1 6 6v3" />
  </svg>
);

const BarChartIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const RulerIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
    <path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" />
  </svg>
);

const DownloadIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const PrinterIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect width="12" height="8" x="6" y="14" />
  </svg>
);

const FileSpreadsheetIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" />
  </svg>
);

const CheckCircleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const AlertTriangleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" /><path d="M12 17h.01" />
  </svg>
);

const ArrowUpRightIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 7h10v10" /><path d="M7 17 17 7" />
  </svg>
);

const SearchIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const EditIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const TrashIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const XIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

const RupeeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" />
    <path d="M9 13c6.667 0 6.667-10 0-10" />
  </svg>
);

const CameraIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const ImageIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const CloudIcon: React.FC<IconProps> = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);

const CloudOffIcon: React.FC<IconProps> = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 2 20 20" /><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193" />
    <path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07" />
  </svg>
);

const LogOutIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const LayersIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const ChefHatIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
    <line x1="6" x2="18" y1="17" y2="17" />
  </svg>
);

const SofaIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
    <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
    <path d="M4 18v2" /><path d="M20 18v2" />
  </svg>
);

const SparklesIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

const TvIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
    <polyline points="17 2 12 7 7 2" />
  </svg>
);

const CompassIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const BookOpenIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const BedIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" />
  </svg>
);

const DoorOpenIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 4h3a2 2 0 0 1 2 2v14" /><path d="M2 20h3" /><path d="M13 20h9" />
    <path d="M10 12v.01" /><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z" />
  </svg>
);

const CopyIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const SmartphoneIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </svg>
);

// --- Native Responsive SVG Chart Components ---
interface ChartSlice {
  name: string;
  value: number;
  color: string;
}

const NativeDonutChart: React.FC<{ data: ChartSlice[]; size?: number; strokeWidth?: number }> = ({
  data,
  size = 136,
  strokeWidth = 18
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  let cumulativeOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-100 dark:text-slate-800"
      />
      {total > 0 &&
        data.map((item) => {
          const val = Number(item.value) || 0;
          if (val <= 0) return null;
          const segmentLen = (val / total) * circumference;
          const dashArray = `${Math.max(2, segmentLen - 2)} ${circumference}`;
          const dashOffset = -cumulativeOffset;
          cumulativeOffset += segmentLen;
          return (
            <circle
              key={item.name}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          );
        })}
    </svg>
  );
};

interface BarDatum {
  name: string;
  Actual: number;
  color: string;
}

const NativeBarChart: React.FC<{ data: BarDatum[] }> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="h-44 flex items-center justify-center text-xs font-bold text-slate-400">
        No expense data logged yet
      </div>
    );
  }
  const maxVal = Math.max(1, ...data.map((d) => d.Actual));
  return (
    <div className="h-52 flex flex-col justify-end pt-4 pb-1">
      <div className="flex-1 flex items-end justify-around gap-2 px-1 border-b border-slate-200 dark:border-slate-700">
        {data.map((item) => {
          const heightPct = Math.max(8, Math.round((item.Actual / maxVal) * 100));
          return (
            <div key={item.name} className="flex-1 flex flex-col items-center h-full justify-end">
              <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 mb-1">
                ₹{item.Actual}k
              </span>
              <div
                className="w-full max-w-[34px] rounded-t-xl transition-all duration-500"
                style={{ height: `${heightPct}%`, backgroundColor: item.color }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-around gap-2 px-1 pt-2">
        {data.map((item) => (
          <span
            key={item.name}
            className="flex-1 text-center text-[10px] font-extrabold text-slate-500 dark:text-slate-400 truncate"
          >
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
};

interface AreaDatum {
  date: string;
  cumulative: number;
}

const NativeAreaChart: React.FC<{ data: AreaDatum[] }> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-xs font-bold text-slate-400">
        Log bills to view spend trend
      </div>
    );
  }
  const width = 320;
  const height = 165;
  const padX = 24;
  const padY = 22;
  const maxVal = Math.max(1, ...data.map((d) => d.cumulative));
  const stepX = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = data.length > 1 ? padX + i * stepX : width / 2;
    const y = height - padY - (d.cumulative / maxVal) * (height - padY * 2);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
      <defs>
        <linearGradient id="homeledgerAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#homeledgerAreaGrad)" />
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.date}>
          <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fontWeight="700" fill="#6366f1">
            ₹{p.cumulative}k
          </text>
          <text x={p.x} y={height - 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#94a3b8">
            {p.date}
          </text>
        </g>
      ))}
    </svg>
  );
};

// --- Indian Currency Formatter ---
const formatINR = (amount: number | string, compact = false): string => {
  const num = Number(amount) || 0;
  if (compact) {
    if (Math.abs(num) >= 100000) {
      return `₹${(num / 100000).toFixed(2).replace(/\.00$/, '')}L`;
    }
    if (Math.abs(num) >= 1000) {
      return `₹${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

interface CategoryDef {
  id: string;
  label: string;
  shortLabel: string;
  IconComp: React.FC<IconProps>;
  color: string;
  bg: string;
  text: string;
}

const INTERIOR_CATEGORIES: CategoryDef[] = [
  { id: 'carpentry', label: 'Carpentry & Woodwork', shortLabel: 'Carpentry', IconComp: LayersIcon, color: '#d97706', bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  { id: 'modular', label: 'Modular & Hardware', shortLabel: 'Modular', IconComp: ChefHatIcon, color: '#f97316', bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
  { id: 'furniture', label: 'Furniture & Sofa', shortLabel: 'Furniture', IconComp: SofaIcon, color: '#6366f1', bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'furnishings', label: 'Soft Furnishings & Decor', shortLabel: 'Decor', IconComp: SparklesIcon, color: '#ec4899', bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400' },
  { id: 'appliances', label: 'Appliances & Electronics', shortLabel: 'Appliances', IconComp: TvIcon, color: '#06b6d4', bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400' },
  { id: 'design', label: 'Design & Consultation', shortLabel: 'Design', IconComp: CompassIcon, color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' }
];

const findCategoryById = (catId: string): CategoryDef => {
  return INTERIOR_CATEGORIES.find((c) => c.id === catId) || INTERIOR_CATEGORIES[0];
};

const COST_TYPES = [
  { id: 'Material', label: 'Material', color: '#6366f1' },
  { id: 'Labour', label: 'Labour', color: '#f97316' },
  { id: 'General', label: 'Service/Fee', color: '#10b981' }
];

const FAMILY_MEMBERS = [
  { id: 'You', label: 'You', color: '#6366f1' },
  { id: 'Spouse', label: 'Spouse', color: '#ec4899' },
  { id: 'Parents', label: 'Parents', color: '#10b981' },
  { id: 'Supervisor', label: 'Site Sup.', color: '#f59e0b' }
];

const PAYMENT_MODES = [
  { id: 'UPI', label: 'UPI', color: '#6366f1' },
  { id: 'Bank Transfer', label: 'Bank', color: '#0ea5e9' },
  { id: 'Cash', label: 'Cash', color: '#10b981' },
  { id: 'Credit Card', label: 'Card', color: '#f59e0b' }
];

const PAYMENT_STATUSES = [
  { id: 'Paid', label: 'Paid', badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  { id: 'Advance', label: 'Advance', badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  { id: 'Pending', label: 'Pending Due', badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' }
];

const MAJURI_ROOMS: CategoryDef[] = [
  { id: 'living', label: 'Living Room', shortLabel: 'Living', IconComp: SofaIcon, color: '#6366f1', bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'kitchen', label: 'Kitchen', shortLabel: 'Kitchen', IconComp: ChefHatIcon, color: '#f97316', bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
  { id: 'study', label: 'Study Room', shortLabel: 'Study', IconComp: BookOpenIcon, color: '#06b6d4', bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400' },
  { id: 'master_bedroom', label: 'Master Bedroom', shortLabel: 'Master Bed', IconComp: BedIcon, color: '#ec4899', bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400' },
  { id: 'safety_shoe', label: 'Safety Door & Shoe Rack', shortLabel: 'Safety & Shoe', IconComp: DoorOpenIcon, color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' }
];

const MAJURI_RATE_PRESETS = [300, 200, 150];

// --- Clean Empty Initial State (Ready for Your Real Entries) ---
const INITIAL_MAJURI_ENTRIES: MajuriEntry[] = [];
const INITIAL_CARPENTER_ADVANCES: CarpenterAdvance[] = [];

const INITIAL_INTERIOR_PROJECT: ProjectData = {
  id: 'interior',
  name: 'Interior Work',
  shortName: 'Interiors',
  vendors: [],
  expenses: []
};

const compressReceiptImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 640;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.onerror = reject;
      img.src = String(event.target?.result || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('homeledger_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });
  const [largeTextMode, setLargeTextMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('homeledger_large_text') === '1';
    } catch {
      return false;
    }
  });
  const [showInstallTip, setShowInstallTip] = useState<boolean>(() => {
    try {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      return !isStandalone && localStorage.getItem('homeledger_hide_install') !== '1';
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<string>('overview');

  // --- Sync Dark Mode & Large Text Mode to Root <html> ---
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('homeledger_theme', darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage restrictions
    }
  }, [darkMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = largeTextMode ? '17.5px' : '16px';
    try {
      localStorage.setItem('homeledger_large_text', largeTextMode ? '1' : '0');
    } catch {
      // Ignore storage restrictions
    }
  }, [largeTextMode]);

  const [interiorProject, setInteriorProject] = useState<ProjectData>(INITIAL_INTERIOR_PROJECT);
  const [majuriEntries, setMajuriEntries] = useState<MajuriEntry[]>(INITIAL_MAJURI_ENTRIES);
  const [carpenterAdvances, setCarpenterAdvances] = useState<CarpenterAdvance[]>(INITIAL_CARPENTER_ADVANCES);
  const [selectedMajuriRoomFilter, setSelectedMajuriRoomFilter] = useState<string>('all');
  const [selectedMajuriVendorFilter, setSelectedMajuriVendorFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [costTypeFilter, setCostTypeFilter] = useState<string>('all');

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fbRuntime, setFbRuntime] = useState<any>(null);
  const [hasFirebaseConfig] = useState<boolean>(() => Boolean(getFirebaseConfig()));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'demo'>('demo');
  const sharedRoomCode = 'HOME-2026';

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState<boolean>(false);
  const [showExtraFields, setShowExtraFields] = useState<boolean>(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('carpentry');
  const [formCostType, setFormCostType] = useState<string>('Material');
  const [formPaidBy, setFormPaidBy] = useState<string>('You');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formVendor, setFormVendor] = useState<string>('');
  const [formMode, setFormMode] = useState<string>('UPI');
  const [formStatus, setFormStatus] = useState<string>('Paid');
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formReceipt, setFormReceipt] = useState<string | null>(null);

  const [isVendorModalOpen, setIsVendorModalOpen] = useState<boolean>(false);
  const [newVendorName, setNewVendorName] = useState<string>('');
  const [newVendorTrade, setNewVendorTrade] = useState<string>('');
  const [newVendorQuoted, setNewVendorQuoted] = useState<string>('');
  const [newVendorPhone, setNewVendorPhone] = useState<string>('');

  // --- Smart Carpentry Majuri Calculator & Logger State (Remembers Last Vendor, Room & Rate) ---
  const [majuriActionMode, setMajuriActionMode] = useState<'measure' | 'advance'>('measure');
  const [mjVendor, setMjVendor] = useState<string>(() => {
    try {
      return localStorage.getItem('homeledger_last_mj_vendor') || 'Main Carpenter';
    } catch {
      return 'Main Carpenter';
    }
  });
  const [mjCustomVendor, setMjCustomVendor] = useState<string>('');
  const [mjRoomId, setMjRoomId] = useState<string>(() => {
    try {
      return localStorage.getItem('homeledger_last_mj_room') || 'living';
    } catch {
      return 'living';
    }
  });
  const [mjItem, setMjItem] = useState<string>('');
  const [mjQty, setMjQty] = useState<number>(1);
  const [mjUnit, setMjUnit] = useState<'ft' | 'in'>('ft');
  const [mjHeight, setMjHeight] = useState<string>('');
  const [mjWidth, setMjWidth] = useState<string>('');
  const [mjRate, setMjRate] = useState<string>(() => {
    try {
      return localStorage.getItem('homeledger_last_mj_rate') || '300';
    } catch {
      return '300';
    }
  });

  // --- Advance Payment (Without Measurement) Form State ---
  const [advVendor, setAdvVendor] = useState<string>(() => {
    try {
      return localStorage.getItem('homeledger_last_mj_vendor') || 'Main Carpenter';
    } catch {
      return 'Main Carpenter';
    }
  });
  const [advCustomVendor, setAdvCustomVendor] = useState<string>('');
  const [advLabel, setAdvLabel] = useState<string>('');
  const [advAmount, setAdvAmount] = useState<string>('');
  const [advMode, setAdvMode] = useState<string>('UPI');
  const [advPaidBy, setAdvPaidBy] = useState<string>('You');
  const [advDate, setAdvDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [advNotes, setAdvNotes] = useState<string>('');
  const [advSyncToBills, setAdvSyncToBills] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Back online — cloud sync active');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      showToast('Offline mode — changes cached locally');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Firebase Authentication Initialization (Strict Email Lock: vivekdn2504@gmail.com) ---
  useEffect(() => {
    const config = getFirebaseConfig();
    if (!config) {
      setAuthLoading(false);
      setSyncStatus(isOnline ? 'demo' : 'offline');
      return;
    }

    let unsubscribeAuth: (() => void) | undefined;

    (async () => {
      try {
        const [{ initializeApp, getApps }, authMod, firestoreMod] = await Promise.all([
          import('firebase/app'),
          import('firebase/auth'),
          import('firebase/firestore')
        ]);

        const fbApp = getApps().length ? getApps()[0] : initializeApp(config);
        const fbAuth = authMod.getAuth(fbApp);
        const fbDb = firestoreMod.getFirestore(fbApp);

        setFbRuntime({
          auth: fbAuth,
          db: fbDb,
          GoogleAuthProvider: authMod.GoogleAuthProvider,
          signInWithPopup: authMod.signInWithPopup,
          signOut: authMod.signOut,
          doc: firestoreMod.doc,
          setDoc: firestoreMod.setDoc
        });

        unsubscribeAuth = authMod.onAuthStateChanged(fbAuth, async (currentUser) => {
          if (currentUser) {
            const email = (currentUser.email || '').toLowerCase().trim();
            if (email && email !== ALLOWED_EMAIL) {
              await authMod.signOut(fbAuth);
              setUser(null);
              setAuthError(`Access Denied: ${email} is not authorized. Only ${ALLOWED_EMAIL} can sign in.`);
              setAuthLoading(false);
              return;
            }
            setAuthError(null);
            setUser(currentUser);
          } else {
            setUser(null);
            setSyncStatus(isOnline ? 'demo' : 'offline');
          }
          setAuthLoading(false);
        });
      } catch (err) {
        console.warn('Firebase runtime init fallback:', err);
        setAuthLoading(false);
      }
    })();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [isOnline]);

  // --- Firebase Firestore Real-Time Private Owner Sync ---
  useEffect(() => {
    if (!fbRuntime?.db || !user) return;

    let unsubscribeSnap: (() => void) | undefined;

    (async () => {
      try {
        const { onSnapshot } = await import('firebase/firestore');
        const workspaceDocRef = fbRuntime.doc(
          fbRuntime.db,
          'artifacts',
          appId,
          'users',
          user.uid,
          'workspaces',
          sharedRoomCode
        );
        setSyncStatus(isOnline ? 'syncing' : 'offline');

        unsubscribeSnap = onSnapshot(
          workspaceDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              if (data?.projects?.interior) {
                setInteriorProject(data.projects.interior as ProjectData);
              } else if (data?.interiorProject) {
                setInteriorProject(data.interiorProject as ProjectData);
              }
              if (Array.isArray(data?.majuriEntries)) setMajuriEntries(data.majuriEntries as MajuriEntry[]);
              if (Array.isArray(data?.carpenterAdvances)) setCarpenterAdvances(data.carpenterAdvances as CarpenterAdvance[]);
              setSyncStatus(isOnline ? 'synced' : 'offline');
            } else {
              fbRuntime
                .setDoc(workspaceDocRef, {
                  projects: { interior: INITIAL_INTERIOR_PROJECT },
                  majuriEntries: INITIAL_MAJURI_ENTRIES,
                  carpenterAdvances: INITIAL_CARPENTER_ADVANCES,
                  inviteCode: sharedRoomCode,
                  updatedAt: Date.now()
                })
                .then(() => setSyncStatus(isOnline ? 'synced' : 'offline'))
                .catch(() => setSyncStatus('demo'));
            }
          },
          (error) => {
            console.warn('Firestore snapshot listener error:', error);
            setSyncStatus('demo');
          }
        );
      } catch (err) {
        console.warn('Snapshot init skipped:', err);
      }
    })();

    return () => {
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, [fbRuntime, user, isOnline]);

  const saveProjectsToCloud = async (
    updatedInterior: ProjectData,
    updatedMajuri: MajuriEntry[] = majuriEntries,
    updatedAdvances: CarpenterAdvance[] = carpenterAdvances
  ) => {
    setInteriorProject(updatedInterior);
    setMajuriEntries(updatedMajuri);
    setCarpenterAdvances(updatedAdvances);
    if (!fbRuntime?.db || !user) return;
    try {
      setSyncStatus(isOnline ? 'syncing' : 'offline');
      const workspaceDocRef = fbRuntime.doc(
        fbRuntime.db,
        'artifacts',
        appId,
        'users',
        user.uid,
        'workspaces',
        sharedRoomCode
      );
      await fbRuntime.setDoc(
        workspaceDocRef,
        {
          projects: { interior: updatedInterior },
          majuriEntries: updatedMajuri,
          carpenterAdvances: updatedAdvances,
          inviteCode: sharedRoomCode,
          updatedAt: Date.now()
        },
        { merge: true }
      );
      setSyncStatus(isOnline ? 'synced' : 'offline');
    } catch (err) {
      console.warn('Cloud save error:', err);
      setSyncStatus('offline');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!fbRuntime?.auth) {
      setUser({ uid: 'local_preview_owner', email: ALLOWED_EMAIL, displayName: 'Vivek' });
      showToast(`Signed in as ${ALLOWED_EMAIL} (Preview Mode)`);
      return;
    }
    try {
      setAuthError(null);
      const provider = new fbRuntime.GoogleAuthProvider();
      provider.setCustomParameters({
        login_hint: ALLOWED_EMAIL,
        prompt: 'select_account'
      });
      const result = await fbRuntime.signInWithPopup(fbRuntime.auth, provider);
      const signedInEmail = (result.user?.email || '').toLowerCase().trim();
      if (signedInEmail !== ALLOWED_EMAIL) {
        await fbRuntime.signOut(fbRuntime.auth);
        setUser(null);
        setAuthError(`Access Denied: ${signedInEmail} is blocked. Sign in only with ${ALLOWED_EMAIL}.`);
        return;
      }
      showToast(`Welcome back, ${ALLOWED_EMAIL}!`);
    } catch (err) {
      console.warn('Google sign-in failed:', err);
      setAuthError('Sign-in cancelled or blocked by browser pop-up settings.');
    }
  };

  const handleSignOut = async () => {
    if (!fbRuntime?.auth) {
      setUser(null);
      showToast('Signed out');
      return;
    }
    try {
      await fbRuntime.signOut(fbRuntime.auth);
      setUser(null);
      showToast('Signed out securely');
    } catch (err) {
      console.warn(err);
    }
  };

  const analytics = useMemo(() => {
    const expenses = interiorProject.expenses || [];
    let totalSpent = 0;
    let paidAmount = 0;
    let advanceAmount = 0;
    let pendingAmount = 0;
    let materialSpent = 0;
    let labourSpent = 0;
    let generalSpent = 0;

    const byMember: Record<string, { id: string; label: string; color: string; total: number; count: number }> = {};
    FAMILY_MEMBERS.forEach((m) => {
      byMember[m.id] = { ...m, total: 0, count: 0 };
    });

    const byCategory: Record<string, CategoryDef & { spent: number; count: number }> = {};
    INTERIOR_CATEGORIES.forEach((cat) => {
      byCategory[cat.id] = { ...cat, spent: 0, count: 0 };
    });

    const byMode: Record<string, number> = {
      UPI: 0,
      'Bank Transfer': 0,
      Cash: 0,
      'Credit Card': 0
    };

    const byDateMap: Record<string, number> = {};

    expenses.forEach((exp) => {
      const amt = Number(exp.amount) || 0;
      totalSpent += amt;

      if (exp.status === 'Paid') paidAmount += amt;
      else if (exp.status === 'Advance') advanceAmount += amt;
      else pendingAmount += amt;

      const cType = exp.costType || (exp.category === 'labour' ? 'Labour' : 'Material');
      if (cType === 'Labour') labourSpent += amt;
      else if (cType === 'General') generalSpent += amt;
      else materialSpent += amt;

      const memberKey = exp.paidBy || 'You';
      if (byMember[memberKey]) {
        byMember[memberKey].total += amt;
        byMember[memberKey].count += 1;
      } else {
        byMember[memberKey] = {
          id: memberKey,
          label: memberKey,
          color: '#64748b',
          total: amt,
          count: 1
        };
      }

      if (byCategory[exp.category]) {
        byCategory[exp.category].spent += amt;
        byCategory[exp.category].count += 1;
      }

      if (byMode[exp.mode] !== undefined) {
        byMode[exp.mode] += amt;
      } else if (exp.mode === 'Card') {
        byMode['Credit Card'] += amt;
      } else {
        byMode[exp.mode] = amt;
      }

      const shortDate = exp.date ? exp.date.slice(5) : '11-20';
      byDateMap[shortDate] = (byDateMap[shortDate] || 0) + amt;
    });

    const matLabTotal = materialSpent + labourSpent + generalSpent || 1;
    const materialPct = Math.round((materialSpent / matLabTotal) * 100);
    const labourPct = Math.round((labourSpent / matLabTotal) * 100);
    const generalPct = Math.max(0, 100 - materialPct - labourPct);

    const categoryList = Object.values(byCategory).map((c) => ({
      ...c,
      sharePct: totalSpent > 0 ? Math.round((c.spent / totalSpent) * 100) : 0
    }));
    const memberChartData = Object.values(byMember).filter((m) => m.total > 0);

    const barChartData: BarDatum[] = categoryList
      .filter((c) => c.spent > 0)
      .map((c) => ({
        name: c.shortLabel,
        Actual: Math.round(c.spent / 1000),
        color: c.color
      }));

    const categoryDonutData: ChartSlice[] = categoryList
      .filter((c) => c.spent > 0)
      .map((c) => ({
        name: c.shortLabel,
        value: c.spent,
        color: c.color
      }));

    const modeChartData: ChartSlice[] = PAYMENT_MODES.map((m) => ({
      name: m.label,
      value: byMode[m.id] || 0,
      color: m.color
    })).filter((item) => item.value > 0);

    const sortedDates = Object.keys(byDateMap).sort();
    let cumulative = 0;
    const trendData: AreaDatum[] = sortedDates.map((d) => {
      cumulative += byDateMap[d];
      return {
        date: d,
        cumulative: Math.round(cumulative / 1000)
      };
    });

    const urgentMilestones: (MilestoneItem & { vendorId: string; vendorName: string; trade: string })[] = [];
    const vendorStats = (interiorProject.vendors || []).map((v) => {
      const vendorExpenses = expenses.filter(
        (e) => e.vendor && e.vendor.toLowerCase().trim() === v.name.toLowerCase().trim()
      );
      const paidToVendor = vendorExpenses
        .filter((e) => e.status === 'Paid' || e.status === 'Advance')
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

      const quoted = Number(v.quoted) || 0;
      const balanceRemaining = Math.max(0, quoted - paidToVendor);
      const progressPct = quoted > 0 ? Math.min(100, Math.round((paidToVendor / quoted) * 100)) : 100;

      const milestones = v.milestones || [];
      milestones.forEach((ms) => {
        if (ms.status === 'Overdue' || ms.status === 'Due Soon') {
          urgentMilestones.push({
            ...ms,
            vendorId: v.id,
            vendorName: v.name,
            trade: v.trade
          });
        }
      });

      return {
        ...v,
        milestones,
        paidToVendor,
        balanceRemaining,
        progressPct,
        txCount: vendorExpenses.length
      };
    });

    const totalVendorDues =
      pendingAmount + vendorStats.reduce((sum, v) => sum + v.balanceRemaining, 0);

    return {
      totalSpent,
      billCount: expenses.length,
      paidAmount,
      advanceAmount,
      pendingAmount,
      totalVendorDues,
      materialSpent,
      labourSpent,
      generalSpent,
      materialPct,
      labourPct,
      generalPct,
      memberChartData,
      categoryList,
      categoryDonutData,
      barChartData,
      modeChartData,
      trendData,
      vendorStats,
      urgentMilestones
    };
  }, [interiorProject]);

  const filteredExpenses = useMemo(() => {
    return (interiorProject.expenses || [])
      .filter((exp) => {
        if (selectedCategoryFilter !== 'all' && exp.category !== selectedCategoryFilter) return false;
        if (costTypeFilter !== 'all') {
          const cType = exp.costType || (exp.category === 'labour' ? 'Labour' : 'Material');
          if (cType !== costTypeFilter) return false;
        }
        if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = exp.title?.toLowerCase().includes(q);
          const matchVendor = exp.vendor?.toLowerCase().includes(q);
          const matchPaidBy = exp.paidBy?.toLowerCase().includes(q);
          const matchNotes = exp.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchVendor && !matchPaidBy && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [interiorProject.expenses, selectedCategoryFilter, costTypeFilter, statusFilter, searchQuery]);

  const openAddExpenseDrawer = (prefill: Partial<ExpenseItem> = {}) => {
    const defaultCatId = INTERIOR_CATEGORIES[0]?.id || 'carpentry';
    setEditingExpenseId(prefill.id || null);
    setFormAmount(prefill.amount ? String(prefill.amount) : '');
    setFormCategory(
      prefill.category || (selectedCategoryFilter !== 'all' ? selectedCategoryFilter : defaultCatId)
    );
    setFormCostType(prefill.costType || 'Material');
    setFormPaidBy(prefill.paidBy || 'You');
    setFormTitle(prefill.title || '');
    setFormVendor(prefill.vendor || '');
    setFormMode(prefill.mode || 'UPI');
    setFormStatus(prefill.status || 'Paid');
    setFormDate(prefill.date || new Date().toISOString().split('T')[0]);
    setFormNotes(prefill.notes || '');
    setFormReceipt(prefill.receipt || null);
    setShowExtraFields(Boolean(prefill.id || prefill.vendor || prefill.receipt));
    setIsAddDrawerOpen(true);
  };

  const handleQuickAddAmount = (delta: number) => {
    const current = Number(formAmount) || 0;
    setFormAmount(String(current + delta));
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressReceiptImage(file);
      setFormReceipt(compressed);
      showToast('Bill photo attached!');
    } catch {
      showToast('Could not process image');
    }
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(formAmount);
    if (!numericAmount || numericAmount <= 0) {
      showToast('Please enter a valid ₹ amount');
      return;
    }

    const catObj = findCategoryById(formCategory);
    const cleanTitle = formTitle.trim() || `${catObj.label} (${formCostType})`;

    const expenseRecord: ExpenseItem = {
      id: editingExpenseId || `exp_${Date.now()}`,
      title: cleanTitle,
      amount: numericAmount,
      category: formCategory,
      costType: formCostType,
      paidBy: formPaidBy,
      vendor: formVendor.trim() || 'Direct Purchase',
      mode: formMode,
      status: formStatus,
      date: formDate,
      notes: formNotes.trim(),
      receipt: formReceipt || null
    };

    const existingExpenses = interiorProject.expenses || [];
    const updatedExpenses = editingExpenseId
      ? existingExpenses.map((item) => (item.id === editingExpenseId ? expenseRecord : item))
      : [expenseRecord, ...existingExpenses];

    const updatedInterior: ProjectData = {
      ...interiorProject,
      expenses: updatedExpenses
    };

    saveProjectsToCloud(updatedInterior);
    setIsAddDrawerOpen(false);
    setEditingExpenseId(null);
    showToast(editingExpenseId ? 'Expense updated!' : `${formatINR(numericAmount)} logged!`);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = (interiorProject.expenses || []).filter((e) => e.id !== expenseId);
    const updatedInterior: ProjectData = {
      ...interiorProject,
      expenses: updatedExpenses
    };
    saveProjectsToCloud(updatedInterior);
    showToast('Expense entry removed');
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) {
      showToast('Enter contractor or vendor name');
      return;
    }
    const quotedNum = Number(newVendorQuoted) || 0;
    const vendorObj: VendorItem = {
      id: `v_${Date.now()}`,
      name: newVendorName.trim(),
      trade: newVendorTrade.trim() || 'Interior Contractor',
      quoted: quotedNum,
      phone: newVendorPhone.trim() || 'Not added',
      milestones:
        quotedNum > 0
          ? [
              { id: `ms_${Date.now()}_1`, label: '30% Advance', amount: Math.round(quotedNum * 0.3), dueDate: new Date().toISOString().split('T')[0], status: 'Due Soon' },
              { id: `ms_${Date.now()}_2`, label: '50% Work Stage', amount: Math.round(quotedNum * 0.5), dueDate: '2026-12-05', status: 'Upcoming' },
              { id: `ms_${Date.now()}_3`, label: '20% Handover', amount: Math.round(quotedNum * 0.2), dueDate: '2026-12-20', status: 'Upcoming' }
            ]
          : []
    };

    const updatedInterior: ProjectData = {
      ...interiorProject,
      vendors: [...(interiorProject.vendors || []), vendorObj]
    };

    saveProjectsToCloud(updatedInterior);
    setNewVendorName('');
    setNewVendorTrade('');
    setNewVendorQuoted('');
    setNewVendorPhone('');
    setIsVendorModalOpen(false);
    showToast(`${vendorObj.name} added!`);
  };

  const handleMarkMilestonePaid = (vendor: VendorItem, milestone: MilestoneItem) => {
    const updatedVendors = (interiorProject.vendors || []).map((v) => {
      if (v.id !== vendor.id) return v;
      return {
        ...v,
        milestones: (v.milestones || []).map((m) =>
          m.id === milestone.id ? { ...m, status: 'Paid' } : m
        )
      };
    });

    const newExpense: ExpenseItem = {
      id: `exp_ms_${Date.now()}`,
      title: `${vendor.name} — ${milestone.label}`,
      amount: Number(milestone.amount) || 0,
      category: INTERIOR_CATEGORIES[0]?.id || 'carpentry',
      costType: 'Labour',
      paidBy: 'You',
      vendor: vendor.name,
      mode: 'UPI',
      status: 'Paid',
      date: new Date().toISOString().split('T')[0],
      notes: `Milestone checkpoint settled (${milestone.label})`
    };

    const updatedInterior: ProjectData = {
      ...interiorProject,
      vendors: updatedVendors,
      expenses: [newExpense, ...(interiorProject.expenses || [])]
    };

    saveProjectsToCloud(updatedInterior);
    showToast(`Milestone "${milestone.label}" marked Paid!`);
  };

  // --- Available Vendors List for Majuri & Smart Bill Picker ---
  const majuriVendorOptions = useMemo(() => {
    const names = new Set<string>(['Main Carpenter']);
    (interiorProject.vendors || []).forEach((v) => {
      if (v.name?.trim()) names.add(v.name.trim());
    });
    majuriEntries.forEach((m) => {
      if (m.vendor?.trim()) names.add(m.vendor.trim());
    });
    carpenterAdvances.forEach((a) => {
      if (a.vendor?.trim()) names.add(a.vendor.trim());
    });
    return Array.from(names);
  }, [interiorProject.vendors, majuriEntries, carpenterAdvances]);

  const savedVendorSuggestions = useMemo(() => {
    const names = new Set<string>();
    (interiorProject.vendors || []).forEach((v) => {
      if (v.name?.trim()) names.add(v.name.trim());
    });
    (interiorProject.expenses || []).forEach((e) => {
      if (e.vendor?.trim() && e.vendor !== 'Direct Purchase') names.add(e.vendor.trim());
    });
    majuriVendorOptions.forEach((v) => names.add(v));
    return Array.from(names).slice(0, 8);
  }, [interiorProject.vendors, interiorProject.expenses, majuriVendorOptions]);

  // --- Duplicate Bill Detector in Quick Add Drawer ---
  const potentialDuplicateExpense = useMemo(() => {
    const numAmt = Number(formAmount);
    if (!numAmt || numAmt <= 0 || editingExpenseId) return null;
    const targetVendor = (formVendor.trim() || 'Direct Purchase').toLowerCase();
    return (
      (interiorProject.expenses || []).find(
        (e) =>
          Number(e.amount) === numAmt &&
          e.date === formDate &&
          (e.vendor || 'Direct Purchase').toLowerCase() === targetVendor
      ) || null
    );
  }, [formAmount, formVendor, formDate, editingExpenseId, interiorProject.expenses]);

  // --- Smart Majuri Live Calculation (Qty × Height × Width × Sq.Ft Rate) ---
  const liveMajuriCalc = useMemo(() => {
    const q = Math.max(1, Math.round(Number(mjQty) || 1));
    const h = parseFloat(mjHeight) || 0;
    const w = parseFloat(mjWidth) || 0;
    const r = parseFloat(mjRate) || 0;
    const rawArea = q * h * w;
    const sqft = mjUnit === 'in' ? rawArea / 144 : rawArea;
    const roundedSqft = Math.round(sqft * 100) / 100;
    const amount = Math.round(roundedSqft * r);
    return { sqft: roundedSqft, amount, qty: q };
  }, [mjQty, mjHeight, mjWidth, mjRate, mjUnit]);

  const filteredMajuriEntries = useMemo(() => {
    return majuriEntries.filter((m) => {
      const mVendor = m.vendor || 'Main Carpenter';
      if (selectedMajuriVendorFilter !== 'all' && mVendor !== selectedMajuriVendorFilter) return false;
      if (selectedMajuriRoomFilter !== 'all' && m.roomId !== selectedMajuriRoomFilter) return false;
      return true;
    });
  }, [majuriEntries, selectedMajuriVendorFilter, selectedMajuriRoomFilter]);

  const filteredCarpenterAdvances = useMemo(() => {
    return carpenterAdvances.filter((a) => {
      const aVendor = a.vendor || 'Main Carpenter';
      if (selectedMajuriVendorFilter !== 'all' && aVendor !== selectedMajuriVendorFilter) return false;
      return true;
    });
  }, [carpenterAdvances, selectedMajuriVendorFilter]);

  const majuriSummary = useMemo(() => {
    let totalSqft = 0;
    let totalWorkBill = 0;

    const vendorScopedEntries =
      selectedMajuriVendorFilter === 'all'
        ? majuriEntries
        : majuriEntries.filter((e) => (e.vendor || 'Main Carpenter') === selectedMajuriVendorFilter);

    const vendorScopedAdvances =
      selectedMajuriVendorFilter === 'all'
        ? carpenterAdvances
        : carpenterAdvances.filter((a) => (a.vendor || 'Main Carpenter') === selectedMajuriVendorFilter);

    const byRoom = MAJURI_ROOMS.map((room) => {
      const items = vendorScopedEntries.filter((e) => e.roomId === room.id);
      const roomSqft = items.reduce((s, e) => s + (Number(e.sqft) || 0), 0);
      const roomAmt = items.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      totalSqft += roomSqft;
      totalWorkBill += roomAmt;
      return {
        ...room,
        sqft: Math.round(roomSqft * 10) / 10,
        amount: roomAmt,
        count: items.length
      };
    });

    const totalWeeklyAdvancePaid = vendorScopedAdvances.reduce(
      (sum, a) => sum + (Number(a.amount) || 0),
      0
    );

    const netBalance = totalWorkBill - totalWeeklyAdvancePaid;
    const settledPct =
      totalWorkBill > 0
        ? Math.min(100, Math.round((totalWeeklyAdvancePaid / totalWorkBill) * 100))
        : 0;

    const roomsWithShare = byRoom.map((r) => ({
      ...r,
      sharePct: totalWorkBill > 0 ? Math.round((r.amount / totalWorkBill) * 100) : 0
    }));

    const byVendorBreakdown = majuriVendorOptions
      .map((vName) => {
        const vWork = majuriEntries
          .filter((m) => (m.vendor || 'Main Carpenter') === vName)
          .reduce((s, m) => s + (Number(m.amount) || 0), 0);
        const vSqft = majuriEntries
          .filter((m) => (m.vendor || 'Main Carpenter') === vName)
          .reduce((s, m) => s + (Number(m.sqft) || 0), 0);
        const vAdv = carpenterAdvances
          .filter((a) => (a.vendor || 'Main Carpenter') === vName)
          .reduce((s, a) => s + (Number(a.amount) || 0), 0);
        return {
          vendor: vName,
          sqft: Math.round(vSqft * 10) / 10,
          workBill: vWork,
          advancePaid: vAdv,
          netBalance: vWork - vAdv
        };
      })
      .filter((v) => v.workBill > 0 || v.advancePaid > 0);

    return {
      totalSqft: Math.round(totalSqft * 10) / 10,
      totalWorkBill,
      totalWeeklyAdvancePaid,
      netBalance,
      settledPct,
      rooms: roomsWithShare,
      byVendorBreakdown
    };
  }, [majuriEntries, carpenterAdvances, selectedMajuriVendorFilter, majuriVendorOptions]);

  const handleSaveMajuriEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (liveMajuriCalc.sqft <= 0 || liveMajuriCalc.amount <= 0) {
      showToast('Enter valid Qty, Height, Width & Sq.ft Rate');
      return;
    }

    const resolvedVendor =
      mjVendor === '__custom__'
        ? mjCustomVendor.trim() || 'Main Carpenter'
        : mjVendor.trim() || 'Main Carpenter';

    const roomObj = MAJURI_ROOMS.find((r) => r.id === mjRoomId) || MAJURI_ROOMS[0];
    const cleanItem = mjItem.trim() || `${roomObj.label} Carpentry Work`;
    const safeQty = Math.max(1, Math.round(Number(mjQty) || 1));

    const newMajuri: MajuriEntry = {
      id: `mj_${Date.now()}`,
      vendor: resolvedVendor,
      roomId: mjRoomId,
      item: cleanItem,
      qty: safeQty,
      unit: mjUnit,
      height: parseFloat(mjHeight),
      width: parseFloat(mjWidth),
      sqft: liveMajuriCalc.sqft,
      rate: parseFloat(mjRate),
      amount: liveMajuriCalc.amount,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      localStorage.setItem('homeledger_last_mj_vendor', resolvedVendor);
      localStorage.setItem('homeledger_last_mj_room', mjRoomId);
      localStorage.setItem('homeledger_last_mj_rate', String(mjRate));
    } catch {
      // Ignore storage restrictions
    }

    const updatedMajuri = [newMajuri, ...majuriEntries];
    saveProjectsToCloud(interiorProject, updatedMajuri, carpenterAdvances);
    if (mjVendor === '__custom__') {
      setMjVendor(resolvedVendor);
      setMjCustomVendor('');
    }
    setAdvVendor(resolvedVendor);
    setMjItem('');
    setMjQty(1);
    setMjHeight('');
    setMjWidth('');
    showToast(`${resolvedVendor}: ${liveMajuriCalc.sqft} ft² (${formatINR(liveMajuriCalc.amount)}) added!`);
  };

  const handleRepeatMajuriEntry = (entry: MajuriEntry) => {
    const repeated: MajuriEntry = {
      ...entry,
      id: `mj_${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    const updatedMajuri = [repeated, ...majuriEntries];
    saveProjectsToCloud(interiorProject, updatedMajuri, carpenterAdvances);
    showToast(`Repeated "${entry.item}" (${formatINR(entry.amount)})`);
  };

  const handleRepeatExpense = (exp: ExpenseItem) => {
    const repeated: ExpenseItem = {
      ...exp,
      id: `exp_${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    const updatedInterior: ProjectData = {
      ...interiorProject,
      expenses: [repeated, ...(interiorProject.expenses || [])]
    };
    saveProjectsToCloud(updatedInterior);
    showToast(`Repeated "${exp.title}" (${formatINR(exp.amount)})`);
  };

  const handleDeleteMajuriEntry = (id: string) => {
    const updatedMajuri = majuriEntries.filter((m) => m.id !== id);
    saveProjectsToCloud(interiorProject, updatedMajuri, carpenterAdvances);
    showToast('Majuri measurement removed');
  };

  const handleSaveCarpenterAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(advAmount);
    if (!numAmt || numAmt <= 0) {
      showToast('Enter valid advance ₹ amount');
      return;
    }

    const resolvedVendor =
      advVendor === '__custom__'
        ? advCustomVendor.trim() || 'Main Carpenter'
        : advVendor.trim() || 'Main Carpenter';

    const nextPayNum = carpenterAdvances.length + 1;
    const cleanLabel = advLabel.trim() || `Advance Payment #${nextPayNum} (No Meas.)`;
    const advId = `ca_${Date.now()}`;
    const syncedExpenseId = advSyncToBills ? `exp_${advId}` : null;

    const newAdv: CarpenterAdvance = {
      id: advId,
      vendor: resolvedVendor,
      syncedExpenseId,
      weekLabel: cleanLabel,
      amount: numAmt,
      mode: advMode,
      paidBy: advPaidBy,
      date: advDate,
      notes: advNotes.trim() || 'Advance payment without measurement'
    };

    const updatedAdvances = [newAdv, ...carpenterAdvances];
    let updatedInterior = interiorProject;

    if (advSyncToBills && syncedExpenseId) {
      const existingVendors = interiorProject.vendors || [];
      const vendorExists = existingVendors.some(
        (v) => v.name.toLowerCase().trim() === resolvedVendor.toLowerCase().trim()
      );
      const updatedVendors = vendorExists
        ? existingVendors
        : [
            ...existingVendors,
            {
              id: `v_mj_${Date.now()}`,
              name: resolvedVendor,
              trade: 'Carpentry & Majuri Contractor',
              quoted: 0,
              phone: 'Not added',
              milestones: []
            }
          ];

      const syncedExpense: ExpenseItem = {
        id: syncedExpenseId,
        title: `Majuri Advance (${resolvedVendor}): ${cleanLabel}`,
        amount: numAmt,
        category: 'carpentry',
        costType: 'Labour',
        paidBy: advPaidBy,
        vendor: resolvedVendor,
        mode: advMode,
        status: 'Advance',
        date: advDate,
        notes: newAdv.notes
      };
      updatedInterior = {
        ...interiorProject,
        vendors: updatedVendors,
        expenses: [syncedExpense, ...(interiorProject.expenses || [])]
      };
    }

    saveProjectsToCloud(updatedInterior, majuriEntries, updatedAdvances);
    if (advVendor === '__custom__') {
      setAdvVendor(resolvedVendor);
      setAdvCustomVendor('');
    }
    setMjVendor(resolvedVendor);
    setAdvLabel('');
    setAdvAmount('');
    setAdvNotes('');
    showToast(
      advSyncToBills
        ? `Advance ${formatINR(numAmt)} to ${resolvedVendor} logged & synced!`
        : `Advance ${formatINR(numAmt)} to ${resolvedVendor} recorded!`
    );
  };

  const handleDeleteCarpenterAdvance = (id: string) => {
    const targetAdv = carpenterAdvances.find((a) => a.id === id);
    const updatedAdvances = carpenterAdvances.filter((a) => a.id !== id);
    let updatedInterior = interiorProject;

    if (targetAdv?.syncedExpenseId) {
      updatedInterior = {
        ...interiorProject,
        expenses: (interiorProject.expenses || []).filter(
          (e) => e.id !== targetAdv.syncedExpenseId
        )
      };
    }

    saveProjectsToCloud(updatedInterior, majuriEntries, updatedAdvances);
    showToast('Advance payment removed');
  };

  const handleShareWhatsApp = (summaryText: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryText).catch(() => {});
    }
    const encoded = encodeURIComponent(summaryText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
    showToast('Summary copied & opening WhatsApp...');
  };

  const handlePrintGraphicalPDF = () => {
    const reportWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!reportWindow) {
      showToast('Pop-up blocked — allow pop-ups to save PDF');
      return;
    }

    const generatedOn = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const majuriVendorHeader =
      selectedMajuriVendorFilter === 'all' ? 'All Contractors' : selectedMajuriVendorFilter;

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${interiorProject.name} — Graphical Financial Report</title>
          <style>
            * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { margin: 0; padding: 28px; color: #0f172a; background: #ffffff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; padding: 24px 28px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
            .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
            .badge { background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
            .kpi { border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; background: #f8fafc; }
            .kpi-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; }
            .kpi-val { font-size: 20px; font-weight: 800; margin-top: 4px; color: #0f172a; }
            .section { border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; margin-bottom: 18px; page-break-inside: avoid; }
            .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #4f46e5; margin: 0 0 14px; }
            .bar-row { margin-bottom: 12px; }
            .bar-meta { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
            .bar-track { width: 100%; height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
            .bar-fill { height: 100%; border-radius: 999px; }
            .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; padding: 10px 8px; background: #f1f5f9; color: #475569; font-weight: 800; border-bottom: 2px solid #cbd5e1; }
            td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; }
            .paid { background: #dcfce7; color: #166534; }
            .advance { background: #fef3c7; color: #92400e; }
            .pending { background: #ffe4e6; color: #9f1239; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; }
            @media print { body { padding: 12px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>HomeLedger • ${interiorProject.name}</h1>
              <p>Graphical Interior & Majuri Statement • Owner: ${ALLOWED_EMAIL}</p>
            </div>
            <div class="badge">Generated ${generatedOn}</div>
          </div>

          <div class="kpi-grid">
            <div class="kpi"><div class="kpi-label">Total Actual Spent</div><div class="kpi-val" style="color:#4f46e5;">${formatINR(analytics.totalSpent)}</div></div>
            <div class="kpi"><div class="kpi-label">Settled / Paid</div><div class="kpi-val" style="color:#059669;">${formatINR(analytics.paidAmount)}</div></div>
            <div class="kpi"><div class="kpi-label">Advance Given</div><div class="kpi-val" style="color:#d97706;">${formatINR(analytics.advanceAmount)}</div></div>
            <div class="kpi"><div class="kpi-label">Pending & Vendor Dues</div><div class="kpi-val" style="color:#e11d48;">${formatINR(analytics.totalVendorDues)}</div></div>
          </div>

          <div class="split-grid">
            <div class="section" style="margin-bottom:0;">
              <h3 class="section-title">Actual Work & Expense Breakdown</h3>
              ${analytics.categoryList
                .map(
                  (cat) => `
                    <div class="bar-row">
                      <div class="bar-meta"><span>${cat.label}</span><span>${formatINR(cat.spent)} (${cat.sharePct}%)</span></div>
                      <div class="bar-track"><div class="bar-fill" style="width:${cat.sharePct}%; background:${cat.color};"></div></div>
                    </div>`
                )
                .join('')}
            </div>

            <div class="section" style="margin-bottom:0;">
              <h3 class="section-title">Material vs. Labour & Family Split</h3>
              <div class="bar-row">
                <div class="bar-meta"><span>Material Purchases (${analytics.materialPct}%)</span><span>${formatINR(analytics.materialSpent)}</span></div>
                <div class="bar-track"><div class="bar-fill" style="width:${analytics.materialPct}%; background:#4f46e5;"></div></div>
              </div>
              <div class="bar-row">
                <div class="bar-meta"><span>Labour & Workmanship (${analytics.labourPct}%)</span><span>${formatINR(analytics.labourSpent)}</span></div>
                <div class="bar-track"><div class="bar-fill" style="width:${analytics.labourPct}%; background:#f97316;"></div></div>
              </div>
              <hr style="border:none; border-top:1px solid #e2e8f0; margin:14px 0;" />
              ${analytics.memberChartData
                .map((m) => {
                  const mpct = analytics.totalSpent > 0 ? Math.round((m.total / analytics.totalSpent) * 100) : 0;
                  return `
                    <div class="bar-row">
                      <div class="bar-meta"><span>Paid by ${m.label} (${m.count} bills)</span><span>${formatINR(m.total)} (${mpct}%)</span></div>
                      <div class="bar-track"><div class="bar-fill" style="width:${mpct}%; background:${m.color};"></div></div>
                    </div>`;
                })
                .join('')}
            </div>
          </div>

          <div class="section" style="border-color:#fed7aa; background:#fffaf5;">
            <h3 class="section-title" style="color:#ea580c;">Carpentry Majuri & Advance Payment Statement (${majuriVendorHeader})</h3>
            <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom:14px;">
              <div class="kpi" style="background:#ffffff;"><div class="kpi-label">Total Measured Area</div><div class="kpi-val" style="font-size:17px; color:#ea580c;">${majuriSummary.totalSqft} sq.ft.</div></div>
              <div class="kpi" style="background:#ffffff;"><div class="kpi-label">Total Work Bill</div><div class="kpi-val" style="font-size:17px; color:#4f46e5;">${formatINR(majuriSummary.totalWorkBill)}</div></div>
              <div class="kpi" style="background:#ffffff;"><div class="kpi-label">Advances Paid (No Meas.)</div><div class="kpi-val" style="font-size:17px; color:#059669;">${formatINR(majuriSummary.totalWeeklyAdvancePaid)}</div></div>
              <div class="kpi" style="background:#ffffff;"><div class="kpi-label">${majuriSummary.netBalance >= 0 ? 'Net Balance Payable' : 'Extra Advance Credit'}</div><div class="kpi-val" style="font-size:17px; color:${majuriSummary.netBalance >= 0 ? '#e11d48' : '#d97706'};">${formatINR(Math.abs(majuriSummary.netBalance))}</div></div>
            </div>

            <table style="margin-bottom:14px; background:#ffffff;">
              <thead>
                <tr><th>Date</th><th>Vendor / Carpenter</th><th>Room</th><th>Work Item</th><th>Dimensions</th><th>Area</th><th>Rate</th><th style="text-align:right;">Majuri Bill</th></tr>
              </thead>
              <tbody>
                ${filteredMajuriEntries
                  .map((m) => {
                    const rLabel = MAJURI_ROOMS.find((r) => r.id === m.roomId)?.label || m.roomId;
                    const qPrefix = (m.qty || 1) > 1 ? `${m.qty} × ` : '';
                    return `<tr><td>${m.date}</td><td><strong>${m.vendor || 'Main Carpenter'}</strong></td><td>${rLabel}</td><td>${m.item}</td><td>${qPrefix}${m.height}${m.unit} × ${m.width}${m.unit}</td><td>${m.sqft} ft²</td><td>₹${m.rate}/ft²</td><td style="text-align:right; font-weight:800;">${formatINR(m.amount)}</td></tr>`;
                  })
                  .join('')}
                <tr style="background:#fff7ed;">
                  <td colspan="5" style="font-weight:800; color:#9a3412;">TOTAL MEASURED CARPENTRY WORK BILL</td>
                  <td style="font-weight:800; color:#9a3412;">${majuriSummary.totalSqft} ft²</td>
                  <td>—</td>
                  <td style="text-align:right; font-weight:900; color:#ea580c;">${formatINR(majuriSummary.totalWorkBill)}</td>
                </tr>
              </tbody>
            </table>

            <table style="background:#ffffff;">
              <thead>
                <tr><th>Date</th><th>Vendor / Carpenter</th><th>Advance Payment (No Meas.)</th><th>Paid By</th><th>Mode</th><th>Notes</th><th style="text-align:right;">Advance Paid</th></tr>
              </thead>
              <tbody>
                ${filteredCarpenterAdvances
                  .map(
                    (a) => `<tr><td>${a.date}</td><td><strong>${a.vendor || 'Main Carpenter'}</strong></td><td>${a.weekLabel}</td><td>${a.paidBy}</td><td>${a.mode}</td><td>${a.notes || '—'}</td><td style="text-align:right; font-weight:800; color:#059669;">${formatINR(a.amount)}</td></tr>`
                  )
                  .join('')}
                <tr style="background:#ecfdf5;">
                  <td colspan="6" style="font-weight:800; color:#065f46;">TOTAL ADVANCES PAID (${filteredCarpenterAdvances.length} ENTRIES)</td>
                  <td style="text-align:right; font-weight:900; color:#059669;">${formatINR(majuriSummary.totalWeeklyAdvancePaid)}</td>
                </tr>
                <tr style="background:${majuriSummary.netBalance >= 0 ? '#fff1f2' : '#fef3c7'};">
                  <td colspan="6" style="font-weight:900; color:${majuriSummary.netBalance >= 0 ? '#9f1239' : '#92400e'};">
                    ${majuriSummary.netBalance >= 0 ? 'NET BALANCE PAYABLE TO VENDOR (WORK BILL − ADVANCES)' : 'EXTRA ADVANCE CREDIT HELD BY VENDOR'}
                  </td>
                  <td style="text-align:right; font-weight:900; color:${majuriSummary.netBalance >= 0 ? '#e11d48' : '#d97706'};">
                    ${formatINR(Math.abs(majuriSummary.netBalance))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3 class="section-title">Itemized Expense Ledger (${(interiorProject.expenses || []).length} Entries)</h3>
            <table>
              <thead>
                <tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Paid By</th><th>Vendor</th><th>Mode</th><th>Status</th><th style="text-align:right;">Amount</th></tr>
              </thead>
              <tbody>
                ${(interiorProject.expenses || [])
                  .map((e) => {
                    const catLabel = findCategoryById(e.category).shortLabel;
                    const stClass = e.status === 'Paid' ? 'paid' : e.status === 'Advance' ? 'advance' : 'pending';
                    return `<tr><td>${e.date}</td><td><strong>${e.title}</strong></td><td>${catLabel}</td><td>${e.costType || 'Material'}</td><td>${e.paidBy || 'You'}</td><td>${e.vendor}</td><td>${e.mode}</td><td><span class="pill ${stClass}">${e.status}</span></td><td style="text-align:right; font-weight:800;">${formatINR(e.amount)}</td></tr>`;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
          <div class="footer">Generated via HomeLedger • Private Owner Edition (${ALLOWED_EMAIL})</div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); };</script>
        </body>
      </html>
    `);
    reportWindow.document.close();
    showToast('Opening print-ready Graphical PDF...');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Title', 'Category', 'Type', 'Paid By', 'Vendor', 'Amount (INR)', 'Mode', 'Status', 'Notes'];
    const rows = (interiorProject.expenses || []).map((e) => {
      const catLabel = findCategoryById(e.category).label;
      return [
        e.date,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        `"${catLabel}"`,
        e.costType || 'Material',
        e.paidBy || 'You',
        `"${(e.vendor || '').replace(/"/g, '""')}"`,
        e.amount,
        e.mode,
        e.status,
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvBody = [
      [`HomeLedger Report - ${interiorProject.name}`, `Owner: ${ALLOWED_EMAIL}`, `Exported: ${new Date().toISOString().slice(0, 10)}`].join(','),
      headers.join(','),
      ...rows,
      '',
      ['CARPENTRY MAJURI KHATA SUMMARY', `Total Sq.Ft: ${majuriSummary.totalSqft}`, `Total Work Bill (INR): ${majuriSummary.totalWorkBill}`, `Advances Paid (INR): ${majuriSummary.totalWeeklyAdvancePaid}`, `Net Balance (INR): ${majuriSummary.netBalance}`].join(','),
      ['Date', 'Vendor / Carpenter', 'Room', 'Work Item', 'Qty', 'Height', 'Width', 'Unit', 'Area (Sq.Ft)', 'Rate (INR/Sq.Ft)', 'Majuri Amount (INR)'].join(','),
      ...filteredMajuriEntries.map((m) => {
        const rLabel = MAJURI_ROOMS.find((r) => r.id === m.roomId)?.label || m.roomId;
        return [m.date, `"${(m.vendor || 'Main Carpenter').replace(/"/g, '""')}"`, `"${rLabel}"`, `"${(m.item || '').replace(/"/g, '""')}"`, m.qty || 1, m.height, m.width, m.unit, m.sqft, m.rate, m.amount].join(',');
      }),
      '',
      ['Date', 'Vendor / Carpenter', 'Advance Payment Label', 'Paid By', 'Mode', 'Advance Amount (INR)', 'Notes'].join(','),
      ...filteredCarpenterAdvances.map((a) =>
        [a.date, `"${(a.vendor || 'Main Carpenter').replace(/"/g, '""')}"`, `"${(a.weekLabel || '').replace(/"/g, '""')}"`, a.paidBy, a.mode, a.amount, `"${(a.notes || '').replace(/"/g, '""')}"`].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${interiorProject.shortName}_HomeLedger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Excel / CSV spreadsheet downloaded!');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex justify-center transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-md min-h-screen bg-slate-50 dark:bg-slate-900 shadow-2xl sm:border-x border-slate-200/80 dark:border-slate-800 flex flex-col relative pb-28">
          {toastMessage && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-xl text-sm font-semibold flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ================= FULL-SCREEN GOOGLE SIGN-IN GATE ================= */}
          {!user ? (
            <div className="flex-1 flex flex-col justify-between p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
                    <HomeIcon className="w-5 h-5" />
                  </div>
                  <span className="text-base font-extrabold tracking-tight">HomeLedger</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDarkMode((prev) => !prev)}
                  aria-label="Toggle color theme"
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 touch-manipulation"
                >
                  {darkMode ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4" />}
                </button>
              </div>

              <div className="my-auto py-8 space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/25 mx-auto">
                  <HomeIcon className="w-8 h-8" />
                </div>

                <div className="text-center space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-extrabold uppercase tracking-wider">
                    Private Owner Access Only
                  </span>
                  <h2 className="text-2xl font-black tracking-tight">Welcome to HomeLedger</h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Sign in with your authorized Google account (<strong className="text-slate-800 dark:text-slate-200">{ALLOWED_EMAIL}</strong>) to access your Interior Work &amp; Carpentry Majuri ledgers.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-lg space-y-4">
                  {authLoading ? (
                    <div className="py-4 text-center text-xs font-extrabold text-slate-500">
                      Checking Google authentication...
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full h-13 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-sm flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-all"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                          <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                        </svg>
                        <span>Continue with Google</span>
                      </button>

                      {!hasFirebaseConfig && (
                        <p className="text-[11px] text-center font-semibold text-amber-600 dark:text-amber-400">
                          Preview mode active — connect Firebase keys on GitHub to enforce live Google OAuth.
                        </p>
                      )}
                    </>
                  )}

                  {authError && (
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-extrabold text-rose-600 dark:text-rose-400 text-center">
                      {authError}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center text-[11px] font-semibold text-slate-400">
                Protected by Firebase Google Authentication • Single-Owner Vault
              </div>
            </div>
          ) : (
            <>
              {/* ================= SIMPLIFIED CLEAN MOBILE HEADER ================= */}
              <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200/70 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                      <HomeIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h1 className="text-base font-black tracking-tight leading-none truncate">HomeLedger</h1>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold">
                          Interiors
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {!isOnline || syncStatus === 'offline' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <CloudOffIcon className="w-3 h-3" /> Offline
                          </span>
                        ) : syncStatus === 'synced' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CloudIcon className="w-3 h-3" /> Cloud Synced
                          </span>
                        ) : syncStatus === 'syncing' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            <CloudIcon className="w-3 h-3 animate-pulse" /> Syncing...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ready
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Controls: Large Text (A+), Report, Theme & Sign Out */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !largeTextMode;
                        setLargeTextMode(next);
                        showToast(next ? 'Large Text (A+) enabled' : 'Standard text size');
                      }}
                      aria-label="Toggle large readable text"
                      title="Large Text (A+)"
                      className={`h-10 px-2.5 rounded-2xl text-xs font-black transition-colors touch-manipulation border ${
                        largeTextMode
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent'
                      }`}
                    >
                      A+
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsExportModalOpen(true)}
                      title="Export Graphical PDF & CSV Report"
                      className="h-10 px-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 flex items-center gap-1.5 text-xs font-extrabold transition-colors touch-manipulation"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDarkMode((prev) => !prev)}
                      aria-label="Toggle color theme"
                      className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors touch-manipulation"
                    >
                      {darkMode ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      title={`Signed in as ${user.email || ALLOWED_EMAIL} — Sign Out`}
                      className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors touch-manipulation"
                    >
                      <LogOutIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dismissible Mobile Home-Screen Install Tip */}
                {showInstallTip && (
                  <div className="mt-2.5 px-3 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <SmartphoneIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                        Tip: Tap browser menu → <strong>Add to Home Screen</strong> for 1-tap app access
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInstallTip(false);
                        try {
                          localStorage.setItem('homeledger_hide_install', '1');
                        } catch {
                          // Ignore storage errors
                        }
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-black px-1.5"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </header>

              {/* ================= MAIN SCROLLABLE CONTENT AREA ================= */}
              <main className="flex-1 px-4 pt-4 space-y-4">
                {/* TAB 1: GRAPHICAL OVERVIEW */}
                {activeTab === 'overview' && (
                  <section className="space-y-4">
                    {analytics.urgentMilestones.length > 0 && (
                      <button
                        onClick={() => setActiveTab('vendors')}
                        className="w-full text-left p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <AlertTriangleIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                              {analytics.urgentMilestones.length} Milestone Payment{analytics.urgentMilestones.length > 1 ? 's' : ''} Due
                            </span>
                            <p className="text-xs font-bold truncate">
                              {analytics.urgentMilestones[0].vendorName}: {analytics.urgentMilestones[0].label} ({formatINR(analytics.urgentMilestones[0].amount, true)})
                            </p>
                          </div>
                        </div>
                        <ArrowUpRightIcon className="w-5 h-5 text-rose-500 shrink-0" />
                      </button>
                    )}

                    {/* Hero Graphical Spend Card */}
                    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {interiorProject.name} • Total Spent
                          </span>
                          <h2 className="text-3xl font-black tracking-tight mt-0.5">
                            {formatINR(analytics.totalSpent)}
                          </h2>
                        </div>
                        <button
                          onClick={() => setActiveTab('analytics')}
                          className="h-9 px-3 rounded-2xl bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5"
                        >
                          <BarChartIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Charts</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 items-center gap-3">
                        <div className="h-36 relative flex items-center justify-center">
                          <NativeDonutChart data={analytics.categoryDonutData} size={140} strokeWidth={20} />
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Bills</span>
                            <span className="text-lg font-black">{analytics.billCount}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">Paid</span>
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                              {formatINR(analytics.paidAmount, true)}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">Advance</span>
                            <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                              {formatINR(analytics.advanceAmount, true)}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-rose-700 dark:text-rose-300">Dues</span>
                            <span className="text-xs font-black text-rose-700 dark:text-rose-300">
                              {formatINR(analytics.totalVendorDues, true)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Material vs. Labour Visual Bar */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/70 space-y-2">
                        <div className="flex items-center justify-between text-xs font-extrabold">
                          <span className="text-indigo-600 dark:text-indigo-400">
                            Material {analytics.materialPct}% ({formatINR(analytics.materialSpent, true)})
                          </span>
                          <span className="text-orange-600 dark:text-orange-400">
                            Labour {analytics.labourPct}% ({formatINR(analytics.labourSpent, true)})
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${analytics.materialPct}%` }} />
                          <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${analytics.labourPct}%` }} />
                          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${analytics.generalPct}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Carpenter Majuri Quick Shortcut Banner */}
                    <button
                      onClick={() => setActiveTab('majuri')}
                      className="w-full text-left bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-4 shadow-md shadow-orange-500/20 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                          <RulerIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-100 block">
                            Carpentry Majuri Khata
                          </span>
                          <div className="text-sm font-black truncate">
                            {majuriSummary.totalSqft} ft² • Work {formatINR(majuriSummary.totalWorkBill, true)}
                          </div>
                          <div className="text-[11px] font-bold text-orange-100">
                            Advance Paid: {formatINR(majuriSummary.totalWeeklyAdvancePaid, true)}
                          </div>
                        </div>
                      </div>
                      <ArrowUpRightIcon className="w-5 h-5 shrink-0" />
                    </button>

                    {/* Quick-Start Onboarding Card when Space is Empty */}
                    {analytics.billCount === 0 && (
                      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700/60 space-y-2.5">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Quick Start • Ready for Your Entries
                        </div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Your Interior Work ledger is clean at ₹0. Log your first bill or carpenter measurement in seconds:
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => openAddExpenseDrawer()}
                            className="h-11 px-3 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                          >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add First Bill</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('majuri')}
                            className="h-11 px-3 rounded-2xl bg-orange-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                          >
                            <RulerIcon className="w-4 h-4" />
                            <span>Measure Majuri</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Interior Work Category Cards */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                          Interior Work Categories
                        </h3>
                        <span className="text-[11px] font-bold text-slate-400">Tap to filter</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {analytics.categoryList.map((cat) => {
                          const CIcon = cat.IconComp;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setSelectedCategoryFilter(cat.id);
                                setActiveTab('expenses');
                              }}
                              className="text-left bg-white dark:bg-slate-800/90 p-4 rounded-3xl border border-slate-200/70 dark:border-slate-700/70 shadow-sm active:scale-[0.98] transition-all space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className={`w-10 h-10 rounded-2xl ${cat.bg} ${cat.text} flex items-center justify-center`}>
                                  <CIcon className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                                  {cat.sharePct}%
                                </span>
                              </div>
                              <div>
                                <div className="text-xs font-extrabold truncate">{cat.shortLabel}</div>
                                <div className="text-base font-black mt-0.5">{formatINR(cat.spent, true)}</div>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${cat.sharePct}%`, backgroundColor: cat.color }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {/* TAB 2: EXPENSE TIMELINE & BILL LEDGER */}
                {activeTab === 'expenses' && (
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg font-extrabold">
                        Bills ({filteredExpenses.length})
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handlePrintGraphicalPDF}
                          className="h-9 px-3 rounded-xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1"
                        >
                          <PrinterIcon className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={handleExportCSV}
                          className="h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1"
                        >
                          <FileSpreadsheetIcon className="w-3.5 h-3.5" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search bill, vendor, family member..."
                        className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Horizontal Category Pills */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() => setSelectedCategoryFilter('all')}
                        className={`h-9 px-3.5 rounded-full text-xs font-extrabold shrink-0 ${
                          selectedCategoryFilter === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        All
                      </button>
                      {INTERIOR_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryFilter(cat.id)}
                          className={`h-9 px-3.5 rounded-full text-xs font-extrabold shrink-0 ${
                            selectedCategoryFilter === cat.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {cat.shortLabel}
                        </button>
                      ))}
                    </div>

                    {/* Type & Status Filter Pills */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {['all', 'Material', 'Labour', 'General'].map((ct) => (
                        <button
                          key={ct}
                          onClick={() => setCostTypeFilter(ct)}
                          className={`h-8 px-3 rounded-xl text-[11px] font-extrabold shrink-0 ${
                            costTypeFilter === ct
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {ct === 'all' ? 'All Types' : ct}
                        </button>
                      ))}
                      {['all', 'Paid', 'Advance', 'Pending'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`h-8 px-3 rounded-xl text-[11px] font-extrabold shrink-0 ${
                            statusFilter === st
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {st === 'all' ? 'Any Status' : st}
                        </button>
                      ))}
                    </div>

                    {/* Expenses Feed */}
                    <div className="space-y-2.5">
                      {filteredExpenses.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 text-center border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                          <p className="text-xs font-bold text-slate-400">
                            No bills match your filter yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => openAddExpenseDrawer()}
                            className="h-10 px-4 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                          >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add First Expense</span>
                          </button>
                        </div>
                      ) : (
                        filteredExpenses.map((exp) => {
                          const catObj = findCategoryById(exp.category);
                          const CIcon = catObj.IconComp;
                          const stObj =
                            PAYMENT_STATUSES.find((s) => s.id === exp.status) || PAYMENT_STATUSES[0];
                          return (
                            <div
                              key={exp.id}
                              className="bg-white dark:bg-slate-800/90 p-3.5 rounded-3xl border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className={`w-10 h-10 rounded-2xl ${catObj.bg} ${catObj.text} flex items-center justify-center shrink-0`}>
                                    <CIcon className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-extrabold leading-snug">{exp.title}</h4>
                                    <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                      {exp.vendor} • {exp.date}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="text-sm font-black">{formatINR(exp.amount)}</div>
                                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${stObj.badgeBg}`}>
                                    {exp.status}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-bold">
                                    {exp.mode}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-bold">
                                    {exp.costType || 'Material'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold">
                                    {exp.paidBy || 'You'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {exp.receipt && (
                                    <button
                                      onClick={() => setReceiptPreviewUrl(exp.receipt || null)}
                                      className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600"
                                      title="View Bill Photo"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleShareWhatsApp(
                                        `*HomeLedger Payment Receipt*\nItem: ${exp.title}\nAmount: *${formatINR(exp.amount)}* (${exp.status})\nVendor: ${exp.vendor}\nMode: ${exp.mode} | Date: ${exp.date}`
                                      )
                                    }
                                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"
                                    title="Share on WhatsApp"
                                  >
                                    <ArrowUpRightIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRepeatExpense(exp)}
                                    className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                    title="Repeat / Duplicate Bill"
                                  >
                                    <CopyIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => openAddExpenseDrawer(exp)}
                                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    title="Edit"
                                  >
                                    <EditIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpense(exp.id)}
                                    className="p-2 rounded-xl bg-rose-500/10 text-rose-500"
                                    title="Delete"
                                  >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                )}

                {/* TAB 3: VENDORS & MILESTONE CHECKPOINTS */}
                {activeTab === 'vendors' && (
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-extrabold">Vendors</h2>
                        <p className="text-xs text-slate-400">
                          Dues: <strong className="text-rose-500">{formatINR(analytics.totalVendorDues)}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => setIsVendorModalOpen(true)}
                        className="h-10 px-4 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1.5"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Vendor</span>
                      </button>
                    </div>

                    {analytics.vendorStats.length === 0 ? (
                      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center text-xs font-bold text-slate-400">
                        No contractors or vendors added yet. Tap &ldquo;Add Vendor&rdquo; above.
                      </div>
                    ) : (
                      analytics.vendorStats.map((v) => (
                        <div
                          key={v.id}
                          className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-black">{v.name}</h3>
                              <p className="text-xs text-slate-400">{v.trade}</p>
                            </div>
                            <button
                              onClick={() =>
                                handleShareWhatsApp(
                                  `*HomeLedger Vendor Ledger — ${v.name}*\nAgreed Quote: ${formatINR(v.quoted)}\nPaid So Far: *${formatINR(v.paidToVendor)}*\nBalance Payable: *${formatINR(v.balanceRemaining)}*`
                                )
                              }
                              className="h-9 px-3 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1"
                            >
                              <ArrowUpRightIcon className="w-3.5 h-3.5" />
                              <span>Share</span>
                            </button>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-emerald-600">Paid: {formatINR(v.paidToVendor)}</span>
                              <span className="text-rose-500">Due: {formatINR(v.balanceRemaining)}</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${v.progressPct}%` }}
                              />
                            </div>
                          </div>

                          {v.milestones.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {v.milestones.map((ms) => (
                                <div
                                  key={ms.id}
                                  className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/60"
                                >
                                  <div>
                                    <div className="text-xs font-extrabold">{ms.label}</div>
                                    <div className="text-[10px] font-semibold text-slate-400">
                                      {formatINR(ms.amount)} • Due {ms.dueDate}
                                    </div>
                                  </div>
                                  {ms.status === 'Paid' ? (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-extrabold">
                                      Paid ✓
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleMarkMilestonePaid(v, ms)}
                                      className="h-9 px-3 rounded-xl bg-indigo-600 text-white text-xs font-extrabold"
                                    >
                                      Pay Now
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </section>
                )}

                {/* TAB 4: VISUAL ANALYTICS CHARTS */}
                {activeTab === 'analytics' && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-extrabold">Visual Charts</h2>
                      <button
                        onClick={handlePrintGraphicalPDF}
                        className="h-9 px-3 rounded-xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1"
                      >
                        <PrinterIcon className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>

                    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Spend by Category (₹k)
                      </h3>
                      <NativeBarChart data={analytics.barChartData} />
                    </div>

                    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Cumulative Spend Curve (₹k)
                      </h3>
                      <NativeAreaChart data={analytics.trendData} />
                    </div>

                    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Payment Mode Split
                      </h3>
                      <div className="grid grid-cols-2 items-center gap-2">
                        <div className="h-36 flex items-center justify-center">
                          <NativeDonutChart data={analytics.modeChartData} size={130} strokeWidth={18} />
                        </div>
                        <div className="space-y-2">
                          {analytics.modeChartData.length === 0 ? (
                            <span className="text-xs font-bold text-slate-400">No payments yet</span>
                          ) : (
                            analytics.modeChartData.map((m) => (
                              <div key={m.name} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 font-bold">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: m.color }}
                                  />
                                  {m.name}
                                </span>
                                <span className="font-black">{formatINR(m.value, true)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Family & Co-Owner Split
                      </h3>
                      {analytics.memberChartData.length === 0 ? (
                        <span className="text-xs font-bold text-slate-400">No bills logged yet</span>
                      ) : (
                        analytics.memberChartData.map((m) => {
                          const pct =
                            analytics.totalSpent > 0 ? Math.round((m.total / analytics.totalSpent) * 100) : 0;
                          return (
                            <div key={m.id} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span>{m.label} ({m.count} bills)</span>
                                <span>{formatINR(m.total)} ({pct}%)</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${pct}%`, backgroundColor: m.color }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                )}

                {/* TAB 5: SMART CARPENTRY MAJURI KHATA */}
                {activeTab === 'majuri' && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          Measurements vs. Advance Payments
                        </span>
                        <h2 className="text-lg font-extrabold">Carpenter Majuri</h2>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={handlePrintGraphicalPDF}
                          className="h-10 px-3 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-sm"
                        >
                          <PrinterIcon className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => {
                            const vendorTitle =
                              selectedMajuriVendorFilter === 'all' ? 'All Vendors' : selectedMajuriVendorFilter;
                            const roomLines = majuriSummary.rooms
                              .map((r) => `• ${r.label}: ${r.sqft} sq.ft = ${formatINR(r.amount)}`)
                              .join('\n');
                            const balanceLine =
                              majuriSummary.netBalance >= 0
                                ? `Net Payable: *${formatINR(majuriSummary.netBalance)}*`
                                : `Extra Advance Credit: *${formatINR(Math.abs(majuriSummary.netBalance))}*`;
                            handleShareWhatsApp(
                              `*HomeLedger Carpenter Majuri (${vendorTitle})*\nMeasured Work: ${majuriSummary.totalSqft} sq.ft = *${formatINR(majuriSummary.totalWorkBill)}*\nAdvance Paid (No Meas.): *${formatINR(majuriSummary.totalWeeklyAdvancePaid)}*\n${balanceLine}\n\n*Room Breakdown:*\n${roomLines}`
                            );
                          }}
                          className="h-10 px-3 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-sm"
                        >
                          <ArrowUpRightIcon className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>

                    {/* Vendor Filter Pills */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => setSelectedMajuriVendorFilter('all')}
                        className={`h-8 px-3 rounded-full text-xs font-extrabold shrink-0 ${
                          selectedMajuriVendorFilter === 'all'
                            ? 'bg-orange-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        All Vendors ({majuriVendorOptions.length})
                      </button>
                      {majuriVendorOptions.map((vName) => (
                        <button
                          key={vName}
                          type="button"
                          onClick={() => {
                            setSelectedMajuriVendorFilter(vName);
                            setMjVendor(vName);
                            setAdvVendor(vName);
                          }}
                          className={`h-8 px-3 rounded-full text-xs font-extrabold shrink-0 ${
                            selectedMajuriVendorFilter === vName
                              ? 'bg-orange-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {vName}
                        </button>
                      ))}
                    </div>

                    {/* Running Khata Summary Card */}
                    <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-3xl p-4 shadow-lg shadow-orange-600/20 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-100">
                            {selectedMajuriVendorFilter === 'all' ? 'All Vendors' : selectedMajuriVendorFilter} • {majuriSummary.totalSqft} sq.ft
                          </span>
                          <div className="text-2xl font-black mt-0.5">
                            {formatINR(majuriSummary.totalWorkBill)}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-extrabold">
                          {majuriSummary.settledPct}% Paid
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-black/20 overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${majuriSummary.settledPct}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 rounded-2xl bg-white/15">
                          <span className="text-[10px] font-bold uppercase text-orange-100 block">
                            Advance Paid (No Meas.)
                          </span>
                          <span className="text-sm font-black">
                            {formatINR(majuriSummary.totalWeeklyAdvancePaid)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-white/15">
                          <span className="text-[10px] font-bold uppercase text-orange-100 block">
                            {majuriSummary.netBalance >= 0 ? 'Net Balance Due' : 'Extra Advance'}
                          </span>
                          <span className="text-sm font-black">
                            {formatINR(Math.abs(majuriSummary.netBalance))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vendor-Wise Khata Breakdown */}
                    {selectedMajuriVendorFilter === 'all' && majuriSummary.byVendorBreakdown.length > 0 && (
                      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                          Vendor-Wise Majuri Khata Summary
                        </h3>
                        <div className="space-y-2">
                          {majuriSummary.byVendorBreakdown.map((vb) => (
                            <button
                              key={vb.vendor}
                              type="button"
                              onClick={() => {
                                setSelectedMajuriVendorFilter(vb.vendor);
                                setMjVendor(vb.vendor);
                                setAdvVendor(vb.vendor);
                              }}
                              className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold truncate">{vb.vendor}</div>
                                <div className="text-[11px] font-semibold text-slate-400">
                                  {vb.sqft} ft² • Work {formatINR(vb.workBill, true)} • Adv {formatINR(vb.advancePaid, true)}
                                </div>
                              </div>
                              <span
                                className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 ${
                                  vb.netBalance >= 0
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {vb.netBalance >= 0
                                  ? `Due ${formatINR(vb.netBalance, true)}`
                                  : `Adv +${formatINR(Math.abs(vb.netBalance), true)}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Room Filter Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      <button
                        onClick={() => setSelectedMajuriRoomFilter('all')}
                        className={`h-9 px-3.5 rounded-full text-xs font-extrabold shrink-0 ${
                          selectedMajuriRoomFilter === 'all'
                            ? 'bg-orange-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        All Rooms
                      </button>
                      {majuriSummary.rooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() =>
                            setSelectedMajuriRoomFilter(
                              selectedMajuriRoomFilter === room.id ? 'all' : room.id
                            )
                          }
                          className={`h-9 px-3.5 rounded-full text-xs font-extrabold shrink-0 flex items-center gap-1.5 ${
                            selectedMajuriRoomFilter === room.id
                              ? 'bg-orange-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span>{room.shortLabel}</span>
                          <span className="opacity-75">({formatINR(room.amount, true)})</span>
                        </button>
                      ))}
                    </div>

                    {/* Unified Action Card: Switch between Measure Work vs. Pay Advance (No Measurement) */}
                    <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-3">
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => setMajuriActionMode('measure')}
                          className={`h-10 rounded-xl text-xs font-extrabold transition-all ${
                            majuriActionMode === 'measure'
                              ? 'bg-orange-600 text-white shadow-xs'
                              : 'text-slate-500'
                          }`}
                        >
                          + Measure Work
                        </button>
                        <button
                          type="button"
                          onClick={() => setMajuriActionMode('advance')}
                          className={`h-10 rounded-xl text-xs font-extrabold transition-all ${
                            majuriActionMode === 'advance'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500'
                          }`}
                        >
                          + Advance (No Meas.)
                        </button>
                      </div>

                      {majuriActionMode === 'measure' ? (
                        <form onSubmit={handleSaveMajuriEntry} className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                              Select Carpenter / Vendor
                            </label>
                            <select
                              value={mjVendor}
                              onChange={(e) => setMjVendor(e.target.value)}
                              className="w-full h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                            >
                              {majuriVendorOptions.map((vName) => (
                                <option key={vName} value={vName}>
                                  {vName}
                                </option>
                              ))}
                              <option value="__custom__">+ Enter New Carpenter / Vendor Name...</option>
                            </select>
                            {mjVendor === '__custom__' && (
                              <input
                                type="text"
                                value={mjCustomVendor}
                                onChange={(e) => setMjCustomVendor(e.target.value)}
                                placeholder="Enter carpenter or contractor name"
                                className="w-full h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-orange-400 text-xs font-bold"
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase text-slate-400">
                              Room & Work Item
                            </span>
                            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 text-[11px] font-extrabold">
                              {(['ft', 'in'] as const).map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => setMjUnit(u)}
                                  className={`px-3 py-1 rounded-lg ${
                                    mjUnit === u ? 'bg-orange-600 text-white' : 'text-slate-500'
                                  }`}
                                >
                                  {u === 'ft' ? 'Feet' : 'Inches'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={mjRoomId}
                              onChange={(e) => setMjRoomId(e.target.value)}
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                            >
                              {MAJURI_ROOMS.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={mjItem}
                              onChange={(e) => setMjItem(e.target.value)}
                              placeholder="Item (e.g. Wardrobe)"
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            />
                          </div>

                          {/* Quantity Multiplier Stepper */}
                          <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                              Quantity (Nos.)
                            </span>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3].map((presetQty) => (
                                <button
                                  key={presetQty}
                                  type="button"
                                  onClick={() => setMjQty(presetQty)}
                                  className={`h-8 px-2.5 rounded-xl text-xs font-extrabold ${
                                    mjQty === presetQty
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  ×{presetQty}
                                </button>
                              ))}
                              <input
                                type="number"
                                min={1}
                                value={mjQty}
                                onChange={(e) => setMjQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                aria-label="Quantity"
                                className="w-12 h-8 text-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              step="any"
                              value={mjHeight}
                              onChange={(e) => setMjHeight(e.target.value)}
                              placeholder={`H (${mjUnit})`}
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                            />
                            <input
                              type="number"
                              step="any"
                              value={mjWidth}
                              onChange={(e) => setMjWidth(e.target.value)}
                              placeholder={`W (${mjUnit})`}
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                            />
                            <input
                              type="number"
                              step="any"
                              value={mjRate}
                              onChange={(e) => setMjRate(e.target.value)}
                              placeholder="₹/ft²"
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                            />
                          </div>

                          {/* Smart Rate Presets: ₹300, ₹200, ₹150 */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-extrabold text-slate-400 mr-1">Rate:</span>
                            {MAJURI_RATE_PRESETS.map((rateChip) => (
                              <button
                                key={rateChip}
                                type="button"
                                onClick={() => setMjRate(String(rateChip))}
                                className={`flex-1 h-9 rounded-xl text-xs font-extrabold border transition-colors ${
                                  Number(mjRate) === rateChip
                                    ? 'bg-orange-600 text-white border-orange-600'
                                    : 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20'
                                }`}
                              >
                                ₹{rateChip}/ft²
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 block">
                                {liveMajuriCalc.qty > 1 ? `${liveMajuriCalc.qty} Nos. • ` : ''}Total Area & Majuri
                              </span>
                              <span className="text-sm font-black">
                                {liveMajuriCalc.sqft} ft² = {formatINR(liveMajuriCalc.amount)}
                              </span>
                            </div>
                            <button
                              type="submit"
                              className="h-10 px-4 rounded-xl bg-orange-600 text-white text-xs font-extrabold"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <form onSubmit={handleSaveCarpenterAdvance} className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                              Select Vendor / Contractor for Advance
                            </label>
                            <select
                              value={advVendor}
                              onChange={(e) => setAdvVendor(e.target.value)}
                              className="w-full h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                            >
                              {majuriVendorOptions.map((vName) => (
                                <option key={vName} value={vName}>
                                  {vName}
                                </option>
                              ))}
                              <option value="__custom__">+ Enter New Carpenter / Vendor Name...</option>
                            </select>
                            {advVendor === '__custom__' && (
                              <input
                                type="text"
                                value={advCustomVendor}
                                onChange={(e) => setAdvCustomVendor(e.target.value)}
                                placeholder="Enter carpenter or contractor name"
                                className="w-full h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-emerald-400 text-xs font-bold"
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase text-emerald-600">
                              Advance Payment (Without Measurement)
                            </span>
                            <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={advSyncToBills}
                                onChange={(e) => setAdvSyncToBills(e.target.checked)}
                                className="rounded text-emerald-600"
                              />
                              <span>Sync to Vendor & Bills</span>
                            </label>
                          </div>

                          <div className="flex gap-1.5">
                            {[5000, 10000, 20000, 30000].map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => setAdvAmount(String((Number(advAmount) || 0) + chip))}
                                className="flex-1 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold"
                              >
                                +₹{chip / 1000}k
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={advAmount}
                              onChange={(e) => setAdvAmount(e.target.value)}
                              placeholder="Advance ₹"
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                            />
                            <input
                              type="text"
                              value={advLabel}
                              onChange={(e) => setAdvLabel(e.target.value)}
                              placeholder="Reference (e.g. Stage 1 Advance)"
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <select
                              value={advMode}
                              onChange={(e) => setAdvMode(e.target.value)}
                              className="h-10 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            >
                              <option value="UPI">UPI</option>
                              <option value="Cash">Cash</option>
                              <option value="Bank Transfer">Bank</option>
                            </select>
                            <input
                              type="date"
                              value={advDate}
                              onChange={(e) => setAdvDate(e.target.value)}
                              className="h-10 px-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            />
                            <button
                              type="submit"
                              className="h-10 rounded-xl bg-emerald-600 text-white text-xs font-extrabold"
                            >
                              Pay Advance
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Measured Room Items List */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Measured Work Items ({filteredMajuriEntries.length})
                      </h3>
                      {filteredMajuriEntries.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 text-center border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-400">
                          No room measurements logged yet. Use the form above to calculate Qty × H × W × Rate.
                        </div>
                      ) : (
                        filteredMajuriEntries.map((m) => {
                          const room = MAJURI_ROOMS.find((r) => r.id === m.roomId);
                          const itemQty = m.qty || 1;
                          return (
                            <div
                              key={m.id}
                              className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-extrabold uppercase text-orange-600">
                                    {room?.label}
                                  </span>
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                                    {m.vendor || 'Main Carpenter'}
                                  </span>
                                </div>
                                <div className="text-xs font-extrabold mt-0.5 truncate">{m.item}</div>
                                <div className="text-[11px] text-slate-400">
                                  {itemQty > 1 ? `${itemQty} × ` : ''}
                                  {m.height}{m.unit} × {m.width}{m.unit} = {m.sqft} ft² @ ₹{m.rate}/ft²
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-sm font-black">{formatINR(m.amount)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRepeatMajuriEntry(m)}
                                  title="Repeat / Copy Measurement"
                                  className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                >
                                  <CopyIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMajuriEntry(m.id)}
                                  className="p-2 rounded-xl bg-rose-500/10 text-rose-500"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Advance Payments (Without Measurement) History List */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Advances Paid Without Measurement ({filteredCarpenterAdvances.length})
                      </h3>
                      {filteredCarpenterAdvances.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 text-center border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-400">
                          No unmeasured advance payments logged yet.
                        </div>
                      ) : (
                        filteredCarpenterAdvances.map((a) => (
                          <div
                            key={a.id}
                            className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                {a.vendor || 'Main Carpenter'}
                              </span>
                              <div className="text-xs font-extrabold mt-0.5 truncate">{a.weekLabel}</div>
                              <div className="text-[11px] text-slate-400">
                                {a.date} • {a.mode} • {a.paidBy}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-black text-emerald-600">
                                {formatINR(a.amount)}
                              </span>
                              <button
                                onClick={() => handleDeleteCarpenterAdvance(a.id)}
                                className="p-2 rounded-xl bg-rose-500/10 text-rose-500"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                )}
              </main>

              {/* ================= BOTTOM NAVIGATION DOCK WITH CENTER (+) BUTTON ================= */}
              <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 grid grid-cols-5 items-center">
                {[
                  { id: 'overview', label: 'Home', IconComp: LayoutGridIcon },
                  { id: 'expenses', label: 'Bills', IconComp: ReceiptIcon },
                  { id: '__add__', label: 'Add', IconComp: PlusIcon },
                  { id: 'majuri', label: 'Majuri', IconComp: RulerIcon },
                  { id: 'vendors', label: 'Vendors', IconComp: HardHatIcon }
                ].map((tab) => {
                  if (tab.id === '__add__') {
                    return (
                      <div key="add-center" className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => openAddExpenseDrawer()}
                          aria-label="Add Expense"
                          className="w-13 h-13 -mt-5 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/35 flex items-center justify-center active:scale-95 transition-transform"
                        >
                          <PlusIcon className="w-6 h-6" />
                        </button>
                      </div>
                    );
                  }
                  const TIcon = tab.IconComp;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-colors ${
                        active
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <TIcon className="w-5 h-5" />
                      <span className="text-[10px] font-extrabold mt-0.5">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* ================= SIMPLIFIED 3-TAP QUICK EXPENSE DRAWER ================= */}
              {isAddDrawerOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
                  <form
                    onSubmit={handleSaveExpense}
                    className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black">
                        {editingExpenseId ? 'Edit Bill' : 'Add Interior Bill'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddDrawerOpen(false)}
                        className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                      >
                        <XIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Large Amount Input + Quick Chips */}
                    <div className="space-y-2">
                      <div className="relative">
                        <RupeeIcon className="w-6 h-6 text-indigo-600 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          required
                          autoFocus
                          value={formAmount}
                          onChange={(e) => setFormAmount(e.target.value)}
                          placeholder="0"
                          className="w-full h-16 pl-12 pr-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-3xl font-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[500, 2000, 10000, 25000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleQuickAddAmount(amt)}
                            className="h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-extrabold"
                          >
                            +₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual Category Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {INTERIOR_CATEGORIES.map((cat) => {
                        const CIcon = cat.IconComp;
                        const selected = formCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormCategory(cat.id)}
                            className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 text-center ${
                              selected
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <CIcon className="w-4 h-4" />
                            <span className="text-[11px] font-extrabold truncate w-full">
                              {cat.shortLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Title & Payment Status */}
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="What did you pay for? (optional)"
                      className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />

                    <div className="grid grid-cols-3 gap-1.5">
                      {PAYMENT_STATUSES.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setFormStatus(st.id)}
                          className={`h-10 rounded-xl text-xs font-extrabold border ${
                            formStatus === st.id
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {/* Duplicate Bill Warning Guard */}
                    {potentialDuplicateExpense && (
                      <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Heads up: A bill of <strong>{formatINR(potentialDuplicateExpense.amount)}</strong> for{' '}
                          <strong>{potentialDuplicateExpense.vendor}</strong> on {potentialDuplicateExpense.date} already exists.
                        </span>
                      </div>
                    )}

                    {/* Collapsible Extra Details (Vendor, Type, Date, Bill Photo) */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowExtraFields(!showExtraFields)}
                        className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-extrabold text-slate-600 dark:text-slate-300"
                      >
                        <span>
                          + Vendor, Material/Labour, Date & Bill Photo
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {showExtraFields ? 'Hide' : 'Optional'}
                        </span>
                      </button>

                      {showExtraFields && (
                        <div className="p-3.5 space-y-3 bg-white dark:bg-slate-900">
                          {/* Smart Vendor Quick-Chips */}
                          {savedVendorSuggestions.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                Quick Select Saved Vendor / Carpenter
                              </span>
                              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                {savedVendorSuggestions.map((vName) => (
                                  <button
                                    key={vName}
                                    type="button"
                                    onClick={() => setFormVendor(vName)}
                                    className={`h-7 px-2.5 rounded-full text-[11px] font-extrabold shrink-0 border transition-colors ${
                                      formVendor === vName
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {vName}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-1.5">
                            {COST_TYPES.map((ct) => (
                              <button
                                key={ct.id}
                                type="button"
                                onClick={() => setFormCostType(ct.id)}
                                className={`h-9 rounded-xl text-xs font-extrabold border ${
                                  formCostType === ct.id
                                    ? 'bg-orange-600 text-white border-orange-600'
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {ct.label}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={formVendor}
                              onChange={(e) => setFormVendor(e.target.value)}
                              placeholder="Vendor / Shop name"
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            />
                            <select
                              value={formPaidBy}
                              onChange={(e) => setFormPaidBy(e.target.value)}
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            >
                              {FAMILY_MEMBERS.map((m) => (
                                <option key={m.id} value={m.id}>
                                  By {m.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={formMode}
                              onChange={(e) => setFormMode(e.target.value)}
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            >
                              {PAYMENT_MODES.map((pm) => (
                                <option key={pm.id} value={pm.id}>
                                  {pm.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={formDate}
                              onChange={(e) => setFormDate(e.target.value)}
                              className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            />
                          </div>

                          <label className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-500 cursor-pointer">
                            <CameraIcon className="w-4 h-4 text-indigo-600" />
                            <span>{formReceipt ? 'Bill Photo Attached ✓' : 'Attach Bill Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleReceiptUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/25"
                    >
                      {editingExpenseId ? 'Update Bill' : 'Save Bill'}
                    </button>
                  </form>
                </div>
              )}

              {/* ================= ADD VENDOR MODAL ================= */}
              {isVendorModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
                  <form
                    onSubmit={handleAddVendor}
                    className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black">Add Vendor</h3>
                      <button
                        type="button"
                        onClick={() => setIsVendorModalOpen(false)}
                        className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                      >
                        <XIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                      placeholder="Vendor / Contractor Name"
                      className="w-full h-12 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={newVendorTrade}
                      onChange={(e) => setNewVendorTrade(e.target.value)}
                      placeholder="Work Scope (e.g. Modular Kitchen)"
                      className="w-full h-12 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={newVendorQuoted}
                        onChange={(e) => setNewVendorQuoted(e.target.value)}
                        placeholder="Agreed Quote (₹)"
                        className="h-12 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={newVendorPhone}
                        onChange={(e) => setNewVendorPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="h-12 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full h-13 rounded-2xl bg-indigo-600 text-white font-black text-sm"
                    >
                      Save Vendor
                    </button>
                  </form>
                </div>
              )}

              {/* ================= RECEIPT PHOTO PREVIEW MODAL ================= */}
              {receiptPreviewUrl && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
                  <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-3xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">Attached Bill Photo</span>
                      <button
                        onClick={() => setReceiptPreviewUrl(null)}
                        className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <img
                      src={receiptPreviewUrl}
                      alt="Receipt"
                      className="w-full rounded-2xl max-h-[65vh] object-contain"
                    />
                  </div>
                </div>
              )}

              {/* ================= GRAPHICAL PDF & CSV EXPORT CENTER MODAL ================= */}
              {isExportModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
                  <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          PDF & Spreadsheet
                        </span>
                        <h3 className="text-lg font-black">Export Report</h3>
                      </div>
                      <button
                        onClick={() => setIsExportModalOpen(false)}
                        className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                      >
                        <XIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-4 space-y-3">
                      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-3.5 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                            HomeLedger Report
                          </div>
                          <div className="text-base font-black">{interiorProject.name}</div>
                        </div>
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-white/20">
                          {analytics.billCount} Bills
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-indigo-500 block">Spent</span>
                          <span className="text-xs font-black">{formatINR(analytics.totalSpent, true)}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-emerald-500 block">Paid/Adv</span>
                          <span className="text-xs font-black">
                            {formatINR(analytics.paidAmount + analytics.advanceAmount, true)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-rose-500 block">Dues</span>
                          <span className="text-xs font-black">{formatINR(analytics.totalVendorDues, true)}</span>
                        </div>
                      </div>

                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Includes Category Breakdown, Material vs. Labour bars, Carpentry Majuri Khata ({majuriEntries.length} items &amp; {carpenterAdvances.length} advances), and {analytics.billCount} itemized bills.
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handlePrintGraphicalPDF}
                        className="h-13 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                      >
                        <PrinterIcon className="w-4 h-4" />
                        <span>Save PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="h-13 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                      >
                        <FileSpreadsheetIcon className="w-4 h-4" />
                        <span>Excel CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}