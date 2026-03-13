import webpush from 'web-push';

let initialized = false;

function getWebPush() {
  if (!initialized) {
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (pub && priv) {
      webpush.setVapidDetails('mailto:mystationlive@gmail.com', pub, priv);
    }
    initialized = true;
  }
  return webpush;
}

export { getWebPush };
export const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
