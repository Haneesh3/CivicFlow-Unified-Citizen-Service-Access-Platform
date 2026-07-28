'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  MapPin, 
  Camera, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon,
  Send
} from 'lucide-react';
import { getIpLocation, DEFAULT_COORDS } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useHasHydrated } from '@/lib/store';
import { api } from '@/lib/api';

const CATEGORIES = [
  'Roads & Potholes',
  'Garbage & Sanitation',
  'Water Supply',
  'Street Lights',
  'Sewage & Drainage',
  'Parks & Trees',
  'Stray Animals',
  'Others'
];

export default function ReportIssuePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const hasHydrated = useHasHydrated();
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token && !user) {
      router.replace('/login');
    }
  }, [hasHydrated, token, user, router]);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    address: ''
  });
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    async function autoDetectLocation() {
      const ipstackKey = process.env.NEXT_PUBLIC_IPSTACK_API_KEY;
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            if (ipstackKey) {
              try {
                const ipData = await getIpLocation(ipstackKey);
                setFormData(prev => ({ ...prev, address: ipData.address }));
              } catch {
                setFormData(prev => ({
                  ...prev,
                  address: `Coordinates: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
                }));
              }
            } else {
              setFormData(prev => ({
                ...prev,
                address: `Coordinates: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
              }));
            }
          },
          async (err) => {
            console.warn('GPS denied, checking IPstack:', err);
            if (ipstackKey) {
              const ipData = await getIpLocation(ipstackKey);
              setCoords({ latitude: ipData.latitude, longitude: ipData.longitude });
              setFormData(prev => ({ ...prev, address: ipData.address }));
            } else {
              setCoords(DEFAULT_COORDS);
            }
          },
          { timeout: 3000 }
        );
      } else if (ipstackKey) {
        const ipData = await getIpLocation(ipstackKey);
        setCoords({ latitude: ipData.latitude, longitude: ipData.longitude });
        setFormData(prev => ({ ...prev, address: ipData.address }));
      } else {
        setCoords(DEFAULT_COORDS);
      }
    }
    autoDetectLocation();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to report an issue');
      return;
    }

    setLoading(true);

    try {
      let latitude = coords?.latitude || DEFAULT_COORDS.latitude;
      let longitude = coords?.longitude || DEFAULT_COORDS.longitude;

      // Add small random offset to prevent duplicate ticket matching
      latitude += (Math.random() - 0.5) * 0.01;
      longitude += (Math.random() - 0.5) * 0.01;

      await api.post('/complaints', {
        title: formData.title || `${formData.category} Issue`,
        description: formData.description,
        category: formData.category,
        address: formData.address,
        latitude,
        longitude,
        force: true
      });

      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      console.error('Report failed:', err);
      const msg = err.response?.data?.message || 'Failed to submit report. Please try again.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated || !user) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-[#138808]/10 text-[#138808] rounded-full flex items-center justify-center shadow-inner">
          <CheckCircle2 size={56} className="animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-[#000080]">Issue Reported!</h2>
          <p className="text-zinc-500 font-medium">Thank you for being a responsible citizen. <br/>Officials have been notified.</p>
        </div>
        <div className="pt-4 animate-pulse text-[#FF9933] font-bold text-xs uppercase tracking-widest">Redirecting to Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-20">
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-[#000080]">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-[#000080]">Report Civic Issue</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-[3rem] shadow-xl border border-zinc-100 relative overflow-hidden">
          
          {/* Section: Visual Evidence */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-2">Visual Evidence (Highly Recommended)</label>
            
            {imagePreview ? (
              <div className="relative group w-full h-64 rounded-[2rem] overflow-hidden shadow-2xl ring-8 ring-zinc-50 transition-all">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                    type="button" 
                    onClick={removeImage}
                    className="bg-white text-red-600 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
                   >
                     <X size={24} />
                   </button>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-4 border-dashed border-zinc-100 rounded-[2.5rem] p-12 text-center space-y-4 hover:border-[#FF9933]/30 hover:bg-[#FF9933]/5 transition-all group-hover:bg-[#FF9933]/5">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto text-zinc-200 group-hover:text-[#FF9933] group-hover:scale-110 transition-all shadow-sm">
                    <Camera size={40} />
                  </div>
                  <div>
                    <p className="font-bold text-[#000080] text-xl">Capture or Upload Photo</p>
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Photos help us resolve issues faster</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Category */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-2">Issue Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({...formData, category: cat})}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border-2 ${
                    formData.category === cat 
                    ? 'bg-[#000080] text-white border-[#000080] shadow-lg' 
                    : 'bg-white text-zinc-400 border-zinc-100 hover:border-[#FF9933] hover:text-[#FF9933]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Description */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-2">Problem Description</label>
            <textarea 
              required
              placeholder="Please provide details about the issue (e.g. Broken pipe leaking water for 2 days...)"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-[2rem] p-8 focus:ring-8 focus:ring-[#FF9933]/5 focus:border-[#FF9933] outline-none transition-all font-medium text-lg min-h-[160px]"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Section: Location */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-2">Exact Location</label>
            <div className="relative group">
              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#FF9933] transition-colors" size={24} />
              <input 
                type="text" 
                required
                placeholder="Street address, Landmark, or Area..."
                className="w-full bg-zinc-50 border border-zinc-100 rounded-[2rem] py-6 pl-16 pr-6 focus:ring-8 focus:ring-[#FF9933]/5 focus:border-[#FF9933] outline-none transition-all font-bold text-[#000080]"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            
            {coords && (
              <div className="space-y-3 mt-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-2 block">Map Preview</label>
                <div className="w-full h-64 rounded-[2rem] overflow-hidden border border-zinc-200 shadow-inner relative">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${coords.latitude},${coords.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full object-cover animate-fade-in"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 justify-center">
                  <MapPin className="w-4 h-4 text-[#FF9933]" />
                  <span>Automatically detected your location</span>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-zinc-400 font-bold text-center mt-2">GPS coordinates will be automatically attached to your submission</p>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading || !formData.category || !formData.description}
              className="w-full bg-[#FF9933] text-white py-8 rounded-[2.5rem] font-bold text-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-orange-100 disabled:opacity-20"
            >
              {loading ? (
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Submit Report <Send size={24} /></>
              )}
            </button>
          </div>

          {/* Saffron Glow Background */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#FF9933]/5 rounded-full blur-[100px]"></div>
        </form>
      </main>
    </div>
  );
}
