import api from "./axios";


// -------------------------
// Get Current Profile
// -------------------------
export const getProfile = async () => {
  const response = await api.get("/profile/");
  return response.data;
};


// -------------------------
// Update Current Profile
// -------------------------
export const updateProfile = async (data) => {
  const response = await api.put(
    "/profile/",
    data
  );

  return response.data;
};


// -------------------------
// Upload Profile Image
// -------------------------
export const uploadProfileImage = async (
  file
) => {

  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  const response = await api.post(
    "/profile/upload-image",
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
};