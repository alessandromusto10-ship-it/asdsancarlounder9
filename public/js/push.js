// ===== GESTIONE NOTIFICHE PUSH CON ONESIGNAL =====
const PushManager = {
  APP_ID: 'e631ad4f-de2c-4747-83fa-34da6f85b8e0',
  currentUserId: null,
  oneSignalLoaded: false,
  serviceWorkerRegistered: false,

  async init() {
    console.log('🔔 PushManager: init()');

    // ✅ STEP 1: Registra SUBITO il Service Worker (funziona su iOS e Android)
    if ('serviceWorker' in navigator && !this.serviceWorkerRegistered) {
      try {
        const registration = await navigator.serviceWorker.register('/OneSignalSDKWorker.js', {
          scope: '/'
        });
        this.serviceWorkerRegistered = true;
        console.log('✅ Service Worker registrato:', registration.scope);
      } catch (err) {
        console.error('❌ Errore registrazione Service Worker:', err);
      }
    }

    // ✅ STEP 2: Monitora il login
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
      await OneSignal.init({ 
        appId: PushManager.APP_ID,
        allowLocalhostAsSecureOrigin: true
      });
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

  async checkAndSave() {
    const OneSignal = window.OneSignal;
    if (!OneSignal) {
      console.warn('⚠️ OneSignal non disponibile in checkAndSave');
      return;
    }

    const perm = OneSignal.Notifications.permission;
    console.log('📋 Current permission:', perm);

    // ✅ Rileva se siamo su iOS PWA
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone || 
                         window.matchMedia('(display-mode: standalone)').matches;
    const isIOSPWA = isIOS && isStandalone;

    console.log('📱 iOS PWA rilevato:', isIOSPWA);

    if (perm === 'granted' || perm === true) {
      console.log('✅ Permesso già concesso, salvo subscription');
      setTimeout(() => this.saveSubscription(), 2000);
    } else if (perm === 'default') {
      // ✅ SOLO SU iOS PWA: Chiedi esplicitamente il permesso
      // Su Android, OneSignal mostra il popup automaticamente
      if (isIOSPWA) {
        console.log('⏳ iOS PWA: Permesso non ancora richiesto, lo chiedo ora...');
        try {
          const result = await OneSignal.Notifications.requestPermission();
          console.log('📋 Risultato richiesta permesso:', result);
          if (result) {
            setTimeout(() => this.saveSubscription(), 3000);
          }
        } catch (err) {
          console.error('❌ Errore richiesta permesso:', err);
        }
      } else {
        console.log('⏳ Android/Web: Aspetto che OneSignal mostri il popup automaticamente');
      }
    } else if (perm === 'denied') {
      console.warn('⚠️ Permesso notifiche RIFIUTATO');
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

      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        console.warn('⚠️ Utente non loggato');
        return;
      }

      // ✅ RETRY LOOP: Su iOS il subscription ID può arrivare con ritardo
      const maxRetries = 10;
      let userId = null;
      let optIn = false;

      for (let i = 1; i <= maxRetries; i++) {
        userId = OneSignal.User?.PushSubscription?.id;
        optIn = OneSignal.User?.PushSubscription?.optedIn;
        
        console.log(`🔄 Tentativo ${i}/${maxRetries} - User ID:`, userId, '- Opt-in:', optIn);

        if (userId && optIn) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      if (!userId) {
        console.error('❌ Dopo 10 tentativi, userId ancora non disponibile');
        return;
      }

      if (!optIn) {
        console.warn('⚠️ Opt-in false');
        return;
      }

      console.log('👤 User ID Supabase:', user.id);
      const ua = navigator.userAgent;
      let deviceType = 'Web';
      if (/iphone|ipad|ipod/i.test(ua)) deviceType = 'iOS';
      else if (/android/i.test(ua)) deviceType = 'Android';
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
        console.log('✅ Dati salvati:', data);
      }
    } catch (err) {
      console.error('❌ Errore saveSubscription:', err);
    }
  },

  async sendNotification(title, message, options = {}) {
    try {
      console.log('📤 Invio notifica push...');
      const { data: { session } } = await db.auth.getSession();
      if (!session) {
        console.error('❌ Utente non autenticato');
        return false;
      }
      const supabaseUrl = 'https://ydcxrzdlmrprvhefnctj.supabase.co';
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-push-notification`;
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
      const responseText = await response.text();
      if (!responseText) throw new Error('Edge Function non ha risposto');
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Risposta non valida dall\'Edge Function');
      }
      if (!response.ok) throw new Error(result.error || 'Errore invio notifica');
      console.log('✅ Notifica inviata con successo:', result);
      return true;
    } catch (err) {
      console.error('❌ Errore sendNotification:', err);
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