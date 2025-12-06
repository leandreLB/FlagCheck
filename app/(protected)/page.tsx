'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Sparkles, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

const MAX_FREE_SCANS = 3;

export default function HomePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [remainingScans, setRemainingScans] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro' | 'lifetime'>('free');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();
  const { userId } = useAuth();

  // Fetch remaining scans and subscription status
  const fetchSubscriptionInfo = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/subscription/check');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.status);
        
        if (data.status === 'free') {
          const scansResponse = await fetch('/api/scans/list');
          if (scansResponse.ok) {
            const scans = await scansResponse.json();
            const used = scans.length || 0;
            setRemainingScans(Math.max(0, MAX_FREE_SCANS - used));
          }
        } else {
          // Pro or Lifetime: unlimited scans
          setRemainingScans(null);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      setRemainingScans(MAX_FREE_SCANS);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscriptionInfo();
    // Détecter si on est sur mobile (iOS ou Android)
    const checkMobile = () => {
      if (typeof window === 'undefined') return;
      
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      const isAndroid = /android/i.test(userAgent);
      const isMobileDevice = isIOS || isAndroid;
      const isSmallScreen = window.innerWidth <= 768;
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Considérer comme mobile si c'est iOS, Android, ou un petit écran avec tactile
      setIsMobile(isMobileDevice || (isSmallScreen && hasTouchScreen));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [fetchSubscriptionInfo]);

  // Nettoyer le stream vidéo quand le composant se démonte ou le modal se ferme
  useEffect(() => {
    if (!showCameraModal && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [showCameraModal]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file only');
      return;
    }

    // Check if user has reached limit BEFORE uploading
    if (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        
        // If limit reached error, show paywall
        if (response.status === 403) {
          setShowPaywall(true);
          setIsLoading(false);
          return;
        }
        
        throw new Error(error.error || 'Analysis failed');
      }

      const result = await response.json();
      
      // Update local count
      if (subscriptionStatus === 'free') {
        setRemainingScans((prev) => (prev !== null ? prev - 1 : null));
      }
      
      router.push(`/results/${result.scanId}`);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleCheckout = async (plan: 'pro' | 'lifetime') => {
    try {
      // Convertir 'pro' en 'monthly' pour correspondre à l'API
      const priceType = plan === 'pro' ? 'monthly' : 'lifetime';
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleChooseFromGallery = () => {
    // If no scans remaining, show paywall instead of file picker
    if (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0) {
      setShowPaywall(true);
      return;
    }
    
    fileInputRef.current?.click();
  };

  const handleTakePhoto = async () => {
    // If no scans remaining, show paywall
    if (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0) {
      setShowPaywall(true);
      return;
    }

    // Sur mobile, utiliser l'input avec capture
    if (isMobile) {
      cameraInputRef.current?.click();
      return;
    }

    // Sur desktop, utiliser WebRTC
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback vers file picker si WebRTC n'est pas disponible
      alert('Camera not available on this device. Please choose a file from your gallery instead.');
      fileInputRef.current?.click();
      return;
    }

    setIsCameraLoading(true);
    try {
      // Essayer d'abord avec la caméra arrière (environment), puis fallback vers user
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch (envError) {
        // Si environment échoue, essayer avec user (caméra avant)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
          });
        } catch (userError) {
          // Si les deux échouent, essayer sans contrainte
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }
      
      streamRef.current = stream;
      setShowCameraModal(true);
      setIsCameraLoading(false);
      
      // Attendre que le modal soit monté pour attacher le stream
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
            setIsCameraLoading(false);
          });
          
          // Détecter quand la vidéo est prête
          videoRef.current.onloadedmetadata = () => {
            setIsCameraLoading(false);
          };
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsCameraLoading(false);
      // Fallback vers file picker si la caméra n'est pas disponible
      alert('Camera not available. Please choose a file from your gallery instead.');
      fileInputRef.current?.click();
    }
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Réinitialiser l'input pour permettre de prendre plusieurs photos
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const capturePhotoFromVideo = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          // Arrêter le stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          // Fermer le modal
          setShowCameraModal(false);
          
          // Créer un File à partir du Blob
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          handleFileSelect(file);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const closeCameraModal = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const getStatusBadge = () => {
    if (subscriptionStatus === 'pro') {
      return (
        <div className="mb-8 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-xl p-4 text-center shadow-glow-sm">
          <p className="text-sm font-semibold text-indigo-400">
            ⭐ Pro Member - Unlimited scans
          </p>
        </div>
      );
    } else if (subscriptionStatus === 'lifetime') {
      return (
        <div className="mb-8 rounded-2xl border border-pink-500/30 bg-pink-500/10 backdrop-blur-xl p-4 text-center shadow-glow-pink">
          <p className="text-sm font-semibold text-pink-400">
            💎 Lifetime Member - Lifetime access
          </p>
        </div>
      );
    } else if (remainingScans !== null) {
      return (
        <div className="relative mb-8">
          <div className="relative rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-5 text-center glass-card shadow-lg">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/5 via-pink-500/5 to-indigo-500/5 animate-pulse-slow" />
            <p className="relative text-sm text-gray-400">
              Free scans remaining: <span className="font-bold text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] text-lg">{remainingScans}/{MAX_FREE_SCANS}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative flex flex-col overflow-x-hidden overflow-y-visible w-full">
      {/* Subtle ambient aura effect - very low opacity for premium feel */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Base dark background */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Subtle particle effect - tiny dots */}
        <div className="absolute inset-0 opacity-[0.03]">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-particle-float"
              style={{
                left: `${(i * 7.2) % 100}%`,
                top: `${(i * 11.3) % 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${15 + (i % 10)}s`,
              }}
            />
          ))}
        </div>
        
        {/* Primary subtle ambient aura - centered behind hero section */}
        <div className="absolute top-[180px] left-1/2 -translate-x-1/2 w-[1400px] h-[1400px] animate-ambient-aura">
          <div className="absolute inset-0 bg-gradient-radial-aura blur-[120px]" />
        </div>
        
        {/* Secondary subtle glow - offset for depth */}
        <div className="absolute top-1/3 right-1/4 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] animate-ambient-aura-secondary">
          <div className="absolute inset-0 bg-gradient-radial-aura-secondary blur-[100px]" />
        </div>
        
        {/* Tertiary subtle glow - opposite side for balance */}
        <div className="absolute bottom-1/3 left-1/4 translate-x-1/2 translate-y-1/2 w-[900px] h-[900px] animate-ambient-aura-tertiary">
          <div className="absolute inset-0 bg-gradient-radial-aura blur-[110px]" />
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col px-6 md:px-8 lg:px-12 pt-8 animate-fade-in overflow-x-hidden w-full max-w-[600px] md:max-w-none mx-auto md:mx-0 md:pb-8" style={{ paddingBottom: 'max(8rem, calc(env(safe-area-inset-bottom, 0px) + 8rem))' }}>

        {/* Premium Top Bar - Sticky */}
        <div 
          className="sticky top-0 z-50 mb-0 -mx-6 md:-mx-8 lg:-mx-12 px-6 md:px-8 lg:px-12"
          style={{ 
            paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))',
            minHeight: 'calc(env(safe-area-inset-top, 0px) + 4rem)'
          }}
        >
          <div className="mx-auto max-w-[600px] md:max-w-none">
            <div className="flex h-[60px] items-center justify-between rounded-2xl border border-white/5 bg-black/40 backdrop-blur-[20px] px-5 shadow-lg">
              {/* Left: Logo */}
              <h1 className="text-xl font-bold text-white">
                FlagCheck
              </h1>
              
              {/* Right: Get PRO Button */}
              {subscriptionStatus === 'free' && (
                <button
                  onClick={() => setShowPaywall(true)}
                  className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)] transition-all hover:scale-105 hover:shadow-[0_6px_20px_rgba(99,102,241,0.6)]"
                >
                  Get PRO
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hero Section - Premium spacing (120px top and bottom) */}
        <div className="relative z-10 mb-[120px] mt-[120px] text-center animate-fade-in">
          {/* Subtle moving ambient aura around text - circular movement */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[700px] h-[700px] animate-aura-move">
              <div className="absolute inset-0 bg-gradient-radial-text-aura blur-[80px]" />
            </div>
          </div>
          
          <div className="relative mb-4 inline-block">
            {/* Glow effect matching camera icon - stronger and moving */}
            <div className="absolute inset-0 bg-gradient-primary blur-2xl opacity-70 animate-glow-move" style={{
              borderRadius: '12px',
              transform: 'scale(1.3)',
            }} />
            <h2 
              className="relative text-4xl font-bold leading-tight text-gray-50"
              style={{
                textShadow: '0 0 40px rgba(99, 102, 241, 0.8), 0 0 80px rgba(236, 72, 153, 0.6)'
              }}
            >
              Find the{' '}
              <span className="text-pink-500/80">red flags</span>
              {' '}before you swipe right 🚩
            </h2>
          </div>
          <p className="relative text-base text-gray-400">
            AI-powered profile analysis in seconds
          </p>
        </div>

      <div 
        className="relative z-10 flex flex-col items-center justify-center w-full"
        style={{ 
          paddingTop: 'max(0.5rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))',
          minHeight: 'auto'
        }}
      >
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
          {/* Subscription Status */}
          {getStatusBadge()}

          {/* Upload zone - Enhanced with depth and animations */}
          <div className="group relative mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Multi-layer glow effects */}
            <div className={`absolute -inset-1 rounded-3xl bg-gradient-primary blur-3xl transition-all duration-500 ${
              isDragging ? 'opacity-70 scale-110' : 'opacity-40 group-hover:opacity-60 animate-pulse-glow'
            }`} />
            <div className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-pink-500/20 to-indigo-500/20 blur-xl transition-all duration-500 ${
              isDragging ? 'opacity-50' : 'opacity-30 group-hover:opacity-40'
            }`} />
            
            {/* Main container with layered shadows */}
            <div
              className={`relative rounded-3xl border-2 border-dashed p-12 backdrop-blur-xl transition-all duration-500 min-h-[320px] flex items-center justify-center ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-600/20 shadow-[0_0_60px_rgba(99,102,241,0.6),0_0_100px_rgba(236,72,153,0.4)] scale-[1.02]'
                  : 'border-white/20 bg-black/40 glass-card shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] group-hover:shadow-[0_12px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,102,241,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] group-hover:-translate-y-1'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraInputChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-50 group-hover:opacity-70 animate-pulse-glow" />
                  <div className="relative rounded-full bg-gradient-primary p-6 shadow-[0_0_30px_rgba(99,102,241,0.6),0_0_60px_rgba(236,72,153,0.4)] group-hover:scale-110 transition-all duration-500">
                    <Camera className="h-12 w-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="mb-3 text-3xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    Let's scan for red flags 🚩
                  </h2>
                  <p className="text-sm text-gray-400 mb-8">
                    {subscriptionStatus === 'free' && remainingScans === 0
                      ? 'Upgrade to Pro to continue'
                      : 'Drag & drop an image or choose an option below'}
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <button
                    type="button"
                    onClick={handleChooseFromGallery}
                    disabled={subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0}
                    className="w-full rounded-xl border border-white/20 bg-black/50 backdrop-blur-xl px-6 py-4 font-bold text-white text-base min-h-[56px] transition-all hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-glow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {subscriptionStatus === 'free' && remainingScans === 0
                      ? 'Upgrade to Pro'
                      : 'Choose from Gallery'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTakePhoto}
                    disabled={subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0}
                    className="w-full rounded-xl glow-button px-6 py-4 font-bold text-white text-base min-h-[56px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {subscriptionStatus === 'free' && remainingScans === 0
                      ? 'Upgrade to Pro'
                      : 'Take Photo'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-8 glass-card animate-slide-up shadow-lg" style={{ animationDelay: '0.2s' }}>
            <h3 className="mb-6 text-lg font-bold text-white">
              How it works?
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3 stagger-item" style={{ animationDelay: '0.3s' }}>
                <span className="mt-1 text-pink-500 text-lg">•</span>
                <span>Upload a dating profile screenshot</span>
              </li>
              <li className="flex items-start gap-3 stagger-item" style={{ animationDelay: '0.4s' }}>
                <span className="mt-1 text-pink-500 text-lg">•</span>
                <span>Our AI analyzes the content to detect red flags</span>
              </li>
              <li className="flex items-start gap-3 stagger-item" style={{ animationDelay: '0.5s' }}>
                <span className="mt-1 text-pink-500 text-lg">•</span>
                <span>Get a detailed report in seconds</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-black/90 backdrop-blur-2xl p-8 shadow-2xl animate-slide-up">
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-8 text-center">
              <div className="mb-4 text-6xl">🚫</div>
              <h2 className="mb-2 text-3xl font-bold text-white">
                Scan limit reached
              </h2>
              <p className="text-gray-400">
                Upgrade to Pro for unlimited scans!
              </p>
            </div>

            <div className="space-y-4">
              {/* Pro Plan */}
              <div className="relative rounded-3xl border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-600/20 to-indigo-600/10 backdrop-blur-xl p-6 shadow-glow-md hover:border-indigo-500 transition-all duration-300">
                <div className="absolute right-4 top-4 rounded-full bg-gradient-primary px-3 py-1 text-xs font-bold text-white shadow-glow-sm">
                  Recommended
                </div>
                <div className="mb-3">
                  <h3 className="mb-1 text-2xl font-bold text-white">Pro</h3>
                  <p className="text-sm text-gray-400">Unlimited scans</p>
                </div>
                <div className="mb-5">
                  <span className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]">$3.99</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                <button
                  onClick={() => handleCheckout('pro')}
                  className="w-full rounded-xl glow-button px-4 py-4 font-bold text-white min-h-[56px] transition-all duration-300"
                >
                  Choose Pro
                </button>
              </div>

              {/* Lifetime Plan */}
              <div className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card">
                <div className="mb-3">
                  <h3 className="mb-1 text-2xl font-bold text-white">Lifetime</h3>
                  <p className="text-sm text-gray-400">Lifetime access</p>
                </div>
                <div className="mb-5">
                  <span className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]">$24.99</span>
                  <span className="text-gray-400 ml-2">one-time</span>
                </div>
                <button
                  onClick={() => handleCheckout('lifetime')}
                  className="w-full rounded-xl border border-white/20 bg-black/50 backdrop-blur-xl px-4 py-4 font-bold text-white min-h-[56px] transition-all hover:border-pink-500/50 hover:bg-pink-500/10 hover:shadow-glow-pink"
                >
                  Choose Lifetime
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal for Desktop */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-black/90 backdrop-blur-2xl p-8 shadow-2xl animate-slide-up">
            <button
              onClick={closeCameraModal}
              className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">
                Take a Photo
              </h2>
              <p className="text-sm text-gray-400">
                Position your camera and click capture
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 mb-6 min-h-[300px] flex items-center justify-center">
              {isCameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="mb-4 inline-block rounded-full bg-gradient-primary p-4 shadow-glow-md animate-pulse">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-400 text-sm">Starting camera...</p>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-4 border-white/20 rounded-2xl" style={{
                  clipPath: 'inset(20% 10% 20% 10%)'
                }} />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={closeCameraModal}
                className="flex-1 rounded-xl border border-white/20 bg-black/50 backdrop-blur-xl px-6 py-4 font-bold text-white transition-all hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={capturePhotoFromVideo}
                className="flex-1 rounded-xl glow-button px-6 py-4 font-bold text-white transition-all duration-300"
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  const [loadingMessage, setLoadingMessage] = useState(0);
  const messages = [
    'Detecting gym selfies...',
    'Analyzing bio cringe...',
    'Counting fish pics...',
    'Checking for red flags...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMessage((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-black">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 animate-fade-in">
          <div className="mb-6 inline-block rounded-full bg-gradient-primary p-8 shadow-glow-md animate-pulse-glow">
            <Camera className="h-16 w-16 text-white" />
          </div>
          <h2 className="mb-3 text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Analyzing<span className="animate-pulse">...</span>
          </h2>
          <p className="text-gray-400 text-lg">{messages[loadingMessage]}</p>
        </div>

        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-black/50 border border-white/10 backdrop-blur-xl">
          <div className="h-full animate-progress bg-gradient-progress shadow-glow-orange" />
        </div>
      </div>
    </div>
  );
}