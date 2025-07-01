import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Scan, Users, Building2, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface LandingPageProps {
  onPageChange: (page: 'manufacturer' | 'user') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPageChange }) => {
  const features = [
    {
      icon: Shield,
      title: 'Proof of Authenticity',
      description: 'Manufacturers cryptographically sign product certificates, ensuring tamper-proof verification.'
    },
    {
      icon: Scan,
      title: 'QR Code Verification',
      description: 'Simple QR code scanning reveals authentic product information and ownership details.'
    },
    {
      icon: Users,
      title: 'Ownership Transfer',
      description: 'Secure transfer of product ownership through blockchain-verified codes.'
    }
  ];

  const steps = [
    { step: 1, title: 'Manufacturer Registration', description: 'Register as a verified manufacturer on the blockchain' },
    { step: 2, title: 'Product Certification', description: 'Create and sign digital certificates for your products' },
    { step: 3, title: 'QR Code Generation', description: 'Generate unique QR codes for each certified product' },
    { step: 4, title: 'Customer Verification', description: 'Customers scan QR codes to verify authenticity and ownership' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900/20" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 mb-6 backdrop-blur-sm"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Shield className="w-4 h-4 mr-2" />
              Blockchain Product Verification
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Verify. Protect. Trust.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed">
              ERI leverages blockchain technology to create tamper-proof product certificates, 
              ensuring authenticity and enabling secure ownership transfers through cryptographic verification.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => onPageChange('manufacturer')}
                size="lg"
                className="group"
              >
                For Manufacturers
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => onPageChange('user')}
                variant="outline"
                size="lg"
                className="group"
              >
                For Users
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-800 dark:text-white">
              Why Choose ERI?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Advanced blockchain technology meets user-friendly verification
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="text-center h-full">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-blue-900/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-800 dark:text-white">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Simple steps to secure your products with blockchain verification
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center h-full">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Building2 className="w-16 h-16 mx-auto mb-6 text-blue-500" />
              <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-white">
                Ready to Secure Your Products?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                Join the blockchain revolution in product authentication and ownership verification.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => onPageChange('manufacturer')}
                  size="lg"
                >
                  Start as Manufacturer
                </Button>
                <Button
                  onClick={() => onPageChange('user')}
                  variant="outline"
                  size="lg"
                >
                  Verify as User
                </Button>
              </div>
            </motion.div>
          </Card>
        </div>
      </section>
    </div>
  );
};