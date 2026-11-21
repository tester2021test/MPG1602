import React, { useState, useEffect, useMemo } from 'react';

// --- Ambient Declarations for Runtime Globals ---
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | undefined;

// --- Authorized Owner Email (Strict Single-User Access Control) ---
const ALLOWED_EMAIL = 'vivekdn2504@gmail.com';
const appId = typeof __app_id !== 'undefined' ? __app_id : 'home-renovation-manager';

interface FirebaseRuntime {
  auth: any;
  db: any;
  GoogleAuthProvider: any;
  signInWithPopup: any;
  signOut: any;
  doc: any;
  setDoc: any;
}

// --- Self-Contained Inline SVG Icons ---
interface IconProps {
  className?: string;
}

const makeIcon = (paths: React.ReactNode): React.FC<IconProps> => ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {paths}
  </svg>
);

const Home = makeIcon(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>);
const Sofa = makeIcon(<><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" /><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" /><path d="M4 18v2" /><path d="M20 18v2" /></>);
const ChefHat = makeIcon(<><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" /><line x1="6" y1="17" x2="18" y2="17" /></>);
const Sparkles = makeIcon(<><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></>);
const Plus = makeIcon(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>);
const Users = makeIcon(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>);
const Receipt = makeIcon(<><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></>);
const Search = makeIcon(<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>);
const Download = makeIcon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>);
const CheckCircle2 = makeIcon(<><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>);
const AlertTriangle = makeIcon(<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>);
const X = makeIcon(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>);
const Camera = makeIcon(<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>);
const Edit3 = makeIcon(<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>);
const Trash2 = makeIcon(<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>);
const Sun = makeIcon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>);
const Moon = makeIcon(<><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></>);
const Cloud = makeIcon(<><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></>);
const CloudOff = makeIcon(<><path d="m2 2 20 20" /><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193" /><path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07" /></>);
const LogIn = makeIcon(<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></>);
const LogOut = makeIcon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>);
const ArrowUpRight = makeIcon(<><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></>);
const IndianRupee = makeIcon(<><path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" /></>);
const CreditCard = makeIcon(<><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>);
const Smartphone = makeIcon(<><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>);
const Banknote = makeIcon(<><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></>);
const Landmark = makeIcon(<><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></>);
const ImageIcon = makeIcon(<><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>);
const DoorOpen = makeIcon(<><path d="M13 4h3a2 2 0 0 1 2 2v14" /><path d="M2 20h3" /><path d="M13 20h9" /><path d="M10 12v.01" /><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z" /></>);
const HardHat = makeIcon(<><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" /><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" /><path d="M4 15v-3a6 6 0 0 1 6-6h0" /><path d="M14 6h0a6 6 0 0 1 6 6v3" /></>);
const Layers = makeIcon(<><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>);
const Tv = makeIcon(<><rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></>);
const Compass = makeIcon(<><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></>);
const ShoppingBasket = makeIcon(<><path d="m5 11 4-7" /><path d="m19 11-4-7" /><path d="M2 11h20" /><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.7-7.4" /></>);
const FileText = makeIcon(<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>);
const Car = makeIcon(<><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></>);
const HeartPulse = makeIcon(<><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" /></>);
const ShoppingBag = makeIcon(<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>);
const MoreHorizontal = makeIcon(<><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>);
const BarChart3 = makeIcon(<><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>);
const LayoutGrid = makeIcon(<><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></>);
const Printer = makeIcon(<><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></>);
const FileSpreadsheet = makeIcon(<><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2M14 13h2M8 17h2M14 17h2" /></>);
const Ruler = makeIcon(<><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" /></>);
const BookOpen = makeIcon(<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>);
const BedDouble = makeIcon(<><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M12 4v6" /><path d="M2 18h20" /></>);

// --- Safe Icon Renderer ---
const renderIcon = (
  IconComp: React.ComponentType<IconProps> | undefined,
  className = 'w-4 h-4'
): React.ReactNode => {
  if (!IconComp) return null;
  return <IconComp className={className} />;
};

// --- Native Responsive SVG Charts ---
const NativeDonutChart: React.FC<{
  data: { name: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}> = ({ data, size = 136, strokeWidth = 18 }) => {
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativePct = 0;

  if (total <= 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto -rotate-90">
      {data.map((slice, idx) => {
        const pct = slice.value / total;
        const dashLength = Math.max(0, pct * circumference - 2);
        const dashOffset = -cumulativePct * circumference;
        cumulativePct += pct;
        return (
          <circle
            key={`${slice.name}-${idx}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

const NativeBarChart: React.FC<{
  data: { name: string; Actual: number; color: string }[];
}> = ({ data }) => {
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

const NativeAreaChart: React.FC<{
  data: { date: string; cumulative: number }[];
}> = ({ data }) => {
  if (!data.length) return null;
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

// --- TypeScript Domain Interfaces ---
type ProjectKey = 'interior' | 'general';
type ActiveTab = 'overview' | 'expenses' | 'majuri' | 'vendors' | 'analytics';
type CostType = 'Material' | 'Labour' | 'General';
type PaymentStatus = 'Paid' | 'Advance' | 'Pending';
type MilestoneStatus = 'Paid' | 'Due Soon' | 'Overdue' | 'Upcoming';
type MeasurementUnit = 'ft' | 'in';

interface CategoryDef {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<IconProps>;
  color: string;
  bg: string;
  text: string;
}

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  costType?: CostType;
  paidBy?: string;
  vendor: string;
  mode: string;
  status: PaymentStatus;
  date: string;
  notes?: string;
  receipt?: string | null;
}

interface VendorMilestone {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
}

interface VendorItem {
  id: string;
  name: string;
  trade: string;
  quoted: number;
  phone: string;
  milestones: VendorMilestone[];
}

interface ProjectData {
  id: ProjectKey;
  name: string;
  shortName: string;
  vendors: VendorItem[];
  expenses: ExpenseItem[];
}

interface MajuriRoomDef {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<IconProps>;
  color: string;
  bg: string;
  text: string;
}

interface MajuriEntry {
  id: string;
  roomId: string;
  item: string;
  unit: MeasurementUnit;
  height: number;
  width: number;
  sqft: number;
  rate: number;
  amount: number;
  date: string;
}

interface CarpenterAdvance {
  id: string;
  syncedExpenseId?: string | null;
  weekLabel: string;
  amount: number;
  mode: string;
  paidBy: string;
  date: string;
  notes?: string;
}

// --- Firebase Config Loader (Supports GitHub Actions Vite Env + Runtime Config) ---
const getFirebaseConfig = (): Record<string, string> | null => {
  try {
    const viteEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    if (viteEnv?.VITE_FIREBASE_API_KEY) {
      return {
        apiKey: viteEnv.VITE_FIREBASE_API_KEY,
        authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: viteEnv.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: viteEnv.VITE_FIREBASE_APP_ID || ''
      };
    }
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }
  } catch (err) {
    console.warn('Firebase config check skipped:', err);
  }
  return null;
};

// --- Indian Currency Formatter (Lakhs & Thousands) ---
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

// --- Space-Specific Whole-Home Work & Expense Categories ---
const SPACE_CATEGORIES: Record<ProjectKey, CategoryDef[]> = {
  interior: [
    { id: 'carpentry', label: 'Carpentry & Woodwork', shortLabel: 'Carpentry', icon: Layers, color: '#d97706', bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
    { id: 'modular', label: 'Modular & Hardware', shortLabel: 'Modular', icon: ChefHat, color: '#f97316', bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
    { id: 'furniture', label: 'Furniture & Sofa', shortLabel: 'Furniture', icon: Sofa, color: '#6366f1', bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400' },
    { id: 'furnishings', label: 'Soft Furnishings & Decor', shortLabel: 'Decor', icon: Sparkles, color: '#ec4899', bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400' },
    { id: 'appliances', label: 'Appliances & Electronics', shortLabel: 'Appliances', icon: Tv, color: '#06b6d4', bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400' },
    { id: 'design', label: 'Design & Consultation', shortLabel: 'Design', icon: Compass, color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' }
  ],
  general: [
    { id: 'groceries', label: 'Groceries & Essentials', shortLabel: 'Groceries', icon: ShoppingBasket, color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'utilities', label: 'Bills & Utilities', shortLabel: 'Bills', icon: FileText, color: '#6366f1', bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400' },
    { id: 'travel', label: 'Travel & Fuel', shortLabel: 'Travel', icon: Car, color: '#f59e0b', bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
    { id: 'health', label: 'Health & Medical', shortLabel: 'Health', icon: HeartPulse, color: '#f43f5e', bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400' },
    { id: 'shopping', label: 'Shopping & Dining', shortLabel: 'Shopping', icon: ShoppingBag, color: '#ec4899', bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400' },
    { id: 'misc', label: 'Miscellaneous & Other', shortLabel: 'Misc', icon: MoreHorizontal, color: '#64748b', bg: 'bg-slate-500/15', text: 'text-slate-600 dark:text-slate-300' }
  ]
};

const ALL_CATEGORIES_FLAT: CategoryDef[] = Object.values(SPACE_CATEGORIES).flat();
const findCategoryById = (spaceKey: ProjectKey, catId: string): CategoryDef => {
  const spaceList = SPACE_CATEGORIES[spaceKey] || [];
  return (
    spaceList.find((c) => c.id === catId) ||
    ALL_CATEGORIES_FLAT.find((c) => c.id === catId) ||
    spaceList[0]
  );
};

const COST_TYPES: { id: CostType; label: string; color: string }[] = [
  { id: 'Material', label: 'Material', color: '#6366f1' },
  { id: 'Labour', label: 'Labour / Work', color: '#f97316' },
  { id: 'General', label: 'General / Fee', color: '#10b981' }
];

const FAMILY_MEMBERS = [
  { id: 'You', label: 'You', short: 'YO', color: '#6366f1', badgeBg: 'bg-indigo-600 text-white' },
  { id: 'Spouse', label: 'Spouse', short: 'SP', color: '#ec4899', badgeBg: 'bg-pink-600 text-white' },
  { id: 'Parents', label: 'Parents', short: 'PA', color: '#10b981', badgeBg: 'bg-emerald-600 text-white' },
  { id: 'Supervisor', label: 'Site Sup.', short: 'SS', color: '#f59e0b', badgeBg: 'bg-amber-600 text-white' }
];

const PAYMENT_MODES = [
  { id: 'UPI', label: 'UPI', icon: Smartphone, color: '#6366f1' },
  { id: 'Bank Transfer', label: 'Bank/NEFT', icon: Landmark, color: '#0ea5e9' },
  { id: 'Cash', label: 'Cash', icon: Banknote, color: '#10b981' },
  { id: 'Credit Card', label: 'Card', icon: CreditCard, color: '#f59e0b' }
];

const PAYMENT_STATUSES: { id: PaymentStatus; label: string; badgeBg: string }[] = [
  { id: 'Paid', label: 'Paid', badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  { id: 'Advance', label: 'Advance', badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  { id: 'Pending', label: 'Pending Due', badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' }
];

// --- Carpentry Majuri Rooms Configuration ---
const MAJURI_ROOMS: MajuriRoomDef[] = [
  { id: 'living', label: 'Living Room', shortLabel: 'Living', icon: Sofa, color: '#6366f1', bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'kitchen', label: 'Kitchen', shortLabel: 'Kitchen', icon: ChefHat, color: '#f97316', bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
  { id: 'study', label: 'Study Room', shortLabel: 'Study', icon: BookOpen, color: '#06b6d4', bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400' },
  { id: 'master_bedroom', label: 'Master Bedroom', shortLabel: 'Master Bed', icon: BedDouble, color: '#ec4899', bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400' },
  { id: 'safety_shoe', label: 'Safety Door & Shoe Rack', shortLabel: 'Safety & Shoe', icon: DoorOpen, color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' }
];

const INITIAL_MAJURI_ENTRIES: MajuriEntry[] = [
  {
    id: 'mj1',
    roomId: 'living',
    item: 'TV Unit & Wall Panelling',
    unit: 'ft',
    height: 8,
    width: 10,
    sqft: 80,
    rate: 320,
    amount: 25600,
    date: '2026-11-12'
  },
  {
    id: 'mj2',
    roomId: 'kitchen',
    item: 'Modular Base & Overhead Cabinets',
    unit: 'ft',
    height: 7,
    width: 12,
    sqft: 84,
    rate: 380,
    amount: 31920,
    date: '2026-11-14'
  },
  {
    id: 'mj3',
    roomId: 'master_bedroom',
    item: 'Sliding Wardrobe with Loft',
    unit: 'ft',
    height: 9.5,
    width: 8,
    sqft: 76,
    rate: 350,
    amount: 26600,
    date: '2026-11-16'
  },
  {
    id: 'mj4',
    roomId: 'study',
    item: 'Study Table & Bookshelf Unit',
    unit: 'ft',
    height: 7,
    width: 5,
    sqft: 35,
    rate: 300,
    amount: 10500,
    date: '2026-11-18'
  },
  {
    id: 'mj5',
    roomId: 'safety_shoe',
    item: 'Teak Finish Safety Door & Shoe Rack',
    unit: 'ft',
    height: 7,
    width: 6.5,
    sqft: 45.5,
    rate: 340,
    amount: 15470,
    date: '2026-11-19'
  }
];

const INITIAL_CARPENTER_ADVANCES: CarpenterAdvance[] = [
  {
    id: 'ca1',
    weekLabel: 'Week 1 Advance (Hafta)',
    amount: 25000,
    mode: 'Cash',
    paidBy: 'You',
    date: '2026-11-02',
    notes: 'Saturday weekly labour advance for 3 carpenters'
  },
  {
    id: 'ca2',
    weekLabel: 'Week 2 Advance (Hafta)',
    amount: 30000,
    mode: 'UPI',
    paidBy: 'You',
    date: '2026-11-09',
    notes: 'Weekly advance after carcass framing'
  },
  {
    id: 'ca3',
    weekLabel: 'Week 3 Advance (Hafta)',
    amount: 35000,
    mode: 'UPI',
    paidBy: 'Supervisor',
    date: '2026-11-16',
    notes: 'Weekly advance during shutter & laminate work'
  }
];

const INITIAL_PROJECTS: Record<ProjectKey, ProjectData> = {
  interior: {
    id: 'interior',
    name: 'Interior Work',
    shortName: 'Interiors',
    vendors: [
      {
        id: 'iv1',
        name: 'Sharma Carpentry & Modular',
        trade: 'Plywood, Laminates & Modular Units',
        quoted: 580000,
        phone: '+91 98201 44120',
        milestones: [
          { id: 'im1', label: 'Plywood & Hardware', amount: 228000, dueDate: '2026-11-06', status: 'Paid' },
          { id: 'im2', label: 'Carcass & Shutters', amount: 200000, dueDate: '2026-11-23', status: 'Due Soon' },
          { id: 'im3', label: 'Laminate & Polish', amount: 152000, dueDate: '2026-12-10', status: 'Upcoming' }
        ]
      },
      {
        id: 'iv2',
        name: 'UrbanCraft Sofa & Furnishings',
        trade: 'Custom Sofas, Beds & Curtains',
        quoted: 265000,
        phone: '+91 98211 90344',
        milestones: [
          { id: 'im4', label: '60% Frame Advance', amount: 145000, dueDate: '2026-11-14', status: 'Paid' },
          { id: 'im5', label: 'Upholstery Delivery', amount: 120000, dueDate: '2026-12-01', status: 'Upcoming' }
        ]
      },
      {
        id: 'iv3',
        name: 'Studio Axis Interior Design',
        trade: '3D Renders & Turnkey Supervision',
        quoted: 60000,
        phone: '+91 99204 11890',
        milestones: [
          { id: 'im6', label: '3D Drawings Fee', amount: 45000, dueDate: '2026-11-20', status: 'Overdue' },
          { id: 'im7', label: 'Final Styling', amount: 15000, dueDate: '2026-12-15', status: 'Upcoming' }
        ]
      }
    ],
    expenses: [
      {
        id: 'ie1',
        title: 'Century Ply BWP Marine Sheets & Fluted Laminates',
        amount: 228000,
        category: 'carpentry',
        costType: 'Material',
        paidBy: 'You',
        vendor: 'Sharma Carpentry & Modular',
        mode: 'Bank Transfer',
        status: 'Paid',
        date: '2026-11-06',
        notes: '710-grade marine plywood + acrylic matte laminates'
      },
      {
        id: 'ie2',
        title: 'Hettich Soft-Close Trolleys, Hinges & Faber Chimney',
        amount: 164000,
        category: 'modular',
        costType: 'Material',
        paidBy: 'Spouse',
        vendor: 'Sharma Carpentry & Modular',
        mode: 'UPI',
        status: 'Paid',
        date: '2026-11-11',
        notes: 'Tandem drawers, tall unit & 90cm auto-clean chimney'
      },
      {
        id: 'ie3',
        title: 'Carpentry Labour Milestone — Carcass & Wardrobes',
        amount: 95000,
        category: 'carpentry',
        costType: 'Labour',
        paidBy: 'Supervisor',
        vendor: 'Sharma Carpentry & Modular',
        mode: 'Cash',
        status: 'Paid',
        date: '2026-11-13',
        notes: 'Carpenter team 2nd stage labour payout'
      },
      {
        id: 'ie4',
        title: 'Teakwood Frame L-Shape Sofa & Hydraulic Bed',
        amount: 145000,
        category: 'furniture',
        costType: 'Material',
        paidBy: 'You',
        vendor: 'UrbanCraft Sofa & Furnishings',
        mode: 'Credit Card',
        status: 'Advance',
        date: '2026-11-14',
        notes: '60% advance for custom upholstery & storage bed'
      },
      {
        id: 'ie5',
        title: 'Blackout Curtains, Sheer Drapes & Wall Mirrors',
        amount: 52000,
        category: 'furnishings',
        costType: 'Material',
        paidBy: 'Spouse',
        vendor: 'UrbanCraft Sofa & Furnishings',
        mode: 'UPI',
        status: 'Paid',
        date: '2026-11-17',
        notes: 'Motorized curtain tracks + beveled bronze mirrors'
      },
      {
        id: 'ie6',
        title: '3D Elevation Renders & Working Drawings Fee',
        amount: 45000,
        category: 'design',
        costType: 'General',
        paidBy: 'You',
        vendor: 'Studio Axis Interior Design',
        mode: 'UPI',
        status: 'Pending',
        date: '2026-11-20',
        notes: 'Final milestone design fee'
      }
    ]
  },
  general: {
    id: 'general',
    name: 'General & Other Expenses',
    shortName: 'General',
    vendors: [
      {
        id: 'gv1',
        name: 'Housing Society & Utilities',
        trade: 'Maintenance, Electricity & Fiber',
        quoted: 18000,
        phone: 'Society Office',
        milestones: [
          { id: 'gm1', label: 'Society Maintenance', amount: 11850, dueDate: '2026-11-09', status: 'Paid' },
          { id: 'gm2', label: 'MSEDCL Electricity', amount: 6150, dueDate: '2026-11-24', status: 'Due Soon' }
        ]
      }
    ],
    expenses: [
      {
        id: 'ge1',
        title: 'Monthly Groceries, Grains & Household Essentials',
        amount: 14200,
        category: 'groceries',
        costType: 'General',
        paidBy: 'Spouse',
        vendor: 'DMart & Fresh Basket',
        mode: 'UPI',
        status: 'Paid',
        date: '2026-11-05',
        notes: 'Monthly staples & cleaning supplies'
      },
      {
        id: 'ge2',
        title: 'Society Maintenance, Electricity & JioFiber Bill',
        amount: 11850,
        category: 'utilities',
        costType: 'General',
        paidBy: 'You',
        vendor: 'Housing Society & Utilities',
        mode: 'Bank Transfer',
        status: 'Paid',
        date: '2026-11-09',
        notes: 'Auto-debit monthly utility bills'
      },
      {
        id: 'ge3',
        title: 'Petrol Refill & Highway FASTag Recharge',
        amount: 6500,
        category: 'travel',
        costType: 'General',
        paidBy: 'You',
        vendor: 'HPCL Fuel Station',
        mode: 'UPI',
        status: 'Paid',
        date: '2026-11-14',
        notes: 'Site visits & daily commute fuel'
      },
      {
        id: 'ge4',
        title: 'Family Health Checkup & Pharmacy Medicines',
        amount: 4800,
        category: 'health',
        costType: 'General',
        paidBy: 'Parents',
        vendor: 'Apollo Pharmacy',
        mode: 'Credit Card',
        status: 'Paid',
        date: '2026-11-18',
        notes: 'Routine wellness & first-aid kit'
      }
    ]
  }
};

// --- Client-Side Image Compression Helper (Canvas) ---
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
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = String(event.target?.result || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function App() {
  // --- Theme & Navigation State ---
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [activeProjectKey, setActiveProjectKey] = useState<ProjectKey>('interior');
  const [bypassPreviewLock, setBypassPreviewLock] = useState<boolean>(false);

  // --- Core App Data State ---
  const [projects, setProjects] = useState<Record<ProjectKey, ProjectData>>(INITIAL_PROJECTS);
  const [majuriEntries, setMajuriEntries] = useState<MajuriEntry[]>(INITIAL_MAJURI_ENTRIES);
  const [carpenterAdvances, setCarpenterAdvances] = useState<CarpenterAdvance[]>(INITIAL_CARPENTER_ADVANCES);
  const [selectedMajuriRoomFilter, setSelectedMajuriRoomFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [costTypeFilter, setCostTypeFilter] = useState<string>('all');

  // --- Network & Firebase Auth / Workspace State ---
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [fbRuntime, setFbRuntime] = useState<FirebaseRuntime | null>(null);
  const [hasFirebaseConfig] = useState<boolean>(() => Boolean(getFirebaseConfig()));
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'demo' | 'syncing' | 'synced' | 'offline'>('demo');
  const [sharedRoomCode, setSharedRoomCode] = useState<string>('HOME-2026');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // --- Modals & Drawers State ---
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState<boolean>(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Quick Add / Edit Expense Form State ---
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('carpentry');
  const [formCostType, setFormCostType] = useState<CostType>('Material');
  const [formPaidBy, setFormPaidBy] = useState<string>('You');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formVendor, setFormVendor] = useState<string>('');
  const [formMode, setFormMode] = useState<string>('UPI');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('Paid');
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formReceipt, setFormReceipt] = useState<string | null>(null);

  // --- Vendor Modal State ---
  const [isVendorModalOpen, setIsVendorModalOpen] = useState<boolean>(false);
  const [newVendorName, setNewVendorName] = useState<string>('');
  const [newVendorTrade, setNewVendorTrade] = useState<string>('');
  const [newVendorQuoted, setNewVendorQuoted] = useState<string>('');
  const [newVendorPhone, setNewVendorPhone] = useState<string>('');

  // --- Smart Carpentry Majuri Calculator & Logger State ---
  const [mjRoomId, setMjRoomId] = useState<string>('living');
  const [mjItem, setMjItem] = useState<string>('');
  const [mjUnit, setMjUnit] = useState<MeasurementUnit>('ft');
  const [mjHeight, setMjHeight] = useState<string>('');
  const [mjWidth, setMjWidth] = useState<string>('');
  const [mjRate, setMjRate] = useState<string>('350');

  // --- Weekly Carpenter Advance (Hafta) Form State ---
  const [advWeekLabel, setAdvWeekLabel] = useState<string>('');
  const [advAmount, setAdvAmount] = useState<string>('');
  const [advMode, setAdvMode] = useState<string>('UPI');
  const [advPaidBy, setAdvPaidBy] = useState<string>('You');
  const [advDate, setAdvDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [advNotes, setAdvNotes] = useState<string>('');
  const [advSyncToBills, setAdvSyncToBills] = useState<boolean>(true);

  // --- Transactions Search & Filter State ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // --- Online / Offline Network Listener ---
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

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await authMod.signInWithCustomToken(fbAuth, __initial_auth_token).catch(() => {});
        }

        unsubscribeAuth = authMod.onAuthStateChanged(fbAuth, async (currentUser: any) => {
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
        const cleanCode =
          (sharedRoomCode || 'HOME-2026').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') || 'HOME-2026';
        const workspaceDocRef = fbRuntime.doc(
          fbRuntime.db,
          'artifacts',
          appId,
          'users',
          user.uid,
          'workspaces',
          cleanCode
        );
        setSyncStatus(isOnline ? 'syncing' : 'offline');

        unsubscribeSnap = onSnapshot(
          workspaceDocRef,
          (snapshot: any) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              if (data?.projects) setProjects(data.projects as Record<ProjectKey, ProjectData>);
              if (Array.isArray(data?.majuriEntries)) setMajuriEntries(data.majuriEntries as MajuriEntry[]);
              if (Array.isArray(data?.carpenterAdvances)) {
                setCarpenterAdvances(data.carpenterAdvances as CarpenterAdvance[]);
              }
              setSyncStatus(isOnline ? 'synced' : 'offline');
            } else {
              fbRuntime
                .setDoc(workspaceDocRef, {
                  projects: INITIAL_PROJECTS,
                  majuriEntries: INITIAL_MAJURI_ENTRIES,
                  carpenterAdvances: INITIAL_CARPENTER_ADVANCES,
                  inviteCode: cleanCode,
                  updatedAt: Date.now()
                })
                .then(() => setSyncStatus(isOnline ? 'synced' : 'offline'))
                .catch(() => setSyncStatus('demo'));
            }
          },
          (error: any) => {
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
  }, [fbRuntime, user, sharedRoomCode, isOnline]);

  // Persist changes to Firestore whenever projects, majuri, or weekly advances mutate locally
  const saveProjectsToCloud = async (
    updatedProjects: Record<ProjectKey, ProjectData>,
    updatedMajuri: MajuriEntry[] = majuriEntries,
    updatedAdvances: CarpenterAdvance[] = carpenterAdvances
  ) => {
    setProjects(updatedProjects);
    setMajuriEntries(updatedMajuri);
    setCarpenterAdvances(updatedAdvances);
    if (!fbRuntime?.db || !user) return;
    try {
      setSyncStatus(isOnline ? 'syncing' : 'offline');
      const cleanCode =
        (sharedRoomCode || 'HOME-2026').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') || 'HOME-2026';
      const workspaceDocRef = fbRuntime.doc(
        fbRuntime.db,
        'artifacts',
        appId,
        'users',
        user.uid,
        'workspaces',
        cleanCode
      );
      await fbRuntime.setDoc(
        workspaceDocRef,
        {
          projects: updatedProjects,
          majuriEntries: updatedMajuri,
          carpenterAdvances: updatedAdvances,
          inviteCode: cleanCode,
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

  // Google Sign-In Handler (Restricted strictly to vivekdn2504@gmail.com)
  const handleGoogleSignIn = async () => {
    if (!fbRuntime?.auth) {
      showToast('Firebase config not detected — running in local preview');
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
    if (!fbRuntime?.auth) return;
    try {
      await fbRuntime.signOut(fbRuntime.auth);
      setUser(null);
      showToast('Signed out securely');
    } catch (err) {
      console.warn(err);
    }
  };

  // --- Current Active Project Derived Metrics ---
  const currentProject = projects[activeProjectKey] || projects.interior;
  const activeSpaceCategories = useMemo(
    () => SPACE_CATEGORIES[activeProjectKey] || SPACE_CATEGORIES.interior,
    [activeProjectKey]
  );

  const analytics = useMemo(() => {
    const expenses = currentProject.expenses || [];

    let totalSpent = 0;
    let paidAmount = 0;
    let advanceAmount = 0;
    let pendingAmount = 0;

    let materialSpent = 0;
    let labourSpent = 0;
    let generalSpent = 0;

    const byMember: Record<
      string,
      { id: string; label: string; short: string; color: string; badgeBg: string; total: number; count: number }
    > = {};
    FAMILY_MEMBERS.forEach((m) => {
      byMember[m.id] = { ...m, total: 0, count: 0 };
    });

    const byCategory: Record<string, CategoryDef & { spent: number; count: number }> = {};
    activeSpaceCategories.forEach((cat) => {
      byCategory[cat.id] = {
        ...cat,
        spent: 0,
        count: 0
      };
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

      const cType: CostType = exp.costType || (exp.category === 'labour' ? 'Labour' : 'Material');
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
          short: memberKey.slice(0, 2).toUpperCase(),
          color: '#64748b',
          badgeBg: 'bg-slate-600 text-white',
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

    const barChartData = categoryList
      .filter((c) => c.spent > 0)
      .map((c) => ({
        name: c.shortLabel || c.label.split(' ')[0],
        fullName: c.label,
        Actual: Math.round(c.spent / 1000),
        color: c.color
      }));

    const categoryDonutData = categoryList
      .filter((c) => c.spent > 0)
      .map((c) => ({
        name: c.shortLabel,
        value: c.spent,
        color: c.color
      }));

    const modeChartData = PAYMENT_MODES.map((m) => ({
      name: m.label,
      value: byMode[m.id] || 0,
      color: m.color
    })).filter((item) => item.value > 0);

    const sortedDates = Object.keys(byDateMap).sort();
    let cumulative = 0;
    const trendData = sortedDates.map((d) => {
      cumulative += byDateMap[d];
      return {
        date: d,
        daily: Math.round(byDateMap[d] / 1000),
        cumulative: Math.round(cumulative / 1000)
      };
    });

    const urgentMilestones: (VendorMilestone & {
      vendorId: string;
      vendorName: string;
      trade: string;
    })[] = [];

    const vendorStats = (currentProject.vendors || []).map((v) => {
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
  }, [currentProject, activeSpaceCategories]);

  // --- Filtered Transactions List ---
  const filteredExpenses = useMemo(() => {
    return (currentProject.expenses || [])
      .filter((exp) => {
        if (selectedCategoryFilter !== 'all' && exp.category !== selectedCategoryFilter) {
          return false;
        }
        if (costTypeFilter !== 'all') {
          const cType = exp.costType || (exp.category === 'labour' ? 'Labour' : 'Material');
          if (cType !== costTypeFilter) return false;
        }
        if (statusFilter !== 'all' && exp.status !== statusFilter) {
          return false;
        }
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
  }, [currentProject.expenses, selectedCategoryFilter, costTypeFilter, statusFilter, searchQuery]);

  // --- Handlers for Adding / Editing / Deleting Expenses ---
  const openAddExpenseDrawer = (prefill: Partial<ExpenseItem> = {}) => {
    const defaultCatId = activeSpaceCategories[0]?.id || 'carpentry';
    const defaultCost: CostType = activeProjectKey === 'general' ? 'General' : 'Material';
    setEditingExpenseId(prefill.id || null);
    setFormAmount(prefill.amount ? String(prefill.amount) : '');
    setFormCategory(
      prefill.category || (selectedCategoryFilter !== 'all' ? selectedCategoryFilter : defaultCatId)
    );
    setFormCostType(prefill.costType || defaultCost);
    setFormPaidBy(prefill.paidBy || 'You');
    setFormTitle(prefill.title || '');
    setFormVendor(prefill.vendor || '');
    setFormMode(prefill.mode || 'UPI');
    setFormStatus(prefill.status || 'Paid');
    setFormDate(prefill.date || new Date().toISOString().split('T')[0]);
    setFormNotes(prefill.notes || '');
    setFormReceipt(prefill.receipt || null);
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
      showToast('Bill photo compressed & attached!');
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

    const catObj = findCategoryById(activeProjectKey, formCategory);
    const cleanTitle = formTitle.trim() || `${catObj?.label || 'Work'} (${formCostType})`;

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

    const existingExpenses = currentProject.expenses || [];
    const updatedExpenses = editingExpenseId
      ? existingExpenses.map((item) => (item.id === editingExpenseId ? expenseRecord : item))
      : [expenseRecord, ...existingExpenses];

    const updatedProjects: Record<ProjectKey, ProjectData> = {
      ...projects,
      [activeProjectKey]: {
        ...currentProject,
        expenses: updatedExpenses
      }
    };

    saveProjectsToCloud(updatedProjects);
    setIsAddDrawerOpen(false);
    setEditingExpenseId(null);
    showToast(editingExpenseId ? 'Expense updated!' : `${formatINR(numericAmount)} logged!`);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = (currentProject.expenses || []).filter((e) => e.id !== expenseId);
    const updatedProjects: Record<ProjectKey, ProjectData> = {
      ...projects,
      [activeProjectKey]: {
        ...currentProject,
        expenses: updatedExpenses
      }
    };
    saveProjectsToCloud(updatedProjects);
    showToast('Expense entry removed');
  };

  // --- Add New Vendor Handler ---
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
      trade: newVendorTrade.trim() || 'General Contractor',
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

    const updatedProjects: Record<ProjectKey, ProjectData> = {
      ...projects,
      [activeProjectKey]: {
        ...currentProject,
        vendors: [...(currentProject.vendors || []), vendorObj]
      }
    };

    saveProjectsToCloud(updatedProjects);
    setNewVendorName('');
    setNewVendorTrade('');
    setNewVendorQuoted('');
    setNewVendorPhone('');
    setIsVendorModalOpen(false);
    showToast(`${vendorObj.name} added with 3 milestones`);
  };

  // --- Toggle Milestone Paid Status & Log Expense ---
  const handleMarkMilestonePaid = (vendor: VendorItem, milestone: VendorMilestone) => {
    const updatedVendors = (currentProject.vendors || []).map((v) => {
      if (v.id !== vendor.id) return v;
      return {
        ...v,
        milestones: (v.milestones || []).map((m) =>
          m.id === milestone.id ? { ...m, status: 'Paid' as MilestoneStatus } : m
        )
      };
    });

    const newExpense: ExpenseItem = {
      id: `exp_ms_${Date.now()}`,
      title: `${vendor.name} — ${milestone.label}`,
      amount: Number(milestone.amount) || 0,
      category: activeSpaceCategories[0]?.id || 'carpentry',
      costType: 'Labour',
      paidBy: 'You',
      vendor: vendor.name,
      mode: 'UPI',
      status: 'Paid',
      date: new Date().toISOString().split('T')[0],
      notes: `Milestone checkpoint settled (${milestone.label})`
    };

    const updatedProjects: Record<ProjectKey, ProjectData> = {
      ...projects,
      [activeProjectKey]: {
        ...currentProject,
        vendors: updatedVendors,
        expenses: [newExpense, ...(currentProject.expenses || [])]
      }
    };

    saveProjectsToCloud(updatedProjects);
    showToast(`Milestone "${milestone.label}" marked Paid!`);
  };

  // --- Smart Majuri Live Calculation (Height × Width × Sq.Ft Rate) ---
  const liveMajuriCalc = useMemo(() => {
    const h = parseFloat(mjHeight) || 0;
    const w = parseFloat(mjWidth) || 0;
    const r = parseFloat(mjRate) || 0;
    const rawArea = h * w;
    const sqft = mjUnit === 'in' ? rawArea / 144 : rawArea;
    const roundedSqft = Math.round(sqft * 100) / 100;
    const amount = Math.round(roundedSqft * r);
    return { sqft: roundedSqft, amount };
  }, [mjHeight, mjWidth, mjRate, mjUnit]);

  const majuriSummary = useMemo(() => {
    let totalSqft = 0;
    let totalWorkBill = 0;

    const byRoom = MAJURI_ROOMS.map((room) => {
      const items = majuriEntries.filter((e) => e.roomId === room.id);
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

    const totalWeeklyAdvancePaid = carpenterAdvances.reduce(
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

    return {
      totalSqft: Math.round(totalSqft * 10) / 10,
      totalWorkBill,
      totalWeeklyAdvancePaid,
      netBalance,
      settledPct,
      rooms: roomsWithShare
    };
  }, [majuriEntries, carpenterAdvances]);

  const handleSaveMajuriEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (liveMajuriCalc.sqft <= 0 || liveMajuriCalc.amount <= 0) {
      showToast('Enter valid Height, Width & Sq.ft Rate');
      return;
    }

    const roomObj = MAJURI_ROOMS.find((r) => r.id === mjRoomId) || MAJURI_ROOMS[0];
    const cleanItem = mjItem.trim() || `${roomObj.label} Carpentry Work`;

    const newMajuri: MajuriEntry = {
      id: `mj_${Date.now()}`,
      roomId: mjRoomId,
      item: cleanItem,
      unit: mjUnit,
      height: parseFloat(mjHeight),
      width: parseFloat(mjWidth),
      sqft: liveMajuriCalc.sqft,
      rate: parseFloat(mjRate),
      amount: liveMajuriCalc.amount,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedMajuri = [newMajuri, ...majuriEntries];
    saveProjectsToCloud(projects, updatedMajuri, carpenterAdvances);
    setMjItem('');
    setMjHeight('');
    setMjWidth('');
    showToast(`Measurement ${liveMajuriCalc.sqft} sq.ft (${formatINR(liveMajuriCalc.amount)}) added to work bill!`);
  };

  const handleDeleteMajuriEntry = (id: string) => {
    const updatedMajuri = majuriEntries.filter((m) => m.id !== id);
    saveProjectsToCloud(projects, updatedMajuri, carpenterAdvances);
    showToast('Majuri measurement removed');
  };

  // --- Log Weekly Carpenter Advance (Hafta) & Sync to Interior Labour Expenses ---
  const handleSaveCarpenterAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(advAmount);
    if (!numAmt || numAmt <= 0) {
      showToast('Enter valid weekly advance ₹ amount');
      return;
    }

    const nextWeekNum = carpenterAdvances.length + 1;
    const cleanLabel = advWeekLabel.trim() || `Week ${nextWeekNum} Advance (Hafta)`;
    const advId = `ca_${Date.now()}`;
    const syncedExpenseId = advSyncToBills ? `exp_${advId}` : null;

    const newAdv: CarpenterAdvance = {
      id: advId,
      syncedExpenseId,
      weekLabel: cleanLabel,
      amount: numAmt,
      mode: advMode,
      paidBy: advPaidBy,
      date: advDate,
      notes: advNotes.trim() || 'Weekly carpentry labour advance'
    };

    const updatedAdvances = [newAdv, ...carpenterAdvances];
    let updatedProjects = projects;

    if (advSyncToBills && syncedExpenseId) {
      const interiorProj = projects.interior;
      const syncedExpense: ExpenseItem = {
        id: syncedExpenseId,
        title: `Carpenter Majuri: ${cleanLabel}`,
        amount: numAmt,
        category: 'carpentry',
        costType: 'Labour',
        paidBy: advPaidBy,
        vendor: 'Sharma Carpentry & Modular',
        mode: advMode,
        status: 'Advance',
        date: advDate,
        notes: newAdv.notes
      };
      updatedProjects = {
        ...projects,
        interior: {
          ...interiorProj,
          expenses: [syncedExpense, ...(interiorProj.expenses || [])]
        }
      };
    }

    saveProjectsToCloud(updatedProjects, majuriEntries, updatedAdvances);
    setAdvWeekLabel('');
    setAdvAmount('');
    setAdvNotes('');
    showToast(
      advSyncToBills
        ? `Weekly advance ${formatINR(numAmt)} logged & synced to Bills!`
        : `Weekly advance ${formatINR(numAmt)} recorded!`
    );
  };

  const handleDeleteCarpenterAdvance = (id: string) => {
    const targetAdv = carpenterAdvances.find((a) => a.id === id);
    const updatedAdvances = carpenterAdvances.filter((a) => a.id !== id);
    let updatedProjects = projects;

    if (targetAdv?.syncedExpenseId) {
      const interiorProj = projects.interior;
      updatedProjects = {
        ...projects,
        interior: {
          ...interiorProj,
          expenses: (interiorProj.expenses || []).filter(
            (e) => e.id !== targetAdv.syncedExpenseId
          )
        }
      };
    }

    saveProjectsToCloud(updatedProjects, majuriEntries, updatedAdvances);
    showToast('Weekly advance & synced bill removed');
  };

  // --- 1-Tap WhatsApp Payment Summary Share ---
  const handleShareWhatsApp = (summaryText: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryText).catch(() => {});
    }
    const encoded = encodeURIComponent(summaryText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
    showToast('Summary copied & opening WhatsApp...');
  };

  // --- Graphical Print-Ready PDF Report Generator ---
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

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${currentProject.name} — Graphical Financial Report</title>
          <style>
            * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            body { margin: 0; padding: 28px; color: #0f172a; background: #ffffff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; padding: 24px 28px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.4px; }
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
              <h1>HomeLedger • ${currentProject.name}</h1>
              <p>Graphical Renovation & Expense Statement • Workspace: ${sharedRoomCode}</p>
            </div>
            <div class="badge">Generated ${generatedOn}</div>
          </div>

          <div class="kpi-grid">
            <div class="kpi">
              <div class="kpi-label">Total Actual Spent</div>
              <div class="kpi-val" style="color:#4f46e5;">${formatINR(analytics.totalSpent)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Settled / Paid</div>
              <div class="kpi-val" style="color:#059669;">${formatINR(analytics.paidAmount)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Advance Given</div>
              <div class="kpi-val" style="color:#d97706;">${formatINR(analytics.advanceAmount)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Pending & Vendor Dues</div>
              <div class="kpi-val" style="color:#e11d48;">${formatINR(analytics.totalVendorDues)}</div>
            </div>
          </div>

          <div class="split-grid">
            <div class="section" style="margin-bottom:0;">
              <h3 class="section-title">Actual Work & Expense Breakdown</h3>
              ${analytics.categoryList
                .map(
                  (cat) => `
                    <div class="bar-row">
                      <div class="bar-meta">
                        <span>${cat.label}</span>
                        <span>${formatINR(cat.spent)} (${cat.sharePct}%)</span>
                      </div>
                      <div class="bar-track">
                        <div class="bar-fill" style="width:${cat.sharePct}%; background:${cat.color};"></div>
                      </div>
                    </div>
                  `
                )
                .join('')}
            </div>

            <div class="section" style="margin-bottom:0;">
              <h3 class="section-title">Material vs. Labour & Family Split</h3>
              <div class="bar-row">
                <div class="bar-meta">
                  <span>Material Purchases (${analytics.materialPct}%)</span>
                  <span>${formatINR(analytics.materialSpent)}</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width:${analytics.materialPct}%; background:#4f46e5;"></div></div>
              </div>
              <div class="bar-row">
                <div class="bar-meta">
                  <span>Labour & Workmanship (${analytics.labourPct}%)</span>
                  <span>${formatINR(analytics.labourSpent)}</span>
                </div>
                <div class="bar-track"><div class="bar-fill" style="width:${analytics.labourPct}%; background:#f97316;"></div></div>
              </div>
              <hr style="border:none; border-top:1px solid #e2e8f0; margin:14px 0;" />
              ${analytics.memberChartData
                .map((m) => {
                  const mpct =
                    analytics.totalSpent > 0 ? Math.round((m.total / analytics.totalSpent) * 100) : 0;
                  return `
                    <div class="bar-row">
                      <div class="bar-meta">
                        <span>Paid by ${m.label} (${m.count} bills)</span>
                        <span>${formatINR(m.total)} (${mpct}%)</span>
                      </div>
                      <div class="bar-track"><div class="bar-fill" style="width:${mpct}%; background:${m.color};"></div></div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Contractor & Vendor Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Vendor / Contractor</th>
                  <th>Work Scope</th>
                  <th>Agreed Quote</th>
                  <th>Paid So Far</th>
                  <th>Balance Payable</th>
                </tr>
              </thead>
              <tbody>
                ${analytics.vendorStats
                  .map(
                    (v) => `
                    <tr>
                      <td><strong>${v.name}</strong></td>
                      <td>${v.trade}</td>
                      <td>${formatINR(v.quoted)}</td>
                      <td style="color:#059669; font-weight:700;">${formatINR(v.paidToVendor)} (${v.progressPct}%)</td>
                      <td style="color:#e11d48; font-weight:700;">${formatINR(v.balanceRemaining)}</td>
                    </tr>
                  `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="section" style="border-color:#fed7aa; background:#fffaf5;">
            <h3 class="section-title" style="color:#ea580c;">Carpentry Majuri & Weekly Advance (Khata) Statement</h3>
            <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom:14px;">
              <div class="kpi" style="background:#ffffff;">
                <div class="kpi-label">Total Measured Area</div>
                <div class="kpi-val" style="font-size:17px; color:#ea580c;">${majuriSummary.totalSqft} sq.ft.</div>
              </div>
              <div class="kpi" style="background:#ffffff;">
                <div class="kpi-label">Total Work Bill</div>
                <div class="kpi-val" style="font-size:17px; color:#4f46e5;">${formatINR(majuriSummary.totalWorkBill)}</div>
              </div>
              <div class="kpi" style="background:#ffffff;">
                <div class="kpi-label">Weekly Advances Paid</div>
                <div class="kpi-val" style="font-size:17px; color:#059669;">${formatINR(majuriSummary.totalWeeklyAdvancePaid)}</div>
              </div>
              <div class="kpi" style="background:#ffffff;">
                <div class="kpi-label">${majuriSummary.netBalance >= 0 ? 'Net Balance Payable' : 'Extra Advance Credit'}</div>
                <div class="kpi-val" style="font-size:17px; color:${majuriSummary.netBalance >= 0 ? '#e11d48' : '#d97706'};">${formatINR(Math.abs(majuriSummary.netBalance))}</div>
              </div>
            </div>

            <div style="margin-bottom:14px;">
              ${majuriSummary.rooms
                .map(
                  (r) => `
                  <div class="bar-row">
                    <div class="bar-meta">
                      <span>${r.label} (${r.sqft} sq.ft.)</span>
                      <span>${formatINR(r.amount)} (${r.sharePct}%)</span>
                    </div>
                    <div class="bar-track"><div class="bar-fill" style="width:${r.sharePct}%; background:${r.color};"></div></div>
                  </div>
                `
                )
                .join('')}
            </div>

            <table style="margin-bottom:14px; background:#ffffff;">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Room / Area</th>
                  <th>Work Description</th>
                  <th>Dimensions (H × W)</th>
                  <th>Area (Sq.Ft)</th>
                  <th>Rate</th>
                  <th style="text-align:right;">Majuri Bill</th>
                </tr>
              </thead>
              <tbody>
                ${majuriEntries
                  .map((m) => {
                    const rLabel = MAJURI_ROOMS.find((r) => r.id === m.roomId)?.label || m.roomId;
                    return `
                      <tr>
                        <td>${m.date}</td>
                        <td><strong>${rLabel}</strong></td>
                        <td>${m.item}</td>
                        <td>${m.height}${m.unit} × ${m.width}${m.unit}</td>
                        <td>${m.sqft} ft²</td>
                        <td>₹${m.rate}/ft²</td>
                        <td style="text-align:right; font-weight:800;">${formatINR(m.amount)}</td>
                      </tr>
                    `;
                  })
                  .join('')}
                <tr style="background:#fff7ed;">
                  <td colspan="4" style="font-weight:800; color:#9a3412;">TOTAL MEASURED CARPENTRY WORK BILL</td>
                  <td style="font-weight:800; color:#9a3412;">${majuriSummary.totalSqft} ft²</td>
                  <td>—</td>
                  <td style="text-align:right; font-weight:900; color:#ea580c;">${formatINR(majuriSummary.totalWorkBill)}</td>
                </tr>
              </tbody>
            </table>

            <table style="background:#ffffff;">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weekly Advance / Hafta</th>
                  <th>Paid By</th>
                  <th>Payment Mode</th>
                  <th>Notes</th>
                  <th style="text-align:right;">Advance Paid</th>
                </tr>
              </thead>
              <tbody>
                ${carpenterAdvances
                  .map(
                    (a) => `
                    <tr>
                      <td>${a.date}</td>
                      <td><strong>${a.weekLabel}</strong></td>
                      <td>${a.paidBy}</td>
                      <td>${a.mode}</td>
                      <td>${a.notes || '—'}</td>
                      <td style="text-align:right; font-weight:800; color:#059669;">${formatINR(a.amount)}</td>
                    </tr>
                  `
                  )
                  .join('')}
                <tr style="background:#ecfdf5;">
                  <td colspan="5" style="font-weight:800; color:#065f46;">TOTAL WEEKLY ADVANCES PAID (${carpenterAdvances.length} ENTRIES)</td>
                  <td style="text-align:right; font-weight:900; color:#059669;">${formatINR(majuriSummary.totalWeeklyAdvancePaid)}</td>
                </tr>
                <tr style="background:${majuriSummary.netBalance >= 0 ? '#fff1f2' : '#fef3c7'};">
                  <td colspan="5" style="font-weight:900; color:${majuriSummary.netBalance >= 0 ? '#9f1239' : '#92400e'};">
                    ${majuriSummary.netBalance >= 0 ? 'NET BALANCE PAYABLE TO CARPENTER (WORK BILL − ADVANCES)' : 'EXTRA ADVANCE CREDIT HELD BY CARPENTER'}
                  </td>
                  <td style="text-align:right; font-weight:900; color:${majuriSummary.netBalance >= 0 ? '#e11d48' : '#d97706'};">
                    ${formatINR(Math.abs(majuriSummary.netBalance))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3 class="section-title">Itemized Expense Ledger (${(currentProject.expenses || []).length} Entries)</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Paid By</th>
                  <th>Vendor</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(currentProject.expenses || [])
                  .map((e) => {
                    const catLabel = findCategoryById(activeProjectKey, e.category)?.shortLabel || e.category;
                    const stClass = e.status === 'Paid' ? 'paid' : e.status === 'Advance' ? 'advance' : 'pending';
                    return `
                      <tr>
                        <td>${e.date}</td>
                        <td><strong>${e.title}</strong></td>
                        <td>${catLabel}</td>
                        <td>${e.costType || 'Material'}</td>
                        <td>${e.paidBy || 'You'}</td>
                        <td>${e.vendor}</td>
                        <td>${e.mode}</td>
                        <td><span class="pill ${stClass}">${e.status}</span></td>
                        <td style="text-align:right; font-weight:800;">${formatINR(e.amount)}</td>
                      </tr>
                    `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">Generated via HomeLedger • Open-Source Home Interior & Expense Manager</div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          </script>
        </body>
      </html>
    `);
    reportWindow.document.close();
    showToast('Opening print-ready Graphical PDF...');
  };

  // --- 1-Click CSV / Excel Report Export ---
  const handleExportCSV = () => {
    const summaryBlock = [
      [`HomeLedger Actual Expense Report - ${currentProject.name}`, `Workspace: ${sharedRoomCode}`, `Exported: ${new Date().toISOString().slice(0, 10)}`],
      ['Total Actual Spent (INR)', analytics.totalSpent, 'Paid Amount (INR)', analytics.paidAmount, 'Pending Dues (INR)', analytics.totalVendorDues],
      []
    ];

    const headers = ['Date', 'Title', 'Work/Expense Category', 'Type', 'Paid By', 'Vendor', 'Amount (INR)', 'Payment Mode', 'Status', 'Notes'];
    const rows = (currentProject.expenses || []).map((e) => {
      const catLabel = findCategoryById(activeProjectKey, e.category)?.label || e.category;
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
      ...summaryBlock.map((r) => r.join(',')),
      headers.join(','),
      ...rows,
      '',
      ['CARPENTRY MAJURI KHATA SUMMARY', `Total Sq.Ft: ${majuriSummary.totalSqft}`, `Total Work Bill (INR): ${majuriSummary.totalWorkBill}`, `Weekly Advances Paid (INR): ${majuriSummary.totalWeeklyAdvancePaid}`, `Net Payable Balance (INR): ${majuriSummary.netBalance}`].join(','),
      ['Date', 'Room / Area', 'Work Description', 'Height', 'Width', 'Unit', 'Area (Sq.Ft)', 'Rate (INR/Sq.Ft)', 'Majuri Amount (INR)'].join(','),
      ...majuriEntries.map((m) => {
        const rLabel = MAJURI_ROOMS.find((r) => r.id === m.roomId)?.label || m.roomId;
        return [m.date, `"${rLabel}"`, `"${(m.item || '').replace(/"/g, '""')}"`, m.height, m.width, m.unit, m.sqft, m.rate, m.amount].join(',');
      }),
      '',
      ['Date', 'Weekly Advance Label', 'Paid By', 'Mode', 'Advance Amount (INR)', 'Notes'].join(','),
      ...carpenterAdvances.map((a) =>
        [a.date, `"${(a.weekLabel || '').replace(/"/g, '""')}"`, a.paidBy, a.mode, a.amount, `"${(a.notes || '').replace(/"/g, '""')}"`].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentProject.shortName}_HomeLedger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Excel / CSV spreadsheet downloaded!');
  };

  // --- Full-Screen Google Sign-In Gate (Hides All Data Until vivekdn2504@gmail.com Signs In) ---
  if (!user && !bypassPreviewLock) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-extrabold uppercase tracking-wider">
                Private Owner Vault
              </span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle color theme"
                className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-center space-y-3 pt-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/25">
                <Home className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">HomeLedger</h1>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Interior Work, Carpentry Majuri & Expense Manager
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Authorized Google Account Only
              </span>
              <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 break-all">
                {ALLOWED_EMAIL}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                All expenses, vendor ledgers & carpentry khata remain locked until verified via Google Sign-In.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-extrabold leading-snug">{authError}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={authLoading}
                onClick={handleGoogleSignIn}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all"
              >
                <svg className="w-5 h-5 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                </svg>
                <span>{authLoading ? 'Checking Session...' : 'Continue with Google'}</span>
              </button>

              {!hasFirebaseConfig && (
                <button
                  type="button"
                  onClick={() => setBypassPreviewLock(true)}
                  className="w-full h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-extrabold text-slate-600 dark:text-slate-300 transition-colors"
                >
                  Open Local UI Preview (No Firebase Keys Here)
                </button>
              )}
            </div>

            <div className="text-center text-[11px] font-semibold text-slate-400">
              Secured by Google Firebase Authentication
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex justify-center transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-md min-h-screen bg-slate-50 dark:bg-slate-900 shadow-2xl sm:border-x border-slate-200/80 dark:border-slate-800 flex flex-col relative pb-28">
          {/* Toast Notification Pill */}
          {toastMessage && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-xl text-sm font-semibold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ================= TOP APP HEADER & PROJECT SWITCHER ================= */}
          <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200/70 dark:border-slate-800 px-4 pt-3.5 pb-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold tracking-tight leading-none">HomeLedger</h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    {!isOnline || syncStatus === 'offline' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <CloudOff className="w-3 h-3" /> Offline Cached
                      </span>
                    ) : syncStatus === 'synced' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Cloud className="w-3 h-3" /> Online • {sharedRoomCode}
                      </span>
                    ) : syncStatus === 'syncing' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <Cloud className="w-3 h-3 animate-pulse" /> Syncing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Ready • {sharedRoomCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Controls: Majuri, PDF Export, Workspace, Theme & Sign-In */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('majuri')}
                  title="Carpentry Majuri Calculator & Room Logs"
                  className={`h-10 px-2.5 rounded-2xl border flex items-center gap-1 text-xs font-extrabold transition-colors ${
                    activeTab === 'majuri'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30 hover:bg-orange-500/25'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Majuri</span>
                </button>

                <button
                  onClick={() => setIsExportModalOpen(true)}
                  title="Export Graphical PDF & CSV Report"
                  className="h-10 px-2.5 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1 text-xs font-extrabold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => setIsShareModalOpen(true)}
                  title="Workspace Code"
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-colors"
                >
                  <Users className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  aria-label="Toggle color theme"
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>

                {user ? (
                  <button
                    onClick={handleSignOut}
                    title={`Signed in as ${user.email || ALLOWED_EMAIL} — Click to Sign Out`}
                    className="h-10 px-2.5 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 text-xs font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    title={`Sign in with ${ALLOWED_EMAIL}`}
                    className="h-10 px-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Top Project Switcher Pill */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl">
              {Object.values(projects).map((proj) => {
                const active = activeProjectKey === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setActiveProjectKey(proj.id);
                      setSelectedCategoryFilter('all');
                    }}
                    className={`min-h-[42px] px-2 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {proj.shortName}
                  </button>
                );
              })}
            </div>
          </header>

          {/* ================= MAIN SCROLLABLE CONTENT AREA ================= */}
          <main className="flex-1 px-4 pt-4 space-y-4">
            {/* TAB 1: GRAPHICAL OVERVIEW */}
            {activeTab === 'overview' && (
              <section className="space-y-4">
                {analytics.urgentMilestones.length > 0 && (
                  <button
                    onClick={() => setActiveTab('vendors')}
                    className="w-full text-left p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
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
                    <ArrowUpRight className="w-4 h-4 text-rose-500 shrink-0" />
                  </button>
                )}

                {/* Actual Spend Donut & KPI Summary Card */}
                <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {currentProject.name} • 100% Actuals
                      </span>
                      <h2 className="text-2xl font-black tracking-tight mt-0.5">
                        {formatINR(analytics.totalSpent)}
                      </h2>
                    </div>
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="h-9 px-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                  </div>

                  {/* Donut Ring + Status Pills */}
                  <div className="grid grid-cols-2 items-center gap-2">
                    <div className="h-36 relative flex items-center justify-center">
                      <NativeDonutChart data={analytics.categoryDonutData} size={136} strokeWidth={18} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400">Bills</span>
                        <span className="text-sm font-black">{analytics.billCount}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 block">
                          Settled / Paid
                        </span>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {formatINR(analytics.paidAmount, true)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 block">
                          Advance Given
                        </span>
                        <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                          {formatINR(analytics.advanceAmount, true)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                        <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400 block">
                          Pending Dues
                        </span>
                        <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                          {formatINR(analytics.totalVendorDues, true)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Material vs. Labour Split Ratio Bar */}
                {activeProjectKey !== 'general' && (
                  <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Material vs. Labour Split
                      </h3>
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        {analytics.materialPct}% Mat • {analytics.labourPct}% Lab
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${analytics.materialPct}%` }}
                      />
                      <div
                        className="h-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${analytics.labourPct}%` }}
                      />
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${analytics.generalPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-indigo-600 dark:text-indigo-400">
                        Material: {formatINR(analytics.materialSpent, true)}
                      </span>
                      <span className="text-orange-600 dark:text-orange-400">
                        Labour: {formatINR(analytics.labourSpent, true)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Whole-Home Work & Expense Category Cards */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Whole-Home Work Categories
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">Tap to view bills</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {analytics.categoryList.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategoryFilter(cat.id);
                          setActiveTab('expenses');
                        }}
                        className="text-left bg-white dark:bg-slate-800/90 p-3.5 rounded-3xl border border-slate-200/70 dark:border-slate-700/70 shadow-sm hover:border-indigo-400 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-9 h-9 rounded-2xl ${cat.bg} ${cat.text} flex items-center justify-center`}>
                            {renderIcon(cat.icon, 'w-4 h-4')}
                          </div>
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                            {cat.sharePct}%
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-extrabold truncate">{cat.shortLabel}</div>
                          <div className="text-base font-black mt-0.5">{formatINR(cat.spent, true)}</div>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${cat.sharePct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* TAB 2: EXPENSE TIMELINE & BILL LEDGER */}
            {activeTab === 'expenses' && (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-extrabold">
                    Expenses ({filteredExpenses.length})
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="h-9 px-3 rounded-xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search item, vendor, family member..."
                    className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`h-8 px-3 rounded-full text-xs font-extrabold shrink-0 ${
                      selectedCategoryFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    All Categories
                  </button>
                  {activeSpaceCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(cat.id)}
                      className={`h-8 px-3 rounded-full text-xs font-extrabold shrink-0 ${
                        selectedCategoryFilter === cat.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat.shortLabel}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {['all', 'Material', 'Labour', 'General'].map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setCostTypeFilter(ct)}
                      className={`h-7 px-2.5 rounded-xl text-[11px] font-extrabold shrink-0 border ${
                        costTypeFilter === ct
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'
                      }`}
                    >
                      {ct === 'all' ? 'All Types' : ct}
                    </button>
                  ))}
                  {['all', 'Paid', 'Advance', 'Pending'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`h-7 px-2.5 rounded-xl text-[11px] font-extrabold shrink-0 border ${
                        statusFilter === st
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'
                      }`}
                    >
                      {st === 'all' ? 'Any Status' : st}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5">
                  {filteredExpenses.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center text-xs font-bold text-slate-400">
                      No matching expenses found. Tap + to add a bill.
                    </div>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const catObj = findCategoryById(activeProjectKey, exp.category);
                      const stObj =
                        PAYMENT_STATUSES.find((s) => s.id === exp.status) || PAYMENT_STATUSES[0];
                      return (
                        <div
                          key={exp.id}
                          className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`w-10 h-10 rounded-2xl ${catObj?.bg} ${catObj?.text} flex items-center justify-center shrink-0`}>
                                {renderIcon(catObj?.icon || Receipt, 'w-5 h-5')}
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
                                By {exp.paidBy || 'You'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {exp.receipt && (
                                <button
                                  onClick={() => setReceiptPreviewUrl(exp.receipt || null)}
                                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600"
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
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600"
                                title="Share on WhatsApp"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openAddExpenseDrawer(exp)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                    <h2 className="text-lg font-extrabold">Contractors & Vendors</h2>
                    <p className="text-xs text-slate-400">
                      Pending Dues: <strong className="text-rose-500">{formatINR(analytics.totalVendorDues)}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setIsVendorModalOpen(true)}
                    className="h-10 px-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Vendor</span>
                  </button>
                </div>

                {analytics.vendorStats.map((v) => (
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
                        className="h-8 px-2.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
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
                                className="h-8 px-3 rounded-xl bg-indigo-600 text-white text-[11px] font-extrabold"
                              >
                                Pay Now
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* TAB 4: VISUAL ANALYTICS CHARTS */}
            {activeTab === 'analytics' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold">Visual Analytics</h2>
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="h-9 px-3 rounded-xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF Report</span>
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Actual Spend by Category (₹ in Thousands)
                  </h3>
                  <NativeBarChart data={analytics.barChartData} />
                </div>

                <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Cumulative Spend Curve (₹ in Thousands)
                  </h3>
                  <NativeAreaChart data={analytics.trendData} />
                </div>

                <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Payment Mode Split (UPI, Bank, Cash & Card)
                  </h3>
                  <div className="grid grid-cols-2 items-center gap-2">
                    <div className="h-40 flex items-center justify-center">
                      <NativeDonutChart data={analytics.modeChartData} size={132} strokeWidth={18} />
                    </div>
                    <div className="space-y-2">
                      {analytics.modeChartData.map((m) => (
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
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Family & Co-Owner Spend Split
                  </h3>
                  {analytics.memberChartData.map((m) => {
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
                  })}
                </div>
              </section>
            )}

            {/* TAB 5: SMART CARPENTRY MAJURI (WEEKLY ADVANCE KHATA + ROOMS) */}
            {activeTab === 'majuri' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      Running Khata • Measurements vs. Hafta
                    </span>
                    <h2 className="text-lg font-extrabold">Carpenter Majuri</h2>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handlePrintGraphicalPDF}
                      title="Export Graphical Majuri & Khata PDF"
                      className="h-10 px-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        const roomLines = majuriSummary.rooms
                          .map((r) => `• ${r.label}: ${r.sqft} sq.ft = ${formatINR(r.amount)}`)
                          .join('\n');
                        const balanceLine =
                          majuriSummary.netBalance >= 0
                            ? `Net Payable to Carpenter: *${formatINR(majuriSummary.netBalance)}*`
                            : `Extra Advance with Carpenter: *${formatINR(Math.abs(majuriSummary.netBalance))}*`;
                        handleShareWhatsApp(
                          `*HomeLedger Carpenter Majuri Khata*\nTotal Measured Work: ${majuriSummary.totalSqft} sq.ft = *${formatINR(majuriSummary.totalWorkBill)}*\nTotal Weekly Advances Paid: *${formatINR(majuriSummary.totalWeeklyAdvancePaid)}*\n${balanceLine}\n\n*Room-Wise Measurement:*\n${roomLines}`
                        );
                      }}
                      className="h-10 px-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1 shadow-sm"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Running Khata Summary Card */}
                <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-3xl p-4 shadow-lg shadow-orange-600/20 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-100">
                        Total Measured Work ({majuriSummary.totalSqft} sq.ft)
                      </span>
                      <div className="text-2xl font-black mt-0.5">
                        {formatINR(majuriSummary.totalWorkBill)}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-extrabold">
                      {majuriSummary.settledPct}% Settled
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
                        Weekly Advances Paid
                      </span>
                      <span className="text-sm font-black">
                        {formatINR(majuriSummary.totalWeeklyAdvancePaid)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/15">
                      <span className="text-[10px] font-bold uppercase text-orange-100 block">
                        {majuriSummary.netBalance >= 0 ? 'Net Balance Payable' : 'Extra Advance Credit'}
                      </span>
                      <span className="text-sm font-black">
                        {formatINR(Math.abs(majuriSummary.netBalance))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Room-Wise Majuri Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {majuriSummary.rooms.map((room) => {
                    const isSelected = selectedMajuriRoomFilter === room.id;
                    return (
                      <button
                        key={room.id}
                        onClick={() =>
                          setSelectedMajuriRoomFilter(isSelected ? 'all' : room.id)
                        }
                        className={`text-left p-3 rounded-3xl border transition-all space-y-2 ${
                          isSelected
                            ? 'bg-orange-500/10 border-orange-500'
                            : 'bg-white dark:bg-slate-800/90 border-slate-200/70 dark:border-slate-700/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-8 h-8 rounded-xl ${room.bg} ${room.text} flex items-center justify-center`}>
                            {renderIcon(room.icon, 'w-4 h-4')}
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400">
                            {room.sqft} ft²
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-extrabold truncate">{room.shortLabel}</div>
                          <div className="text-sm font-black">{formatINR(room.amount, true)}</div>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${room.sharePct}%`, backgroundColor: room.color }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Smart Height × Width × Rate Calculator Form */}
                <form
                  onSubmit={handleSaveMajuriEntry}
                  className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      + Add Room Measurement (H × W × Rate)
                    </h3>
                    <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 text-[11px] font-extrabold">
                      {(['ft', 'in'] as MeasurementUnit[]).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setMjUnit(u)}
                          className={`px-2.5 py-1 rounded-lg ${
                            mjUnit === u
                              ? 'bg-orange-600 text-white'
                              : 'text-slate-500'
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
                      placeholder="Work item (e.g. Wardrobe)"
                      className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      step="any"
                      value={mjHeight}
                      onChange={(e) => setMjHeight(e.target.value)}
                      placeholder={`Height (${mjUnit})`}
                      className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                    />
                    <input
                      type="number"
                      step="any"
                      value={mjWidth}
                      onChange={(e) => setMjWidth(e.target.value)}
                      placeholder={`Width (${mjUnit})`}
                      className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                    />
                    <input
                      type="number"
                      step="any"
                      value={mjRate}
                      onChange={(e) => setMjRate(e.target.value)}
                      placeholder="Rate ₹/ft²"
                      className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 block">
                        Calculated Area & Bill
                      </span>
                      <span className="text-sm font-black">
                        {liveMajuriCalc.sqft} sq.ft × ₹{mjRate || 0} = {formatINR(liveMajuriCalc.amount)}
                      </span>
                    </div>
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold"
                    >
                      Save Item
                    </button>
                  </div>
                </form>

                {/* Weekly Carpenter Advance (Hafta) Form */}
                <form
                  onSubmit={handleSaveCarpenterAdvance}
                  className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      + Log Weekly Carpenter Advance (Hafta)
                    </h3>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advSyncToBills}
                        onChange={(e) => setAdvSyncToBills(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span>Sync to Bills</span>
                    </label>
                  </div>

                  <div className="flex gap-1.5">
                    {[5000, 10000, 20000, 30000].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() =>
                          setAdvAmount(String((Number(advAmount) || 0) + chip))
                        }
                        className="flex-1 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold"
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
                      placeholder="Advance Amount (₹)"
                      className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                    />
                    <input
                      type="text"
                      value={advWeekLabel}
                      onChange={(e) => setAdvWeekLabel(e.target.value)}
                      placeholder={`Week ${carpenterAdvances.length + 1} Advance`}
                      className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={advDate}
                      onChange={(e) => setAdvDate(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={advNotes}
                      onChange={(e) => setAdvNotes(e.target.value)}
                      placeholder="Note (e.g. Saturday Hafta)"
                      className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
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
                    <select
                      value={advPaidBy}
                      onChange={(e) => setAdvPaidBy(e.target.value)}
                      className="h-10 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                    >
                      {FAMILY_MEMBERS.map((m) => (
                        <option key={m.id} value={m.id}>
                          By {m.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
                    >
                      Pay Hafta
                    </button>
                  </div>
                </form>

                {/* Measured Room Items List */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Measured Work Items ({majuriEntries.length})
                  </h3>
                  {majuriEntries
                    .filter((m) =>
                      selectedMajuriRoomFilter === 'all'
                        ? true
                        : m.roomId === selectedMajuriRoomFilter
                    )
                    .map((m) => {
                      const room = MAJURI_ROOMS.find((r) => r.id === m.roomId);
                      return (
                        <div
                          key={m.id}
                          className="bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-orange-600">
                              {room?.label}
                            </span>
                            <div className="text-xs font-extrabold">{m.item}</div>
                            <div className="text-[11px] text-slate-400">
                              {m.height}{m.unit} × {m.width}{m.unit} = {m.sqft} ft² @ ₹{m.rate}/ft²
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black">{formatINR(m.amount)}</span>
                            <button
                              onClick={() => handleDeleteMajuriEntry(m.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Weekly Advances History List */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Weekly Advances Paid ({carpenterAdvances.length})
                  </h3>
                  {carpenterAdvances.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-extrabold">{a.weekLabel}</div>
                        <div className="text-[11px] text-slate-400">
                          {a.date} • {a.mode} • By {a.paidBy}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-emerald-600">
                          {formatINR(a.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteCarpenterAdvance(a.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* ================= FLOATING QUICK ADD BUTTON (+) ================= */}
          <button
            onClick={() => openAddExpenseDrawer()}
            aria-label="Add Expense"
            className="fixed bottom-20 right-4 sm:right-[calc(50%-208px)] z-40 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/35 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-7 h-7" />
          </button>

          {/* ================= BOTTOM NAVIGATION BAR (5 TABS) ================= */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-2 grid grid-cols-5 gap-1">
            {(
              [
                { id: 'overview', label: 'Overview', icon: LayoutGrid },
                { id: 'expenses', label: 'Expenses', icon: Receipt },
                { id: 'majuri', label: 'Majuri', icon: Ruler },
                { id: 'vendors', label: 'Vendors', icon: HardHat },
                { id: 'analytics', label: 'Charts', icon: BarChart3 }
              ] as { id: ActiveTab; label: string; icon: React.ComponentType<IconProps> }[]
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-colors ${
                    active
                      ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {renderIcon(tab.icon, 'w-5 h-5')}
                  <span className="text-[10px] font-extrabold mt-0.5">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ================= 3-TAP QUICK EXPENSE DRAWER ================= */}
          {isAddDrawerOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
              <form
                onSubmit={handleSaveExpense}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">
                    {editingExpenseId ? 'Edit Expense' : 'Quick Add Expense'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddDrawerOpen(false)}
                    className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <IndianRupee className="w-5 h-5 text-indigo-600 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0"
                      className="w-full h-14 pl-11 pr-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl font-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                <div className="grid grid-cols-3 gap-2">
                  {activeSpaceCategories.map((cat) => {
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
                        {renderIcon(cat.icon, 'w-4 h-4')}
                        <span className="text-[11px] font-extrabold truncate w-full">
                          {cat.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

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

                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Item description (e.g. Plywood, Hardware)"
                  className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    placeholder="Vendor / Shop name"
                    className="h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                  <select
                    value={formPaidBy}
                    onChange={(e) => setFormPaidBy(e.target.value)}
                    className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {FAMILY_MEMBERS.map((m) => (
                      <option key={m.id} value={m.id}>
                        Paid by {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value)}
                    className="h-11 px-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {PAYMENT_MODES.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PaymentStatus)}
                    className="h-11 px-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {PAYMENT_STATUSES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="h-11 px-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                <label className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-500 cursor-pointer">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>{formReceipt ? 'Bill Photo Attached ✓' : 'Attach Bill / Receipt Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full h-13 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-600/25"
                >
                  {editingExpenseId ? 'Update Expense' : 'Save Expense'}
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
                  <h3 className="text-lg font-black">Add Contractor / Vendor</h3>
                  <button
                    type="button"
                    onClick={() => setIsVendorModalOpen(false)}
                    className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="Vendor / Contractor Name"
                  className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
                <input
                  type="text"
                  value={newVendorTrade}
                  onChange={(e) => setNewVendorTrade(e.target.value)}
                  placeholder="Work Scope (e.g. Modular Kitchen)"
                  className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={newVendorQuoted}
                    onChange={(e) => setNewVendorQuoted(e.target.value)}
                    placeholder="Agreed Quote (₹)"
                    className="h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={newVendorPhone}
                    onChange={(e) => setNewVendorPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-12 rounded-2xl bg-indigo-600 text-white font-black text-xs"
                >
                  Save Vendor & Generate Milestones
                </button>
              </form>
            </div>
          )}

          {/* ================= WORKSPACE CODE MODAL ================= */}
          {isShareModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">Owner Vault Workspace</h3>
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-1">
                  <span className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                    Active Workspace Code
                  </span>
                  <div className="text-2xl font-black tracking-widest">{sharedRoomCode}</div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="Switch workspace code..."
                    className="flex-1 h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold uppercase"
                  />
                  <button
                    onClick={() => {
                      if (!joinCodeInput.trim()) return;
                      setSharedRoomCode(joinCodeInput.trim().toUpperCase());
                      setJoinCodeInput('');
                      setIsShareModalOpen(false);
                      showToast('Switched workspace!');
                    }}
                    className="h-11 px-4 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold"
                  >
                    Open
                  </button>
                </div>

                <button
                  onClick={() =>
                    handleShareWhatsApp(
                      `*HomeLedger* Interior & Majuri Ledger Summary\nWorkspace: *${sharedRoomCode}*\nTotal Spent: *${formatINR(analytics.totalSpent)}*`
                    )
                  }
                  className="w-full h-12 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Share Summary via WhatsApp</span>
                </button>
              </div>
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
                    <X className="w-4 h-4" />
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
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Executive Statement & Spreadsheet
                    </span>
                    <h3 className="text-lg font-black">Export Graphical Report</h3>
                  </div>
                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div
                  id="homeledger-pdf-sheet"
                  className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-4 space-y-3.5"
                >
                  <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                        HomeLedger Graphical PDF Preview
                      </div>
                      <div className="text-base font-black">{currentProject.name}</div>
                    </div>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-white/20">
                      {analytics.billCount} Bills
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-indigo-500 block">Actual Spent</span>
                      <span className="text-xs font-black">{formatINR(analytics.totalSpent, true)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-emerald-500 block">Paid / Adv</span>
                      <span className="text-xs font-black">
                        {formatINR(analytics.paidAmount + analytics.advanceAmount, true)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-rose-500 block">Dues Left</span>
                      <span className="text-xs font-black">{formatINR(analytics.totalVendorDues, true)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Included Graphical Charts & Tables
                    </div>
                    {analytics.categoryList.slice(0, 4).map((cat) => (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>{cat.shortLabel}</span>
                          <span>{formatINR(cat.spent, true)} ({cat.sharePct}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${cat.sharePct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex flex-wrap gap-1.5">
                      <span>✓ Material vs. Labour bars</span>
                      <span>•</span>
                      <span>✓ Family Member split</span>
                      <span>•</span>
                      <span>✓ Majuri Khata & {majuriEntries.length} room measurements</span>
                      <span>•</span>
                      <span>✓ {carpenterAdvances.length} Weekly advances</span>
                      <span>•</span>
                      <span>✓ {analytics.vendorStats.length} Vendor ledgers</span>
                      <span>•</span>
                      <span>✓ {(currentProject.expenses || []).length} Bills</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrintGraphicalPDF}
                    className="h-13 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Save Graphical PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Download Excel CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}