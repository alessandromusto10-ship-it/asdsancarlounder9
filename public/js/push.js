// ===== GESTIONE NOTIFICHE PUSH CON ONESIGNAL =====
const PushManager = {
  APP_ID: 'e631ad4f-de2c-4747-83fa-34da6f85b8e0',

  async init() {
    console.log('🔔 PushManager: Inizializzazione...');
    
    if (!window.OneSignalDeferred) {
      console.warn('⚠️ OneSignal non disponibile');
      return;
    }

    window.OneSignalDeferred.push(async (OneSignal) => {
      console.log('✅ OneSignal caricato');
      
      // ✅ CORRETTO: Ascolta quando l'utente accetta le notifiche
      OneSignal.Notifications.addEventListener('subscriptionChange', (isSubscribed) => {
        console.log('🔔 Subscription change:', isSubscribed);
        if (isSubscribed) {
          setTimeout(() => this.saveSubscription(), 1000);
        }
      });

      // ✅ CORRETTO: Controlla se già sottoscritto
      try {
        // OneSignal SDK v16: usa getPermissionAsync() o la proprietà permission
        const permission = await OneSignal.Notifications.getPermissionAsync();
        console.log('🔔 Permesso notifiche:', permission);
        
        if (permission === 'granted' || permission === true) {
          console.log('✅ Permesso già concesso, salvo subscription');
          setTimeout(() => this.saveSubscription(), 2000);
        }
      } catch (err) {
        console.error('❌ Errore nel controllo permessi:', err);
        // Fallback: prova con la proprietà permission
        try {
          const permission = OneSignal.Notifications.permission;
          console.log('🔔 Permesso (fallback):', permission);
          if (permission === 'granted') {
            setTimeout(() => this.saveSubscription(), 2000);
          }
        } catch (err2) {
          console.error('❌ Errore anche nel fallback:', err2);
        }
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

      // ✅ CORRETTO: OneSignal SDK v16 usa metodi asincroni
      const userId = await OneSignal.User.PushSubscription.getIdAsync();
      const token = await OneSignal.User.PushSubscription.getTokenAsync();
      const optIn = await OneSignal.User.PushSubscription.getOptedInAsync();

      console.log('📋 OneSignal User ID:', userId);
      console.log('📋 Token:', token);
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
  }
};

window.PushManager = PushManager;

// Auto-init quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PushManager.init());
} else {
  PushManager.init();
}