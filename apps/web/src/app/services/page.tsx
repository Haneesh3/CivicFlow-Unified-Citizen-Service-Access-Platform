'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import * as LucideIcons from 'lucide-react';

// Safe Icon Lookup Map to avoid shadowing browser globals like Image, Option, etc.
const ICON_MAP: Record<string, any> = {
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
  'arrow-right': LucideIcons.ArrowRight
};

const CATEGORIES = ['All', 'Identity', 'Certificates', 'Property', 'Utilities', 'Transport', 'Healthcare', 'Welfare', 'Business'];

const CENTERS = [
  { id: 'c1', name: 'Zonal Office - South Delhi', location: 'Saket', distance: '2.4 km', staff: 'Officer Rajesh Kumar' },
  { id: 'c2', name: 'Passport Seva Kendra (PSK)', location: 'R.K. Puram', distance: '4.8 km', staff: 'Officer Meera Singh' },
  { id: 'c3', name: 'Citizen Resource Center', location: 'Okhla Phase III', distance: '1.2 km', staff: 'Officer Amit Sharma' },
  { id: 'c4', name: 'Municipal HQ', location: 'Civic Center', distance: '8.5 km', staff: 'Officer Sunita Rao' }
];

const SERVICES = [
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
  const { user } = useAuthStore();
  
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState({ date: '', slot: '' });
  const [refId, setRefId] = useState('');
  const [holidayError, setHolidayError] = useState('');

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

  const filteredServices = SERVICES.filter(s => 
    (activeCategory === 'All' || s.category === activeCategory) &&
    (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    const newRefId = `CF-${selectedService.id.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    try {
      const { error } = await supabase.from('ServiceApplication').insert({
        id: crypto.randomUUID(),
        serviceId: selectedService.id,
        userId: user.id,
        applicantName: user.name,
        applicantPhone: 'Verified',
        referenceId: newRefId,
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

      if (error) throw error;
      setRefId(newRefId);
      setStep(5);
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

  const RenderIcon = ({ name, size = 24, className = "" }: { name: string, size?: number, className?: string }) => {
    const IconComp = ICON_MAP[name] || ICON_MAP['info'];
    return <IconComp size={size} className={className} />;
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
           <h2 className="text-5xl font-black text-[#000080] tracking-tight">National <span className="text-[#FF9933]">e-Governance</span> Gateway</h2>
           <p className="text-zinc-500 text-lg max-w-2xl mx-auto">Access 50+ government services through a single window. Locate centers, book slots, and track delivery.</p>
           
           <div className="max-w-3xl mx-auto pt-6">
              <div className="relative group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FF9933] transition-colors">
                  <RenderIcon name="search" size={28} />
                </div>
                <input 
                  type="text" 
                  placeholder="Search Identity, Transport, Property, Health..."
                  className="w-full bg-white border-2 border-zinc-100 rounded-[2.5rem] py-8 pl-20 pr-8 focus:ring-12 focus:ring-[#FF9933]/5 focus:border-[#FF9933] outline-none transition-all shadow-2xl font-bold text-xl placeholder:text-zinc-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
           </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                activeCategory === cat 
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
                  Book Center <RenderIcon name="arrow-right" size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
                <div className="text-[10px] font-black text-zinc-200 tracking-widest uppercase">Verified</div>
              </div>
              <div className={`absolute -right-8 -bottom-8 w-32 h-32 ${service.bg} rounded-full opacity-0 group-hover:opacity-20 transition-opacity blur-3xl`}></div>
            </div>
          ))}
        </div>
      </main>

      {/* Multi-Step Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-12">
          <div className="absolute inset-0 bg-[#000080]/90 backdrop-blur-3xl animate-fade-in" onClick={closeModal}></div>
          
          <div className="bg-white w-full max-w-2xl rounded-[4rem] overflow-hidden shadow-2xl relative z-10 animate-scale-up border border-white/20">
            {/* Modal Header */}
            <div className="bg-[#000080] p-12 text-white relative overflow-hidden">
               <button onClick={closeModal} className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20">
                <RenderIcon name="x" size={28} />
              </button>
              
              <div className="relative z-10 flex items-center gap-10">
                <div className={`w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center ${selectedService.color} shadow-2xl ring-12 ring-white/5`}>
                  <RenderIcon name={selectedService.iconKey} size={56} />
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF9933]">{selectedService.category} Gateway</span>
                      <span className="text-white/20">•</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Step {step} of 5</span>
                   </div>
                   <h3 className="text-4xl font-black">{selectedService.title}</h3>
                </div>
              </div>
              <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="p-12 max-h-[65vh] overflow-y-auto custom-scrollbar">
              
              {/* Step 1: Details */}
              {step === 1 && (
                <div className="space-y-10 animate-fade-in">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Briefing</h4>
                    <p className="text-zinc-600 text-2xl leading-relaxed font-bold">{selectedService.details}</p>
                  </div>
                  <div className="bg-zinc-50 p-10 rounded-[3rem] border border-zinc-100 flex items-start gap-6">
                    <div className="w-14 h-14 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                       <RenderIcon name="info" size={32} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-black text-[#000080]">National Service Standards</p>
                      <p className="text-sm text-zinc-500 leading-relaxed font-medium">This service includes a physical verification phase. Your biometric or original documents will be checked at the Zonal office.</p>
                    </div>
                  </div>
                  <button onClick={() => setStep(2)} className="w-full bg-[#FF9933] text-white py-8 rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-2xl shadow-orange-100">
                    Choose Service Type <RenderIcon name="chevron-right" size={28} />
                  </button>
                </div>
              )}

              {/* Step 2: Options */}
              {step === 2 && (
                <div className="space-y-8 animate-fade-in">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">What do you want to update?</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedService.options.map((opt: any) => (
                      <button 
                        key={opt.id}
                        onClick={() => {
                          setSelectedOption(opt);
                          setStep(3);
                        }}
                        className="w-full bg-white border-4 border-zinc-50 hover:border-[#FF9933]/50 p-10 rounded-[2.5rem] flex items-center justify-between group transition-all shadow-sm hover:shadow-xl"
                      >
                        <div className="text-left flex items-center gap-8">
                           <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-200 group-hover:bg-[#FF9933]/10 group-hover:text-[#FF9933] transition-all">
                              <RenderIcon name="check" size={32} />
                           </div>
                           <div>
                            <p className="font-black text-2xl text-[#000080] mb-1">{opt.label}</p>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Total Processing: {opt.totalTime}</p>
                           </div>
                        </div>
                        <RenderIcon name="chevron-right" size={32} className="text-zinc-100 group-hover:text-[#FF9933] transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Center */}
              {step === 3 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex items-center justify-between bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nearest Service Centers</h4>
                     <span className="text-[10px] font-black text-blue-600 bg-white px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">Location Active</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {CENTERS.map(center => (
                      <button 
                        key={center.id}
                        onClick={() => {
                          setSelectedCenter(center);
                          setStep(4);
                        }}
                        className="w-full bg-white border-2 border-zinc-50 hover:border-[#138808]/50 p-8 rounded-[3rem] flex items-center justify-between group transition-all shadow-sm hover:shadow-xl text-left"
                      >
                        <div className="flex items-center gap-8">
                           <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 group-hover:bg-[#138808]/10 group-hover:text-[#138808] transition-all shrink-0">
                              <RenderIcon name="building" size={32} />
                           </div>
                           <div className="space-y-1">
                            <p className="font-black text-2xl text-[#000080]">{center.name}</p>
                            <div className="flex items-center gap-6">
                               <span className="text-[10px] font-black text-zinc-400 flex items-center gap-1"><RenderIcon name="map-pin" size={14} /> {center.location}</span>
                               <span className="text-[10px] font-black text-[#138808] flex items-center gap-1 uppercase tracking-widest"><RenderIcon name="arrow-right" size={14} className="-rotate-45" /> {center.distance} Away</span>
                            </div>
                           </div>
                        </div>
                        <RenderIcon name="chevron-right" size={32} className="text-zinc-100 group-hover:text-[#138808] transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Appointment */}
              {step === 4 && (
                <div className="space-y-12 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Select Date</label>
                      <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300">
                          <RenderIcon name="calendar" size={24} />
                        </div>
                        <input 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full bg-zinc-50 border-2 ${holidayError ? 'border-red-400 ring-4 ring-red-50' : 'border-zinc-100'} rounded-[2rem] py-6 px-10 pl-16 focus:ring-12 focus:ring-[#FF9933]/5 focus:border-[#FF9933] outline-none font-black text-2xl text-[#000080] transition-all`} 
                          onChange={(e) => {
                            setAppointment({...appointment, date: e.target.value});
                            checkHoliday(e.target.value);
                          }}
                        />
                      </div>
                      {holidayError && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                           <RenderIcon name="alert" size={20} />
                           <p className="text-[10px] font-black uppercase tracking-widest">{holidayError}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Select Time Slot</label>
                      <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {TIME_SLOTS.map(slot => (
                          <button 
                            key={slot}
                            disabled={!!holidayError}
                            onClick={() => setAppointment({...appointment, slot: slot})}
                            className={`p-5 rounded-2xl border-2 text-sm font-black transition-all ${
                              appointment.slot === slot 
                              ? 'bg-[#000080] text-white border-[#000080] shadow-xl' 
                              : 'bg-zinc-50 border-zinc-100 text-zinc-500 disabled:opacity-20'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50/50 p-10 rounded-[3rem] border border-orange-100/50 space-y-8">
                    <div className="flex items-center gap-3">
                       <RenderIcon name="alert" size={28} className="text-[#FF9933]" />
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF9933]">Pre-Visit Checklist</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedOption.docs.map((doc: string) => (
                        <div key={doc} className="flex items-center gap-4 text-[#000080] font-black text-sm bg-white p-5 rounded-2xl shadow-sm border border-orange-100/10">
                          <RenderIcon name="check" size={18} className="text-[#138808]" />
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-6 pt-4">
                    <button onClick={() => setStep(3)} className="flex-1 bg-zinc-50 text-zinc-400 py-6 rounded-[2rem] font-black text-lg">Back</button>
                    <button 
                      disabled={!appointment.date || !appointment.slot || loading || !!holidayError}
                      onClick={handleApply} 
                      className="flex-[2] bg-[#138808] text-white py-6 rounded-[2rem] font-black text-2xl hover:bg-[#0E6306] transition-all shadow-2xl shadow-green-100 disabled:opacity-20"
                    >
                      {loading ? <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Final Slip */}
              {step === 5 && (
                <div className="text-center py-10 space-y-12 animate-fade-in">
                   <div className="w-40 h-40 bg-[#138808]/10 text-[#138808] rounded-full flex items-center justify-center mx-auto shadow-inner relative">
                    <RenderIcon name="check" size={80} />
                    <div className="absolute -inset-8 bg-[#138808]/5 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-8">
                    <h4 className="text-6xl font-black text-[#000080] tracking-tighter">Success!</h4>
                    
                    <div className="bg-[#f8f9fa] rounded-[4rem] border-4 border-zinc-50 p-12 max-w-lg mx-auto shadow-inner relative overflow-hidden text-left space-y-8">
                        <div className="space-y-6">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Reference ID</span>
                              <span className="text-[#FF9933] font-black text-3xl font-mono">{refId}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Center</span>
                              <span className="text-[#000080] font-black text-2xl">{selectedCenter?.name}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Slot</span>
                              <span className="text-[#000080] font-black text-2xl">{new Date(appointment.date).toDateString()} @ {appointment.slot}</span>
                           </div>
                        </div>

                        <div className="bg-white border-2 border-orange-100 rounded-[2.5rem] p-10 space-y-6 relative z-10">
                           <div className="flex items-center gap-4 text-[#FF9933] font-black text-xs uppercase tracking-widest">
                              <RenderIcon name="alert" size={24} /> Critical Instructions
                           </div>
                           <ul className="space-y-4 text-sm text-[#000080]/70 font-bold leading-relaxed">
                              <li className="flex items-start gap-3"><span className="text-[#138808]">✓</span> Carry all {selectedOption.docs.length} original documents.</li>
                              <li className="flex items-start gap-3"><span className="text-[#138808]">✓</span> Reach by {appointment.slot.split(' - ')[0]}.</li>
                              <li className="flex items-start gap-3"><span className="text-[#138808]">✓</span> Office Processing: <span className="text-[#FF9933]">{selectedService.officeTime}</span>.</li>
                              <li className="flex items-start gap-3"><span className="text-[#138808]">✓</span> Update Delivery: <span className="text-[#FF9933]">{selectedOption.totalTime}</span>.</li>
                           </ul>
                        </div>
                    </div>
                  </div>
                  
                  <button onClick={() => router.push('/')} className="w-full bg-[#000080] text-white py-10 rounded-[3rem] font-black text-3xl hover:bg-[#000060] transition-all shadow-2xl shadow-navy/20">Return to Dashboard</button>
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
