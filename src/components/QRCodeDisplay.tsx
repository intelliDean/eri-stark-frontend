import React from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Shield } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface QRCodeDisplayProps {
  data: string;
  label: string;
  itemId?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ data, label, itemId }) => {
  const downloadQRCode = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `certificate-qr-${itemId || 'unknown'}.png`;
      link.click();
    }
  };

  return (
    <Card className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            {label}
          </h3>
        </div>
        
        <div className="relative inline-block p-4 bg-white rounded-xl shadow-inner">
          <QRCodeCanvas
            value={data}
            size={300}
            fgColor="#1e3a8a"
            bgColor="#ffffff"
            level="M"
            className="rounded-lg"
          />
        </div>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
          Scan to verify product authenticity
        </p>

        <Button
          onClick={downloadQRCode}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          <Download className="w-4 h-4 mr-2" />
          Download QR Code
        </Button>
      </motion.div>
    </Card>
  );
};