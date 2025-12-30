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
  const [showDescribeModal, setShowDescribeModal] = useState(false);
  const [description, setDescription] = useState('');
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

  // Nettoyer le stream vidéo quand le modal se ferme
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

    if (!userId) {
      const currentUrl = window.location.pathname;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
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

  const handleDescribeAnalyze = async () => {
    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    if (!userId) {
      const currentUrl = window.location.pathname;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Check if user has reached limit BEFORE analyzing
    if (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        const error = await response.json();
        
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
      
      setShowDescribeModal(false);
      setDescription('');
      router.push(`/results/${result.scanId}`);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleCheckout = async (plan: 'pro' | 'lifetime') => {
    if (!userId) {
      const currentUrl = window.location.pathname;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

    try {
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
    if (!userId) {
      const currentUrl = window.location.pathname;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0) {
      setShowPaywall(true);
      return;
    }
    
    fileInputRef.current?.click();
  };

  const handleTakePhoto = async () => {
    if (!userId) {
      const currentUrl = window.location.pathname;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

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
      alert('Camera not available on this device. Please choose a file from your gallery instead.');
      fileInputRef.current?.click();
      return;
    }

    setIsCameraLoading(true);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch (envError) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
          });
        } catch (userError) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }
      
      streamRef.current = stream;
      setShowCameraModal(true);
      setIsCameraLoading(false);
      
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
            setIsCameraLoading(false);
          });
          
          videoRef.current.onloadedmetadata = () => {
            setIsCameraLoading(false);
          };
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsCameraLoading(false);
      alert('Camera not available. Please choose a file from your gallery instead.');
      fileInputRef.current?.click();
    }
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
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
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          setShowCameraModal(false);
          
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

  const handleScanProfileClick = () => {
    if (!userId) {
      const currentUrl = window.location.pathname;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0) {
      setShowPaywall(true);
      return;
    }

    handleChooseFromGallery();
  };

  const handleDescribePersonClick = () => {
    if (!userId) {
      const currentUrl = window.location.pathname;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (subscriptionStatus === 'free' && remainingScans !== null && remainingScans <= 0) {
      setShowPaywall(true);
      return;
    }

    setShowDescribeModal(true);
  };

  if (isLoading) {
    return <LoadingScreen type="scan" />;
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

  const canPerformScan = subscriptionStatus !== 'free' || (remainingScans !== null && remainingScans > 0);

  return (
    <div className="relative flex flex-col overflow-x-hidden overflow-y-visible w-full">
      {/* Background with violet reflections */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black" />
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-radial from-purple-600/20 via-purple-700/10 to-transparent blur-[150px] opacity-60" />
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-gradient-radial from-purple-500/15 via-purple-600/8 to-transparent blur-[140px] opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-purple-700/25 via-purple-800/15 to-transparent blur-[180px] opacity-40" />
        
        <div className="absolute inset-0 opacity-[0.02]">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-300/30 rounded-full animate-particle-float"
              style={{
                left: `${(i * 7.2) % 100}%`,
                top: `${(i * 11.3) % 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${15 + (i % 10)}s`,
              }}
            />
          ))}
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
              <h1 className="text-xl font-bold text-white">
                FlagCheck
              </h1>
              
              {(!userId || subscriptionStatus === 'free') && (
                <button
                  onClick={() => {
                    if (!userId) {
                      const currentUrl = window.location.pathname;
                      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
                      return;
                    }
                    setShowPaywall(true);
                  }}
                  className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)] transition-all hover:scale-105 hover:shadow-[0_6px_20px_rgba(99,102,241,0.6)]"
                >
                  Get PRO
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 mb-[60px] mt-[60px] text-center animate-fade-in">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[700px] h-[700px] animate-aura-move">
              <div className="absolute inset-0 bg-gradient-radial-text-aura blur-[80px]" />
            </div>
          </div>
          
          <div className="relative mb-4 inline-block">
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

          {/* Two Cards Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Scan Profile Card */}
            <div 
              className={`group relative rounded-[2rem] border-2 ${
                canPerformScan 
                  ? 'border-white/30 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-2xl cursor-pointer hover:border-indigo-500/60 hover:bg-indigo-500/15 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-500' 
                  : 'border-white/10 bg-black/40 backdrop-blur-xl opacity-60 cursor-not-allowed'
              } p-8 shadow-[0_15px_40px_rgba(0,0,0,0.4)]`}
              onClick={handleScanProfileClick}
            >
              <div className="absolute -inset-1 rounded-[2rem] bg-gradient-primary blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-40" />
                  <div className="relative rounded-full bg-gradient-primary p-6 shadow-[0_0_25px_rgba(99,102,241,0.5)]">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Scan Profile</h3>
                  <p className="text-sm text-gray-400">Upload a screenshot</p>
                </div>
              </div>
            </div>

            {/* Describe Person Card */}
            <div 
              className={`group relative rounded-[2rem] border-2 ${
                canPerformScan 
                  ? 'border-white/30 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-2xl cursor-pointer hover:border-pink-500/60 hover:bg-pink-500/15 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-500' 
                  : 'border-white/10 bg-black/40 backdrop-blur-xl opacity-60 cursor-not-allowed'
              } p-8 shadow-[0_15px_40px_rgba(0,0,0,0.4)]`}
              onClick={handleDescribePersonClick}
            >
              <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-pink-500 to-purple-500 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-2xl opacity-40" />
                  <div className="relative rounded-full bg-gradient-to-r from-pink-500 to-purple-500 p-6 shadow-[0_0_25px_rgba(236,72,153,0.5)]">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Describe Person</h3>
                  <p className="text-sm text-gray-400">Type a description</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden file inputs */}
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

          {/* Premium How it Works Section */}
          <div className="group relative animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute -inset-1 rounded-[2rem] bg-gradient-primary blur-2xl opacity-20 group-hover:opacity-25 transition-opacity duration-500" />
            <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-r from-indigo-500/15 via-pink-500/15 to-indigo-500/15 blur-xl opacity-15 group-hover:opacity-20 transition-opacity duration-500" />
            
            <div className="relative rounded-[2rem] border-2 border-white/20 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.6)] group-hover:-translate-y-1 transition-all duration-500">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="mb-8 flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-xl opacity-50" />
                    <div className="relative rounded-lg bg-gradient-primary p-2 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                    How it works?
                  </h3>
                </div>
                
                <div className="space-y-6">
                  <div className="group/step flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-indigo-600/20 rounded-xl blur-lg opacity-50" />
                      <div className="relative rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 p-3">
                        <span className="text-2xl font-bold text-indigo-300">1</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-base sm:text-lg text-white font-medium mb-1">
                        Upload a screenshot or describe the person
                      </p>
                      <p className="text-sm text-gray-400">
                        Choose your preferred method to analyze
                      </p>
                    </div>
                  </div>
                  
                  <div className="group/step flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-pink-600/20 rounded-xl blur-lg opacity-50" />
                      <div className="relative rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 p-3">
                        <span className="text-2xl font-bold text-pink-300">2</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-base sm:text-lg text-white font-medium mb-1">
                        Our AI analyzes the content to detect red flags
                      </p>
                      <p className="text-sm text-gray-400">
                        Advanced algorithms examine every detail for warning signs
                      </p>
                    </div>
                  </div>
                  
                  <div className="group/step flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-purple-600/20 rounded-xl blur-lg opacity-50" />
                      <div className="relative rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 p-3">
                        <span className="text-2xl font-bold text-purple-300">3</span>
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-base sm:text-lg text-white font-medium mb-1">
                        Get a detailed report in seconds
                      </p>
                      <p className="text-sm text-gray-400">
                        Receive comprehensive insights with explanations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)} onCheckout={handleCheckout} />
      )}

      {/* Camera Modal for Desktop */}
      {showCameraModal && (
        <CameraModal
          videoRef={videoRef}
          isCameraLoading={isCameraLoading}
          onClose={closeCameraModal}
          onCapture={capturePhotoFromVideo}
        />
      )}

      {/* Describe Modal */}
      {showDescribeModal && (
        <DescribeModal
          description={description}
          onDescriptionChange={setDescription}
          onClose={() => {
            setShowDescribeModal(false);
            setDescription('');
          }}
          onAnalyze={handleDescribeAnalyze}
          canAnalyze={canPerformScan && description.trim().length > 0}
        />
      )}
    </div>
  );
}

