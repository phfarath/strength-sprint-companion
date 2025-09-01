import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Headphones, Volume2, Volume1 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const AccessibilityControls: React.FC = () => {
  const { settings, updateSettings } = useAppContext();
  const { a11y } = settings;

  const setHighContrast = (v: boolean) => updateSettings({ a11y: { ...a11y, highContrast: v } });
  const setFontScale = (v: number) => updateSettings({ a11y: { ...a11y, fontScale: v } });
  const setReducedMotion = (v: boolean) => updateSettings({ a11y: { ...a11y, reducedMotion: v } });
  const setScreenReader = (v: boolean) => updateSettings({ a11y: { ...a11y, screenReader: v } });

  const resetSettings = () => {
    updateSettings({ a11y: { highContrast: false, fontScale: 1, reducedMotion: false, screenReader: false, largeCursor: false } });
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
              checked={!!a11y.highContrast}
              onCheckedChange={setHighContrast}
              aria-label="Ativar modo de alto contraste"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-size">Tamanho da Fonte</Label>
              <span className="text-sm text-gray-500">{Math.round((a11y.fontScale || 1) * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume1 className="h-4 w-4" />
              <Slider
                id="font-size"
                min={0.8}
                max={1.5}
                step={0.1}
                value={[a11y.fontScale || 1]}
                onValueChange={(values) => setFontScale(values[0])}
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
              checked={!!a11y.reducedMotion}
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
              checked={!!a11y.screenReader}
              onCheckedChange={setScreenReader}
              aria-label="Ativar apoio a leitor de tela"
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

