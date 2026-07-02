// ===== GESTIONE NOTIFICHE PUSH CON ONESIGNAL =====
const PushManager = {
  APP_ID: 'e631ad4f-de2c-4747-83fa-34da6f85b8e0',
  currentUserId: null,

  async init() {
    console.log('🔔 PushManager: init() chiamato');

    // ✅ Carica OneSignal SDK se non è già caricato
    if (!window.OneSignalDeferred) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      document.head.appendChild(script);
      console.log('📥 Caricamento script OneSignal...');
    }

    // ✅ Aspetta che OneSignal sia pronto
    window.OneSignalDeferred.push(async (OneSignal) => {
      console.log('✅ OneSignalDeferred callback eseguita');
      
      await OneSignal.init({ appId: PushManager.APP_ID });
      console.log('✅ OneSignal inizializzato');

      // Ascolta quando cambia la subscription
      OneSignal.Notifications.addEventListener('subscriptionChange', (isSubscribed) => {
        console.log('🔔 subscriptionChange:', isSubscribed);
        if (isSubscribed) {
          setTimeout(() => PushManager.saveSubscription(), 2000);
        }
      });

      // Ascolta quando cambia il permesso
      OneSignal.Notifications.addEventListener('permissionChange', (permission) => {
        console.log('🔔 permissionChange:', permission);
        if (permission === 'granted' || permission === true) {
          setTimeout(() => PushManager.saveSubscription(), 2000);
        }
      });

      // ✅ Controlla il permesso corrente
      const perm = OneSignal.Notifications.permission;
      console.log('📋 Current permission:', perm);

      // ✅ Inizia a monitorare il login/logout
      PushManager.startAuthMonitor();
    });
  },

  // ✅ MONITORA IL LOGIN/LOGOUT E SALVA LA SUBSCRIPTION PER OGNI UTENTE
  startAuthMonitor() {
    console.log('🔍 startAuthMonitor: inizio monitoraggio login/logout');
    
    const checkAuth = async () => {
      try {
        const { data: { user } } = await db.auth.getUser();
        
        if (user && user.id !== this.currentUserId) {
          // Nuovo utente loggato (o primo login)
          console.log('👤 Nuovo utente rilevato:', user.id);
          console.log('👤 Vecchio user_id:', this.currentUserId);
          this.currentUserId = user.id;

          // ✅ Controlla se OneSignal è pronto e il permesso è già concesso
          const OneSignal = window.OneSignal;
          if (OneSignal) {
            const perm = OneSignal.Notifications.permission;
            console.log('📋 Permission per nuovo utente:', perm);
            
            if (perm === 'granted' || perm === true) {
              console.log('✅ Permesso già concesso, salvo subscription per nuovo utente');
              // Aspetta un attimo che OneSignal abbia l'ID
              setTimeout(() => this.saveSubscription(), 2000);
            } else {
              console.log('⏳ Permesso non ancora concesso, aspetto...');
            }
          }
        } else if (!user && this.currentUserId) {
          // Utente ha fatto logout
          console.log('👋 Utente ha fatto logout:', this.currentUserId);
          this.currentUserId = null;
        }
      } catch (err) {
        console.error('❌ Errore checkAuth:', err);
      }

      // Controlla ogni 2 secondi
      setTimeout(checkAuth, 2000);
    };

    checkAuth();
  },

  async saveSubscription() {
    try {
      console.log('💾 saveSubscription: inizio salvataggio...');
      
      const OneSignal = window.OneSignal;
      if (!OneSignal) {
        console.error('❌ OneSignal non disponibile');
        return;
      }

      const userId = OneSignal.User.PushSubscription.id;
      const optIn = OneSignal.User.PushSubscription.optedIn;

      console.log('📋 OneSignal User ID:', userId);
      console.log('📋 Opt-in status:', optIn);

      if (!userId) {
        console.warn('⚠️ Nessun userId disponibile, riprovo tra 1s...');
        setTimeout(() => this.saveSubscription(), 1000);
        return;
      }

      if (!optIn) {
        console.warn('⚠️ Opt-in false');
        return;
      }

      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        console.warn('⚠️ Utente non loggato');
        return;
      }

      console.log('👤 User ID Supabase:', user.id);

      const ua = navigator.userAgent;
      let deviceType = 'Web';
      if (/android/i.test(ua)) deviceType = 'Android';
      else if (/iphone|ipad|ipod/i.test(ua)) deviceType = 'iOS';

      console.log('📱 Device type:', deviceType);

      // ✅ UPSERT: Se onesignal_player_id esiste già, aggiorna user_id e device_type
      console.log('💾 Eseguo upsert su push_subscriptions...');
      const { data, error } = await db
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          onesignal_player_id: userId,
          device_type: deviceType
        }, {
          onConflict: 'onesignal_player_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('❌ Errore DB:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ Subscription salvata/aggiornata per utente:', user.id);
        console.log('✅ Dati salvati:', data);
      }
    } catch (err) {
      console.error('❌ Errore saveSubscription:', err);
      console.error('❌ Stack trace:', err.stack);
    }
  },

  async deleteSubscription() {
    try {
      const { data: { user } } = await db.auth.getUser();
      if (!user) return;

      const { error } = await db
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Errore eliminazione:', error);
      } else {
        console.log('🗑️ Subscription eliminata');
      }
    } catch (err) {
      console.error('❌ Errore deleteSubscription:', err);
    }
  }
};

window.PushManager = PushManager;

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded');
    PushManager.init();
  });
} else {
  console.log('📄 DOM già pronto');
  PushManager.init();
}