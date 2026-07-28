'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import * as LucideIcons from 'lucide-react';
import { getIpLocation, calculateDistance, DEFAULT_COORDS } from '@/lib/location';

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

// Safe Icon Lookup Map to avoid shadowing browser globals like Image, Option, etc.
const ICON_MAP: Record<string, IconComponent> = {
  'aadhaar': LucideIcons.UserCheck,
  'voter': LucideIcons.User,
  'passport': LucideIcons.ShieldCheck,
  'birth': LucideIcons.FileText,
  'caste': LucideIcons.Scale,
  'income': LucideIcons.CreditCard,
  'driving': LucideIcons.Car,
  'property': LucideIcons.Home,
  'health': LucideIcons.HeartPulse,
  'kisan': LucideIcons.Sprout,
  'scholarship': LucideIcons.GraduationCap,
  'water': LucideIcons.Droplets,
  'electric': LucideIcons.Zap,
  'pan': LucideIcons.CreditCard,
  'marriage': LucideIcons.Users,
  'trade': LucideIcons.Briefcase,
  'search': LucideIcons.Search,
  'chevron-left': LucideIcons.ChevronLeft,
  'chevron-right': LucideIcons.ChevronRight,
  'x': LucideIcons.X,
  'external': LucideIcons.ExternalLink,
  'info': LucideIcons.Info,
  'upload': LucideIcons.Upload,
  'check': LucideIcons.CheckCircle2,
  'calendar': LucideIcons.Calendar,
  'clock': LucideIcons.Clock,
  'map-pin': LucideIcons.MapPin,
  'building': LucideIcons.Building2,
  'alert': LucideIcons.AlertTriangle,
  'arrow-right': LucideIcons.ArrowRight,
  'layout-dashboard': LucideIcons.LayoutDashboard,
  'clipboard-list': LucideIcons.ClipboardList,
  'user-cog': LucideIcons.UserCog,
  'bar-chart': LucideIcons.BarChart3,
  'bell-ring': LucideIcons.BellRing,
  'shield': LucideIcons.ShieldCheck,
  'users': LucideIcons.Users,
  'digilocker': LucideIcons.CloudLightning,
  'msme': LucideIcons.Building2,
  'cyber': LucideIcons.ShieldAlert,
  'digital': LucideIcons.Globe
};

type RoleView = 'user' | 'admin';

type ServiceOption = {
  id: string;
  label: string;
  docs: string[];
  totalTime: string;
};

type ServiceCenter = {
  id: string;
  name: string;
  location: string;
  distance: string;
  staff: string;
  lat?: number;
  lng?: number;
};

type CitizenService = {
  id: string;
  category: string;
  title: string;
  description: string;
  iconKey: string;
  color: string;
  bg: string;
  details: string;
  portalUrl: string;
  officeTime: string;
  options: ServiceOption[];
};

type AdminService = {
  id: string;
  category: string;
  title: string;
  description: string;
  iconKey: string;
  color: string;
  bg: string;
  href: string;
  action: string;
};

const getRoleView = (role?: string): RoleView => {
  const normalizedRole = role?.toUpperCase();
  return normalizedRole === 'ADMIN' || normalizedRole === 'STAFF' || normalizedRole === 'OFFICER' ? 'admin' : 'user';
};

const getCategories = (services: { category: string }[]) => ['All', ...Array.from(new Set(services.map(service => service.category)))];

function RenderIcon({ name, size = 24, className = "" }: { name: string, size?: number, className?: string }) {
  const IconComp = ICON_MAP[name] || ICON_MAP['info'];
  return <IconComp size={size} className={className} />;
}

const CENTERS: ServiceCenter[] = [
  { id: 'c1', name: 'Zonal Office - South Delhi', location: 'Saket', distance: '2.4 km', staff: 'Officer Rajesh Kumar' },
  { id: 'c2', name: 'Passport Seva Kendra (PSK)', location: 'R.K. Puram', distance: '4.8 km', staff: 'Officer Meera Singh' },
  { id: 'c3', name: 'Citizen Resource Center', location: 'Okhla Phase III', distance: '1.2 km', staff: 'Officer Amit Sharma' },
  { id: 'c4', name: 'Municipal HQ', location: 'Civic Center', distance: '8.5 km', staff: 'Officer Sunita Rao' }
];

const CENTERS_WITH_COORDS = [
  { id: 'c1', name: 'Zonal Office - South Delhi', location: 'Saket', lat: 28.5276, lng: 77.2197, staff: 'Officer Rajesh Kumar' },
  { id: 'c2', name: 'Passport Seva Kendra (PSK)', location: 'R.K. Puram', lat: 28.5708, lng: 77.1770, staff: 'Officer Meera Singh' },
  { id: 'c3', name: 'Citizen Resource Center', location: 'Okhla Phase III', lat: 28.5442, lng: 77.2721, staff: 'Officer Amit Sharma' },
  { id: 'c4', name: 'Municipal HQ', location: 'Civic Center', lat: 28.6369, lng: 77.2246, staff: 'Officer Sunita Rao' }
];

