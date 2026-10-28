import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useGoBack from "../../components/useGoBack.js";
import { useAccount } from "../../components/AccountContext.js";

const FIELDS = ["username", "email", "dateOfBirth", "meterSerialNumber", "houseAddress", "meterType"];
const EMPTY = Object.fromEntries(FIELDS.map((f) => [f, ""]));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // before resizing
const PHOTO_SIZE = 256;

let roomKey = 0;
const newRoom = () => ({ key: ++roomKey, room: "", email: "", meter: "" });
const METER = /^[A-Za-z0-9 -]{1,40}$/; // same rule as the server (utils/meters.js)
// Meter numbers match ignoring spaces, letter case and leading zeros, as on the server
const meterKey = (m) => String(m || "").replace(/\s+/g, "").toUpperCase().replace(/^0+(?=.)/, "");

// Crop the picked photo to a centred square and shrink it to 256px, returned as a JPEG data URL
function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = PHOTO_SIZE;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#1a1a1a"; // background for transparent PNGs
      ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    img.src = url;
  });
}

// Where each account type loads and saves its profile. roomsUrl: null hides the Rooms section.
export const LANDLORD_PROFILE = {
  profileUrl: "/api/getProfileLandlord",
  updateUrl: "/api/updateLandlord",
  avatarUrl: "/api/landlordAvatar",
  roomsUrl: "/api/rooms",
  settingsPath: "/Landlord/Settings",
};
export const PRIVATE_USER_PROFILE = {
  profileUrl: "/api/getProfile",
  updateUrl: "/api/updateTenant",
  avatarUrl: "/api/tenantAvatar",
  roomsUrl: null,
  settingsPath: "/tenant/settings",
};

export default function useAccountEditProfile(config = LANDLORD_PROFILE) {
  const goBack = useGoBack(settingsPath); // previous WatCal page, or Settings
  const { account, updateAccount } = useAccount();
  const { profileUrl, updateUrl, avatarUrl, roomsUrl, settingsPath } = config;

  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);       // last saved values, to know what changed
  const [rooms, setRooms] = useState([]);          // existing rooms
  const [newRooms, setNewRooms] = useState([]);    // rooms added on this page, not saved yet
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);    // { type: "ok" | "error", text }
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [profileRes, roomsRes] = await Promise.all([fetch(profileUrl), roomsUrl ? fetch(roomsUrl) : null]);
      if (!profileRes.ok || (roomsRes && !roomsRes.ok)) throw new Error("Request failed");
      const profile = await profileRes.json();
      const values = Object.fromEntries(FIELDS.map((f) => [f, profile[f] ?? ""]));
      setForm(values);
      setSaved(values);
      setRooms(roomsRes ? await roomsRes.json() : []);
      setStatus("ok");
    } catch (error) {
      console.error("Error fetching profile:", error);
      setStatus("error");
    }
  }, [profileUrl, roomsUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(
    () => newRooms.length > 0 || FIELDS.some((f) => String(form[f]).trim() !== String(saved[f]).trim()),
    [form, saved, newRooms]
  );

  const setField = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
    setMessage(null);
  };

  const addRoom = () => setNewRooms((list) => [...list, newRoom()]);
  const removeRoom = (key) => setNewRooms((list) => list.filter((r) => r.key !== key));
  const setRoom = (key, field) => (e) => {
    const value = e.target.value;
    setNewRooms((list) => list.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
    setErrors((er) => ({ ...er, [`room-${key}`]: undefined }));
    setMessage(null);
  };

  const validate = () => {
    const next = {};
    if (!form.username.trim()) next.username = "Enter a username.";
    if (!EMAIL.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (!form.dateOfBirth) next.dateOfBirth = "Enter your date of birth.";

    const names = new Set(rooms.map((r) => r.roomNumber.toLowerCase()));
    // Meters already used by your rooms (the server also checks other landlords and private users)
    const meters = new Map(rooms.filter((r) => r.meterId).map((r) => [meterKey(r.meterId), r.roomNumber]));
    for (const r of newRooms) {
      const name = r.room.trim();
      const meter = r.meter.trim();
      if (!name || !EMAIL.test(r.email.trim())) next[`room-${r.key}`] = "Enter a room name and a valid tenant email.";
      else if (names.has(name.toLowerCase())) next[`room-${r.key}`] = `You already have a room called "${name}".`;
      else if (meter && !METER.test(meter)) next[`room-${r.key}`] = "A meter number can only contain letters, digits, spaces and dashes.";
      else if (meter && meters.has(meterKey(meter))) next[`room-${r.key}`] = `${meters.get(meterKey(meter))} already uses this meter number.`;
      names.add(name.toLowerCase());
      if (meter) meters.set(meterKey(meter), name || "Another new room");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setMessage({ type: "error", text: "Please fix the highlighted fields." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const body = Object.fromEntries(FIELDS.map((f) => [f, String(form[f]).trim()]));
      const response = await fetch(updateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomsUrl ? { ...body, roomsData: newRooms.map((r) => ({ room: r.room.trim(), email: r.email.trim(), meter: r.meter.trim() })) } : body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.msg || "Could not save your changes.");

      setForm(body);
      setSaved(body);
      setNewRooms([]);
      updateAccount({ username: body.username, email: body.email });
      const added = data.addedRooms || 0;
      setMessage({ type: "ok", text: added ? `Profile saved and ${added} room${added === 1 ? "" : "s"} added.` : "Profile saved." });
      if (added) {
        const roomsRes = await fetch(roomsUrl);
        if (roomsRes.ok) setRooms(await roomsRes.json());
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message === "Failed to fetch" ? "Cannot reach the server. Please try again." : error.message });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setForm(saved);
    setNewRooms([]);
    setErrors({});
    setMessage(null);
  };

  const sendPhoto = async (avatar) => {
    setPhotoBusy(true);
    setMessage(null);
    try {
      const response = await fetch(avatarUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.msg || "Could not update your photo.");
      updateAccount({ avatar: data.avatar || undefined });
      setMessage({ type: "ok", text: data.msg });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setPhotoBusy(false);
    }
  };

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setMessage({ type: "error", text: "Choose a JPG, PNG or WebP image." });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setMessage({ type: "error", text: "Choose an image smaller than 10 MB." });
      return;
    }
    try {
      await sendPhoto(await resizePhoto(file));
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  return {
    status, form, rooms, newRooms, errors, message, saving, photoBusy, dirty, fileRef,
    avatar: account?.avatar,
    username: account?.username,
    withRooms: !!roomsUrl,
    reload: load,
    setField, addRoom, removeRoom, setRoom, save, discard,
    choosePhoto: () => fileRef.current?.click(),
    pickPhoto,
    removePhoto: () => sendPhoto(null),
    goBack,
  };
}
