// ===== GESTIONE NOTIFICHE PUSH CON ONESIGNAL =====
const PushManager = {
  APP_ID: 'e631ad4f-de2c-4747-83fa-34da6f85b8e0',
  initialized: false,

  async init() {
    const checkAuth = async () => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        console.log('⏳ PushManager: aspetto login...');
        setTimeout(checkAuth, 500);
        return;
      }

      if (this.initialized) return;
      this.initialized = true;
      
      console.log('✅ PushManager: utente loggato, inizializzo OneSignal...');

      if (!window.OneSignalDeferred) {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        
        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.async = true;
        document.head.appendChild(script);
        
        console.log('📥 Caricamento script OneSignal...');
      }

      window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.init({
          appId: PushManager.APP_ID,
        });

        console.log('✅ OneSignal inizializzato');

        // ✅ CORRETTO: Ascolta quando cambia la subscription
        OneSignal.Notifications.addEventListener('subscriptionChange', (isSubscribed) => {
          console.log('🔔 subscriptionChange:', isSubscribed);
          if (isSubscribed) {
            // Aspetta 2 secondi che OneSignal generi l'ID
            setTimeout(() => PushManager.saveSubscription(), 2000);
          }
        });

        // ✅ CORRETTO: Ascolta quando cambia il permesso
        OneSignal.Notifications.addEventListener('permissionChange', (permission) => {
          console.log('🔔 permissionChange:', permission);
          if (permission === 'granted' || permission === true) {
            // Aspetta 2 secondi che OneSignal generi l'ID
            setTimeout(() => PushManager.saveSubscription(), 2000);
          }
        });

        // ✅ CORRETTO: Usa la proprietà .permission, NON il metodo getPermission()
        const perm = OneSignal.Notifications.permission;
        console.log('📋 Current permission:', perm);
        
        if (perm === 'granted' || perm === true) {
          console.log('✅ Permesso già concesso, aspetto ID...');
          // Aspetta che OneSignal generi l'ID
          setTimeout(() => PushManager.saveSubscription(), 2000);
        }
      });
    };

    checkAuth();
  },

  async saveSubscription() {
    try {
      console.log('💾 Salvataggio subscription...');
      
      const OneSignal = window.OneSignal;
      if (!OneSignal) {
        console.error('❌ OneSignal non disponibile');
        return;
      }

      // ✅ CORRETTO: OneSignal SDK v16 usa PROPRIETÀ, non metodi
      const userId = OneSignal.User.PushSubscription.id;
      const optIn = OneSignal.User.PushSubscription.optedIn;

      console.log('📋 OneSignal User ID:', userId);
      console.log('📋 Opt-in status:', optIn);

      if (!userId) {
        console.warn('⚠️ Nessun userId disponibile, aspetto...');
        // Riprova dopo 1 secondo
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
          onConflict: 'onesignal_player_id'
        })
        .select();

      if (error) {
        console.error('❌ Errore DB:', error);
      } else {
        console.log('✅ Subscription salvata!', data);
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