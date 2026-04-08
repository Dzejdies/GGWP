import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import './WizardRegistrationModal.css';

export default function WizardRegistrationModal({ tournament, user, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    team_name: '',
    tag: '',
    avatarFile: null,
    avatarPreview: null,
    discord_id: '',
    discord_joined: false,
    game_rank: '',
    accepted_rules: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextStep = () => {
    if (step === 1 && (!formData.team_name.trim() || !formData.tag.trim())) {
      setError('Nazwa drużyny i Tag są wymagane!');
      return;
    }
    if (step === 2 && (!formData.discord_id.trim() || !formData.discord_joined || !formData.game_rank)) {
      setError('Uzupełnij wszystkie dane w tym kroku!');
      return;
    }
    if (step === 3 && !formData.accepted_rules) {
      setError('Musisz zaakceptować regulamin turnieju!');
      return;
    }
    
    setError('');
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let avatar_url = null;

      if (formData.avatarFile) {
        const fileExt = formData.avatarFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, formData.avatarFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatar_url = data.publicUrl;
      }

      // Zapisujemy nową drużynę
      const { data: newTeam, error: dbError } = await supabase
        .from('teams')
        .insert({
          tournament_id: tournament.id,
          leader_id: user.id,
          team_name: formData.team_name,
          tag: formData.tag.toUpperCase(),
          avatar_url: avatar_url,
          discord_id: formData.discord_id,
          game_rank: formData.game_rank
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // DODATEK: Automatycznie dodajemy lidera do tabeli team_members
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: newTeam.id,
          user_id: user.id,
          role: 'captain',
          status: 'accepted'
        });

      if (memberError) throw memberError;

      onSuccess(newTeam); // Poinformowanie powracającego komponentu

    } catch (err) {
      console.error(err);
      setError('Wystąpił błąd podczas finalizacji: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div className="wizard-modal" onClick={e => e.stopPropagation()}>
        <button className="wizard-close" onClick={onClose}>✕</button>
        
        <div className="wizard-header">
          <h2>Rejestracja Drużyny</h2>
          <div className="wizard-progress">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
            <div className={`step-line ${step >= 4 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 4 ? 'active' : ''}`}>4</div>
          </div>
        </div>

        {error && <div className="wizard-error">{error}</div>}

        <div className="wizard-body">
          {step === 1 && (
            <div className="wizard-step">
              <h3>Podstawy Drużyny</h3>
              <p className="wizard-subtitle">Wybierz unikalną nazwę i wyróżnij się własnym logiem.</p>
              
              <div className="wizard-field">
                <label>Nazwa reprezentująca drużynę *</label>
                <input 
                  type="text" 
                  value={formData.team_name}
                  onChange={e => setFormData({...formData, team_name: e.target.value})}
                  placeholder="np. Niezwyciężeni Orłowie" 
                />
              </div>

              <div className="wizard-field">
                <label>Tag Drużyny (2-5 znaków) *</label>
                <input 
                  type="text" 
                  value={formData.tag}
                  onChange={e => setFormData({...formData, tag: e.target.value.toUpperCase()})}
                  placeholder="np. ORŁY" 
                  maxLength={5}
                />
              </div>

              <div className="wizard-field">
                <label>Avatar / Logo (Opcjonalnie)</label>
                <div className="avatar-upload-zone">
                  {formData.avatarPreview ? (
                    <img src={formData.avatarPreview} alt="Avatar" className="avatar-preview" />
                  ) : (
                    <div className="avatar-placeholder">🖼️</div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <h3>Wymagania Kontaktowe</h3>
              <p className="wizard-subtitle">Organizator prosi o kontakt do kapitana w celach meczowych.</p>
              
              <div className="wizard-field">
                <label>Discord ID Kapitana *</label>
                <input 
                  type="text" 
                  value={formData.discord_id}
                  onChange={e => setFormData({...formData, discord_id: e.target.value})}
                  placeholder="np. Kowalski#1234" 
                />
              </div>

              <label className="wizard-checkbox">
                <input 
                  type="checkbox" 
                  checked={formData.discord_joined}
                  onChange={e => setFormData({...formData, discord_joined: e.target.checked})}
                />
                Dołączyłem na oficjalny serwer Discord turnieju (discord.gg/turniej-ggwp)
              </label>

              <div className="wizard-field" style={{marginTop: '1.5rem'}}>
                <label>Deklarowana najwyższa ranga w grze *</label>
                <select 
                  value={formData.game_rank}
                  onChange={e => setFormData({...formData, game_rank: e.target.value})}
                >
                  <option value="" disabled>--- Wybierz ---</option>
                  <option value="Brak (Unranked)">Brak (Unranked)</option>
                  <option value="Bronze / Silver">Bronze / Silver</option>
                  <option value="Gold / Platinum">Gold / Platinum (Faceit 1-4)</option>
                  <option value="Emerald / Diamond">Emerald / Diamond (Faceit 5-8)</option>
                  <option value="Master / Challenger">Master / Challenger (Faceit 9-10)</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <h3>Oświadczenia</h3>
              <p className="wizard-subtitle">Ostatni krok logistyczny przed zatwierdzeniem składu.</p>
              
              <div className="rules-box">
                <h4>Regulamin wydarzenia: {tournament.title}</h4>
                <p>1. Zabrania się używania wulgarnych nazw profilowych.</p>
                <p>2. Kapitan odpowiada za dyscyplinę na czacie drużynowym.</p>
                <p>3. Ranga musi być zbieżna ze zgłoszoną w formularzu.</p>
              </div>

              <label className="wizard-checkbox highlight-checkbox">
                <input 
                  type="checkbox" 
                  checked={formData.accepted_rules}
                  onChange={e => setFormData({...formData, accepted_rules: e.target.checked})}
                />
                Potwierdzam znajomość regulaminu i akceptuję przetwarzanie danych.
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="wizard-step">
              <h3>Podsumowanie i Finalizacja</h3>
              <p className="wizard-subtitle">Sprawdź czy wszystkie dane się zgadzają.</p>
              
              <div className="summary-box">
                <div className="summary-row">
                  <span>Nazwa:</span>
                  <strong>{formData.team_name} [{formData.tag}]</strong>
                </div>
                <div className="summary-row">
                  <span>Obowiązujący Turniej:</span>
                  <strong>{tournament.title}</strong>
                </div>
                <div className="summary-row">
                  <span>Twój Discord:</span>
                  <strong>{formData.discord_id}</strong>
                </div>
                <div className="summary-row">
                  <span>Ranga:</span>
                  <strong>{formData.game_rank}</strong>
                </div>
                <div className="summary-row">
                  <span>Avatar:</span>
                  <strong>{formData.avatarFile ? 'Załączony' : 'Brak (Domyślny)'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          {step > 1 ? (
            <button className="gh-btn gh-btn--outline" onClick={prevStep} disabled={loading}>
              Wstecz
            </button>
          ) : <div></div>}
          
          {step < 4 ? (
            <button className="gh-btn" onClick={nextStep}>
              Zapisz i Dalej
            </button>
          ) : (
            <button className="gh-btn gh-btn--success" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Przetwarzanie...' : '🔏 Definitywnie zgłoś drużynę'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
