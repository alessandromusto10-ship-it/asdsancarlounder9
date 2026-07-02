// UPSERT: Se esiste già, AGGIORNA invece di cancellare
await db.from('push_subscriptions').upsert({
  user_id: user.id,
  onesignal_player_id: userId,
  device_type: deviceType
}, {
  onConflict: 'onesignal_player_id',
  ignoreDuplicates: false
});