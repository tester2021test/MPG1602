import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// --- Authorized Owner Email (Strict Single-User Access Control) ---
const ALLOWED_EMAIL = 'vivekdn2504@gmail.com';
const WORKSPACE_CODE = 'HOME-2026';
const LOCAL_BACKUP_KEY = 'homeledger_vault_backup_v1';

const appId =
  typeof (window as unknown as { __app_id?: string }).__app_id !== 'undefined'
    ? (window as unknown as { __app_id: string }).__app_id
    : 'home-renovation-manager';

interface FirebaseConfigType {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const getFirebaseConfig = (): FirebaseConfigType | null => {
  try {
    const win = window as unknown as { __firebase_config?: string };
    if (typeof win.__firebase_config !== 'undefined' && win.__firebase_config) {
      return JSON.parse(win.__firebase_config) as FirebaseConfigType;
    }
  } catch (err) {
    console.warn('Firebase window config check skipped:', err);
  }

  try {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (env?.VITE_FIREBASE_API_KEY) {
      return {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID
      };
    }
  } catch (err) {
    console.warn('Firebase env check skipped:', err);
  }

  return null;
};

// --- Detect In-App Embedded WebViews (WhatsApp, Instagram, Facebook) where Google OAuth is blocked ---
const detectInAppBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|MicroMessenger|BytedanceWebview|musical_ly|KAKAOTALK|Barcelona|; wv\)/i.test(
    ua
  );
};

// --- Safe Local YYYY-MM-DD Date Helper (Avoids UTC Timezone Off-By-One Bug in IST) ---
const getLocalTodayISO = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// --- Self-Contained Crisp Inline SVG Icons ---
interface IconProps {
  className?: string;
}

const HomeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 9.5V19a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </svg>
);

const SunIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const CloudIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);

const CloudOffIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m2 2 20 20" />
    <path d="M17.5 19H9a7 7 0 0 1-5.66-11.15" />
    <path d="M10.6 5A7 7 0 0 1 18 12.6" />
  </svg>
);

const RefreshIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

const LogInIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </svg>
);

const LogOutIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const CheckCircleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ArrowUpRightIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);

const PlusIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const SearchIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const TrashIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const EditIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20h9" />
    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.837a.5.5 0 0 1-.62-.62l.837-2.872a2 2 0 0 1 .506-.854z" />
  </svg>
);

const CopyIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const ImageIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const ReceiptIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
  </svg>
);

const LayoutGridIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

const RulerIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
    <path d="m14.5 12.5 2-2" />
    <path d="m11.5 9.5 2-2" />
    <path d="m8.5 6.5 2-2" />
    <path d="m17.5 15.5 2-2" />
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

const PrinterIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M6 9V3h12v6" />
    <rect width="12" height="8" x="6" y="14" />
  </svg>
);

const SpreadsheetIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M8 13h8" />
    <path d="M8 17h8" />
    <path d="M12 9v11" />
  </svg>
);

const XIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const CameraIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const SofaIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
    <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
    <path d="M4 18v2" />
    <path d="M20 18v2" />
  </svg>
);

const KitchenIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
    <line x1="6" x2="18" y1="17" y2="17" />
  </svg>
);

const BookOpenIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 7v14" />
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
  </svg>
);

const BedIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 4v16" />
    <path d="M2 8h18a2 2 0 0 1 2 2v10" />
    <path d="M2 17h20" />
    <path d="M6 8v9" />
  </svg>
);

const DoorIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 4h3a2 2 0 0 1 2 2v14" />
    <path d="M2 20h3" />
    <path d="M13 12h.01" />
    <path d="M5 20V4a2 2 0 0 1 2-2h6v18" />
  </svg>
);

const LayersIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <path d="m2 12 8.58 3.91a2 2 0 0 0 1.66 0L21 12" />
    <path d="m2 17 8.58 3.91a2 2 0 0 0 1.66 0L21 17" />
  </svg>
);

const SparklesIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

const TvIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
    <polyline points="17 2 12 7 7 2" />
  </svg>
);

const DropletIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const BrickWallIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M12 9v6" />
    <path d="M16 15v6" />
    <path d="M16 3v6" />
    <path d="M3 15h18" />
    <path d="M3 9h18" />
    <path d="M8 15v6" />
    <path d="M8 3v6" />
  </svg>
);

const PaintRollerIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="16" height="6" x="2" y="2" rx="2" />
    <path d="M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect width="4" height="6" x="8" y="16" rx="1" />
  </svg>
);

const ZapIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </svg>
);

const ShieldCheckIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const GrillGateIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M8 3v18" />
    <path d="M12 3v18" />
    <path d="M16 3v18" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
  </svg>
);

// --- Native Responsive SVG Donut Chart ---
interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