const SERVICES: CitizenService[] = [
  { 
    id: 'aadhaar', 
    category: 'Identity',
    title: 'Aadhaar Services', 
    description: 'Update identity data at the nearest enrollment center.', 
    iconKey: 'aadhaar', 
    color: 'text-blue-600', 
    bg: 'bg-blue-50',
    details: 'UIDAI Demographic and Biometric updates.',
    portalUrl: 'https://myaadhaar.uidai.gov.in/',
    officeTime: '45 mins',
    options: [
      { id: 'name', label: 'Name Update', docs: ['Gazette Copy', 'Passport'], totalTime: '7 Days' },
      { id: 'address', label: 'Address Update', docs: ['Rent Agreement', 'Utility Bill'], totalTime: '5 Days' },
      { id: 'bio', label: 'Biometric Update', docs: ['Original Aadhaar'], totalTime: '3 Days' }
    ]
  },
  { 
    id: 'voter', 
    category: 'Identity',
    title: 'Voter ID (EPIC)', 
    description: 'Apply for new Voter ID or request changes.', 
    iconKey: 'voter', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-50',
    details: 'Election Commission of India voter registration.',
    portalUrl: 'https://voters.eci.gov.in/',
    officeTime: '20 mins',
    options: [
      { id: 'new', label: 'New Enrollment', docs: ['Age Proof', 'Address Proof'], totalTime: '20 Days' },
      { id: 'correction', label: 'Correction', docs: ['Identity Proof', 'Supporting Doc'], totalTime: '15 Days' }
    ]
  },
  { 
    id: 'passport', 
    category: 'Identity',
    title: 'Passport Seva', 
    description: 'Apply for fresh passport or renewal.', 
    iconKey: 'passport', 
    color: 'text-navy', 
    bg: 'bg-navy/5',
    details: 'Ministry of External Affairs Passport services.',
    portalUrl: 'https://www.passportindia.gov.in/',
    officeTime: '1.5 hours',
    options: [
      { id: 'fresh', label: 'Fresh Passport', docs: ['Birth Certificate', 'Address Proof'], totalTime: '20 Days' },
      { id: 'reissue', label: 'Re-issue Passport', docs: ['Old Passport Copy'], totalTime: '15 Days' }
    ]
  },
  { 
    id: 'birth', 
    category: 'Certificates',
    title: 'Birth Certificate', 
    description: 'Register new birth or get a duplicate.', 
    iconKey: 'birth', 
    color: 'text-orange-600', 
    bg: 'bg-orange-50',
    details: 'Compulsory registration of births.',
    portalUrl: 'https://crsorgi.gov.in/',
    officeTime: '15 mins',
    options: [
      { id: 'new', label: 'New Registration', docs: ['Hospital Discharge', 'Parent IDs'], totalTime: '7 Days' },
      { id: 'copy', label: 'Duplicate Copy', docs: ['Ref No / Old Copy'], totalTime: '2 Days' }
    ]
  },
  { 
    id: 'caste', 
    category: 'Certificates',
    title: 'Caste Certificate', 
    description: 'Official proof of caste (SC/ST/OBC).', 
    iconKey: 'caste', 
    color: 'text-purple-600', 
    bg: 'bg-purple-50',
    details: 'Revenue department caste verification.',
    portalUrl: 'https://edistrict.delhigovt.nic.in/',
    officeTime: '30 mins',
    options: [
      { id: 'scst', label: 'SC/ST Certificate', docs: ['Paternal Proof', 'Voter ID'], totalTime: '30 Days' },
      { id: 'obc', label: 'OBC Certificate', docs: ['Caste Proof', 'Income Proof'], totalTime: '30 Days' }
    ]
  },
  { 
    id: 'income', 
    category: 'Certificates',
    title: 'Income Certificate', 
    description: 'Proof of annual income for schemes.', 
    iconKey: 'income', 
    color: 'text-green-600', 
    bg: 'bg-green-50',
    details: 'Income verification for subsidies.',
    portalUrl: 'https://edistrict.delhigovt.nic.in/',
    officeTime: '30 mins',
    options: [
      { id: 'new', label: 'Fresh Certificate', docs: ['Salary Slip', 'Self Dec'], totalTime: '15 Days' }
    ]
  },
  { 
    id: 'driving', 
    category: 'Transport',
    title: 'Driving License', 
    description: 'Apply for Learner or Permanent DL.', 
    iconKey: 'driving', 
    color: 'text-rose-600', 
    bg: 'bg-rose-50',
    details: 'Sarathi portal license services.',
    portalUrl: 'https://sarathi.parivahan.gov.in/',
    officeTime: '2 hours',
    options: [
      { id: 'learner', label: 'Learner License', docs: ['Age Proof', 'Address Proof'], totalTime: 'Same Day' },
      { id: 'permanent', label: 'Permanent DL', docs: ['Learner License', 'Form 1'], totalTime: '15 Days' }
    ]
  },
  { 
    id: 'property', 
    category: 'Property',
    title: 'Property Tax', 
    description: 'Pay taxes or apply for property mutation.', 
    iconKey: 'property', 
    color: 'text-[#138808]', 
    bg: 'bg-[#138808]/10',
    details: 'Municipal real estate services.',
    portalUrl: 'https://mcdonline.nic.in/',
    officeTime: '30 mins',
    options: [
      { id: 'tax', label: 'Tax Payment', docs: ['Property ID', 'Receipt'], totalTime: 'Instant' },
      { id: 'mutation', label: 'Mutation', docs: ['Sale Deed', 'ID Proof'], totalTime: '45 Days' }
    ]
  },
  { 
    id: 'health', 
    category: 'Healthcare',
    title: 'Ayushman Bharat', 
    description: 'Health insurance card (PM-JAY).', 
    iconKey: 'health', 
    color: 'text-red-600', 
    bg: 'bg-red-50',
    details: 'National health insurance coverage.',
    portalUrl: 'https://setu.pmjay.gov.in/',
    officeTime: '20 mins',
    options: [
      { id: 'card', label: 'PM-JAY Card', docs: ['Ration Card', 'Aadhaar'], totalTime: '2 Days' },
      { id: 'abha', label: 'Create ABHA ID', docs: ['Aadhaar'], totalTime: 'Instant' }
    ]
  },
  { 
    id: 'kisan', 
    category: 'Welfare',
    title: 'PM-Kisan', 
    description: 'Support for farmers and land records.', 
    iconKey: 'kisan', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    details: 'Direct benefit transfer for farmers.',
    portalUrl: 'https://pmkisan.gov.in/',
    officeTime: '30 mins',
    options: [
      { id: 'new', label: 'Farmer Registration', docs: ['Land Records', 'Bank Passbook'], totalTime: '30 Days' }
    ]
  },
  { 
    id: 'scholarship', 
    category: 'Welfare',
    title: 'Scholarships', 
    description: 'National and State scholarship portal.', 
    iconKey: 'scholarship', 
    color: 'text-amber-600', 
    bg: 'bg-amber-50',
    details: 'Education support for students.',
    portalUrl: 'https://scholarships.gov.in/',
    officeTime: 'Online Only',
    options: [
      { id: 'new', label: 'Apply Fresh', docs: ['Marksheet', 'Income Cert'], totalTime: '60 Days' }
    ]
  },
  { 
    id: 'water', 
    category: 'Utilities',
    title: 'Water Connection', 
    description: 'New tap connection or billing.', 
    iconKey: 'water', 
    color: 'text-sky-600', 
    bg: 'bg-sky-50',
    details: 'Municipal water services.',
    portalUrl: 'https://delhijalboard.nic.in/',
    officeTime: '40 mins',
    options: [
      { id: 'new', label: 'New Connection', docs: ['Property Proof', 'ID Proof'], totalTime: '15 Days' }
    ]
  },
  { 
    id: 'electric', 
    category: 'Utilities',
    title: 'Electricity Load', 
    description: 'Load change or new meter connection.', 
    iconKey: 'electric', 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50',
    details: 'Power supply services.',
    portalUrl: 'https://www.bsesdelhi.com/',
    officeTime: '30 mins',
    options: [
      { id: 'load', label: 'Change Load', docs: ['Last Bill', 'Equipment List'], totalTime: '7 Days' }
    ]
  },
  { 
    id: 'pan', 
    category: 'Financial',
    title: 'PAN Card', 
    description: 'New PAN application or update.', 
    iconKey: 'pan', 
    color: 'text-zinc-600', 
    bg: 'bg-zinc-50',
    details: 'Permanent Account Number for tax.',
    portalUrl: 'https://www.pan.utiitsl.com/',
    officeTime: '10 mins',
    options: [
      { id: 'new', label: 'Apply Fresh', docs: ['Aadhaar', 'Photo'], totalTime: '10 Days' }
    ]
  },
  { 
    id: 'marriage', 
    category: 'Certificates',
    title: 'Marriage Reg.', 
    description: 'Legal registration of marriage.', 
    iconKey: 'marriage', 
    color: 'text-pink-600', 
    bg: 'bg-pink-50',
    details: 'Marriage Act registration.',
    portalUrl: 'https://edistrict.delhigovt.nic.in/',
    officeTime: '1 hour',
    options: [
      { id: 'new', label: 'Register Marriage', docs: ['ID of Both', 'Witness IDs', 'Photo'], totalTime: '30 Days' }
    ]
  },
  { 
    id: 'trade', 
    category: 'Business',
    title: 'Trade License', 
    description: 'License for shops and commercial units.', 
    iconKey: 'trade', 
    color: 'text-slate-600', 
    bg: 'bg-slate-50',
    details: 'Municipal trade permits.',
    portalUrl: 'https://mcdonline.nic.in/',
    officeTime: '45 mins',
    options: [
      { id: 'new', label: 'New License', docs: ['Rent Deed', 'NOC', 'Photo'], totalTime: '15 Days' }
    ]
  },
  { 
    id: 'digilocker', 
    category: 'Digital Governance',
    title: 'DigiLocker Services', 
    description: 'Access and share authentic digital documents instantly.', 
    iconKey: 'digilocker', 
    color: 'text-cyan-600', 
    bg: 'bg-cyan-50',
    details: 'MeitY cloud document verification.',
    portalUrl: 'https://www.digilocker.gov.in/',
    officeTime: 'Online Only',
    options: [
      { id: 'fetch', label: 'Retrieve Document', docs: ['Aadhaar', 'Mobile Link'], totalTime: 'Instant' },
      { id: 'upload', label: 'Upload Self-Attested', docs: ['PDF/Image file'], totalTime: 'Instant' }
    ]
  },
  { 
    id: 'udyam', 
    category: 'Digital Governance',
    title: 'Udyam MSME', 
    description: 'Register micro, small, and medium businesses online.', 
    iconKey: 'msme', 
    color: 'text-purple-600', 
    bg: 'bg-purple-50',
    details: 'Ministry of MSME official registry.',
    portalUrl: 'https://udyamregistration.gov.in/',
    officeTime: '10 mins',
    options: [
      { id: 'register', label: 'MSME Registration', docs: ['Aadhaar', 'PAN', 'GSTIN (optional)'], totalTime: '2 Days' }
    ]
  },
  { 
    id: 'cybercrime', 
    category: 'Digital Governance',
    title: 'Cyber Crime Desk', 
    description: 'Report financial frauds, identity thefts, or online harassment.', 
    iconKey: 'cyber', 
    color: 'text-red-600', 
    bg: 'bg-red-50',
    details: 'National Cyber Crime Reporting Portal.',
    portalUrl: 'https://cybercrime.gov.in/',
    officeTime: '15 mins',
    options: [
      { id: 'report', label: 'File Cyber Complaint', docs: ['Transaction Proof', 'ID Proof', 'Evidence Screenshot'], totalTime: '24 Hours' }
    ]
  },
  { 
    id: 'mygov', 
    category: 'Digital Governance',
    title: 'MyGov Engagement', 
    description: 'Participate in policymaking, survey polls, and citizen discussions.', 
    iconKey: 'digital', 
    color: 'text-orange-600', 
    bg: 'bg-orange-50',
    details: 'Direct citizen-government dialogue platform.',
    portalUrl: 'https://www.mygov.in/',
    officeTime: 'Online Only',
    options: [
      { id: 'poll', label: 'Participate in Poll', docs: ['Mobile Number'], totalTime: 'Instant' }
    ]
  }
];

