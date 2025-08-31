import React from 'react';
import Layout from '@/components/layout/Layout';
import AccessibilityControls from '@/components/accessibility/AccessibilityControls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Settings: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-gray-600">Ajuste preferências de acessibilidade e experiência.</p>

        {/* Seções de configurações */}
        <div className="grid grid-cols-1 gap-6">
          {/* Acessibilidade */}
          <AccessibilityControls />

          {/* Placeholder para futuras configurações */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Outras Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Mais opções em breve.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;