const NativeDonutChart: React.FC<{
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
}> = ({ data, size = 148, strokeWidth = 20 }) => {
  const total = data.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (!total || data.length === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  let accumulatedLength = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible -rotate-90">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        className="text-slate-100 dark:text-slate-800"
        strokeWidth={strokeWidth}
      />
      {data.map((slice) => {
        const val = Math.max(0, Number(slice.value) || 0);
        const segLen = (val / total) * circumference;
        const dashOffset = -accumulatedLength;
        accumulatedLength += segLen;
        return (
          <circle
            key={slice.name}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${Math.max(0, segLen - 3)} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        );
      })}
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

// --- Trade & Shopping Sections Configuration ---
interface CategoryPreset {
  label: string;
  costType: 'Material' | 'Labour' | 'Turnkey' | 'Lumpsum';
}

interface CategoryItem {
  id: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  defaultCostType: 'Material' | 'Labour' | 'Turnkey' | 'Lumpsum';
  presets: CategoryPreset[];
  icon: React.FC<IconProps>;
  color: string;
  bg: string;
  text: string;
}

const INTERIOR_CATEGORIES: CategoryItem[] = [
  {
    id: 'carpentry',
    label: 'Carpentry & Woodwork',
    shortLabel: 'Carpentry',
    subtitle: 'Plywood, laminates & carpenter majuri',
    defaultCostType: 'Material',
    presets: [
      { label: 'Plywood & Laminates', costType: 'Material' },
      { label: 'Hardware & Fittings', costType: 'Material' },
      { label: 'Main Carpenter Majuri', costType: 'Labour' }
    ],
    icon: LayersIcon,
    color: '#d97706',
    bg: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400'
  },
  {
    id: 'false_ceiling',
    label: 'False Ceiling (With Material)',
    shortLabel: 'False Ceiling',
    subtitle: 'Complete turnkey work with material',
    defaultCostType: 'Turnkey',
    presets: [
      { label: 'Complete False Ceiling (Work + Material)', costType: 'Turnkey' },
      { label: 'POP / Gypsum Turnkey Installment', costType: 'Turnkey' },
      { label: 'Cove & Profile Channel Work', costType: 'Turnkey' }
    ],
    icon: SparklesIcon,
    color: '#8b5cf6',
    bg: 'bg-violet-500/15',
    text: 'text-violet-600 dark:text-violet-400'
  },
  {
    id: 'grill_safety',
    label: 'Grill & Safety Work',
    shortLabel: 'Grill & Safety',
    subtitle: 'Window grills, balcony safety & MS/SS gate',
    defaultCostType: 'Turnkey',
    presets: [
      { label: 'Window Safety Grills (With Material)', costType: 'Turnkey' },
      { label: 'Balcony Invisible Grill / Safety Net', costType: 'Turnkey' },
      { label: 'MS / SS Main Safety Door', costType: 'Turnkey' },
      { label: 'Grill Fabrication & Fitting Majuri', costType: 'Labour' }
    ],
    icon: GrillGateIcon,
    color: '#475569',
    bg: 'bg-slate-500/15',
    text: 'text-slate-700 dark:text-slate-300'
  },
  {
    id: 'plumbing',
    label: 'Plumbing & Water Tank',
    shortLabel: 'Plumbing',
    subtitle: '1-time majuri, water tank & fittings',
    defaultCostType: 'Material',
    presets: [
      { label: 'Plumbing One-Time Majuri', costType: 'Labour' },
      { label: 'Water Tank Purchase', costType: 'Material' },
      { label: 'Tank Installation & Pipe Accessories', costType: 'Material' }
    ],
    icon: DropletIcon,
    color: '#0284c7',
    bg: 'bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400'
  },
  {
    id: 'civil',
    label: 'Civil Work & Material',
    shortLabel: 'Civil Work',
    subtitle: '1-time majuri & 1-time civil material',
    defaultCostType: 'Material',
    presets: [
      { label: 'Civil One-Time Majuri', costType: 'Labour' },
      { label: 'One-Time Civil Material (Cement/Sand/Tiles)', costType: 'Material' },
      { label: 'Granite / Kitchen Platform Material', costType: 'Material' }
    ],
    icon: BrickWallIcon,
    color: '#e11d48',
    bg: 'bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400'
  },
  {
    id: 'painting',
    label: 'Painting Service',
    shortLabel: 'Painting',
    subtitle: 'Lumpsum painting entry',
    defaultCostType: 'Lumpsum',
    presets: [
      { label: 'Painting Service Lumpsum', costType: 'Lumpsum' },
      { label: 'Putty, Primer & Paint Lumpsum', costType: 'Lumpsum' }
    ],
    icon: PaintRollerIcon,
    color: '#10b981',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    id: 'electrician',
    label: 'Electrician & Lights',
    shortLabel: 'Electrician',
    subtitle: 'Majuri, wires, plates/buttons & lights',
    defaultCostType: 'Material',
    presets: [
      { label: 'Electrician Majuri', costType: 'Labour' },
      { label: 'Wire Purchase', costType: 'Material' },
      { label: 'Plates & Button Purchase', costType: 'Material' },
      { label: 'Lights Purchase', costType: 'Material' }
    ],
    icon: ZapIcon,
    color: '#f59e0b',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-600 dark:text-yellow-400'
  },
  {
    id: 'appliances',
    label: 'Appliances Shopping',
    shortLabel: 'Appliances',
    subtitle: 'Fan, stove, chimney (Full / EMI)',
    defaultCostType: 'Material',
    presets: [
      { label: 'Ceiling / Exhaust Fan', costType: 'Material' },
      { label: 'Gas Stove / Hob', costType: 'Material' },
      { label: 'Kitchen Chimney', costType: 'Material' }
    ],
    icon: TvIcon,
    color: '#06b6d4',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400'
  }
];

const findCategoryById = (catId: string): CategoryItem => {
  return INTERIOR_CATEGORIES.find((c) => c.id === catId) || INTERIOR_CATEGORIES[0];
};

const COST_TYPES = [
  { id: 'Material', label: 'Material' },
  { id: 'Labour', label: 'Majuri / Labour' },
  { id: 'Turnkey', label: 'With Material' },
  { id: 'Lumpsum', label: 'Lumpsum' }
];

const PAYMENT_PLANS = [
  { id: 'Full Payment', label: 'Full Payment' },
  { id: 'EMI', label: 'On EMI' }
];

const WARRANTY_OPTIONS = ['No Warranty', '1 Year', '2 Years', '5 Years', '10 Years'];

const PURCHASE_SOURCE_SUGGESTIONS = [
  'Amazon',
  'Flipkart',
  'Croma',
  'Reliance Digital',
  'Vijay Sales',
  'Local Store'
];

const FAMILY_MEMBERS = [
  { id: 'You', label: 'You' },
  { id: 'Spouse', label: 'Spouse' },
  { id: 'Parents', label: 'Parents' },
  { id: 'Supervisor', label: 'Site Sup.' }
];

const PAYMENT_MODES = [
  { id: 'UPI', label: 'UPI', color: '#6366f1' },
  { id: 'Bank Transfer', label: 'Bank/NEFT', color: '#0ea5e9' },
  { id: 'Cash', label: 'Cash', color: '#10b981' },
  { id: 'Credit Card', label: 'Card', color: '#f59e0b' }
];

const PAYMENT_STATUSES = [
  { id: 'Paid', label: 'Paid', badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  { id: 'Advance', label: 'Advance', badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  { id: 'Pending', label: 'Pending Due', badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' }
];

const MAJURI_ROOMS = [
  { id: 'living', label: 'Living Room', shortLabel: 'Living', icon: SofaIcon, color: '#6366f1', bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'kitchen', label: 'Kitchen', shortLabel: 'Kitchen', icon: KitchenIcon, color: '#f97316', bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
  { id: 'study', label: 'Study Room', shortLabel: 'Study', icon: BookOpenIcon, color: '#06b6d4', bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400' },
  { id: 'master_bedroom', label: 'Master Bedroom', shortLabel: 'Master Bed', icon: BedIcon, color: '#ec4899', bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400' },
  { id: 'safety_shoe', label: 'Safety Door & Shoe Rack', shortLabel: 'Safety & Shoe', icon: DoorIcon, color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' }
];

const RATE_PRESETS = [300, 200, 150];
const DEFAULT_CARPENTER_VENDOR = 'Main Carpenter';

interface MajuriEntry {
  id: string;
  vendorName?: string;
  roomId: string;
  item: string;
  unit: string;
  qty?: number;
  height: number;
  width: number;
  sqft: number;
  rate: number;
  amount: number;
  date: string;
}

interface CarpenterAdvance {
  id: string;
  vendorName?: string;
  syncedExpenseId?: string | null;
  weekLabel: string;
  amount: number;
  mode: string;
  paidBy: string;
  date: string;
  notes: string;
}

interface MilestoneItem {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface VendorItem {
  id: string;
  name: string;
  trade: string;
  quoted: number;
  phone: string;
  milestones: MilestoneItem[];
}

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  costType?: string;
  paymentPlan?: string;
  emiDetails?: string;
  warrantyPeriod?: string;
  paidBy?: string;
  vendor: string;
  mode: string;
  status: string;
  date: string;
  notes?: string;
  receipt?: string | null;
}

interface ProjectData {
  id: string;
  name: string;
  shortName: string;
  vendors: VendorItem[];
  expenses: ExpenseItem[];
}

interface VaultSnapshot {
  projects: Record<string, ProjectData>;
  majuriEntries: MajuriEntry[];
  carpenterAdvances: CarpenterAdvance[];
  updatedAt: number;
}

const INITIAL_MAJURI_ENTRIES: MajuriEntry[] = [];
const INITIAL_CARPENTER_ADVANCES: CarpenterAdvance[] = [];

const INITIAL_PROJECTS: Record<string, ProjectData> = {
  interior: {
    id: 'interior',
    name: 'Interior Work & Purchases',
    shortName: 'Interiors',
    vendors: [],
    expenses: []
  }
};

// --- Load Cached Vault Backup from localStorage ---
const loadLocalVaultBackup = (): VaultSnapshot | null => {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VaultSnapshot;
    if (parsed && parsed.projects?.interior) {
      return parsed;
    }
  } catch {
    // Ignore parse/storage errors
  }
  return null;
};

// --- Deduplicated Merge Helper (Preserves Local Offline Entries When Cloud Syncs) ---
const mergeById = <T extends { id: string }>(cloudItems: T[] = [], localItems: T[] = []): T[] => {
  const map = new Map<string, T>();
  cloudItems.forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });
  localItems.forEach((item) => {
    if (item?.id && !map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
};

// --- Client-Side Image Compression Helper ---
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
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
  // --- Hydrate Initial State from Local Backup so Refresh Never Loses Data ---
  const initialBackup = useMemo(() => loadLocalVaultBackup(), []);

  // --- Theme, Large Text & Navigation State ---
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('homeledger_theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [largeTextMode, setLargeTextMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('homeledger_large_text') === 'true';
    } catch {
      return false;
    }
  });
  const [showInstallTip, setShowInstallTip] = useState<boolean>(() => {
    try {
      return localStorage.getItem('homeledger_hide_install_tip') !== 'true';
    } catch {
      return true;
    }
  });
  const [activeTab, setActiveTab] = useState<string>('overview');

  // --- Core App Data State ---
  const [projects, setProjects] = useState<Record<string, ProjectData>>(
    initialBackup?.projects || INITIAL_PROJECTS
  );
  const [majuriEntries, setMajuriEntries] = useState<MajuriEntry[]>(
    initialBackup?.majuriEntries || INITIAL_MAJURI_ENTRIES
  );
  const [carpenterAdvances, setCarpenterAdvances] = useState<CarpenterAdvance[]>(
    initialBackup?.carpenterAdvances || INITIAL_CARPENTER_ADVANCES
  );
  const [selectedMajuriRoomFilter, setSelectedMajuriRoomFilter] = useState<string>('all');
  const [selectedMajuriVendorFilter, setSelectedMajuriVendorFilter] = useState<string>('all');
  const [majuriActionMode, setMajuriActionMode] = useState<'measure' | 'advance'>('measure');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [costTypeFilter, setCostTypeFilter] = useState<string>('all');

  // --- Live Refs for Latest State (Eliminates Stale Closure Sync Bugs) ---
  const projectsRef = useRef(projects);
  const majuriRef = useRef(majuriEntries);
  const advancesRef = useRef(carpenterAdvances);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);
  useEffect(() => {
    majuriRef.current = majuriEntries;
  }, [majuriEntries]);
  useEffect(() => {
    advancesRef.current = carpenterAdvances;
  }, [carpenterAdvances]);

  // --- Network & Firebase Auth / Workspace State ---
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isInAppWebView] = useState<boolean>(() => detectInAppBrowser());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fbRuntime, setFbRuntime] = useState<any>(null);
  const [hasFirebaseConfig] = useState<boolean>(() => Boolean(getFirebaseConfig()));
  const [demoBypass, setDemoBypass] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error' | 'demo'>('demo');
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // --- Modals & Drawers State ---
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState<boolean>(false);
  const [showMoreBillFields, setShowMoreBillFields] = useState<boolean>(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Quick Add / Edit Expense Form State ---
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('carpentry');
  const [formCostType, setFormCostType] = useState<string>('Material');
  const [formPaymentPlan, setFormPaymentPlan] = useState<string>('Full Payment');
  const [formEmiDetails, setFormEmiDetails] = useState<string>('');
  const [formWarrantyPeriod, setFormWarrantyPeriod] = useState<string>('No Warranty');
  const [formPaidBy, setFormPaidBy] = useState<string>('You');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formVendor, setFormVendor] = useState<string>('');
  const [formMode, setFormMode] = useState<string>('UPI');
  const [formStatus, setFormStatus] = useState<string>('Paid');
  const [formDate, setFormDate] = useState<string>(() => getLocalTodayISO());
  const [formNotes, setFormNotes] = useState<string>('');
  const [formReceipt, setFormReceipt] = useState<string | null>(null);

  // --- Vendor Modal State ---
  const [isVendorModalOpen, setIsVendorModalOpen] = useState<boolean>(false);
  const [newVendorName, setNewVendorName] = useState<string>('');
  const [newVendorTrade, setNewVendorTrade] = useState<string>('');
  const [newVendorQuoted, setNewVendorQuoted] = useState<string>('');
  const [newVendorPhone, setNewVendorPhone] = useState<string>('');

  // --- Remembered Last Majuri Defaults ---
  const savedMajuriPrefs = useMemo(() => {
    try {
      const raw = localStorage.getItem('homeledger_majuri_prefs');
      return raw ? (JSON.parse(raw) as { vendor?: string; roomId?: string; rate?: string }) : {};
    } catch {
      return {};
    }
  }, []);

  // --- Smart Carpentry Majuri Calculator & Logger State (Defaults to Main Carpenter) ---
  const [mjVendorSelect, setMjVendorSelect] = useState<string>(
    savedMajuriPrefs.vendor || DEFAULT_CARPENTER_VENDOR
  );
  const [mjCustomVendor, setMjCustomVendor] = useState<string>('');
  const [mjRoomId, setMjRoomId] = useState<string>(savedMajuriPrefs.roomId || 'living');
  const [mjItem, setMjItem] = useState<string>('');
  const [mjUnit, setMjUnit] = useState<string>('ft');
  const [mjQty, setMjQty] = useState<number>(1);
  const [mjHeight, setMjHeight] = useState<string>('');
  const [mjWidth, setMjWidth] = useState<string>('');
  const [mjRate, setMjRate] = useState<string>(savedMajuriPrefs.rate || '300');

  // --- Advance Payment (Without Measurement) Form State (Defaults to Main Carpenter) ---
  const [advVendorSelect, setAdvVendorSelect] = useState<string>(
    savedMajuriPrefs.vendor || DEFAULT_CARPENTER_VENDOR
  );
  const [advCustomVendor, setAdvCustomVendor] = useState<string>('');
  const [advWeekLabel, setAdvWeekLabel] = useState<string>('');
  const [advAmount, setAdvAmount] = useState<string>('');
  const [advMode, setAdvMode] = useState<string>('UPI');
  const [advPaidBy, setAdvPaidBy] = useState<string>('You');
  const [advDate, setAdvDate] = useState<string>(() => getLocalTodayISO());
  const [advNotes, setAdvNotes] = useState<string>('');
  const [advSyncToBills, setAdvSyncToBills] = useState<boolean>(true);

  // --- Transactions Search & Filter State ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // --- Helper: Persist Backup Snapshot to localStorage ---
  const persistLocalBackup = useCallback(
    (
      nextProjects: Record<string, ProjectData>,
      nextMajuri: MajuriEntry[],
      nextAdvances: CarpenterAdvance[]
    ) => {
      try {
        const snapshot: VaultSnapshot = {
          projects: nextProjects,
          majuriEntries: nextMajuri,
          carpenterAdvances: nextAdvances,
          updatedAt: Date.now()
        };
        localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(snapshot));
      } catch (err) {
        console.warn('LocalStorage backup quota/error:', err);
      }
    },
    []
  );

  // --- Sync Dark Mode Class & Color-Scheme to Root <html> ---
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

  // --- Sync Large Text (A+) Mode ---
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = largeTextMode ? '112%' : '100%';
    try {
      localStorage.setItem('homeledger_large_text', String(largeTextMode));
    } catch {
      // Ignore storage restrictions
    }
  }, [largeTextMode]);

  // --- Online / Offline Network Listener ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Back online — syncing to cloud...');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      showToast('Offline mode — changes saved locally');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // --- Firebase Authentication & Offline IndexedDB Cache Initialization ---
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fbDb: any;
        try {
          fbDb = firestoreMod.initializeFirestore(fbApp, {
            localCache: firestoreMod.persistentLocalCache({
              tabManager: firestoreMod.persistentMultipleTabManager()
            })
          });
        } catch {
          fbDb = firestoreMod.getFirestore(fbApp);
        }

        setFbRuntime({
          auth: fbAuth,
          db: fbDb,
          GoogleAuthProvider: authMod.GoogleAuthProvider,
          signInWithPopup: authMod.signInWithPopup,
          signInWithRedirect: authMod.signInWithRedirect,
          signOut: authMod.signOut,
          doc: firestoreMod.doc,
          getDoc: firestoreMod.getDoc,
          setDoc: firestoreMod.setDoc,
          onSnapshot: firestoreMod.onSnapshot
        });

        await authMod.getRedirectResult(fbAuth).catch(() => {});

        const win = window as unknown as { __initial_auth_token?: string };
        if (typeof win.__initial_auth_token !== 'undefined' && win.__initial_auth_token) {
          await authMod.signInWithCustomToken(fbAuth, win.__initial_auth_token).catch(() => {});
        }

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

  // --- Helper: Resolve Primary & Legacy Firestore Document Refs ---
  const getWorkspaceRefs = useCallback(() => {
    if (!fbRuntime?.db || !user) return null;
    // Primary standard path: users/{uid}/workspaces/HOME-2026
    const primaryRef = fbRuntime.doc(fbRuntime.db, 'users', user.uid, 'workspaces', WORKSPACE_CODE);
    // Legacy path fallback for auto-migration: artifacts/{appId}/users/{uid}/workspaces/HOME-2026
    const legacyRef = fbRuntime.doc(
      fbRuntime.db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'workspaces',
      WORKSPACE_CODE
    );
    return { primaryRef, legacyRef };
  }, [fbRuntime, user]);

  // --- Save Data to Local Backup + Cloud Firestore (With Error Surface) ---
  const saveProjectsToCloud = useCallback(
    async (
      updatedProjects: Record<string, ProjectData>,
      updatedMajuri: MajuriEntry[] = majuriRef.current,
      updatedAdvances: CarpenterAdvance[] = advancesRef.current,
      showSuccessToast = false
    ) => {
      setProjects(updatedProjects);
      setMajuriEntries(updatedMajuri);
      setCarpenterAdvances(updatedAdvances);
      persistLocalBackup(updatedProjects, updatedMajuri, updatedAdvances);

      const refs = getWorkspaceRefs();
      if (!refs || !fbRuntime?.setDoc) return;

      try {
        setSyncStatus(isOnline ? 'syncing' : 'offline');
        setSyncErrorMsg(null);
        await fbRuntime.setDoc(
          refs.primaryRef,
          {
            projects: updatedProjects,
            majuriEntries: updatedMajuri,
            carpenterAdvances: updatedAdvances,
            inviteCode: WORKSPACE_CODE,
            ownerEmail: ALLOWED_EMAIL,
            updatedAt: Date.now()
          },
          { merge: true }
        );
        setSyncStatus(isOnline ? 'synced' : 'offline');
        setLastSyncedAt(
          new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        );
        if (showSuccessToast) {
          showToast('Cloud sync complete!');
        }
      } catch (err: unknown) {
        const message =
          (err as { message?: string })?.message || 'Firestore write permission or network error';
        console.error('Cloud save error:', err);
        setSyncStatus('error');
        setSyncErrorMsg(message);
        showToast('Saved locally — tap Sync button to retry cloud');
      }
    },
    [fbRuntime, getWorkspaceRefs, isOnline, persistLocalBackup, showToast]
  );

  // --- Initial Cloud Load + Legacy Migration + Real-Time Listener ---
  useEffect(() => {
    const refs = getWorkspaceRefs();
    if (!refs || !fbRuntime?.getDoc || !fbRuntime?.onSnapshot) return;

    let unsubscribeSnap: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        setSyncStatus(isOnline ? 'syncing' : 'offline');
        setSyncErrorMsg(null);

        // 1. Explicitly fetch primary cloud doc first so cache misses never overwrite cloud data
        const primarySnap = await fbRuntime.getDoc(refs.primaryRef);
        if (cancelled) return;

        if (primarySnap.exists()) {
          const data = primarySnap.data();
          const cloudProjects = data?.projects || INITIAL_PROJECTS;
          const cloudMajuri: MajuriEntry[] = Array.isArray(data?.majuriEntries)
            ? data.majuriEntries
            : [];
          const cloudAdvances: CarpenterAdvance[] = Array.isArray(data?.carpenterAdvances)
            ? data.carpenterAdvances
            : [];

          // Merge any offline local entries created while disconnected
          const localSnap = loadLocalVaultBackup();
          const mergedExpenses = mergeById(
            cloudProjects.interior?.expenses || [],
            localSnap?.projects?.interior?.expenses || []
          );
          const mergedVendors = mergeById(
            cloudProjects.interior?.vendors || [],
            localSnap?.projects?.interior?.vendors || []
          );
          const mergedMajuri = mergeById(cloudMajuri, localSnap?.majuriEntries || []);
          const mergedAdvances = mergeById(cloudAdvances, localSnap?.carpenterAdvances || []);

          const mergedProjects: Record<string, ProjectData> = {
            interior: {
              ...INITIAL_PROJECTS.interior,
              ...cloudProjects.interior,
              expenses: mergedExpenses,
              vendors: mergedVendors
            }
          };

          setProjects(mergedProjects);
          setMajuriEntries(mergedMajuri);
          setCarpenterAdvances(mergedAdvances);
          persistLocalBackup(mergedProjects, mergedMajuri, mergedAdvances);

          // Push back up if local had unsynced offline additions
          const hadLocalDiff =
            mergedExpenses.length > (cloudProjects.interior?.expenses || []).length ||
            mergedVendors.length > (cloudProjects.interior?.vendors || []).length ||
            mergedMajuri.length > cloudMajuri.length ||
            mergedAdvances.length > cloudAdvances.length;

          if (hadLocalDiff) {
            await fbRuntime.setDoc(
              refs.primaryRef,
              {
                projects: mergedProjects,
                majuriEntries: mergedMajuri,
                carpenterAdvances: mergedAdvances,
                inviteCode: WORKSPACE_CODE,
                ownerEmail: ALLOWED_EMAIL,
                updatedAt: Date.now()
              },
              { merge: true }
            );
          }

          setSyncStatus(isOnline ? 'synced' : 'offline');
          setLastSyncedAt(
            new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          );
        } else {
          // 2. Check legacy path (`artifacts/{appId}/users/{uid}/workspaces/HOME-2026`) and migrate automatically
          const legacySnap = await fbRuntime.getDoc(refs.legacyRef).catch(() => null);
          if (cancelled) return;

          if (legacySnap && legacySnap.exists()) {
            const legacyData = legacySnap.data();
            const migratedProjects = legacyData?.projects || projectsRef.current;
            const migratedMajuri = Array.isArray(legacyData?.majuriEntries)
              ? legacyData.majuriEntries
              : majuriRef.current;
            const migratedAdvances = Array.isArray(legacyData?.carpenterAdvances)
              ? legacyData.carpenterAdvances
              : advancesRef.current;

            await saveProjectsToCloud(migratedProjects, migratedMajuri, migratedAdvances, false);
          } else {
            // 3. First-time cloud initialization using current local state
            await saveProjectsToCloud(
              projectsRef.current,
              majuriRef.current,
              advancesRef.current,
              false
            );
          }
        }

        // 4. Subscribe to real-time cross-device updates (including pending-writes metadata)
        unsubscribeSnap = fbRuntime.onSnapshot(
          refs.primaryRef,
          { includeMetadataChanges: true },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (snapshot: any) => {
            if (!snapshot.exists()) return;
            const data = snapshot.data();
            if (data?.projects) setProjects(data.projects);
            if (Array.isArray(data?.majuriEntries)) setMajuriEntries(data.majuriEntries);
            if (Array.isArray(data?.carpenterAdvances)) setCarpenterAdvances(data.carpenterAdvances);

            if (data?.projects) {
              persistLocalBackup(
                data.projects,
                Array.isArray(data?.majuriEntries) ? data.majuriEntries : [],
                Array.isArray(data?.carpenterAdvances) ? data.carpenterAdvances : []
              );
            }

            if (snapshot.metadata?.hasPendingWrites) {
              setSyncStatus(isOnline ? 'syncing' : 'offline');
            } else {
              setSyncStatus(isOnline ? 'synced' : 'offline');
              setLastSyncedAt(
                new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              );
            }
          },
          (error: unknown) => {
            const msg = (error as { message?: string })?.message || 'Real-time sync listener error';
            console.error('Firestore snapshot listener error:', error);
            setSyncStatus('error');
            setSyncErrorMsg(msg);
          }
        );
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message || 'Cloud sync initialization failed';
        console.error('Cloud sync init error:', err);
        setSyncStatus('error');
        setSyncErrorMsg(msg);
      }
    })();

    return () => {
      cancelled = true;
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, [fbRuntime, getWorkspaceRefs, isOnline, persistLocalBackup, saveProjectsToCloud]);

  // --- Manual Force Sync Handler (Push Local & Pull Latest Cloud) ---
  const handleManualForceSync = async () => {
    const refs = getWorkspaceRefs();
    if (!refs || !fbRuntime?.getDoc) {
      showToast('Sign in with Google to sync to cloud');
      return;
    }
    try {
      setSyncStatus('syncing');
      setSyncErrorMsg(null);
      const snap = await fbRuntime.getDoc(refs.primaryRef);
      if (snap.exists()) {
        const cloudData = snap.data();
        const mergedExpenses = mergeById(
          cloudData?.projects?.interior?.expenses || [],
          projectsRef.current.interior?.expenses || []
        );
        const mergedVendors = mergeById(
          cloudData?.projects?.interior?.vendors || [],
          projectsRef.current.interior?.vendors || []
        );
        const mergedMajuri = mergeById(cloudData?.majuriEntries || [], majuriRef.current);
        const mergedAdvances = mergeById(cloudData?.carpenterAdvances || [], advancesRef.current);

        const mergedProjects: Record<string, ProjectData> = {
          interior: {
            ...INITIAL_PROJECTS.interior,
            ...projectsRef.current.interior,
            expenses: mergedExpenses,
            vendors: mergedVendors
          }
        };
        await saveProjectsToCloud(mergedProjects, mergedMajuri, mergedAdvances, true);
      } else {
        await saveProjectsToCloud(projectsRef.current, majuriRef.current, advancesRef.current, true);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Sync failed';
      setSyncStatus('error');
      setSyncErrorMsg(msg);
      showToast(`Sync failed: ${msg}`);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!fbRuntime?.auth) {
      setDemoBypass(true);
      showToast('Opened local preview mode');
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
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked' && fbRuntime.signInWithRedirect) {
        const provider = new fbRuntime.GoogleAuthProvider();
        provider.setCustomParameters({ login_hint: ALLOWED_EMAIL });
        await fbRuntime.signInWithRedirect(fbRuntime.auth, provider).catch(() => {});
        return;
      }
      console.warn('Google sign-in failed:', err);
      setAuthError('Sign-in cancelled or blocked. If inside WhatsApp/Instagram, open in Chrome or Safari.');
    }
  };

  const handleSignOut = async () => {
    if (!fbRuntime?.auth) {
      setDemoBypass(false);
      return;
    }
    try {
      await fbRuntime.signOut(fbRuntime.auth);
      setUser(null);
      setDemoBypass(false);
      showToast('Signed out securely');
    } catch (err) {
      console.warn(err);
    }
  };

  // --- Current Active Project Derived Metrics ---
  const currentProject = projects.interior || INITIAL_PROJECTS.interior;

  // --- Available Vendors List for Majuri & Bill Quick-Chips ---
  const majuriVendorOptions = useMemo(() => {
    const names = new Set<string>([DEFAULT_CARPENTER_VENDOR]);
    (projects.interior?.vendors || []).forEach((v) => {
      if (v.name?.trim()) names.add(v.name.trim());
    });
    majuriEntries.forEach((m) => {
      if (m.vendorName?.trim()) names.add(m.vendorName.trim());
    });
    carpenterAdvances.forEach((a) => {
      if (a.vendorName?.trim()) names.add(a.vendorName.trim());
    });
    return Array.from(names);
  }, [projects, majuriEntries, carpenterAdvances]);

  const savedBillVendorSuggestions = useMemo(() => {
    const names = new Set<string>([DEFAULT_CARPENTER_VENDOR]);
    (currentProject.vendors || []).forEach((v) => {
      if (v.name?.trim()) names.add(v.name.trim());
    });
    (currentProject.expenses || []).forEach((e) => {
      if (e.vendor?.trim() && e.vendor !== 'Direct Purchase') names.add(e.vendor.trim());
    });
    return Array.from(names).slice(0, 8);
  }, [currentProject]);

  // --- Duplicate Bill Guard Check ---
  const duplicateBillWarning = useMemo(() => {
    const numAmt = Number(formAmount);
    if (!numAmt || numAmt <= 0 || editingExpenseId) return null;
    const targetVendor = (formVendor.trim() || 'Direct Purchase').toLowerCase();
    const match = (currentProject.expenses || []).find(
      (exp) =>
        Number(exp.amount) === numAmt &&
        exp.date === formDate &&
        (exp.vendor || 'Direct Purchase').toLowerCase() === targetVendor
    );
    return match || null;
  }, [formAmount, formDate, formVendor, editingExpenseId, currentProject.expenses]);

  const analytics = useMemo(() => {
    const expenses = currentProject.expenses || [];

    let totalSpent = 0;
    let paidAmount = 0;
    let advanceAmount = 0;
    let pendingAmount = 0;

    let materialSpent = 0;
    let labourSpent = 0;
    let turnkeyOrLumpsumSpent = 0;

    const byCategory: Record<string, CategoryItem & { spent: number; count: number }> = {};
    INTERIOR_CATEGORIES.forEach((cat) => {
      byCategory[cat.id] = {
        ...cat,
        spent: 0,
        count: 0
      };
    });

    expenses.forEach((exp) => {
      const amt = Number(exp.amount) || 0;
      totalSpent += amt;

      if (exp.status === 'Paid') paidAmount += amt;
      else if (exp.status === 'Advance') advanceAmount += amt;
      else pendingAmount += amt;

      const cType = exp.costType || 'Material';
      if (cType === 'Labour') labourSpent += amt;
      else if (cType === 'Turnkey' || cType === 'Lumpsum') turnkeyOrLumpsumSpent += amt;
      else materialSpent += amt;

      if (byCategory[exp.category]) {
        byCategory[exp.category].spent += amt;
        byCategory[exp.category].count += 1;
      }
    });

    const splitTotal = materialSpent + labourSpent + turnkeyOrLumpsumSpent || 1;
    const materialPct = Math.round((materialSpent / splitTotal) * 100);
    const labourPct = Math.round((labourSpent / splitTotal) * 100);
    const turnkeyPct = Math.max(0, 100 - materialPct - labourPct);

    const categoryList = Object.values(byCategory).map((c) => ({
      ...c,
      sharePct: totalSpent > 0 ? Math.round((c.spent / totalSpent) * 100) : 0
    }));

    const categoryDonutData = categoryList
      .filter((c) => c.spent > 0)
      .map((c) => ({
        name: c.shortLabel,
        value: c.spent,
        color: c.color
      }));

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

      return {
        ...v,
        milestones: v.milestones || [],
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
      turnkeyOrLumpsumSpent,
      materialPct,
      labourPct,
      turnkeyPct,
      categoryList,
      categoryDonutData,
      vendorStats
    };
  }, [currentProject]);

  // --- Filtered Transactions List ---
  const filteredExpenses = useMemo(() => {
    return (currentProject.expenses || [])
      .filter((exp) => {
        if (selectedCategoryFilter !== 'all' && exp.category !== selectedCategoryFilter) {
          return false;
        }
        if (costTypeFilter !== 'all') {
          const cType = exp.costType || 'Material';
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
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [currentProject.expenses, selectedCategoryFilter, costTypeFilter, statusFilter, searchQuery]);

  const activeCategoryObj = useMemo(
    () => findCategoryById(formCategory),
    [formCategory]
  );

  const selectedFilterCategoryObj = useMemo(
    () => (selectedCategoryFilter !== 'all' ? findCategoryById(selectedCategoryFilter) : null),
    [selectedCategoryFilter]
  );

  // --- Handlers for Adding / Editing / Duplicating / Deleting Expenses ---
  const openAddExpenseDrawer = (prefill: Partial<ExpenseItem> = {}, isDuplicate = false) => {
    const targetCatId =
      prefill.category || (selectedCategoryFilter !== 'all' ? selectedCategoryFilter : 'carpentry');
    const targetCat = findCategoryById(targetCatId);

    setEditingExpenseId(isDuplicate ? null : prefill.id || null);
    setFormAmount(prefill.amount ? String(prefill.amount) : '');
    setFormCategory(targetCatId);
    setFormCostType(prefill.costType || targetCat.defaultCostType);
    setFormPaymentPlan(prefill.paymentPlan || 'Full Payment');
    setFormEmiDetails(prefill.emiDetails || '');
    setFormWarrantyPeriod(prefill.warrantyPeriod || 'No Warranty');
    setFormPaidBy(prefill.paidBy || 'You');
    setFormTitle(prefill.title || '');
    setFormVendor(prefill.vendor || '');
    setFormMode(prefill.mode || 'UPI');
    setFormStatus(prefill.status || 'Paid');
    setFormDate(
      isDuplicate
        ? getLocalTodayISO()
        : prefill.date || getLocalTodayISO()
    );
    setFormNotes(prefill.notes || '');
    setFormReceipt(prefill.receipt || null);
    setShowMoreBillFields(
      Boolean(
        prefill.vendor ||
          prefill.receipt ||
          prefill.notes ||
          prefill.paymentPlan === 'EMI' ||
          (prefill.warrantyPeriod && prefill.warrantyPeriod !== 'No Warranty')
      )
    );
    setIsAddDrawerOpen(true);
  };

  const handleSelectDrawerCategory = (catId: string) => {
    const cat = findCategoryById(catId);
    setFormCategory(catId);
    setFormCostType(cat.defaultCostType);
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
    const cleanVendor =
      formVendor.trim() || (formCategory === 'appliances' ? 'Store / Online' : 'Direct Purchase');

    const expenseRecord: ExpenseItem = {
      id: editingExpenseId || `exp_${Date.now()}`,
      title: cleanTitle,
      amount: numericAmount,
      category: formCategory,
      costType: formCostType,
      paymentPlan: formCategory === 'appliances' ? formPaymentPlan : 'Full Payment',
      emiDetails:
        formCategory === 'appliances' && formPaymentPlan === 'EMI' ? formEmiDetails.trim() : '',
      warrantyPeriod: formCategory === 'appliances' ? formWarrantyPeriod : '',
      paidBy: formPaidBy,
      vendor: cleanVendor,
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

    const updatedProjects = {
      ...projects,
      interior: {
        ...currentProject,
        expenses: updatedExpenses
      }
    };

    saveProjectsToCloud(updatedProjects);
    setIsAddDrawerOpen(false);
    setEditingExpenseId(null);
    showToast(editingExpenseId ? 'Bill updated!' : `${formatINR(numericAmount)} saved!`);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = (currentProject.expenses || []).filter((e) => e.id !== expenseId);
    const updatedProjects = {
      ...projects,
      interior: {
        ...currentProject,
        expenses: updatedExpenses
      }
    };
    saveProjectsToCloud(updatedProjects);
    showToast('Bill removed');
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
      trade: newVendorTrade.trim() || 'Interior Contractor',
      quoted: quotedNum,
      phone: newVendorPhone.trim() || 'Not added',
      milestones:
        quotedNum > 0
          ? [
              { id: `ms_${Date.now()}_1`, label: '30% Advance', amount: Math.round(quotedNum * 0.3), dueDate: getLocalTodayISO(), status: 'Due Soon' },
              { id: `ms_${Date.now()}_2`, label: '50% Work Stage', amount: Math.round(quotedNum * 0.5), dueDate: '2026-12-05', status: 'Upcoming' },
              { id: `ms_${Date.now()}_3`, label: '20% Handover', amount: Math.round(quotedNum * 0.2), dueDate: '2026-12-20', status: 'Upcoming' }
            ]
          : []
    };

    const updatedProjects = {
      ...projects,
      interior: {
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
    showToast(`${vendorObj.name} added`);
  };

  // --- Toggle Milestone Paid Status & Log Expense ---
  const handleMarkMilestonePaid = (vendor: VendorItem, milestone: MilestoneItem) => {
    const updatedVendors = (currentProject.vendors || []).map((v) => {
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
      category: 'carpentry',
      costType: 'Labour',
      paidBy: 'You',
      vendor: vendor.name,
      mode: 'UPI',
      status: 'Paid',
      date: getLocalTodayISO(),
      notes: `Milestone paid (${milestone.label})`
    };

    const updatedProjects = {
      ...projects,
      interior: {
        ...currentProject,
        vendors: updatedVendors,
        expenses: [newExpense, ...(currentProject.expenses || [])]
      }
    };

    saveProjectsToCloud(updatedProjects);
    showToast(`Milestone "${milestone.label}" marked Paid!`);
  };

  // --- Smart Majuri Live Calculation (Qty × Height × Width × Sq.Ft Rate) ---
  const liveMajuriCalc = useMemo(() => {
    const q = Math.max(1, Number(mjQty) || 1);
    const h = parseFloat(mjHeight) || 0;
    const w = parseFloat(mjWidth) || 0;
    const r = parseFloat(mjRate) || 0;
    const rawArea = q * h * w;
    const sqft = mjUnit === 'in' ? rawArea / 144 : rawArea;
    const roundedSqft = Math.round(sqft * 100) / 100;
    const amount = Math.round(roundedSqft * r);
    return { qty: q, sqft: roundedSqft, amount };
  }, [mjQty, mjHeight, mjWidth, mjRate, mjUnit]);

  // --- Filtered Majuri & Advance Lists by Vendor ---
  const filteredMajuriEntries = useMemo(() => {
    return majuriEntries.filter((m) => {
      const vName = m.vendorName || DEFAULT_CARPENTER_VENDOR;
      if (selectedMajuriVendorFilter !== 'all' && vName !== selectedMajuriVendorFilter) {
        return false;
      }
      if (selectedMajuriRoomFilter !== 'all' && m.roomId !== selectedMajuriRoomFilter) {
        return false;
      }
      return true;
    });
  }, [majuriEntries, selectedMajuriVendorFilter, selectedMajuriRoomFilter]);

  const filteredCarpenterAdvances = useMemo(() => {
    return carpenterAdvances.filter((a) => {
      const vName = a.vendorName || DEFAULT_CARPENTER_VENDOR;
      if (selectedMajuriVendorFilter !== 'all' && vName !== selectedMajuriVendorFilter) {
        return false;
      }
      return true;
    });
  }, [carpenterAdvances, selectedMajuriVendorFilter]);

  const majuriSummary = useMemo(() => {
    const vendorScopedEntries = majuriEntries.filter((m) =>
      selectedMajuriVendorFilter === 'all'
        ? true
        : (m.vendorName || DEFAULT_CARPENTER_VENDOR) === selectedMajuriVendorFilter
    );
    const vendorScopedAdvances = carpenterAdvances.filter((a) =>
      selectedMajuriVendorFilter === 'all'
        ? true
        : (a.vendorName || DEFAULT_CARPENTER_VENDOR) === selectedMajuriVendorFilter
    );

    let totalSqft = 0;
    let totalWorkBill = 0;

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

    const totalAdvancePaid = vendorScopedAdvances.reduce(
      (sum, a) => sum + (Number(a.amount) || 0),
      0
    );

    const netBalance = totalWorkBill - totalAdvancePaid;
    const settledPct =
      totalWorkBill > 0
        ? Math.min(100, Math.round((totalAdvancePaid / totalWorkBill) * 100))
        : 0;

    const roomsWithShare = byRoom.map((r) => ({
      ...r,
      sharePct: totalWorkBill > 0 ? Math.round((r.amount / totalWorkBill) * 100) : 0
    }));

    const byVendorMap: Record<
      string,
      { vendorName: string; sqft: number; workBill: number; advances: number; balance: number }
    > = {};

    majuriEntries.forEach((m) => {
      const vName = m.vendorName || DEFAULT_CARPENTER_VENDOR;
      if (!byVendorMap[vName]) {
        byVendorMap[vName] = { vendorName: vName, sqft: 0, workBill: 0, advances: 0, balance: 0 };
      }
      byVendorMap[vName].sqft += Number(m.sqft) || 0;
      byVendorMap[vName].workBill += Number(m.amount) || 0;
    });

    carpenterAdvances.forEach((a) => {
      const vName = a.vendorName || DEFAULT_CARPENTER_VENDOR;
      if (!byVendorMap[vName]) {
        byVendorMap[vName] = { vendorName: vName, sqft: 0, workBill: 0, advances: 0, balance: 0 };
      }
      byVendorMap[vName].advances += Number(a.amount) || 0;
    });

    const vendorBreakdown = Object.values(byVendorMap).map((v) => ({
      ...v,
      sqft: Math.round(v.sqft * 10) / 10,
      balance: v.workBill - v.advances
    }));

    return {
      totalSqft: Math.round(totalSqft * 10) / 10,
      totalWorkBill,
      totalAdvancePaid,
      netBalance,
      settledPct,
      rooms: roomsWithShare,
      vendorBreakdown
    };
  }, [majuriEntries, carpenterAdvances, selectedMajuriVendorFilter]);

  const handleSaveMajuriEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (liveMajuriCalc.sqft <= 0 || liveMajuriCalc.amount <= 0) {
      showToast('Enter valid Height, Width & Sq.ft Rate');
      return;
    }

    const resolvedVendor =
      mjVendorSelect === '__custom__'
        ? mjCustomVendor.trim() || DEFAULT_CARPENTER_VENDOR
        : mjVendorSelect || DEFAULT_CARPENTER_VENDOR;

    const roomObj = MAJURI_ROOMS.find((r) => r.id === mjRoomId) || MAJURI_ROOMS[0];
    const cleanItem = mjItem.trim() || `${roomObj.label} Carpentry Work`;

    const newMajuri: MajuriEntry = {
      id: `mj_${Date.now()}`,
      vendorName: resolvedVendor,
      roomId: mjRoomId,
      item: cleanItem,
      unit: mjUnit,
      qty: liveMajuriCalc.qty,
      height: parseFloat(mjHeight),
      width: parseFloat(mjWidth),
      sqft: liveMajuriCalc.sqft,
      rate: parseFloat(mjRate),
      amount: liveMajuriCalc.amount,
      date: getLocalTodayISO()
    };

    let updatedProjects = projects;
    const existingVendors = projects.interior?.vendors || [];
    const vendorExists = existingVendors.some(
      (v) => v.name.toLowerCase().trim() === resolvedVendor.toLowerCase().trim()
    );
    if (!vendorExists && resolvedVendor !== DEFAULT_CARPENTER_VENDOR) {
      updatedProjects = {
        ...projects,
        interior: {
          ...projects.interior,
          vendors: [
            ...existingVendors,
            {
              id: `v_mj_${Date.now()}`,
              name: resolvedVendor,
              trade: 'Carpentry Contractor',
              quoted: 0,
              phone: 'Not added',
              milestones: []
            }
          ]
        }
      };
    }

    const updatedMajuri = [newMajuri, ...majuriEntries];
    saveProjectsToCloud(updatedProjects, updatedMajuri, carpenterAdvances);

    try {
      localStorage.setItem(
        'homeledger_majuri_prefs',
        JSON.stringify({ vendor: resolvedVendor, roomId: mjRoomId, rate: mjRate })
      );
    } catch {
      // Ignore storage errors
    }

    setMjItem('');
    setMjQty(1);
    setMjHeight('');
    setMjWidth('');
    if (mjVendorSelect === '__custom__') {
      setMjVendorSelect(resolvedVendor);
      setMjCustomVendor('');
    }
    showToast(`${liveMajuriCalc.sqft} sq.ft (${formatINR(liveMajuriCalc.amount)}) added for ${resolvedVendor}`);
  };

  const handleRepeatMajuriEntry = (entry: MajuriEntry) => {
    const repeated: MajuriEntry = {
      ...entry,
      id: `mj_${Date.now()}`,
      date: getLocalTodayISO()
    };
    const updatedMajuri = [repeated, ...majuriEntries];
    saveProjectsToCloud(projects, updatedMajuri, carpenterAdvances);
    showToast(`Repeated "${entry.item}" (${formatINR(entry.amount)})`);
  };

  const handleDeleteMajuriEntry = (id: string) => {
    const updatedMajuri = majuriEntries.filter((m) => m.id !== id);
    saveProjectsToCloud(projects, updatedMajuri, carpenterAdvances);
    showToast('Measurement removed');
  };

  // --- Log Advance Payment (Without Measurement) & Sync to Interior Bills ---
  const handleSaveCarpenterAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(advAmount);
    if (!numAmt || numAmt <= 0) {
      showToast('Enter valid advance ₹ amount');
      return;
    }

    const resolvedVendor =
      advVendorSelect === '__custom__'
        ? advCustomVendor.trim() || DEFAULT_CARPENTER_VENDOR
        : advVendorSelect || DEFAULT_CARPENTER_VENDOR;

    const vendorAdvanceCount = carpenterAdvances.filter(
      (a) => (a.vendorName || DEFAULT_CARPENTER_VENDOR) === resolvedVendor
    ).length;

    const cleanLabel =
      advWeekLabel.trim() || `Advance Payment #${vendorAdvanceCount + 1}`;
    const advId = `ca_${Date.now()}`;
    const syncedExpenseId = advSyncToBills ? `exp_${advId}` : null;

    const newAdv: CarpenterAdvance = {
      id: advId,
      vendorName: resolvedVendor,
      syncedExpenseId,
      weekLabel: cleanLabel,
      amount: numAmt,
      mode: advMode,
      paidBy: advPaidBy,
      date: advDate,
      notes: advNotes.trim() || 'Advance payment without measurement'
    };

    const updatedAdvances = [newAdv, ...carpenterAdvances];
    let updatedProjects = projects;

    if (advSyncToBills && syncedExpenseId) {
      const interiorProj = projects.interior;
      const existingVendors = interiorProj.vendors || [];
      const vendorExists = existingVendors.some(
        (v) => v.name.toLowerCase().trim() === resolvedVendor.toLowerCase().trim()
      );

      const updatedVendors =
        !vendorExists && resolvedVendor !== DEFAULT_CARPENTER_VENDOR
          ? [
              ...existingVendors,
              {
                id: `v_adv_${Date.now()}`,
                name: resolvedVendor,
                trade: 'Carpentry Contractor',
                quoted: 0,
                phone: 'Not added',
                milestones: []
              }
            ]
          : existingVendors;

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
      updatedProjects = {
        ...projects,
        interior: {
          ...interiorProj,
          vendors: updatedVendors,
          expenses: [syncedExpense, ...(interiorProj.expenses || [])]
        }
      };
    }

    saveProjectsToCloud(updatedProjects, majuriEntries, updatedAdvances);
    setAdvWeekLabel('');
    setAdvAmount('');
    setAdvNotes('');
    if (advVendorSelect === '__custom__') {
      setAdvVendorSelect(resolvedVendor);
      setAdvCustomVendor('');
    }
    showToast(
      advSyncToBills
        ? `Advance ${formatINR(numAmt)} for ${resolvedVendor} logged & synced!`
        : `Advance ${formatINR(numAmt)} for ${resolvedVendor} recorded!`
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
    showToast('Advance & synced bill removed');
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
    const generatedOn = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const scopeTitle =
      selectedMajuriVendorFilter === 'all'
        ? 'All Carpenters & Vendors'
        : selectedMajuriVendorFilter;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>HomeLedger — Graphical Interior & Majuri Report</title>
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
            .kpi-val { font-size: 20px; font-weight: 800; margin-top: 4px; }
            .section { border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; margin-bottom: 18px; page-break-inside: avoid; }
            .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #4f46e5; margin: 0 0 14px; }
            .bar-row { margin-bottom: 10px; }
            .bar-meta { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
            .bar-track { width: 100%; height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
            .bar-fill { height: 100%; border-radius: 999px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; padding: 10px 8px; background: #f1f5f9; color: #475569; font-weight: 800; border-bottom: 2px solid #cbd5e1; }
            td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            @media print { body { padding: 12px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>HomeLedger • Interior Work & Majuri</h1>
              <p>Graphical Renovation Statement • Workspace: ${WORKSPACE_CODE}</p>
            </div>
            <div class="badge">Generated ${generatedOn}</div>
          </div>

          <div class="kpi-grid">
            <div class="kpi"><div class="kpi-label">Total Spent</div><div class="kpi-val" style="color:#4f46e5;">${formatINR(analytics.totalSpent)}</div></div>
            <div class="kpi"><div class="kpi-label">Paid</div><div class="kpi-val" style="color:#059669;">${formatINR(analytics.paidAmount)}</div></div>
            <div class="kpi"><div class="kpi-label">Advance Given</div><div class="kpi-val" style="color:#d97706;">${formatINR(analytics.advanceAmount)}</div></div>
            <div class="kpi"><div class="kpi-label">Pending & Dues</div><div class="kpi-val" style="color:#e11d48;">${formatINR(analytics.totalVendorDues)}</div></div>
          </div>

          <div class="section">
            <h3 class="section-title">Trade & Shopping Section Breakdown</h3>
            ${analytics.categoryList
              .map(
                (cat) => `
                  <div class="bar-row">
                    <div class="bar-meta"><span>${cat.label}</span><span>${formatINR(cat.spent)} (${cat.sharePct}%)</span></div>
                    <div class="bar-track"><div class="bar-fill" style="width:${cat.sharePct}%; background:${cat.color};"></div></div>
                  </div>
                `
              )
              .join('')}
          </div>

          <div class="section" style="border-color:#fed7aa; background:#fffaf5;">
            <h3 class="section-title" style="color:#ea580c;">Carpentry Majuri Khata (${scopeTitle})</h3>
            <div class="kpi-grid">
              <div class="kpi" style="background:#fff;"><div class="kpi-label">Measured Area</div><div class="kpi-val" style="font-size:17px; color:#ea580c;">${majuriSummary.totalSqft} ft²</div></div>
              <div class="kpi" style="background:#fff;"><div class="kpi-label">Work Bill</div><div class="kpi-val" style="font-size:17px; color:#4f46e5;">${formatINR(majuriSummary.totalWorkBill)}</div></div>
              <div class="kpi" style="background:#fff;"><div class="kpi-label">Advances Paid</div><div class="kpi-val" style="font-size:17px; color:#059669;">${formatINR(majuriSummary.totalAdvancePaid)}</div></div>
              <div class="kpi" style="background:#fff;"><div class="kpi-label">${majuriSummary.netBalance >= 0 ? 'Net Payable' : 'Advance Credit'}</div><div class="kpi-val" style="font-size:17px; color:${majuriSummary.netBalance >= 0 ? '#e11d48' : '#d97706'};">${formatINR(Math.abs(majuriSummary.netBalance))}</div></div>
            </div>

            <table style="margin-bottom:14px; background:#fff;">
              <thead>
                <tr><th>Date</th><th>Vendor / Carpenter</th><th>Room</th><th>Work Description</th><th>Dimensions</th><th>Sq.Ft</th><th>Rate</th><th style="text-align:right;">Bill</th></tr>
              </thead>
              <tbody>
                ${filteredMajuriEntries
                  .map((m) => {
                    const rLabel = MAJURI_ROOMS.find((r) => r.id === m.roomId)?.label || m.roomId;
                    const qLabel = m.qty && m.qty > 1 ? `${m.qty}× ` : '';
                    return `<tr><td>${m.date}</td><td><strong>${m.vendorName || DEFAULT_CARPENTER_VENDOR}</strong></td><td>${rLabel}</td><td>${m.item}</td><td>${qLabel}${m.height}${m.unit} × ${m.width}${m.unit}</td><td>${m.sqft}</td><td>₹${m.rate}</td><td style="text-align:right; font-weight:800;">${formatINR(m.amount)}</td></tr>`;
                  })
                  .join('')}
              </tbody>
            </table>

            <table style="background:#fff;">
              <thead>
                <tr><th>Date</th><th>Vendor / Carpenter</th><th>Advance Payment (No Measurement)</th><th>Mode</th><th>Notes</th><th style="text-align:right;">Paid</th></tr>
              </thead>
              <tbody>
                ${filteredCarpenterAdvances
                  .map(
                    (a) =>
                      `<tr><td>${a.date}</td><td><strong>${a.vendorName || DEFAULT_CARPENTER_VENDOR}</strong></td><td>${a.weekLabel}</td><td>${a.mode}</td><td>${a.notes || '—'}</td><td style="text-align:right; font-weight:800; color:#059669;">${formatINR(a.amount)}</td></tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3 class="section-title">Itemized Interior & Appliance Bills (${(currentProject.expenses || []).length})</h3>
            <table>
              <thead>
                <tr><th>Date</th><th>Description</th><th>Section</th><th>Type</th><th>Store / Vendor</th><th>Plan / Warranty</th><th>Status</th><th style="text-align:right;">Amount</th></tr>
              </thead>
              <tbody>
                ${(currentProject.expenses || [])
                  .map((e) => {
                    const catLabel = findCategoryById(e.category).shortLabel;
                    const planStr =
                      e.category === 'appliances'
                        ? [
                            e.paymentPlan === 'EMI'
                              ? `EMI${e.emiDetails ? ` (${e.emiDetails})` : ''}`
                              : 'Full',
                            e.warrantyPeriod && e.warrantyPeriod !== 'No Warranty'
                              ? `${e.warrantyPeriod} Warranty`
                              : ''
                          ]
                            .filter(Boolean)
                            .join(' • ')
                        : e.mode;
                    return `<tr><td>${e.date}</td><td><strong>${e.title}</strong></td><td>${catLabel}</td><td>${e.costType || 'Material'}</td><td>${e.vendor}</td><td>${planStr}</td><td>${e.status}</td><td style="text-align:right; font-weight:800;">${formatINR(e.amount)}</td></tr>`;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); };</script>
        </body>
      </html>
    `;

    const reportWindow = window.open('', '_blank', 'width=900,height=1100');
    if (reportWindow) {
      reportWindow.document.write(htmlContent);
      reportWindow.document.close();
      showToast('Opening print-ready Graphical PDF...');
      return;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1500);
      }, 350);
      showToast('Opening Print / Save as PDF...');
    } else {
      showToast('Please allow pop-ups to save PDF');
    }
  };

  // --- 1-Click CSV / Excel Report Export ---
  const handleExportCSV = () => {
    const headers = ['Date', 'Title', 'Trade / Section', 'Type', 'Paid By', 'Store / Vendor', 'Payment Plan', 'EMI Details', 'Warranty', 'Amount (INR)', 'Payment Mode', 'Status', 'Notes'];
    const rows = (currentProject.expenses || []).map((e) => {
      const catLabel = findCategoryById(e.category).label;
      return [
        e.date,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        `"${catLabel}"`,
        e.costType || 'Material',
        e.paidBy || 'You',
        `"${(e.vendor || '').replace(/"/g, '""')}"`,
        e.paymentPlan || 'Full Payment',
        `"${(e.emiDetails || '').replace(/"/g, '""')}"`,
        `"${e.warrantyPeriod || ''}"`,
        e.amount,
        e.mode,
        e.status,
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvBody = [
      headers.join(','),
      ...rows,
      '',
      ['CARPENTRY MAJURI KHATA SUMMARY', `Total Sq.Ft: ${majuriSummary.totalSqft}`, `Total Work Bill (INR): ${majuriSummary.totalWorkBill}`, `Advances Paid (INR): ${majuriSummary.totalAdvancePaid}`, `Net Payable Balance (INR): ${majuriSummary.netBalance}`].join(','),
      ['Date', 'Vendor / Carpenter', 'Room / Area', 'Work Description', 'Qty', 'Height', 'Width', 'Unit', 'Area (Sq.Ft)', 'Rate (INR/Sq.Ft)', 'Majuri Amount (INR)'].join(','),
      ...majuriEntries.map((m) => {
        const rLabel = MAJURI_ROOMS.find((r) => r.id === m.roomId)?.label || m.roomId;
        return [m.date, `"${(m.vendorName || DEFAULT_CARPENTER_VENDOR).replace(/"/g, '""')}"`, `"${rLabel}"`, `"${(m.item || '').replace(/"/g, '""')}"`, m.qty || 1, m.height, m.width, m.unit, m.sqft, m.rate, m.amount].join(',');
      }),
      '',
      ['Date', 'Vendor / Carpenter', 'Advance Label (No Measurement)', 'Paid By', 'Mode', 'Advance Amount (INR)', 'Notes'].join(','),
      ...carpenterAdvances.map((a) =>
        [a.date, `"${(a.vendorName || DEFAULT_CARPENTER_VENDOR).replace(/"/g, '""')}"`, `"${(a.weekLabel || '').replace(/"/g, '""')}"`, a.paidBy, a.mode, a.amount, `"${(a.notes || '').replace(/"/g, '""')}"`].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HomeLedger_Interiors_${getLocalTodayISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Excel / CSV spreadsheet downloaded!');
  };

  // --- Full-Screen Google Sign-In Gate (Strict Single-Owner Access) ---
  const showLoginGate = !authLoading && !user && (hasFirebaseConfig || !demoBypass);

  if (showLoginGate) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex justify-center">
          <div className="w-full max-w-md min-h-screen bg-white dark:bg-slate-900 shadow-2xl sm:border-x border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                aria-label="Toggle color theme"
                className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center touch-manipulation active:scale-95 transition-transform"
              >
                {darkMode ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-6 text-center my-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mx-auto">
                <HomeIcon className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold uppercase tracking-wider">
                  Private Owner Vault
                </span>
                <h1 className="text-3xl font-black tracking-tight">HomeLedger</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Interior Trades, Appliances Shopping &amp; Carpentry Majuri Khata.
                </p>
              </div>

              {isInAppWebView && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-left space-y-2">
                  <div className="text-xs font-black text-amber-700 dark:text-amber-300">
                    In-App Browser Detected (WhatsApp / Instagram)
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    Google Sign-In is blocked inside embedded apps. Tap below to copy the link and open it in <strong>Chrome</strong> or <strong>Safari</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href).catch(() => {});
                      showToast('Link copied! Paste in Chrome or Safari');
                    }}
                    className="h-9 px-3 rounded-xl bg-amber-600 text-white text-xs font-extrabold"
                  >
                    Copy App Link
                  </button>
                </div>
              )}

              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Authorized Owner Account
                </div>
                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {ALLOWED_EMAIL}
                </div>

                {authError && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-extrabold text-rose-600 dark:text-rose-400">
                    {authError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <LogInIcon className="w-5 h-5" />
                  <span>Continue with Google</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-400 font-semibold">
              Protected by Firebase Authentication • Single Gmail Lock
            </p>
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
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-xl text-xs font-extrabold flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ================= STREAMLINED MOBILE HEADER WITH LIVE SYNC STATUS ================= */}
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200/70 dark:border-slate-800 px-4 pt-3 pb-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
                  <HomeIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-black tracking-tight leading-none truncate">HomeLedger</h1>
                  <button
                    type="button"
                    onClick={handleManualForceSync}
                    title="Tap to force cloud sync now"
                    className="flex items-center gap-1 mt-1 text-left"
                  >
                    {!isOnline || syncStatus === 'offline' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <CloudOffIcon className="w-3 h-3" /> Offline Saved
                      </span>
                    ) : syncStatus === 'error' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        <RefreshIcon className="w-3 h-3" /> Sync Error • Tap Retry
                      </span>
                    ) : syncStatus === 'syncing' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <RefreshIcon className="w-3 h-3 animate-spin" /> Syncing Cloud...
                      </span>
                    ) : syncStatus === 'synced' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CloudIcon className="w-3 h-3" /> Synced {lastSyncedAt ? `(${lastSyncedAt})` : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Local Vault
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleManualForceSync}
                  aria-label="Sync Cloud Now"
                  title="Sync Cloud Now"
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center active:scale-95 transition-transform ${
                    syncStatus === 'error'
                      ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  <RefreshIcon className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setLargeTextMode((prev) => !prev)}
                  aria-label="Toggle large readable text"
                  title="Larger Text (A+)"
                  className={`h-10 px-2.5 rounded-2xl border text-xs font-black transition-all touch-manipulation ${
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
                  className="h-10 px-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 flex items-center gap-1 text-xs font-extrabold active:scale-95 transition-transform"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDarkMode((prev) => !prev)}
                  aria-label="Toggle color theme"
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 touch-manipulation active:scale-95 transition-transform"
                >
                  {darkMode ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4" />}
                </button>

                {user && (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    title={`Signed in as ${user.email || ALLOWED_EMAIL}`}
                    className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <LogOutIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Explicit Sync Error Diagnostics Banner (Only Appears if Firestore Rules Block Writes) */}
            {syncStatus === 'error' && syncErrorMsg && (
              <div className="mt-2.5 p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between gap-2">
                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 leading-snug">
                  Cloud sync blocked: {syncErrorMsg}
                </div>
                <button
                  type="button"
                  onClick={handleManualForceSync}
                  className="h-8 px-2.5 rounded-xl bg-rose-600 text-white text-[11px] font-extrabold shrink-0"
                >
                  Retry
                </button>
              </div>
            )}
          </header>

          {/* ================= MAIN SCROLLABLE CONTENT AREA ================= */}
          <main className="flex-1 px-4 pt-4 space-y-4">
            {/* TAB 1: GRAPHICAL HOME OVERVIEW */}
            {activeTab === 'overview' && (
              <section className="space-y-4">
                {showInstallTip && (
                  <div className="px-3.5 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 leading-snug">
                      Tip: Tap browser menu <strong>⋮</strong> &rarr; <strong>Add to Home Screen</strong> to use like an app.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInstallTip(false);
                        try {
                          localStorage.setItem('homeledger_hide_install_tip', 'true');
                        } catch {
                          // Ignore
                        }
                      }}
                      className="text-xs font-black text-indigo-500 px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Hero Total Actual Spent Card */}
                <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Total Interior &amp; Shopping Spent
                      </span>
                      <h2 className="text-3xl font-black tracking-tight mt-0.5">
                        {formatINR(analytics.totalSpent)}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAddExpenseDrawer()}
                      className="h-10 px-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Bill</span>
                    </button>
                  </div>

                  {/* Donut Ring + 3 Clean Status Pills */}
                  <div className="grid grid-cols-2 items-center gap-3">
                    <div className="h-36 relative flex items-center justify-center">
                      <NativeDonutChart data={analytics.categoryDonutData} size={140} strokeWidth={20} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Bills</span>
                        <span className="text-lg font-black">{analytics.billCount}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">Paid</span>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {formatINR(analytics.paidAmount, true)}
                        </span>
                      </div>
                      <div className="px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400">Advance</span>
                        <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                          {formatINR(analytics.advanceAmount, true)}
                        </span>
                      </div>
                      <div className="px-3 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-rose-700 dark:text-rose-400">Dues</span>
                        <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                          {formatINR(analytics.totalVendorDues, true)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Material vs Majuri vs Turnkey Visual Bar */}
                  {analytics.totalSpent > 0 && (
                    <div className="pt-1 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-extrabold text-slate-400">
                        <span>Material {analytics.materialPct}%</span>
                        <span>Majuri {analytics.labourPct}%</span>
                        <span>With-Mat / Lump {analytics.turnkeyPct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                        <div className="h-full bg-indigo-600" style={{ width: `${analytics.materialPct}%` }} />
                        <div className="h-full bg-orange-500" style={{ width: `${analytics.labourPct}%` }} />
                        <div className="h-full bg-emerald-500" style={{ width: `${analytics.turnkeyPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick-Start Empty State Onboarding Card */}
                {analytics.billCount === 0 && majuriEntries.length === 0 && (
                  <div className="bg-indigo-600/10 border border-indigo-500/25 rounded-3xl p-4 space-y-3">
                    <div className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                      Clean Slate Ready (₹0) — Start in 1 Tap:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openAddExpenseDrawer()}
                        className="h-12 px-3 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add First Bill</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('majuri')}
                        className="h-12 px-3 rounded-2xl bg-orange-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                      >
                        <RulerIcon className="w-4 h-4" />
                        <span>Log Carpenter</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Carpentry Majuri Shortcut Banner */}
                <button
                  type="button"
                  onClick={() => setActiveTab('majuri')}
                  className="w-full text-left bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-4 shadow-md shadow-orange-500/20 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                      <RulerIcon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black">Carpentry Majuri Khata</div>
                      <div className="text-xs font-semibold text-orange-100 truncate">
                        {majuriSummary.totalSqft} ft² • Work {formatINR(majuriSummary.totalWorkBill, true)} • Adv {formatINR(majuriSummary.totalAdvancePaid, true)}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRightIcon className="w-5 h-5 shrink-0" />
                </button>

                {/* Trade & Shopping Sections Grid */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Trade &amp; Shopping Sections
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">Tap section</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {analytics.categoryList.map((cat) => {
                      const CIcon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryFilter(cat.id);
                            setActiveTab('expenses');
                          }}
                          className="text-left bg-white dark:bg-slate-800/90 p-3.5 rounded-3xl border border-slate-200/70 dark:border-slate-700/70 shadow-sm active:scale-[0.98] transition-all space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-2xl ${cat.bg} ${cat.text} flex items-center justify-center`}>
                              <CIcon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                              {cat.sharePct}%
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-extrabold truncate">{cat.shortLabel}</div>
                            <div className="text-base font-black mt-0.5">{formatINR(cat.spent, true)}</div>
                            <div className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                              {cat.subtitle}
                            </div>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
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

            {/* TAB 2: EXPENSE BILL LEDGER */}
            {activeTab === 'expenses' && (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-black">
                      {selectedFilterCategoryObj ? selectedFilterCategoryObj.label : `All Bills (${filteredExpenses.length})`}
                    </h2>
                    {selectedFilterCategoryObj && (
                      <p className="text-[11px] font-semibold text-slate-400">
                        {selectedFilterCategoryObj.subtitle}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddExpenseDrawer()}
                    className="h-10 px-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1 shrink-0"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>{selectedFilterCategoryObj ? `Add ${selectedFilterCategoryObj.shortLabel}` : 'Add Bill'}</span>
                  </button>
                </div>

                {selectedFilterCategoryObj && (
                  <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-400">Section Total</span>
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                        {formatINR(filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0))}
                      </span>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                      {selectedFilterCategoryObj.presets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            openAddExpenseDrawer({
                              category: selectedFilterCategoryObj.id,
                              title: preset.label,
                              costType: preset.costType
                            })
                          }
                          className="h-8 px-3 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-extrabold shrink-0"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search item, store, vendor..."
                    className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
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
                      type="button"
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

                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {['all', 'Material', 'Labour', 'Turnkey', 'Lumpsum'].map((ct) => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => setCostTypeFilter(ct)}
                      className={`h-8 px-3 rounded-xl text-[11px] font-extrabold shrink-0 ${
                        costTypeFilter === ct
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {ct === 'all' ? 'All Types' : ct === 'Turnkey' ? 'With Material' : ct}
                    </button>
                  ))}
                  {['all', 'Paid', 'Advance', 'Pending'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`h-8 px-3 rounded-xl text-[11px] font-extrabold shrink-0 ${
                        statusFilter === st
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {st === 'all' ? 'Any Status' : st}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5">
                  {filteredExpenses.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center space-y-3">
                      <p className="text-xs font-bold text-slate-400">
                        No bills logged in this section yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => openAddExpenseDrawer()}
                        className="h-11 px-4 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Bill Now</span>
                      </button>
                    </div>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const catObj = findCategoryById(exp.category);
                      const CIcon = catObj.icon;
                      const stObj =
                        PAYMENT_STATUSES.find((s) => s.id === exp.status) || PAYMENT_STATUSES[0];
                      return (
                        <div
                          key={exp.id}
                          className="bg-white dark:bg-slate-800/90 p-3.5 rounded-3xl border border-slate-200/70 dark:border-slate-700/70 shadow-sm space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0">
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
                              <div className="text-base font-black">{formatINR(exp.amount)}</div>
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
                              {exp.category === 'appliances' && (
                                <>
                                  <span
                                    className={`px-2 py-0.5 rounded-lg font-extrabold ${
                                      exp.paymentPlan === 'EMI'
                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    }`}
                                  >
                                    {exp.paymentPlan === 'EMI'
                                      ? `EMI${exp.emiDetails ? ` • ${exp.emiDetails}` : ''}`
                                      : 'Full Payment'}
                                  </span>
                                  {exp.warrantyPeriod && exp.warrantyPeriod !== 'No Warranty' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-extrabold">
                                      <ShieldCheckIcon className="w-3 h-3" />
                                      {exp.warrantyPeriod}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {exp.receipt && (
                                <button
                                  type="button"
                                  onClick={() => setReceiptPreviewUrl(exp.receipt || null)}
                                  className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center"
                                  title="View Photo"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openAddExpenseDrawer(exp, true)}
                                className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"
                                title="Repeat / Duplicate Bill"
                              >
                                <CopyIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openAddExpenseDrawer(exp, false)}
                                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                                title="Edit"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
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

            {/* TAB 3: VENDORS & MILESTONES */}
            {activeTab === 'vendors' && (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black">Contractors &amp; Vendors</h2>
                    <p className="text-xs text-slate-400">
                      Pending Dues: <strong className="text-rose-500">{formatINR(analytics.totalVendorDues)}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVendorModalOpen(true)}
                    className="h-10 px-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Vendor</span>
                  </button>
                </div>

                {analytics.vendorStats.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center space-y-3">
                    <p className="text-xs font-bold text-slate-400">
                      No contractors or vendors added yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsVendorModalOpen(true)}
                      className="h-11 px-4 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Add First Vendor</span>
                    </button>
                  </div>
                ) : (
                  analytics.vendorStats.map((v) => (
                    <div
                      key={v.id}
                      className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-black">{v.name}</h3>
                          <p className="text-xs text-slate-400">{v.trade}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleShareWhatsApp(
                              `*HomeLedger Vendor Ledger — ${v.name}*\nAgreed Quote: ${formatINR(v.quoted)}\nPaid So Far: *${formatINR(v.paidToVendor)}*\nBalance Payable: *${formatINR(v.balanceRemaining)}*`
                            )
                          }
                          className="h-9 px-3 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1"
                        >
                          <ArrowUpRightIcon className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
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
                              className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/60"
                            >
                              <div>
                                <div className="text-xs font-extrabold">{ms.label}</div>
                                <div className="text-[11px] font-semibold text-slate-400">
                                  {formatINR(ms.amount)} • {ms.dueDate}
                                </div>
                              </div>
                              {ms.status === 'Paid' ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 text-[11px] font-extrabold">
                                  Paid ✓
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMarkMilestonePaid(v, ms)}
                                  className="h-9 px-3.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold"
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

            {/* TAB 4: SMART CARPENTRY MAJURI KHATA (WITH MAIN CARPENTER + CUSTOM VENDOR) */}
            {activeTab === 'majuri' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      Main Carpenter &amp; Vendors
                    </span>
                    <h2 className="text-lg font-black">Carpentry Majuri</h2>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrintGraphicalPDF}
                      className="h-10 px-3 rounded-2xl bg-indigo-600 text-white text-xs font-extrabold flex items-center gap-1"
                    >
                      <PrinterIcon className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const scopeLabel =
                          selectedMajuriVendorFilter === 'all'
                            ? 'All Vendors'
                            : selectedMajuriVendorFilter;
                        const roomLines = majuriSummary.rooms
                          .filter((r) => r.sqft > 0 || r.amount > 0)
                          .map((r) => `• ${r.label}: ${r.sqft} ft² = ${formatINR(r.amount)}`)
                          .join('\n');
                        const balanceLine =
                          majuriSummary.netBalance >= 0
                            ? `Net Payable: *${formatINR(majuriSummary.netBalance)}*`
                            : `Extra Advance Credit: *${formatINR(Math.abs(majuriSummary.netBalance))}*`;
                        handleShareWhatsApp(
                          `*HomeLedger Carpenter Majuri (${scopeLabel})*\nMeasured Work: ${majuriSummary.totalSqft} ft² = *${formatINR(majuriSummary.totalWorkBill)}*\nAdvance Paid (No Measurement): *${formatINR(majuriSummary.totalAdvancePaid)}*\n${balanceLine}${roomLines ? `\n\n*Room Breakdown:*\n${roomLines}` : ''}`
                        );
                      }}
                      className="h-10 px-3 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1"
                    >
                      <ArrowUpRightIcon className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Vendor Filter Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedMajuriVendorFilter('all')}
                    className={`h-9 px-3.5 rounded-full text-xs font-extrabold shrink-0 ${
                      selectedMajuriVendorFilter === 'all'
                        ? 'bg-orange-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    All ({majuriVendorOptions.length})
                  </button>
                  {majuriVendorOptions.map((vName) => (
                    <button
                      key={vName}
                      type="button"
                      onClick={() => setSelectedMajuriVendorFilter(vName)}
                      className={`h-9 px-3.5 rounded-full text-xs font-extrabold shrink-0 ${
                        selectedMajuriVendorFilter === vName
                          ? 'bg-orange-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {vName}
                    </button>
                  ))}
                </div>

                {/* Running Khata Card */}
                <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-3xl p-4 shadow-lg shadow-orange-600/20 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-100">
                        {selectedMajuriVendorFilter === 'all' ? 'All Carpenters' : selectedMajuriVendorFilter} • {majuriSummary.totalSqft} ft²
                      </span>
                      <div className="text-3xl font-black mt-0.5">
                        {formatINR(majuriSummary.totalWorkBill)}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-extrabold shrink-0">
                      {majuriSummary.settledPct}% Paid
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-black/20 overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${majuriSummary.settledPct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div className="p-2.5 rounded-2xl bg-white/15">
                      <span className="text-[10px] font-bold uppercase text-orange-100 block">
                        Advance Paid (No Meas.)
                      </span>
                      <span className="text-sm font-black">
                        {formatINR(majuriSummary.totalAdvancePaid)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/15">
                      <span className="text-[10px] font-bold uppercase text-orange-100 block">
                        {majuriSummary.netBalance >= 0 ? 'Balance Payable' : 'Advance Credit'}
                      </span>
                      <span className="text-sm font-black">
                        {formatINR(Math.abs(majuriSummary.netBalance))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Per-Vendor Breakdown Card when viewing All Vendors */}
                {selectedMajuriVendorFilter === 'all' && majuriSummary.vendorBreakdown.length > 0 && (
                  <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-3.5 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Vendor-Wise Majuri Khata
                    </h3>
                    {majuriSummary.vendorBreakdown.map((vb) => (
                      <button
                        key={vb.vendorName}
                        type="button"
                        onClick={() => setSelectedMajuriVendorFilter(vb.vendorName)}
                        className="w-full text-left p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate">{vb.vendorName}</div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            {vb.sqft} ft² • Work {formatINR(vb.workBill, true)} • Adv {formatINR(vb.advances, true)}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 ${
                            vb.balance >= 0
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {vb.balance >= 0 ? `Due ${formatINR(vb.balance, true)}` : `Cr ${formatINR(Math.abs(vb.balance), true)}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Horizontal Swipeable Room Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedMajuriRoomFilter('all')}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold shrink-0 border ${
                      selectedMajuriRoomFilter === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    All Rooms
                  </button>
                  {majuriSummary.rooms.map((room) => {
                    const active = selectedMajuriRoomFilter === room.id;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setSelectedMajuriRoomFilter(active ? 'all' : room.id)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold shrink-0 border flex items-center gap-1.5 ${
                          active
                            ? 'bg-orange-500/15 border-orange-500 text-orange-700 dark:text-orange-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>{room.shortLabel}</span>
                        <span className="opacity-70">({formatINR(room.amount, true)})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Unified Segmented Form Card: Measure Work OR Advance Payment (Without Measurement) */}
                <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-200/70 dark:border-slate-700/70 space-y-3">
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setMajuriActionMode('measure')}
                      className={`h-10 rounded-xl text-xs font-extrabold transition-all ${
                        majuriActionMode === 'measure'
                          ? 'bg-orange-600 text-white shadow-sm'
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
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      + Advance (No Meas.)
                    </button>
                  </div>

                  {majuriActionMode === 'measure' ? (
                    <form onSubmit={handleSaveMajuriEntry} className="space-y-3">
                      <div className="space-y-2">
                        <select
                          value={mjVendorSelect}
                          onChange={(e) => setMjVendorSelect(e.target.value)}
                          className="w-full h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                        >
                          {majuriVendorOptions.map((vName) => (
                            <option key={vName} value={vName}>
                              Carpenter: {vName}
                            </option>
                          ))}
                          <option value="__custom__">+ Add New Carpenter / Vendor...</option>
                        </select>

                        {mjVendorSelect === '__custom__' && (
                          <input
                            type="text"
                            required
                            value={mjCustomVendor}
                            onChange={(e) => setMjCustomVendor(e.target.value)}
                            placeholder="Enter new carpenter or vendor name..."
                            className="w-full h-11 px-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs font-extrabold"
                          />
                        )}
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
                        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 text-xs font-extrabold">
                          {['ft', 'in'].map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setMjUnit(u)}
                              className={`flex-1 rounded-xl ${
                                mjUnit === u ? 'bg-orange-600 text-white' : 'text-slate-500'
                              }`}
                            >
                              {u === 'ft' ? 'Feet' : 'Inches'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Work Item + Quantity Multiplier Stepper */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={mjItem}
                          onChange={(e) => setMjItem(e.target.value)}
                          placeholder="Item (e.g. Wardrobe, Loft, TV Unit)"
                          className="flex-1 h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                        <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setMjQty((q) => Math.max(1, q - 1))}
                            className="w-7 h-8 rounded-xl text-sm font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                          >
                            −
                          </button>
                          <span className="px-2 text-xs font-black text-orange-600 dark:text-orange-400">
                            ×{mjQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMjQty((q) => q + 1)}
                            className="w-7 h-8 rounded-xl text-sm font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                          >
                            +
                          </button>
                        </div>
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
                          placeholder="₹ / ft²"
                          className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                        />
                      </div>

                      {/* Smart Rate Presets: ₹300, ₹200, ₹150 */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400 shrink-0">Rate:</span>
                        {RATE_PRESETS.map((rateVal) => {
                          const active = Number(mjRate) === rateVal;
                          return (
                            <button
                              key={rateVal}
                              type="button"
                              onClick={() => setMjRate(String(rateVal))}
                              className={`flex-1 h-9 rounded-xl text-xs font-extrabold border transition-all ${
                                active
                                  ? 'bg-orange-600 text-white border-orange-600'
                                  : 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20'
                              }`}
                            >
                              ₹{rateVal}/ft²
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 block">
                            {mjQty > 1 ? `${mjQty} pcs • ` : ''}{liveMajuriCalc.sqft} ft² @ ₹{mjRate || 0}
                          </span>
                          <span className="text-base font-black">{formatINR(liveMajuriCalc.amount)}</span>
                        </div>
                        <button
                          type="submit"
                          className="h-11 px-5 rounded-2xl bg-orange-600 text-white text-xs font-extrabold"
                        >
                          Save Work
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleSaveCarpenterAdvance} className="space-y-3">
                      <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        Direct advance payment paid to carpenter without room measurement.
                      </div>

                      <div className="space-y-2">
                        <select
                          value={advVendorSelect}
                          onChange={(e) => setAdvVendorSelect(e.target.value)}
                          className="w-full h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                        >
                          {majuriVendorOptions.map((vName) => (
                            <option key={vName} value={vName}>
                              Pay To: {vName}
                            </option>
                          ))}
                          <option value="__custom__">+ Add New Carpenter / Vendor...</option>
                        </select>

                        {advVendorSelect === '__custom__' && (
                          <input
                            type="text"
                            required
                            value={advCustomVendor}
                            onChange={(e) => setAdvCustomVendor(e.target.value)}
                            placeholder="Enter new carpenter or vendor name..."
                            className="w-full h-11 px-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-extrabold"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {[5000, 10000, 20000, 30000].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setAdvAmount(String((Number(advAmount) || 0) + chip))}
                            className="h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold"
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
                          className="h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                        />
                        <input
                          type="text"
                          value={advWeekLabel}
                          onChange={(e) => setAdvWeekLabel(e.target.value)}
                          placeholder="Label (e.g. Site Advance)"
                          className="h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={advMode}
                          onChange={(e) => setAdvMode(e.target.value)}
                          className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        >
                          <option value="UPI">UPI</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank</option>
                        </select>
                        <input
                          type="date"
                          value={advDate}
                          onChange={(e) => setAdvDate(e.target.value)}
                          className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={advSyncToBills}
                            onChange={(e) => setAdvSyncToBills(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                          <span>Sync to Bills &amp; Vendor Ledger</span>
                        </label>
                        <button
                          type="submit"
                          className="h-11 px-5 rounded-2xl bg-emerald-600 text-white text-xs font-extrabold"
                        >
                          Save Advance
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Measured Items List */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Measured Items ({filteredMajuriEntries.length})
                  </h3>
                  {filteredMajuriEntries.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl text-center text-xs font-bold text-slate-400">
                      No measured items yet — use &ldquo;+ Measure Work&rdquo; above.
                    </div>
                  ) : (
                    filteredMajuriEntries.map((m) => {
                      const room = MAJURI_ROOMS.find((r) => r.id === m.roomId);
                      const vName = m.vendorName || DEFAULT_CARPENTER_VENDOR;
                      const qtyText = m.qty && m.qty > 1 ? `${m.qty}× ` : '';
                      return (
                        <div
                          key={m.id}
                          className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-extrabold uppercase text-orange-600">
                                {room?.shortLabel}
                              </span>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500">
                                {vName}
                              </span>
                            </div>
                            <div className="text-xs font-extrabold truncate mt-0.5">{m.item}</div>
                            <div className="text-[11px] text-slate-400">
                              {qtyText}{m.height}{m.unit} × {m.width}{m.unit} = {m.sqft} ft² @ ₹{m.rate}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-sm font-black mr-0.5">{formatINR(m.amount)}</span>
                            <button
                              type="button"
                              onClick={() => handleRepeatMajuriEntry(m)}
                              title="Repeat / Duplicate Measurement"
                              className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center"
                            >
                              <CopyIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMajuriEntry(m.id)}
                              title="Delete Measurement"
                              className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Advance Payments (Without Measurement) History */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Advances Paid Without Measurement ({filteredCarpenterAdvances.length})
                  </h3>
                  {filteredCarpenterAdvances.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl text-center text-xs font-bold text-slate-400">
                      No advance payments logged yet.
                    </div>
                  ) : (
                    filteredCarpenterAdvances.map((a) => (
                      <div
                        key={a.id}
                        className="bg-white dark:bg-slate-800/90 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold truncate">{a.weekLabel}</span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                              {a.vendorName || DEFAULT_CARPENTER_VENDOR}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {a.date} • {a.mode} • Without measurement
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-black text-emerald-600">
                            {formatINR(a.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCarpenterAdvance(a.id)}
                            className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </main>

          {/* ================= 5-SLOT BOTTOM NAVIGATION WITH EMBEDDED (+) ================= */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-2 grid grid-cols-5 items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-colors ${
                activeTab === 'overview'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400'
              }`}
            >
              <LayoutGridIcon className="w-5 h-5" />
              <span className="text-[10px] font-extrabold mt-0.5">Home</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-colors ${
                activeTab === 'expenses'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400'
              }`}
            >
              <ReceiptIcon className="w-5 h-5" />
              <span className="text-[10px] font-extrabold mt-0.5">Bills</span>
            </button>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => openAddExpenseDrawer()}
                aria-label="Quick Add Bill"
                className="w-13 h-13 -mt-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/35 flex items-center justify-center active:scale-95 transition-transform"
              >
                <PlusIcon className="w-7 h-7" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('majuri')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-colors ${
                activeTab === 'majuri'
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-slate-400'
              }`}
            >
              <RulerIcon className="w-5 h-5" />
              <span className="text-[10px] font-extrabold mt-0.5">Majuri</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vendors')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-colors ${
                activeTab === 'vendors'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400'
              }`}
            >
              <HardHatIcon className="w-5 h-5" />
              <span className="text-[10px] font-extrabold mt-0.5">Vendors</span>
            </button>
          </nav>

          {/* ================= STREAMLINED 3-TAP ADD BILL DRAWER ================= */}
          {isAddDrawerOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <form
                onSubmit={handleSaveExpense}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">
                    {editingExpenseId ? 'Edit Bill' : 'Add Interior / Shopping Bill'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddDrawerOpen(false)}
                    className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Big Amount Input + Quick Chips */}
                <div className="space-y-2">
                  <div className="relative">
                    <span className="text-xl font-black text-indigo-600 absolute left-4 top-1/2 -translate-y-1/2">₹</span>
                    <input
                      type="number"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0"
                      className="w-full h-14 pl-10 pr-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl font-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                {/* Duplicate Bill Warning Banner */}
                {duplicateBillWarning && (
                  <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                    Heads up: A bill of {formatINR(duplicateBillWarning.amount)} for &ldquo;{duplicateBillWarning.vendor}&rdquo; already exists on {duplicateBillWarning.date}.
                  </div>
                )}

                {/* Visual Trade & Shopping Section Grid */}
                <div className="grid grid-cols-4 gap-1.5">
                  {INTERIOR_CATEGORIES.map((cat) => {
                    const CIcon = cat.icon;
                    const selected = formCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectDrawerCategory(cat.id)}
                        className={`p-2 rounded-2xl border flex flex-col items-center gap-1 text-center ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <CIcon className="w-4 h-4" />
                        <span className="text-[10px] font-extrabold truncate w-full">
                          {cat.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Context-Smart Item Presets for Selected Trade / Appliance */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Quick {activeCategoryObj.shortLabel} Items (Tap or Type Below)
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {activeCategoryObj.presets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setFormTitle(preset.label);
                          setFormCostType(preset.costType);
                        }}
                        className={`h-8 px-3 rounded-xl text-[11px] font-extrabold shrink-0 border ${
                          formTitle === preset.label
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editable Item Description */}
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={
                    formCategory === 'appliances'
                      ? 'Appliance name (e.g. Fan, Stove, Chimney, AC...)'
                      : `Item / Work description (${activeCategoryObj.shortLabel})`
                  }
                  className="w-full h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />

                {/* Payment Mode & Status */}
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
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {PAYMENT_STATUSES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Collapsible More Details */}
                <button
                  type="button"
                  onClick={() => setShowMoreBillFields(!showMoreBillFields)}
                  className="w-full h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-600 dark:text-slate-300"
                >
                  {showMoreBillFields
                    ? '− Hide Extra Details'
                    : formCategory === 'appliances'
                      ? '+ Store, EMI, Warranty & Bill Photo'
                      : '+ Vendor, Work Type, Date & Bill Photo'}
                </button>

                {showMoreBillFields && (
                  <div className="space-y-3 pt-1">
                    {formCategory === 'appliances' ? (
                      <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 space-y-2.5">
                        <div className="text-[11px] font-black text-cyan-700 dark:text-cyan-300">
                          Purchase Store, Payment Plan &amp; Warranty
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                          {PURCHASE_SOURCE_SUGGESTIONS.map((store) => (
                            <button
                              key={store}
                              type="button"
                              onClick={() => setFormVendor(store)}
                              className={`h-7 px-2.5 rounded-lg text-[10px] font-extrabold shrink-0 border ${
                                formVendor === store
                                  ? 'bg-cyan-600 text-white border-cyan-600'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {store}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={formVendor}
                          onChange={(e) => setFormVendor(e.target.value)}
                          placeholder="Where purchased? (Amazon, Croma, Local Shop...)"
                          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          {PAYMENT_PLANS.map((plan) => (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => setFormPaymentPlan(plan.id)}
                              className={`h-10 rounded-xl text-xs font-extrabold border ${
                                formPaymentPlan === plan.id
                                  ? 'bg-cyan-600 text-white border-cyan-600'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {plan.label}
                            </button>
                          ))}
                        </div>
                        {formPaymentPlan === 'EMI' && (
                          <input
                            type="text"
                            value={formEmiDetails}
                            onChange={(e) => setFormEmiDetails(e.target.value)}
                            placeholder="EMI details (e.g. 6 Months @ ₹3,500/mo, HDFC Card)"
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                          />
                        )}
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-cyan-700 dark:text-cyan-300 block">
                            Warranty Coverage
                          </span>
                          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                            {WARRANTY_OPTIONS.map((wOpt) => (
                              <button
                                key={wOpt}
                                type="button"
                                onClick={() => setFormWarrantyPeriod(wOpt)}
                                className={`h-7 px-2.5 rounded-lg text-[10px] font-extrabold shrink-0 border ${
                                  formWarrantyPeriod === wOpt
                                    ? 'bg-cyan-600 text-white border-cyan-600'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {wOpt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-4 gap-1.5">
                          {COST_TYPES.map((ct) => (
                            <button
                              key={ct.id}
                              type="button"
                              onClick={() => setFormCostType(ct.id)}
                              className={`h-9 rounded-xl text-[11px] font-extrabold border ${
                                formCostType === ct.id
                                  ? 'bg-orange-600 text-white border-orange-600'
                                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {ct.label}
                            </button>
                          ))}
                        </div>

                        {savedBillVendorSuggestions.length > 0 && (
                          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                            {savedBillVendorSuggestions.map((vName) => (
                              <button
                                key={vName}
                                type="button"
                                onClick={() => setFormVendor(vName)}
                                className={`h-7 px-2.5 rounded-lg text-[10px] font-extrabold shrink-0 border ${
                                  formVendor === vName
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {vName}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {formCategory !== 'appliances' ? (
                        <input
                          type="text"
                          value={formVendor}
                          onChange={(e) => setFormVendor(e.target.value)}
                          placeholder="Vendor / Contractor name"
                          className="h-11 px-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                        />
                      ) : (
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
                      )}
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="h-11 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>

                    <label className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-500 cursor-pointer">
                      <CameraIcon className="w-4 h-4 text-indigo-600" />
                      <span>{formReceipt ? 'Bill Photo Attached ✓' : 'Attach Bill / Warranty Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-13 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-600/25"
                >
                  {editingExpenseId ? 'Update Bill' : 'Save Bill'}
                </button>
              </form>
            </div>
          )}

          {/* ================= ADD VENDOR MODAL ================= */}
          {isVendorModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
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
                    <XIcon className="w-5 h-5" />
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
                  placeholder="Trade (e.g. False Ceiling, Plumber, Electrician)"
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
                    type="button"
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

          {/* ================= REPORT EXPORT MODAL ================= */}
          {isExportModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Download Statements
                    </span>
                    <h3 className="text-lg font-black">Export Interior &amp; Majuri Report</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Total Spent</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">
                      {formatINR(analytics.totalSpent)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Carpentry Majuri Work</span>
                    <span className="font-black text-orange-600">
                      {formatINR(majuriSummary.totalWorkBill)} ({majuriSummary.totalSqft} ft²)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handlePrintGraphicalPDF}
                    className="h-13 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
                  >
                    <PrinterIcon className="w-4 h-4" />
                    <span>Save PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="h-13 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <SpreadsheetIcon className="w-4 h-4" />
                    <span>Excel CSV</span>
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