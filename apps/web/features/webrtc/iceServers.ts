interface IceServerConfig {
  stunUrl?: string;
  turnCredential?: string;
  turnUrl?: string;
  turnUsername?: string;
}

export function createIceServers({
  stunUrl,
  turnCredential,
  turnUrl,
  turnUsername,
}: IceServerConfig): RTCIceServer[] {
  const iceServers: RTCIceServer[] = [{
    urls: stunUrl ?? "stun:stun.l.google.com:19302",
  }];
  const turnUrls = turnUrl?.split(",").map((url) => url.trim()).filter(Boolean);

  if (turnUrls?.length && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return iceServers;
}

export function getConfiguredIceServers() {
  return createIceServers({
    stunUrl: process.env.NEXT_PUBLIC_STUN_URL,
    turnUrl: process.env.NEXT_PUBLIC_TURN_URL,
    turnUsername: process.env.NEXT_PUBLIC_TURN_USERNAME,
    turnCredential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
  });
}
