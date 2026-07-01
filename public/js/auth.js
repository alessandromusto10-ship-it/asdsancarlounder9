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
    
    // Se è un genitore e ha selezionato un giocatore, associa tramite RPC
    if (role === 'genitore' && playerId && data.user) {
      try {
        console.log('🔗 Tentativo di associazione giocatore:', playerId);
        
        // Usa la funzione SQL che bypassa il RLS
        const { data: result, error: rpcError } = await db
          .rpc('associate_parent_to_player', {
            p_player_id: playerId,
            p_parent_id: data.user.id
          });
        
        if (rpcError) {
          console.error('❌ Errore RPC associazione:', rpcError);
          console.warn('⚠️ Associazione fallita, ma registrazione completata');
        } else {
          console.log('✅ Associazione riuscita:', result);
        }
      } catch (err) {
        console.error(' Errore nell\'associazione genitore-figlio:', err);
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
    return data;
  },

  async ensureMisterProfile(user) {
    if (!user || !user.email) return null;
    
    console.log('🔍 Verifica mister per email:', user.email);
    
    // 1. Controlla se l'email è nella whitelist
    const { data: misterEntry, error: mErr } = await db
      .from('authorized_misters')
      .select('*')
      .eq('email', user.email)
      .single();
    
    if (mErr || !misterEntry) {
      console.error('❌ Email non autorizzata come mister:', user.email);
      return null;
    }
    
    // 2. Controlla se il profilo esiste già
    const { data: existingProfile } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (existingProfile) {
      console.log('✅ Profilo mister esistente trovato');
      return existingProfile;
    }
    
    // 3. Crea il profilo mister
    const { data: newProfile, error: pErr } = await db
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: misterEntry.full_name || user.user_metadata?.full_name || user.email,
        role: 'mister'
      })
      .select()
      .single();
    
    if (pErr) {
      console.error('❌ Errore creazione profilo mister:', pErr);
      throw pErr;
    }
    
    console.log('✅ Profilo mister creato:', newProfile);
    return newProfile;
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