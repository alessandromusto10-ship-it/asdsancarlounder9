// ===== GESTIONE NOTIFICHE PUSH CON ONESIGNAL =====
const PushManager = {
  APP_ID: 'e631ad4f-de2c-4747-83fa-34da6f85b8e0',
  EDGE_FUNCTION_URL: null,

  async init() {
    console.log('🔔 PushManager: Inizializzazione...');
    
    // Imposta l'URL dell'Edge Function
    const supabaseUrl = typeof SUPABASE_URL !== 'undefined' 
      ? SUPABASE_URL 
      : 'https://ydcxrzdlmrprvhefnctj.supabase.co/';
    
    this.EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/send-push-notification`;
    console.log('🔔 Edge Function URL:', this.EDGE_FUNCTION_URL);

    if (!window.OneSignalDeferred) {
      console.warn('⚠️ OneSignal non disponibile - verificare che lo script sia caricato');
      return;
    }

    window.OneSignalDeferred.push(async (OneSignal) => {
      console.log('✅ OneSignal caricato');
      console.log('📋 OneSignal object:', OneSignal);
      
      // Quando l'utente cambia lo stato della subscription
      if (OneSignal.Notifications && OneSignal.Notifications.addEventListener) {
        OneSignal.Notifications.addEventListener('subscriptionChange', (isSubscribed) => {
          console.log('🔔 Subscription change:', isSubscribed);
          if (isSubscribed) {
            this.saveSubscription();
          } else {
            this.deleteSubscription();
          }
        });
      }

      // Controlla se già sottoscritto
      try {
        const permission = OneSignal.Notifications.permission;
        console.log('🔔 Permesso notifiche:', permission);
        
        if (permission === 'granted') {
          console.log('✅ Permesso già concesso, salvo subscription');
          await this.saveSubscription();
        } else if (permission === 'default') {
          console.log('⏳ Permesso non ancora richiesto');
        }
      } catch (err) {
        console.error('❌ Errore nel controllo permessi:', err);
      }
    });
  },

  async saveSubscription() {
    try {
      console.log('💾 Salvataggio subscription...');
      
      const OneSignal = window.OneSignal;
      if (!OneSignal) {
        console.error('❌ OneSignal non disponibile');
        return;
      }

      // Metodo corretto per OneSignal SDK v16
      const userId = OneSignal.User.PushSubscription.id;
      const optIn = OneSignal.User.PushSubscription.optedIn;

      console.log('📋 OneSignal User ID:', userId);
      console.log('📋 Opt-in status:', optIn);

      if (!userId || !optIn) {
        console.warn('⚠️ Nessun userId o opt-in false');
        console.log('Current PushSubscription:', OneSignal.User.PushSubscription);
        return;
      }

      // Verifica che l'utente sia loggato
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        console.warn('⚠️ Utente non loggato');
        return;
      }

      console.log('👤 User ID da Supabase:', user.id);

      // Rileva il tipo di dispositivo
      const ua = navigator.userAgent;
      let deviceType = 'Web';
      if (/android/i.test(ua)) deviceType = 'Android';
      else if (/iphone|ipad|ipod/i.test(ua)) deviceType = 'iOS';

      console.log('📱 Device type:', deviceType);

      // Salva o aggiorna la subscription nel database
      const { data, error } = await db
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          onesignal_player_id: userId,
          device_type: deviceType
        }, {
          onConflict: 'onesignal_player_id'
        })
        .select();

      if (error) {
        console.error('❌ Errore salvataggio subscription:', error);
      } else {
        console.log('✅ Subscription salvata con successo!', data);
      }
    } catch (err) {
      console.error('❌ Errore saveSubscription:', err);
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
        console.error('❌ Errore eliminazione subscription:', error);
      } else {
        console.log('🗑️ Subscription eliminata');
      }
    } catch (err) {
      console.error('❌ Errore deleteSubscription:', err);
    }
  },

  // Invia notifica tramite Edge Function (sicuro, senza esporre API Key)
  async sendNotification(title, message, options = {}) {
    try {
      const { data: { session } } = await db.auth.getSession();
      if (!session) {
        console.error('❌ Utente non autenticato');
        return false;
      }

      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          message,
          ...options
        })
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('❌ Errore invio notifica:', err);
        return false;
      }

      const result = await response.json();
      console.log('✅ Notifica inviata a', result.sent, 'dispositivi');
      return true;
    } catch (err) {
      console.error('❌ Errore sendNotification:', err);
      return false;
    }
  }
};

window.PushManager = PushManager;

// Auto-init quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded');
    PushManager.init();
  });
} else {
  console.log('📄 DOM già pronto');
  PushManager.init();
}