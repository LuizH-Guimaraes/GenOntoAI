"use client";

import { useSession } from "@/app/context/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user, loading } = useSession();
  const [key, setKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    } else if (user) {
      fetch("/api/keys")
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          setSavedKey(data.key || "");
          setCreatedAt(data.createdAt || null);
        });
    }
  }, [user, loading]);

  const handleSave = async () => {
    if (!key.trim()) return;
    setSaving(true);
    await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setSavedKey(key);
    setCreatedAt(new Date().toISOString());
    setSaving(false);
    setKey("");
  };

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  const displayKey = savedKey ? `************${savedKey.slice(-4)}` : "Not set";

  if (loading || !user) return null;

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">User Profile</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="bg-white shadow rounded p-6 space-y-4">
        <div>
          <span className="font-semibold">Email:</span> {user.email}
        </div>

        <div>
          <span className="font-semibold">ChatGPT Key:</span>{" "}
          <code className="bg-gray-100 p-1 rounded">{displayKey}</code>
          {createdAt && (
            <div className="text-sm text-gray-500 mt-1">
              Last updated: {new Date(createdAt).toLocaleString()}
            </div>
          )}
        </div>

        <div className="pt-4 items-center flex flex-col">
          <label className="block font-medium mb-1 w-full">
            Update your key:
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-..."
            className="w-full border px-3 py-2 rounded mb-2"
          />
          <button
            onClick={handleSave}
            className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Key"}
          </button>
        </div>
      </div>
    </div>
  );
}
