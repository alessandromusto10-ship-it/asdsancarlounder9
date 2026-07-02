// ===== GESTIONE NOTIFICHE PUSH CON ONESIGNAL SDK v16 =====
const PushManager = {
  APP_ID: 'e631ad4f-de2c-4747-83fa-34da6f85b8e0',

  async init() {
    console.log('🔔 PushManager: init...');
    
    if (!window.OneSignal) {
      console.warn('⚠️ OneSignal non disponibile');
      return;
    }

    const OneSignal = window.OneSignal;

    // ✅ SDK v16: i metodi sono PROPRIETÀ, non funzioni
    console.log('📋 PushSubscription.id:', OneSignal.User?.PushSubscription?.id);
    console.log('📋 PushSubscription.optedIn:', OneSignal.User?.PushSubscription?.optedIn);
    console.log('📋 Notifications.permission:', OneSignal.Notifications?.permission);

    // ✅ Ascolta quando cambia la subscription
    OneSignal.Notifications.addEventListener('subscriptionChange', (isSubscribed) => {
      console.log('🔔 subscriptionChange:', isSubscribed);
      if (isSubscribed) {
        setTimeout(() => this.saveSubscription(), 1500);
      }
    });

    // ✅ Ascolta quando cambia il permesso
    OneSignal.Notifications.addEventListener('permissionChange', (permission) => {
      console.log('🔔 permissionChange:', permission);
      if (permission === 'granted') {
        setTimeout(() => this.saveSubscription(), 1500);
      }
    });

    // ✅ Se già concesso, salva subito
    if (OneSignal.Notifications.permission === 'granted') {
      console.log('✅ Permesso già concesso, salvo subscription');
      setTimeout(() => this.saveSubscription(), 1500);
    }
  },

  async saveSubscription() {
    try {
      console.log('💾 Salvataggio subscription...');
      
      const OneSignal = window.OneSignal;
      if (!OneSignal) {
        console.error('❌ OneSignal non disponibile');
        return;
      }

      // ✅ SDK v16: sono PROPRIETÀ, non metodi
      const userId = OneSignal.User.PushSubscription.id;
      const optIn = OneSignal.User.PushSubscription.optedIn;

      console.log('📋 OneSignal User ID:', userId);
      console.log('📋 Opt-in status:', optIn);

      if (!userId) {
        console.warn('⚠️ Nessun userId disponibile');
        return;
      }

      if (!optIn) {
        console.warn('⚠️ Opt-in false');
        return;
      }

      // Verifica che l'utente sia loggato
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        console.warn('⚠️ Utente non loggato');
        return;
      }

      console.log('👤 User ID Supabase:', user.id);

      // Rileva dispositivo
      const ua = navigator.userAgent;
      let deviceType = 'Web';
      if (/android/i.test(ua)) deviceType = 'Android';
      else if (/iphone|ipad|ipod/i.test(ua)) deviceType = 'iOS';

      console.log('📱 Device type:', deviceType);

      // Salva nel database
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

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PushManager.init());
} else {
  PushManager.init();
}