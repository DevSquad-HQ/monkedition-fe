import React, { useEffect, useState } from "react";
import { toLocalMobile } from "../utils/phone";
import { useAuth } from "../context/NewAuthContext";
import Orders from "./Orders";
import { Title } from "../components/Title";
import { Pencil, PencilOff, Loader2 } from "lucide-react";
import ProfileInputTile from "../components/ProfileInputTile";
import { assets } from "../assets/assets";

const Profile = () => {
  const { user, isLoading, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
    address: {
      country: "",
      state: "",
      city: "",
      street: "",
      pincode: "",
      doorNo: "",
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: toLocalMobile(user.phone),
        avatar: user.avatar || "",
        address: {
          country: user.address?.country || "",
          state: user.address?.state || "",
          city: user.address?.city || "",
          street: user.address?.street || "",
          pincode: user.address?.pincode || "",
          doorNo: user.address?.doorNo || "",
        },
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      setError("First name and last name are required");
      return false;
    }

    if (formData.avatar && !isValidUrl(formData.avatar)) {
      setError("Please enter a valid avatar URL");
      return false;
    }

    return true;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    try {
      setUpdateLoading(true);

      // Prepare update payload
      const updatePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        avatar: formData.avatar,
        phone: formData.phone,
        address: {
          country: formData.address.country,
          state: formData.address.state,
          city: formData.address.city,
          street: formData.address.street,
          pincode: formData.address.pincode,
          doorNo: formData.address.doorNo,
        },
      };
      await updateUser(updatePayload);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Profile update error:", error);
      if (error.message.includes("Session expired")) {
        setError("Your session has expired. Please log in again.");
        setTimeout(() => logout(), 2000);
      } else {
        setError(
          error.message || "Failed to update profile. Please try again."
        );
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
          <p className="text-red-700 text-sm">Please Log In to View Profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex md:flex-row flex-col gap-5 px-5">
      <div className="flex-1 bg-white shadow rounded-lg p-6 mb-5 sm:m-0 border border-gray-100">
        {/* Profile Header */}
        <div className="flex justify-between items-center text-2xl mb-6">
          <Title text1="MY" text2="PROFILE" />

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-full bg-orange-300 p-3 hover:bg-orange-400 transition-colors"
            disabled={updateLoading}
          >
            {updateLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !isEditing ? (
              <Pencil className="text-black" size={15} />
            ) : (
              <PencilOff className="text-black" size={15} />
            )}
          </button>
        </div>

        {error && (
          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="border-l-4 border-green-200 bg-green-50 p-4 rounded">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative">
              <img
                src={formData.avatar || assets.DefaultUser}
                alt="Profile"
                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                onError={(e) => {
                  e.target.src = assets.DefaultUser;
                }}
              />
            </div>

            <div className="flex flex-col-reverse md:flex-col w-full gap-2">
              <div className="flex gap-5 justify-center items-center w-full">
                <ProfileInputTile
                  isDisable={isEditing}
                  title="First Name"
                  name="firstName"
                  value={formData.firstName}
                  handleInputChange={handleInputChange}
                  required
                />
                <ProfileInputTile
                  isDisable={isEditing}
                  title="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  handleInputChange={handleInputChange}
                  required
                />
              </div>
              {isEditing && (
                <ProfileInputTile
                  isDisable={isEditing}
                  title="Avatar URL"
                  name="avatar"
                  value={formData.avatar}
                  handleInputChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                />
              )}
            </div>
          </div>

          {/* Read-only Fields */}
          <ProfileInputTile
            isDisable={false}
            title="Email"
            name="email"
            value={formData.email}
            handleInputChange={() => {}}
            readOnly
          />
          <ProfileInputTile
            isDisable={isEditing}
            title="Phone Number"
            name="phone"
            value={formData.phone}
            handleInputChange={handleInputChange}
            placeholder="+91 9999999999"
          />

          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Country", name: "address.country" },
              { title: "State", name: "address.state" },
              { title: "City", name: "address.city" },
              { title: "Street", name: "address.street" },
              { title: "Zip Code", name: "address.pincode" },
              { title: "Door No.", name: "address.doorNo" },
            ].map((field) => (
              <ProfileInputTile
                key={field.name}
                isDisable={isEditing}
                title={field.title}
                name={field.name}
                value={field.name
                  .split(".")
                  .reduce((obj, key) => obj?.[key] ?? "", formData)}
                handleInputChange={handleInputChange}
              />
            ))}
          </div>

          {isEditing && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-orange-300 text-black rounded hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="flex-1 border border-gray-100 shadow-md rounded-md h-[60vh] overflow-y-scroll">
        <Orders />
      </div>
    </div>
  );
};

export default Profile;
