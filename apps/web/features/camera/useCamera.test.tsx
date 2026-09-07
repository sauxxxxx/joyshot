import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCamera } from "./useCamera";

function installCameraMock() {
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
  const track = { getSettings: () => ({ deviceId: "front-camera" }), stop: vi.fn() };
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
  const getUserMedia = vi.fn().mockResolvedValue(stream);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      enumerateDevices: vi.fn().mockResolvedValue([{ deviceId: "front-camera", kind: "videoinput", label: "Front camera" }]),
      getUserMedia,
    },
  });
  return { getUserMedia, stream, track };
}

describe("useCamera automatic start", () => {
  afterEach(() => vi.restoreAllMocks());

  it("requests the camera on mount when autoStart is enabled", async () => {
    const { getUserMedia, stream, track } = installCameraMock();
    const { result, unmount } = renderHook(() => useCamera({ autoStart: true }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(result.current.stream).toBe(stream);

    act(() => unmount());
    expect(track.stop).toHaveBeenCalled();
  });

  it("does not request access when automatic start is disabled", () => {
    const { getUserMedia } = installCameraMock();
    const { result } = renderHook(() => useCamera());

    expect(result.current.status).toBe("idle");
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("stops a late permission response after the booth unmounts", async () => {
    const { getUserMedia, stream, track } = installCameraMock();
    let resolve!: (stream: MediaStream) => void;
    getUserMedia.mockReturnValue(new Promise<MediaStream>(done => { resolve = done; }));
    const { unmount } = renderHook(() => useCamera({ autoStart: true }));
    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => { resolve(stream); });
    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it("keeps a working camera when device enumeration fails", async () => {
    installCameraMock();
    vi.mocked(navigator.mediaDevices.enumerateDevices).mockRejectedValue(new Error("Unavailable"));
    const { result } = renderHook(() => useCamera({ autoStart: true }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.error).toBeNull();
  });
});
