const PushManager = {
  APP_ID: 'e631ad4f-de2c-4747-83fa-34da6f85b8e0',
  EDGE_FUNCTION_URL: null, // verrà impostato in init()

  async init() {
    // Imposta l'URL dell'Edge Function
    const supabaseUrl = typeof SUPABASE_URL !== 'undefined' 
      ? SUPABASE_URL 
      : 'https://ydcxrzdlmrprvhefnctj.supabase.co'; // sostituisci con il tuo project URL
    
    this.EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/send-push-notification`;

    if (!window.OneSignalDeferred) {
      console.warn('OneSignal non disponibile');
      return;
    }

    window.OneSignalDeferred.push(async (OneSignal) => {
      OneSignal.Notifications.addEventListener('subscriptionChange', (isSubscribed) => {
        if (isSubscribed) {
          this.saveSubscription();
        } else {
          this.deleteSubscription();
        }
      });

      const permission = await OneSignal.Notifications.getPermissionAsync();
      if (permission.state === 'granted') {
        await this.saveSubscription();
      }
    });
  },

  async saveSubscription() {
    try {
      const OneSignal = window.OneSignal;
      if (!OneSignal) return;

      const userId = await OneSignal.User.PushSubscription.getId();
      const optIn = await OneSignal.User.PushSubscription.getOptedIn();

      if (!userId || !optIn) return;

      const { data: { user } } = await db.auth.getUser();
      if (!user) return;

      const ua = navigator.userAgent;
      let deviceType = 'Web';
      if (/android/i.test(ua)) deviceType = 'Android';
      else if (/iphone|ipad|ipod/i.test(ua)) deviceType = 'iOS';

      const { error } = await db
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          onesignal_player_id: userId,
          device_type: deviceType
        }, {
          onConflict: 'onesignal_player_id'
        });

      if (error) {
        console.error('Errore salvataggio subscription:', error);
      } else {
        console.log('✅ Subscription salvata:', userId);
      }
    } catch (err) {
      console.error('Errore saveSubscription:', err);
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
        console.error('Errore eliminazione subscription:', error);
      } else {
        console.log('🗑️ Subscription eliminata');
      }
    } catch (err) {
      console.error('Errore deleteSubscription:', err);
    }
  },

  // Invia notifica tramite Edge Function
  async sendNotification(title, message, options = {}) {
    try {
      const { data: { session } } = await db.auth.getSession();
      if (!session) {
        console.error('Utente non autenticato');
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
        console.error('Errore invio notifica:', err);
        return false;
      }

      const result = await response.json();
      console.log('✅ Notifica inviata a', result.sent, 'dispositivi');
      return true;
    } catch (err) {
      console.error('Errore sendNotification:', err);
      return false;
    }
  }
};

window.PushManager = PushManager;

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PushManager.init());
} else {
  PushManager.init();
}