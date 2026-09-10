import api from "./api";

export const getProfile = async () => {
  const response = await api.get("/profile/");
  return response.data;
};

export const createProfile = async (profile) => {
  const response = await api.post("/profile/", profile);
  return response.data;
};

export const updateProfile = async (profile) => {
  const response = await api.put("/profile/", profile);
  return response.data;
};
