const Auth = {
  async getCurrentUser() {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return null;
    const { data: profile } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return { user, profile };
  },

  async signInWithEmail(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email, password, fullName, role, playerId = null) {
    console.log('🔍 signUp chiamata con:', { email, role, playerId });
    
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, player_id: playerId }
      }
    });
    
    if (error) {
      console.error('❌ Errore signUp:', error);
      throw error;
    }
    
    console.log('✅ User creato:', data.user);
    
    // Se è un genitore e ha selezionato un giocatore, collega al primo slot libero
    if (role === 'genitore' && playerId && data.user) {
      try {
        console.log('🔗 Tentativo di collegamento giocatore:', playerId);
        
        // Controlla lo stato attuale del giocatore
        const { data: playerData, error: fetchError } = await db
          .from('players')
          .select('parent_id, parent_id_2')
          .eq('id', playerId)
          .single();
        
        if (fetchError) {
          console.error('❌ Errore nel fetch del player:', fetchError);
          throw fetchError;
        }
        
        console.log('📊 Stato player:', playerData);
        
        let updateError = null;
        
        if (!playerData.parent_id) {
          // Slot 1 libero
          console.log('✅ Uso parent_id (slot 1)');
          const { error } = await db
            .from('players')
            .update({ parent_id: data.user.id })
            .eq('id', playerId);
          updateError = error;
        } else if (!playerData.parent_id_2) {
          // Slot 2 libero
          console.log('✅ Uso parent_id_2 (slot 2)');
          const { error } = await db
            .from('players')
            .update({ parent_id_2: data.user.id })
            .eq('id', playerId);
          updateError = error;
        } else {
          console.error('❌ Entrambi gli slot occupati!');
          throw new Error('Questo giocatore ha già due genitori associati');
        }
        
        if (updateError) {
          console.error('❌ Errore nell\'update:', updateError);
          throw updateError;
        }
        
        console.log('✅ Collegamento riuscito!');
      } catch (err) {
        console.error('❌ Errore nel collegamento genitore-figlio:', err);
        // Non blocchiamo la registrazione, ma logghiamo l'errore
      }
    }
    
    return data;
  },

  async signInWithGoogle() {
    const { data, error } = await db.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }
      }
    });
    if (error) throw error;
  },

  async resetPassword(email) {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/#reset'
    });
    if (error) throw error;
  },

  async signOut() {
    await db.auth.signOut();
  },

  async isMister() {
    const { profile } = await this.getCurrentUser() || {};
    return profile?.role === 'mister';
  }
};

window.Auth = Auth;