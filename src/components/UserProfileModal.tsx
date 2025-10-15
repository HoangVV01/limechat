"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Image from 'next/image';
import { X, Camera, User } from "lucide-react";

type UserProfileData = {
  username: string;
  avatarUrl: string | null;
};

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<UserProfileData>;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  initialData = {},
}: UserProfileModalProps) {
  const [formData, setFormData] = useState<UserProfileData>({
    username: "",
    avatarUrl: null,
  });

  useEffect(() => {
    setFormData({
      username: initialData.username || "",
      avatarUrl: initialData.avatarUrl || null,
    });
  }, [initialData]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageUrl = ev.target?.result as string;
      setFormData((prev) => ({ ...prev, avatarUrl: imageUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Profile updated:", formData);
    onClose();
  };

  const handleCancel = () => {
    // Reset form to initial data
    setFormData({
      username: initialData.username || "",
      avatarUrl: initialData.avatarUrl || null,
    });
    onClose();
  };

  const handleRemoveAvatar = () =>
    setFormData((prev) => ({ ...prev, avatarUrl: null }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Avatar */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-lg">
                {formData.avatarUrl ? (
                  <Image
                    fill
                    src={formData.avatarUrl}
                    alt="Avatar preview"
                  />
                ) : (
                  <User size={32} className="text-gray-400" />
                )}
              </div>

              {/* Upload overlay */}
              <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-500 p-2 text-white shadow-lg transition-colors hover:bg-blue-600">
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <label className="cursor-pointer rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200">
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {formData.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="rounded-md px-4 py-2 text-sm text-red-500 transition-colors hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="mb-6">
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="Enter your username"
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Avatar URL */}
          <div className="mb-6">
            <label
              htmlFor="avatarUrl"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Avatar URL (optional)
            </label>
            <input
              type="url"
              id="avatarUrl"
              name="avatarUrl"
              value={formData.avatarUrl || ""}
              onChange={handleInputChange}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
