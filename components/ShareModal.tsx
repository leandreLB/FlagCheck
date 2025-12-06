'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share2, Twitter } from 'lucide-react';

interface ShareModalProps {
  imageBlob: Blob | null;
  imageUrl: string | null;
  score: number;
  onClose: () => void;
  onDownload: () => void;
}

export default function ShareModal({
  imageBlob,
  imageUrl,
  score,
  onClose,
  onDownload,
}: ShareModalProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    if (!imageBlob) return;

    const shareText = `Just scanned a dating profile and found ${score}/10 red flags 🚩 Using @FlagCheckAI - try it yourself at flag-check.vercel.app`;

    // Web Share API pour mobile
    if (navigator.share && isMobile) {
      try {
        const file = new File([imageBlob], 'flagcheck-results.png', {
          type: 'image/png',
        });

        await navigator.share({
          title: 'FlagCheck Results',
          text: shareText,
          files: [file],
        });
        onClose();
      } catch (error) {
        // L'utilisateur a annulé ou erreur
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Desktop: ouvrir Twitter avec tweet pré-écrit
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(tweetUrl, '_blank');
      onDownload(); // Télécharger aussi l'image
    }
  };

  const handleDownload = async () => {
    if (!imageBlob) return;
    
    // Sur mobile, utiliser Web Share API pour sauvegarder dans la galerie
    if (navigator.share && isMobile) {
      try {
        const file = new File([imageBlob], 'flagcheck-results.png', {
          type: 'image/png',
        });
        
        await navigator.share({
          title: 'FlagCheck Results',
          files: [file],
        });
        onClose();
        return;
      } catch (error) {
        // Si l'utilisateur annule, ne rien faire
        if ((error as Error).name === 'AbortError') {
          return;
        }
      }
    }
    
    // Téléchargement classique pour desktop ou fallback
    onDownload();
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-md transition-all duration-300 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md rounded-3xl border border-white/10 bg-black/90 backdrop-blur-2xl p-6 shadow-2xl transition-all duration-300 ${
          isAnimating
            ? 'scale-90 opacity-0'
            : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Preview de l'image */}
        {imageUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 animate-fade-in">
            <img
              src={imageUrl}
              alt="Share preview"
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-3 rounded-xl glow-button px-6 py-4 font-bold text-white min-h-[56px] transition-all duration-300 hover:scale-105"
          >
            {isMobile ? (
              <>
                <Share2 className="h-5 w-5" />
                <span>Partager</span>
              </>
            ) : (
              <>
                <Twitter className="h-5 w-5" />
                <span>Partager sur Twitter</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-black/50 backdrop-blur-xl px-6 py-4 font-bold text-white min-h-[56px] transition-all hover:border-white/40 hover:bg-white/5"
          >
            <Download className="h-5 w-5" />
            <span>Télécharger l'image</span>
          </button>
        </div>
      </div>
    </div>
  );
}

