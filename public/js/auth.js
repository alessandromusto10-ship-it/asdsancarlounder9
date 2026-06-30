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
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, player_id: playerId }
      }
    });
    if (error) throw error;
    
    // Se è un genitore, collega il giocatore al primo slot libero
    if (role === 'genitore' && playerId && data.user) {
      // Controlla se il primo slot è libero
      const { data: playerData } = await db
        .from('players')
        .select('parent_id')
        .eq('id', playerId)
        .single();

      if (playerData && !playerData.parent_id) {
        // Slot 1 libero
        await db.from('players').update({ parent_id: data.user.id }).eq('id', playerId);
      } else {
        // Slot 1 occupato, usa Slot 2
        await db.from('players').update({ parent_id_2: data.user.id }).eq('id', playerId);
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