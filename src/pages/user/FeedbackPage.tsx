
import React from 'react';
import Layout from '@/components/layout/Layout';
import UserFeedbackForm from '@/components/feedback/UserFeedbackForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FeedbackPage = () => {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ajude-nos a Melhorar</h1>
        <p className="text-gray-600">Sua opinião é muito importante para continuarmos evoluindo.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <UserFeedbackForm />
        </div>
        
        <div>
          <Card className="bg-white mb-6">
            <CardHeader>
              <CardTitle>Por que seu feedback é importante</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Usamos seu feedback para melhorar constantemente o aplicativo, adicionando novos recursos
                e corrigindo problemas que possam afetar sua experiência.
              </p>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-start">
                  <div className="bg-purple-100 text-purple-800 rounded-full p-1 mr-2">
                    <span className="block h-5 w-5 rounded-full text-center">1</span>
                  </div>
                  <p>Analisamos cada feedback individualmente</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 text-purple-800 rounded-full p-1 mr-2">
                    <span className="block h-5 w-5 rounded-full text-center">2</span>
                  </div>
                  <p>Priorizamos as funcionalidades mais solicitadas</p>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 text-purple-800 rounded-full p-1 mr-2">
                    <span className="block h-5 w-5 rounded-full text-center">3</span>
                  </div>
                  <p>Implementamos melhorias em cada atualização</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default FeedbackPage;