const ADMIN_SERVICES: AdminService[] = [
  {
    id: 'admin-dashboard',
    category: 'Governance',
    title: 'Operations Dashboard',
    description: 'Monitor complaint volume, pending work, resolutions, and citizen activity.',
    iconKey: 'layout-dashboard',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    href: '/admin/dashboard',
    action: 'Open Dashboard'
  },
  {
    id: 'issue-queue',
    category: 'Resolution',
    title: 'Issue Resolution Queue',
    description: 'Review citizen reports, move cases into progress, close issues, or reopen them.',
    iconKey: 'clipboard-list',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    href: '/admin/queue',
    action: 'Manage Queue'
  },
  {
    id: 'service-applications',
    category: 'Services',
    title: 'Service Applications',
    description: 'Track service bookings, appointment readiness, and document verification queues.',
    iconKey: 'briefcase',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    href: '/admin/dashboard',
    action: 'Review Requests'
  },
  {
    id: 'service-centers',
    category: 'Centers',
    title: 'Service Center Control',
    description: 'Coordinate center load, staff availability, service windows, and field coverage.',
    iconKey: 'building',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    href: '/admin/dashboard',
    action: 'View Centers'
  },
  {
    id: 'citizen-support',
    category: 'Support',
    title: 'Citizen Support Desk',
    description: 'Review citizen assistance needs, escalations, reminders, and public notices.',
    iconKey: 'bell-ring',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    href: '/admin/queue',
    action: 'Open Desk'
  },
  {
    id: 'staff-access',
    category: 'Governance',
    title: 'Role & Staff Oversight',
    description: 'Keep admin work separated from citizen services with role-scoped access.',
    iconKey: 'user-cog',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    href: '/admin/dashboard',
    action: 'Review Access'
  }
];

const TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM"
];

const PUBLIC_HOLIDAYS = [
  '2024-01-26', '2024-03-25', '2024-08-15', '2024-10-02', '2024-10-31', '2024-12-25',
  '2025-01-26', '2025-08-15', '2025-10-02', '2025-12-25'
];

export default function ServicesPage() {
  const router = useRouter();
  const [centers, setCenters] = useState<ServiceCenter[]>(CENTERS);
  const [activeMapCenter, setActiveMapCenter] = useState<ServiceCenter | null>(null);
  const [activeCity, setActiveCity] = useState<string>('Delhi');
  const { user } = useAuthStore();

  const getCityFromCoords = (lat: number, lng: number): string => {
    // Chennai: lat ~ 13.08, lng ~ 80.27
    if (Math.abs(lat - 13.08) < 1.5 && Math.abs(lng - 80.27) < 1.5) {
      return 'chennai';
    }
    // Mumbai: lat ~ 19.07, lng ~ 72.87
    if (Math.abs(lat - 19.07) < 1.5 && Math.abs(lng - 72.87) < 1.5) {
      return 'mumbai';
    }
    // Bengaluru: lat ~ 12.97, lng ~ 77.59
    if (Math.abs(lat - 12.97) < 1.5 && Math.abs(lng - 77.59) < 1.5) {
      return 'bengaluru';
    }
    // Delhi: lat ~ 28.61, lng ~ 77.20
    if (Math.abs(lat - 28.61) < 2.0 && Math.abs(lng - 77.20) < 2.0) {
      return 'delhi';
    }
    return 'delhi'; // Default fallback
  };

  const getLocalizedCenter = (centerId: string, city?: string) => {
    const normalizedCity = city?.trim() || 'Delhi';
    const capitalizedCity = normalizedCity.charAt(0).toUpperCase() + normalizedCity.slice(1).toLowerCase();
    const cityLower = normalizedCity.toLowerCase();
    
    if (cityLower.includes('chennai')) {
      switch (centerId) {
        case 'c1': return { name: 'Zonal Office - South Chennai', location: 'Guindy', staff: 'Officer Ramesh Kumar' };
        case 'c2': return { name: 'Passport Seva Kendra (PSK)', location: 'Aminjikarai', staff: 'Officer M. Selvam' };
        case 'c3': return { name: 'Citizen Resource Center', location: 'T. Nagar', staff: 'Officer K. Priya' };
        case 'c4': return { name: 'Municipal HQ', location: 'Ripon Building', staff: 'Officer S. Anbarasan' };
      }
    }
    
    if (cityLower.includes('mumbai')) {
      switch (centerId) {
        case 'c1': return { name: 'Zonal Office - South Mumbai', location: 'Colaba', staff: 'Officer Amit Patil' };
        case 'c2': return { name: 'Passport Seva Kendra (PSK)', location: 'Lower Parel', staff: 'Officer Priya Sharma' };
        case 'c3': return { name: 'Citizen Resource Center', location: 'Andheri West', staff: 'Officer Rahul Deshmukh' };
        case 'c4': return { name: 'Municipal HQ', location: 'BMC Headquarters', staff: 'Officer V. Kulkarni' };
      }
    }

    if (cityLower.includes('bengaluru') || cityLower.includes('bangalore')) {
      switch (centerId) {
        case 'c1': return { name: 'Zonal Office - South Bengaluru', location: 'Jayanagar', staff: 'Officer H. Gowda' };
        case 'c2': return { name: 'Passport Seva Kendra (PSK)', location: 'Lalbagh', staff: 'Officer Lakshmi Rao' };
        case 'c3': return { name: 'Citizen Resource Center', location: 'Koramangala', staff: 'Officer N. Kumar' };
        case 'c4': return { name: 'Municipal HQ', location: 'BBMP Offices', staff: 'Officer S. Murthy' };
      }
    }

    // Dynamic generation for any other city!
    switch (centerId) {
      case 'c1': return { name: `Zonal Office - South ${capitalizedCity}`, location: 'Metro Area', staff: 'Officer Rajesh Kumar' };
      case 'c2': return { name: `Passport Seva Kendra (PSK) - ${capitalizedCity}`, location: 'Central Town', staff: 'Officer Meera Singh' };
      case 'c3': return { name: `Citizen Resource Center - ${capitalizedCity}`, location: 'Civic Hub', staff: 'Officer Amit Sharma' };
      case 'c4': return { name: `Municipal HQ - ${capitalizedCity}`, location: 'City Center', staff: 'Officer Sunita Rao' };
      default: return { name: 'Local Citizen Desk', location: 'Central Ward', staff: 'Officer A. K. Azad' };
    }
  };

  useEffect(() => {
    async function resolveCenters() {
      const ipstackKey = process.env.NEXT_PUBLIC_IPSTACK_API_KEY;
      let coords = DEFAULT_COORDS;
      let detectedCity = user?.city || 'Delhi';
      
      const cityCoords: Record<string, typeof DEFAULT_COORDS> = {
        chennai: { latitude: 13.0827, longitude: 80.2707 },
        mumbai: { latitude: 19.0760, longitude: 72.8777 },
        bengaluru: { latitude: 12.9716, longitude: 77.5946 },
        bangalore: { latitude: 12.9716, longitude: 77.5946 },
        delhi: { latitude: 28.6139, longitude: 77.2090 },
      };

      // 1. Check if user city matches defaults to initialize coordinates
      const cityKey = detectedCity.trim().toLowerCase();
      if (cityCoords[cityKey]) {
        coords = cityCoords[cityKey];
      }

      // 2. Try fetching coordinates and city from free public IP API (more reliable for city lookup)
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            coords = { latitude: data.latitude, longitude: data.longitude };
            if (data.city) {
              detectedCity = data.city;
            }
          }
        }
      } catch (err) {
        console.warn('ipapi.co failed:', err);
      }

      // 3. Try browser geolocation
      if (typeof window !== 'undefined' && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          detectedCity = getCityFromCoords(coords.latitude, coords.longitude);
        } catch {
          // If GPS fails, and IP API also failed, try IPstack fallback
          if (coords === DEFAULT_COORDS && ipstackKey) {
            try {
              const ipLocation = await getIpLocation(ipstackKey);
              coords = { latitude: ipLocation.latitude, longitude: ipLocation.longitude };
              if (ipLocation.city) {
                detectedCity = ipLocation.city;
              }
            } catch (err) {
              console.warn('IPstack failed:', err);
            }
          }
        }
      }

      // Project centers within 25km using small lat/lng offsets from current coords
      const offsets = [
        { id: 'c1', latOff: -0.015, lngOff: -0.02 },
        { id: 'c2', latOff: 0.02, lngOff: -0.03 },
        { id: 'c3', latOff: 0.008, lngOff: 0.01 },
        { id: 'c4', latOff: 0.04, lngOff: 0.04 }
      ];

      const calculated = offsets.map(offset => {
        const localized = getLocalizedCenter(offset.id, detectedCity);
        const centerLat = coords.latitude + offset.latOff;
        const centerLng = coords.longitude + offset.lngOff;
        const dist = calculateDistance(coords.latitude, coords.longitude, centerLat, centerLng);
        
        return {
          id: offset.id,
          name: localized.name,
          location: localized.location,
          distance: `${dist.toFixed(1)} km`,
          staff: localized.staff,
          lat: centerLat,
          lng: centerLng
        };
      }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

      setCenters(calculated);
      if (calculated.length > 0) {
        setActiveMapCenter(calculated[0]);
        setSelectedCenter(calculated[0]);
      }
      const formattedCity = detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1).toLowerCase();
      setActiveCity(formattedCity);
    }
    resolveCenters();
  }, [user]);
  const roleView = getRoleView(user?.role);
  const serviceCatalog = roleView === 'admin' ? ADMIN_SERVICES : SERVICES;
  const categories = getCategories(serviceCatalog);
  const pageCopy = roleView === 'admin'
    ? {
        title: 'Admin Services',
        accent: 'Control Center',
        description: 'Access staff tools for issue resolution, service operations, citizen support, and governance oversight.',
        badge: 'Admin Role'
      }
    : {
        title: 'User Services',
        accent: 'Gateway',
        description: 'Access government services through a single window. Locate centers, book slots, and track delivery.',
        badge: 'User Role'
      };
  
  const [selectedService, setSelectedService] = useState<CitizenService | null>(null);
  const [selectedOption, setSelectedOption] = useState<ServiceOption | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<ServiceCenter | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleCityChange = (city: string) => {
    setActiveCity(city);
    
    const cityCoords: Record<string, typeof DEFAULT_COORDS> = {
      Delhi: { latitude: 28.6139, longitude: 77.2090 },
      Chennai: { latitude: 13.0827, longitude: 80.2707 },
      Mumbai: { latitude: 19.0760, longitude: 72.8777 },
      Bengaluru: { latitude: 12.9716, longitude: 77.5946 },
    };

    const coords = cityCoords[city] || DEFAULT_COORDS;
    
    const offsets = [
      { id: 'c1', latOff: -0.015, lngOff: -0.02 },
      { id: 'c2', latOff: 0.02, lngOff: -0.03 },
      { id: 'c3', latOff: 0.008, lngOff: 0.01 },
      { id: 'c4', latOff: 0.04, lngOff: 0.04 }
    ];

    const calculated = offsets.map(offset => {
      const localized = getLocalizedCenter(offset.id, city);
      const centerLat = coords.latitude + offset.latOff;
      const centerLng = coords.longitude + offset.lngOff;
      const dist = calculateDistance(coords.latitude, coords.longitude, centerLat, centerLng);
      
      return {
        id: offset.id,
        name: localized.name,
        location: localized.location,
        distance: `${dist.toFixed(1)} km`,
        staff: localized.staff,
        lat: centerLat,
        lng: centerLng
      };
    }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    setCenters(calculated);
    if (calculated.length > 0) {
      setActiveMapCenter(calculated[0]);
      setSelectedCenter(calculated[0]);
    }
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState({ date: '', slot: '' });
  const [refId, setRefId] = useState('');
  const [holidayError, setHolidayError] = useState('');
  const currentCategory = categories.includes(activeCategory) ? activeCategory : 'All';

  const checkHoliday = (dateString: string) => {
    if (!dateString) return;
    const date = new Date(dateString);
    const day = date.getDay(); // 0 is Sunday
    
    if (day === 0) {
      setHolidayError('Centers are closed on Sundays. Please pick another day.');
      return;
    }
    if (PUBLIC_HOLIDAYS.includes(dateString)) {
      setHolidayError('This is a Gazetted Public Holiday. Centers will be closed.');
      return;
    }
    setHolidayError('');
  };

  const filteredServices = serviceCatalog.filter(s => 
    (currentCategory === 'All' || s.category === currentCategory) &&
    (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedService || !selectedOption) return;
    
    setLoading(true);
    
    try {
      const response = await api.post('/services/applications', {
        serviceId: selectedService.id,
        subServiceId: selectedOption.id,
        serviceCenterId: selectedCenter?.id || null,
        applicantName: user.name,
        applicantPhone: user.phone || '9999999999',
        appointmentDate: appointment.date || null,
        appointmentSlot: appointment.slot || null,
        data: {
          subService: selectedOption.label,
          serviceTitle: selectedService.title,
          centerName: selectedCenter?.name || 'N/A',
          officeTime: selectedService.officeTime,
          totalTime: selectedOption.totalTime,
          submittedAt: new Date().toISOString()
        }
      });

      setRefId(response.data.referenceId);
      setStep(2);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Application failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedService(null);
    setSelectedOption(null);
    setSelectedCenter(null);
    setStep(1);
    setAppointment({ date: '', slot: '' });
    setHolidayError('');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-20">
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-[#000080]">
            <RenderIcon name="chevron-left" />
          </button>
          <h1 className="text-xl font-bold text-[#000080]">Digital India Portal</h1>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Header */}
        <div className="mb-12 text-center space-y-6">
           <div className="inline-flex items-center gap-2 bg-white border border-zinc-100 rounded-full px-5 py-2 shadow-sm text-[#000080]">
             <RenderIcon name={roleView === 'admin' ? 'shield' : 'user'} size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Role</span>
             <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FF9933]">{pageCopy.badge}</span>
           </div>
           <h2 className="text-5xl font-black text-[#000080] tracking-tight">{pageCopy.title} <span className="text-[#FF9933]">{pageCopy.accent}</span></h2>
           <p className="text-zinc-500 text-lg max-w-2xl mx-auto">{pageCopy.description}</p>
           
           <div className="max-w-3xl mx-auto pt-6">
              <div className="relative group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FF9933] transition-colors">
                  <RenderIcon name="search" size={28} />
                </div>
                <input 
                  type="text" 
                  placeholder={roleView === 'admin' ? 'Search queue, dashboard, staff, center...' : 'Search Identity, Transport, Property, Health...'}
                  className="w-full bg-white border-2 border-zinc-100 rounded-[2.5rem] py-8 pl-20 pr-8 focus:ring-12 focus:ring-[#FF9933]/5 focus:border-[#FF9933] outline-none transition-all shadow-2xl font-bold text-xl placeholder:text-zinc-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
           </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                currentCategory === cat 
                ? 'bg-[#000080] text-white border-[#000080] shadow-2xl shadow-navy/20 translate-y-[-2px]' 
                : 'bg-white text-zinc-400 border-zinc-50 hover:border-[#FF9933] hover:text-[#FF9933]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredServices.map((service) => (
            <div 
              key={service.id} 
              onClick={() => {
                if ('href' in service) {
                  router.push(service.href);
                  return;
                }
                setSelectedService(service);
                setStep(1);
              }}
              className="bg-white rounded-[3rem] p-10 border border-zinc-50 hover:border-[#000080]/30 hover:shadow-2xl transition-all group cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-[400px]"
            >
              <div>
                <div className={`w-20 h-20 ${service.bg} ${service.color} rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-sm ring-8 ring-transparent group-hover:ring-zinc-50`}>
                  <RenderIcon name={service.iconKey} size={40} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF9933] mb-2 block">{service.category}</span>
                <h3 className="text-2xl font-black text-[#000080] mb-4 group-hover:text-[#FF9933] transition-colors leading-tight">{service.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3">{service.description}</p>
              </div>
              
              <div className="flex items-center justify-between pt-8 border-t border-zinc-50">
                <div className="flex items-center gap-2 text-[#000080] font-black text-[10px] uppercase tracking-[0.2em]">
                  {'action' in service ? service.action : 'Book Center'} <RenderIcon name="arrow-right" size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
                <div className="text-[10px] font-black text-zinc-200 tracking-widest uppercase">Verified</div>
              </div>
              <div className={`absolute -right-8 -bottom-8 w-32 h-32 ${service.bg} rounded-full opacity-0 group-hover:opacity-20 transition-opacity blur-3xl`}></div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="bg-white border border-zinc-100 rounded-[2rem] p-12 text-center shadow-sm">
            <p className="text-[#000080] font-black text-xl">No services found</p>
            <p className="text-zinc-500 mt-2">Try a different search or category.</p>
          </div>
        )}
      </main>

      {/* Multi-Step Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-12">
          <div className="absolute inset-0 bg-[#000080]/90 backdrop-blur-3xl animate-fade-in" onClick={closeModal}></div>
          
          <div className="bg-white w-full max-w-5xl rounded-[4rem] overflow-hidden shadow-2xl relative z-10 animate-scale-up border border-white/20">
            {/* Modal Header */}
            <div className="bg-[#000080] p-10 text-white relative overflow-hidden">
               <button onClick={closeModal} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20">
                <RenderIcon name="x" size={24} />
              </button>
              
              <div className="relative z-10 flex items-center gap-8">
                <div className={`w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center ${selectedService.color} shadow-2xl shrink-0`}>
                  <RenderIcon name={selectedService.iconKey} size={40} />
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF9933]">{selectedService.category} Gateway</span>
                      <span className="text-white/20">•</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{step === 1 ? 'Booking Form' : 'Success'}</span>
                   </div>
                   <h3 className="text-3xl font-black">{selectedService.title}</h3>
                </div>
              </div>
              <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {/* Step 1: Unified Booking Form */}
              {step === 1 && (
                <div className="animate-fade-in space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Details, Service Option, Date/Time, checklist */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Briefing */}
                      <div className="bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100/50 text-left">
                        <p className="text-zinc-600 text-sm leading-relaxed font-bold">{selectedService.details}</p>
                      </div>

                      {/* Select Option */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2 block text-left">Select Service Type *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedService.options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedOption(opt)}
                              className={`p-5 rounded-[2rem] border-2 transition-all text-left flex items-start gap-4 ${
                                selectedOption?.id === opt.id
                                  ? 'border-[#FF9933] bg-orange-50/10 shadow-sm'
                                  : 'border-zinc-100 bg-white hover:border-zinc-300'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border mt-0.5 text-xs ${
                                selectedOption?.id === opt.id
                                  ? 'border-[#FF9933] bg-[#FF9933] text-white font-bold'
                                  : 'border-zinc-200 bg-white text-transparent'
                              }`}>
                                ✓
                              </div>
                              <div>
                                <p className="font-black text-base text-[#000080]">{opt.label}</p>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Time: {opt.totalTime}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Select Date and Slot */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3 text-left">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2 block">Select Date *</label>
                          <div className="relative">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none">
                              <RenderIcon name="calendar" size={18} />
                            </div>
                            <input 
                              type="date" 
                              required
                              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Min 24h advance
                              className={`w-full bg-zinc-50 border border-zinc-200 rounded-[1.5rem] py-4 pl-12 pr-4 focus:ring-4 focus:ring-[#FF9933]/5 focus:border-[#FF9933] outline-none font-bold text-sm text-[#000080] transition-all`}
                              value={appointment.date}
                              onChange={(e) => {
                                setAppointment({...appointment, date: e.target.value});
                                checkHoliday(e.target.value);
                              }}
                            />
                          </div>
                          {holidayError && <p className="text-[10px] text-red-500 font-black mt-1 ml-2">{holidayError}</p>}
                        </div>

                        <div className="space-y-3 text-left">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2 block">Select Time Slot *</label>
                          <select
                            required
                            disabled={!appointment.date || !!holidayError}
                            value={appointment.slot}
                            onChange={(e) => setAppointment({...appointment, slot: e.target.value})}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-[1.5rem] py-4 px-4 text-[#000080] font-bold text-sm outline-none shadow-sm focus:ring-4 focus:ring-[#FF9933]/5 focus:border-[#FF9933] disabled:opacity-40"
                          >
                            <option value="">-- Choose Slot --</option>
                            {TIME_SLOTS.map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Checklist */}
                      {selectedOption && (
                        <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100/50 space-y-4 text-left">
                          <div className="flex items-center gap-3">
                            <RenderIcon name="alert" size={20} className="text-[#FF9933]" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF9933]">Required Checklist</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedOption.docs.map((doc) => (
                              <div key={doc} className="flex items-center gap-3 text-[#000080] font-bold text-xs bg-white p-4 rounded-xl shadow-xs border border-orange-100/10">
                                <RenderIcon name="check" size={14} className="text-[#138808]" />
                                {doc}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Center, City Selector, Map */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* City Selector Header */}
                      <div className="flex items-center justify-between bg-zinc-50 p-5 rounded-2xl border border-zinc-100 text-left">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Nearest Service Center *</h4>
                          <span className="text-[10px] text-zinc-500 font-bold mt-1 block">City: {activeCity}</span>
                        </div>
                        <select 
                          value={activeCity}
                          onChange={(e) => handleCityChange(e.target.value)}
                          className="appearance-none bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-[#000080] outline-none shadow-sm"
                        >
                          <option value="Delhi">Delhi</option>
                          <option value="Chennai">Chennai</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Bengaluru">Bengaluru</option>
                        </select>
                      </div>

                      {/* Centers selector cards list */}
                      <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar p-1">
                        {centers.map(center => (
                          <button 
                            key={center.id}
                            type="button"
                            onClick={() => {
                              setSelectedCenter(center);
                              setActiveMapCenter(center);
                            }}
                            onMouseEnter={() => setActiveMapCenter(center)}
                            className={`w-full p-4 rounded-[2rem] border-2 transition-all flex items-center justify-between text-left ${
                              selectedCenter?.id === center.id
                                ? 'border-[#138808] bg-[#138808]/5 shadow-sm'
                                : 'border-zinc-50 bg-white hover:border-zinc-200'
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-[#000080]">{center.name}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] text-zinc-400 font-semibold flex items-center gap-1"><RenderIcon name="map-pin" size={10} /> {center.location}</span>
                                <span className="text-[9px] text-[#138808] font-bold uppercase tracking-wider flex items-center gap-1"><RenderIcon name="arrow-right" size={10} className="-rotate-45" /> {center.distance}</span>
                              </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border text-xs ${
                              selectedCenter?.id === center.id
                                ? 'border-[#138808] bg-[#138808] text-white font-bold'
                                : 'border-zinc-200 bg-white text-transparent'
                            }`}>
                              ✓
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Map Locator Preview */}
                      {activeMapCenter && (
                        <div className="space-y-3 text-left">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 justify-center">
                            <RenderIcon name="map-pin" size={12} className="text-[#FF9933]" />
                            <span>Locator: {activeMapCenter.name} ({activeMapCenter.location})</span>
                          </div>
                          <div className="w-full h-44 rounded-2xl overflow-hidden border border-zinc-200 shadow-inner relative">
                            <iframe
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              allowFullScreen
                              referrerPolicy="no-referrer-when-downgrade"
                              src={`https://maps.google.com/maps?q=${activeMapCenter.lat},${activeMapCenter.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                              className="w-full h-full object-cover animate-fade-in"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Footer Actions */}
                  <div className="flex gap-4 pt-6 border-t border-zinc-100 mt-6">
                    <button type="button" onClick={closeModal} className="px-8 py-4 bg-zinc-50 text-zinc-400 hover:bg-zinc-100 rounded-xl font-bold text-sm transition-colors">Cancel</button>
                    <button 
                      type="button"
                      disabled={!selectedOption || !selectedCenter || !appointment.date || !appointment.slot || loading || !!holidayError}
                      onClick={handleApply} 
                      className="flex-1 bg-[#138808] hover:bg-[#0E6306] text-white py-4 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-20 flex items-center justify-center"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Submit Booking Request'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Final Success Slip */}
              {step === 2 && (
                <div className="text-center py-10 space-y-12 animate-fade-in">
                   <div className="w-40 h-40 bg-[#138808]/10 text-[#138808] rounded-full flex items-center justify-center mx-auto shadow-inner relative">
                    <RenderIcon name="check" size={80} />
                    <div className="absolute -inset-8 bg-[#138808]/5 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-8">
                    <h4 className="text-6xl font-black text-[#000080] tracking-tighter">Success!</h4>
                    
                    <div className="bg-[#f8f9fa] rounded-[4rem] border-4 border-zinc-50 p-12 max-w-lg mx-auto shadow-inner relative overflow-hidden text-left space-y-8">
                        <div className="grid grid-cols-[100px_1fr] items-baseline gap-y-4 gap-x-2">
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Reference ID</span>
                           <span className="text-[#FF9933] font-black text-3xl font-mono text-right">{refId}</span>

                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Center</span>
                           <span className="text-[#000080] font-black text-2xl text-right">{selectedCenter?.name}</span>

                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Slot</span>
                           <span className="text-[#000080] font-black text-lg sm:text-xl text-right leading-tight break-words">{new Date(appointment.date).toDateString()} @ {appointment.slot}</span>
                        </div>

                        <div className="bg-white border-2 border-orange-100 rounded-[2.5rem] p-10 space-y-6 relative z-10">
                           <div className="flex items-center gap-4 text-[#FF9933] font-black text-xs uppercase tracking-widest">
                              <RenderIcon name="alert" size={24} /> Critical Instructions
                           </div>
                           <ul className="space-y-4 text-sm text-[#000080]/70 font-bold leading-relaxed">
                              <li className="flex items-start gap-3"><span className="text-[#138808]">✓</span> Carry all {selectedOption?.docs.length ?? 0} original documents.</li>
                              <li className="flex items-start gap-3"><span className="text-[#138808]">✓</span> Reach by {appointment.slot?.split(' - ')[0] || 'N/A'}.</li>
                              <li className="flex items-start gap-3"><span className="text-[#138808]">✓</span> Office Processing: <span className="text-[#FF9933]">{selectedService.officeTime}</span>.</li>
                              <li className="flex items-start gap-3"><span className="text-[#138808]">✓</span> Update Delivery: <span className="text-[#FF9933]">{selectedOption?.totalTime}</span>.</li>
                           </ul>
                        </div>
                    </div>
                  </div>
                  
                  <button onClick={closeModal} className="w-full bg-[#000080] text-white py-8 rounded-[3rem] font-black text-3xl hover:bg-[#000060] transition-all shadow-2xl shadow-navy/20">Return to Dashboard</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8f9fa; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
}
