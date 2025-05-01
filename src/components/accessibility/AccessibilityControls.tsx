
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Headphones, Volume2, Volume1, VolumeX, Circle } from 'lucide-react';

const AccessibilityControls = () => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  
  // Aplicar configurações de acessibilidade
  useEffect(() => {
    // Carregar configurações do localStorage
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setHighContrast(settings.highContrast || false);
      setFontSize(settings.fontSize || 1);
      setReducedMotion(settings.reducedMotion || false);
      setScreenReader(settings.screenReader || false);
    }
  }, []);
  
  // Salvar e aplicar configurações
  const applySettings = () => {
    const root = document.documentElement;
    
    // Aplicar contraste alto
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Aplicar tamanho da fonte
    root.style.setProperty('--font-size-multiplier', String(fontSize));
    
    // Aplicar movimento reduzido
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Salvar configurações
    const settings = { highContrast, fontSize, reducedMotion, screenReader };
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    
    // Adicionar estilos CSS dinamicamente
    const existingStyle = document.getElementById('accessibility-style');
    if (existingStyle) {
      document.head.removeChild(existingStyle);
    }
    
    const style = document.createElement('style');
    style.id = 'accessibility-style';
    
    // Estilo para contraste alto
    if (highContrast) {
      style.textContent += `
        body { background-color: #000 !important; color: #fff !important; }
        .bg-white, .bg-gray-50 { background-color: #111 !important; color: #fff !important; }
        .text-gray-600, .text-gray-500 { color: #ddd !important; }
        a, button { color: #ffff00 !important; }
        .border { border-color: #555 !important; }
      `;
    }
    
    // Estilo para tamanho da fonte
    style.textContent += `
      html { font-size: ${100 * fontSize}% !important; }
    `;
    
    // Estilo para movimento reduzido
    if (reducedMotion) {
      style.textContent += `
        * { animation: none !important; transition: none !important; }
      `;
    }
    
    document.head.appendChild(style);
  };
  
  // Aplicar configurações quando qualquer uma delas mudar
  useEffect(() => {
    applySettings();
  }, [highContrast, fontSize, reducedMotion, screenReader]);
  
  // Função para restaurar configurações padrão
  const resetSettings = () => {
    setHighContrast(false);
    setFontSize(1);
    setReducedMotion(false);
    setScreenReader(false);
    
    localStorage.removeItem('accessibilitySettings');
  };

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Headphones className="mr-2 h-5 w-5 text-purple-500" />
          <CardTitle className="text-lg font-semibold">Acessibilidade</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">Alto Contraste</Label>
              <p className="text-sm text-gray-500">Aumenta o contraste visual</p>
            </div>
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
              aria-label="Ativar modo de alto contraste"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-size">Tamanho da Fonte</Label>
              <span className="text-sm text-gray-500">
                {Math.round(fontSize * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Volume1 className="h-4 w-4" />
              <Slider
                id="font-size"
                min={0.8}
                max={1.5}
                step={0.1}
                value={[fontSize]}
                onValueChange={(values) => setFontSize(values[0])}
                aria-label="Ajustar tamanho da fonte"
              />
              <Volume2 className="h-4 w-4" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduced-motion">Redução de Movimento</Label>
              <p className="text-sm text-gray-500">Reduz animações na tela</p>
            </div>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
              aria-label="Ativar redução de movimento"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="screen-reader">Suporte a Leitor de Tela</Label>
              <p className="text-sm text-gray-500">Melhora a navegação por leitores</p>
            </div>
            <Switch
              id="screen-reader"
              checked={screenReader}
              onCheckedChange={setScreenReader}
              aria-label="Ativar suporte a leitor de tela"
            />
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={resetSettings}
          >
            Restaurar Padrões
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessibilityControls;
