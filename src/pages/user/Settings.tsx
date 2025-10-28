import React from 'react';
import Layout from '@/components/layout/Layout';
import AccessibilityControls from '@/components/accessibility/AccessibilityControls';
import SettingsApplier from '@/components/settings/SettingsApplier';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useI18n } from '@/i18n';
import { useUnits } from '@/hooks/useUnits';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useAppContext();
  const { t } = useI18n();
  const units = useUnits();
  const quietHoursEnabled = Boolean(settings.notifications.quietHours);

  return (
    <Layout>
      {/* Aplica tema e acessibilidade globalmente */}
      <SettingsApplier />
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          <p className="text-gray-600">{t('settings.subtitle')} Idioma: {settings.appearance.language.toUpperCase()}</p>
        </div>

        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="appearance">{t('settings.tabs.appearance')}</TabsTrigger>
            <TabsTrigger value="account">{t('settings.tabs.account')}</TabsTrigger>
            <TabsTrigger value="privacy">{t('settings.tabs.privacy')}</TabsTrigger>
            <TabsTrigger value="prefs">{t('settings.tabs.prefs')}</TabsTrigger>
            <TabsTrigger value="integrations">{t('settings.tabs.integrations')}</TabsTrigger>
            <TabsTrigger value="ai">{t('settings.tabs.ai')}</TabsTrigger>
            <TabsTrigger value="data">{t('settings.tabs.data')}</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
            <AccessibilityControls />
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>{t('appearance.theme')}, {t('appearance.color')}, {t('appearance.language')} & {t('appearance.units.energy')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('appearance.theme')}</Label>
                    <Select
                      value={settings.appearance.theme}
                      onValueChange={(v) => updateSettings({ appearance: { ...settings.appearance, theme: v as any } })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t('appearance.theme.light')}</SelectItem>
                        <SelectItem value="dark">{t('appearance.theme.dark')}</SelectItem>
                        <SelectItem value="system">{t('appearance.theme.system')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('appearance.color')}</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={settings.appearance.primaryColor}
                        onChange={(e) => updateSettings({ appearance: { ...settings.appearance, primaryColor: e.target.value } })}
                        className="h-10 w-16 p-1"
                      />
                      <Input
                        type="text"
                        value={settings.appearance.primaryColor}
                        onChange={(e) => updateSettings({ appearance: { ...settings.appearance, primaryColor: e.target.value } })}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* Suggested palette */}
                      <span className="text-xs text-gray-500 mr-2">{t('appearance.palette')}:</span>
                      {['#7c3aed','#6d28d9','#9333ea','#a855f7','#22c55e','#0ea5e9','#ef4444','#f59e0b'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: c }}
                          onClick={() => updateSettings({ appearance: { ...settings.appearance, primaryColor: c } })}
                          aria-label={`set color ${c}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('appearance.density')}</Label>
                    <Select
                      value={settings.appearance.density}
                      onValueChange={(v) => updateSettings({ appearance: { ...settings.appearance, density: v as any } })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Densidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comfortable">{t('appearance.density.comfortable')}</SelectItem>
                        <SelectItem value="compact">{t('appearance.density.compact')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('appearance.language')}</Label>
                    <Select
                      value={settings.appearance.language}
                      onValueChange={(v) => updateSettings({ appearance: { ...settings.appearance, language: v as any } })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('appearance.units.weight')}</Label>
                    <Select
                      value={settings.appearance.units.weight}
                      onValueChange={(v) =>
                        updateSettings({ appearance: { ...settings.appearance, units: { ...settings.appearance.units, weight: v as any } } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('appearance.units.length')}</Label>
                    <Select
                      value={settings.appearance.units.length}
                      onValueChange={(v) =>
                        updateSettings({ appearance: { ...settings.appearance, units: { ...settings.appearance.units, length: v as any } } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('appearance.units.energy')}</Label>
                    <Select
                      value={settings.appearance.units.energy}
                      onValueChange={(v) =>
                        updateSettings({ appearance: { ...settings.appearance, units: { ...settings.appearance.units, energy: v as any } } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kcal">kcal</SelectItem>
                        <SelectItem value="kJ">kJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {units.formatWeight(80)} • {units.formatLength(180)} • {units.formatEnergy(2200)}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Conta & Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Sessões, 2FA, vincular contas. (Fase 2)</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Privacidade</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Consentimentos, retenção e preferência de comunicação. (Fase 3)</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prefs">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Treino & Nutrição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notif-push">Notificações Push</Label>
                    <p className="text-sm text-gray-500">
                      Receba lembretes sobre treinos e refeições
                    </p>
                  </div>
                  <Switch
                    id="notif-push"
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) =>
                      updateSettings({ notifications: { ...settings.notifications, push: checked } })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notif-email">Notificações por E-mail</Label>
                    <p className="text-sm text-gray-500">
                      Receba resumos semanais e atualizações por e-mail
                    </p>
                  </div>
                  <Switch
                    id="notif-email"
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) =>
                      updateSettings({ notifications: { ...settings.notifications, email: checked } })
                    }
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="quiet-hours-toggle">Horário Silencioso</Label>
                      <p className="text-sm text-gray-500">
                        Defina um período em que não deseja receber notificações
                      </p>
                    </div>
                    <Switch
                      id="quiet-hours-toggle"
                      checked={quietHoursEnabled}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateSettings({
                            notifications: {
                              ...settings.notifications,
                              quietHours: { start: '22:00', end: '08:00' },
                            },
                          });
                        } else {
                          updateSettings({
                            notifications: {
                              ...settings.notifications,
                              quietHours: null,
                            },
                          });
                        }
                      }}
                    />
                  </div>

                  {quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div>
                        <Label htmlFor="quiet-start" className="text-sm">Início</Label>
                        <Input
                          id="quiet-start"
                          type="time"
                          value={settings.notifications.quietHours?.start || '22:00'}
                          onChange={(e) =>
                            updateSettings({
                              notifications: {
                                ...settings.notifications,
                                quietHours: {
                                  start: e.target.value,
                                  end: settings.notifications.quietHours?.end || '08:00',
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="quiet-end" className="text-sm">Fim</Label>
                        <Input
                          id="quiet-end"
                          type="time"
                          value={settings.notifications.quietHours?.end || '08:00'}
                          onChange={(e) =>
                            updateSettings({
                              notifications: {
                                ...settings.notifications,
                                quietHours: {
                                  start: settings.notifications.quietHours?.start || '22:00',
                                  end: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Google Fit, Apple Health, Strava, etc. (Fase 5)</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Preferências de IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ai-persona">Persona da IA</Label>
                  <Select
                    value={settings.ai.persona}
                    onValueChange={(v) =>
                      updateSettings({ ai: { ...settings.ai, persona: v as any } })
                    }
                  >
                    <SelectTrigger id="ai-persona">
                      <SelectValue placeholder="Selecione a persona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Técnica</SelectItem>
                      <SelectItem value="motivational">Motivacional</SelectItem>
                      <SelectItem value="neutral">Neutra</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">Escolha o estilo de comunicação da IA</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-language">Idioma da IA</Label>
                  <Select
                    value={settings.ai.language}
                    onValueChange={(v) =>
                      updateSettings({ ai: { ...settings.ai, language: v as any } })
                    }
                  >
                    <SelectTrigger id="ai-language">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automático</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">Idioma das respostas da IA</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-creativity">Criatividade ({settings.ai.creativity.toFixed(1)})</Label>
                  <Slider
                    id="ai-creativity"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[settings.ai.creativity]}
                    onValueChange={([value]) =>
                      updateSettings({ ai: { ...settings.ai, creativity: value } })
                    }
                  />
                  <p className="text-sm text-gray-500">
                    Controla a variação nas respostas da IA (0 = mais conservador, 1 = mais criativo)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ai-training">Permitir uso de dados para treinamento</Label>
                    <p className="text-sm text-gray-500">
                      Seus dados podem ser usados para melhorar os modelos de IA
                    </p>
                  </div>
                  <Switch
                    id="ai-training"
                    checked={settings.ai.allowTraining}
                    onCheckedChange={(checked) =>
                      updateSettings({ ai: { ...settings.ai, allowTraining: checked } })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Dados & Zona de Risco</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Exportar dados e excluir conta. (Fase 3)</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
