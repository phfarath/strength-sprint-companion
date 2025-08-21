import React, { useState, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, Loader2, Download, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const DocumentAnalysis = () => {
  const { analyzeAIHealthDocument } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      // Ler o conteúdo do arquivo
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDocumentText(event.target.result as string);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentText.trim()) {
      toast({
        title: "Documento vazio",
        description: "Por favor, insira o texto do documento ou faça upload de um arquivo.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setAnalysisResult('');
      
      const response = await analyzeAIHealthDocument({ documentText });
      setAnalysisResult(response.data.analysis);
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível analisar o documento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!analysisResult) return;
    
    const blob = new Blob([analysisResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-documento-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-6 max-w-7xl"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Análise de Documentos com IA</h1>
          <p className="text-gray-600">
            Faça upload de documentos médicos ou insira texto para obter uma análise personalizada.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Análise */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Documento para Análise</CardTitle>
              <p className="text-gray-600">Faça upload de um documento ou insira o texto diretamente.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant={isTextMode ? "outline" : "default"}
                    onClick={() => setIsTextMode(false)}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload de Arquivo
                  </Button>
                  <Button
                    type="button"
                    variant={isTextMode ? "default" : "outline"}
                    onClick={() => setIsTextMode(true)}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Inserir Texto
                  </Button>
                </div>

                {isTextMode ? (
                  <div>
                    <Label htmlFor="documentText">Texto do Documento</Label>
                    <Textarea
                      id="documentText"
                      value={documentText}
                      onChange={(e) => setDocumentText(e.target.value)}
                      placeholder="Cole aqui o texto do documento médico..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".txt,.pdf,.doc,.docx"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUploadClick}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {fileName ? fileName : 'Selecionar Arquivo'}
                      </Button>
                    </div>
                    
                    {fileName && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-gray-500 mr-2" />
                            <span className="text-sm font-medium">{fileName}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFile(null);
                              setFileName('');
                              setDocumentText('');
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading || (!documentText.trim() && !file)}
                  className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Analisar Documento
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resultado da Análise */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Resultado da Análise</CardTitle>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Análise do documento com insights personalizados.</p>
                {analysisResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Baixar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {analysisResult ? (
                <div className="prose max-w-none">
                  {analysisResult.split('\n').map((line, index) => (
                    <p key={index} className="mb-3">{line}</p>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Faça upload de um documento ou insira texto e clique em "Analisar Documento" para obter a análise.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </Layout>
  );
};

export default DocumentAnalysis;
