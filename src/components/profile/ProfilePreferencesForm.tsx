import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { User } from '@/types';
import {
  genderOptions,
  fitnessLevelOptions,
  goalOptions,
  equipmentOptions,
} from '@/constants/profilePreferences';

interface ProfilePreferencesFormProps {
  user: User | null;
}

type PreferencesFormState = {
  gender: string;
  fitnessLevel: string;
  goal: string;
  availableDays: string;
  equipment: string;
  injuries: string;
  workoutPreferences: string;
  dietaryRestrictions: string;
  foodPreferences: string;
};

const initialState = (user: User | null): PreferencesFormState => ({
  gender: user?.gender || '',
  fitnessLevel: user?.fitnessLevel || '',
  goal: user?.goal || '',
  availableDays: user?.availableDays != null ? String(user.availableDays) : '',
  equipment: user?.equipment || '',
  injuries: user?.injuries || '',
  workoutPreferences: user?.workoutPreferences || '',
  dietaryRestrictions: user?.dietaryRestrictions || '',
  foodPreferences: user?.foodPreferences || '',
});

const ProfilePreferencesForm: React.FC<ProfilePreferencesFormProps> = ({ user }) => {
  const { updateUserProfile } = useAppContext();
  const [formValues, setFormValues] = useState<PreferencesFormState>(initialState(user));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormValues(initialState(user));
  }, [user]);

  const availableDayOptions = useMemo(() => Array.from({ length: 7 }, (_, index) => index + 1), []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const availableDaysParsed = formValues.availableDays ? parseInt(formValues.availableDays, 10) : null;

    const payload = {
      name: user?.name || '',
      weight: user?.weight ?? null,
      height: user?.height ?? null,
      birthdate: user?.birthdate ?? null,
      gender: formValues.gender || null,
      fitnessLevel: formValues.fitnessLevel || null,
      goal: formValues.goal || null,
      availableDays: availableDaysParsed ?? null,
      equipment: formValues.equipment || null,
      injuries: formValues.injuries || null,
      workoutPreferences: formValues.workoutPreferences || null,
      dietaryRestrictions: formValues.dietaryRestrictions || null,
      foodPreferences: formValues.foodPreferences || null,
    } as Omit<User, 'id' | 'nutritionGoals'>;

    try {
      setIsSubmitting(true);
      await updateUserProfile(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <Key extends keyof PreferencesFormState>(key: Key, value: PreferencesFormState[Key]) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Preferências e Personalização</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Select
                value={formValues.gender}
                onValueChange={(value) => updateField('gender', value)}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fitnessLevel">Nível Fitness</Label>
              <Select
                value={formValues.fitnessLevel}
                onValueChange={(value) => updateField('fitnessLevel', value)}
              >
                <SelectTrigger id="fitnessLevel">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  {fitnessLevelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Objetivo Principal</Label>
              <Select
                value={formValues.goal}
                onValueChange={(value) => updateField('goal', value)}
              >
                <SelectTrigger id="goal">
                  <SelectValue placeholder="Selecione o objetivo" />
                </SelectTrigger>
                <SelectContent>
                  {goalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipamentos Disponíveis</Label>
              <Select
                value={formValues.equipment}
                onValueChange={(value) => updateField('equipment', value)}
              >
                <SelectTrigger id="equipment">
                  <SelectValue placeholder="Selecione a disponibilidade" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availableDays">Dias disponíveis por semana</Label>
              <Select
                value={formValues.availableDays}
                onValueChange={(value) => updateField('availableDays', value)}
              >
                <SelectTrigger id="availableDays">
                  <SelectValue placeholder="Selecione a disponibilidade" />
                </SelectTrigger>
                <SelectContent>
                  {availableDayOptions.map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      {day} dia{day > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="injuries">Lesões ou limitações</Label>
              <Textarea
                id="injuries"
                value={formValues.injuries}
                onChange={(event) => updateField('injuries', event.target.value)}
                placeholder="Descreva qualquer limitação física relevante"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workoutPreferences">Preferências de treino</Label>
              <Textarea
                id="workoutPreferences"
                value={formValues.workoutPreferences}
                onChange={(event) => updateField('workoutPreferences', event.target.value)}
                placeholder="Ex.: Prefiro treinos de força, gosto de exercícios com peso corporal"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietaryRestrictions">Restrições alimentares</Label>
              <Textarea
                id="dietaryRestrictions"
                value={formValues.dietaryRestrictions}
                onChange={(event) => updateField('dietaryRestrictions', event.target.value)}
                placeholder="Ex.: Intolerância à lactose, vegetariano, alergia a frutos do mar"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="foodPreferences">Preferências alimentares</Label>
              <Textarea
                id="foodPreferences"
                value={formValues.foodPreferences}
                onChange={(event) => updateField('foodPreferences', event.target.value)}
                placeholder="Ex.: Gosto de frango, arroz e legumes; não gosto de peixe"
                rows={3}
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-fitness-primary text-white" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar preferências'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfilePreferencesForm;
