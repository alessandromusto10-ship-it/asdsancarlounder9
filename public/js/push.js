// ===== GESTIONE NOTIFICHE PUSH CON ONESIGNAL =====
const PushManager = {
  APP_ID: 'e631ad4f-de2c-4747-83fa-34da6f85b8e0',
  currentUserId: null,
  oneSignalLoaded: false,

  async init() {
    console.log('🔔 PushManager: init()');

    const checkAuth = async () => {
      try {
        const { data: { user } } = await db.auth.getUser();
        
        if (user && user.id !== this.currentUserId) {
          console.log('👤 Nuovo utente rilevato:', user.id);
          this.currentUserId = user.id;
          
          if (!this.oneSignalLoaded) {
            console.log('📥 Utente loggato, carico OneSignal...');
            this.loadOneSignal();
          } else {
            console.log('✅ OneSignal già caricato, controllo subscription');
            this.checkAndSave();
          }
        } else if (!user && this.currentUserId) {
          console.log('👋 Utente ha fatto logout:', this.currentUserId);
          this.currentUserId = null;
        }
      } catch (err) {
        console.error('❌ Errore checkAuth:', err);
      }

      setTimeout(checkAuth, 2000);
    };

    checkAuth();
  },

  loadOneSignal() {
    console.log('📥 Caricamento script OneSignal...');
    
    if (!window.OneSignalDeferred) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;
    document.head.appendChild(script);

    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({ appId: PushManager.APP_ID });
      console.log('✅ OneSignal inizializzato');
      PushManager.oneSignalLoaded = true;

      OneSignal.Notifications.addEventListener('subscriptionChange', (isSubscribed) => {
        console.log('🔔 subscriptionChange:', isSubscribed);
        if (isSubscribed) {
          setTimeout(() => PushManager.saveSubscription(), 2000);
        }
      });

      OneSignal.Notifications.addEventListener('permissionChange', (permission) => {
        console.log('🔔 permissionChange:', permission);
        if (permission === 'granted' || permission === true) {
          setTimeout(() => PushManager.saveSubscription(), 2000);
        }
      });

      PushManager.checkAndSave();
    });
  },

  checkAndSave() {
    const OneSignal = window.OneSignal;
    if (!OneSignal) return;

    const perm = OneSignal.Notifications.permission;
    console.log('📋 Current permission:', perm);

    if (perm === 'granted' || perm === true) {
      console.log('✅ Permesso già concesso, salvo subscription');
      setTimeout(() => this.saveSubscription(), 2000);
    }
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
      } else {
        console.log('✅ Subscription salvata/aggiornata per utente:', user.id);
      }
    } catch (err) {
      console.error('❌ Errore saveSubscription:', err);
    }
  },

  // ✅ FUNZIONE PER INVIARE NOTIFICHE TRAMITE EDGE FUNCTION
  async sendNotification(title, message, options = {}) {
    try {
      console.log('📤 Invio notifica push...');
      console.log('📤 Titolo:', title);
      console.log('📤 Messaggio:', message);
      console.log('📤 Opzioni:', options);

      const { data: { session } } = await db.auth.getSession();
      if (!session) {
        console.error('❌ Utente non autenticato');
        return false;
      }

      const supabaseProjectUrl = 'https://ydcxrzdlmrprvhefnctj.supabase.co';

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-push-notification`;
      console.log('📤 Edge Function URL:', edgeFunctionUrl);

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          message,
          userIds: options.userIds || []
        })
      });

      console.log('📤 Response status:', response.status);
      console.log('📤 Response OK:', response.ok);

      // ✅ Leggi prima il testo, poi prova a parsare JSON
      const responseText = await response.text();
      console.log('📤 Response text:', responseText);

      if (!responseText) {
        throw new Error('Edge Function non ha risposto');
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Errore parsing JSON:', e);
        console.error('❌ Response non è JSON valido:', responseText);
        throw new Error('Risposta non valida dall\'Edge Function');
      }

      if (!response.ok) {
        console.error('❌ Errore Edge Function:', result);
        throw new Error(result.error || 'Errore invio notifica');
      }

      console.log('✅ Notifica inviata con successo:', result);
      return true;
    } catch (err) {
      console.error('❌ Errore sendNotification:', err);
      console.error('❌ Stack trace:', err.stack);
      return false;
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PushManager.init());
} else {
  PushManager.init();
}