function LoadingScreen({ type }: { type: 'scan' | 'describe' }) {
  const [loadingMessage, setLoadingMessage] = useState(0);
  const messages = type === 'scan' 
    ? [
        'Detecting gym selfies...',
        'Analyzing bio cringe...',
        'Counting fish pics...',
        'Checking for red flags...',
      ]
    : [
        'Analyzing description...',
        'Detecting red flags...',
        'Examining warning signs...',
        'Generating report...',
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMessage((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-black">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 animate-fade-in">
          <div className="mb-6 inline-block rounded-full bg-gradient-primary p-8 shadow-glow-md animate-pulse-glow">
            {type === 'scan' ? (
              <Camera className="h-16 w-16 text-white" />
            ) : (
              <Sparkles className="h-16 w-16 text-white" />
            )}
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

function PaywallModal({ onClose, onCheckout }: { onClose: () => void; onCheckout: (plan: 'pro' | 'lifetime') => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-black/90 backdrop-blur-2xl p-8 shadow-2xl animate-slide-up">
        <button
          onClick={onClose}
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
          <div className="relative rounded-3xl border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-600/20 to-indigo-600/10 backdrop-blur-xl p-6 shadow-glow-md hover:border-indigo-500 transition-all duration-300">
            <div className="absolute right-4 top-4 rounded-full bg-gradient-primary px-3 py-1 text-xs font-bold text-white shadow-glow-sm">
              Recommended
            </div>
            <div className="mb-3">
              <h3 className="mb-1 text-2xl font-bold text-white">Pro</h3>
              <p className="text-sm text-gray-400">Unlimited scans</p>
            </div>
            <div className="mb-5">
              <span className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]">$6.99</span>
              <span className="text-gray-400 ml-2">/month</span>
            </div>
            <button
              onClick={() => onCheckout('pro')}
              className="w-full rounded-xl glow-button px-4 py-4 font-bold text-white min-h-[56px] transition-all duration-300"
            >
              Choose Pro
            </button>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-6 glass-card">
            <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-pink-500/80 to-purple-500/80 px-3 py-1 text-xs font-bold text-white shadow-glow-sm">
              Best value
            </div>
            <div className="mb-3">
              <h3 className="mb-1 text-2xl font-bold text-white">Lifetime</h3>
              <p className="text-sm text-gray-400">Lifetime access</p>
            </div>
            <div className="mb-2">
              <span className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]">$49.99</span>
              <span className="text-gray-400 ml-2">one-time</span>
            </div>
            <div className="mb-5">
              <span className="text-sm text-gray-500 line-through">Normally $79.99</span>
            </div>
            <button
              onClick={() => onCheckout('lifetime')}
              className="w-full rounded-xl border border-white/20 bg-black/50 backdrop-blur-xl px-4 py-4 font-bold text-white min-h-[56px] transition-all hover:border-pink-500/50 hover:bg-pink-500/10 hover:shadow-glow-pink"
            >
              Choose Lifetime
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraModal({ videoRef, isCameraLoading, onClose, onCapture }: { 
  videoRef: React.RefObject<HTMLVideoElement | null>; 
  isCameraLoading: boolean; 
  onClose: () => void;
  onCapture: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-black/90 backdrop-blur-2xl p-8 shadow-2xl animate-slide-up">
        <button
          onClick={onClose}
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
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/20 bg-black/50 backdrop-blur-xl px-6 py-4 font-bold text-white transition-all hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onCapture}
            className="flex-1 rounded-xl glow-button px-6 py-4 font-bold text-white transition-all duration-300"
          >
            Capture Photo
          </button>
        </div>
      </div>
    </div>
  );
}

function DescribeModal({ description, onDescriptionChange, onClose, onAnalyze, canAnalyze }: {
  description: string;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onAnalyze: () => void;
  canAnalyze: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-black/90 backdrop-blur-2xl p-8 shadow-2xl animate-slide-up">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mb-4 inline-block rounded-full bg-gradient-to-r from-pink-500 to-purple-500 p-6 shadow-[0_0_25px_rgba(236,72,153,0.5)]">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h2 className="mb-2 text-3xl font-bold text-white">
            Describe this person
          </h2>
          <p className="text-sm text-gray-400">
            Ex: "She says she's a CEO at 23 years old and travels a lot..."
          </p>
        </div>

        <div className="mb-6">
          <div className="relative group/textarea">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-primary opacity-0 group-focus-within/textarea:opacity-30 blur-md transition-opacity duration-300" />
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Enter a textual description of the person..."
              className="relative w-full min-h-[240px] rounded-2xl border-2 border-white/30 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-xl px-6 py-5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/20 focus:bg-black/80 transition-all duration-300 resize-none text-base shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]"
              maxLength={2000}
            />
          </div>
          <div className="flex justify-between items-center text-sm text-gray-400 font-medium mt-3">
            <span>{description.length}/2000 characters</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/20 bg-black/50 backdrop-blur-xl px-6 py-4 font-bold text-white transition-all hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="flex-1 rounded-xl glow-button px-6 py-4 font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze red flags
          </button>
        </div>
      </div>
    </div>
  );
}
