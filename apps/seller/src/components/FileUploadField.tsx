"use client";

import { useRef, useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseAuth, firebaseStorage } from "@/lib/firebaseClient";

// Storage path is {folder}/{uid}/{timestamp}-{filename} — the uid segment
// is what the Storage security rules key off of (a seller can only write
// under their own uid), and doubles as tidy per-seller organization.
export default function FileUploadField({
  folder,
  value,
  onChange,
  accept = "image/*",
  label = "Upload a file",
}: {
  folder: "product-images" | "kyc-documents";
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) {
      setError("You must be signed in to upload.");
      return;
    }
    setError(null);
    setProgress(0);
    const path = `${folder}/${uid}/${Date.now()}-${file.name}`;
    const storageRef = ref(firebaseStorage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snapshot) => setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      () => {
        setError("Upload failed. Please try again.");
        setProgress(null);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onChange(url);
        setProgress(null);
      },
    );
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--success-light)] p-2.5">
          {accept.startsWith("image") ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary Storage download URLs, not part of the Next Image optimization pipeline
            <img src={value} alt="" className="h-12 w-12 rounded-md object-cover" />
          ) : (
            <a href={value} target="_blank" rel="noreferrer" className="text-sm text-brand-teal hover:underline">
              View uploaded file
            </a>
          )}
          <button type="button" onClick={() => onChange("")} className="ml-auto text-xs text-slate-500 hover:text-red-600">
            Remove
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={progress !== null}
            className="w-full rounded-lg border border-dashed border-[var(--border-strong)] py-3 text-sm text-slate-600 transition-colors hover:border-brand-teal hover:bg-brand-teal/5 hover:text-brand-teal disabled:opacity-50"
          >
            <span aria-hidden className="mr-1.5">📎</span>
            {progress !== null ? `Uploading... ${progress}%` : label}
          </button>
          {progress !== null && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full bg-brand-teal transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
