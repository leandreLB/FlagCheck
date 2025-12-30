'use client';

import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface ShareResultImageProps {
  totalScore: number;
  categoryScores: {
    communication: number;
    boundaries: number;
    attachment: number;
    honesty: number;
    toxic: number;
  };
  onImageReady?: (imageDataUrl: string) => void;
}

export default function ShareResultImage({ totalScore, categoryScores, onImageReady }: ShareResultImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    // Générer le QR code
    const generateQRCode = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_APP_URL || 'https://flagcheck.app';
        const dataUrl = await QRCode.toDataURL(url, {
          width: 120,
          margin: 1,
          color: {
            dark: '#FFFFFF',
            light: '#000000',
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, []);

  // Fonction pour obtenir la couleur d'une catégorie selon son score
  const getCategoryColor = (score: number): string => {
    if (score <= 3) return '#22c55e'; // Vert
    if (score <= 6) return '#f59e0b'; // Orange
    return '#ef4444'; // Rouge
  };

  // Dimensions Instagram Story
  const width = 1080;
  const height = 1920;

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        background: 'linear-gradient(to bottom, #000000 0%, #4c1d95 50%, #7c3aed 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '80px 60px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Logo FlagCheck en haut */}
      <div style={{ marginTop: '40px' }}>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'center',
            letterSpacing: '2px',
          }}
        >
          FlagCheck
        </div>
      </div>

      {/* Score au centre */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        {/* Score principal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '20px',
            marginBottom: '40px',
          }}
        >
          <span
            style={{
              fontSize: '180px',
              fontWeight: '900',
              color: '#FFFFFF',
              lineHeight: '1',
              textShadow: '0 0 40px rgba(236, 72, 153, 0.8)',
            }}
          >
            {totalScore.toFixed(1)}
          </span>
          <span
            style={{
              fontSize: '80px',
              fontWeight: '700',
              color: '#9ca3af',
            }}
          >
            / 10
          </span>
          <span style={{ fontSize: '120px' }}>🚩</span>
        </div>

        {/* Texte "Am I a red flag?" */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: '700',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: '60px',
          }}
        >
          Am I a red flag?
        </div>

        {/* Breakdown visuel avec 5 cercles */}
        <div
          style={{
            display: 'flex',
            gap: '30px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {Object.entries(categoryScores).map(([key, score]) => (
            <div
              key={key}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: getCategoryColor(score),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                boxShadow: `0 0 20px ${getCategoryColor(score)}80`,
              }}
            >
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}
              >
                {score.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Watermark en bas */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '60px',
        }}
      >
        <div
          style={{
            fontSize: '32px',
            color: '#d1d5db',
            textAlign: 'center',
            fontWeight: '500',
          }}
        >
          Test yourself on FlagCheck
        </div>
        {qrCodeDataUrl && (
          <img
            src={qrCodeDataUrl}
            alt="QR Code"
            style={{
              width: '120px',
              height: '120px',
              backgroundColor: '#FFFFFF',
              padding: '10px',
              borderRadius: '12px',
            }}
          />
        )}
        <div
          style={{
            fontSize: '24px',
            color: '#9ca3af',
            fontWeight: '400',
          }}
        >
          flagcheck.app
        </div>
      </div>
    </div>
  );
}

